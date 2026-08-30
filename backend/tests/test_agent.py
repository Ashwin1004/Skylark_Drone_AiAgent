import pytest
from app.services.query_understanding import QueryUnderstandingService
from app.services.agent_orchestrator import AgentOrchestrator

def test_intent_classification_business_queries():
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

def test_six_specific_query_scenarios():
    # 1. "How is the Energy sector performing?"
    intent1, _ = QueryUnderstandingService.classify_intent_and_params("How is the Energy sector performing?")
    assert intent1 == "sector_analysis"

    # 2. "What is our total open pipeline value?"
    intent2, _ = QueryUnderstandingService.classify_intent_and_params("What is our total open pipeline value?")
    assert intent2 == "pipeline_overview"

    # 3. "Give me a complete pipeline health analysis."
    intent3, _ = QueryUnderstandingService.classify_intent_and_params("Give me a complete pipeline health analysis.")
    assert intent3 in ("pipeline_overview", "data_quality_report")

    # 4. "Prepare a leadership update."
    intent4, _ = QueryUnderstandingService.classify_intent_and_params("Prepare a leadership update.")
    assert intent4 == "leadership_update"

    # 5. "What are our biggest business risks?"
    intent5, _ = QueryUnderstandingService.classify_intent_and_params("What are our biggest business risks?")
    assert intent5 == "deal_risk_analysis"

    # 6. "Show me the data quality issues."
    intent6, _ = QueryUnderstandingService.classify_intent_and_params("Show me the data quality issues.")
    assert intent6 == "data_quality_report"

def test_intent_classification_conversational_and_out_of_scope():
    # Greetings
    for text in ["Hi", "Hii", "Hello", "Hey", "Good morning"]:
        intent, _ = QueryUnderstandingService.classify_intent_and_params(text)
        assert intent == "greeting", f"Failed for '{text}'"

    # Casual conversation
    for text in ["How are you?", "How's it going?", "Thanks", "Thank you"]:
        intent, _ = QueryUnderstandingService.classify_intent_and_params(text)
        assert intent == "casual_conversation", f"Failed for '{text}'"

    # Farewells
    for text in ["Bye", "Goodbye", "See you"]:
        intent, _ = QueryUnderstandingService.classify_intent_and_params(text)
        assert intent == "farewell", f"Failed for '{text}'"

    # Out of scope questions
    for text in ["What is the capital of India?", "Tell me a joke", "How to cook pasta"]:
        intent, _ = QueryUnderstandingService.classify_intent_and_params(text)
        assert intent == "out_of_scope", f"Failed for '{text}'"

def test_compound_queries_classified_as_business():
    intent, _ = QueryUnderstandingService.classify_intent_and_params("Hi, how is our pipeline?")
    assert intent == "pipeline_overview"

    intent, _ = QueryUnderstandingService.classify_intent_and_params("Thanks. Which sector has the highest pipeline?")
    assert intent in ("sector_analysis", "pipeline_overview")

def test_ambiguity_classification():
    intent, params = QueryUnderstandingService.classify_intent_and_params("How are we doing?")
    assert intent == "ambiguous_query"

@pytest.mark.asyncio
async def test_orchestrator_conversational_handling():
    orchestrator = AgentOrchestrator()

    # Greeting
    res_hi = await orchestrator.process_question("Hi")
    assert res_hi.intent == "greeting"
    assert res_hi.data_sources == []
    assert "Skylark Agent" in res_hi.answer

    # How are you
    res_how = await orchestrator.process_question("How are you?")
    assert res_how.intent == "casual_conversation"
    assert res_how.data_sources == []
    assert "ready to help you analyze" in res_how.answer

    # Thanks
    res_thanks = await orchestrator.process_question("Thanks")
    assert res_thanks.intent == "casual_conversation"
    assert res_thanks.data_sources == []
    assert "You're welcome!" in res_thanks.answer

    # Farewell
    res_bye = await orchestrator.process_question("Bye")
    assert res_bye.intent == "farewell"
    assert res_bye.data_sources == []
    assert "Goodbye!" in res_bye.answer

    # Out of Scope
    res_scope = await orchestrator.process_question("What is the capital of India?")
    assert res_scope.intent == "out_of_scope"
    assert res_scope.data_sources == []
    assert "outside my business intelligence scope" in res_scope.answer

@pytest.mark.asyncio
async def test_orchestrator_ambiguous_query():
    orchestrator = AgentOrchestrator()
    response = await orchestrator.process_question("How are we doing?")
    assert response.intent == "ambiguous_query"
    assert "Query Clarification Needed" in response.answer
