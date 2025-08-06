import os
from flask import Flask, app, render_template
from flask_sqlalchemy import SQLAlchemy
from .extensions import db
import dotenv
from config.config import DevelopmentConfig

dotenv.load_dotenv()
# import blueprints and register routes
  
def register_routes(app):
    from .controllers import (
        index,
        login,
        logout,
        register,
        profile,
        dashboard,
        create,
        delete,
        edit,
        file_upload
    )

    app.register_blueprint(index.bp)
    app.register_blueprint(login.bp)
    app.register_blueprint(logout.bp)
    app.register_blueprint(register.bp)
    app.register_blueprint(profile.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(create.bp)
    app.register_blueprint(delete.bp)
    app.register_blueprint(edit.bp)
    app.register_blueprint(file_upload.bp)
    return app

# from controllers import login, logout
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
        return render_template("./index.html")
    

    
    register_routes(app)



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
