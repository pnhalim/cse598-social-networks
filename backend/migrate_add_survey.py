#!/usr/bin/env python3
"""
Migration script to add survey_completed column to users table
and create survey_responses table.
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_database():
    """Add survey_completed column and create survey_responses table.
    This migration is idempotent and safe to run multiple times.
    """
    if not engine:
        logger.error("Database engine not available. Cannot run migration.")
        return False
    
    db = SessionLocal()
    try:
        # Check if survey_completed column already exists
        if engine.url.drivername == 'sqlite':
            # SQLite: Check if column exists
            result = db.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]
            
            if 'survey_completed' not in columns:
                logger.info("Adding survey_completed column to users table...")
                db.execute(text("ALTER TABLE users ADD COLUMN survey_completed BOOLEAN DEFAULT 0"))
                db.commit()
                logger.info("✅ Added survey_completed column")
                
                # Set survey_completed = False for all existing users (NULL values)
                logger.info("Setting survey_completed = False for existing users...")
                db.execute(text("UPDATE users SET survey_completed = 0 WHERE survey_completed IS NULL"))
                db.commit()
                logger.info("✅ Updated existing users")
            else:
                logger.info("✅ survey_completed column already exists")
                # Ensure all existing users have survey_completed set (handle NULL values)
                result = db.execute(text("SELECT COUNT(*) FROM users WHERE survey_completed IS NULL"))
                null_count = result.scalar()
                if null_count > 0:
                    logger.info(f"Setting survey_completed = False for {null_count} existing users with NULL values...")
                    db.execute(text("UPDATE users SET survey_completed = 0 WHERE survey_completed IS NULL"))
                    db.commit()
                    logger.info("✅ Updated existing users")
            
            # Check if survey_responses table exists
            result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='survey_responses'"))
            if result.fetchone() is None:
                logger.info("Creating survey_responses table...")
                # Create the survey_responses table
                db.execute(text("""
                    CREATE TABLE survey_responses (
                        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL UNIQUE,
                        q1_study_alone INTEGER NOT NULL,
                        q2_enjoy_studying_with_others INTEGER NOT NULL,
                        q3_easily_find_study_buddy INTEGER NOT NULL,
                        q4_wish_more_people INTEGER NOT NULL,
                        q5_coordinating_barrier INTEGER NOT NULL,
                        q6_worry_awkward INTEGER NOT NULL,
                        q7_comfortable_approaching INTEGER NOT NULL,
                        q8_comfortable_online_platforms INTEGER NOT NULL,
                        q9_avoid_asking_afraid_no INTEGER NOT NULL,
                        q10_feel_at_ease INTEGER NOT NULL,
                        q11_pressure_keep_studying INTEGER NOT NULL,
                        q12_feel_belong INTEGER NOT NULL,
                        q13_core_group_peers INTEGER NOT NULL,
                        q14_students_open_collaborating INTEGER NOT NULL,
                        q15_hardest_part TEXT NOT NULL,
                        q16_bad_experience TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME,
                        FOREIGN KEY(user_id) REFERENCES users (id)
                    )
                """))
                try:
                    db.execute(text("CREATE INDEX ix_survey_responses_user_id ON survey_responses (user_id)"))
                    db.commit()
                except Exception as e:
                    # Index might already exist, that's okay
                    logger.debug(f"Index creation note: {e}")
                logger.info("✅ Created survey_responses table")
            else:
                logger.info("✅ survey_responses table already exists")
                # Ensure index exists (idempotent)
                try:
                    db.execute(text("CREATE INDEX IF NOT EXISTS ix_survey_responses_user_id ON survey_responses (user_id)"))
                    db.commit()
                except Exception as e:
                    # Index might already exist, that's okay
                    logger.debug(f"Index creation note: {e}")
        
        elif engine.url.drivername == 'postgresql':
            # PostgreSQL: Check if column exists
            result = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='survey_completed'
            """))
            if result.fetchone() is None:
                logger.info("Adding survey_completed column to users table...")
                db.execute(text("ALTER TABLE users ADD COLUMN survey_completed BOOLEAN DEFAULT FALSE"))
                db.commit()
                logger.info("✅ Added survey_completed column")
                
                # Set survey_completed = False for all existing users (NULL values)
                logger.info("Setting survey_completed = False for existing users...")
                db.execute(text("UPDATE users SET survey_completed = FALSE WHERE survey_completed IS NULL"))
                db.commit()
                logger.info("✅ Updated existing users")
            else:
                logger.info("✅ survey_completed column already exists")
                # Ensure all existing users have survey_completed set (handle NULL values)
                result = db.execute(text("SELECT COUNT(*) FROM users WHERE survey_completed IS NULL"))
                null_count = result.scalar()
                if null_count > 0:
                    logger.info(f"Setting survey_completed = FALSE for {null_count} existing users with NULL values...")
                    db.execute(text("UPDATE users SET survey_completed = FALSE WHERE survey_completed IS NULL"))
                    db.commit()
                    logger.info("✅ Updated existing users")
            
            # Check if survey_responses table exists
            result = db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name='survey_responses'
            """))
            if result.fetchone() is None:
                logger.info("Creating survey_responses table...")
                # Create the survey_responses table
                db.execute(text("""
                    CREATE TABLE survey_responses (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL UNIQUE,
                        q1_study_alone INTEGER NOT NULL,
                        q2_enjoy_studying_with_others INTEGER NOT NULL,
                        q3_easily_find_study_buddy INTEGER NOT NULL,
                        q4_wish_more_people INTEGER NOT NULL,
                        q5_coordinating_barrier INTEGER NOT NULL,
                        q6_worry_awkward INTEGER NOT NULL,
                        q7_comfortable_approaching INTEGER NOT NULL,
                        q8_comfortable_online_platforms INTEGER NOT NULL,
                        q9_avoid_asking_afraid_no INTEGER NOT NULL,
                        q10_feel_at_ease INTEGER NOT NULL,
                        q11_pressure_keep_studying INTEGER NOT NULL,
                        q12_feel_belong INTEGER NOT NULL,
                        q13_core_group_peers INTEGER NOT NULL,
                        q14_students_open_collaborating INTEGER NOT NULL,
                        q15_hardest_part TEXT NOT NULL,
                        q16_bad_experience TEXT NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE,
                        FOREIGN KEY(user_id) REFERENCES users (id)
                    )
                """))
                db.execute(text("CREATE INDEX IF NOT EXISTS ix_survey_responses_user_id ON survey_responses (user_id)"))
                db.commit()
                logger.info("✅ Created survey_responses table")
            else:
                logger.info("✅ survey_responses table already exists")
                # Ensure index exists (idempotent)
                try:
                    db.execute(text("CREATE INDEX IF NOT EXISTS ix_survey_responses_user_id ON survey_responses (user_id)"))
                    db.commit()
                except Exception as e:
                    # Index might already exist, that's okay
                    logger.debug(f"Index creation note: {e}")
        
        logger.info("✅ Migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)

