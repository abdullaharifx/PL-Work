from flask import Blueprint, redirect, url_for, session, flash

bp = Blueprint('logout', __name__, url_prefix='/logout')

@bp.route('/')
def logout_view():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index.home'))
