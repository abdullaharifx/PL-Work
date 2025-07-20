# # app.py
# from flask import Flask
# from app.extensions import db
# import os

# from controllers import login, logout



# def create_app():
#     app = Flask(__name__,
#             template_folder='templates',
#             static_folder='static',
#             instance_relative_config=True)

#     # --- [ 1. Setup paths ] ---
#     basedir = os.path.abspath(os.path.dirname(__file__))
#     db_dir = os.path.join(basedir, 'instance')
#     db_path = os.path.join(db_dir, 'todo.db')

#     # Make sure the instance folder exists
#     os.makedirs(db_dir, exist_ok=True)

#     # --- [ 2. Configurations ] ---
#     app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
#     app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
#     app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

#     # --- [ 3. Initialize DB ] ---
#     db.init_app(app)
    

#     # from models import user, todo  # ensure models are imported

#     with app.app_context():
#         db.create_all()

#     # --- [ 4. Register Blueprints ] ---
#     from controllers import index, profile
#     from controllers import register
#     from controllers import dashboard, create, delete, edit

#     app.register_blueprint(index.bp)
#     app.register_blueprint(profile.bp)
#     app.register_blueprint(login.bp)
#     app.register_blueprint(register.bp)
#     app.register_blueprint(logout.bp)
#     app.register_blueprint(dashboard.bp)
#     app.register_blueprint(create.bp)
#     app.register_blueprint(delete.bp)
#     app.register_blueprint(edit.bp)

#     return app
