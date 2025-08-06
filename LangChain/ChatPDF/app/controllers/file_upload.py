import os
# session
from flask import session
from flask import (
    Blueprint, request, render_template, current_app, redirect, url_for, flash, send_from_directory
)
from werkzeug.utils import secure_filename
from app.models.pdf import PDF
from app.extensions import db
from app.utils.pdf_processing import process_pdf_file

bp = Blueprint('file_upload', __name__, url_prefix='/upload')

UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../../uploads')
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/submit', methods=['POST'])
def upload_file():
    if 'pdf_file' not in request.files:
        flash('No file part')
        return redirect(request.url)

    files = [request.files['pdf_file']]  # Wrap single file in a list

    chat_id = request.form.get('chat_id')  # Get chat to associate upload with

    if not chat_id:
        flash('No chat specified')
        return redirect(request.url)

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # Save metadata in DB
            pdf = PDF(filename=filename, chat_id=int(chat_id), user_id=session.get('user_id'))
            db.session.add(pdf)
            db.session.commit()

            # Process the PDF file
            #process_pdf_file(filepath, chat_id, pdf.id)

    flash('PDF(s) uploaded successfully!')
    return redirect(url_for('chat_controller.view_chat', chat_id=chat_id, username=session.get('username')))


@bp.route('/<int:chat_id>', methods=['GET'])
def upload_view(chat_id):
    return render_template('file_upload/upload.html', chat_id=chat_id)


@bp.route('/view/<int:pdf_id>', methods=['GET'])
def view_pdf(pdf_id):
    pdf = PDF.query.get_or_404(pdf_id)
    filepath = os.path.join(UPLOAD_FOLDER, pdf.filename)

    if not os.path.exists(filepath):
        flash('PDF file not found.')
        return redirect(request.referrer or url_for('chat.view_chat', chat_id=pdf.chat_id))

    return send_from_directory(os.path.abspath(UPLOAD_FOLDER), pdf.filename)
