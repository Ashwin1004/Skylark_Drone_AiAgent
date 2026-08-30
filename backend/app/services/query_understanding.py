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

BUSINESS_KEYWORDS = [
    "pipeline", "deal", "deals", "funnel", "stage", "stages", "weighted", "forecast",
    "work order", "work orders", "order", "orders", "operation", "operations",
    "revenue", "billing", "invoice", "invoicing", "collection", "collections", "receivables", "pending",
    "sector", "sectors", "mining", "powerline", "renewables", "railways", "construction", "tender", "dsp", "energy",
    "opportunity", "opportunities", "closure", "probability",
    "leadership", "executive", "founder", "brief", "update",
    "risk", "risks", "vulnerable", "owner", "owners", "kam", "bd", "customer", "customers", "client", "clients",
    "skylark", "monday", "board", "boards", "quality", "health", "issues", "performance", "total", "value", "compare", "comparison"
]

GREETING_PATTERNS = [
    r"^\s*(hi|hii|hiii|hello|hey|heyy|greetings)\s*$",
    r"^\s*(good\s+(morning|afternoon|evening|day))\s*$"
]

FAREWELL_PATTERNS = [
    r"^\s*(bye|goodbye|see\s+you|see\s+ya|talk\s+to\s+you\s+later|have\s+a\s+good\s+day|take\s+care)\s*$"
]

THANKS_PATTERNS = [
    r"^\s*(thanks|thank\s+you|thanks\s+a\s+lot|thank\s+you\s+so\s+much|thx)\s*$"
]

CASUAL_PATTERNS = [
    r"^\s*how\s+(are\s+you|is\s+it\s+going|s\s+it\s+going|are\s+things|s\s+going)\s*\??\s*$",
    r".*\bhow\s+(are\s+you|is\s+it\s+going|are\s+things)\b.*",
    r"^\s*what\s*(s|\s+is)?\s+up\s*\??\s*$",
    r"^\s*(nice|awesome|cool|great|ok|okay)\s*$"
]

class QueryUnderstandingService:
    
    @staticmethod
    def classify_intent_and_params(
        question: str,
        context_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Determines query intent and extracts parameters.
        Classifies queries BEFORE any database or API call into:
        1. GREETING
        2. CASUAL_CONVERSATION
        3. FAREWELL
        4. OUT_OF_SCOPE
        5. BUSINESS_QUERY (pipeline_overview, sector_analysis, etc.)
        """
        q = question.lower().strip()
        q_clean = re.sub(r'[^\w\s]', ' ', q)
        q_clean = ' '.join(q_clean.split())
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

        # Check explicit business relevance
        is_business = any(re.search(r'\b' + re.escape(kw) + r'\b', q) for kw in BUSINESS_KEYWORDS) or target_sector is not None or "timeframe" in params

        # Extract Explicit Probability Threshold (e.g. "below 30%" or "probability <= 40%")
        prob_match = re.search(r"(?:below|under|less than|<=|<)\s*(\d{1,2})\s*%", q)
        if prob_match:
            try:
                extracted_pct = float(prob_match.group(1))
                if 0 < extracted_pct <= 100:
                    params["low_probability_threshold"] = extracted_pct / 100.0
                    is_business = True
            except Exception:
                pass

        # Check Ambiguous Query Patterns first
        if any(pat in q for pat in AMBIGUOUS_PATTERNS) and not is_business:
            return "ambiguous_query", params

        # If it is NOT a business query, classify into GREETING, FAREWELL, CASUAL_CONVERSATION, or OUT_OF_SCOPE
        if not is_business:
            # 1. Greetings
            for pattern in GREETING_PATTERNS:
                if re.match(pattern, q_clean):
                    return "greeting", params

            # 2. Farewells
            for pattern in FAREWELL_PATTERNS:
                if re.match(pattern, q_clean):
                    return "farewell", params

            # 3. Casual Conversation / Thanks
            for pattern in THANKS_PATTERNS:
                if re.match(pattern, q_clean):
                    params["casual_subtype"] = "thanks"
                    return "casual_conversation", params

            for pattern in CASUAL_PATTERNS:
                if re.match(pattern, q_clean):
                    params["casual_subtype"] = "how_are_you"
                    return "casual_conversation", params

            # Check if query is short non-business greeting/casual phrase
            if len(q_clean.split()) <= 2 and any(w in q_clean for w in ["hi", "hello", "hey", "thanks", "bye"]):
                if any(w in q_clean for w in ["bye", "goodbye"]):
                    return "farewell", params
                if any(w in q_clean for w in ["thanks"]):
                    params["casual_subtype"] = "thanks"
                    return "casual_conversation", params
                return "greeting", params

            # ALL other non-business questions are OUT_OF_SCOPE!
            return "out_of_scope", params

        # BUSINESS QUERY INTENTS

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

        # Handle Short Follow-up (e.g., "What about Mining?" or "What about collections?")
        if len(q.split()) <= 5 and ("what about" in q or "how about" in q or target_sector):
            if "collections" in q or "billing" in q:
                return "billing_analysis", params
            if last_intent and not any(k in q for k in ["leadership", "active work", "cross", "receivables", "pipeline"]):
                params["sector"] = target_sector or last_sector
                return last_intent, params

        # Intent Classification rules for Business Queries
        if any(k in q for k in ["leadership", "executive", "founder", "update for leadership", "5 most important things"]):
            return "leadership_update", params

        if any(k in q for k in ["compare", "comparison", "cross", "active work", "no active deal", "no active work", "perspective", "without deals", "without work"]):
            return "cross_board_customer_analysis", params

        if any(k in q for k in ["risk", "risks", "vulnerable", "high-value deal", "high-value deals", "low probability", "high deal value but low", "financial risk"]):
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

        if any(k in q for k in ["billing", "invoice", "invoicing", "pending billing", "unbilled", "collection", "collections"]):
            return "billing_analysis", params

        if any(k in q for k in ["work order", "work orders", "active work orders", "operations"]):
            return "work_order_analysis", params

        if any(k in q for k in ["pipeline", "funnel", "open deal", "target", "performing", "how is our pipeline"]):
            return "pipeline_overview", params

        return "pipeline_overview", params

    @classmethod
    def detect_all_intents_and_params(
        cls,
        question: str,
        context_history: Optional[List[Dict[str, str]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Detects multiple business intents from a single user message.
        Splits compound/multi-sentence queries and evaluates each clause.
        Returns a list of intent dictionaries: [{"intent": str, "params": dict, "clause": str}]
        """
        q_raw = question.strip()
        
        # Split by question marks, periods, exclamation marks, or conjunction connectors (also, and how, plus, furthermore)
        clauses = [c.strip() for c in re.split(r'[\?!\.]|\b(?:also|plus|furthermore|and which|and how)\b', q_raw, flags=re.IGNORECASE) if c.strip()]
        
        # If single clause, classify normally
        if len(clauses) <= 1:
            intent, params = cls.classify_intent_and_params(q_raw, context_history)
            return [{"intent": intent, "params": params, "clause": q_raw}]

        intents_list = []
        seen_keys = set()
        has_business = False

        for clause in clauses:
            if len(clause) < 3:
                continue
            intent, params = cls.classify_intent_and_params(clause, context_history)
            
            sector = params.get("sector", "")
            dedup_key = f"{intent}:{sector}"

            if intent not in ("out_of_scope", "greeting", "casual_conversation", "farewell"):
                has_business = True

            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                intents_list.append({"intent": intent, "params": params, "clause": clause})

        # If business intents are present, filter out casual/out_of_scope noise clauses
        if has_business:
            business_intents = [item for item in intents_list if item["intent"] not in ("out_of_scope", "greeting", "casual_conversation", "farewell")]
            if business_intents:
                return business_intents

        # If no business intents detected from clauses, classify whole prompt
        intent, params = cls.classify_intent_and_params(q_raw, context_history)
        return [{"intent": intent, "params": params, "clause": q_raw}]
