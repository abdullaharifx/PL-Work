"""
Chat session and message models.
Handles chat session management and message history storage.
"""
from datetime import datetime
from app.extensions import db


class ChatSession(db.Model):
    """
    Chat session model for organizing conversations.
    
    Attributes:
        id (int): Primary key
        name (str): User-defined session name
        user_id (int): Foreign key to User
        created_at (datetime): Session creation timestamp
        updated_at (datetime): Last message timestamp
        is_active (bool): Session status
    """
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='session', lazy=True, 
                             cascade='all, delete-orphan', order_by='ChatMessage.created_at')
    
    def get_recent_messages(self, limit=10):
        """
        Get recent messages from this session.
        
        Args:
            limit (int): Maximum number of messages to return
            
        Returns:
            list: List of ChatMessage objects
        """
        return ChatMessage.query.filter_by(session_id=self.id)\
                               .order_by(ChatMessage.created_at.desc())\
                               .limit(limit).all()
    
    def __repr__(self):
        return f'<ChatSession {self.name}>'


class ChatMessage(db.Model):
    """
    Individual chat message model.
    
    Attributes:
        id (int): Primary key
        session_id (int): Foreign key to ChatSession
        content (str): Message content
        is_user (bool): True if user message, False if AI response
        sources (str): JSON string of source page numbers
        created_at (datetime): Message timestamp
    """
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_user = db.Column(db.Boolean, nullable=False)
    sources = db.Column(db.Text)  # JSON string of source page numbers and documents
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        msg_type = "User" if self.is_user else "AI"
        return f'<ChatMessage {msg_type}: {self.content[:50]}...>'
