# from app import db
# from werkzeug.security import generate_password_hash, check_password_hash
# from datetime import datetime

# class User(db.Model):
#     """User model for authentication and todo ownership"""
    
#     id = db.Column(db.Integer, primary_key=True)
#     username = db.Column(db.String(50), unique=True, nullable=False)
#     email = db.Column(db.String(50), unique=True, nullable=False)
#     password_hash = db.Column(db.String(200), nullable=False)
    
#     # Relationship to todos (one-to-many)
#     todos = db.relationship('Todo', backref='user', lazy=True, cascade='all, delete-orphan')
    
#     def set_password(self, password):
#         """Hash and store password securely"""
#         self.password_hash = generate_password_hash(password)
    
#     def check_password(self, password):
#         """Check if provided password matches stored hash"""
#         return check_password_hash(self.password_hash, password)
    
#     def __repr__(self):
#         return f'<User {self.username}>'

# class Todo(db.Model):
#     """Todo model representing individual tasks"""
    
#     id = db.Column(db.Integer, primary_key=True)
#     title = db.Column(db.String(50), nullable=False)
#     description = db.Column(db.String(150), nullable=False)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
#     # Foreign key to user
#     user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
#     def __repr__(self):
#         return f'<Todo {self.title}>'
