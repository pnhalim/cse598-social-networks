"""
Minimal test function to verify Vercel Python runtime is working
"""
import json

def lambda_handler(event, context):
    """Simple test handler"""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "message": "Test function is working",
            "python": "ok"
        })
    }

