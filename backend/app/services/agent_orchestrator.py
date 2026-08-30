import asyncio
from typing import Dict, Any, List, Optional
from app.services.monday_service import MondayService
from app.services.data_cleaning import DataNormalizer
from app.services.analytics import AnalyticsEngine
from app.services.query_understanding import QueryUnderstandingService
from app.services.ai_service import AIService
from app.services.leadership_service import LeadershipService
from app.utils.dates import resolve_relative_timeframe
from app.models.schemas import ChatResponse, DataQualityReport, ExplainabilityMetadata
from app.utils.logging import get_logger

logger = get_logger("AgentOrchestrator")

SUGGESTED_QUESTIONS = [
    "How is our pipeline looking this quarter?",
    "Which deals need executive attention?",
    "Which sectors are driving pipeline growth?",
    "How many active work orders do we have?",
    "What's currently pending billing?",
    "Prepare a leadership brief"
]

class AgentOrchestrator:
    def __init__(self):
        self.monday_service = MondayService()
        self.ai_service = AIService()

    async def process_question(
        self,
        question: str,
        context_history: Optional[List[Dict[str, str]]] = None
    ) -> ChatResponse:
        """
        Main orchestration loop supporting single-intent and multi-intent queries.
        Classifies incoming intents BEFORE any Monday.com API calls or analytics execution.
        """
        logger.info(f"Processing user question: '{question}'")

        # 1. Detect all intents & parameters BEFORE any API calls
        detected_intents = QueryUnderstandingService.detect_all_intents_and_params(question, context_history)
        primary_item = detected_intents[0] if detected_intents else {"intent": "pipeline_overview", "params": {}}
        primary_intent = primary_item["intent"]
        primary_params = primary_item["params"]

        # If single non-business intent, handle conversational responses immediately without calling Monday.com API
        if len(detected_intents) == 1 and primary_intent in ("greeting", "casual_conversation", "farewell", "out_of_scope", "ambiguous_query"):
            
            if primary_intent == "greeting":
                logger.info("Matched GREETING intent. Returning casual greeting without calling Monday.com API.")
                return ChatResponse(
                    answer="Hi! 👋 I'm Skylark Agent. What would you like to know about the business?",
                    intent="greeting",
                    data_sources=[],
                    metrics={},
                    data_quality=DataQualityReport(score=100.0, total_records=0, valid_records=0, deductions=[]),
                    explainability=ExplainabilityMetadata(
                        data_sources=[], calculation_method="Conversational greeting response.", timeframe_resolved="N/A"
                    ),
                    suggested_followups=SUGGESTED_QUESTIONS[:4]
                )

            if primary_intent == "casual_conversation":
                logger.info("Matched CASUAL_CONVERSATION intent. Returning casual response without calling Monday.com API.")
                casual_subtype = primary_params.get("casual_subtype")
                if casual_subtype == "thanks":
                    answer_text = "You're welcome! Let me know if you'd like to explore any business insights."
                else:
                    answer_text = "I'm doing great! I'm ready to help you analyze Skylark's business. Ask me about pipeline, deals, work orders, revenue, sectors, risks, or leadership insights."

                return ChatResponse(
                    answer=answer_text,
                    intent="casual_conversation",
                    data_sources=[],
                    metrics={},
                    data_quality=DataQualityReport(score=100.0, total_records=0, valid_records=0, deductions=[]),
                    explainability=ExplainabilityMetadata(
                        data_sources=[], calculation_method="Conversational response.", timeframe_resolved="N/A"
                    ),
                    suggested_followups=SUGGESTED_QUESTIONS[:4]
                )

            if primary_intent == "farewell":
                logger.info("Matched FAREWELL intent. Returning farewell response without calling Monday.com API.")
                return ChatResponse(
                    answer="Goodbye! 👋 Come back anytime if you need help analyzing Skylark's business.",
                    intent="farewell",
                    data_sources=[],
                    metrics={},
                    data_quality=DataQualityReport(score=100.0, total_records=0, valid_records=0, deductions=[]),
                    explainability=ExplainabilityMetadata(
                        data_sources=[], calculation_method="Conversational farewell response.", timeframe_resolved="N/A"
                    ),
                    suggested_followups=[]
                )

            if primary_intent == "out_of_scope":
                logger.info("Matched OUT_OF_SCOPE intent. Returning scope boundary response without calling Monday.com API.")
                return ChatResponse(
                    answer="That's outside my business intelligence scope. I can help with Skylark's pipeline, deals, work orders, revenue, sectors, risks, and leadership insights.",
                    intent="out_of_scope",
                    data_sources=[],
                    metrics={},
                    data_quality=DataQualityReport(score=100.0, total_records=0, valid_records=0, deductions=[]),
                    explainability=ExplainabilityMetadata(
                        data_sources=[], calculation_method="Enforced business intelligence boundary.", timeframe_resolved="N/A"
                    ),
                    suggested_followups=SUGGESTED_QUESTIONS[:4]
                )

            if primary_intent == "ambiguous_query":
                clarification_answer = """### 🤔 Query Clarification Needed

To provide an exact deterministic business analysis, please specify which area you would like to inspect:

1. **Sales & Pipeline Performance**: *"How is our pipeline looking this quarter?"*
2. **Sector Breakdown**: *"Which sectors are driving pipeline growth?"*
3. **Operational Work Orders**: *"How many active work orders do we have?"*
4. **Billing & Cash Collections**: *"What's currently pending billing?"*
5. **Executive Summary**: *"Prepare a leadership brief"*
"""
                return ChatResponse(
                    answer=clarification_answer,
                    intent="ambiguous_query",
                    data_sources=["Monday.com API"],
                    metrics={},
                    data_quality=DataQualityReport(score=100.0, total_records=0, valid_records=0, deductions=[]),
                    explainability=ExplainabilityMetadata(
                        data_sources=["Monday.com API"],
                        calculation_method="Prompted user for intent clarification.",
                        timeframe_resolved="N/A"
                    ),
                    suggested_followups=SUGGESTED_QUESTIONS[:4]
                )

        # 2. BUSINESS QUERY EXECUTION -> Fetch Monday.com API data once
        logger.info(f"Executing Business Query pipeline for {len(detected_intents)} detected intent(s)...")

        raw_deals, raw_work_orders = await asyncio.gather(
            self.monday_service.get_deals(),
            self.monday_service.get_work_orders()
        )

        # 3. Data Normalization & Data Quality Audit
        df_deals, deals_dq = DataNormalizer.normalize_deals(raw_deals)
        df_wo, wo_dq = DataNormalizer.normalize_work_orders(raw_work_orders)

        avg_score = round((deals_dq.score + wo_dq.score) / 2.0, 1)
        comb_deductions = deals_dq.deductions + wo_dq.deductions

        dq_report = DataQualityReport(
            score=avg_score,
            total_records=deals_dq.total_records + wo_dq.total_records,
            valid_records=deals_dq.valid_records + wo_dq.valid_records,
            missing_values_count=deals_dq.missing_values_count + wo_dq.missing_values_count,
            invalid_dates_count=deals_dq.invalid_dates_count + wo_dq.invalid_dates_count,
            unknown_statuses_count=deals_dq.unknown_statuses_count + wo_dq.unknown_statuses_count,
            excluded_records_count=deals_dq.excluded_records_count + wo_dq.excluded_records_count,
            deductions=comb_deductions
        )

        # Function to execute single intent analytics
        def _execute_intent_analytics(intent_str: str, p_dict: Dict[str, Any]):
            target_sec = p_dict.get("sector")
            timeframe_val = p_dict.get("timeframe")
            s_date, e_date, tf_label = resolve_relative_timeframe(timeframe_val)

            if intent_str == "pipeline_overview":
                return AnalyticsEngine.pipeline_overview(df_deals, s_date, e_date), ["Monday.com Deals Board"], f"Filtered open deals by {tf_label}.", tf_label
            elif intent_str == "sector_analysis":
                return AnalyticsEngine.sector_analysis(df_deals, df_wo, target_sec), ["Monday.com Deals Board", "Monday.com Work Orders Board"], f"Grouped deals and work orders by Sector (Filter: {target_sec or 'All'}).", tf_label
            elif intent_str == "opportunity_analysis":
                return AnalyticsEngine.opportunity_analysis(df_deals, top_n=5), ["Monday.com Deals Board"], "Ranked open deals by score = deal value × closure probability.", tf_label
            elif intent_str in ("billing_analysis", "collection_analysis"):
                return AnalyticsEngine.get_billing_analytics(df_wo), ["Monday.com Work Orders Board"], "Calculated unbilled amounts and ranked invoicing priorities.", tf_label
            elif intent_str == "work_order_analysis":
                return AnalyticsEngine.work_order_analysis(df_wo), ["Monday.com Work Orders Board"], "Calculated operational work order metrics.", tf_label
            elif intent_str == "owner_analytics":
                return AnalyticsEngine.owner_analytics(df_deals), ["Monday.com Deals Board"], "Aggregated pipeline value by owner.", tf_label
            elif intent_str == "deal_risk_analysis":
                c_prob = p_dict.get("low_probability_threshold")
                return AnalyticsEngine.deal_risk_analysis(df_deals, low_prob_threshold=c_prob), ["Monday.com Deals Board"], "Evaluated high deal value and low probability deals.", tf_label
            elif intent_str == "customer_combined_value_analysis":
                return AnalyticsEngine.customer_combined_value_analysis(df_deals, df_wo), ["Monday.com Deals Board", "Monday.com Work Orders Board"], "Joined deals and work orders by customer.", tf_label
            elif intent_str == "cross_board_customer_analysis":
                return AnalyticsEngine.cross_board_customer_analysis(df_deals, df_wo), ["Monday.com Deals Board", "Monday.com Work Orders Board"], "Cross-board matching between deals and work orders.", tf_label
            elif intent_str == "leadership_update":
                return LeadershipService.generate_leadership_summary(df_deals, df_wo, deals_dq, wo_dq), ["Monday.com Deals Board", "Monday.com Work Orders Board"], "Consolidated leadership summary.", tf_label
            elif intent_str == "data_quality_report":
                return {"deals_data_quality": deals_dq.model_dump(), "work_orders_data_quality": wo_dq.model_dump()}, ["Monday.com Deals Board", "Monday.com Work Orders Board"], "Data quality audit report.", tf_label
            else:
                return AnalyticsEngine.pipeline_overview(df_deals), ["Monday.com Deals Board"], "Pipeline overview analysis.", tf_label

        # 4. SINGLE INTENT EXECUTION
        if len(detected_intents) == 1:
            intent = primary_intent
            metrics, data_sources, calc_method, tf_label = _execute_intent_analytics(intent, primary_params)

            explainability = ExplainabilityMetadata(
                data_sources=data_sources,
                filters_applied={"sector": primary_params.get("sector"), "timeframe": primary_params.get("timeframe")},
                timeframe_resolved=tf_label,
                calculation_method=calc_method,
                assumptions=[]
            )

            if intent == "leadership_update" and "leadership_text" in metrics:
                answer = metrics["leadership_text"]
            else:
                answer = await self.ai_service.generate_explanation(
                    question=question,
                    intent=intent,
                    metrics=metrics,
                    data_quality=dq_report.model_dump(),
                    explainability=explainability.model_dump()
                )

            followups = [q for q in SUGGESTED_QUESTIONS if q.lower() != question.lower()][:4]

            return ChatResponse(
                answer=answer,
                intent=intent,
                data_sources=data_sources,
                metrics=metrics,
                data_quality=dq_report,
                explainability=explainability,
                suggested_followups=followups
            )

        # 5. MULTI-INTENT EXECUTION
        logger.info(f"Orchestrating multi-intent response for {len(detected_intents)} intents...")

        multi_analyses = []
        combined_sources = set()
        methods = []

        for item in detected_intents:
            i_str = item["intent"]
            p_dict = item["params"]
            clause_str = item.get("clause", "")

            m_i, sources_i, calc_i, _ = _execute_intent_analytics(i_str, p_dict)
            combined_sources.update(sources_i)
            methods.append(f"[{i_str}]: {calc_i}")

            multi_analyses.append({
                "intent": i_str,
                "params": p_dict,
                "clause": clause_str,
                "metrics": m_i
            })

        multi_payload = {
            "intents": [item["intent"] for item in detected_intents],
            "analyses": multi_analyses
        }

        explainability = ExplainabilityMetadata(
            data_sources=list(combined_sources),
            filters_applied={"multi_intents": [item["intent"] for item in detected_intents]},
            timeframe_resolved="Multi-intent analysis",
            calculation_method=" | ".join(methods),
            assumptions=[]
        )

        answer = await self.ai_service.generate_multi_intent_explanation(
            question=question,
            multi_payload=multi_payload,
            data_quality=dq_report.model_dump()
        )

        # Return primary metrics for chart rendering compatibility
        primary_metrics = multi_analyses[0]["metrics"] if multi_analyses else {}
        followups = [q for q in SUGGESTED_QUESTIONS if q.lower() != question.lower()][:4]

        return ChatResponse(
            answer=answer,
            intent="multi_intent",
            data_sources=list(combined_sources),
            metrics=primary_metrics,
            data_quality=dq_report,
            explainability=explainability,
            suggested_followups=followups
        )
