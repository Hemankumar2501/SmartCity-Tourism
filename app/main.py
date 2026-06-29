"""
Main FastAPI Application Entrypoint.

Initializes the FastAPI application, registers global middlewares (CORS),
includes the versioned API routers, and defines base health check endpoints.
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import ai_planner, reviews, chat

# Initialize FastAPI application with project metadata
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-grade FastAPI microservice powering travel planning and review sentiment analysis.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware for Public Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include Versioned API Routes
app.include_router(
    ai_planner.router,
    prefix=f"{settings.API_V1_STR}/ai-planner",
    tags=["AI Planner"],
)

app.include_router(
    reviews.router,
    prefix=f"{settings.API_V1_STR}/reviews",
    tags=["Reviews"],
)

app.include_router(
    chat.router,
    prefix=f"{settings.API_V1_STR}/chat",
    tags=["Chat Concierge"],
)


@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    tags=["Utility"],
)
async def health_check() -> dict:
    """
    Performs a simple health check validation on the service.

    Returns:
        dict: A health status response indicating the service is operational.
    """
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }
