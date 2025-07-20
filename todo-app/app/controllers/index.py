# controllers/index.py

from flask import Blueprint, render_template, redirect, url_for, session

bp = Blueprint('index', __name__, url_prefix='')

@bp.route('/')
def home():
    # If user is already logged in, redirect to dashboard
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard_view'))
    return render_template('index.html')
