"""
Vercel serverless function entry point for FastAPI backend
This file handles all API requests routed from vercel.json
"""
import sys
import os
import logging
import json
import traceback

# Set up logging - do this first, before any other imports
# Write to stderr so Vercel captures it
import sys
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr,  # Ensure logs go to stderr for Vercel
    force=True  # Force reconfiguration
)
logger = logging.getLogger(__name__)

# Also print to stderr as backup
def log_and_print(msg, level="INFO"):
    """Log and print to ensure visibility"""
    print(f"[{level}] {msg}", file=sys.stderr, flush=True)
    if level == "ERROR":
        logger.error(msg)
    elif level == "WARNING":
        logger.warning(msg)
    else:
        logger.info(msg)

log_and_print("API index.py loaded")

# Initialize handler variable - will be set lazily on first request
_handler = None
_init_error = None
_app_imported = False

def create_error_response(error_msg, status_code=500):
    """Create a proper error response"""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
        },
        "body": json.dumps({
            "detail": error_msg,
            "error": "Server error. Check Vercel function logs for details."
        })
    }

def initialize_app():
    """Lazy initialization - only import when first request comes in"""
    global _handler, _init_error, _app_imported
    
    if _app_imported:
        return _handler, _init_error
    
    _app_imported = True
    
    try:
        log_and_print("Starting app initialization...")
        
        # Add backend directory to Python path
        backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
        backend_path = os.path.abspath(backend_path)
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        
        log_and_print(f"Backend path: {backend_path}")
        log_and_print(f"VERCEL env: {os.getenv('VERCEL')}")
        log_and_print(f"DATABASE_URL set: {bool(os.getenv('DATABASE_URL'))}")
        
        # Import mangum
        try:
            log_and_print("Importing mangum...")
            from mangum import Mangum
            log_and_print("✓ Mangum imported")
        except ImportError as e:
            error_msg = f"Failed to import mangum: {str(e)}. Make sure mangum is in api/requirements.txt"
            log_and_print(error_msg, "ERROR")
            _init_error = error_msg
            return None, _init_error
        
        # Import the app (this is where it might crash)
        # Wrap in a way that prevents any fatal exits
        try:
            logger.info("Attempting to import core.app...")
            
            # Suppress any potential sys.exit calls during import
            import sys
            original_exit = sys.exit
            
            def safe_exit(code=0):
                """Intercept sys.exit calls and convert to exceptions"""
                raise RuntimeError(f"sys.exit({code}) was called during import")
            
            sys.exit = safe_exit
            
            try:
                log_and_print("Importing core.app...")
                from core.app import app
                log_and_print("✓ FastAPI app imported")
            finally:
                # Restore original sys.exit
                sys.exit = original_exit
                
        except RuntimeError as e:
            # This is our intercepted sys.exit
            error_msg = f"Import failed - sys.exit was called: {str(e)}\n{traceback.format_exc()}"
            log_and_print(error_msg, "ERROR")
            _init_error = error_msg
            return None, _init_error
        except Exception as e:
            error_msg = f"Failed to import FastAPI app: {str(e)}\n{traceback.format_exc()}"
            log_and_print(error_msg, "ERROR")
            _init_error = error_msg
            return None, _init_error
        
        # Create Mangum handler
        try:
            log_and_print("Creating Mangum handler...")
            _handler = Mangum(app, lifespan="off")
            log_and_print("✓ Mangum handler created successfully")
            return _handler, None
        except Exception as e:
            error_msg = f"Failed to create Mangum handler: {str(e)}\n{traceback.format_exc()}"
            log_and_print(error_msg, "ERROR")
            _init_error = error_msg
            return None, _init_error
            
    except SystemExit as e:
        # Prevent SystemExit from killing the process
        error_msg = f"SystemExit caught: {str(e)}\n{traceback.format_exc()}"
        log_and_print(error_msg, "ERROR")
        _init_error = error_msg
        return None, _init_error
    except BaseException as e:
        # Catch absolutely everything
        error_msg = f"Fatal error: {type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        log_and_print(error_msg, "ERROR")
        _init_error = error_msg
        return None, _init_error

def lambda_handler(event, context):
    """AWS Lambda handler (Vercel uses this interface)"""
    try:
        # Lazy initialization - only import app on first request
        handler, error = initialize_app()
        
        if error:
            return create_error_response(error, 500)
        
        if handler is None:
            return create_error_response("Handler not initialized", 500)
        
        # Call the handler
        result = handler(event, context)
        
        # Ensure result has proper format
        if isinstance(result, dict):
            if "statusCode" in result:
                return result
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
        error_msg = f"Error in lambda_handler: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return create_error_response(str(e), 500)
    except BaseException as e:
        # Catch everything including SystemExit
        error_msg = f"Fatal error in lambda_handler: {type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return create_error_response(f"Fatal error: {str(e)}", 500)

