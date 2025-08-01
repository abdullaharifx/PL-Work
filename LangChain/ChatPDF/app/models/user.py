# models/user.py
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from app.extensions import db  # Assuming you use flask_sqlalchemy 

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    password_hash = db.Column(db.String(200), nullable=False)
    chats = db.relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")

    todos = db.relationship('Todo', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'
