from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic_settings import BaseSettings
import os

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
    
    class Config:
        env_file = ".env"

email_settings = EmailSettings()

# Email configuration
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
