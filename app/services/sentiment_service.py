"""
Sentiment Service module.

Provides NLP sentiment analysis and keyphrase extraction capabilities using TextBlob.
"""

import logging
from typing import List, Dict, Any
import nltk
from textblob import TextBlob
from app.schemas.tour_schemas import ReviewRequest, ReviewResponse

logger = logging.getLogger(__name__)


class SentimentService:
    """
    Service for executing sentiment analysis and textual classification on user reviews.
    """

    def __init__(self) -> None:
        """
        Initialize the sentiment analysis service and ensure required NLTK data is downloaded.
        """
        for resource in ["brown", "punkt", "wordnet"]:
            try:
                # Attempt to find the package locally
                if resource == "punkt":
                    nltk.data.find("tokenizers/punkt")
                else:
                    nltk.data.find(f"corpora/{resource}")
            except LookupError:
                try:
                    logger.info(f"Downloading required NLTK corpus '{resource}'...")
                    nltk.download(resource, quiet=True)
                except Exception as e:
                    logger.warning(
                        f"Failed to auto-download NLTK resource '{resource}': {str(e)}"
                    )

    async def analyze_review_sentiment(self, review_text: str) -> dict:
        """
        Analyzes the sentiment of a given review text asynchronously.

        Calculates polarity and subjectivity using TextBlob. Classifies the review
        as 'Positive' (polarity > 0.1), 'Negative' (polarity < -0.1), or 'Neutral'.

        Args:
            review_text (str): The raw text content of the review.

        Returns:
            dict: A dictionary containing original_text, sentiment_label,
                  polarity_score, and confidence_metrics (subjectivity).

        Raises:
            ValueError: If the input text is empty or invalid.
            Exception: If an unexpected error occurs during processing.
        """
        if not review_text or not isinstance(review_text, str) or not review_text.strip():
            raise ValueError("Review text must be a non-empty string.")

        try:
            # Execute TextBlob parsing
            blob = TextBlob(review_text)
            
            # Polarity ranges from [-1.0, 1.0]
            # Subjectivity ranges from [0.0, 1.0] (where 0.0 is objective, 1.0 is subjective)
            polarity: float = float(blob.sentiment.polarity)
            subjectivity: float = float(blob.sentiment.subjectivity)

            # Classify sentiment label based on thresholds
            if polarity > 0.1:
                sentiment_label = "Positive"
            elif polarity < -0.1:
                sentiment_label = "Negative"
            else:
                sentiment_label = "Neutral"

            return {
                "original_text": review_text,
                "sentiment_label": sentiment_label,
                "polarity_score": polarity,
                "confidence_metrics": {
                    "subjectivity": subjectivity,
                }
            }

        except Exception as e:
            logger.error(f"Error processing sentiment analysis for review: {str(e)}")
            raise

