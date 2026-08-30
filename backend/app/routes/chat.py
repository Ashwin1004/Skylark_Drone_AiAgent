from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.agent_orchestrator import AgentOrchestrator
from app.utils.logging import get_logger

logger = get_logger("ChatRoute")
router = APIRouter()
orchestrator = AgentOrchestrator()

# In-memory cache for completed analysis requests (keyed by request_id)
completed_requests_cache: Dict[str, ChatResponse] = {}

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main business intelligence query endpoint.
    Supports request_id tracking to prevent duplicate calculations and recover interrupted requests.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question string cannot be empty.")

    req_id = request.request_id

    # If request_id already completed, return cached response instantly
    if req_id and req_id in completed_requests_cache:
        logger.info(f"Serving completed request from cache (Request ID: {req_id})")
        return completed_requests_cache[req_id]

    try:
        response = await orchestrator.process_question(
            question=request.question.strip(),
            context_history=request.context_history
        )
        
        if req_id:
            completed_requests_cache[req_id] = response
            # Keep cache bounded to top 100 recent requests
            if len(completed_requests_cache) > 100:
                oldest_key = next(iter(completed_requests_cache))
                del completed_requests_cache[oldest_key]

        return response
    except ValueError as e:
        logger.error(f"Configuration or validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Monday.com configuration missing: {str(e)}")
    except PermissionError as e:
        logger.error(f"Authentication failure: {e}")
        raise HTTPException(status_code=401, detail="Could not authenticate with Monday.com. Please check MONDAY_API_TOKEN.")
    except TimeoutError as e:
        logger.error(f"Timeout error: {e}")
        raise HTTPException(status_code=504, detail="Monday.com API service timed out. Please try again shortly.")
    except RuntimeError as e:
        logger.error(f"Runtime API error: {e}")
        raise HTTPException(status_code=503, detail=f"Monday.com API service error: {str(e)}")
    except Exception as e:
        logger.error(f"Unhandled error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while processing your request: {str(e)}"
        )

@router.get("/chat/status/{request_id}")
async def get_request_status(request_id: str):
    """
    Checks if an analysis request has completed.
    """
    if request_id in completed_requests_cache:
        return {"status": "completed", "response": completed_requests_cache[request_id]}
    return {"status": "not_found"}
