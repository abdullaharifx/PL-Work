import os
from flask import Flask, app, render_template
from flask_sqlalchemy import SQLAlchemy
from .extensions import db
from .controllers import register_routes  # will create this below
import os
import dotenv
from config import DevelopmentConfig

dotenv.load_dotenv()


# from controllers import login, logout
from app.controllers import register_routes
def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__,
                template_folder='templates',
                static_folder='static',
                instance_relative_config=True)

    # --- Config ---
    app.config.from_object(config_class)


    

    # --- Extensions ---
    db.init_app(app)

    # --- Register Blueprints ---
        
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/chat/<int:chat_id>")
    def chat(chat_id):
        # TODO: Render chat page for chat_id
        return f"Chat page for chat ID: {chat_id}"

    @app.route("/upload", methods=["GET", "POST"])
    def upload():
        # TODO: Handle file upload
        return "Upload page"

    @app.route("/new_chat", methods=["GET", "POST"])
    def new_chat():
        # TODO: Create a new chat
        return "New chat page"

    with app.app_context():        
        db.create_all()

    return app
