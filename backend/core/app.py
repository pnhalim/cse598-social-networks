from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to initialize database (but don't crash if it fails)
try:
    from core.database import engine
    from models.models import Base
    
    if engine:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created/verified successfully")
        except Exception as e:
            logger.warning(f"⚠️  Error creating database tables: {e}")
            # Continue anyway - tables might already exist or connection will fail later
    else:
        logger.warning("⚠️  Database engine not available - tables will not be created. Set DATABASE_URL environment variable.")
except Exception as e:
    logger.warning(f"⚠️  Error importing database modules: {e}")
    # Continue - database might not be configured yet

# Import routers individually so one failure doesn't prevent others from loading
auth_router = None
user_router = None
general_router = None
mutual_matching_router = None
list_view_router = None

# Store import errors for debugging
import_errors = {}

try:
    from api.auth_routes import router as auth_router
    logger.info("✅ Successfully imported auth_router")
except Exception as e:
    import traceback
    error_msg = str(e)
    error_traceback = traceback.format_exc()
    import_errors["auth_router"] = {
        "error": error_msg,
        "traceback": error_traceback,
        "exception_type": type(e).__name__,
        "full_exception": repr(e)
    }
    logger.error(f"❌ Error importing auth_router: {e}", exc_info=True)

try:
    from api.user_routes import router as user_router
    logger.info("✅ Successfully imported user_router")
except Exception as e:
    import traceback
    error_msg = str(e)
    error_traceback = traceback.format_exc()
    import_errors["user_router"] = {
        "error": error_msg,
        "traceback": error_traceback,
        "exception_type": type(e).__name__,
        "full_exception": repr(e)
    }
    logger.error(f"❌ Error importing user_router: {e}", exc_info=True)

try:
    from api.general_routes import router as general_router
    logger.info("✅ Successfully imported general_router")
except Exception as e:
    import traceback
    error_msg = str(e)
    error_traceback = traceback.format_exc()
    import_errors["general_router"] = {
        "error": error_msg,
        "traceback": error_traceback,
        "exception_type": type(e).__name__,
        "full_exception": repr(e)
    }
    logger.error(f"❌ Error importing general_router: {e}", exc_info=True)

try:
    from api.mutual_matching_routes import router as mutual_matching_router
    logger.info("✅ Successfully imported mutual_matching_router")
except Exception as e:
    import traceback
    error_msg = str(e)
    error_traceback = traceback.format_exc()
    import_errors["mutual_matching_router"] = {
        "error": error_msg,
        "traceback": error_traceback,
        "exception_type": type(e).__name__,
        "full_exception": repr(e)
    }
    logger.error(f"❌ Error importing mutual_matching_router: {e}", exc_info=True)

try:
    from api.list_view import router as list_view_router
    logger.info("✅ Successfully imported list_view_router")
except Exception as e:
    import traceback
    error_msg = str(e)
    error_traceback = traceback.format_exc()
    import_errors["list_view_router"] = {
        "error": error_msg,
        "traceback": error_traceback,
        "exception_type": type(e).__name__,
        "full_exception": repr(e)
    }
    logger.error(f"❌ Error importing list_view_router: {e}", exc_info=True)

# Create FastAPI app
app = FastAPI(
    title="Study Buddy API",
    description="A FastAPI backend for matching students with study partners",
    version="1.0.0",
    # Configure security schemes for Swagger UI
    openapi_tags=[
        {
            "name": "authentication",
            "description": "Authentication and registration operations",
        },
        {
            "name": "users",
            "description": "User management and profile operations",
        },
        {
            "name": "general",
            "description": "General API operations",
        },
        {
            "name": "mutual matching",
            "description": "Mutual matching operations for design2 users",
        },
        {
            "name": "design1 list view",
            "description": "List view operations with cursor pagination for design1 users",
        },
    ]
)

# Add CORS middleware
# Get allowed origins from environment or default to all
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
frontend_url = os.getenv("VITE_FRONTEND_BASE_URL") or os.getenv("FRONTEND_BASE_URL") or "https://studybuddyumich.vercel.app"

if cors_origins_env == "*":
    # When CORS_ORIGINS is "*", we need to explicitly list origins if credentials are allowed
    # Default to frontend URL and common development origins
    allowed_origins = [
        frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
else:
    # Parse comma-separated origins and ensure frontend URL is included
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    # Always include the frontend URL if not already present
    if frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)
    # Also include common localhost origins for development
    if "http://localhost:5173" not in allowed_origins:
        allowed_origins.append("http://localhost:5173")
    if "http://localhost:3000" not in allowed_origins:
        allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # Not needed since we use JWT tokens, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (only if they were imported successfully)
if auth_router:
    app.include_router(auth_router)
    logger.info("✅ Included auth_router")
else:
    logger.warning("⚠️  auth_router not included (import failed)")

if user_router:
    app.include_router(user_router)
    logger.info("✅ Included user_router")
else:
    logger.warning("⚠️  user_router not included (import failed)")

if general_router:
    app.include_router(general_router)
    logger.info("✅ Included general_router")
else:
    logger.warning("⚠️  general_router not included (import failed)")

if mutual_matching_router:
    app.include_router(mutual_matching_router)
    logger.info("✅ Included mutual_matching_router")
else:
    logger.warning("⚠️  mutual_matching_router not included (import failed)")

if list_view_router:
    app.include_router(list_view_router)
    logger.info("✅ Included list_view_router")
else:
    logger.warning("⚠️  list_view_router not included (import failed)")

# Add error handler for missing database
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc) if str(exc) else "Internal server error",
            "error": "Check server logs for details"
        }
    )

# Custom OpenAPI schema to add security schemes
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    from fastapi.openapi.utils import get_openapi
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Ensure components/securitySchemes keys exist
    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})

    # Add security schemes
    security_schemes.update({
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/api/token",
                    "scopes": {}
                }
            },
            "description": "OAuth2 with Password Bearer token"
        }
    })
    
    # Add security requirements to protected endpoints
    for path, path_item in openapi_schema["paths"].items():
        for method, operation in path_item.items():
            if method in ["get", "post", "put", "delete", "patch"]:
                # Check if this is a protected endpoint (not login, registration, or health)
                if not any(excluded in path for excluded in ["/login", "/token", "/request-verification", "/verify-email", "/setup-password", "/complete-profile", "/health"]):
                    operation["security"] = [
                        {"OAuth2PasswordBearer": []}
                    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "Welcome to Study Buddy API", "docs": "/docs"}

@app.get("/api/test")
def test_endpoint():
    """Simple test endpoint that doesn't require database"""
    try:
        from core.database import engine
        db_configured = engine is not None
    except:
        db_configured = False
    
    return {
        "status": "ok",
        "message": "API is working",
        "database_configured": db_configured
    }

@app.get("/api/routes")
def list_all_routes():
    """List all available API routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            for method in route.methods:
                if method != 'HEAD':  # Skip HEAD, it's usually a duplicate of GET
                    routes.append({
                        "path": route.path,
                        "method": method,
                        "name": getattr(route, 'name', 'unnamed'),
                        "tags": getattr(route, 'tags', [])
                    })
    
    return {
        "total_routes": len(routes),
        "routes": sorted(routes, key=lambda x: (x["path"], x["method"])),
        "routers_included": {
            "auth_router": auth_router is not None,
            "user_router": user_router is not None,
            "general_router": general_router is not None,
            "mutual_matching_router": mutual_matching_router is not None,
            "list_view_router": list_view_router is not None,
        }
    }

@app.get("/api/health/detailed")
def detailed_health_check():
    """Detailed health check showing which routers and components are loaded with error details"""
    try:
        from core.database import engine
        db_configured = engine is not None
        db_status = "configured" if db_configured else "not configured"
    except Exception as e:
        db_configured = False
        db_status = f"error: {str(e)}"
    
    routers_status = {
        "auth_router": "loaded" if auth_router else "failed to import",
        "user_router": "loaded" if user_router else "failed to import",
        "general_router": "loaded" if general_router else "failed to import",
        "mutual_matching_router": "loaded" if mutual_matching_router else "failed to import",
        "list_view_router": "loaded" if list_view_router else "failed to import",
    }
    
    loaded_count = sum(1 for status in routers_status.values() if status == "loaded")
    total_count = len(routers_status)
    
    # Router dependencies mapping for better error context
    router_dependencies = {
        "auth_router": [
            "api.auth_routes",
            "services.email_service",
            "services.auth_utils",
            "services.censorship_service",
            "config.email_config"
        ],
        "user_router": [
            "api.user_routes",
            "services.reputation_service",
            "services.image_service",
            "services.email_service",
            "services.censorship_service",
            "config.auth_dependencies",
            "config.cloudinary_config"
        ],
        "mutual_matching_router": [
            "api.mutual_matching_routes",
            "utils.similarity",
            "config.auth_dependencies"
        ],
        "list_view_router": [
            "api.list_view",
            "utils.similarity",
            "config.auth_dependencies"
        ],
        "general_router": [
            "api.general_routes",
            "models.schemas"
        ]
    }
    
    response = {
        "status": "ok" if loaded_count == total_count else "degraded",
        "database": db_status,
        "routers": routers_status,
        "summary": f"{loaded_count}/{total_count} routers loaded",
        "message": "Check import_errors below for detailed error messages" if loaded_count < total_count else "All systems operational"
    }
    
    # Add detailed import errors if any
    if import_errors:
        response["import_errors"] = {}
        for router_name, error_info in import_errors.items():
            error_msg = error_info["error"]
            traceback_lines = error_info["traceback"].split("\n")
            exception_type = error_info.get("exception_type", "Exception")
            full_exception = error_info.get("full_exception", str(error_msg))
            
            # Find all file locations in traceback
            file_locations = []
            error_lines = []
            for line in traceback_lines:
                if "File" in line and ("api/" in line or "services/" in line or "config/" in line or "utils/" in line or "models/" in line or "core/" in line):
                    file_locations.append(line.strip())
                if "Error:" in line or "Exception:" in line or exception_type in line:
                    error_lines.append(line.strip())
            
            # Get full traceback (not just last 15 lines)
            full_traceback = traceback_lines
            
            # Analyze common error patterns and provide suggestions
            suggestions = []
            error_str = str(error_msg).lower()
            
            if "modulenotfounderror" in error_str or "no module named" in error_str:
                # Extract module name if possible
                module_match = None
                for line in traceback_lines:
                    if "No module named" in line:
                        module_match = line.split("No module named")[-1].strip().strip("'\"")
                        break
                if module_match:
                    suggestions.append(f"Missing Python package: '{module_match}' - add it to requirements.txt")
                else:
                    suggestions.append("Missing Python package - check requirements.txt and ensure all dependencies are installed")
                suggestions.append("Run: pip install -r requirements.txt")
            elif "importerror" in error_str or "cannot import name" in error_str:
                # Extract what couldn't be imported
                import_match = None
                for line in traceback_lines:
                    if "cannot import name" in line.lower():
                        parts = line.split("cannot import name")
                        if len(parts) > 1:
                            import_match = parts[1].strip().strip("'\"")
                            break
                if import_match:
                    suggestions.append(f"Cannot import '{import_match}' - check if it exists in the module")
                else:
                    suggestions.append("Import error - check if the module/file exists and has correct imports")
                suggestions.append("Check file structure and __init__.py files")
            elif "attributeerror" in error_str:
                suggestions.append("Attribute error - check if the imported object has the expected attributes")
                suggestions.append("Verify the object is properly initialized before use")
            elif "database" in error_str or "database_url" in error_str or "engine" in error_str:
                suggestions.append("Database configuration issue - check DATABASE_URL environment variable in Vercel")
                suggestions.append("Ensure PostgreSQL database is set up and connected")
            elif "email" in error_str or "mail" in error_str:
                suggestions.append("Email configuration issue - check email-related environment variables (MAIL_*)")
                suggestions.append("Verify SMTP settings in Vercel environment variables")
            elif "cloudinary" in error_str:
                suggestions.append("Cloudinary configuration issue - check CLOUDINARY_* environment variables")
                suggestions.append("Verify Cloudinary credentials in Vercel environment variables")
            elif "pydantic" in error_str or "settings" in error_str:
                suggestions.append("Configuration settings issue - check pydantic-settings package is installed")
                suggestions.append("Verify environment variables are set correctly")
            elif "oauth" in error_str or "token" in error_str:
                suggestions.append("Authentication configuration issue - check JWT_SECRET_KEY environment variable")
            else:
                suggestions.append("Check Vercel function logs for more details")
                suggestions.append("Verify all required environment variables are set")
            
            response["import_errors"][router_name] = {
                "exception_type": exception_type,
                "error_message": str(error_msg),
                "full_exception": full_exception,
                "file_locations": file_locations if file_locations else ["Unknown"],
                "error_lines": error_lines if error_lines else [str(error_msg)],
                "dependencies": router_dependencies.get(router_name, []),
                "full_traceback": full_traceback,
                "traceback_summary": traceback_lines[-10:] if len(traceback_lines) > 10 else traceback_lines,
                "suggestions": suggestions
            }
    
    # Add overall diagnostics
    if loaded_count < total_count:
        response["diagnostics"] = {
            "failed_routers": [name for name, status in routers_status.items() if status != "loaded"],
            "working_routers": [name for name, status in routers_status.items() if status == "loaded"],
            "common_issues": [
                "Missing environment variables (check Vercel project settings)",
                "Missing Python packages (check requirements.txt)",
                "Import path issues (check file structure)",
                "Database connection issues (check DATABASE_URL)",
                "Configuration file errors (check config/ directory)"
            ]
        }
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
