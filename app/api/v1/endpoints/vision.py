"""
AI Vision Services Router.

Provides endpoints for analyzing travel photos using Gemini Vision.
"""

import base64
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)
router = APIRouter()


class VisionRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded string representing the photo bytes data")
    mime_type: str = Field("image/jpeg", description="MIME type of the photo, e.g. image/jpeg, image/png")


class VisionResponse(BaseModel):
    caption: str = Field(..., description="The poetic, AI-generated travel journal caption")


def get_gemini_service() -> GeminiService:
    """Dependency provider for GeminiService."""
    return GeminiService()


@router.post(
    "/vision-caption",
    response_model=VisionResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate travel journal caption using AI Vision",
    description="Submits the photo bytes to Gemini Vision to describe the photo poetically.",
)
async def generate_photo_caption(
    request: VisionRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> VisionResponse:
    """
    Analyzes travel photos to return poetic captions.
    """
    try:
        # Decode base64 image representation
        header_split = request.image.split(",")
        base64_data = header_split[1] if len(header_split) > 1 else header_split[0]
        image_bytes = base64.b64decode(base64_data)
        
        caption = await service.generate_vision_caption(
            image_bytes=image_bytes,
            mime_type=request.mime_type
        )
        return VisionResponse(caption=caption)
    except Exception as e:
        logger.error(f"Failed to generate photo caption in vision endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image Vision analysis failed: {str(e)}",
        )
