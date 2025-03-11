from flask import  request, jsonify, Blueprint
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from .db import get_engine
from sqlalchemy import text
import json
from mysql.connector import Error as MySQLError
import requests
from .superset_routes import superset_bp


destinations_bp = Blueprint('destinations', __name__) # destinations blueprint...

# Register the Superset blueprint within the destinations blueprint
destinations_bp.register_blueprint(superset_bp, url_prefix='/superset')


# Constants required for pinot schema and table creation
KAFKA_SCHEMA_REGISTRY_URL = "http://192.168.29.18:8081"  # or 8083
PINOT_SCHEMA_REGISTRY_URL = "http://192.168.29.18:9000/schemas"
# SUBJECTS = ["org1dev.inventory.orders-value", "org1dev.inventory.customers-value"]
KAFKA_BROKER_URL = "kafka-broker:29092"
PINOT_TABLE_URL = "http://192.168.29.18:9000/tables"
# PINOT_SCHEMAS = ["org1dev_inventory_orders", "org1dev_inventory_customers"]


@destinations_bp.route("/fetch_destinations", methods=["POST"])
def fetch_destinations():
    try:
        connection_id = request.get_json()
        engine = get_engine()
        connection = engine.connect()
        
        sql = text("""Select * from Destinations WHERE conn_id = :connection_id""")
        result = connection.execute(sql, {
            "connection_id": connection_id
        })

        rows =  result.fetchall()
        list = []

        for row in rows:
            rowObject = {
                "id" : row[0],
                "conn_id": row[1],
                "destination_type" : row[2],
                "connection_details": row[3],
                "dest_ids": row[4],
                "other_details":row[5],
                "created_at":str(row[6]),
                "updated_at": str(row[7]),
                "source_ids":  str(row[8]) 
            }
            list.append(rowObject)
        # print("list111111111", list)

        return jsonify({"success": True, "message": "Successfully fetched", "data":list })
    
    except Exception as e:
        print("error inside fetch_destinations", e)
        return jsonify({"success": False, "message": str(e) }), 500
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 


@destinations_bp.route("/create_pinot_destination", methods=["POST"])
def create_pinot_destination():
    try:
        destination_id = request.get_json()
        # print("create_pinot_destination1111111111111111111111", destination_id)

        # Fetch the topic details array for this destination_id
        kafak_other_details = kafka_other_details(destination_id)
        topic_details = kafak_other_details["topic_details"]
        resource_prefix = kafak_other_details["resource_prefix"]


        table_details = []  # List to hold table details

        # Process each topic to fetch Kafka schema, create Pinot schema, and register Pinot schema
        for topic_object in topic_details:
            topic_name = topic_object["topic_name"]
            subject = topic_object["schema_name"]
            #   for all the scehmas which are created successfully it will return true otherwise it will return false
            schema_created = process_subject(subject, save_schema=True)

            # Update the table_details with the registration status
            table_details.append({
                "table_name": transform_schema_name_to_underscore_format(topic_name),  # Transform Kafka schema name to Pinot schema name
                "table_type": "REALTIME",
                "table_created": False,
                "schema_name": transform_schema_name_to_underscore_format(topic_name),  
                "schema_created": schema_created,
                "kafka": {
                    "topic_name": topic_name,
                    "schema_name": subject
                },
            })

        # Check if all schemas are created
        all_schemas_created = all(item['schema_created'] for item in table_details)
        # print("11111111111111111111111111111111111", all_schemas_created)

        #  if all schemas registered sucessfully only then create the  destination (pinot)row for kafka
        if all_schemas_created:
            # Insert Pinot details into the database
            created_destination_id = create_pinot_row(destination_id, table_details, resource_prefix)
            # Update the clicked destination row
            update_clicked_destination_row(destination_id, created_destination_id) 
            
            return jsonify({"success": True, "message": "Pinot destination created successfully"})
        else:
            return jsonify({"success": False, "message": "Error in creating  pinot schemas for selected tables, Please Try again", "data": table_details}), 500

    except Exception as e:
        print("Error inside the create_pinot_destination", e)
        return jsonify({"success": False, "message": str(e)}), 500


@destinations_bp.route("/start_pinot", methods=["POST"])
def start_pinot():
    try:
        destination_id = request.get_json()
        
        # fetch the whole table_details for the above destination_id...
        table_details = fetch_table_details(destination_id);

        # print("table_details1111111111111111111111111111", table_details)

        # process for each schema name if table registered success then update that object tabl_created to true
        for table_object in table_details:
            schema_name = table_object["schema_name"]
            kafka_topic_name = table_object["kafka"]["topic_name"]
            
            table_config = create_pinot_table_config(table_object)
            # after all success update the table_detail inside the other details for this destination id
            # Attempt to register the Pinot table
            success = register_pinot_table(table_config)

            if success:
                print("entered00000000000000000000000000000000000000")
                # If successful, update the table_created field to True
                table_object["table_created"] = True
        
        print("table_details1111111111111111111111111111", table_details)
   
        # update in the other details updted table_details object...
        update_table_details(destination_id, table_details)

        return jsonify({"success": True, "message": "Pinot destination created successfully", "data":destination_id })

    except Exception as e :
        print("error inside the start_pinot", str(e))
        return jsonify({"success": True, "message": "Pinot destination created successfully"})
        




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

    except Exception as e:
        print("error inside the update_clicked_destination_row", str(e))
        raise
    finally:
        if connection is not None:
            connection.close()
        if engine is not None:
            engine.dispose()


def create_pinot_row(destination_id, table_details, resource_prefix):
    try:
        # print("destination_row_data11111111111111", destination_row_data)
        destination_type = "PINOT"
        connection_details = None
        destination_ids = []
        other_details = {"table_details":table_details, "resource_prefix": resource_prefix}
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
        print("error inside create_pinot_row", e)
        raise
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 




def kafka_other_details(destination_id):
    try:
        engine = get_engine() 
        connection = engine.connect();

        sql = text(""" Select other_details from Destinations WHERE id = :destination_id""") 
        response = connection.execute(sql, {
            "destination_id": destination_id
        })
        row = response.fetchone()
        other_details = json.loads(row[0])
        print("get_topic_details11111111", other_details)
        return other_details

    except Exception as e:
        print("error inside kafka_other_details", str(e))
        raise e
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 


    # Function to process each subject
def process_subject(subject, save_schema=False):
    try:
        # print("111111111111111111")
        kafka_schema = fetch_kafka_schema(subject)
        # print("222222222222222222")
        pinot_schema = generate_pinot_schema(kafka_schema, subject)
        # print("333333333333333333")

        # if save_schema:
        #     save_pinot_schema(pinot_schema)
        register_pinot_schema(pinot_schema)
        return True  
    except Exception as e:
        print(f"Error processing subject '{subject}': {e}")
        return False


# Function to fetch Kafka schema from Kafka Schema Registry
def fetch_kafka_schema(subject):
    try:
        kafka_schema_response = requests.get(
            f"{KAFKA_SCHEMA_REGISTRY_URL}/subjects/{subject}/versions/latest"
        )
        kafka_schema_response.raise_for_status()
        kafka_schema_response_json = kafka_schema_response.json()
        # print("KAFKA_SCHEMA_RESPONSE = \n", kafka_schema_response_json)

        # Parse the schema field into a JSON object
        kafka_schema = json.loads(kafka_schema_response_json["schema"])
        # print("KAFKA_SCHEMA = \n", kafka_schema)
        return kafka_schema

    except requests.exceptions.RequestException as e:
        print(f"Error fetching Kafka schema for subject '{subject}': {e}")
        raise


# Function to map Kafka schema types to Pinot types
def map_schema_type(kafka_type):
    mapping = {
        "string": "STRING",
        "int": "INT",
        "long": "LONG",
        "float": "FLOAT",
        "double": "DOUBLE",
        "bytes": "BYTES",
        "boolean": "BOOLEAN",
    }
    return mapping.get(kafka_type, "STRING")


# Function to generate Pinot schema from Kafka schema
def generate_pinot_schema(kafka_schema, subject):
    try:
        pinot_schema_name = transform_schema_name_to_underscore_format(subject)

        # print("2.11111111111111111111111")
        pinot_schema = {
            "schemaName": pinot_schema_name,
            "dimensionFieldSpecs": [],
            "metricFieldSpecs": [],
            "dateTimeFieldSpecs": [],
        }

        # Detect and add fields
        for field in kafka_schema.get("fields", []):
            # Handle nested types or union types
            field_type = field.get("type")
            if isinstance(field_type, dict):
                field_type = field_type.get("type")
            elif isinstance(field_type, list):
                field_type = field_type[0] if field_type[0] != "null" else field_type[1]

            pinot_field = {
                "name": field.get("name"),
                "dataType": map_schema_type(field_type),
            }
            pinot_schema["dimensionFieldSpecs"].append(pinot_field)

            # Check if the field is a timestamp field and add it to dateTimeFieldSpecs
            if field.get("name") == "__ts_ms" and map_schema_type(field_type) == "LONG":
                pinot_schema["dateTimeFieldSpecs"].append(
                    {
                        "name": field.get("name"),
                        "dataType": "LONG",
                        "format": "1:MILLISECONDS:EPOCH",
                        "granularity": "1:MILLISECONDS",
                    }
                )
            # print("2.2222222222222222222")


        # Remove the timestamp field from dimensionFieldSpecs if it was added there
        pinot_schema["dimensionFieldSpecs"] = [
            field
            for field in pinot_schema["dimensionFieldSpecs"]
            if field["name"] != "__ts_ms"
        ]
        # print("2.333333333333333333333333")
        return pinot_schema
    except Exception as e:
        print("error inside the generate_pinot_schema", str(e))
        raise 



# Function to transform schema name by replacing dots with underscores and removing "-value"
def transform_schema_name_to_underscore_format(subject):
    try:    
        # Replace dots with underscores
        transformed_name = subject.replace(".", "_")
        # Remove the "-value" suffix if it exists
        if transformed_name.endswith("-value"):
            transformed_name = transformed_name[: -len("-value")]
        return transformed_name
    except Exception as e:
        print("error inside the transform_schema_name_to_underscore_format", e)
        raise

# Function to register Pinot schema in Pinot
def register_pinot_schema(pinot_schema):
    try:
        response = requests.post(
            PINOT_SCHEMA_REGISTRY_URL,
            headers={"Content-Type": "application/json"},
            json=pinot_schema,
        )
        response.raise_for_status()
        print(f"Successfully registered schema for {pinot_schema['schemaName']}")

    except requests.exceptions.RequestException as e:
        print(f"Error registering Pinot schema for {pinot_schema['schemaName']}: {e}")
        raise




def fetch_table_details(destination_id):
    try:
        engine = get_engine() 
        connection = engine.connect();

        sql = text(""" Select other_details from Destinations WHERE id = :destination_id""") 
        response = connection.execute(sql, {
            "destination_id": destination_id
        })
        row = response.fetchone()
        other_details = json.loads(row[0])
        print("get_topic_details11111111", other_details["table_details"])
        return other_details["table_details"]

    except Exception as e:
        print("error inside fetch_table_details", str(e))
        raise e
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 



def create_pinot_table_config(table_object):
    tableName = table_object["table_name"]
    schemaName = table_object["schema_name"]
    kafka_topic_name = table_object["kafka"]["topic_name"]
    kafka_schema_name = table_object["kafka"]["schema_name"]
    
    try:    # Create Pinot table configuration
        config = {
            "tableName": tableName,
            "tableType": "REALTIME",
            "segmentsConfig": {
                "replication": "1",
                "replicasPerPartition": "1",
                "schemaName": schemaName,
                "timeColumnName": "__ts_ms",  # Assumes __ts_ms is present in schema
            },
            "tableIndexConfig": {
                "loadMode": "MMAP",
                "streamConfigs": {
                    "streamType": "kafka",
                    "stream.kafka.broker.list": KAFKA_BROKER_URL,
                    "stream.kafka.topic.name": kafka_topic_name,
                    "stream.kafka.decoder.prop.format": "AVRO",
                    "stream.kafka.decoder.prop.schema.registry.schema.name": kafka_schema_name,
                    "stream.kafka.decoder.prop.schema.registry.rest.url": KAFKA_SCHEMA_REGISTRY_URL,
                    "stream.kafka.decoder.class.name": "org.apache.pinot.plugin.inputformat.avro.confluent.KafkaConfluentSchemaRegistryAvroMessageDecoder",
                    "stream.kafka.consumer.type": "lowLevel",
                    "stream.kafka.consumer.prop.auto.offset.reset": "smallest",
                },
            },
            "tenants": {},
            "metadata": {},
        }
        return config
    except Exception as e:
        print("error inside the create_pinot_table_config", e)
        raise

# Function to transform schema name by replacing underscores with dots
def transform_schema_name_to_dot_format(schema_name):
    # Replace underscores with dots in schema name
    # print("1111111111111111111111111111111111111111111111111111111111111", schema_name.replace("_", "."))
    return schema_name.replace("_", ".")


# Function to register a Pinot table in Pinot
def register_pinot_table(table_config):
    # Register a Pinot table using the provided configuration
    try:
        response = requests.post(
            PINOT_TABLE_URL,
            headers={"Content-Type": "application/json"},
            json=table_config,
        )
        response.raise_for_status()
        print(f"Successfully registered table: {table_config['tableName']}")
        return True
    except requests.exceptions.HTTPError as http_err:
        print(
            f"HTTP error occurred while registering table '{table_config['tableName']}': {http_err}"
        )
        return False

    except requests.exceptions.RequestException as req_err:
        print(
            f"Request exception occurred while registering table '{table_config['tableName']}': {req_err}"
        )
        return False

    except Exception as err:
        print(
            f"Other error occurred while registering table '{table_config['tableName']}': {err}"
        )
        return False


# def update_table_details(destination_id, updated_table_details):
#     try:
#         # Get database engine
#         engine = get_engine()
#         connection = engine.connect()

#         # SQL query to update the other_details column in MySQL
#         sql = text("""
#             UPDATE Destinations
#             SET other_details = JSON_SET(other_details, '$.table_details', :updated_table_details)
#             WHERE id = :destination_id
#         """)

#         # Execute the query with the provided destination_id and updated_table_details
#         connection.execute(sql, {
#             'updated_table_details': updated_table_details,  # Pass the dictionary directly
#             'destination_id': destination_id
#         })

#         # Commit the transaction
#         connection.commit()

#     except Exception as e:
#         print("Error inside the update_table_details:", str(e))
#         raise
#     finally:
#         # Close the connection and dispose of the engine
#         if connection is not None:
#             connection.close()
#         if engine is not None:
#             engine.dispose()


def update_table_details(destination_id, updated_table_details):
    try:
        # Get database engine
        engine = get_engine()
        connection = engine.connect()

        # Fetch the current JSON data from the other_details column
        fetch_sql = text("""
            SELECT other_details
            FROM Destinations
            WHERE id = :destination_id
        """)
        result = connection.execute(fetch_sql, {'destination_id': destination_id})
        row = result.fetchone()
        
        if row is None:
            raise ValueError("Destination with the provided ID does not exist.")
        
        other_details_json = json.loads(row[0])
        # print("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", other_details_json)

        other_details_json["table_details"] = updated_table_details
        # print("fffffffffffffffffffffffffffffffffffffffffffffff", other_details_json)
        # Convert the updated dictionary back to JSON string
        # updated_other_details_json = json.dumps(other_details_json)

        # SQL query to update the other_details column in the MySQL table
        update_sql = text("""
            UPDATE Destinations
            SET other_details = :updated_other_details
            WHERE id = :destination_id
        """)
        
        # Execute the update query with the updated JSON string
        connection.execute(update_sql, {
            'updated_other_details': json.dumps(other_details_json),
            'destination_id': destination_id
        })

        # Commit the transaction
        connection.commit()

    except Exception as e:
        print("Error inside the update_table_details:", str(e))
        raise
    finally:
        # Close the connection and dispose of the engine
        if connection is not None:
            connection.close()
        if engine is not None:
            engine.dispose()