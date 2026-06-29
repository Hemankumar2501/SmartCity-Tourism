"""
==============================================================================
  Smart City Tourism — Synthetic Data Generator
  Generates a premium-grade dataset (1,000+ rows) for analytics & EDA.

  Columns produced:
    User_ID, Timestamp, Destination, Duration_Days, Travelers_Count,
    Budget_Allocated, Review_Text, Sentiment_Label, Polarity_Score

  Author : Data Analytics Team
  Usage  : python data_generator.py
  Output : smart_tourism_data.csv  (saved in the same directory)
==============================================================================
"""

import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

NUM_ROWS = 1200  # Total synthetic records
SEED = 42        # Reproducibility seed
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "smart_tourism_data.csv")

np.random.seed(SEED)
random.seed(SEED)

# ──────────────────────────────────────────────────────────────────────────────
# Reference Data — mirrors the SmartCity-Tourism ecosystem
# ──────────────────────────────────────────────────────────────────────────────

DESTINATIONS = [
    "Chennai", "Dubai", "Abu Dhabi", "Madurai",
    "Singapore", "Kuala Lumpur", "Tokyo", "Bangkok",
]

# Weighted probability — Gulf & South-East Asian hubs are more popular
DEST_WEIGHTS = [0.15, 0.20, 0.12, 0.08, 0.14, 0.10, 0.11, 0.10]

BUDGET_TIERS = {
    #  destination  → (mean_daily_budget, std_dev)
    "Chennai":       (120, 40),
    "Dubai":         (350, 100),
    "Abu Dhabi":     (310, 90),
    "Madurai":       (80, 25),
    "Singapore":     (280, 75),
    "Kuala Lumpur":  (150, 50),
    "Tokyo":         (320, 85),
    "Bangkok":       (130, 45),
}

# Sample review templates per sentiment class
REVIEW_TEMPLATES = {
    "Positive": [
        "Absolutely loved the {dest} experience! The smart city infrastructure was incredible.",
        "The autonomous transit in {dest} was world-class. Highly recommend for families.",
        "Amazing dining and cultural immersion in {dest}. Would visit again in a heartbeat!",
        "{dest} exceeded every expectation. The AI concierge recommendations were spot-on.",
        "Stunning waterfront views in {dest}. The smart park technology was a highlight!",
        "Our trip to {dest} was seamless. Loved the eco-friendly pod shuttles.",
        "The heritage walk in {dest} combined with AR guides was next-level tourism.",
        "Five-star experience in {dest}. The hotel AI check-in saved us so much time.",
        "Brilliant night-life in {dest}. The city grid lighting was mesmerising.",
        "Fantastic culinary tour in {dest}. The food markets were vibrant and authentic.",
    ],
    "Negative": [
        "Disappointed with {dest}. The transit pods were frequently delayed or overcrowded.",
        "The smart kiosk in {dest} kept malfunctioning. Ruined our booking experience.",
        "{dest} was overpriced for what it offered. Not worth the luxury tier budget.",
        "Poor waste management in certain {dest} tourist zones. Expected better.",
        "Language barrier issues in {dest} despite the AI translator app promising full coverage.",
        "Safety concerns near the old quarter in {dest}. Not enough patrol drones visible.",
        "The hotel in {dest} was nothing like the virtual tour preview. Very misleading.",
        "Long wait times at {dest} attractions despite having smart-pass tickets.",
    ],
    "Neutral": [
        "{dest} was okay overall. Some attractions were great, others were average.",
        "Mixed feelings about {dest}. The tech was impressive but the food was mediocre.",
        "A decent trip to {dest}. Nothing extraordinary but no major complaints.",
        "{dest} has potential but the smart city rollout still feels incomplete.",
        "Standard tourism experience in {dest}. The AR guide was useful but buggy.",
        "Visited {dest} for 3 days. Some good moments, some forgettable ones.",
    ],
}

SENTIMENT_LABELS = ["Positive", "Negative", "Neutral"]
SENTIMENT_WEIGHTS = [0.50, 0.20, 0.30]  # Realistic skew toward positive


# ──────────────────────────────────────────────────────────────────────────────
# Generator Functions
# ──────────────────────────────────────────────────────────────────────────────

def generate_user_id(index: int) -> str:
    """Produce a zero-padded user identifier like 'USR-0001'."""
    return f"USR-{index + 1:04d}"


def generate_timestamp() -> datetime:
    """Return a random timestamp between Jan 2025 and Jun 2026."""
    start = datetime(2025, 1, 1)
    end = datetime(2026, 6, 28)
    delta = end - start
    random_offset = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_offset)


def generate_polarity(sentiment: str) -> float:
    """
    Sample a polarity score consistent with the sentiment label.
      Positive → [+0.20, +1.00]
      Negative → [-1.00, -0.20]
      Neutral  → [-0.20, +0.20]
    """
    if sentiment == "Positive":
        return round(np.random.uniform(0.20, 1.00), 4)
    elif sentiment == "Negative":
        return round(np.random.uniform(-1.00, -0.20), 4)
    else:
        return round(np.random.uniform(-0.20, 0.20), 4)


def generate_review(sentiment: str, destination: str) -> str:
    """Pick a random review template and fill in the destination."""
    template = random.choice(REVIEW_TEMPLATES[sentiment])
    return template.format(dest=destination)


def generate_budget(destination: str, duration_days: int) -> float:
    """
    Calculate a trip budget = daily_rate × duration, where the daily rate
    is drawn from a destination-specific normal distribution (clipped ≥ 30).
    """
    mean, std = BUDGET_TIERS[destination]
    daily_rate = max(30.0, np.random.normal(mean, std))
    return round(daily_rate * duration_days, 2)


# ──────────────────────────────────────────────────────────────────────────────
# Main Generation Pipeline
# ──────────────────────────────────────────────────────────────────────────────

def generate_dataset(n: int = NUM_ROWS) -> pd.DataFrame:
    """
    Build the full synthetic DataFrame row-by-row.

    Returns
    -------
    pd.DataFrame
        Columns: User_ID, Timestamp, Destination, Duration_Days,
                 Travelers_Count, Budget_Allocated, Review_Text,
                 Sentiment_Label, Polarity_Score
    """
    records: list[dict] = []

    for i in range(n):
        destination = np.random.choice(DESTINATIONS, p=DEST_WEIGHTS)
        sentiment = np.random.choice(SENTIMENT_LABELS, p=SENTIMENT_WEIGHTS)
        duration_days = random.randint(1, 10)
        travelers_count = random.randint(1, 8)

        records.append(
            {
                "User_ID": generate_user_id(i),
                "Timestamp": generate_timestamp(),
                "Destination": destination,
                "Duration_Days": duration_days,
                "Travelers_Count": travelers_count,
                "Budget_Allocated": generate_budget(destination, duration_days),
                "Review_Text": generate_review(sentiment, destination),
                "Sentiment_Label": sentiment,
                "Polarity_Score": generate_polarity(sentiment),
            }
        )

    df = pd.DataFrame(records)

    # Sort chronologically for a cleaner dataset
    df.sort_values("Timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)

    return df


# ──────────────────────────────────────────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  Smart City Tourism — Synthetic Data Generator")
    print("=" * 60)

    df = generate_dataset()

    # ── Summary Statistics ──
    print(f"\n[OK]  Generated {len(df):,} records across {df['Destination'].nunique()} destinations.")
    print(f"[DATE]  Date range : {df['Timestamp'].min():%Y-%m-%d} -> {df['Timestamp'].max():%Y-%m-%d}")
    print(f"[COST]  Budget     : ${df['Budget_Allocated'].min():,.2f} - ${df['Budget_Allocated'].max():,.2f}")
    print(f"\n[CHART] Sentiment Distribution:")
    for label, count in df["Sentiment_Label"].value_counts().items():
        pct = count / len(df) * 100
        print(f"    {label:>8s}  {count:>4d}  ({pct:.1f}%)")

    # -- Persist to CSV --
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n[SAVE]  Saved to: {OUTPUT_FILE}")
    print("=" * 60)
