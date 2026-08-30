import os
from typing import Dict, Any, Optional
from app.services.groq_service import GroqService
from app.utils.logging import get_logger

logger = get_logger("AIService")

class AIService:
    def __init__(self, groq_api_key: Optional[str] = None):
        self._groq_key = groq_api_key

    @property
    def groq_key(self) -> Optional[str]:
        return self._groq_key or os.getenv("GROQ_API_KEY")

    @property
    def model(self) -> Optional[str]:
        return os.getenv("GROQ_MODEL")

    @property
    def groq_service(self) -> Optional[GroqService]:
        if self.groq_key:
            return GroqService(api_key=self.groq_key)
        return None

    async def generate_explanation(
        self,
        question: str,
        intent: str,
        metrics: Dict[str, Any],
        data_quality: Dict[str, Any],
        explainability: Dict[str, Any]
    ) -> str:
        """
        Generates executive business explanations via Groq Service.
        Falls back to a structured deterministic template if Groq API key is unconfigured or call fails.
        """
        service = self.groq_service
        if service:
            try:
                return await service.generate_executive_explanation(
                    question=question,
                    intent=intent,
                    metrics=metrics,
                    data_quality=data_quality,
                    explainability=explainability
                )
            except Exception as e:
                logger.warning(f"Groq API service call failed ({e}), falling back to deterministic template generator.")

        return self._generate_fallback_template(intent, question, metrics, data_quality, explainability)

    def _generate_fallback_template(
        self,
        intent: str,
        question: str,
        metrics: Dict[str, Any],
        dq: Dict[str, Any],
        exp: Dict[str, Any]
    ) -> str:
        """Deterministic template formatter for offline mode or fallback operations."""
        dq_score = dq.get("score", 100.0)
        deductions = dq.get("deductions", [])
        dq_note = f"Data Quality Score: **{dq_score}%**"
        if deductions:
            dq_note += " (" + "; ".join(deductions[:2]) + ")"

        is_dq_query = intent == "data_quality_report" or "quality" in question.lower() or "health" in question.lower()

        if intent == "pipeline_overview":
            open_pipe = metrics.get("open_pipeline_formatted", "₹0")
            total_pipe = metrics.get("total_pipeline_formatted", "₹0")
            open_cnt = metrics.get("open_deals", 0)
            tot_cnt = metrics.get("total_deals", 0)
            weighted_val = metrics.get("weighted_pipeline_formatted", "₹0")
            avg_deal = metrics.get("avg_deal_formatted", "₹0")

            dq_section = f"\n### Data Quality Report\n- {dq_note}" if is_dq_query else ""

            return f"""### Headline
Skylark holds **{open_pipe}** in open pipeline value across **{open_cnt} open deals** (Total pipeline: {total_pipe} across {tot_cnt} deals).

### Key Metrics
- **Open Pipeline Value**: {open_pipe}
- **Weighted Pipeline Value**: {weighted_val} (weighted by closure probability)
- **Average Open Deal Size**: {avg_deal}
- **Open Deals**: {open_cnt} | **Won Deals**: {metrics.get('won_deals', 0)} | **Lost Deals**: {metrics.get('lost_deals', 0)}

### What the Data Shows
- Weighted forecast stands at **{weighted_val}**, providing a realistic probability-adjusted revenue trajectory.
- Open pipeline value is concentrated in active commercial negotiations across key sectors.

### Priorities
- Accelerate conversion of open opportunities in Proposal/Commercials stage.
- Establish weekly BD review cadence to progress early-stage deals.

### Risks & Data Caveats
- **Pipeline concentration risk**: A significant portion of pipeline value is held in top opportunities, creating revenue variance if delays occur.
- **Forecast uncertainty**: Weighted pipeline is lower than raw open pipeline value due to probability adjustments.

### Recommended Actions
1. **Deal acceleration** — Prioritize top open opportunities and schedule commercial closure checkpoints.
2. **Stage velocity** — Focus BD effort on advancing deals out of generic early stages.

### Bottom Line
Open pipeline holds solid revenue potential, but execution focus must be on closing top commercial deals this quarter.{dq_section}
"""

        elif intent == "sector_analysis":
            sec_deals = metrics.get("deals_by_sector", [])
            sec_wo = metrics.get("work_orders_by_sector", [])
            target = metrics.get("target_sector", "All Sectors")

            lines = [f"### Headline", f"Sector performance summary for **{target}** across Sales Pipeline and Operational Execution.\n"]
            lines.append("### Key Metrics")
            for s in sec_deals:
                lines.append(f"- **{s['sector']} Deals**: {s['open_pipeline_formatted']} open pipeline ({s['open_deals']} deals, {s['win_rate_pct']}% win rate)")

            if sec_wo:
                lines.append("\n### Operational Execution by Sector")
                for w in sec_wo:
                    lines.append(f"- **{w['sector']} Work Orders**: {w['order_value_formatted']} active order value ({w['active_work_orders']} active work orders, {w['billed_formatted']} billed)")

            lines.append("\n### Risks & Data Caveats")
            lines.append("- **Sector dependency risk**: Revenue generation is heavily weighted toward primary active sectors.")
            lines.append("- **Low conversion risk**: Win-rate variances across sectors indicate conversion friction in specific verticals.")

            lines.append("\n### Recommended Actions")
            lines.append("1. **Sector diversification** — Expand deal qualification in secondary growth sectors.")
            lines.append("2. **Win-rate optimization** — Analyze historical lost opportunities to identify sector-specific conversion blockers.")

            lines.append("\n### Bottom Line")
            lines.append(f"Sector performance in {target} shows active commercial traction, requiring targeted deal acceleration to maximize revenue conversion.")

            if is_dq_query:
                lines.append(f"\n### Data Quality Report\n- {dq_note}")

            return "\n".join(lines)

        elif intent == "billing_analysis":
            total_unbilled = metrics.get("total_unbilled_formatted", "₹0")
            affected_cnt = metrics.get("work_orders_with_unbilled_count", 0)
            priorities = metrics.get("priority_work_orders", [])

            lines = ["### Headline", f"**{total_unbilled}** in unbilled work is currently pending invoice generation across **{affected_cnt} active work orders**.\n"]
            
            lines.append("### Key Metrics")
            lines.append(f"- **Total Pending Unbilled**: {total_unbilled}")
            lines.append(f"- **Work Orders Pending Invoicing**: {affected_cnt}")

            lines.append("\n### Priorities")
            if priorities:
                for idx, item in enumerate(priorities[:5], 1):
                    lines.append(f"{idx}. **{item['work_order']}** ({item['customer']}) — **{item['unbilled_amount_formatted']}** [{item['priority']} PRIORITY]")
            else:
                lines.append("- No active work orders requiring immediate billing prioritization.")

            lines.append("\n### Risks & Data Caveats")
            lines.append("- **Billing lag risk**: Unbilled project milestones create a gap between operational execution and cash flow realization.")
            lines.append("- **Cash-flow risk**: Delayed invoicing extends working capital cycles.")

            lines.append("\n### Recommended Actions")
            lines.append("1. **Billing acceleration** — Immediately issue tax invoices for high-priority completed project milestones.")
            lines.append("2. **Milestone tracking** — Establish automated sign-off triggers upon milestone completion.")

            lines.append("\n### Bottom Line")
            lines.append("Prioritizing invoice issuance for unbilled work orders will immediately unlock cash flow.")

            if is_dq_query:
                lines.append(f"\n### Data Quality Report\n- {dq_note}")

            return "\n".join(lines)

        elif intent == "deal_risk_analysis":
            qualifying = metrics.get("qualifying_deals", [])
            comb_deal = metrics.get("combined_deal_value_formatted", "₹0")
            comb_weighted = metrics.get("combined_weighted_value_formatted", "₹0")
            h_thresh = metrics.get("high_value_threshold_formatted", "₹1 Cr")
            l_prob = metrics.get("low_probability_threshold_pct", 20)
            q_cnt = metrics.get("qualifying_count", 0)
            concentration_insight = metrics.get("top_concentration_insight", "")

            lines = ["### Headline", f"Identified **{q_cnt} high-value open deals** representing **{comb_deal}** in total deal value but only **{comb_weighted}** in weighted forecast.\n"]
            
            lines.append("### Key Metrics")
            lines.append(f"- **High Deal Value Threshold**: $\\ge$ {h_thresh}")
            lines.append(f"- **Low Closure Probability Threshold**: $\\le$ {l_prob}%")
            lines.append(f"- **Qualifying Vulnerable Deals**: {q_cnt}")
            lines.append(f"- **Combined Deal Value**: {comb_deal}")
            lines.append(f"- **Combined Weighted Value**: {comb_weighted}")

            if concentration_insight:
                lines.append(f"\n### What the Data Shows\n- **{concentration_insight}**")

            lines.append("\n### Risks & Data Caveats")
            lines.append("- **Low weighted-pipeline risk**: High contract values paired with low closure probability create significant forecast volatility.")
            lines.append("- **Large-value deal dependency**: Pipeline revenue depends heavily on a small set of vulnerable negotiations.")

            lines.append("\n### Recommended Actions")
            lines.append("1. **Executive sponsorship** — Assign executive sponsors to top vulnerable deals to resolve client negotiation friction.")
            lines.append("2. **Probability review** — Conduct weekly deal reviews to re-assess probability and deal velocity.")

            lines.append("\n### Bottom Line")
            lines.append("Focusing leadership intervention on the top high-value, low-probability deals is essential to securing pipeline forecast.")

            if is_dq_query:
                lines.append(f"\n### Data Quality Report\n- {dq_note}")

            return "\n".join(lines)

        elif intent == "data_quality_report":
            return f"""### Headline
Data Quality Audit Report: Skylark's database health score stands at **{dq_score}%**.

### Key Metrics
- **Overall Data Quality Score**: {dq_score}%
- **Total Audit Records**: {dq.get('total_records', 0)}
- **Valid Records**: {dq.get('valid_records', 0)}
- **Missing Values Count**: {dq.get('missing_values_count', 0)}
- **Invalid Dates Count**: {dq.get('invalid_dates_count', 0)}
- **Excluded Records Scope**: {dq.get('excluded_records_count', 0)}

### What the Data Shows
- Data deductions: {", ".join(deductions) if deductions else "No deductions. Clean dataset."}

### Bottom Line
Maintaining complete probability and deal value entries on Monday.com ensures 100% deterministic BI forecast precision.
"""

        else:
            open_pipe = metrics.get("open_pipeline_formatted", "₹0")
            open_cnt = metrics.get("open_deals", 0)

            dq_section = f"\n### Data Quality Report\n- {dq_note}" if is_dq_query else ""

            return f"""### Headline
Consolidated Skylark BI analysis showing **{open_pipe}** in active pipeline across **{open_cnt} open deals**.

### Key Metrics
- **Open Pipeline Value**: {open_pipe}
- **Open Deals**: {open_cnt}

### What the Data Shows
- Active operations and deal funnels demonstrate steady commercial engagement across key sectors.

### Risks & Data Caveats
- **Pipeline concentration risk**: A subset of high-value deals accounts for the majority of total pipeline.

### Recommended Actions
1. **Focus on high-value closing deals** to ensure revenue targets are met this quarter.

### Bottom Line
Execution focus on key open opportunities will drive quarterly target achievement.{dq_section}
"""
