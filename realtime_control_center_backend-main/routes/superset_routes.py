from flask import  request, jsonify, Blueprint
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from .db import get_engine
from sqlalchemy import text
import json
from mysql.connector import Error as MySQLError
import requests

superset_bp = Blueprint('superset', __name__) # connection blueprint...

# Constants
SUPERSET_URL = "http://192.168.29.18:28088"
LOGIN_API_URL = f"{SUPERSET_URL}/api/v1/security/login"
CSRF_TOKEN_API_URL = f"{SUPERSET_URL}/api/v1/security/csrf_token"
SUPERSET_DB_API_URL = f"{SUPERSET_URL}/api/v1/database"
TEST_CONNECTION_API_URL = f"{SUPERSET_DB_API_URL}/test_connection"
RESOURCE_PREFIX = "org1dev"

# Credentials
username = "admin"
password = "admin"

# Start a session to maintain context
session = requests.Session()
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

@superset_bp.route("/connect_superset", methods=["POST"])
def connect_superset():
    try:
        dest_id = request.get_json()
        #  it fetch the resource prefix from pinot other
        resource_prefix = fetch_resource_prefix(dest_id)

        if not resource_prefix:
            return jsonify({"success": False, "message": "Something went wrong"}), 400
        
         # Generate the dynamic database details
        database_name = f"pinot_{resource_prefix}"
        sqlalchemy_uri = "pinot://pinot-broker:8099/query/sql?controller=http://pinot-controller:9000/"
        extra = {
            "allows_virtual_table_explore": True,
            "engine_params": {"connect_args": {"use_multistage_engine": "true"}},
        }
        db_connection_payload = {
            "sqlalchemy_uri": sqlalchemy_uri,
            "database_name": database_name,
            "extra": json.dumps(extra),
            "masked_encrypted_extra": "",
        }

        if not get_access_token():
            print("Aborting database creation due to failed login.")
            return jsonify({"success": False, "message": "Login failed."}), 400

        if not get_csrf_token():
            print("Aborting database creation due to failed CSRF token retrieval.")
            return jsonify({"success": False, "message": "Failed to obtain CSRF token."}), 400
        
        if not test_connection(db_connection_payload, database_name):
            return jsonify({"success": False, "message": "Connection test failed."}), 400

        if not create_database(db_connection_payload, database_name):
            return jsonify({"success": False, "message": "Connection creation failed."}), 400
        
        created_superset_destination_id = create_superset_destination_row(dest_id, database_name, resource_prefix)
        if not created_superset_destination_id:
            return jsonify({"success": False, "message": "Superset destination row creation failed."}), 400
        
        if not update_clicked_destination_row(dest_id, created_superset_destination_id):
            return jsonify({"success": False, "message": "Pinot destination id updation failed."}), 400

        # if not test_connection():
        #     print("Aborting database creation due to failed connection test.")
        #     return jsonify({"success": False, "message": "Connection test failed."}), 400

        # create_database()
        return jsonify({"success": True, "message": "Database created successfully in Superset."})

    except Exception as e:
        print("Error inside the connect_superset:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500
    
    
def update_clicked_destination_row(destination_id, created_destination_id):
    try:
        engine = get_engine()
        connection = engine.connect()

        # SQL query to append the new id to the list in destination_ids
        sql = text("""
            UPDATE Destinations
            SET destination_ids = JSON_ARRAY_APPEND(destination_ids, '$', :created_destination_id)
            WHERE id = :destination_id
        """)

        connection.execute(sql, {
            "created_destination_id": created_destination_id,
            "destination_id": destination_id
        })

        connection.commit()
        return True
    except Exception as e:
        print("error inside the update_clicked_destination_row", str(e))
        return False
    finally:
        if connection is not None:
            connection.close()
        if engine is not None:
            engine.dispose()

    
def create_superset_destination_row(destination_id, created_database_name, resource_prefix):
    try:
        # print("destination_row_data11111111111111", destination_row_data)
        destination_type = "SUPERSET"
        connection_details = None
        destination_ids = []
        other_details = {"connected_db_name": created_database_name, "resource_prefix": resource_prefix}
        # print("sucessssssssssssssssssssssssssss", other_details)

        engine = get_engine()
        connection = engine.connect()

        #  fetch the connection id
        sql = text("select conn_id from Destinations where id = :destination_id")

        response = connection.execute(sql, {
            "destination_id": destination_id
        })

        row = response.fetchone()
        conn_id = row[0]


        sql = text("""insert into Destinations (conn_id, destination_type, connection_details, destination_ids, other_details, source_ids) 
                   values (:conn_id, :destination_type, :connection_details, :destination_ids, :other_details, :source_ids  )""")
       
        connection.execute(sql, {
            "conn_id" : conn_id,
            "source_ids" : json.dumps(destination_id),
            "destination_type" : destination_type,
            "connection_details":  json.dumps(connection_details),
            "destination_ids":  json.dumps(destination_ids),
            "other_details":  json.dumps(other_details)
        })

        # Fetch the last inserted ID
        sql = text("SELECT LAST_INSERT_ID()")
        result = connection.execute(sql)
        new_row_id = result.fetchone()[0]

        connection.commit()
        return new_row_id
    except Exception as e:
        print("error inside create_superset_destination_row", e) 
        return False
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 



# this function takes the resiource prefix from other_details of pinot and update the resource prefix for superset connection
def fetch_resource_prefix(destination_id):
    try:
        engine = get_engine()
        connection = engine.connect()

        sql = text("Select other_details from Destinations WHERE id = :destination_id")        
        result = connection.execute(sql, {
            "destination_id" : destination_id
        })
        
        other_details_row = result.fetchone()
        # print("other_details...1111111111111111111111111", other_details_row)
        other_details = json.loads(other_details_row[0])
        RESOURCE_PREFIX = other_details["resource_prefix"]
        
        connection.close()
        engine.dispose()
        # print("RESOURCE_PREFIX333333333333333333333333333", RESOURCE_PREFIX)
        return RESOURCE_PREFIX
    except Exception as e:
        print("error inside the update_resource_prefix1111111111111111", str(e))
        return False
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose()     
    
# Function to log in and get the access token
def get_access_token():
    payload = {
        "username": username,
        "password": password,
        "provider": "db",
        "refresh": True,
    }

    try:
        response = session.post(
            LOGIN_API_URL, headers=headers, data=json.dumps(payload)
        )
        response.raise_for_status()
        access_token = response.json().get("access_token")
        if access_token:
            session.headers.update({"Authorization": f"Bearer {access_token}"})
            print("Successfully obtained access token.")
            return True
        else:
            print("Failed to obtain access token.")
            return False
    except requests.RequestException as e:
        print(f"Failed to login. Error: {e}")
        return False


# Function to get the CSRF token
def get_csrf_token():
    try:
        response = session.get(CSRF_TOKEN_API_URL, headers=headers)
        response.raise_for_status()
        csrf_token = response.json().get("result")
        if csrf_token:
            session.headers.update({"X-CSRFToken": csrf_token})
            print("Successfully obtained CSRF token.")
            return True
        else:
            print("CSRF token not found in the response.")
            return False
    except requests.RequestException as e:
        print(f"Failed to obtain CSRF token. Error: {e}")
        return False


# Function to test the connection to the Pinot database
def test_connection(db_connection_payload, database_name):
    try:
        response = session.post(
            TEST_CONNECTION_API_URL,
            headers=headers,
            data=json.dumps(db_connection_payload),
        )
        response.raise_for_status()
        print(f"Connection test successful for database: {database_name}")
        return True
    except requests.RequestException as e:
        print(f"Connection test failed for database: {database_name}. Error: {e}")
        return False


# Function to create the Pinot database in Superset
def create_database(db_connection_payload, database_name):
    try:
        response = session.post(
            SUPERSET_DB_API_URL, headers=headers, data=json.dumps(db_connection_payload)
        )
        response.raise_for_status()
        print(f"Database '{database_name}' connected successfully in Superset.")
        return True
    except requests.RequestException as e:
        print(f"Failed to connect database '{database_name}' in Superset. Error: {e}")
        return False
