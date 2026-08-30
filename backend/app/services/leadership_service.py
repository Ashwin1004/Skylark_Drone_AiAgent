from typing import Dict, Any
import pandas as pd
from app.services.analytics import AnalyticsEngine, format_currency_inr
from app.models.schemas import DataQualityReport
from app.utils.logging import get_logger

logger = get_logger("LeadershipService")

class LeadershipService:

    @staticmethod
    def generate_leadership_summary(
        df_deals: pd.DataFrame,
        df_work_orders: pd.DataFrame,
        deals_dq: DataQualityReport,
        wo_dq: DataQualityReport
    ) -> Dict[str, Any]:
        """
        Consolidates cross-functional metrics for Executive Leadership reporting.
        """
        pipe = AnalyticsEngine.pipeline_overview(df_deals)
        wo = AnalyticsEngine.work_order_analysis(df_work_orders)
        opps = AnalyticsEngine.opportunity_analysis(df_deals, top_n=3)
        cross = AnalyticsEngine.cross_board_customer_analysis(df_deals, df_work_orders)

        avg_dq_score = round((deals_dq.score + wo_dq.score) / 2.0, 1)

        summary_text = f"""### 👔 SKYLARK DRONES EXECUTIVE LEADERSHIP UPDATE

**1. Sales & Pipeline Performance**
- Open Pipeline: **{pipe['open_pipeline_formatted']}** across **{pipe['open_deals']} open deals**
- Weighted Pipeline Forecast: **{pipe['weighted_pipeline_formatted']}**
- Average Deal Size: **{pipe['avg_deal_formatted']}**

**2. Operations & Execution**
- Active Work Orders in Flight: **{wo['active_work_orders']}** ({wo['total_order_formatted']} total order value)
- Completed Projects: **{wo['completed_work_orders']}**

**3. Billing & Cash Collections**
- Total Billed: **{wo['billed_formatted']}** | Collected: **{wo['collected_formatted']}**
- Pending Invoicing (Unbilled Ops): **{wo['pending_billing_formatted']}**
- Outstanding Receivables: **{wo['receivables_formatted']}**

**4. Top 3 Strategic Opportunities**
"""
        for o in opps['top_opportunities']:
            summary_text += f"- **{o['deal_name']}** ({o['customer']}): {o['deal_value_formatted']} ({o['probability_pct']}% prob, Stage: {o['stage']})\n"

        summary_text += f"""
**5. Identified Key Business Risks**
- **upsell Gap**: {cross['active_work_no_active_deals_count']} customers have active work orders in flight but zero active sales pipeline for renewals/upsell.
- **Collection Bottleneck**: {wo['receivables_formatted']} in outstanding receivables needs immediate collection follow-up.

**6. Data Quality & Audit Notes**
- Aggregate Data Health Score: **{avg_dq_score}%**
- Deductions: {len(deals_dq.deductions) + len(wo_dq.deductions)} minor issues flagged across close dates & missing monetary fields.

**7. Recommended Focus Areas**
- 🎯 **Sales**: Initiate renewal discussions for the {cross['active_work_no_active_deals_count']} active clients without open pipeline.
- 💰 **Finance**: Accelerate collections on top accounts with outstanding receivables.
- ⚙️ **Ops**: Finalize milestone deliverables to unlock {wo['pending_billing_formatted']} in pending billing.
"""

        return {
            "leadership_text": summary_text,
            "pipeline_summary": pipe,
            "operations_summary": wo,
            "top_opportunities": opps['top_opportunities'],
            "cross_board_gaps": cross,
            "aggregate_dq_score": avg_dq_score
        }
