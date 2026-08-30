from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.agent_orchestrator import AgentOrchestrator
from app.utils.logging import get_logger

logger = get_logger("ChatRoute")
router = APIRouter()
orchestrator = AgentOrchestrator()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main business intelligence query endpoint.
    Receives user natural language question, coordinates intent classification, dynamic Monday.com data fetching,
    data cleaning, deterministic analytics, and returns an explainable executive answer.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question string cannot be empty.")

    try:
        response = await orchestrator.process_question(
            question=request.question.strip(),
            context_history=request.context_history
        )
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
