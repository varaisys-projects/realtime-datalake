from flask import Blueprint, jsonify, request
from .db import get_engine
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('emailAddress')
        password = data.get('password')

        engine = get_engine()
        connection = engine.connect()

        sql = text("SELECT * FROM users WHERE email = :email AND password = :password")
        result = connection.execute(sql, {'email': email, 'password': password}) 
        user = result.fetchone()

        connection.close()
        engine.dispose()

        if user:
            return jsonify({'message': 'Login successful', "user": {"user_id": user[0], "email": user[1], "name": user[3]}}), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401

    except SQLAlchemyError as e:
        # Handle SQLAlchemy errors
        print("SQLAlchemy error inside login api:", e)
        return jsonify({'error': 'Database error. Failed to perform login.'}), 500

    except Exception as e:
        # Handle any other unexpected errors
        print("Exception inside login api:", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 


@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('emailAddress')
        password = data.get('password')

        engine = get_engine()
        connection = engine.connect()

        # Check if the user already exists
        check_sql = text("SELECT COUNT(*) FROM users WHERE email = :email")
        result = connection.execute(check_sql, {'email': email})
        if result.scalar() > 0:
            connection.close()
            engine.dispose()
            return jsonify({'message': 'User already exists'}), 400
        
        # Insert new user
        insert_sql = text("INSERT INTO users (name, email, password) VALUES (:name, :email, :password)")
        connection.execute(insert_sql, {'name': name, 'email': email, 'password': password})
        connection.commit()
        connection.close()
        engine.dispose()

        return jsonify({'message': 'Signup successful'}), 201

    except SQLAlchemyError as e:
        # Handle SQLAlchemy errors
        print("SQLAlchemy error inside signup api:", e)
        return jsonify({'error': 'Database error. Failed to perform signup.'}), 500

    except Exception as e:
        # Handle any other unexpected errors
        print("Exception inside signup api:", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if connection is not None:
            connection.close()
    
        if engine is not None:
            engine.dispose() 
