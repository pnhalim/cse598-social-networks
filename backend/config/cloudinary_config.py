"""
Cloudinary configuration settings
"""

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

# Create global instance
cloudinary_config = CloudinaryConfig()
