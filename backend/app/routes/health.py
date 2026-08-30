import os
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.monday_service import MondayService
from app.utils.logging import get_logger

logger = get_logger("HealthRoute")
router = APIRouter()
monday_service = MondayService()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Main system health diagnostic endpoint.
    Runs live health check against Monday.com GraphQL API.
    """
    monday_health = await monday_service.check_connection_health()
    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL")

    has_monday = monday_health.get("connected", False)
    has_groq = bool(groq_key and groq_model)

    return HealthResponse(
        status="healthy" if (has_monday or has_groq) else "degraded",
        monday_connected=has_monday,
        deals_board_id=os.getenv("MONDAY_DEALS_BOARD_ID"),
        work_orders_board_id=os.getenv("MONDAY_WORK_ORDERS_BOARD_ID"),
        details={
            "monday_status": monday_health.get("status_message", "Monday.com • Connection Error"),
            "monday_reason": monday_health.get("reason"),
            "groq_ai_configured": has_groq,
            "groq_model": groq_model,
            "read_only_enforced": True
        }
    )

@router.get("/health/monday")
async def monday_health():
    """
    Monday.com GraphQL API connection probe.
    """
    health_data = await monday_service.check_connection_health()
    return {
        "status": "online" if health_data.get("connected") else "offline",
        "label": health_data.get("status_message"),
        "integration": "Monday.com GraphQL API v2023-10",
        "deals_board_id": os.getenv("MONDAY_DEALS_BOARD_ID"),
        "work_orders_board_id": os.getenv("MONDAY_WORK_ORDERS_BOARD_ID"),
        "details": health_data,
        "mode": "read_only"
    }

@router.get("/health/ai")
async def ai_health():
    """
    Groq AI service status check.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL")
    is_configured = bool(groq_key and groq_model)

    return {
        "status": "online" if is_configured else "offline",
        "provider": "Groq",
        "configured": is_configured,
        "model": groq_model,
        "base_url": "https://api.groq.com/openai/v1"
    }

@router.get("/metadata")
async def system_metadata():
    """
    Returns platform capability manifest.
    """
    return {
        "platform": "Skylark BI — Executive Intelligence Platform",
        "version": "1.0.0",
        "supported_intents": [
            "pipeline_overview",
            "sector_analysis",
            "opportunity_analysis",
            "work_order_analysis",
            "billing_analysis",
            "cross_board_customer_analysis",
            "leadership_update",
            "ambiguous_query",
            "data_quality_report"
        ],
        "deterministic_engine": "Pandas 2.2",
        "llm_provider": f"Groq ({os.getenv('GROQ_MODEL', 'Unconfigured')})",
        "security": {
            "read_only_monday": True,
            "backend_token_isolation": True
        }
    }
