from flask import  request, jsonify, Blueprint
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from .db import get_engine
from sqlalchemy import text
import json
from mysql.connector import Error as MySQLError
import requests


kafka_connect_bp = Blueprint('kafka_connect', __name__) # connection blueprint...


kafka_connect_baseurl = "http://192.168.29.18:8083"

@kafka_connect_bp.route('/start_connection', methods=["POST"])
def start_connection():
    try:
        # (TBD) get all the data from database using connection id from the fronend.. 
        data = request.get_json()
        other_details = json.loads(data["other_details"])
        kafka_connect_details = other_details["kafka_connect_details"]
        resource_prefix = kafka_connect_details["config"]["topic.prefix"]
        conn_id = data["id"]
        # print("kafka_connect_details1111111111111111", kafka_connect_details)
        # (TBD) check if connectors present or not using the connector name
        url = f"{kafka_connect_baseurl}/connectors"

        json_payload = json.dumps(kafka_connect_details)

        headers = {
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers, data=json_payload)
        # print("response.json0000000000000000", response.json())

        if 200 <= response.status_code < 300:             
            #  print("json respose of start_connection", response.json())
             update_status_overall(conn_id, "ACTIVE")
             #  create destination kafka in destinations table 
             topic_names_array = generate_topic_and_schema_names_array(kafka_connect_details)
             other_details = {"resource_prefix": resource_prefix, "topic_details":topic_names_array}
             destination_row_data = {"conn_id":conn_id, "destination_type":"KAFKA", "connection_details":None, "destination_ids":[], "other_details":other_details}
             insert_into_destination(destination_row_data)

             print("topic_names_array111111111111111111111111111111111111", topic_names_array)
             
             return jsonify({"success": True,  "overall_status":"ACTIVE", "connector_status": "RUNNING"}), 201
            # update_status(data, "Active")
            # return jsonify(response.json()), 201
        else:
            # print("response.text11111111111111111", response.text)
            print("error in getting response from control center", response.json())
            return jsonify({"success": False, "data": response.json()}), response.status_code 
        
    except ValueError as e:
        print("ValueError:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500

    except requests.exceptions.RequestException as e:
        print("RequestsException:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500

    except Exception as e:
        print("Exception inside start_connection:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500
    

def update_status_overall(connection_id, overall_status):
    try:
        # print("update status triggered... connection_data1111111111111111111", connection_data)
        # connection_id = connection_data["id"]
        engine = get_engine();
        connection = engine.connect()
        sql = text("""UPDATE Connections 
                      SET overall_status = :overall_status 
                      WHERE id = :connection_id""") 
               
        connection.execute(sql, {
            "overall_status" : overall_status,
            "connection_id" : connection_id
        })
        connection.commit();
        connection.close();
        engine.dispose();        
    except Exception as e:
        print("error inside the update_status function", str(e))
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 

#  function to generate topic names from the kafka_connect_details
def generate_topic_and_schema_names_array(kafka_connect_details):
    try:
        # Extract the 'topic.prefix' and 'table.include.list' from the dictionary
        topic_prefix = kafka_connect_details['config'].get('topic.prefix', '')
        table_list = kafka_connect_details['config'].get('table.include.list', '')
        # Split the table list into individual tables
        print("topic_prefix , table_list", topic_prefix, table_list)
        tables = table_list.split(',')
        result = []
        
        # Add table-specific topics to the result list
        for table in tables:
            topic_details  = {
                "topic_name": f"{topic_prefix}.{table}",
                "schema_name": f"{topic_prefix}.{table}-value"
            }
            # table_topic = f"{topic_prefix}.{table}-value"
            result.append(topic_details)
        return result
    
    except Exception as e:
        print(f"Exception in generate_topic_names: {str(e)}")
        raise ValueError("Failed to generate topic names") from e

def insert_into_destination(destination_row_data):
    try:
        # print("destination_row_data11111111111111", destination_row_data)
        conn_id = destination_row_data["conn_id"]
        destination_type = destination_row_data["destination_type"]
        connection_details = destination_row_data["connection_details"]
        destination_ids = destination_row_data["destination_ids"]
        other_details = destination_row_data["other_details"]
        # print("sucessssssssssssssssssssssssssss")

        engine = get_engine()
        connection = engine.connect()

        sql = text("""insert into Destinations (conn_id, destination_type, connection_details, destination_ids, other_details) 
                   values (:conn_id, :destination_type, :connection_details, :destination_ids, :other_details )""")
       
        connection.execute(sql, {
            "conn_id" : conn_id,
            "destination_type" : destination_type,
            "connection_details":  json.dumps(connection_details),
            "destination_ids":  json.dumps(destination_ids),
            "other_details":  json.dumps(other_details)
        })

        connection.commit()
        connection.close()
        engine.dispose()

    except Exception as e:
        print("error inside insert_into_destination", e)
        raise
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 




@kafka_connect_bp.route("/fetch_connector_status", methods = ["POST"])
def fetch_connector_status():
    try:
        data = request.get_json()
        connector_name = data["connector_name"]
        connection_id = data["connection_id"]
        # print("connector name 1111111: ", data["connector_name"])
        url = f"{kafka_connect_baseurl}/connectors/{connector_name}/status"
        # print("url2222222222222222", url)
        response = requests.get(url)

         # Print the entire response object for debugging
        # print("Response Status Code1111122222333:", response.status_code)
        # print("Response Headers:", response.headers)
        # print("Response Content:", response.text)
    
        if 200 <= response.status_code < 300:
            # print("json respose of start_connection", response.json())
            response_json = response.json()
            connector_status = response_json["connector"]["state"]             
            # update_status(connection_id, status)
            # print("response=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", response)
            return jsonify({"success": True, "message": f"Connector status is {connector_status}", "connector_status": connector_status}), response.status_code
        else:
            return jsonify({"success": False, "message": response.text}), response.status_code
    
    except requests.exceptions.RequestException as e:
        print("error inside pause_connection api", e)
        return jsonify({"success": False, "message": str(e)}), 500

    except Exception as e:
        print("error inside pause_connection api", e)
        return jsonify({"success": False, "message": str(e)}), 500


@kafka_connect_bp.route('/pause_connection', methods=["POST"])
def pause_connection():
    try:
        data = request.get_json()
        connector_name = data["connector_name"]
        connection_id = data["connection_id"]
        # print("connector name 1111111: ", data["connector_name"])
        url = f"{kafka_connect_baseurl}/connectors/{connector_name}/pause"
        # print("url2222222222222222", url)
        response = requests.put(url)
    
        if 200 <= response.status_code < 300:             
            # update_status(connection_id, "PAUSED")
            # print("response=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", response)
            return jsonify({"success": True, "message": "Connector PAUSED successfully", "connector_status": "PAUSED"}), response.status_code
        else:
            return jsonify({"success": False, "message": response.text}), response.status_code
    
    except requests.exceptions.RequestException as e:
        print("error inside pause_connection api", e)
        return jsonify({"success": False, "message": str(e)}), 500

    except Exception as e:
        print("error inside pause_connection api", e)
        return jsonify({"success": False, "message": str(e)}), 500

@kafka_connect_bp.route("/resume_connection", methods = ["POST"])
def resume_connection():
    try:
        data = request.get_json()
        connector_name = data["connector_name"]
        connection_id = data["connection_id"]

        # print("connector name 1111111: ", data["connector_name"])
        url = f"{kafka_connect_baseurl}/connectors/{connector_name}/resume"
        # print("url2222222222222222", url)
        response = requests.put(url)
    
        if response.status_code == 200 or response.status_code == 202:
            # update_status(connection_id, "RUNNING")

            # print("response=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", response)
            return jsonify({"success": True, "message": "Connector Resumed successfully", "connector_status": "RUNNING"}), response.status_code
        else:
            return jsonify({"success": False, "message": response.text}), response.status_code
    
    except requests.exceptions.RequestException as e:
        print("error inside resume_connection api", e)
        return jsonify({"success": False, "message": str(e)}), 500

    except Exception as e:
        print("error inside resume_connection api", e)
        return jsonify({"success": False, "message": str(e)}), 500

@kafka_connect_bp.route("/restart_connection", methods=["POST"])
def restart_connection():
    try:
        data = request.get_json()
        connector_name = data.get("connector_name")
        connection_id = data.get("connection_id")  # Assuming the connection ID is used similarly as in the resume API
        # print("Received data: ", data)  # Log the received data

        # Construct the URL to restart the connector
        url = f"{kafka_connect_baseurl}/connectors/{connector_name}/restart/?includeTasks=true"
        
        # Send the POST request to restart the connector
        response = requests.post(url)
    
        if 200 <= response.status_code < 300:             
            # Optionally update the status if needed
            # update_status(connection_id, "Restarting")  # Assuming you might have a similar function to update status
            print("respose of restart_connection api11111", response.text)
            return jsonify({"success": True, "message": "Connector RESTARTED successfully"}), response.status_code
        else:
            print("respose of restart_connection api11111", response.text)
            return jsonify({"success": False, "message": response.text}), response.status_code
    
    except requests.exceptions.RequestException as e:
        print("error inside restart_connection API", e)
        return jsonify({"success": False, "message": str(e)}), 500

    except Exception as e:
        print("error inside restart_connection API", e)
        return jsonify({"success": False, "message": str(e)}), 500


@kafka_connect_bp.route("/destroy_connector", methods = ["POST"])
def destroy_connector():
    try:
        data = request.get_json()
        connector_name = data.get("connector_name")
        connection_id = data.get("connection_id")  # Assuming the connection ID is used similarly as in the resume API
        # print("Received data: ", data)  # Log the received data

        # Construct the URL to restart the connector
        url = f"{kafka_connect_baseurl}/connectors/{connector_name}"
        
        # Send the POST request to restart the connector
        response = requests.delete(url)
    
        if 200 <= response.status_code < 300:             
            # Optionally update the status if needed
            # update_status(connection_id, "INACTIVE")  # Assuming you might have a similar function to update status
            print("respose of destroy_connector api11111", response.status_code)
            return jsonify({"success": True, "message": "Connector deleted successfully", "connector_status" : "INACTIVE"}), 200
        else:
            print("respose of destroy_connector api11111222", response.text)
            return jsonify({"success": False, "message": response.text}), response.status_code
    
    except requests.exceptions.RequestException as e:
        print("error inside destroy_connector API", e)
        return jsonify({"success": False, "message": str(e)}), 500

    except Exception as e:
        print("error inside destroy_connector API", e)
        return jsonify({"success": False, "message": str(e)}), 500
    


