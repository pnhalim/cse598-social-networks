from fastapi import APIRouter
from models.schemas import HealthResponse

# Create router for general routes
router = APIRouter(prefix="/api", tags=["general"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", message="Study Buddy API is running")
