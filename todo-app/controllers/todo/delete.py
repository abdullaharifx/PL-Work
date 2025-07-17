from flask import Blueprint, redirect, url_for, session, flash
from models.todo import Todo
from app import db
from controllers.auth.utils import login_required

bp = Blueprint('delete', __name__, url_prefix='/delete')

@bp.route('/<int:todo_id>')
@login_required
def delete_view(todo_id):
    todo = Todo.query.get_or_404(todo_id)

    if todo.user_id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('dashboard.dashboard_view'))

    db.session.delete(todo)
    db.session.commit()

    flash('Todo deleted successfully!', 'success')
    return redirect(url_for('dashboard.dashboard_view'))
