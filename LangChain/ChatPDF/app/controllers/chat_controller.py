from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from app.models.chat import ChatSession
from app.models.user import User
from app.models.message import Message
from app.extensions import db
from app.utils.utils import login_required

bp = Blueprint('chat_controller', __name__, url_prefix='/chat')



@bp.route('/<username>/<int:chat_id>')
@login_required
def view_chat(username, chat_id):
    """View a specific chat session"""
    # Get the user by username
    user = User.query.filter_by(username=username).first_or_404()
    
    # Get the chat session
    chat = ChatSession.query.filter_by(id=chat_id, user_id=user.id).first_or_404()
    
    # Check if the current user has access to this chat
    if chat.user_id != session['user_id']:
        flash('Unauthorized access to this chat!', 'error')
        return redirect(url_for('dashboard.dashboard_view'))
    
    # Get all messages for this chat
    messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.timestamp.asc()).all()
    
    return render_template('chat/chat_session.html', chat=chat, messages=messages, user=user)

@bp.route('/<username>/<int:chat_id>/send_message', methods=['POST'])
@login_required
def send_message(username, chat_id):
    """Send a message in the chat"""
    # Get the user by username
    user = User.query.filter_by(username=username).first_or_404()
    
    # Get the chat session
    chat = ChatSession.query.filter_by(id=chat_id, user_id=user.id).first_or_404()
    
    # Check if the current user has access to this chat
    if chat.user_id != session['user_id']:
        flash('Unauthorized access to this chat!', 'error')
        return redirect(url_for('dashboard.dashboard_view'))
    
    user_input = request.form.get('user_input', '').strip()
    
    if not user_input:
        flash('Please enter a message!', 'error')
        return redirect(url_for('chat_controller.view_chat', username=username, chat_id=chat_id))
    
    # Save user message
    user_message = Message(
        role='user',
        content=user_input,
        chat_id=chat_id
    )
    db.session.add(user_message)
    
    # TODO: Process the message with AI/LangChain and generate response
    # For now, we'll create a simple echo response
    ai_response = f"I received your message: '{user_input}'. AI processing will be implemented here."
    
    # Save AI response
    ai_message = Message(
        role='assistant',
        content=ai_response,
        chat_id=chat_id
    )
    db.session.add(ai_message)
    
    db.session.commit()
    
    return redirect(url_for('chat_controller.view_chat', username=username, chat_id=chat_id))

@bp.route('/<username>/<int:chat_id>/api/messages')
@login_required
def get_messages_api(username, chat_id):
    """API endpoint to get messages for real-time updates"""
    # Get the user by username
    user = User.query.filter_by(username=username).first_or_404()
    
    # Get the chat session
    chat = ChatSession.query.filter_by(id=chat_id, user_id=user.id).first_or_404()
    
    # Check if the current user has access to this chat
    if chat.user_id != session['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all messages for this chat
    messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.timestamp.asc()).all()
    
    messages_data = []
    for message in messages:
        messages_data.append({
            'id': message.id,
            'role': message.role,
            'content': message.content,
            'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify({'messages': messages_data})
