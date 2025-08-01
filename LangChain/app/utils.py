"""
Utility functions for PDF processing and text manipulation.
Contains helper functions for text extraction, chunking, and file handling.
"""
import os
import uuid
import PyPDF2
from typing import List, Tuple, Dict
import re


def extract_text_from_pdf(file_path: str) -> Dict[int, str]:
    """
    Extract text from PDF file, organized by page number.
    
    Args:
        file_path (str): Path to PDF file
        
    Returns:
        Dict[int, str]: Dictionary mapping page numbers to extracted text
        
    Raises:
        Exception: If PDF cannot be read or processed
    """
    page_texts = {}
    
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                try:
                    text = page.extract_text()
                    # Clean up extracted text
                    text = clean_extracted_text(text)
                    if text.strip():  # Only store non-empty pages
                        page_texts[page_num] = text
                except Exception as e:
                    print(f"Error extracting text from page {page_num}: {e}")
                    continue
                    
    except Exception as e:
        raise Exception(f"Failed to process PDF: {str(e)}")
    
    return page_texts


def clean_extracted_text(text: str) -> str:
    """
    Clean and normalize extracted PDF text.
    
    Args:
        text (str): Raw extracted text
        
    Returns:
        str: Cleaned text
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove common PDF artifacts
    text = re.sub(r'[^\w\s\.\,\!\?\;\:\-$$$$\[\]\{\}\"\'\/\@\#\$\%\&\*\+\=\<\>\~\`]', '', text)
    
    # Normalize line breaks
    text = text.replace('\n', ' ').replace('\r', ' ')
    
    return text.strip()


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Split text into overlapping chunks for vector embedding.
    
    Args:
        text (str): Text to chunk
        chunk_size (int): Maximum characters per chunk
        overlap (int): Character overlap between chunks
        
    Returns:
        List[str]: List of text chunks
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence endings near the chunk boundary
            sentence_end = text.rfind('.', start, end)
            if sentence_end > start + chunk_size // 2:
                end = sentence_end + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - overlap
        if start >= len(text):
            break
    
    return chunks


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename to prevent conflicts.
    
    Args:
        original_filename (str): Original file name
        
    Returns:
        str: Unique filename with UUID prefix
    """
    name, ext = os.path.splitext(original_filename)
    unique_id = str(uuid.uuid4())[:8]
    return f"{unique_id}_{name}{ext}"


def allowed_file(filename: str, allowed_extensions: set = {'pdf'}) -> bool:
    """
    Check if file extension is allowed.
    
    Args:
        filename (str): File name to check
        allowed_extensions (set): Set of allowed extensions
        
    Returns:
        bool: True if file extension is allowed
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def get_file_size(file_path: str) -> int:
    """
    Get file size in bytes.
    
    Args:
        file_path (str): Path to file
        
    Returns:
        int: File size in bytes
    """
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size_bytes (int): Size in bytes
        
    Returns:
        str: Formatted size string
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"
