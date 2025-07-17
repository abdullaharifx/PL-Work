
from flask import Blueprint, render_template, request, redirect, session, flash, url_for
from models.todo import Todo
from app import db
from controllers.auth.utils import login_required  # ✅ Import directly
from models.todo import Todo
bp = Blueprint('dashboard', __name__, url_prefix='')

@bp.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard showing user's todos"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)
    
    # Build query
    query = Todo.query.filter_by(user_id=session['user_id'])
    
    # Apply search filter
    if search:
        query = query.filter(
            (Todo.title.contains(search)) | 
            (Todo.description.contains(search))
        )
    
    # Paginate results
    todos = query.order_by(Todo.created_at.desc()).paginate(
        page=page, per_page=5, error_out=False
    )
    
    return render_template('dashboard.html', todos=todos, search=search)