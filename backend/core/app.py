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

try:
    from api.auth_routes import router as auth_router
    logger.info("✅ Successfully imported auth_router")
except Exception as e:
    logger.error(f"❌ Error importing auth_router: {e}", exc_info=True)

try:
    from api.user_routes import router as user_router
    logger.info("✅ Successfully imported user_router")
except Exception as e:
    logger.error(f"❌ Error importing user_router: {e}", exc_info=True)

try:
    from api.general_routes import router as general_router
    logger.info("✅ Successfully imported general_router")
except Exception as e:
    logger.error(f"❌ Error importing general_router: {e}", exc_info=True)

try:
    from api.mutual_matching_routes import router as mutual_matching_router
    logger.info("✅ Successfully imported mutual_matching_router")
except Exception as e:
    logger.error(f"❌ Error importing mutual_matching_router: {e}", exc_info=True)

try:
    from api.list_view import router as list_view_router
    logger.info("✅ Successfully imported list_view_router")
except Exception as e:
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
allowed_origins = os.getenv("CORS_ORIGINS", "*")
if allowed_origins != "*":
    allowed_origins = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
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

@app.get("/api/health/detailed")
def detailed_health_check():
    """Detailed health check showing which routers and components are loaded"""
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
    
    return {
        "status": "ok" if loaded_count == total_count else "degraded",
        "database": db_status,
        "routers": routers_status,
        "summary": f"{loaded_count}/{total_count} routers loaded",
        "message": "Check Vercel function logs for detailed error messages" if loaded_count < total_count else "All systems operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
