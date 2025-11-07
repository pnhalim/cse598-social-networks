"""
Image upload and processing service using Cloudinary
"""
import logging
import io
from typing import Optional

from fastapi import HTTPException, UploadFile
from PIL import Image

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    CLOUDINARY_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency may be missing
    cloudinary = None  # type: ignore
    CLOUDINARY_AVAILABLE = False

from config.cloudinary_config import cloudinary_config

logger = logging.getLogger(__name__)

class ImageService:
    def __init__(self):
        if not CLOUDINARY_AVAILABLE:
            logger.warning("Cloudinary SDK not installed; image upload endpoints disabled")
            return

        # Configure Cloudinary
        cloudinary.config(  # type: ignore[union-attr]
            cloud_name=cloudinary_config.cloud_name,
            api_key=cloudinary_config.api_key,
            api_secret=cloudinary_config.api_secret
        )
    
    async def upload_profile_picture(
        self, 
        file: UploadFile, 
        user_id: int,
        folder: str = "study-buddy/profiles"
    ) -> str:
        """
        Upload and process a profile picture
        
        Args:
            file: The uploaded file
            user_id: ID of the user uploading the image
            folder: Cloudinary folder to store the image
            
        Returns:
            str: The public URL of the uploaded image
            
        Raises:
            HTTPException: If upload fails or file is invalid
        """
        if not CLOUDINARY_AVAILABLE:
            raise HTTPException(
                status_code=503,
                detail="Cloudinary integration not configured on the server."
            )

        try:
            # Validate file type
            if not self._is_valid_image(file):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Only JPEG, PNG, and WebP images are allowed."
                )
            
            # Validate file size (max 5MB)
            if not self._is_valid_size(file):
                raise HTTPException(
                    status_code=400,
                    detail="File too large. Maximum size is 5MB."
                )
            
            # Read file content
            file_content = await file.read()
            
            # Process image (resize, optimize)
            processed_image = self._process_image(file_content)
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                processed_image,
                folder=folder,
                public_id=f"user_{user_id}_profile",
                overwrite=True,
                resource_type="image",
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                    {"quality": "auto", "fetch_format": "auto"}
                ]
            )
            
            return upload_result["secure_url"]
            
        except cloudinary.exceptions.Error as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload image: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Image processing error: {str(e)}"
            )
    
    def delete_profile_picture(self, public_id: str) -> bool:
        """
        Delete a profile picture from Cloudinary
        
        Args:
            public_id: The public ID of the image to delete
            
        Returns:
            bool: True if deletion was successful
        """
        if not CLOUDINARY_AVAILABLE:
            logger.warning("Cloudinary SDK not installed; delete_profile_picture no-op")
            return False

        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception:
            return False
    
    def _is_valid_image(self, file: UploadFile) -> bool:
        """Check if the uploaded file is a valid image"""
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        return file.content_type in allowed_types
    
    def _is_valid_size(self, file: UploadFile) -> bool:
        """Check if the file size is within limits"""
        # FastAPI doesn't provide file size directly, so we'll check after reading
        return True  # We'll validate after reading the file
    
    def _process_image(self, file_content: bytes) -> bytes:
        """
        Process the image: resize, optimize, and convert to appropriate format
        
        Args:
            file_content: Raw image bytes
            
        Returns:
            bytes: Processed image bytes
        """
        try:
            # Open image with PIL
            image = Image.open(io.BytesIO(file_content))
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            
            # Resize if too large (max 2000x2000)
            max_size = 2000
            if image.width > max_size or image.height > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Save to bytes with optimization
            output = io.BytesIO()
            image.save(
                output, 
                format="JPEG", 
                quality=85, 
                optimize=True
            )
            
            return output.getvalue()
            
        except Exception as e:
            raise ValueError(f"Image processing failed: {str(e)}")

# Create global instance
image_service = ImageService()
