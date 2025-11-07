from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

logger = logging.getLogger(__name__)

# Database URL - supports both SQLite (local) and PostgreSQL (production)
DATABASE_URL = os.getenv("DATABASE_URL")

# Check if we're in a serverless environment (Vercel)
IS_VERCEL = os.getenv("VERCEL") == "1"

if DATABASE_URL:
    # Check if it's a SQLite URL
    if DATABASE_URL.startswith("sqlite:///"):
        SQLALCHEMY_DATABASE_URL = DATABASE_URL
        connect_args = {"check_same_thread": False}  # Needed for SQLite
    # Check if it's a PostgreSQL URL
    elif DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
        # Vercel Postgres URLs need to be converted from postgres:// to postgresql://
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URL = DATABASE_URL
        connect_args = {}
        # Remove pool settings that don't work with SQLite
    else:
        # Unknown database type, assume PostgreSQL
        SQLALCHEMY_DATABASE_URL = DATABASE_URL
        connect_args = {}
else:
    # Fall back to SQLite for local development (default)
    if IS_VERCEL:
        # On Vercel, SQLite won't work - need PostgreSQL
        # Don't raise here - let it fail gracefully when trying to connect
        # This allows the app to start and show a better error message
        logger.warning(
            "DATABASE_URL environment variable is not set on Vercel. "
            "SQLite cannot be used on Vercel's serverless platform. "
            "Please set up a PostgreSQL database (Neon Postgres recommended) "
            "and configure the DATABASE_URL environment variable."
        )
        # Use a placeholder that will fail gracefully
        SQLALCHEMY_DATABASE_URL = "postgresql://missing-database-url"
        connect_args = {}
    else:
        # Local development - use SQLite
        basedir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(basedir, 'study_buddy.db')}"
        connect_args = {"check_same_thread": False}  # Needed for SQLite
        logger.info(f"Using SQLite database: {SQLALCHEMY_DATABASE_URL}")

# Create SQLAlchemy engine
# Only use connection pooling for PostgreSQL (not SQLite)
try:
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args=connect_args,
        )
        logger.info("SQLite engine created")
    elif SQLALCHEMY_DATABASE_URL == "postgresql://missing-database-url":
        # Placeholder for missing DATABASE_URL on Vercel
        # Create a dummy engine that will fail gracefully on first use
        logger.warning("Using placeholder database URL - DATABASE_URL must be configured")
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args=connect_args,
            pool_pre_ping=False,  # Don't try to ping invalid URL
        )
    else:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args=connect_args,
            pool_pre_ping=True,  # Verify connections before using
            pool_recycle=300,   # Recycle connections after 5 minutes
        )
        logger.info("PostgreSQL engine created")
except Exception as e:
    logger.error(f"Error creating database engine: {e}")
    # Don't raise - create a dummy engine that will fail on use
    # This allows the app to start and return proper error messages
    engine = None

# Create SessionLocal class (only if engine exists)
if engine:
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        logger.error(f"Error creating sessionmaker: {e}")
        SessionLocal = None
else:
    # Dummy sessionmaker for when engine creation failed
    SessionLocal = None

# Create Base class
Base = declarative_base()

# Dependency to get database session
def get_db():
    if not engine or not SessionLocal:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail=(
                "Database not configured. Please set DATABASE_URL environment variable. "
                "For Vercel deployment, set up Neon Postgres through the Storage tab."
            )
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
