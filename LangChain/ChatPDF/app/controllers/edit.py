from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from app.models.chat import Todo
from app import db
from app.utils.utils import login_required

bp = Blueprint('edit', __name__, url_prefix='/edit')

@bp.route('/<int:todo_id>', methods=['GET', 'POST'])
@login_required
def edit_view(todo_id):
    todo = Todo.query.get_or_404(todo_id)

    if todo.user_id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('dashboard.dashboard_view'))

    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']

        if not title or not description:
            flash('Both title and description are required!', 'error')
            return render_template('todo/edit.html', todo=todo)

        todo.title = title
        todo.description = description
        db.session.commit()

        flash('Todo updated successfully!', 'success')
        return redirect(url_for('dashboard.dashboard_view'))

    return render_template('todo/edit.html', todo=todo)
