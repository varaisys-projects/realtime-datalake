from flask import  request, jsonify, Blueprint
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from .db import get_engine
from sqlalchemy import text
import json
from mysql.connector import Error as MySQLError
import time
import requests

connection_bp = Blueprint('connection', __name__) # connection blueprint...

DATABASE_ENGINES = {
    'PostgreSQL': 'postgresql+psycopg2://{username}:{password}@{host}:{port}/{database_name}',
    'MySQL': 'mysql+mysqlconnector://{username}:{password}@{host}:{port}/{database_name}',
    'Oracle': 'oracle+cx_oracle://{username}:{password}@{host}:{port}/{database_name}',
    'SQLServer': 'mssql+pyodbc://{username}:{password}@{host}:{port}/{database_name}?driver=ODBC+Driver+17+for+SQL+Server'
}


@connection_bp.route('/test_connection', methods=['POST'])
def test_connection():
    data = request.get_json()
    print("data1111111", data)
    host = data['host']
    port = data['port']
    username = data['username']
    password = data['password']
    database_type = data['database_type']
    database_name = data["databaseName"]

    try:
        if database_type in DATABASE_ENGINES:
            connection_string = DATABASE_ENGINES[database_type].format(
                username=username,
                password=password,
                host=host,
                port=port,
                database_name=database_name
            )
            engine = create_engine(connection_string)
            conn = engine.connect()
            conn.close()
            engine.dispose() 
            return jsonify({'success': True, 'message': 'Connection test successful'})
        else:
            return jsonify({'success': False, 'message': 'Unsupported database type'}), 400

    except KeyError as e:
        return jsonify({'success': False, 'message': f'Missing required parameter: {str(e)}'}), 400

    except MySQLError as e:
        error_message = str(e)
        if "Can't connect to MySQL server" in error_message:
            return jsonify({'success': False, 'message': 'Unable to connect to the database server. Please check your credentials and connection details.'}), 400
        else:
            return jsonify({'success': False, 'message': error_message}), 400

    except SQLAlchemyError as e:
        return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

    except Exception as e:
        print("test connection api issue:", e)
        return jsonify({'success': False, 'message': str(e)}), 400
    
    finally:
        if conn is not None:
            conn.close()
    
        if engine is not None:
            engine.dispose() 
    

# @connection_bp.route('/fetch_schema', methods=['POST'])
# def fetch_schema():
#     data = request.get_json()
#     database_type = data['selectedDatabaseType']
#     connection_details = data['connection_details']

#     host = connection_details["host"]
#     port = connection_details['port']
#     username = connection_details['username']
#     password = connection_details['password']
#     database_name = connection_details["databaseName"]

#     try:
#         if database_type in DATABASE_ENGINES:

#             connection_string = DATABASE_ENGINES[database_type].format(
#                 username=username,
#                 password=password,
#                 host=host,
#                 port=port,
#                 database_name=database_name
#             )

#             # Fetch the schema corresponding to the provided connection details
#             table_schema = get_database_schema(connection_string, database_type)

#             return jsonify({'success': True, 'message': 'Schema fetched successfully', "schema": table_schema})

#         else:
#             return jsonify({'success': False, 'message': 'Unsupported database type'}), 400

#     except KeyError as e:
#         return jsonify({'success': False, 'message': f'Missing required parameter: {str(e)}'}), 400

#     except MySQLError as e:
#         error_message = str(e)
#         if "Can't connect to MySQL server" in error_message:
#             return jsonify({'success': False, 'message': 'Unable to connect to the database server. Please check your credentials and connection details.'}), 400
#         else:
#             return jsonify({'success': False, 'message': error_message}), 400

#     except SQLAlchemyError as e:
#         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 400

    

# def get_database_schema(connection_string, database_type):
#     engine = create_engine(connection_string)
#     connection = engine.connect()
#     schema = {}

#     try:
#         if database_type == 'MySQL':
#             schema = get_mysql_schema(connection)
#         elif database_type == 'PostgreSQL':
#             schema = get_postgresql_schema(connection)
#         else:
#             raise ValueError("Unsupported database type")

#     finally:
#         connection.close()
#         engine.dispose()

#     return schema


# def get_mysql_schema(connection):
#     try:
#         query_tables = text("SHOW TABLES")
#         tables = connection.execute(query_tables)  # fetch all tables names 
#         schema = {}
#         # print("tables1111111", tables  )
    
#         for table in tables:
#             # print("table22222", table)
#             table_name = table[0]
#             query_columns = text(f"SHOW COLUMNS FROM {table_name}") # for each table fetch columns list
#             columns = connection.execute(query_columns)
#             # print("columns22222222", columns)
            
#             columns_list = []
#             for col in columns:
#                 column_dict = {
#                     'name': col[0],
#                     'type': col[1]
#                 }
#                 columns_list.append(column_dict)
#             schema[table_name] = columns_list
#             # object with tables name as keys and value is an array of column objects 
    
#         return schema
#     except Exception as e:
#         print("error inside get_mysql_schema", e)
    
@connection_bp.route('/fetch_schema', methods=['POST'])
def fetch_schema():
    data = request.get_json()
    database_type = data['selectedDatabaseType']
    connection_details = data['connection_details']

    host = connection_details["host"]
    port = connection_details['port']
    username = connection_details['username']
    password = connection_details['password']
    database_name = connection_details["databaseName"]

    try:
        if database_type in DATABASE_ENGINES:

            connection_string = DATABASE_ENGINES[database_type].format(
                username=username,
                password=password,
                host=host,
                port=port,
                database_name=database_name
            )

            # Fetch the schema corresponding to the provided connection details
            table_schema = get_database_schema(connection_string, database_type)

            if 'error' in table_schema:
                return jsonify({'success': False, 'message': table_schema['error']}), 400

            return jsonify({'success': True, 'message': 'Schema fetched successfully', "schema": table_schema})

        else:
            return jsonify({'success': False, 'message': 'Unsupported database type'}), 400

    except KeyError as e:
        print("error inside fetch_schema", str(e))
        return jsonify({'success': False, 'message': f'Missing required parameter: {str(e)}'}), 400

    except MySQLError as e:
        print("error inside fetch_schema", str(e))
        return jsonify({'success': False, 'message': 'Database privilege error. Please check your database permissions.'}), 400

    except SQLAlchemyError as e:
        print("error inside fetch_schema", str(e))
        return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

    except Exception as e:
        print("error inside fetch_schema", str(e))
        return jsonify({'success': False, 'message': str(e)}), 400

def get_database_schema(connection_string, database_type):
    engine = create_engine(connection_string)
    connection = engine.connect()
    schema = {}

    try:
        if database_type == 'MySQL':
            schema = get_mysql_schema(connection)
        elif database_type == 'PostgreSQL':
            schema = get_postgresql_schema(connection)
        else:
            raise ValueError("Unsupported database type")

    except Exception as e:
        return {'error': str(e)}

    finally:
        connection.close()
        engine.dispose()

    return schema

def get_mysql_schema(connection):
    try:
        query_tables = text("SHOW TABLES")
        tables = connection.execute(query_tables)  # fetch all tables names 
        schema = {}

        for table in tables:
            table_name = table[0]
            query_columns = text(f"SHOW COLUMNS FROM {table_name}") # for each table fetch columns list
            columns = connection.execute(query_columns)
            
            columns_list = []
            for col in columns:
                column_dict = {
                    'name': col[0],
                    'type': col[1]
                }
                columns_list.append(column_dict)
            schema[table_name] = columns_list
    
        return schema
    except MySQLError as e:
        raise e  # Raise the error to be caught in the get_database_schema function
    except Exception as e:
        raise e  # Raise any other error to be caught in the get_database_schema function
    

def get_postgresql_schema(connection):
    try:
        print("inside get_postgresql_schema11111111111")
        query_tables = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = connection.execute(query_tables)
        schema = {}
    
        for table in tables:
            table_name = table[0]
            query_columns = text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'")
            columns = connection.execute(query_columns)
            schema[table_name] = [{'name': col[0], 'type': col[1]} for col in columns]  # Use integer indices
    
        return schema
    except Exception as e :
        print("error inside get_postgresql_schema", e)
    



# @connection_bp.route('/save_mapping', methods=['POST'])
# def save_mapping():
#     data = request.get_json()
#     user_id = data["user_id"]
#     connection_type = data["connection_type"]
#     connection_details = data["connection_details"]
#     mapping_details = data["mappings_details"]

#     kafka_connect_details = update_kafka_connect_details(user_id, connection_details, mapping_details);
    
#     try:
#         engine = get_engine()
#         connection = engine.connect()

#         # Check if same connection details and mapping details already exist if present then do not add it
#         select_sql = text("""
#         SELECT COUNT(*) FROM Connections
#         WHERE user_id = :user_id
#         AND connection_type = :connection_type
#         AND connection_details = CAST(:connection_details As JSON) 
#         AND mapping_details = CAST(:mapping_details as JSON)
#         """)
#         result = connection.execute(select_sql, {
#             'user_id': user_id,
#             'connection_type': connection_type,
#             'connection_details': json.dumps(connection_details),  # Convert the Python dictionary connection_details into a JSON string.
#             'mapping_details': json.dumps(mapping_details)
#         })
#         count = result.scalar()

#         if count > 0:
#             connection.close()
#             engine.dispose()
#             return jsonify({'success': False, 'message': 'The same connection and mapping details already exist for this user'}), 400

#         # Insert the connection details into the Connections table
#         insert_sql = text("""
#         INSERT INTO Connections (user_id, connection_type, connection_details, mapping_details, connector_status, other_details)
#         VALUES (:user_id, :connection_type, :connection_details, :mapping_details, :connector_status, :other_details)
#         """)
#         connection.execute(insert_sql, {
#             'user_id': user_id,
#             'connection_type': connection_type,
#             'connection_details': json.dumps(connection_details),  # Convert the Python dictionary connection_details into a JSON string.
#             'mapping_details': json.dumps(mapping_details),
#             'connector_status': "INACTIVE",  # Set to INACTIVE by default
#             'other_details': json.dumps({"kafka_connect_details":kafka_connect_details})
#         })
#         connection.commit()

#         # Close connection and dispose of the engine
#         connection.close()
#         engine.dispose()

#         return jsonify({'success': True, 'message': 'Mapping details saved successfully'})

#     except SQLAlchemyError as e:
#         print("errrrrrrrrrrrrrrrrrrr", e)
#         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

#     except Exception as e:
#         print("errrr exception", e)
#         return jsonify({'success': False, 'message': str(e)}), 400


# def update_kafka_connect_details(user_id, connection_details, mapping_details):
#     try:
#         selected_tables = []
#         selected_columns = []

#         # Extract the database name
#         database_name = connection_details["databaseName"]

#         # Iterate over tables in mapping details
#         for table in mapping_details['tables']:
#             table_name = table['table_name']
#             selected_tables.append(f"{database_name}.{table_name}")
#             for column in table['columns']:
#                 selected_columns.append(f"{database_name}.{table_name}.{column}")

#         kafka_connect_details = {
#             "name": f"{user_id}_inventory-connector",
#             "config": {
#                 "connector.class": "io.debezium.connector.mysql.MySqlConnector",
#                 "tasks.max": "1",
#                 "database.hostname": connection_details["host"],
#                 "database.port": str(connection_details["port"]),
#                 "database.user": connection_details["username"],
#                 "database.password": connection_details["password"],
#                 "database.server.id": "184054",
#                 "database.server.name": "dbserver1",
#                 "database.include.list": database_name,
#                 "table.include.list": ",".join(selected_tables),
#                 "column.include.list": ",".join(selected_columns),
#                 "database.history.kafka.bootstrap.servers": "localhost:9092",
#                 "database.history.kafka.topic": "schema-changes.inventory"
#             }
#         }

#         return kafka_connect_details

#     except KeyError as e:
#         print(f"Missing key in input data inside update_kafka_connect_details: {e}")
#         return None
#     except Exception as e:
#         print(f"An error occurred inside update_kafka_connect_details: {e}")
#         return None

# @connection_bp.route('/save_mapping', methods=['POST'])
# def save_mapping():
#     data = request.get_json()
#     user_id = data["user_id"]
#     connection_type = data["connection_type"]
#     connection_details = data["connection_details"]
#     mapping_details = data["mappings_details"]
#     # checked_boxes = data["checked_boxes"]

#     try:
#         engine = get_engine()
#         connection = engine.connect()

#         # Check if same connection details and mapping details already exist if present then do not add it
#         # JSON_CONTAINS checking whether the connection details column which is of type json  contains the connection_details mapping for the given user id...
#         select_sql = text("""
#         SELECT COUNT(*) FROM Connections
#         WHERE user_id = :user_id
#         AND connection_type = :connection_type
#         AND JSON_CONTAINS(connection_details, :connection_details)  
#         AND JSON_CONTAINS(mapping_details, :mapping_details)
#         """)
#         result = connection.execute(select_sql, {
#             'user_id': user_id,
#             'connection_type': connection_type,
#             'connection_details': json.dumps(connection_details), #This converts the Python dictionary connection_details into a JSON string.
#             'mapping_details': json.dumps(mapping_details)
#         })
#         count = result.scalar()

#         if count > 0:
#             connection.close()
#             engine.dispose()
#             return jsonify({'success': False, 'message': 'The same connection and mapping details already exist for this user'}), 400

#         # Insert the connection details into the Connections table
#         insert_sql = text("""
#         INSERT INTO Connections (user_id, connection_type, connection_details, mapping_details, connector_status)
#         VALUES (:user_id, :connection_type, :connection_details, :mapping_details, :connector_status )
#         """)
#         connection.execute(insert_sql, {
#             'user_id': user_id,
#             'connection_type': connection_type,
#             'connection_details': json.dumps(connection_details), # converthing python dic into json string by dumps
#             'mapping_details': json.dumps(mapping_details),
#             'connector_status': "INACTIVE" # Set to INACTIVE by default
#             # "checked_boxes": json.dumps(checked_boxes)
#         })
#         connection.commit()

#         # Close connection and dispose of the engine
#         connection.close()
#         engine.dispose()

#         return jsonify({'success': True, 'message': 'Mapping details saved successfully'})

#     except SQLAlchemyError as e:
#         print("errrrrrrrrrrrrrrrrrrr", e)
#         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

#     except Exception as e:
#         print("errrr exception", e)
#         return jsonify({'success': False, 'message': str(e)}), 400

@connection_bp.route('/save_mapping', methods=['POST'])
def save_mapping():
    data = request.get_json()
    user_id = data["user_id"]
    connection_type = data["connection_type"]
    connection_details = data["connection_details"]
    mapping_details = data["mappings_details"]

    print("updated triggered11111111111")

    try:
        engine = get_engine()
        connection = engine.connect()
        trans = connection.begin()  # Begin a transaction

        # # Check if the same connection details and mapping details already exist
        # select_sql = text("""
        # SELECT COUNT(*) FROM Connections
        # WHERE user_id = :user_id
        # AND connection_type = :connection_type
        # AND connection_details = CAST(:connection_details AS JSON) 
        # AND mapping_details = CAST(:mapping_details AS JSON)
        # """)
        # result = connection.execute(select_sql, {
        #     'user_id': user_id,
        #     'connection_type': connection_type,
        #     'connection_details': json.dumps(connection_details),
        #     'mapping_details': json.dumps(mapping_details)
        # })
        # count = result.scalar()

        # if count > 0:
        #     connection.close()
        #     engine.dispose()
        #     return jsonify({'success': False, 'message': 'The same connection and mapping details already exist for this user'}), 400

        # Insert the connection details into the Connections table
        insert_sql = text("""
        INSERT INTO Connections (user_id, connection_type, connection_details, mapping_details, other_details, overall_status)
        VALUES (:user_id, :connection_type, :connection_details, :mapping_details, :other_details, :overall_status)
        """)
        connection.execute(insert_sql, {
            'user_id': user_id,
            'connection_type': connection_type,
            'connection_details': json.dumps(connection_details),
            'mapping_details': json.dumps(mapping_details),
            'other_details': json.dumps({}),
            "overall_status" : "NA"
        })

        # Retrieve the auto-incremented connection ID
        result = connection.execute(text("SELECT LAST_INSERT_ID()"))
        connection_id = result.scalar()
        print("connection_id000000000", connection_id)

        if not connection_id:
            raise ValueError("Failed to retrieve connection ID inside save_mapping")

        # Generate kafka_connect_details with the connection ID
        kafka_connect_details = create_kafka_connect_details(user_id, connection_details, mapping_details, connection_id)
        if kafka_connect_details is None:
            raise ValueError("Failed to generate kafka_connect_details")

        # Update the other_details with the kafka_connect_details
        update_sql = text("""
        UPDATE Connections
        SET other_details = JSON_SET(other_details, '$.kafka_connect_details', CAST(:kafka_connect_details AS JSON))
        WHERE id = :connection_id
        """)
        connection.execute(update_sql, {
            'kafka_connect_details': json.dumps(kafka_connect_details),
            'connection_id': connection_id
        })

        trans.commit()  # Commit the transaction
        connection.close()
        engine.dispose()

        return jsonify({'success': True, 'message': 'Mapping details saved successfully'})

    except SQLAlchemyError as e:
        print("SQLAlchemyError:", e)
        if trans is not None:
            trans.rollback()
        return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

    except Exception as e:
        print("Exception:", e)
        if trans is not None:
            trans.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400
    
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 
    


# def create_kafka_connect_details(user_id, connection_details, mapping_details, connection_id):
#     try:
#         selected_tables = []
#         selected_columns = []

#         # Extract the database name
#         database_name = connection_details["databaseName"]

#         print("updated update-kafka-connect-details")
#         # Iterate over tables in mapping details
#         for table in mapping_details['tables']:
#             table_name = table['table_name']
#             selected_tables.append(f"{database_name}.{table_name}")
#             for column in table['columns']:
#                 selected_columns.append(f"{database_name}.{table_name}.{column}")

#         kafka_connect_details = {
#             "name": f"{user_id}_inventory-connector_{connection_id}",
#             "config": {
#                 "connector.class": "io.debezium.connector.mysql.MySqlConnector",
#                 "tasks.max": "1",
#                 "database.hostname": connection_details["host"],
#                 "database.port": connection_details["port"],
#                 "database.user": connection_details["username"],
#                 "database.password": connection_details["password"],
#                 "database.server.id": "184054",
#                 "database.server.name": "dbserver1",
#                 "database.include.list": database_name,
#                 "table.include.list": ",".join(selected_tables),
#                 "column.include.list": ",".join(selected_columns),
#                 "database.history.kafka.bootstrap.servers": "localhost:9092",
#                 "database.history.kafka.topic": "schema-changes.inventory"
#             }
#         }

#         return kafka_connect_details

#     except KeyError as e:
#         print(f"Missing key in input data inside update_kafka_connect_details: {e}")
#         return None
#     except Exception as e:
#         print(f"An error occurred inside update_kafka_connect_details: {e}")
#         return None

def create_kafka_connect_details(user_id, connection_details, mapping_details, connection_id):
    try:
        selected_tables = []
        selected_columns = []

        database_name = connection_details["databaseName"]

        # timestamp in milliseconds converted into int from float
        timestamp = int(time.time() * 1000)

        # Iterate over tables in mapping details
        for table in mapping_details['tables']:
            table_name = table['table_name']
            selected_tables.append(f"{database_name}.{table_name}")
            for column in table['columns']:
                selected_columns.append(f"{database_name}.{table_name}.{column}")
        
        userID_connectionID =  f"Usr{user_id}Conn{connection_id}"

        kafka_connect_details = {
            "name": f"{userID_connectionID}_MysqlConnector_{timestamp}",
            "config": {
                "name": f"{userID_connectionID}_MysqlConnector_{timestamp}",
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "tasks.max": "1",
                "topic.prefix": f"{userID_connectionID}",
                "database.hostname": connection_details["host"],
                "database.port": connection_details["port"],
                "database.user": connection_details["username"],
                "database.password": connection_details["password"],
                "database.server.id": "184054",
                "database.server.name": "dbserver1",
                "database.include.list": database_name,
                "table.include.list": ",".join(selected_tables),
                "column.include.list": ",".join(selected_columns),
                "schema.history.internal.kafka.topic": f"{userID_connectionID}.schema-changes.{database_name}",
                "schema.history.internal.kafka.bootstrap.servers": "kafka-broker:29092",     
                "transforms": "unwrap",
                "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
                "transforms.unwrap.drop.tombstones": "false",
                "transforms.unwrap.delete.handling.mode": "rewrite",
                "transforms.unwrap.add.fields": "op,ts_ms"           
            }
        }

        return kafka_connect_details

    except KeyError as e:
        print(f"Missing key in input data inside update_kafka_connect_details: {e}")
        return None
    except Exception as e:
        print(f"An error occurred inside update_kafka_connect_details: {e}")
        return None
 
@connection_bp.route('/get_connections/<user_id>', methods=['GET'])
def get_connections(user_id):
    try:
        engine = get_engine()  # Assuming this is your own function to get the database engine
        connection = engine.connect()

        select_sql = text("""
        SELECT * FROM Connections WHERE user_id = :user_id
        """)
        result = connection.execute(select_sql, {'user_id': user_id})

        connections = []
        full_structure = []
        
        for row in result:
            connection_info = {
                'id': row[0],
                'user_id': row[1],
                'connection_type': row[2],
                # 'connector_status': row[3],
                'connector_status': "NA",
                'created_at': str(row[3]),
                'updated_at': str(row[4]),
                'connection_details': (row[5]), 
                'mapping_details': (row[6]),
                'other_details' : (row[7]),
                "overall_status" : (row[8]),
                # 'checked_boxes':json.loads(row[9])
                # 'connection_details': json.loads(row[6]),
                # 'mapping_details': json.loads(row[7])
            }
            connections.append(connection_info)
        
            
        connection.close()
        engine.dispose()
        return jsonify({'success': True, 
            'connections': connections, 
        })
    
    except SQLAlchemyError as e:
        # Handle SQLAlchemy errors
        print("get connections api issue:", e)
        return jsonify({'success': False, 'message': 'Database error. Failed to fetch connections.'}), 400

    except Exception as e:
        # Handle any other unexpected errors
        print("get connections api issue:", e)
        return jsonify({'success': False, 'message': str(e)}), 400
    
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 


# @connection_bp.route('/update_mapping', methods=['POST'])
# def update_mapping():
#     data = request.get_json()
#     user_id = data["user_id"]
#     connection_id = data["connection_id"]
#     mapping_details = data["mappings_details"]
#     connection_details = data["connection_details"]
#     # checked_boxes = data["checked_boxes"]

#     kafka_connect_details = update_kafka_connect_details(user_id, connection_details, mapping_details)
#     try:
#         engine = get_engine()
#         connection = engine.connect()

#         # Update the mapping details in the Connections table
#         update_sql = text("""
#         UPDATE Connections
#         SET mapping_details = :mapping_details AND other_details.kafka_connect_details = :kafka_connect_details
#         WHERE user_id = :user_id
#         AND id = :connection_id
#         """)
        
#         connection.execute(update_sql, {
#             'user_id': user_id,
#             'connection_id': connection_id,
#             'mapping_details': json.dumps(mapping_details),  # Convert the Python dictionary into a JSON string
#             "kafka_connect_details": json.dumps(kafka_connect_details)
#         })
#         connection.commit()

#         # Close connection and dispose of the engine
#         connection.close()
#         engine.dispose()

#         return jsonify({'success': True, 'message': 'Mapping details updated successfully'})

#     except SQLAlchemyError as e:
#         print("SQLAlchemyError:", e)
#         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

#     except Exception as e:
#         print("Exception:", e)
#         return jsonify({'success': False, 'message': str(e)}), 400

# @connection_bp.route('/update_mapping', methods=['POST'])
# def update_mapping():
#     data = request.get_json()
#     user_id = data["user_id"]
#     connection_id = data["connection_id"]
#     mapping_details = data["mappings_details"]
#     connection_details = json.loads(data["connection_details"])

#     # print("connection_details11111111111111111", connection_details)

#     kafka_connect_details = create_kafka_connect_details(user_id, connection_details, mapping_details, connection_id)

#     print("kafka_connect_details11111111111111111", kafka_connect_details)


#     try:
#         engine = get_engine()
#         connection = engine.connect()

#         # Step 1: Retrieve existing 'other_details'
#         select_sql = text("""
#         SELECT other_details FROM Connections
#         WHERE user_id = :user_id
#         AND id = :connection_id
#         """)
#         result = connection.execute(select_sql, {
#             'user_id': user_id,
#             'connection_id': connection_id
#         })
#         existing_other_details = result.fetchone()
        
#         print("existing_other_details000000000000000", existing_other_details)
#         if existing_other_details is None:
#             raise ValueError("Connections details not found.")
        
#         # Convert existing_other_details to a Python dictionary
#         existing_other_details = json.loads(existing_other_details[0])

#         # Step 2: Update 'kafka_connect_details' in the existing data
#         existing_other_details['kafka_connect_details'] = kafka_connect_details

#         # Step 3: Update the 'other_details' column with the modified JSON
#         update_sql = text("""
#         UPDATE Connections
#         SET mapping_details = :mapping_details,
#             other_details = :other_details
#         WHERE user_id = :user_id
#         AND id = :connection_id
#         """)
        
#         connection.execute(update_sql, {
#             'user_id': user_id,
#             'connection_id': connection_id,
#             'mapping_details': json.dumps(mapping_details),
#             'other_details': json.dumps(existing_other_details)  # Convert updated Python dict to JSON string
#         })
#         connection.commit()

#         # Close connection and dispose of the engine
#         connection.close()
#         engine.dispose()

#         return jsonify({'success': True, 'message': 'Mapping details updated successfully'})

#     except SQLAlchemyError as e:
#         print("SQLAlchemyError:", e)
#         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

#     except Exception as e:
#         print("Exception:", e)
#         return jsonify({'success': False, 'message': str(e)}), 400
  
@connection_bp.route('/update_mapping', methods=['POST'])
def update_mapping():
    data = request.get_json()
    user_id = data["user_id"]
    connection_id = data["connection_id"]
    mapping_details = data["mappings_details"]
    connection_details = json.loads(data["connection_details"])

    kafka_connect_details = create_kafka_connect_details(user_id, connection_details, mapping_details, connection_id)

    try:
        engine = get_engine()
        connection = engine.connect()

        # Directly update the kafka_connect_details key in the JSON column
        update_sql = text("""
        UPDATE Connections
        SET mapping_details = :mapping_details,
            other_details = JSON_SET(other_details, '$.kafka_connect_details', CAST(:kafka_connect_details AS JSON))
        WHERE user_id = :user_id
        AND id = :connection_id
        """)
        
        connection.execute(update_sql, {
            'user_id': user_id,
            'connection_id': connection_id,
            'mapping_details': json.dumps(mapping_details),
            'kafka_connect_details': json.dumps(kafka_connect_details)  # Convert Kafka details to JSON string
        })
        connection.commit()
        connection.close()
        engine.dispose()

        return jsonify({'success': True, 'message': 'Mapping details updated successfully'})

    except SQLAlchemyError as e:
        print("SQLAlchemyError:", e)
        return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

    except Exception as e:
        print("Exception:", e)
        return jsonify({'success': False, 'message': str(e)}), 400
    
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 


@connection_bp.route("/delete_connection", methods = ["POST"])
def delete_connection():
    try:
        print("delete triggegred")
        data = request.get_json()
        user_id =  data["user_id"]
        connection_id = data["connection_id"]

        engine = get_engine()
        connection  = engine.connect()
        sql  = text(""" DELETE FROM Connections WHERE user_id = :user_id AND id =:id""")
        connection.execute(sql, {
            "user_id" : user_id,
            "id": connection_id
        })

        connection.commit()

        connection.close();
        engine.dispose();
        return jsonify({"success":True, "message" : "Successfully deleted" })
    
    except SQLAlchemyError as e:
         print("SQLAlchemyError:", e)
         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

    except Exception as e:
        print("error in delete_connection",  e)
        return jsonify({"success":False, "message" : str(e) }), 400
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 


# @connection_bp.route('/start_connection', methods=["POST"])
# def start_connection():
#     try:
#         data = request.get_json()
       
#         other_details = json.loads(data["other_details"])

#         kafka_connect_details = other_details["kafka_connect_details"]

#         url = "http://192.168.29.18:8083/connectors"

#         json_payload = json.dumps(kafka_connect_details)

#         headers = {
#             "Content-Type": "application/json"
#         }

#         response = requests.post(url, headers=headers, data=json_payload)

#         if response.status_code == 201:
#              print("response11111111111111", response)
#              update_status(data, "ACTIVE")
#              return jsonify({"success": True,  "status":"ACTIVE"}), 201
#             # update_status(data, "Active")
#             # return jsonify(response.json()), 201
#         else:
#             print("response.text", response.text)
#             return jsonify({"success": False, "data": json.loads(response.text)}), response.status_code 

#     except requests.exceptions.RequestException as e:
#         print("RequestsException:", str(e))
#         return jsonify({"success": False, "message": str(e)}), 500

#     except Exception as e:
#         print("Exception inside start_connection:", str(e))
#         return jsonify({"success": False, "message": str(e)}), 500
    
# def update_status(connection_data, status):
#     try:
#         # print("update status triggered... connection_data1111111111111111111", connection_data)
#         connection_id = connection_data["id"]
#         engine = get_engine();
#         connection = engine.connect()
#         sql = text("""UPDATE Connections 
#                       SET connector_status = :status 
#                       WHERE id = :connection_id""") 
               
#         connection.execute(sql, {
#             "status" : status,
#             "connection_id" : connection_id
#         })
#         connection.commit();
#         connection.close();
#         engine.dispose();        
#     except Exception as e:
#         print("error inside the update_status function", str(e))


@connection_bp.route("/get_connection/<connection_id>", methods=["GET"] )
def get_connection(connection_id):
    try:
        engine = get_engine()  # Assuming this is your own function to get the database engine
        connection = engine.connect()

        select_sql = text("""
        SELECT * FROM Connections WHERE id = :connection_id
        """)
        result = connection.execute(select_sql, {'connection_id': connection_id})

        row = result.fetchone()
        connection_info = {
                'id': row[0],
                'user_id': row[1],
                'connection_type': row[2],
                'connector_status': "NA",
                'created_at': str(row[3]),
                'updated_at': str(row[4]),
                'connection_details': (row[5]), 
                'mapping_details': (row[6]),
                'other_details' : (row[7]),
                "overall_status" : (row[8])
                # 'checked_boxes':json.loads(row[9])
                # 'connection_details': json.loads(row[6]),
                # 'mapping_details': json.loads(row[7])
        }
        connection.close()
        engine.dispose()
        return jsonify({'success': True, 
            'connection': connection_info, 
        })
    
    except SQLAlchemyError as e:
        # Handle SQLAlchemy errors
        print("get connection api issue:", e)
        return jsonify({'success': False, 'message': 'Database error. Failed to fetch connection.'}), 400

    except Exception as e:
        # Handle any other unexpected errors
        print("get connection api issue:", e)
        return jsonify({'success': False, 'message': str(e)}), 400
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 

# @connection_bp.route('/update_connection', methods=['POST'])
# def update_connection():
#     data = request.get_json()
#     try:
#         return jsonify({'success': True, 'message': 'connections details updated successfully'})

#     except SQLAlchemyError as e:
#         print("SQLAlchemyError:", e)
#         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

#     except Exception as e:
#         print("Exception:", e)
#         return jsonify({'success': False, 'message': str(e)}), 400


# @connection_bp.route('/save_connection', methods=['POST'])
# def save_connection():
#     data = request.get_json()
#     user_id = data["user_id"]
#     connection_type = data["connection_type"]
#     connection_details = data["connection_details"]
#     host = data['data']["host"]
#     port = data['data']['port']
#     username = data['data']['username']
#     password = data['data']['password']
#     database_type = data['data']['sourceDatabaseType']
#     database_name = data['data']["databaseName"]

#     try:
#         if database_type in DATABASE_ENGINES:

#             engine = get_engine() 
#             connection = engine.connect()

#             select_sql = text("""
#             SELECT COUNT(*) FROM connections 
#             WHERE user_id = :user_id 
#             AND database_type = :database_type 
#             AND host = :host 
#             AND port = :port 
#             AND username = :username 
#             AND database_name = :database_name
#             """)
#             result = connection.execute(select_sql, {
#                 'user_id': user_id,
#                 'database_type': database_type,
#                 'host': host,
#                 'port': port,
#                 'username': username,
#                 'database_name': database_name
#             })
#             count = result.scalar()

#             if count > 0:
#                 connection.close()
#                 engine.dispose()
#                 return jsonify({'success': False, 'message': 'Connection details already exist for this user'}), 400

#             # If the connection details do not exist, insert them
#             insert_sql = text("""
#             INSERT INTO connections (user_id, database_type, host, port, username, password, database_name)
#             VALUES (:user_id, :database_type, :host, :port, :username, :password, :database_name)
#             """)
#             connection.execute(insert_sql, {
#                 'user_id': user_id,
#                 'database_type': database_type,
#                 'host': host,
#                 'port': port,
#                 'username': username,
#                 'password': password,
#                 'database_name': database_name
#             })
#             connection.commit()

#             # Close connection and dispose of the engine
#             connection.close()
#             engine.dispose()


#             return jsonify({'success': True, 'message': 'Connection saved successfully', "schema": table_schema})

#         else:
#             return jsonify({'success': False, 'message': 'Unsupported database type'}), 400

#     except KeyError as e:
#         return jsonify({'success': False, 'message': f'Missing required parameter: {str(e)}'}), 400

#     except MySQLError as e:
#         error_message = str(e)
#         if "Can't connect to MySQL server" in error_message:
#             return jsonify({'success': False, 'message': 'Unable to connect to the database server. Please check your credentials and connection details.'}), 400
#         else:
#             return jsonify({'success': False, 'message': error_message}), 400

#     except SQLAlchemyError as e:
#         return jsonify({'success': False, 'message': 'Database error. Please check your connection details and try again.'}), 400

#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 400
    


# @connection_bp.route('/save_mapping', methods=['POST'])
# def save_mapping():
#     try:
#         response = request.get_json()
#         print("mapping json data: ", response)
        
#         user_id = response["user_id"]
#         database_details = response["data"]["databaseDetails"]
#         mapping = response["data"]["mappings"]

#         # Converting mapping to a JSON string
#         mapping_json = json.dumps(mapping)

#         engine = get_engine()  # Assuming this is your own function to get the database engine
#         connection = engine.connect()

#         query = text("""
#             UPDATE connections
#             SET mapping = :mapping
#             WHERE user_id = :user_id
#             AND host = :host
#             AND port = :port
#             AND username = :username
#             AND password = :password
#             AND database_name = :database_name
#             AND database_type = :database_type
#         """)
            
#         connection.execute(query, {
#             'mapping': mapping_json,
#             'user_id': user_id,
#             'host': database_details['host'],
#             'port': database_details['port'],
#             'username': database_details['username'],
#             'password': database_details['password'],
#             'database_name': database_details['databaseName'],
#             'database_type': database_details['sourceDatabaseType']
#         })

#         connection.commit()
#         connection.close()
#         engine.dispose()

#         return jsonify({'success': True, "message": "Mapping saved successfully"})

#     except KeyError as e:
#         return jsonify({'success': False, 'message': f'Missing required parameter: {str(e)}'}), 400

#     except SQLAlchemyError as e:
#         # Handle SQLAlchemy errors
#         print("Error inside save_mapping:", e)
#         return jsonify({'success': False, 'message': 'Database error. Failed to save mapping.'}), 400

#     except Exception as e:
#         # Handle any other unexpected errors
#         print("Error inside save_mapping:", e)
#         return jsonify({'success': False, 'message': str(e)}), 400