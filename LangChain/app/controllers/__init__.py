"""
Blueprint registration module.
Imports and registers all application blueprints.
"""
from app.controllers.auth import auth_bp
from app.controllers.chat import chat_bp
from app.controllers.file_upload import file_upload_bp
from app.controllers.settings import settings_bp
from flask import render_template


def register_blueprints(app):
    """
    Register all application blueprints with the Flask app.
    
    Args:
        app (Flask): Flask application instance
    """
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(file_upload_bp, url_prefix='/files')
    app.register_blueprint(settings_bp, url_prefix='/settings')
    
    # Home route
    @app.route('/')
    def index():
        """Home page route."""
        return render_template('index.html')
