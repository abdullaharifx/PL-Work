import os
from flask import Blueprint, request, render_template, current_app, redirect, url_for, flash
from werkzeug.utils import secure_filename
from app.models.pdf import PDF
from app.extensions import db
from app.utils.pdf_preprocessing import process_pdf_file

bp  = Blueprint('file_upload', __name__, url_prefix='/upload')

UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../../uploads')
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'pdf_files' not in request.files:
            flash('No file part')
            return redirect(request.url)
        
        files = request.files.getlist('pdf_files')
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
                pdf = PDF(filename=filename, chat_id=int(chat_id))
                db.session.add(pdf)
                db.session.commit()
                # Process the PDF file
                process_pdf_file(filepath, pdf.id)
                



        flash('PDF(s) uploaded successfully!')
        return redirect(url_for('chat.view_chat', chat_id=chat_id))

    # GET request - render upload form
    return render_template('file_upload/upload.html') 
