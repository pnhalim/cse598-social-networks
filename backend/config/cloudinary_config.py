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
        env_file = ".env"
        env_prefix = "CLOUDINARY_"

# Create global instance
cloudinary_config = CloudinaryConfig()
