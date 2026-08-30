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
    "How is the Energy sector performing?",
    "What are our biggest high-probability opportunities?",
    "How many active work orders do we currently have?",
    "How much money is pending billing or collection?",
    "Which customers have active work orders but no active deals?",
    "Prepare a leadership update."
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
        """
        logger.info(f"Processing user question: '{question}'")

        # 1. Intent Classification & Parameter Extraction
        intent, params = QueryUnderstandingService.classify_intent_and_params(question, context_history)
        target_sector = params.get("sector")
        timeframe_str = params.get("timeframe")

        # Handle Ambiguous Queries by asking for clarification
        if intent == "ambiguous_query":
            clarification_answer = """### 🤔 Query Clarification Needed

To provide an exact deterministic business analysis, please specify which area you would like to inspect:

1. **Sales & Pipeline Performance**: *"How is our pipeline looking this quarter?"*
2. **Sector Breakdown**: *"How is the Energy sector performing?"*
3. **Operational Work Orders**: *"How many active work orders do we currently have?"*
4. **Billing & Cash Collections**: *"How much money is pending billing or collection?"*
5. **Executive Summary**: *"Prepare a leadership update."*
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
