"""
Vercel serverless function entry point for FastAPI backend
This file handles all API requests routed from vercel.json
"""
import sys
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Add backend directory to Python path
    backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
    sys.path.insert(0, backend_path)
    
    logger.info(f"Backend path: {backend_path}")
    logger.info(f"Python path: {sys.path[:3]}")
    
    from mangum import Mangum
    from core.app import app
    
    logger.info("FastAPI app imported successfully")
    
    # Create ASGI handler for Vercel
    handler = Mangum(app, lifespan="off")
    
    logger.info("Mangum handler created successfully")
    
except Exception as e:
    logger.error(f"Error initializing app: {e}", exc_info=True)
    # Create a minimal error handler
    def error_handler(event, context):
        return {
            "statusCode": 500,
            "body": f"Server initialization error: {str(e)}"
        }
    handler = error_handler

def lambda_handler(event, context):
    """AWS Lambda handler (Vercel uses this interface)"""
    try:
        return handler(event, context)
    except Exception as e:
        logger.error(f"Error handling request: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": f"Server error: {str(e)}"
        }

