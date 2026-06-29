"""
Pydantic schemas for data validation and serialization.

Defines schemas for the AI Planner and User Review/Sentiment endpoints.
"""

from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field, conint, confloat


# ==============================================================================
# AI Travel Planner Schemas
# ==============================================================================

class Activity(BaseModel):
    """Schema representing a single activity in the itinerary."""
    time_of_day: str = Field(..., description="Time of day, e.g., 'Morning', 'Afternoon', 'Evening'")
    description: str = Field(..., description="Details of the planned activity")
    location: str = Field(..., description="Location/venue name of the activity")
    estimated_cost: Optional[float] = Field(None, description="Estimated cost for this activity")


class DailyPlan(BaseModel):
    """Schema representing a day's schedule in the itinerary."""
    day_number: int = Field(..., description="Day number of the itinerary, e.g., 1, 2, 3")
    title: str = Field(..., description="Brief title/focus of the day")
    activities: List[Activity] = Field(..., description="Ordered list of activities for the day")


class ItineraryRequest(BaseModel):
    """Schema for travel itinerary generation request."""
    destinations: List[str] = Field(
        ..., min_length=1, description="List of cities or landmark destinations to visit"
    )
    duration_days: conint(ge=1, le=14) = Field(
        ..., description="Duration of the trip in days (between 1 and 14)"
    )
    preferences: List[str] = Field(
        default=[], description="User preferences (e.g., 'historical sites', 'adventure sports', 'culinary')"
    )
    budget_tier: str = Field(
        "Moderate", description="Budget level: 'Budget', 'Moderate', 'Luxury'"
    )
    travelers_count: conint(ge=1) = Field(
        1, description="Number of travelers"
    )
    start_date: Optional[date] = Field(
        None, description="Optional start date for the trip"
    )


class BudgetBreakdown(BaseModel):
    """Detailed budget breakdown estimation."""
    flights: float = Field(..., description="Estimated flight cost in USD")
    accommodation: float = Field(..., description="Estimated hotel/accommodation cost in USD")
    food: float = Field(..., description="Estimated food/dining cost in USD")
    local_transport: float = Field(..., description="Estimated local transport/transit cost in USD")
    currency: str = Field("USD", description="Currency of the estimate, e.g., 'USD'")


class ItineraryResponse(BaseModel):
    """Schema for the generated travel itinerary response."""
    destinations: List[str] = Field(..., description="Destinations covered")
    duration_days: int = Field(..., description="Trip duration in days")
    itinerary: List[DailyPlan] = Field(..., description="Day-by-day plan details")
    total_estimated_cost: float = Field(..., description="Estimated total trip cost")
    recommendations: List[str] = Field(..., description="General mega-tourism tips and local guidelines")
    budget_estimate: Optional[BudgetBreakdown] = Field(None, description="Detailed budget estimation breakdown")
    model_version: str = Field(..., description="The AI model version used for generation")



# ==============================================================================
# User Reviews & Sentiment Analysis Schemas
# ==============================================================================

class ReviewRequest(BaseModel):
    """Schema for submitting a review and sentiment analysis request."""
    review_text: str = Field(
        ..., min_length=3, description="The raw review text to analyze. Minimum 3 characters."
    )


class ReviewResponse(BaseModel):
    """Schema for review analysis results."""
    original_text: str = Field(..., description="The original review text")
    sentiment_label: str = Field(
        ..., description="Sentiment classification label: 'Positive', 'Neutral', or 'Negative'"
    )
    polarity_score: float = Field(
        ..., description="Sentiment polarity score from -1.0 to 1.0"
    )
    confidence_metrics: dict = Field(
        ..., description="Metadata and confidence indicators including subjectivity"
    )
