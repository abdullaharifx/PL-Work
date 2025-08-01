"""
Chat blueprint.
Handles chat sessions, message management, and AI conversation flow.
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from app.models.chat import ChatSession, ChatMessage
from app.models.pdf import PDFDocument
from app.extensions import db
from app.langchain_pipeline import ChatPipeline
import json

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/')
@login_required
def index():
    """
    Chat dashboard showing all user's chat sessions.
    """
    sessions = ChatSession.query.filter_by(user_id=current_user.id, is_active=True)\
                              .order_by(ChatSession.updated_at.desc()).all()
    
    # Check if user has any PDFs
    pdf_count = PDFDocument.query.filter_by(user_id=current_user.id, processed=True).count()
    
    return render_template('chat/index.html', sessions=sessions, pdf_count=pdf_count)


@chat_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new_session():
    """
    Create a new chat session.
    """
    if request.method == 'POST':
        session_name = request.form.get('session_name', '').strip()
        
        if not session_name:
            flash('Please enter a session name.', 'error')
            return render_template('chat/new_session.html')
        
        # Check for duplicate names
        existing = ChatSession.query.filter_by(
            user_id=current_user.id, 
            name=session_name, 
            is_active=True
        ).first()
        
        if existing:
            flash('A session with this name already exists.', 'error')
            return render_template('chat/new_session.html')
        
        try:
            # Create new session
            session = ChatSession(
                name=session_name,
                user_id=current_user.id
            )
            
            db.session.add(session)
            db.session.commit()
            
            flash(f'Chat session "{session_name}" created successfully!', 'success')
            return redirect(url_for('chat.session', session_id=session.id))
            
        except Exception as e:
            db.session.rollback()
            flash('Failed to create chat session. Please try again.', 'error')
    
    return render_template('chat/new_session.html')


@chat_bp.route('/session/<int:session_id>')
@login_required
def session(session_id):
    """
    Display chat session interface.
    
    Args:
        session_id (int): Chat session ID
    """
    session = ChatSession.query.filter_by(
        id=session_id, 
        user_id=current_user.id, 
        is_active=True
    ).first()
    
    if not session:
        flash('Chat session not found.', 'error')
        return redirect(url_for('chat.index'))
    
    # Get messages for this session
    messages = session.messages
    
    # Check if user has processed PDFs
    pdf_count = PDFDocument.query.filter_by(user_id=current_user.id, processed=True).count()
    
    return render_template('chat/session.html', 
                         session=session, 
                         messages=messages, 
                         pdf_count=pdf_count)


@chat_bp.route('/api/send_message', methods=['POST'])
@login_required
def send_message():
    """
    API endpoint for sending chat messages.
    Returns JSON response for HTMX updates.
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        message_content = data.get('message', '').strip()
        template_type = data.get('template_type', 'default')
        
        if not session_id or not message_content:
            return jsonify({'error': 'Missing session ID or message content'}), 400
        
        # Verify session ownership
        session = ChatSession.query.filter_by(
            id=session_id, 
            user_id=current_user.id, 
            is_active=True
        ).first()
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        # Check if user has processed PDFs
        pdf_count = PDFDocument.query.filter_by(user_id=current_user.id, processed=True).count()
        if pdf_count == 0:
            return jsonify({
                'error': 'No processed PDFs found. Please upload and process some PDF documents first.'
            }), 400
        
        # Save user message
        user_message = ChatMessage(
            session_id=session_id,
            content=message_content,
            is_user=True
        )
        db.session.add(user_message)
        
        # Generate AI response
        chat_pipeline = ChatPipeline()
        response_data = chat_pipeline.generate_response(
            question=message_content,
            user_id=current_user.id,
            template_type=template_type
        )
        
        # Save AI response
        ai_message = ChatMessage(
            session_id=session_id,
            content=response_data['content'],
            is_user=False,
            sources=json.dumps(response_data['sources']) if response_data['sources'] else None
        )
        db.session.add(ai_message)
        
        # Update session timestamp
        session.updated_at = db.func.current_timestamp()
        
        db.session.commit()
        
        # Format sources for display
        sources_formatted = []
        if response_data['sources']:
            for source in response_data['sources']:
                sources_formatted.append({
                    'document': source['document_name'],
                    'page': source['page_number'],
                    'relevance': f"{source['score']:.2f}"
                })
        
        return jsonify({
            'success': True,
            'user_message': {
                'id': user_message.id,
                'content': user_message.content,
                'timestamp': user_message.created_at.strftime('%H:%M')
            },
            'ai_message': {
                'id': ai_message.id,
                'content': ai_message.content,
                'sources': sources_formatted,
                'timestamp': ai_message.created_at.strftime('%H:%M')
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500


@chat_bp.route('/delete/<int:session_id>', methods=['POST'])
@login_required
def delete_session(session_id):
    """
    Delete a chat session.
    
    Args:
        session_id (int): Session ID to delete
    """
    session = ChatSession.query.filter_by(
        id=session_id, 
        user_id=current_user.id
    ).first()
    
    if not session:
        flash('Chat session not found.', 'error')
        return redirect(url_for('chat.index'))
    
    try:
        # Soft delete - mark as inactive
        session.is_active = False
        db.session.commit()
        
        flash(f'Chat session "{session.name}" deleted successfully.', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Failed to delete chat session.', 'error')
    
    return redirect(url_for('chat.index'))


@chat_bp.route('/rename/<int:session_id>', methods=['POST'])
@login_required
def rename_session(session_id):
    """
    Rename a chat session.
    
    Args:
        session_id (int): Session ID to rename
    """
    session = ChatSession.query.filter_by(
        id=session_id, 
        user_id=current_user.id, 
        is_active=True
    ).first()
    
    if not session:
        flash('Chat session not found.', 'error')
        return redirect(url_for('chat.index'))
    
    new_name = request.form.get('new_name', '').strip()
    
    if not new_name:
        flash('Please enter a valid session name.', 'error')
        return redirect(url_for('chat.session', session_id=session_id))
    
    # Check for duplicate names
    existing = ChatSession.query.filter_by(
        user_id=current_user.id, 
        name=new_name, 
        is_active=True
    ).filter(ChatSession.id != session_id).first()
    
    if existing:
        flash('A session with this name already exists.', 'error')
        return redirect(url_for('chat.session', session_id=session_id))
    
    try:
        session.name = new_name
        db.session.commit()
        
        flash(f'Session renamed to "{new_name}" successfully.', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Failed to rename session.', 'error')
    
    return redirect(url_for('chat.session', session_id=session_id))


@chat_bp.route('/api/get_templates')
@login_required
def get_templates():
    """
    API endpoint to get available prompt templates.
    """
    chat_pipeline = ChatPipeline()
    templates = chat_pipeline.get_available_templates()
    
    return jsonify({
        'templates': [
            {'key': key, 'name': name} 
            for key, name in templates.items()
        ]
    })
