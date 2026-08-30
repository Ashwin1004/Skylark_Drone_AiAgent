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

        if intent == "pipeline_overview":
            open_pipe = metrics.get("open_pipeline_formatted", "₹0")
            total_pipe = metrics.get("total_pipeline_formatted", "₹0")
            open_cnt = metrics.get("open_deals", 0)
            tot_cnt = metrics.get("total_deals", 0)
            weighted_val = metrics.get("weighted_pipeline_formatted", "₹0")
            avg_deal = metrics.get("avg_deal_formatted", "₹0")

            return f"""### 📊 Sales Pipeline Overview ({exp.get('timeframe_resolved', 'All Time')})

**Headline**: Skylark holds **{open_pipe}** in open pipeline value across **{open_cnt} open deals** (Total pipeline: {total_pipe} across {tot_cnt} deals).

#### Key Metrics:
- **Open Pipeline Value**: {open_pipe}
- **Weighted Pipeline Value**: {weighted_val} (weighted by closure probability)
- **Average Open Deal Size**: {avg_deal}
- **Open Deals**: {open_cnt} | **Won Deals**: {metrics.get('won_deals', 0)} | **Lost Deals**: {metrics.get('lost_deals', 0)}

#### 💡 Key Insights:
- Weighted forecast stands at **{weighted_val}**, providing a realistic revenue trajectory.
- Conversion efforts should focus on late-stage commercial proposals.

#### ⚠️ Risks & Caveats:
- Large deal size concentration can create revenue variance if top deals delay.

#### 🛡️ Data Quality Note:
- {dq_note}
"""

        elif intent == "sector_analysis":
            sec_deals = metrics.get("deals_by_sector", [])
            sec_wo = metrics.get("work_orders_by_sector", [])
            target = metrics.get("target_sector", "All Sectors")

            lines = [f"### 🏢 Sector Performance Deep-Dive: {target}", ""]
            lines.append(f"**Headline**: Performance summary for **{target}** across Sales Pipeline and Operational Execution.\n")
            lines.append("#### 📈 Sales Pipeline by Sector:")
            for s in sec_deals:
                lines.append(f"- **{s['sector']}**: {s['open_pipeline_formatted']} open pipeline ({s['open_deals']} deals, {s['win_rate_pct']}% win rate)")

            if sec_wo:
                lines.append("\n#### ⚙️ Operational Execution by Sector:")
                for w in sec_wo:
                    lines.append(f"- **{w['sector']}**: {w['order_value_formatted']} active order value ({w['active_work_orders']} active work orders, {w['billed_formatted']} billed)")

            lines.append(f"\n#### 🛡️ Data Quality Note:\n- {dq_note}")
            return "\n".join(lines)

        elif intent == "opportunity_analysis":
            opps = metrics.get("top_opportunities", [])
            lines = ["### 🚀 Top Strategic Opportunities", ""]
            lines.append("**Headline**: Top open deals ranked deterministically by Weighted Value (Deal Value × Closure Probability).\n")
            lines.append("#### Key Opportunities:")
            for o in opps:
                lines.append(f"{o['rank']}. **{o['deal_name']}** ({o['customer']}) - **{o['deal_value_formatted']}** (Prob: {o['probability_pct']}%, Weighted: {o['weighted_formatted']}) | Sector: {o['sector']} | Stage: {o['stage']}")

            lines.append(f"\n#### 🛡️ Data Quality Note:\n- {dq_note}")
            return "\n".join(lines)

        elif intent == "billing_analysis":
            total_unbilled = metrics.get("total_unbilled_formatted", "₹0")
            affected_cnt = metrics.get("work_orders_with_unbilled_count", 0)
            priorities = metrics.get("priority_work_orders", [])
            limitation = metrics.get("limitation_note", "")

            lines = ["### 💳 Deterministic Billing & Invoicing Analysis", ""]
            lines.append(f"**Headline**: **{total_unbilled}** is currently stuck in unbilled work across **{affected_cnt} work orders**.")
            
            if limitation:
                lines.append(f"\n⚠️ **Data Caveat**: {limitation}")

            lines.append("\n#### 🎯 Top Invoicing Priorities:")
            if priorities:
                for idx, item in enumerate(priorities[:5], 1):
                    lines.append(f"{idx}. **{item['work_order']}** ({item['customer']}) — **{item['unbilled_amount_formatted']}** [{item['priority']} PRIORITY]\n   - *Status*: {item['execution_status']} | *Reason*: {item['reason']}")
            else:
                lines.append("- No active work orders requiring immediate billing prioritization.")

            lines.append(f"\n#### 🛡️ Data Quality Audit:\n- {dq_note}")
            return "\n".join(lines)

        elif intent == "work_order_analysis":
            active_cnt = metrics.get("active_work_orders", 0)
            tot_cnt = metrics.get("total_work_orders", 0)
            order_val = metrics.get("total_order_formatted", "₹0")
            billed = metrics.get("billed_formatted", "₹0")
            collected = metrics.get("collected_formatted", "₹0")
            pending_billing = metrics.get("pending_billing_formatted", "₹0")
            receivables = metrics.get("receivables_formatted", "₹0")

            return f"""### ⚙️ Operational Work Order & Financial Analysis

**Headline**: Skylark is currently executing **{active_cnt} active work orders** out of **{tot_cnt} total work orders**, representing **{order_val}** total contract value.

#### Operational & Financial Summary:
- **Active Work Orders**: {active_cnt}
- **Completed Projects**: {metrics.get('completed_work_orders', 0)}
- **Total Contract Value**: {order_val}
- **Total Billed Value**: {billed}
- **Total Collected Amount**: {collected}
- **Pending Invoicing (Unbilled Ops)**: {pending_billing}
- **Outstanding Receivables**: {receivables}

#### 💡 Key Insights:
- **{pending_billing}** remains to be billed upon project milestone completion.
- **{receivables}** is currently in receivables awaiting cash collection.

#### 🛡️ Data Quality Note:
- {dq_note}
"""

        elif intent == "owner_analytics":
            owners = metrics.get("owner_breakdown", [])
            lines = ["### 👤 BD / KAM Owner Performance & Pipeline Breakdown", ""]
            lines.append(f"**Headline**: Open pipeline distribution managed across **{metrics.get('total_owners', 0)} BD/KAM personnel**.")
            lines.append("\n#### 📈 Pipeline Value by Owner:")
            for o in owners[:5]:
                lines.append(f"- **{o['owner']}**: **{o['open_pipeline_formatted']}** open pipeline ({o['open_deals_count']} deals, Weighted: {o['weighted_pipeline_formatted']})")
            lines.append(f"\n#### 🛡️ Data Quality Note:\n- {dq_note}")
            return "\n".join(lines)

        elif intent == "deal_risk_analysis":
            qualifying = metrics.get("qualifying_deals", [])
            comb_deal = metrics.get("combined_deal_value_formatted", "₹0")
            comb_weighted = metrics.get("combined_weighted_value_formatted", "₹0")
            h_thresh = metrics.get("high_value_threshold_formatted", "₹1 Cr")
            l_prob = metrics.get("low_probability_threshold_pct", 20)
            q_cnt = metrics.get("qualifying_count", 0)
            excl_cnt = metrics.get("excluded_missing_values_count", 0)
            concentration_insight = metrics.get("top_concentration_insight", "")

            lines = ["### ⚠️ High-Value / Low-Probability Deal Risk Analysis", ""]
            lines.append(f"**Headline**: **{q_cnt} qualifying high-value open deals** were identified representing **{comb_deal}** in combined deal value and **{comb_weighted}** in combined weighted pipeline value.")
            lines.append(f"\n#### 📋 Applied Business Criteria:")
            lines.append(f"- **High Deal Value Threshold**: $\\ge$ {h_thresh}")
            lines.append(f"- **Low Closure Probability Threshold**: $\\le$ {l_prob}%")
            lines.append(f"- **Qualifying Deals**: {q_cnt} open deals")
            lines.append(f"- **Combined Contract Value**: {comb_deal}")
            lines.append(f"- **Combined Weighted Value**: {comb_weighted} (sum of individual deal values × closure probabilities)")
            if excl_cnt > 0:
                lines.append(f"- **Excluded Records Scope**: {excl_cnt} open deals were excluded from analysis because monetary deal value or probability was missing.")

            if concentration_insight:
                lines.append(f"\n#### 💡 Concentration Insight:\n- **{concentration_insight}**")

            lines.append("\n#### 🚩 Qualifying Vulnerable Opportunities:")
            if qualifying:
                for d in qualifying[:10]:
                    lines.append(f"- **{d['deal_name']}** ({d['customer']}) — **{d['deal_value_formatted']}** ({d.get('deal_contribution_pct', 0)}% of qualifying total | Prob: {d['probability_pct']}%, Weighted: {d['weighted_value_formatted']}, Stage: {d['stage']})")
            else:
                lines.append("- No open deals currently meet the high-value / low-probability risk criteria.")

            lines.append(f"\n#### 🛡️ Data Quality Audit:\n- {dq_note}")
            return "\n".join(lines)

        elif intent == "customer_combined_value_analysis":
            custs = metrics.get("top_combined_customers", [])
            lines = ["### 🏢 Top Commercial Customer Account Rankings", ""]
            lines.append(f"**Headline**: Top customer relationships ranked by combined Sales Pipeline + Active Work Order value.")
            lines.append("\n#### 🏆 Key Customer Accounts:")
            for idx, c in enumerate(custs[:5], 1):
                lines.append(f"{idx}. **{c['customer']}**: **{c['combined_total_formatted']}** total combined value (Pipeline: {c['open_pipeline_formatted']} | Work Orders: {c['active_work_order_formatted']})")
            lines.append(f"\n#### 🛡️ Data Quality Note:\n- {dq_note}")
            return "\n".join(lines)

        elif intent == "cross_board_customer_analysis":
            no_deals = metrics.get("active_work_no_active_deals", [])
            no_work = metrics.get("open_deals_no_active_work", [])
            
            lines = ["### 🔄 Cross-Board Customer Intelligence", ""]
            lines.append(f"**Headline**: Cross-board customer matching between Deals funnel and Work Order Tracker.\n")
            lines.append(f"#### 1. Customers with Active Work Orders but NO Active Deals ({len(no_deals)} customers):")
            for c in no_deals[:5]:
                lines.append(f"- **{c['customer']}**: {c['active_work_orders_count']} active work orders ({c['total_order_value_formatted']}) - Sectors: {', '.join(c['sectors'])}")

            lines.append(f"\n#### 2. Customers with Open Deals but NO Active Work Orders ({len(no_work)} customers):")
            for c in no_work[:5]:
                lines.append(f"- **{c['customer']}**: {c['open_deals_count']} open deals ({c['pipeline_value_formatted']})")

            lines.append(f"\n#### 🛡️ Data Quality Note:\n- {dq_note}")
            return "\n".join(lines)

        else:
            return f"""### 🎯 Skylark BI Executive Summary

**Headline**: Consolidated Business Intelligence view for Skylark Drones leadership.

#### Key Takeaways:
- **Sales & Pipeline**: Active deals across core sectors (Mining, Powerline, Renewables).
- **Operations**: Work orders actively delivering drone data products.
- **Collections & Receivables**: Invoicing and cash collection tracking.

#### 🛡️ Data Quality Audit:
- {dq_note}
"""
