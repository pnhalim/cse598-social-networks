from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from core.database import engine
    from models.models import Base
    from api.auth_routes import router as auth_router
    from api.user_routes import router as user_router
    from api.general_routes import router as general_router
    from api.mutual_matching_routes import router as mutual_matching_router
    from api.list_view import router as list_view_router

    # Create database tables (with error handling)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        # Continue anyway - tables might already exist
except Exception as e:
    logger.error(f"Error importing modules: {e}")
    raise

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

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(general_router)
app.include_router(mutual_matching_router)
app.include_router(list_view_router)

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
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
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
    }
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
