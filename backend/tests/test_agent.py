import pytest
from app.services.query_understanding import QueryUnderstandingService
from app.services.agent_orchestrator import AgentOrchestrator

def test_intent_classification():
    intent, params = QueryUnderstandingService.classify_intent_and_params("How is our pipeline looking this quarter?")
    assert intent == "pipeline_overview"
    assert params.get("timeframe") == "this quarter"

    intent, params = QueryUnderstandingService.classify_intent_and_params("How is the Energy sector performing?")
    assert intent == "sector_analysis"
    assert params.get("sector") == "Powerline"

    intent, params = QueryUnderstandingService.classify_intent_and_params("Prepare a leadership update.")
    assert intent == "leadership_update"

    intent, params = QueryUnderstandingService.classify_intent_and_params("Which customers have active work orders but no active deals?")
    assert intent == "cross_board_customer_analysis"

def test_ambiguity_classification():
    intent, params = QueryUnderstandingService.classify_intent_and_params("How are we doing?")
    assert intent == "ambiguous_query"

@pytest.mark.asyncio
async def test_orchestrator_ambiguous_query():
    orchestrator = AgentOrchestrator()
    response = await orchestrator.process_question("How are we doing?")
    assert response.intent == "ambiguous_query"
    assert "Query Clarification Needed" in response.answer
