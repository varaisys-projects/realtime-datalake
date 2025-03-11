from sqlalchemy import create_engine

# Database configuration
db_host = '192.168.29.18'
db_port = '3336'
db_user = 'ajay'
db_password = 'Varaisys!123'
db_name = 'ajay_test'


def get_engine():
    try:
        # Returns the engine    
        DATABASE_URL = f"mysql+mysqlconnector://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        engine = create_engine(DATABASE_URL)
        return engine
    except Exception as e:
        engine.dispose()
        print("error in get_engine insde db.py", e)
        return None