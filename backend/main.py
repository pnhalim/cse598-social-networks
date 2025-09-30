#!/usr/bin/env python3
"""
Main entry point for the Study Buddy API
"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("core.app:app", host="0.0.0.0", port=8000, reload=True)
