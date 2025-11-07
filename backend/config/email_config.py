from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic_settings import BaseSettings
import os
import logging

logger = logging.getLogger(__name__)

class EmailSettings(BaseSettings):
    mail_username: str = "your-email@gmail.com"  # Change this to your email
    mail_password: str = "your-app-password"     # Change this to your app password
    mail_from: str = "your-email@gmail.com"      # Change this to your email
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_from_name: str = "Study Buddy"
    mail_tls: bool = True
    mail_ssl: bool = False
    use_credentials: bool = True
    validate_certs: bool = True
    secret_key: str = "your-super-secret-key-change-in-production"  # JWT secret key
    
    class Config:
        env_file = [".env", "../.env"]  # Check current dir and project root
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra fields in .env file

# Initialize email settings with error handling
try:
    email_settings = EmailSettings()
    logger.info("Email settings loaded successfully")
except Exception as e:
    logger.warning(f"Error loading email settings: {e}. Using defaults.")
    # Create a default instance if loading fails
    email_settings = EmailSettings(
        mail_username=os.getenv("MAIL_USERNAME", "your-email@gmail.com"),
        mail_password=os.getenv("MAIL_PASSWORD", "your-app-password"),
        mail_from=os.getenv("MAIL_FROM", "your-email@gmail.com"),
        mail_port=int(os.getenv("MAIL_PORT", "587")),
        mail_server=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        mail_from_name=os.getenv("MAIL_FROM_NAME", "Study Buddy"),
        secret_key=os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    )

# Email configuration - create with error handling
try:
    conf = ConnectionConfig(
        MAIL_USERNAME=email_settings.mail_username,
        MAIL_PASSWORD=email_settings.mail_password,
        MAIL_FROM=email_settings.mail_from,
        MAIL_PORT=email_settings.mail_port,
        MAIL_SERVER=email_settings.mail_server,
        MAIL_FROM_NAME=email_settings.mail_from_name,
        MAIL_STARTTLS=email_settings.mail_tls,
        MAIL_SSL_TLS=email_settings.mail_ssl,
        USE_CREDENTIALS=email_settings.use_credentials,
        VALIDATE_CERTS=email_settings.validate_certs,
        TEMPLATE_FOLDER="email_templates"
    )
    logger.info("Email configuration created successfully")
except Exception as e:
    logger.error(f"Error creating email configuration: {e}")
    # Create a minimal config that will fail gracefully when used
    conf = None
