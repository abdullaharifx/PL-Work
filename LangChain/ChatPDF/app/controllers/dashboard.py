from flask import Blueprint, render_template, request, session
from app.models.chat import Todo
from app.utils import login_required

bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@bp.route('/')
@login_required
def dashboard_view():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)

    query = Todo.query.filter_by(user_id=session['user_id'])

    if search:
        query = query.filter(
            (Todo.title.contains(search)) |
            (Todo.description.contains(search))
        )

    todos = query.order_by(Todo.created_at.desc()).paginate(
        page=page, per_page=5, error_out=False
    )

    return render_template('todo/dashboard.html', todos=todos, search=search)
