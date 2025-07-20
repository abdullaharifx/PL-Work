import os
from flask import Flask
from .extensions import db
from .controllers import register_routes  # will create this below
import os

# from controllers import login, logout
from app.controllers import register_routes
def create_app():
    app = Flask(__name__,
                template_folder='templates',
                static_folder='static',
                instance_relative_config=True)

    # --- Config ---
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_dir = os.path.join(basedir, '../instance')  # Go up one level
    os.makedirs(db_dir, exist_ok=True)
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(db_dir, "todo.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- Extensions ---
    db.init_app(app)

    # --- Register Blueprints ---
    register_routes(app)

    with app.app_context():        
        db.create_all()

    return app
