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
        Main orchestration loop executing Intent -> Data Fetch -> Normalization -> Analytics -> AI Explanation.
        Classifies incoming intent BEFORE any Monday.com API calls or analytics execution.
        """
        logger.info(f"Processing user question: '{question}'")

        # 1. Intent Classification & Parameter Extraction BEFORE any API calls
        intent, params = QueryUnderstandingService.classify_intent_and_params(question, context_history)
        target_sector = params.get("sector")
        timeframe_str = params.get("timeframe")

        # 1a. GREETING
        if intent == "greeting":
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

        # 1b. CASUAL CONVERSATION
        if intent == "casual_conversation":
            logger.info("Matched CASUAL_CONVERSATION intent. Returning casual response without calling Monday.com API.")
            casual_subtype = params.get("casual_subtype")
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

        # 1c. FAREWELL
        if intent == "farewell":
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

        # 1d. OUT OF SCOPE
        if intent == "out_of_scope":
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

        # 1e. Ambiguous Queries
        if intent == "ambiguous_query":
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
                data_quality=DataQualityReport(
                    score=100.0, total_records=0, valid_records=0, deductions=[]
                ),
                explainability=ExplainabilityMetadata(
                    data_sources=["Monday.com API"],
                    calculation_method="Prompted user for intent clarification.",
                    timeframe_resolved="N/A"
                ),
                suggested_followups=SUGGESTED_QUESTIONS[:4]
            )

        # BUSINESS QUERY INTENTS -> Execute dynamic Monday.com API calls
        logger.info(f"Executing Business Query pipeline for intent '{intent}'...")

        # Resolve timeframe dates
        start_date, end_date, timeframe_label = resolve_relative_timeframe(timeframe_str)

        # 2. Fetch fresh dynamic data from Monday.com GraphQL API
        raw_deals = await self.monday_service.get_deals()
        raw_work_orders = await self.monday_service.get_work_orders()

        # 3. Data Normalization & Data Quality Audit
        df_deals, deals_dq = DataNormalizer.normalize_deals(raw_deals)
        df_wo, wo_dq = DataNormalizer.normalize_work_orders(raw_work_orders)

        # Aggregate Data Quality Report
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

        # 4. Execute Deterministic Analytics Tool based on Intent
        metrics: Dict[str, Any] = {}
        data_sources = []
        calc_method = ""
        assumptions = []

        if intent == "pipeline_overview":
            data_sources = ["Monday.com Deals Board"]
            metrics = AnalyticsEngine.pipeline_overview(df_deals, start_date, end_date)
            calc_method = f"Filtered open deals by {timeframe_label}, calculated sums, averages, and stage distributions."
            assumptions.append("Deals with missing closure probability were assigned a default 50% probability.")

        elif intent == "sector_analysis":
            data_sources = ["Monday.com Deals Board", "Monday.com Work Orders Board"]
            metrics = AnalyticsEngine.sector_analysis(df_deals, df_wo, target_sector)
            calc_method = f"Grouped deals and work orders by Sector (Filter: {target_sector or 'All Sectors'})."

        elif intent == "opportunity_analysis":
            data_sources = ["Monday.com Deals Board"]
            metrics = AnalyticsEngine.opportunity_analysis(df_deals, top_n=5)
            calc_method = "Ranked open deals deterministically by Score = Deal Value × Closure Probability."

        elif intent == "billing_analysis":
            data_sources = ["Monday.com Work Orders Board"]
            metrics = AnalyticsEngine.get_billing_analytics(df_wo)
            calc_method = "Calculated unbilled contract values, pending billing totals, and ranked work orders by invoicing priority score."

        elif intent in ("work_order_analysis", "collection_analysis"):
            data_sources = ["Monday.com Work Orders Board"]
            metrics = AnalyticsEngine.work_order_analysis(df_wo)
            calc_method = "Calculated operational work order counts, billed value, collected amounts, pending billing, and receivables."

        elif intent == "owner_analytics":
            data_sources = ["Monday.com Deals Board"]
            metrics = AnalyticsEngine.owner_analytics(df_deals)
            calc_method = "Aggregated open pipeline value, deal counts, and weighted forecast by BD/KAM personnel code."

        elif intent == "deal_risk_analysis":
            data_sources = ["Monday.com Deals Board"]
            custom_prob_threshold = params.get("low_probability_threshold")
            metrics = AnalyticsEngine.deal_risk_analysis(df_deals, low_prob_threshold=custom_prob_threshold)
            calc_method = f"Evaluated open deals with deal value >= {metrics.get('high_value_threshold_formatted')} and closure probability <= {metrics.get('low_probability_threshold_pct')}%, calculating combined deal sum and combined weighted sum."

        elif intent == "customer_combined_value_analysis":
            data_sources = ["Monday.com Deals Board", "Monday.com Work Orders Board"]
            metrics = AnalyticsEngine.customer_combined_value_analysis(df_deals, df_wo)
            calc_method = "Joined open deals and active work orders by normalized customer code to compute total commercial value per account."

        elif intent == "cross_board_customer_analysis":
            data_sources = ["Monday.com Deals Board", "Monday.com Work Orders Board"]
            metrics = AnalyticsEngine.cross_board_customer_analysis(df_deals, df_wo)
            calc_method = "Performed cross-board customer entity resolution and set-matching between active work orders and open deals."
            assumptions.append("Customer names were normalized by stripping company suffixes (LTD, PVT) and punctuation prior to joining.")

        elif intent == "leadership_update":
            data_sources = ["Monday.com Deals Board", "Monday.com Work Orders Board"]
            leadership_res = LeadershipService.generate_leadership_summary(df_deals, df_wo, deals_dq, wo_dq)
            metrics = leadership_res
            calc_method = "Consolidated cross-functional metrics across sales pipeline, work order execution, billing, and top risks."

        elif intent == "data_quality_report":
            data_sources = ["Monday.com Deals Board", "Monday.com Work Orders Board"]
            metrics = {"deals_data_quality": deals_dq.model_dump(), "work_orders_data_quality": wo_dq.model_dump()}
            calc_method = "Evaluated dataset completeness, missing dates, missing monetary fields, and unmapped statuses."

        else:
            data_sources = ["Monday.com Deals Board", "Monday.com Work Orders Board"]
            metrics = AnalyticsEngine.pipeline_overview(df_deals)
            calc_method = "Default pipeline overview analysis."

        explainability = ExplainabilityMetadata(
            data_sources=data_sources,
            filters_applied={"sector": target_sector, "timeframe": timeframe_str},
            timeframe_resolved=timeframe_label,
            calculation_method=calc_method,
            assumptions=assumptions
        )

        # 5. Generate Executive Explanation via Groq Service
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

        # 6. Filter suggested followups excluding current question
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
