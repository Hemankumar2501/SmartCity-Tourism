"""
Reviews API Endpoint Router.

Provides endpoints for user reviews submission and NLP sentiment analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.tour_schemas import ReviewRequest, ReviewResponse
from app.services.sentiment_service import SentimentService

router = APIRouter()


def get_sentiment_service() -> SentimentService:
    """
    Dependency provider for SentimentService.
    """
    return SentimentService()


@router.post(
    "/analyze",
    response_model=ReviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Tourism Review Sentiment",
    response_description="Sentiment analysis results",
)
async def analyze_review(
    request: ReviewRequest,
    service: SentimentService = Depends(get_sentiment_service),
) -> ReviewResponse:
    """
    Endpoint to analyze a user review and return sentiment scoring.

    Args:
        request (ReviewRequest): Review text to analyze.
        service (SentimentService): Injected sentiment analysis service.

    Returns:
        ReviewResponse: Sentiment metrics and classifications.
    """
    try:
        result = await service.analyze_review_sentiment(request.review_text)
        return ReviewResponse(**result)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid review request: {str(ve)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during sentiment analysis: {str(e)}",
        )
