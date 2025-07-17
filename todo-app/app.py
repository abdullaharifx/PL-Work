from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import user, todo  # ensures models are registered

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config")

    db.init_app(app)

    from controllers import register_blueprints
    register_blueprints(app)

    with app.app_context():
        
        db.create_all()

    return app
