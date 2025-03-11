from flask import Flask
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.connection_routes import connection_bp
from routes.kafka_connect_routes import kafka_connect_bp
from routes.destinations_routes import destinations_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(connection_bp, url_prefix="/connection")
app.register_blueprint(kafka_connect_bp,  url_prefix="/kafka_connect")
app.register_blueprint(destinations_bp,  url_prefix="/destinations")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002, debug=True)