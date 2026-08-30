import os
import json
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.utils.logging import get_logger

logger = get_logger("GroqService")

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

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
        """
        client = self.client
        if not client:
            raise ValueError("GROQ_API_KEY environment variable is missing.")

        current_model = self.model

        user_prompt = f"""
User Question: "{question}"
Query Intent: {intent}
Timeframe Resolved: {explainability.get('timeframe_resolved', 'All Time')}

VERIFIED DETERMINISTIC METRICS (COMPUTED IN PYTHON / PANDAS):
{json.dumps(metrics, indent=2, default=str)}

DATA QUALITY AUDIT REPORT:
{json.dumps(data_quality, indent=2, default=str)}

EXPLAINABILITY DETAILS:
{json.dumps(explainability, indent=2, default=str)}

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
                temperature=0.2,
                max_tokens=1000
            )
            content = response.choices[0].message.content or ""
            logger.info(f"Successfully received executive response from Groq API (Model: {current_model}).")
            return content
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            raise e
