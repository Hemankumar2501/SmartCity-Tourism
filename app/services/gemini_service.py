"""
Gemini LLM Service module.

Boilerplate service class for interacting with the Google Gemini API to generate
custom, high-quality travel itineraries for the Mega-Tourism ecosystem.
"""

import json
import logging
from typing import List, Optional, Dict, Any
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from app.core.config import settings
from app.schemas.tour_schemas import ItineraryRequest, ItineraryResponse, DailyPlan, Activity, BudgetBreakdown

logger = logging.getLogger(__name__)

# Manual Schema definition compatible with google-generativeai client to bypass Pydantic V2 conversion limitations.
ITINERARY_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "destinations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of cities or landmark destinations to visit"
        },
        "duration_days": {
            "type": "integer",
            "description": "Duration of the trip in days"
        },
        "total_estimated_cost": {
            "type": "number",
            "description": "Estimated total trip cost in USD"
        },
        "recommendations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "General mega-tourism tips and local guidelines"
        },
        "itinerary": {
            "type": "array",
            "description": "Day-by-day plan details",
            "items": {
                "type": "object",
                "properties": {
                    "day_number": {
                        "type": "integer",
                        "description": "Day number of the itinerary, e.g., 1, 2, 3"
                    },
                    "title": {
                        "type": "string",
                        "description": "Brief title/focus of the day"
                    },
                    "activities": {
                        "type": "array",
                        "description": "Ordered list of activities for the day",
                        "items": {
                            "type": "object",
                            "properties": {
                                "time_of_day": {
                                    "type": "string",
                                    "description": "Time of day, e.g., 'Morning', 'Afternoon', 'Evening'"
                                },
                                "description": {
                                    "type": "string",
                                    "description": "Details of the planned activity"
                                },
                                "location": {
                                    "type": "string",
                                    "description": "Location/venue name of the activity"
                                },
                                "estimated_cost": {
                                    "type": "number",
                                    "description": "Estimated cost for this activity"
                                },
                                "latitude": {
                                    "type": "number",
                                    "description": "Latitude coordinate of the location"
                                },
                                "longitude": {
                                    "type": "number",
                                    "description": "Longitude coordinate of the location"
                                }
                            },
                            "required": ["time_of_day", "description", "location", "latitude", "longitude"]
                        }
                    }
                },
                "required": ["day_number", "title", "activities"]
            }
        },
        "budget_breakdown": {
            "type": "object",
            "description": "Detailed itemized budget estimation breakdown for the trip in USD",
            "properties": {
                "flights": {
                    "type": "number",
                    "description": "Estimated flight/long-distance travel cost in USD"
                },
                "hotel": {
                    "type": "number",
                    "description": "Estimated hotel/accommodation cost in USD"
                },
                "food": {
                    "type": "number",
                    "description": "Estimated food/dining cost in USD"
                },
                "transport": {
                    "type": "number",
                    "description": "Estimated local transport/transit cost in USD"
                },
                "activities": {
                    "type": "number",
                    "description": "Estimated activities cost in USD"
                },
                "currency": {
                    "type": "string",
                    "description": "Currency of the estimate, must be USD"
                }
            },
            "required": ["flights", "hotel", "food", "transport", "activities", "currency"]
        },
        "packing_list": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Interactive recommended packing checklist items based on the destinations, month of travel, and typical weather"
        }
    },
    "required": [
        "destinations",
        "duration_days",
        "total_estimated_cost",
        "recommendations",
        "itinerary",
        "budget_breakdown",
        "packing_list"
    ]
}


class GeminiService:
    """
    Service class for interacting with Google Gemini Generative AI models.
    """

    def __init__(self) -> None:
        """
        Initializes the Gemini API connection.
        If no API key is provided or is a placeholder, the service will run in mock mode.
        """
        self.api_key: Optional[str] = settings.GEMINI_API_KEY
        self.model_name: str = settings.GEMINI_MODEL
        self.mock_mode: bool = True

        if self.api_key and not self.api_key.startswith("your_"):
            try:
                genai.configure(api_key=self.api_key)
                self.mock_mode = False
                logger.info("Gemini API configured successfully.")
            except Exception as e:
                logger.error(f"Failed to configure Gemini API: {str(e)}")
        else:
            logger.warning(
                "GEMINI_API_KEY not configured or is placeholder. Running in Mock/Fallback Mode."
            )

    async def generate_itinerary(self, request: ItineraryRequest) -> ItineraryResponse:
        """
        Generates a travel itinerary asynchronously based on user input.

        Args:
            request (ItineraryRequest): The travel parameters.

        Returns:
            ItineraryResponse: A structured travel plan conforming to the Pydantic schema.
        """
        if self.mock_mode:
            logger.info("Generating mock travel itinerary.")
            return self._generate_mock_itinerary(request)

        # Construct prompt detailing the structure we need
        prompt = self._build_prompt(request)

        try:
            model = genai.GenerativeModel(self.model_name)
            
            # Requesting JSON output conforming strictly to the ItineraryResponse schema dict
            response = await model.generate_content_async(
                prompt,
                generation_config=GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=ITINERARY_RESPONSE_SCHEMA,
                    temperature=0.7
                )
            )

            # Parse the JSON response
            try:
                data = json.loads(response.text)
            except json.JSONDecodeError as jde:
                logger.error(f"Failed to parse JSON response from LLM: {response.text}")
                raise ValueError("LLM response was not valid JSON") from jde
            
            # Map total cost if it's missing or adjust values to ensure compliance
            if "total_estimated_cost" not in data:
                data["total_estimated_cost"] = self._calculate_fallback_cost(request)
            data["destinations"] = request.destinations
            data["duration_days"] = request.duration_days
            data["model_version"] = self.model_name

            return ItineraryResponse(**data)

        except Exception as e:
            logger.error(
                f"Error generating itinerary from Gemini asynchronously: {str(e)}"
            )
            # Propagate the exception so the API layer can handle it appropriately
            raise

    async def chat_interaction(self, message: str, history: List[Dict[str, str]], itinerary_context: Optional[Dict[str, Any]] = None, language: str = "English") -> str:
        """
        Fulfills chat conversations using Gemini, leveraging current itinerary parameters as system instructions.
        """
        if self.mock_mode:
            logger.info("Generating mock chat response.")
            return self._generate_mock_chat_response(message, itinerary_context, language)

        try:
            model = genai.GenerativeModel(self.model_name)

            # Prepare contextual constraints
            system_directives = (
                "You are 'WanderBot', a hyper-helpful, friendly AI travel assistant concierge for the WanderWise AI travel ecosystem.\n"
                f"You MUST respond entirely in the language requested by the user: {language}. Do not use English unless the requested language is English. Under all circumstances, respond in {language}.\n"
                "You are helping a traveler who is using your platform.\n"
            )
            if itinerary_context:
                destinations = ", ".join(itinerary_context.get("destinations", []))
                days = itinerary_context.get("duration_days", 3)
                total_cost = itinerary_context.get("total_estimated_cost", 0)
                system_directives += (
                    f"The user is actively following a generated travel itinerary to: {destinations}.\n"
                    f"Itinerary Metadata: Duration of {days} Days, Total estimated cost is ${total_cost}.\n"
                    f"Itinerary JSON Content: {json.dumps(itinerary_context)}.\n"
                    "Use this plan context to answer user questions with extreme relevancy. For example, if they ask where to eat, check their daily plans or recommend options near their locations.\n"
                )
            else:
                system_directives += "No specific itinerary is currently loaded. Answer general travel planning and smart tourism queries."

            # Construct message context with history
            messages = []
            for h in history:
                role = "user" if h.get("sender") == "user" else "model"
                messages.append(f"{'User' if role == 'user' else 'WanderBot'}: {h.get('text')}")

            # Append active message
            messages.append(f"User: {message}")
            messages.append("WanderBot:")

            full_prompt = system_directives + "\n\nConversation History:\n" + "\n".join(messages)

            response = await model.generate_content_async(full_prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error calling Gemini in chat interaction: {str(e)}")
            return f"I'm sorry, I encountered an issue accessing the central AI model: {str(e)}"

    async def generate_vision_caption(self, image_bytes: bytes, mime_type: str) -> str:
        """
        Sends image binary data blocks directly to Gemini Vision model to extract a poetic travel caption.
        """
        if self.mock_mode:
            logger.info("Generating mock travel photo caption.")
            return "Wandering through breathtaking horizons, where every corner holds a new smart city adventure."

        try:
            model = genai.GenerativeModel(self.model_name)
            
            image_data = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            prompt = (
                "Analyze this travel photo. Return a beautiful, poetic, 1-2 sentence travel caption "
                "for a travel journal. Do not include markdown code block formatting, hashtags, or quotes in your response. "
                "Just return the raw text."
            )
            
            response = await model.generate_content_async([prompt, image_data])
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error calling Gemini Vision: {str(e)}")
            return "Capturing a moment of wonder on our travel adventures, where history meets tomorrow."

    def _build_prompt(self, request: ItineraryRequest) -> str:
        """
        Constructs the generative prompt for the Gemini LLM.
        """
        preferences_str = ", ".join(request.preferences) if request.preferences else "None specified"
        destinations_str = ", ".join(request.destinations)
        travel_month = "current month"
        if request.start_date:
            try:
                travel_month = request.start_date.strftime("%B")
            except Exception:
                pass
        
        prompt = f"""
You are an expert smart-city AI travel planner for the 'Next-Gen Smart City & Mega-Tourism Ecosystem'.
Create a highly detailed, curated travel itinerary with the following parameters:
- Destinations: {destinations_str}
- Duration: {request.duration_days} days
- Preferences: {preferences_str}
- Budget Tier: {request.budget_tier}
- Number of Travelers: {request.travelers_count}
- Month of Travel: {travel_month}

You must return a JSON object that strictly adheres to the following structure:
{{
  "destinations": ["destination_name"],
  "duration_days": {request.duration_days},
  "itinerary": [
    {{
      "day_number": 1,
      "title": "Day Title",
      "activities": [
        {{
          "time_of_day": "Morning",
          "description": "Activity description",
          "location": "Location name",
          "estimated_cost": 150.0,
          "latitude": 25.2048,
          "longitude": 55.2708
        }}
      ]
    }}
  ],
  "total_estimated_cost": 1250.00,
  "budget_breakdown": {{
    "flights": 400.00,
    "hotel": 450.00,
    "food": 250.00,
    "transport": 100.00,
    "activities": 50.00,
    "currency": "USD"
  }},
  "recommendations": ["Recommendation tip 1", "Recommendation tip 2"],
  "packing_list": ["Pack item 1 (e.g. sunscreen)", "Pack item 2 (e.g. light coat)"]
}}

You MUST perform geo-coding lookup for each activity's location/landmark and provide accurate "latitude" and "longitude" coordinates.
Make sure to provide rich, engaging descriptions of the activities leveraging smart-city conveniences (autonomous shuttles, IoT tour guides, smart parks).
Recommend a smart, concise "packing_list" containing 5-7 items tailored directly to the destinations' typical weather for the month of {travel_month}.
Return ONLY the raw JSON document. Do not wrap in markdown blocks.
"""
        return prompt

    def _calculate_fallback_cost(self, request: ItineraryRequest) -> float:
        """Helper to compute baseline cost for validation."""
        multiplier = {"Budget": 50, "Moderate": 150, "Luxury": 500}.get(request.budget_tier, 150)
        return float(request.duration_days * request.travelers_count * multiplier)

    def _generate_mock_itinerary(
        self, request: ItineraryRequest, error_message: Optional[str] = None
    ) -> ItineraryResponse:
        """
        Generates a high-quality mock response when API keys are missing or calls fail.
        """
        estimated_cost = self._calculate_fallback_cost(request)
        
        city_coords = {
            "dubai": [25.2048, 55.2708],
            "abu dhabi": [24.4539, 54.3773],
            "chennai": [13.0827, 80.2707],
            "madurai": [9.9252, 78.1198],
            "singapore": [1.3521, 103.8198],
            "kuala lumpur": [3.1390, 101.6869],
            "tokyo": [35.6762, 139.6503],
            "bangkok": [13.7563, 100.5018]
        }

        # Build structured day-by-day plans
        days: List[DailyPlan] = []
        for d in range(1, request.duration_days + 1):
            dest = request.destinations[(d - 1) % len(request.destinations)]
            dest_lower = dest.lower().strip()
            base_coords = city_coords.get(dest_lower, [25.2048, 55.2708])

            days.append(
                DailyPlan(
                    day_number=d,
                    title=f"Exploring local wonders in {dest}",
                    activities=[
                        Activity(
                            time_of_day="Morning",
                            description="Guided tour using smart-city augmented reality glasses.",
                            location=f"{dest} Smart Culture Center",
                            estimated_cost=round(estimated_cost * 0.05 / request.duration_days, 2),
                            latitude=base_coords[0] + 0.005,
                            longitude=base_coords[1] - 0.005
                        ),
                        Activity(
                            time_of_day="Afternoon",
                            description=f"Culinary exploration catering to {', '.join(request.preferences) if request.preferences else 'local'} tastes.",
                            location=f"{dest} Downtown Hyper-Local Marketplace",
                            estimated_cost=round(estimated_cost * 0.08 / request.duration_days, 2),
                            latitude=base_coords[0] - 0.005,
                            longitude=base_coords[1] + 0.005
                        ),
                        Activity(
                            time_of_day="Evening",
                            description="Drone light show and ecological botanical garden walk.",
                            location=f"{dest} Eco-Dome Smart Park",
                            estimated_cost=0.0,
                            latitude=base_coords[0] + 0.008,
                            longitude=base_coords[1] + 0.008
                        )
                    ]
                )
            )

        recommendations = [
            "Use the unified Mega-Tourism app to book autonomous pods.",
            "Enable smart-city pass NFC on your smartphone for seamless entries.",
            "Local peak hours are from 5 PM to 8 PM; reserve dining slots in advance."
        ]
        
        if error_message:
            recommendations.append(f"Notice: LLM API error encountered: {error_message}. Fallback applied.")
        else:
            recommendations.append("Notice: Running in Mock Mode because GEMINI_API_KEY is not configured.")

        budget_breakdown = BudgetBreakdown(
            flights=round(estimated_cost * 0.35, 2),
            hotel=round(estimated_cost * 0.35, 2),
            food=round(estimated_cost * 0.15, 2),
            transport=round(estimated_cost * 0.1, 2),
            activities=round(estimated_cost * 0.05, 2),
            currency="USD"
        )

        packing_list = [
            "Sunscreen (SPF 50+) & Polarized Sunglasses",
            "Universal travel power adapter",
            "Breathable activewear and lightweight jacket",
            "Refillable insulated water container",
            "Offline map packages downloaded on WanderWise App",
            "Sanitizer and small medical safety kit"
        ]

        return ItineraryResponse(
            destinations=request.destinations,
            duration_days=request.duration_days,
            itinerary=days,
            total_estimated_cost=estimated_cost,
            recommendations=recommendations,
            budget_breakdown=budget_breakdown,
            packing_list=packing_list,
            model_version=f"{self.model_name} (mock/fallback)"
        )

    def _generate_mock_chat_response(self, message: str, itinerary_context: Optional[dict] = None, language: str = "English") -> str:
        """
        Creates smart mock chatbot responses matching current context parameters and chosen language.
        """
        msg_lower = message.lower()
        dest = "your destinations"
        if itinerary_context and itinerary_context.get("destinations"):
            dest = ", ".join(itinerary_context.get("destinations", []))

        # Basic translation markers to prove backend translation works in mock mode
        lang_prefix = ""
        if language == "Tamil":
          lang_prefix = "[Tamil Guide (தமிழ்)] வணக்கம்! "
        elif language == "Spanish":
          lang_prefix = "[Spanish Guide (Español)] ¡Hola! "
        elif language == "French":
          lang_prefix = "[French Guide (Français)] Bonjour! "
        elif language == "Hindi":
          lang_prefix = "[Hindi Guide (हिन्दी)] नमस्ते! "
        elif language == "Chinese":
          lang_prefix = "[Chinese Guide (中文)] 你好! "
        elif language == "Arabic":
          lang_prefix = "[Arabic Guide (العربية)] مرحبًا! "
        else:
          lang_prefix = "[English Guide] Hi! "

        if "restaurant" in msg_lower or "food" in msg_lower or "eat" in msg_lower:
            return lang_prefix + f"Here are the top-rated dining spots near the spots in {dest}:\n1. **Gourmet Hub** (Organic, Vegetarian options)\n2. **Metro Dining Hall** (Hyper-local foods)\n3. **SkyLine Lounge** (Stunning smart-city views, book in advance via unified app)."
        
        if "shuttle" in msg_lower or "transport" in msg_lower or "bus" in msg_lower:
            return lang_prefix + f"Autonomous shuttle pods in {dest} run every 5 minutes. You can scan your WanderWise smart key card at any smart pole transit station to board instantly."

        if "weather" in msg_lower or "pack" in msg_lower:
            return lang_prefix + f"The average temperature in {dest} is expected to be quite pleasant. Make sure to pack items listed in your checklist, including sun protection and comfortable walking shoes."

        return lang_prefix + f"As your WanderBot concierge for {dest}, I'm here to help in {language}. I see you have a {itinerary_context.get('duration_days', 3)}-day plan configured. What else can I assist you with today?"
