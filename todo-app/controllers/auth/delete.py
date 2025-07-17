from flask import Blueprint,render_template, redirect, url_for, flash, request
from utils import login_required, current_user
from models.user import User
from app import db

bp = Blueprint('delete', __name__, url_prefix='/delete')
@bp.route('/delete/<int:user_id>', methods=['GET', 'POST'])
@login_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)

    # Optional: only allow the logged-in user to delete themselves
    if current_user.id != user_id:
        flash("You can only delete your own account.", "danger")
        return redirect(url_for('dashboard'))  # Or wherever

    if request.method == 'POST':
        db.session.delete(user)
        db.session.commit()
        flash("Your account has been deleted.", "success")
        return redirect(url_for('logout'))

    # Show confirmation page before deletion
    return render_template('user/delete.html', user=user)
