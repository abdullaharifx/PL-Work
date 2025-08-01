"""
Settings blueprint.
Handles user preferences, prompt templates, and application configuration.
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from app.langchain_pipeline import ChatPipeline

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/')
@login_required
def index():
    """
    Settings dashboard showing all configuration options.
    """
    chat_pipeline = ChatPipeline()
    available_templates = chat_pipeline.get_available_templates()
    
    # Get current user statistics
    pdf_count = len(current_user.pdf_documents)
    chat_count = len([s for s in current_user.chat_sessions if s.is_active])
    
    stats = {
        'pdf_count': pdf_count,
        'chat_count': chat_count,
        'total_messages': sum(len(s.messages) for s in current_user.chat_sessions if s.is_active)
    }
    
    return render_template('settings/index.html', 
                         templates=available_templates, 
                         stats=stats)


@settings_bp.route('/templates')
@login_required
def templates():
    """
    Prompt template management page.
    """
    chat_pipeline = ChatPipeline()
    available_templates = chat_pipeline.get_available_templates()
    template_content = chat_pipeline.prompt_templates
    
    return render_template('settings/templates.html', 
                         templates=available_templates,
                         template_content=template_content)


@settings_bp.route('/api/get_template/<template_type>')
@login_required
def get_template(template_type):
    """
    API endpoint to get template content.
    
    Args:
        template_type (str): Template type to retrieve
    """
    chat_pipeline = ChatPipeline()
    
    if template_type not in chat_pipeline.prompt_templates:
        return jsonify({'error': 'Template not found'}), 404
    
    return jsonify({
        'template': chat_pipeline.prompt_templates[template_type],
        'description': chat_pipeline.get_available_templates().get(template_type, '')
    })


@settings_bp.route('/api/test_template', methods=['POST'])
@login_required
def test_template():
    """
    API endpoint to test a custom prompt template.
    """
    try:
        data = request.get_json()
        template = data.get('template', '').strip()
        test_question = data.get('question', 'What is the main topic discussed?')
        
        if not template:
            return jsonify({'error': 'Template content is required'}), 400
        
        # Validate template has required variables
        if '{context}' not in template or '{question}' not in template:
            return jsonify({
                'error': 'Template must contain {context} and {question} placeholders'
            }), 400
        
        # Test the template with sample data
        chat_pipeline = ChatPipeline()
        
        # Generate a test response (this would use actual user data in practice)
        response_data = chat_pipeline.generate_response(
            question=test_question,
            user_id=current_user.id,
            custom_template=template
        )
        
        return jsonify({
            'success': True,
            'response': response_data['content'][:200] + '...' if len(response_data['content']) > 200 else response_data['content'],
            'sources_count': len(response_data['sources'])
        })
        
    except Exception as e:
        return jsonify({'error': f'Template test failed: {str(e)}'}), 500


@settings_bp.route('/account')
@login_required
def account():
    """
    Account settings and information page.
    """
    # Calculate account statistics
    total_pdfs = len(current_user.pdf_documents)
    processed_pdfs = len([doc for doc in current_user.pdf_documents if doc.processed])
    total_chats = len([s for s in current_user.chat_sessions if s.is_active])
    total_messages = sum(len(s.messages) for s in current_user.chat_sessions if s.is_active)
    
    # Calculate storage usage
    total_storage = sum(doc.file_size or 0 for doc in current_user.pdf_documents)
    
    account_info = {
        'username': current_user.username,
        'email': current_user.email,
        'member_since': current_user.created_at.strftime('%B %d, %Y'),
        'total_pdfs': total_pdfs,
        'processed_pdfs': processed_pdfs,
        'total_chats': total_chats,
        'total_messages': total_messages,
        'storage_used': format_storage_size(total_storage)
    }
    
    return render_template('settings/account.html', account_info=account_info)


@settings_bp.route('/help')
@login_required
def help():
    """
    Help and documentation page.
    """
    return render_template('settings/help.html')


def format_storage_size(size_bytes):
    """
    Format storage size in human-readable format.
    
    Args:
        size_bytes (int): Size in bytes
        
    Returns:
        str: Formatted size string
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"
