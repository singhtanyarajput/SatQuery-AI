"""Consolidated API gateway for SatQuery AI."""

from fastapi import APIRouter

from app.api.endpoints import analyze, health

try:
    from api.routes import router as query_router
except ImportError:
    from backend.api.routes import router as query_router

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(analyze.router, prefix="/satquery", tags=["satquery"])
api_router.include_router(query_router, tags=["query"])
