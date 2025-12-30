"""
Upload Service - Handle file uploads to Cloudinary

Location: backend/src/services/upload_service.py
"""

import cloudinary.uploader
from typing import Optional, BinaryIO
from fastapi import UploadFile, HTTPException

# ============================================================================
# CLOUDINARY UPLOAD FUNCTIONS
# ============================================================================

async def upload_file_to_cloudinary(
    file: UploadFile,
    folder: str = "study-resources"
) -> dict:
    """
    Upload file to Cloudinary
    
    Supports:
    - Images (jpg, png, gif, webp)
    - Videos (mp4, mov, avi)
    - Documents (pdf, doc, docx)
    - Any file type
    
    Args:
        file: FastAPI UploadFile object
        folder: Cloudinary folder to organize files
        
    Returns:
        {
            "url": "https://res.cloudinary.com/...",
            "public_id": "study-resources/abc123",
            "format": "pdf",
            "resource_type": "raw",
            "size": 1024000
        }
    
    Raises:
        HTTPException: If upload fails
    """
    
    try:
        # Detect resource type based on content type
        resource_type = detect_resource_type(file.content_type)
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type=resource_type,
            # Optional: Add more options
            # unique_filename=True,  # Generate unique filename
            # overwrite=False,  # Don't overwrite existing files
        )
        
        return {
            "url": result['secure_url'],  # HTTPS URL
            "public_id": result['public_id'],
            "format": result.get('format'),
            "resource_type": result.get('resource_type'),
            "size": result.get('bytes', 0)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(e)}"
        )


def detect_resource_type(content_type: str) -> str:
    """
    Detect Cloudinary resource type from content type
    
    Cloudinary types:
    - "image": jpg, png, gif, webp, etc.
    - "video": mp4, mov, avi, etc.
    - "raw": pdf, doc, zip, etc. (anything else)
    
    Args:
        content_type: MIME type (e.g., "application/pdf")
        
    Returns:
        "image", "video", or "raw"
    """
    
    if content_type.startswith('image/'):
        return "image"
    elif content_type.startswith('video/'):
        return "video"
    else:
        # PDFs, documents, etc.
        return "raw"


async def delete_file_from_cloudinary(public_id: str) -> bool:
    """
    Delete file from Cloudinary
    
    Use when user deletes a resource from database
    
    Args:
        public_id: Cloudinary public_id (from upload response)
        
    Returns:
        True if deleted successfully
        
    Example:
        await delete_file_from_cloudinary("study-resources/abc123")
    """
    
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"Failed to delete from Cloudinary: {str(e)}")
        return False


# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

def validate_file_size(file: UploadFile, max_size_mb: int = 50) -> bool:
    """
    Validate file size (optional, Cloudinary has limits too)
    
    Free tier Cloudinary limits:
    - Images: 10MB max
    - Videos: 100MB max
    - Raw files: 100MB max
    
    Args:
        file: UploadFile object
        max_size_mb: Maximum size in megabytes
        
    Returns:
        True if valid
        
    Raises:
        HTTPException: If file too large
    """
    
    # Get file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()  # Get position (= size)
    file.file.seek(0)  # Reset to start
    
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {max_size_mb}MB"
        )
    
    return True


def validate_file_type(
    file: UploadFile,
    allowed_types: Optional[list[str]] = None
) -> bool:
    """
    Validate file type (optional)
    
    Args:
        file: UploadFile object
        allowed_types: List of allowed MIME types
        
    Example:
        allowed_types = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "video/mp4"
        ]
        
    Returns:
        True if valid
        
    Raises:
        HTTPException: If file type not allowed
    """
    
    if allowed_types is None:
        # Allow all types
        return True
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. "
                   f"Allowed types: {', '.join(allowed_types)}"
        )
    
    return True


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return filename.split('.')[-1].lower() if '.' in filename else ''


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename (remove special characters)
    
    Example:
        "my file (1).pdf" -> "my_file_1.pdf"
    """
    import re
    
    # Remove special characters, keep alphanumeric and dots
    clean = re.sub(r'[^\w\s.-]', '', filename)
    # Replace spaces with underscores
    clean = clean.replace(' ', '_')
    # Remove multiple underscores
    clean = re.sub(r'_+', '_', clean)
    
    return clean


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

"""
How to use in routes:

from fastapi import UploadFile, File
from ..services.upload_service import upload_file_to_cloudinary

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: Users = Depends(get_current_user)
):
    # Optional: Validate
    validate_file_size(file, max_size_mb=50)
    
    # Upload to Cloudinary
    upload_result = await upload_file_to_cloudinary(file)
    
    # Create resource in database
    resource = await resource_service.create_resource(
        session=db,
        user_id=current_user.user_id,
        title=file.filename,
        url=upload_result['url'],  # Cloudinary URL!
        resource_type=...,
        file_size=upload_result['size']
    )
    
    return resource
"""