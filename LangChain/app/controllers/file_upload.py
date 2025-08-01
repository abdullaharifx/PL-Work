"""
File upload blueprint.
Handles PDF upload, processing, and management functionality.
"""
import os
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app.models.pdf import PDFDocument, PDFChunk
from app.models.user import User
from app.extensions import db
from app.utils import (
    extract_text_from_pdf, chunk_text, generate_unique_filename, 
    allowed_file, get_file_size, format_file_size
)
from app.langchain_pipeline import VectorStore

file_upload_bp = Blueprint('file_upload', __name__)


@file_upload_bp.route('/')
@login_required
def index():
    """
    File management dashboard.
    Shows all uploaded PDFs for the current user.
    """
    documents = PDFDocument.query.filter_by(user_id=current_user.id)\
                                .order_by(PDFDocument.upload_date.desc()).all()
    
    # Calculate statistics
    total_files = len(documents)
    total_size = sum(doc.file_size or 0 for doc in documents)
    processed_files = sum(1 for doc in documents if doc.processed)
    
    stats = {
        'total_files': total_files,
        'total_size': format_file_size(total_size),
        'processed_files': processed_files,
        'processing_files': total_files - processed_files
    }
    
    return render_template('file_upload/index.html', documents=documents, stats=stats)


@file_upload_bp.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    """
    PDF upload route.
    Handles file upload and initiates processing.
    """
    if request.method == 'POST':
        # Check if file was uploaded
        if 'file' not in request.files:
            flash('No file selected.', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected.', 'error')
            return redirect(request.url)
        
        if not allowed_file(file.filename):
            flash('Only PDF files are allowed.', 'error')
            return redirect(request.url)
        
        try:
            # Generate secure filename
            original_filename = secure_filename(file.filename)
            unique_filename = generate_unique_filename(original_filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            
            # Save file
            file.save(file_path)
            file_size = get_file_size(file_path)
            
            # Create database record
            pdf_doc = PDFDocument(
                filename=original_filename,
                file_path=file_path,
                user_id=current_user.id,
                file_size=file_size
            )
            
            db.session.add(pdf_doc)
            db.session.commit()
            
            # Process PDF asynchronously (in a real app, use Celery or similar)
            try:
                process_pdf_document(pdf_doc.id)
                flash(f'File "{original_filename}" uploaded and processed successfully!', 'success')
            except Exception as e:
                flash(f'File uploaded but processing failed: {str(e)}', 'warning')
            
            return redirect(url_for('file_upload.index'))
            
        except Exception as e:
            flash(f'Upload failed: {str(e)}', 'error')
            return redirect(request.url)
    
    return render_template('file_upload/upload.html')


@file_upload_bp.route('/delete/<int:doc_id>', methods=['POST'])
@login_required
def delete_document(doc_id):
    """
    Delete PDF document and associated data.
    
    Args:
        doc_id (int): Document ID to delete
    """
    document = PDFDocument.query.filter_by(id=doc_id, user_id=current_user.id).first()
    
    if not document:
        flash('Document not found.', 'error')
        return redirect(url_for('file_upload.index'))
    
    try:
        # Remove from vector store
        vector_store = VectorStore()
        vector_store.remove_document_chunks(doc_id)
        
        # Delete file from filesystem
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete from database (cascades to chunks)
        db.session.delete(document)
        db.session.commit()
        
        flash(f'Document "{document.filename}" deleted successfully.', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Failed to delete document: {str(e)}', 'error')
    
    return redirect(url_for('file_upload.index'))


@file_upload_bp.route('/reprocess/<int:doc_id>', methods=['POST'])
@login_required
def reprocess_document(doc_id):
    """
    Reprocess PDF document.
    
    Args:
        doc_id (int): Document ID to reprocess
    """
    document = PDFDocument.query.filter_by(id=doc_id, user_id=current_user.id).first()
    
    if not document:
        flash('Document not found.', 'error')
        return redirect(url_for('file_upload.index'))
    
    try:
        # Clear existing chunks
        PDFChunk.query.filter_by(document_id=doc_id).delete()
        
        # Remove from vector store
        vector_store = VectorStore()
        vector_store.remove_document_chunks(doc_id)
        
        # Mark as unprocessed
        document.processed = False
        db.session.commit()
        
        # Reprocess
        process_pdf_document(doc_id)
        
        flash(f'Document "{document.filename}" reprocessed successfully.', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Failed to reprocess document: {str(e)}', 'error')
    
    return redirect(url_for('file_upload.index'))


def process_pdf_document(doc_id: int):
    """
    Process PDF document: extract text, create chunks, and generate embeddings.
    
    Args:
        doc_id (int): Document ID to process
        
    Raises:
        Exception: If processing fails
    """
    document = PDFDocument.query.get(doc_id)
    if not document:
        raise Exception("Document not found")
    
    try:
        # Extract text from PDF
        page_texts = extract_text_from_pdf(document.file_path)
        document.total_pages = len(page_texts)
        
        # Initialize vector store
        vector_store = VectorStore()
        
        # Process each page
        for page_num, page_text in page_texts.items():
            if not page_text.strip():
                continue
            
            # Create chunks for this page
            chunks = chunk_text(page_text)
            
            for chunk_index, chunk_content in enumerate(chunks):
                if not chunk_content.strip():
                    continue
                
                # Create chunk record
                chunk = PDFChunk(
                    document_id=doc_id,
                    page_number=page_num,
                    chunk_index=chunk_index,
                    content=chunk_content
                )
                
                db.session.add(chunk)
                db.session.flush()  # Get the chunk ID
                
                # Add to vector store
                embedding_id = vector_store.add_chunk(
                    chunk_id=chunk.id,
                    content=chunk_content,
                    metadata={
                        'document_id': doc_id,
                        'document_name': document.filename,
                        'page_number': page_num,
                        'chunk_index': chunk_index
                    }
                )
                
                chunk.embedding_id = embedding_id
        
        # Mark as processed
        document.processed = True
        db.session.commit()
        
        print(f"Successfully processed document: {document.filename}")
        
    except Exception as e:
        db.session.rollback()
        raise Exception(f"Processing failed: {str(e)}")
