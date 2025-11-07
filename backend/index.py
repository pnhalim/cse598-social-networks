"""Vercel entrypoint for the Study Buddy FastAPI application.

This module exposes the FastAPI `app` instance so Vercel can discover it
automatically when deploying the backend as a standalone project.
"""

from core.app import app as fastapi_app

# Vercel expects a module-level variable called `app`
app = fastapi_app

__all__ = ["app"]

