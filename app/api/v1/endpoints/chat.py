"""
Chatbot Concierge API Endpoint Router.

Provides endpoints for communicating with the WanderBot generative chat agent.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.services.gemini_service import GeminiService

router = APIRouter()


class ChatMessage(BaseModel):
    sender: str = Field(..., description="The sender of the message: 'user' or 'bot'")
    text: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    message: str = Field(..., description="The active query message text")
    history: List[ChatMessage] = Field(default=[], description="The previous messages thread history")
    itinerary_context: Optional[Dict[str, Any]] = Field(None, description="Active itinerary object details context")
    language: str = Field("English", description="The language selected by the user for translation responses")


class ChatResponse(BaseModel):
    response: str = Field(..., description="The WanderBot generated response text")


def get_gemini_service() -> GeminiService:
    """Dependency provider for GeminiService."""
    return GeminiService()


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with WanderBot Concierge",
    description="Submits the query message alongside history context and itinerary details to get contextual responses.",
)
async def chat_with_concierge(
    request: ChatRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> ChatResponse:
    """
    Concierge chat endpoint.
    """
    try:
        # Convert history Pydantic model to list of dictionaries
        history_dict = [{"sender": m.sender, "text": m.text} for m in request.history]
        
        reply = await service.chat_interaction(
            message=request.message,
            history=history_dict,
            itinerary_context=request.itinerary_context,
            language=request.language
        )
        return ChatResponse(response=reply)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Chat interaction failed: {str(e)}",
        )
