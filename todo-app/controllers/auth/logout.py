from flask import Blueprint, redirect, url_for, flash, session

bp = Blueprint('logout', __name__, url_prefix='')


@bp.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))
