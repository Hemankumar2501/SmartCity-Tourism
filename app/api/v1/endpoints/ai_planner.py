"""
AI Travel Planner API Endpoint Router.

Provides endpoints for Generative AI travel itinerary recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.tour_schemas import ItineraryRequest, ItineraryResponse
from app.services.gemini_service import GeminiService

router = APIRouter()


def get_gemini_service() -> GeminiService:
    """
    Dependency provider for GeminiService.
    """
    return GeminiService()


@router.post(
    "/generate",
    response_model=ItineraryResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI Travel Itinerary",
    description="Invokes the Gemini LLM service to compile a customized day-by-day smart tourism itinerary.",
)
async def generate_itinerary(
    request: ItineraryRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> ItineraryResponse:
    """
    Endpoint to generate a travel itinerary.

    Args:
        request (ItineraryRequest): Target parameters for the itinerary.
        service (GeminiService): Injected Gemini generative service.

    Returns:
        ItineraryResponse: Structured generated travel plan.
    """
    try:
        response = await service.generate_itinerary(request)
        return response
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"LLM returned an invalid format: {str(ve)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Generative AI service call failed: {str(e)}",
        )
