"""
Global Business Analytics Thresholds & Configuration Defaults for Skylark BI.
All threshold values are documented, deterministic, and configurable.
"""

# Default High Deal Value Threshold: ₹1 Cr (₹10,000,000)
HIGH_VALUE_THRESHOLD: float = 1_00_00_000.0

# Default Low Closure Probability Threshold: 20% (0.20)
LOW_PROBABILITY_THRESHOLD: float = 0.20

# Default High Probability Opportunity Threshold: 70% (0.70)
HIGH_PROBABILITY_THRESHOLD: float = 0.70

# Default Top N Count for Rankings
DEFAULT_TOP_N: int = 5
