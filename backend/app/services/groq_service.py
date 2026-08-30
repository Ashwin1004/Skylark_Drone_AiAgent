import os
import re
import json
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.utils.logging import get_logger

logger = get_logger("GroqService")

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

MULTI_INTENT_SYSTEM_PROMPT = """You are Skylark BI, the Executive Business Intelligence AI Assistant for Skylark Drones leadership.

MULTI-INTENT RESPONSE INSTRUCTIONS:
The user has asked a compound business question containing multiple distinct business questions.
You MUST answer EVERY requested question thoroughly in a single unified executive report. NEVER skip any question or intent.

STRUCTURE YOUR RESPONSE STRICTLY AS FOLLOWS:

# Executive Summary
A concise 2-3 sentence executive overview summarizing key findings across all requested business areas.

For EACH requested analysis area:

# [Section Name, e.g. Revenue & Collection Risks / Energy Sector Performance]

## Key Metrics
Total values, deal counts, weighted sums, stage distributions, work order metrics.

## What the Data Shows
2-3 data-backed insights explaining performance patterns.

## Risks
Business risks ONLY (concentration, win-rate, billing gap, forecast risk).

## Recommended Actions
2-4 specific, actionable steps connected directly to risks.

# Overall Priority
2 to 4 most important strategic actions across all analyzed areas.

STRICT FORMATTING & COMPLETENESS RULES:
1. STRICT NO-ASTERISKS RULE: DO NOT use double asterisks (**) anywhere. Write clean plain text headers (# Section, ## Subsection), plain bullets (- Item), and numbered lists (1. Item).
2. RESPONSE COMPLETENESS: Write complete, finished sentences. Never stop mid-sentence or truncate bullet points.
3. INDEPENDENCE OF SECTOR ANALYSIS: The absence of deals for a sector in a specific risk filter (such as high-value low-probability risk deals) DOES NOT mean there is no sector data. Evaluate sector performance using the full sector metrics in the JSON payload.
4. VERIFIED METRICS ONLY: Rely strictly on pre-computed Python metrics in the JSON payload.
"""

def is_response_complete(text: str) -> bool:
    """
    Validates that a generated AI response ends with a complete sentence
    and is not cut off mid-sentence, mid-bullet, or mid-heading.
    """
    if not text or not text.strip():
        return False
    t = text.strip()
    
    last_line = t.split("\n")[-1].strip()
    
    # Incomplete headings or dangling bullet prefixes
    if last_line.startswith("#") or last_line.endswith(":") or last_line.endswith("-") or last_line.endswith("*"):
        return False
    
    # Must end with sentence-ending punctuation (. ! ?)
    if not re.search(r'[\.\!\?"]\s*$', t):
        return False
        
    return True

class GroqService:
    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key

    @property
    def api_key(self) -> Optional[str]:
        return self._api_key or os.getenv("GROQ_API_KEY")

    @property
    def model(self) -> str:
        model_name = os.getenv("GROQ_MODEL")
        if not model_name or not str(model_name).strip():
            logger.error("GROQ_MODEL environment variable is missing.")
            raise ValueError("GROQ_MODEL environment variable is missing.")
        return str(model_name).strip()

    @property
    def client(self) -> Optional[AsyncOpenAI]:
        key = self.api_key
        if key:
            return AsyncOpenAI(
                api_key=key,
                base_url=GROQ_BASE_URL
            )
        return None

    async def generate_executive_explanation(
        self,
        question: str,
        intent: str,
        metrics: Dict[str, Any],
        data_quality: Dict[str, Any],
        explainability: Dict[str, Any]
    ) -> str:
        """
        Calls Groq LLM API to convert deterministic Pandas metrics into an executive-ready business explanation.
        Ensures max_tokens is generous (1250) and validates response completeness.
        """
        client = self.client
        if not client:
            raise ValueError("GROQ_API_KEY environment variable is missing.")

        current_model = self.model
        is_data_quality_query = intent == "data_quality_report" or "quality" in question.lower() or "health" in question.lower()

        risk_instruction = (
            "CRITICAL INSTRUCTION FOR RISKS & DATA CAVEATS SECTION:\n"
            "Include complete data-quality audit details (score %, missing values, record exclusions) as requested by the user."
            if is_data_quality_query else
            "CRITICAL INSTRUCTION FOR RISKS & DATA CAVEATS SECTION:\n"
            "Focus ONLY on meaningful BUSINESS RISKS (e.g. low win-rate, pipeline concentration, deal concentration, forecast risk, billing/collection gap, sector dependency).\n"
            "DO NOT include data quality scores, missing fields count, missing values, or record exclusion stats in this section. If no material business risks exist, write 'No material business risks identified from the available data.'"
        )

        user_prompt = f"""
User Question: "{question}"
Query Intent: {intent}
Timeframe Resolved: {explainability.get('timeframe_resolved', 'All Time')}

VERIFIED DETERMINISTIC METRICS (COMPUTED IN PYTHON / PANDAS):
{json.dumps(metrics, indent=2, default=str)}

DATA QUALITY AUDIT REPORT (INTERNAL REFERENCE ONLY):
{json.dumps(data_quality, indent=2, default=str)}

EXPLAINABILITY DETAILS:
{json.dumps(explainability, indent=2, default=str)}

{risk_instruction}

Please format a clear, founder-ready executive answer strictly adhering to the system instructions.
"""
        logger.info(f"Sending prompt to Groq API (Model: {current_model})")

        try:
            response = await client.chat.completions.create(
                model=current_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=750
            )
            content = response.choices[0].message.content or ""
            content = content.replace("**", "")
            
            # Validation for completeness
            if not is_response_complete(content):
                logger.warning("Executive explanation appeared incomplete. Requesting completion extension...")
                completion_res = await client.chat.completions.create(
                    model=current_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                        {"role": "assistant", "content": content},
                        {"role": "user", "content": "Please complete the remaining sentences and sections in full."}
                    ],
                    temperature=0.1,
                    max_tokens=500
                )
                extra = completion_res.choices[0].message.content or ""
                content = (content + "\n" + extra).replace("**", "")

            logger.info(f"Successfully received executive response from Groq API (Model: {current_model}).")
            return content
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            raise e

    async def generate_multi_intent_explanation(
        self,
        question: str,
        multi_payload: Dict[str, Any],
        data_quality: Dict[str, Any]
    ) -> str:
        """
        Calls Groq API to generate a multi-intent executive response covering all requested business areas.
        Uses a large max_tokens limit (2500) and completeness validation to guarantee complete responses.
        """
        client = self.client
        if not client:
            raise ValueError("GROQ_API_KEY environment variable is missing.")

        current_model = self.model

        user_prompt = f"""
User Question: "{question}"

MULTI-INTENT DETERMINISTIC ANALYTICS PAYLOAD (COMPUTED IN PYTHON / PANDAS):
{json.dumps(multi_payload, indent=2, default=str)}

DATA QUALITY AUDIT REPORT (INTERNAL REFERENCE ONLY):
{json.dumps(data_quality, indent=2, default=str)}

Please produce a comprehensive multi-intent executive report addressing EVERY section in full without truncating any sentences.
"""
        logger.info(f"Sending multi-intent prompt to Groq API (Model: {current_model})")

        try:
            response = await client.chat.completions.create(
                model=current_model,
                messages=[
                    {"role": "system", "content": MULTI_INTENT_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=1400
            )
            content = response.choices[0].message.content or ""
            content = content.replace("**", "")

            # Validation for completeness
            if not is_response_complete(content):
                logger.warning("Multi-intent response appeared incomplete. Requesting completion extension...")
                completion_res = await client.chat.completions.create(
                    model=current_model,
                    messages=[
                        {"role": "system", "content": MULTI_INTENT_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                        {"role": "assistant", "content": content},
                        {"role": "user", "content": "Please complete the remaining sentences and sections in full."}
                    ],
                    temperature=0.1,
                    max_tokens=800
                )
                extra = completion_res.choices[0].message.content or ""
                content = (content + "\n" + extra).replace("**", "")

            logger.info(f"Successfully received multi-intent response from Groq API (Model: {current_model}).")
            return content
        except Exception as e:
            logger.error(f"Error calling Groq API for multi-intent: {str(e)}")
            raise e
