"""
==============================================================================
  Smart City Tourism — Exploratory Data Analysis (EDA)
  Performs comprehensive analysis on `smart_tourism_data.csv` and generates
  publication-quality visualisations.

  Outputs
  -------
  1. budget_distribution.png          — Per-destination budget box-plot
  2. destination_sentiment_trends.png — Stacked sentiment counts by location

  Author : Data Analytics Team
  Usage  : python tour_eda_analysis.py
==============================================================================
"""

import os
import sys

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless rendering
import matplotlib.pyplot as plt
import seaborn as sns

# ──────────────────────────────────────────────────────────────────────────────
# Configuration & Styling
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, "smart_tourism_data.csv")

# Premium dark-mode plot theme
plt.rcParams.update({
    "figure.facecolor": "#0B0F19",
    "axes.facecolor": "#0F1629",
    "axes.edgecolor": "#1E293B",
    "axes.labelcolor": "#94A3B8",
    "axes.titlepad": 16,
    "text.color": "#E2E8F0",
    "xtick.color": "#64748B",
    "ytick.color": "#64748B",
    "grid.color": "#1E293B",
    "grid.alpha": 0.6,
    "font.family": "sans-serif",
    "font.size": 11,
    "figure.dpi": 150,
    "savefig.bbox": "tight",
    "savefig.pad_inches": 0.3,
})

# Custom colour palette — aligned with the app's cyan/indigo design system
PALETTE_CYAN_INDIGO = ["#06B6D4", "#6366F1", "#EC4899", "#10B981",
                       "#F59E0B", "#8B5CF6", "#EF4444", "#14B8A6"]
SENTIMENT_COLORS = {
    "Positive": "#10B981",  # Emerald
    "Neutral":  "#F59E0B",  # Amber
    "Negative": "#EF4444",  # Rose
}


# ──────────────────────────────────────────────────────────────────────────────
# 1. Data Loading & Validation
# ──────────────────────────────────────────────────────────────────────────────

def load_data(filepath: str) -> pd.DataFrame:
    """
    Load the tourism CSV and perform basic type casting.
    Exits gracefully if the file is missing.
    """
    if not os.path.isfile(filepath):
        sys.exit(
            f"❌  Data file not found: {filepath}\n"
            "    Run `python data_generator.py` first to create it."
        )

    df = pd.read_csv(filepath, parse_dates=["Timestamp"])

    # Validate expected columns
    required = {
        "User_ID", "Timestamp", "Destination", "Duration_Days",
        "Travelers_Count", "Budget_Allocated", "Review_Text",
        "Sentiment_Label", "Polarity_Score",
    }
    missing = required - set(df.columns)
    if missing:
        sys.exit(f"❌  Missing columns in CSV: {missing}")

    return df


# ──────────────────────────────────────────────────────────────────────────────
# 2. Descriptive Statistics
# ──────────────────────────────────────────────────────────────────────────────

def print_overview(df: pd.DataFrame) -> None:
    """Print a rich console summary of the dataset."""
    print("=" * 68)
    print("  DATASET OVERVIEW")
    print("=" * 68)
    print(f"  Total records     : {len(df):,}")
    print(f"  Unique users      : {df['User_ID'].nunique():,}")
    print(f"  Destinations      : {df['Destination'].nunique()}")
    print(f"  Date range        : {df['Timestamp'].min():%Y-%m-%d} -> {df['Timestamp'].max():%Y-%m-%d}")
    print(f"  Avg trip duration : {df['Duration_Days'].mean():.1f} days")
    print(f"  Avg travelers     : {df['Travelers_Count'].mean():.1f}")
    print(f"  Budget range      : ${df['Budget_Allocated'].min():,.2f} - ${df['Budget_Allocated'].max():,.2f}")
    print()


def budget_by_destination(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute per-destination budget statistics.

    Returns a DataFrame with columns:
      Mean, Median, Std, Min, Max, Count
    """
    stats = (
        df.groupby("Destination")["Budget_Allocated"]
        .agg(["mean", "median", "std", "min", "max", "count"])
        .rename(columns={
            "mean": "Mean", "median": "Median", "std": "Std",
            "min": "Min", "max": "Max", "count": "Count",
        })
        .sort_values("Mean", ascending=False)
    )
    return stats.round(2)


def sentiment_by_destination(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build a destination × sentiment cross-tab and compute the
    negative-to-positive ratio (higher = riskier destination).
    """
    ct = pd.crosstab(df["Destination"], df["Sentiment_Label"])

    # Ensure all three columns exist
    for col in ["Positive", "Neutral", "Negative"]:
        if col not in ct.columns:
            ct[col] = 0

    ct = ct[["Positive", "Neutral", "Negative"]]
    ct["Total"] = ct.sum(axis=1)
    ct["Neg_Pos_Ratio"] = (ct["Negative"] / ct["Positive"].replace(0, np.nan)).round(3)
    ct.sort_values("Neg_Pos_Ratio", ascending=False, inplace=True)

    return ct


def polarity_statistics(df: pd.DataFrame) -> pd.DataFrame:
    """Average polarity score per destination, split by sentiment."""
    return (
        df.groupby(["Destination", "Sentiment_Label"])["Polarity_Score"]
        .mean()
        .unstack(fill_value=0)
        .round(4)
    )


# ──────────────────────────────────────────────────────────────────────────────
# 3. Visualisation — Budget Distribution
# ──────────────────────────────────────────────────────────────────────────────

def plot_budget_distribution(df: pd.DataFrame) -> str:
    """
    Create a horizontal box-plot showing budget distribution per destination,
    overlaid with individual strip-plot data points for density awareness.

    Returns the saved file path.
    """
    # Sort destinations by median budget for visual clarity
    order = (
        df.groupby("Destination")["Budget_Allocated"]
        .median()
        .sort_values(ascending=True)
        .index.tolist()
    )

    fig, ax = plt.subplots(figsize=(12, 6.5))

    # Box plot — semi-transparent
    sns.boxplot(
        data=df, y="Destination", x="Budget_Allocated",
        order=order, orient="h",
        boxprops=dict(facecolor="#06B6D4", alpha=0.25, edgecolor="#06B6D4"),
        whiskerprops=dict(color="#06B6D4", alpha=0.6),
        capprops=dict(color="#06B6D4", alpha=0.6),
        medianprops=dict(color="#F59E0B", linewidth=2),
        flierprops=dict(marker="o", markerfacecolor="#EF4444", markersize=4, alpha=0.5),
        ax=ax, width=0.55,
    )

    # Strip overlay for individual data-point density
    sns.stripplot(
        data=df, y="Destination", x="Budget_Allocated",
        order=order, orient="h",
        color="#6366F1", alpha=0.18, size=3, jitter=0.3,
        ax=ax,
    )

    # Mean markers
    means = df.groupby("Destination")["Budget_Allocated"].mean()
    for i, dest in enumerate(order):
        ax.scatter(means[dest], i, color="#10B981", zorder=5, s=50,
                   marker="D", edgecolors="white", linewidths=0.6)

    # Formatting
    ax.set_title("Budget Distribution by Destination",
                 fontsize=16, fontweight="bold", color="#E2E8F0")
    ax.set_xlabel("Budget Allocated ($)", fontsize=12)
    ax.set_ylabel("")
    ax.grid(axis="x", linestyle="--", alpha=0.3)

    # Legend annotations
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], marker="D", color="w", markerfacecolor="#10B981",
               markersize=8, label="Mean", linestyle="None"),
        Line2D([0], [0], color="#F59E0B", linewidth=2, label="Median"),
    ]
    ax.legend(handles=legend_elements, loc="lower right",
              facecolor="#0F1629", edgecolor="#1E293B",
              fontsize=9, labelcolor="#94A3B8")

    filepath = os.path.join(SCRIPT_DIR, "budget_distribution.png")
    fig.savefig(filepath)
    plt.close(fig)
    return filepath


# ──────────────────────────────────────────────────────────────────────────────
# 4. Visualisation — Sentiment Trends by Destination
# ──────────────────────────────────────────────────────────────────────────────

def plot_sentiment_trends(df: pd.DataFrame) -> str:
    """
    Create a grouped bar chart showing sentiment counts per destination,
    with a secondary line overlay for the negative/positive ratio.

    Returns the saved file path.
    """
    ct = pd.crosstab(df["Destination"], df["Sentiment_Label"])
    for col in ["Positive", "Neutral", "Negative"]:
        if col not in ct.columns:
            ct[col] = 0
    ct = ct[["Positive", "Neutral", "Negative"]]
    ct.sort_values("Positive", ascending=False, inplace=True)

    destinations = ct.index.tolist()
    x = np.arange(len(destinations))
    bar_width = 0.24

    fig, ax1 = plt.subplots(figsize=(13, 6.5))

    # Grouped bars
    bars_pos = ax1.bar(x - bar_width, ct["Positive"], bar_width,
                       label="Positive", color=SENTIMENT_COLORS["Positive"],
                       alpha=0.85, edgecolor="white", linewidth=0.3)
    bars_neu = ax1.bar(x, ct["Neutral"], bar_width,
                       label="Neutral", color=SENTIMENT_COLORS["Neutral"],
                       alpha=0.85, edgecolor="white", linewidth=0.3)
    bars_neg = ax1.bar(x + bar_width, ct["Negative"], bar_width,
                       label="Negative", color=SENTIMENT_COLORS["Negative"],
                       alpha=0.85, edgecolor="white", linewidth=0.3)

    # Value labels on bars
    for bars in [bars_pos, bars_neu, bars_neg]:
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax1.text(bar.get_x() + bar.get_width() / 2, height + 1,
                         str(int(height)), ha="center", va="bottom",
                         fontsize=8, color="#94A3B8", fontweight="bold")

    # Secondary axis — Neg/Pos ratio line
    ax2 = ax1.twinx()
    ratio = (ct["Negative"] / ct["Positive"].replace(0, np.nan)).fillna(0)
    ax2.plot(x, ratio.values, color="#A78BFA", marker="o", linewidth=2,
             markersize=7, markeredgecolor="white", markeredgewidth=1,
             label="Neg/Pos Ratio", zorder=5)
    ax2.set_ylabel("Negative / Positive Ratio", fontsize=11, color="#A78BFA")
    ax2.tick_params(axis="y", labelcolor="#A78BFA")
    ax2.spines["right"].set_color("#A78BFA")
    ax2.set_ylim(0, max(ratio.values) * 1.6 if ratio.max() > 0 else 1)

    # Formatting
    ax1.set_xticks(x)
    ax1.set_xticklabels(destinations, rotation=25, ha="right", fontsize=10)
    ax1.set_title("Destination Sentiment Trends & Risk Ratio",
                  fontsize=16, fontweight="bold", color="#E2E8F0")
    ax1.set_xlabel("Destination", fontsize=12)
    ax1.set_ylabel("Review Count", fontsize=12)
    ax1.grid(axis="y", linestyle="--", alpha=0.2)

    # Combined legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2,
               loc="upper right", facecolor="#0F1629",
               edgecolor="#1E293B", fontsize=9, labelcolor="#94A3B8")

    filepath = os.path.join(SCRIPT_DIR, "destination_sentiment_trends.png")
    fig.savefig(filepath)
    plt.close(fig)
    return filepath


# ──────────────────────────────────────────────────────────────────────────────
# 5. Main Execution Pipeline
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    """
    Orchestrate the full EDA workflow:
      1. Load & validate data
      2. Print descriptive statistics
      3. Compute budget & sentiment aggregates
      4. Generate and save visualisations
    """
    # ── Step 1: Load ──
    df = load_data(DATA_FILE)
    print_overview(df)

    # ── Step 2: Budget Analysis ──
    budget_stats = budget_by_destination(df)
    print("-" * 68)
    print("  AVERAGE TRAVEL BUDGET PER DESTINATION")
    print("-" * 68)
    print(budget_stats.to_string())
    print()

    # ── Step 3: Sentiment Analysis ──
    sent_stats = sentiment_by_destination(df)
    print("-" * 68)
    print("  SENTIMENT BREAKDOWN BY DESTINATION")
    print("-" * 68)
    print(sent_stats.to_string())
    print()

    # Highlight the riskiest and safest destinations
    riskiest = sent_stats["Neg_Pos_Ratio"].idxmax()
    safest = sent_stats["Neg_Pos_Ratio"].idxmin()
    print(f"  [!]  Highest negative/positive ratio : {riskiest}"
          f"  (ratio = {sent_stats.loc[riskiest, 'Neg_Pos_Ratio']:.3f})")
    print(f"  [OK] Lowest  negative/positive ratio : {safest}"
          f"  (ratio = {sent_stats.loc[safest, 'Neg_Pos_Ratio']:.3f})")
    print()

    # ── Step 4: Polarity Deep-Dive ──
    polarity_stats = polarity_statistics(df)
    print("-" * 68)
    print("  AVERAGE POLARITY SCORE PER DESTINATION x SENTIMENT")
    print("-" * 68)
    print(polarity_stats.to_string())
    print()

    # ── Step 5: Visualisations ──
    print("-" * 68)
    print("  GENERATING VISUALISATIONS")
    print("-" * 68)

    path1 = plot_budget_distribution(df)
    print(f"  [CHART] Saved: {path1}")

    path2 = plot_sentiment_trends(df)
    print(f"  [CHART] Saved: {path2}")

    print()
    print("=" * 68)
    print("  [OK]  EDA pipeline complete. All outputs saved to analytics/")
    print("=" * 68)


if __name__ == "__main__":
    main()
