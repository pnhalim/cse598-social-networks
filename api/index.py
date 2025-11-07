"""
Vercel serverless function entry point for FastAPI backend
This file handles all API requests routed from vercel.json
"""
import sys
import os
import logging
import json
import traceback

# Set up logging - do this first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize handler variable
handler = None
init_error = None

def create_error_handler(error_msg):
    """Create an error handler that returns proper JSON responses"""
    def error_handler(event, context):
        logger.error(f"Error handler called: {error_msg}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps({
                "detail": error_msg,
                "error": "Server initialization failed. Check Vercel function logs for details."
            })
        }
    return error_handler

try:
    # Add backend directory to Python path
    backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
    backend_path = os.path.abspath(backend_path)
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    
    logger.info(f"Backend path: {backend_path}")
    logger.info(f"Python path: {sys.path[:3]}")
    logger.info(f"VERCEL env: {os.getenv('VERCEL')}")
    logger.info(f"DATABASE_URL set: {bool(os.getenv('DATABASE_URL'))}")
    
    # Try importing mangum first
    try:
        from mangum import Mangum
        logger.info("Mangum imported successfully")
    except ImportError as e:
        logger.error(f"Failed to import mangum: {e}")
        init_error = f"Failed to import mangum: {str(e)}. Make sure mangum is in requirements.txt"
        handler = create_error_handler(init_error)
    else:
        # Try importing the app (only if mangum succeeded)
        try:
            from core.app import app
            logger.info("FastAPI app imported successfully")
        except Exception as e:
            logger.error(f"Failed to import app: {e}", exc_info=True)
            init_error = f"Failed to import FastAPI app: {str(e)}\n{traceback.format_exc()}"
            handler = create_error_handler(init_error)
        else:
            # Create ASGI handler for Vercel (only if app imported successfully)
            try:
                handler = Mangum(app, lifespan="off")
                logger.info("Mangum handler created successfully")
            except Exception as e:
                logger.error(f"Failed to create Mangum handler: {e}", exc_info=True)
                init_error = f"Failed to create Mangum handler: {str(e)}\n{traceback.format_exc()}"
                handler = create_error_handler(init_error)
        
except Exception as e:
    error_msg = f"Server initialization error: {str(e)}\n{traceback.format_exc()}"
    logger.error(error_msg)
    if handler is None:
        handler = create_error_handler(error_msg)
    init_error = error_msg
except SystemExit as e:
    # Catch SystemExit to prevent process from exiting
    error_msg = f"SystemExit during initialization: {str(e)}\n{traceback.format_exc()}"
    logger.error(error_msg)
    if handler is None:
        handler = create_error_handler(error_msg)
    init_error = error_msg
except BaseException as e:
    # Catch all other exceptions including KeyboardInterrupt
    error_msg = f"Fatal error during initialization: {str(e)}\n{traceback.format_exc()}"
    logger.error(error_msg)
    if handler is None:
        handler = create_error_handler(error_msg)
    init_error = error_msg

def lambda_handler(event, context):
    """AWS Lambda handler (Vercel uses this interface)"""
    try:
        if handler is None:
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({
                    "detail": init_error or "Handler not initialized",
                    "error": "Server not properly initialized"
                })
            }
        
        # Call the handler
        result = handler(event, context)
        
        # Ensure result has proper format
        if isinstance(result, dict):
            # If it's already a proper response, return it
            if "statusCode" in result:
                return result
            # Otherwise wrap it
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps(result) if not isinstance(result.get("body"), str) else result["body"]
            }
        
        return result
        
    except Exception as e:
        error_msg = f"Error handling request: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "detail": str(e),
                "error": "Request handling failed. Check server logs."
            })
        }

