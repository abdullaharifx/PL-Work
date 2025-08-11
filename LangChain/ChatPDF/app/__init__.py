import os
from flask import Flask, app, render_template
from flask_sqlalchemy import SQLAlchemy

from .extensions import db
import dotenv
from config.config import DevelopmentConfig

from markdown import markdown
import re
from markupsafe import Markup


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
        edit,
        create,
        delete,
        chat_controller,
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
    app.register_blueprint(chat_controller.bp)
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

    
    @app.template_filter('markdownify')
    def markdownify(text):
        return Markup(markdown(text))

    @app.template_filter('format_message')
    def format_message(content):
        # Convert **bold** to <strong> and preserve line breaks
        formatted = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
        formatted = formatted.replace('\n', '<br>')
        return Markup(formatted)
    

    # --- Extensions ---
    db.init_app(app)

    # --- Register Blueprints ---
        
    @app.route("/")
    def index():
        return render_template("./index.html")
    


    register_routes(app)



    @app.route("/upload", methods=["GET", "POST"])
    def upload():
        # TODO: Handle file upload
        return render_template("file_upload/upload.html")

    @app.route("/new_chat", methods=["GET", "POST"])
    def new_chat():
        # TODO: Create a new chat
        return render_template("chat/new_chat.html")

    with app.app_context():
        # Import all models to ensure they're registered with SQLAlchemy
        from . import models        
        db.create_all()

    return app
