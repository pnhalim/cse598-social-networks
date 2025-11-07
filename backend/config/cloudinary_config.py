"""
Cloudinary configuration settings
"""

import os
import logging

logger = logging.getLogger(__name__)

# Initialize with defaults first
cloudinary_config = None

try:
    from pydantic_settings import BaseSettings
    from typing import Optional

    class CloudinaryConfig(BaseSettings):
        cloud_name: str = ""
        api_key: str = ""
        api_secret: str = ""
        
        class Config:
            env_file = [".env", "../.env"]  # Check current dir and project root
            env_file_encoding = "utf-8"
            env_prefix = "CLOUDINARY_"

    # Create global instance with error handling
    try:
        cloudinary_config = CloudinaryConfig()
        logger.info("Cloudinary config loaded successfully")
    except Exception as e:
        logger.warning(f"Error loading Cloudinary config: {e}. Using defaults.")
        # Create a default instance if loading fails
        cloudinary_config = CloudinaryConfig(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
            api_key=os.getenv("CLOUDINARY_API_KEY", ""),
            api_secret=os.getenv("CLOUDINARY_API_SECRET", "")
        )
except Exception as e:
    logger.error(f"Error importing Cloudinary config dependencies: {e}", exc_info=True)
    # Fallback to simple class using environment variables
    class CloudinaryConfigFallback:
        def __init__(self):
            self.cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")
            self.api_key = os.getenv("CLOUDINARY_API_KEY", "")
            self.api_secret = os.getenv("CLOUDINARY_API_SECRET", "")
    
    cloudinary_config = CloudinaryConfigFallback()
