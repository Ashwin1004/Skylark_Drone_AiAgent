import re
from typing import Dict, Any, List, Optional, Tuple
from app.utils.logging import get_logger

logger = get_logger("QueryUnderstanding")

SECTORS = ["mining", "powerline", "renewables", "railways", "construction", "tender", "dsp", "energy"]

AMBIGUOUS_PATTERNS = [
    "how are we doing",
    "how is performance",
    "give me an update",
    "how is everything",
    "show status",
    "overall status"
]

class QueryUnderstandingService:
    
    @staticmethod
    def classify_intent_and_params(
        question: str,
        context_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Determines query intent and extracts parameters (sector, timeframe, follow-ups).
        Handles vague/ambiguous queries by routing to 'ambiguous_query'.
        """
        q = question.lower().strip()
        params: Dict[str, Any] = {}

        # Extract Sector if present
        target_sector = None
        for s in SECTORS:
            if s in q:
                target_sector = s.title()
                if target_sector == "Energy":
                    target_sector = "Powerline"
                break
        if target_sector:
            params["sector"] = target_sector

        # Extract Timeframe
        if "this quarter" in q or "current quarter" in q:
            params["timeframe"] = "this quarter"
        elif "last quarter" in q or "previous quarter" in q:
            params["timeframe"] = "last quarter"
        elif "next quarter" in q:
            params["timeframe"] = "next quarter"
        elif "this month" in q or "current month" in q:
            params["timeframe"] = "this month"
        elif "ytd" in q or "year to date" in q:
            params["timeframe"] = "ytd"

        # Extract Explicit Probability Threshold (e.g. "below 30%" or "probability <= 40%")
        prob_match = re.search(r"(?:below|under|less than|<=|<)\s*(\d{1,2})\s*%", q)
        if prob_match:
            try:
                extracted_pct = float(prob_match.group(1))
                if 0 < extracted_pct <= 100:
                    params["low_probability_threshold"] = extracted_pct / 100.0
            except Exception:
                pass

        # Check for Conversational Follow-up Context
        last_intent = None
        last_sector = None
        if context_history and len(context_history) > 0:
            for turn in reversed(context_history):
                if turn.get("role") == "assistant" and turn.get("intent"):
                    last_intent = turn.get("intent")
                if turn.get("sector"):
                    last_sector = turn.get("sector")
                if last_intent:
                    break

        # Handle Short Follow-up (e.g., "What about Mining?")
        if len(q.split()) <= 4 and ("what about" in q or "how about" in q or target_sector):
            if last_intent and not any(k in q for k in ["leadership", "active work", "cross", "receivables", "pipeline"]):
                params["sector"] = target_sector or last_sector
                return last_intent, params

        # Detect Ambiguous Questions requiring Clarification
        if any(pat in q for pat in AMBIGUOUS_PATTERNS) and not target_sector and "pipeline" not in q and "work" not in q:
            return "ambiguous_query", params

        # Intent Classification rules
        if any(k in q for k in ["leadership", "executive", "founder", "update for leadership", "5 most important things"]):
            return "leadership_update", params

        if any(k in q for k in ["cross", "active work", "no active deal", "no active work", "perspective", "without deals", "without work"]):
            return "cross_board_customer_analysis", params

        if any(k in q for k in ["risk", "vulnerable", "low probability", "high deal value but low", "financial risk"]):
            return "deal_risk_analysis", params

        if any(k in q for k in ["owner", "owners", "managing", "kam", "bd personnel"]):
            return "owner_analytics", params

        if any(k in q for k in ["opportunity", "opportunities", "biggest deal", "high probability", "large deal", "closure"]):
            return "opportunity_analysis", params

        if any(k in q for k in ["combined", "largest combined", "customer value"]):
            return "customer_combined_value_analysis", params

        if any(k in q for k in ["sector", "performing", "mining", "powerline", "renewables", "railways", "construction"]):
            return "sector_analysis", params

        if any(k in q for k in ["quality", "data health", "missing", "data report"]):
            return "data_quality_report", params

        if any(k in q for k in ["pipeline", "funnel", "open deal", "target", "performing", "how is our pipeline"]):
            return "pipeline_overview", params

        # Default fallback to pipeline overview
        return "pipeline_overview", params
