from flask import Blueprint, render_template, request, session
from app.models.chat import ChatSession
from app.utils.utils import login_required

bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@bp.route('/')
@login_required
def dashboard_view():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)

    query = ChatSession.query.filter_by(user_id=session['user_id'])

    if search:
        query = query.filter(
            (ChatSession.title.contains(search)) |
            (ChatSession.description.contains(search))
        )

    Chats = query.order_by(ChatSession.created_at.desc()).paginate(
        page=page, per_page=5, error_out=False
    )

    return render_template('layout/dashboard.html', Chats=Chats, search=search)
