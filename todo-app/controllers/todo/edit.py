from flask import Blueprint, render_template, request, redirect, session, flash, url_for
from models.todo import Todo
from app import db
from controllers.auth.utils import login_required

bp = Blueprint('todo_edit', __name__, url_prefix='/todo')  # ✅ UNIQUE name

@bp.route('/edit/<int:todo_id>', methods=['GET', 'POST'])
@login_required
def edit_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)

    if todo.user_id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('todo_dashboard.dashboard'))

    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']

        if not (title and description):
            flash('Both fields are required!', 'error')
            return render_template('edit_todo.html', todo=todo)

        todo.title = title
        todo.description = description
        db.session.commit()

        flash('Todo updated!', 'success')
        return redirect(url_for('todo_dashboard.dashboard'))

    return render_template('edit_todo.html', todo=todo)
