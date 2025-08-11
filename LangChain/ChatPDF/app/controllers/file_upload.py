import os
# session
from flask import session
from flask import (
    Blueprint, request, render_template, current_app, redirect, url_for, flash, send_from_directory
)
from werkzeug.utils import secure_filename
from app.models.pdf import PDF
from app.extensions import db
from app.utils.pdf_processing import process_new_pdf



bp = Blueprint('file_upload', __name__, url_prefix='/upload')

UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'app/data')
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/submit', methods=['POST'])
def upload_file():
    if 'pdf_file' not in request.files:
        flash('No file part', 'error')
        return redirect(request.referrer)

    files = request.files.getlist('pdf_file')  # Support multiple files
    chat_id = request.form.get('chat_id')

    if not chat_id:
        flash('No chat specified', 'error')
        return redirect(request.referrer)

    if not files or all(file.filename == '' for file in files):
        flash('No files selected', 'error')
        return redirect(request.referrer)

    # Ensure upload directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    uploaded_count = 0

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Save file
            file.save(filepath)

            # Save metadata in DB
            pdf = PDF(filename=filename, chat_id=int(chat_id), user_id=session.get('user_id'))
            pdf.file_path = filepath  # Store the full file path
            db.session.add(pdf)
            db.session.commit()

            # Process the PDF with RAG
            success = process_new_pdf(pdf.id, int(chat_id))
            
            if success:
                uploaded_count += 1
            else:
                flash(f'Error processing {filename}', 'error')

    if uploaded_count > 0:
        flash(f'{uploaded_count} PDF(s) uploaded and processed successfully!', 'success')
    
    # Get user for redirect
    from app.models.user import User
    user = User.query.get(session.get('user_id'))
    
    return redirect(url_for('chat_controller.view_chat', 
                          username=user.username, 
                          chat_id=chat_id))


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
