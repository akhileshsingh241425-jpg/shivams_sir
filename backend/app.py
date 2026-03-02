"""Solar Panel PM Tracker - Flask Application"""
from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from routes import api
from seed import seed_from_excel


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app)
    db.init_app(app)

    # Register blueprints
    app.url_prefix = '/api'
    app.register_blueprint(api, url_prefix='/api')

    # Create tables and seed
    with app.app_context():
        db.create_all()
        seed_from_excel(app)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
