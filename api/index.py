"""
Vercel serverless function entry point for FastAPI backend
This file handles all API requests routed from vercel.json
"""
import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from mangum import Mangum
from core.app import app

# Create ASGI handler for Vercel
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """AWS Lambda handler (Vercel uses this interface)"""
    return handler(event, context)

