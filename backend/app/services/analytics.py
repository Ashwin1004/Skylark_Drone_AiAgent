from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import date
from app.utils.logging import get_logger

from app.config.analytics_config import HIGH_VALUE_THRESHOLD, LOW_PROBABILITY_THRESHOLD

logger = get_logger("AnalyticsEngine")

def format_currency_inr(amount: float) -> str:
    """Formats numeric INR into human-readable Crores / Lakhs string."""
    if amount >= 1_00_00_000:
        return f"₹{amount / 1_00_00_000:.2f} Cr"
    elif amount >= 1_00_000:
        return f"₹{amount / 1_00_000:.2f} Lakh"
    else:
        return f"₹{amount:,.0f}"


class AnalyticsEngine:

    @staticmethod
    def pipeline_overview(
        df_deals: pd.DataFrame,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Calculates deterministic pipeline metrics over optional date bounds.
        """
        df = df_deals.copy()
        if df.empty:
            return {
                "total_deals": 0, "open_deals": 0, "won_deals": 0, "lost_deals": 0,
                "total_pipeline_value": 0.0, "total_pipeline_formatted": "₹0",
                "open_pipeline_value": 0.0, "open_pipeline_formatted": "₹0",
                "weighted_pipeline_value": 0.0, "weighted_pipeline_formatted": "₹0",
                "avg_deal_value": 0.0, "avg_deal_formatted": "₹0",
                "stage_distribution": {}, "sector_distribution": {}
            }

        # Filter by close_date or created_date if timeframe supplied
        if start_date and end_date:
            mask = df['close_date'].apply(lambda d: start_date <= d <= end_date if d else False) | \
                   df['created_date'].apply(lambda d: start_date <= d <= end_date if d else False)
            df = df[mask]

        total_deals = len(df)
        open_deals_df = df[df['status'] == 'Open']
        won_deals_df = df[df['status'] == 'Won']
        lost_deals_df = df[df['status'] == 'Lost']
        on_hold_df = df[df['status'] == 'On Hold']

        open_pipeline_val = float(open_deals_df['deal_value'].sum())
        total_pipeline_val = float(df['deal_value'].sum())
        weighted_val = float(open_deals_df['weighted_value'].sum())
        avg_deal_val = float(open_deals_df['deal_value'].mean()) if len(open_deals_df) > 0 else 0.0

        stage_dist = open_deals_df['stage'].value_counts().to_dict() if not open_deals_df.empty else {}
        sector_dist = df.groupby('sector')['deal_value'].sum().to_dict() if not df.empty else {}

        return {
            "total_deals": total_deals,
            "open_deals": len(open_deals_df),
            "won_deals": len(won_deals_df),
            "lost_deals": len(lost_deals_df),
            "on_hold_deals": len(on_hold_df),
            "total_pipeline_value": total_pipeline_val,
            "total_pipeline_formatted": format_currency_inr(total_pipeline_val),
            "open_pipeline_value": open_pipeline_val,
            "open_pipeline_formatted": format_currency_inr(open_pipeline_val),
            "weighted_pipeline_value": weighted_val,
            "weighted_pipeline_formatted": format_currency_inr(weighted_val),
            "avg_deal_value": avg_deal_val,
            "avg_deal_formatted": format_currency_inr(avg_deal_val),
            "stage_distribution": stage_dist,
            "sector_distribution": {k: format_currency_inr(v) for k, v in sector_dist.items()}
        }

    @staticmethod
    def sector_analysis(
        df_deals: pd.DataFrame,
        df_work_orders: pd.DataFrame,
        target_sector: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates sector breakdown across both Deals and Work Orders.
        """
        deals_sector_df = df_deals.copy()
        wo_sector_df = df_work_orders.copy()

        if target_sector and target_sector.lower() != "all":
            deals_sector_df = deals_sector_df[deals_sector_df['sector'].str.lower() == target_sector.lower()]
            wo_sector_df = wo_sector_df[wo_sector_df['sector'].str.lower() == target_sector.lower()]

        # Sector deal metrics
        sector_deals_summary = []
        for sector, grp in deals_sector_df.groupby('sector'):
            open_grp = grp[grp['status'] == 'Open']
            won_grp = grp[grp['status'] == 'Won']
            total_val = float(grp['deal_value'].sum())
            open_val = float(open_grp['deal_value'].sum())
            weighted_val = float(open_grp['weighted_value'].sum())
            win_rate = (len(won_grp) / len(grp) * 100.0) if len(grp) > 0 else 0.0

            sector_deals_summary.append({
                "sector": sector,
                "total_deals": len(grp),
                "open_deals": len(open_grp),
                "total_pipeline": total_val,
                "total_pipeline_formatted": format_currency_inr(total_val),
                "open_pipeline": open_val,
                "open_pipeline_formatted": format_currency_inr(open_val),
                "weighted_pipeline": weighted_val,
                "weighted_pipeline_formatted": format_currency_inr(weighted_val),
                "win_rate_pct": round(win_rate, 1)
            })

        # Sector work order metrics
        sector_wo_summary = []
        for sector, grp in wo_sector_df.groupby('sector'):
            active_grp = grp[grp['execution_status'] == 'Active']
            order_val = float(grp['order_value'].sum())
            billed_val = float(grp['billed_value'].sum())
            collected_val = float(grp['collected_value'].sum())

            sector_wo_summary.append({
                "sector": sector,
                "total_work_orders": len(grp),
                "active_work_orders": len(active_grp),
                "total_order_value": order_val,
                "order_value_formatted": format_currency_inr(order_val),
                "billed_value": billed_val,
                "billed_formatted": format_currency_inr(billed_val),
                "collected_value": collected_val,
                "collected_formatted": format_currency_inr(collected_val)
            })

        return {
            "target_sector": target_sector or "All Sectors",
            "deals_by_sector": sector_deals_summary,
            "work_orders_by_sector": sector_wo_summary
        }

    @staticmethod
    def opportunity_analysis(
        df_deals: pd.DataFrame,
        top_n: int = 5
    ) -> Dict[str, Any]:
        """
        Finds and ranks high-probability / high-value open deals.
        Ranking Logic: Score = Deal Value * Closure Probability.
        """
        open_deals = df_deals[df_deals['status'] == 'Open'].copy()
        if open_deals.empty:
            return {"top_opportunities": [], "count": 0, "ranking_rule": "Deal Value * Probability"}

        open_deals['score'] = open_deals['deal_value'] * open_deals['probability']
        ranked = open_deals.sort_values(by='score', ascending=False).head(top_n)

        opportunities = []
        for idx, row in ranked.iterrows():
            opportunities.append({
                "rank": len(opportunities) + 1,
                "deal_name": row['deal_name'],
                "customer": row['normalized_customer'],
                "owner": row['owner'],
                "sector": row['sector'],
                "stage": row['stage'],
                "deal_value": float(row['deal_value']),
                "deal_value_formatted": format_currency_inr(row['deal_value']),
                "probability_pct": int(row['probability'] * 100),
                "weighted_value": float(row['weighted_value']),
                "weighted_formatted": format_currency_inr(row['weighted_value'])
            })

        return {
            "top_opportunities": opportunities,
            "count": len(opportunities),
            "ranking_rule": "Ranked deterministically by Weighted Value (Deal Value × Closure Probability)"
        }

    @staticmethod
    def work_order_analysis(
        df_work_orders: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Calculates operational, billing, and collection metrics across work orders.
        """
        df = df_work_orders.copy()
        if df.empty:
            return {
                "total_work_orders": 0, "active_work_orders": 0, "completed_work_orders": 0,
                "total_order_value": 0.0, "total_order_formatted": "₹0",
                "billed_value": 0.0, "billed_formatted": "₹0",
                "collected_value": 0.0, "collected_formatted": "₹0",
                "pending_billing": 0.0, "pending_billing_formatted": "₹0",
                "outstanding_receivables": 0.0, "receivables_formatted": "₹0"
            }

        active_df = df[df['execution_status'] == 'Active']
        completed_df = df[df['execution_status'] == 'Completed']
        paused_df = df[df['execution_status'] == 'Paused']
        not_started_df = df[df['execution_status'] == 'Not Started']

        total_order = float(df['order_value'].sum())
        total_billed = float(df['billed_value'].sum())
        total_collected = float(df['collected_value'].sum())
        pending_billing = float(df['pending_billing'].sum())
        outstanding_receivables = float(df['outstanding_receivable'].sum())

        return {
            "total_work_orders": len(df),
            "active_work_orders": len(active_df),
            "completed_work_orders": len(completed_df),
            "paused_work_orders": len(paused_df),
            "not_started_work_orders": len(not_started_df),
            "total_order_value": total_order,
            "total_order_formatted": format_currency_inr(total_order),
            "billed_value": total_billed,
            "billed_formatted": format_currency_inr(total_billed),
            "collected_value": total_collected,
            "collected_formatted": format_currency_inr(total_collected),
            "pending_billing": pending_billing,
            "pending_billing_formatted": format_currency_inr(pending_billing),
            "outstanding_receivables": outstanding_receivables,
            "receivables_formatted": format_currency_inr(outstanding_receivables)
        }

    @staticmethod
    def get_billing_analytics(
        df_work_orders: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Calculates deterministic billing & invoicing prioritization analytics from Work Orders data.
        """
        df = df_work_orders.copy()
        if df.empty:
            return {
                "total_eligible_value": 0.0,
                "total_eligible_formatted": "₹0",
                "total_billed_value": 0.0,
                "total_billed_formatted": "₹0",
                "total_unbilled_value": 0.0,
                "total_unbilled_formatted": "₹0",
                "work_orders_with_unbilled_count": 0,
                "total_work_orders_count": 0,
                "priority_work_orders": [],
                "customer_unbilled_breakdown": {},
                "is_unbilled_determined": False,
                "limitation_note": "No work orders data available."
            }

        # Calculate unbilled value for each work order
        df['calculated_unbilled'] = df.apply(
            lambda r: r['pending_billing'] if r.get('pending_billing', 0.0) > 0 
            else max(0.0, float(r.get('order_value', 0.0)) - float(r.get('billed_value', 0.0))),
            axis=1
        )

        total_eligible = float(df['order_value'].sum())
        total_billed = float(df['billed_value'].sum())
        total_unbilled = float(df['calculated_unbilled'].sum())
        
        unbilled_df = df[df['calculated_unbilled'] > 0].copy()
        unbilled_count = len(unbilled_df)

        # Priority scoring algorithm
        def calculate_priority_score(row) -> tuple:
            exec_status = str(row.get('execution_status', 'Active')).strip()
            unbilled = float(row.get('calculated_unbilled', 0.0))
            
            if exec_status == 'Completed' and unbilled > 0:
                return (3, "HIGH", "Completed execution milestone with significant unbilled contract value ready for invoice dispatch.")
            elif exec_status == 'Active' and unbilled >= 5_00_000:
                return (3, "HIGH", "Active ongoing operation with high unbilled deliverable milestone value.")
            elif unbilled > 0:
                return (2, "MEDIUM", "Active work order with moderate unbilled deliverable value awaiting invoice verification.")
            else:
                return (1, "LOW", "Operation in progress or unbilled value currently zero.")

        priority_list = []
        if not unbilled_df.empty:
            for idx, row in unbilled_df.iterrows():
                score, priority_label, reason = calculate_priority_score(row)
                unbilled_val = float(row['calculated_unbilled'])
                priority_list.append({
                    "work_order": row.get('deal_name', 'Unnamed Work Order'),
                    "serial_no": row.get('serial_no', ''),
                    "customer": row.get('normalized_customer', 'UNKNOWN'),
                    "nature_of_work": row.get('nature_of_work', 'General Ops'),
                    "sector": row.get('sector', 'Unspecified'),
                    "execution_status": row.get('execution_status', 'Active'),
                    "order_value": float(row.get('order_value', 0.0)),
                    "order_value_formatted": format_currency_inr(row.get('order_value', 0.0)),
                    "billed_value": float(row.get('billed_value', 0.0)),
                    "billed_formatted": format_currency_inr(row.get('billed_value', 0.0)),
                    "unbilled_amount": unbilled_val,
                    "unbilled_amount_formatted": format_currency_inr(unbilled_val),
                    "priority": priority_label,
                    "priority_score": score,
                    "reason": reason
                })

            priority_list.sort(key=lambda x: (x['priority_score'], x['unbilled_amount']), reverse=True)

        # Customer concentration
        cust_summary = unbilled_df.groupby('normalized_customer')['calculated_unbilled'].sum().to_dict() if not unbilled_df.empty else {}
        cust_formatted = {k: format_currency_inr(v) for k, v in cust_summary.items() if k != "UNKNOWN"}

        missing_values = int((df['order_value'] == 0.0).sum())
        missing_billing = int((df['billed_value'] == 0.0).sum())

        is_determined = total_unbilled > 0 or total_billed > 0
        limitation_note = ""
        if not is_determined:
            limitation_note = f"Exact unbilled revenue cannot be determined from the available Work Orders fields. The dataset contains {len(df)} work orders, but explicit billed/unbilled amount fields are missing or zero."

        return {
            "total_eligible_value": total_eligible,
            "total_eligible_formatted": format_currency_inr(total_eligible),
            "total_billed_value": total_billed,
            "total_billed_formatted": format_currency_inr(total_billed),
            "total_unbilled_value": total_unbilled,
            "total_unbilled_formatted": format_currency_inr(total_unbilled),
            "work_orders_with_unbilled_count": unbilled_count,
            "total_work_orders_count": len(df),
            "priority_work_orders": priority_list[:10],
            "customer_unbilled_breakdown": cust_formatted,
            "is_unbilled_determined": is_determined,
            "limitation_note": limitation_note,
            "data_quality_caveats": {
                "missing_order_values_count": missing_values,
                "missing_billing_values_count": missing_billing
            }
        }


    @staticmethod
    def cross_board_customer_analysis(
        df_deals: pd.DataFrame,
        df_work_orders: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Executes cross-board entity resolution & joins between Deals and Work Orders.
        """
        # Unique customer sets
        open_deals = df_deals[df_deals['status'] == 'Open']
        active_wo = df_work_orders[df_work_orders['execution_status'] == 'Active']

        deal_customers = set(open_deals['normalized_customer'].dropna().unique()) - {"UNKNOWN"}
        wo_customers = set(active_wo['normalized_customer'].dropna().unique()) - {"UNKNOWN"}

        # 1. Customers with active work orders but NO active deals
        active_work_no_deal_custs = wo_customers - deal_customers
        active_work_no_deal_list = []
        for cust in active_work_no_deal_custs:
            wo_sub = active_wo[active_wo['normalized_customer'] == cust]
            deal_names = wo_sub['deal_name'].unique().tolist()
            sectors = wo_sub['sector'].unique().tolist()
            order_val = float(wo_sub['order_value'].sum())
            active_work_no_deal_list.append({
                "customer": cust,
                "deal_names": deal_names,
                "sectors": sectors,
                "active_work_orders_count": len(wo_sub),
                "total_order_value_formatted": format_currency_inr(order_val)
            })

        # 2. Customers with open deals but NO active work orders
        open_deal_no_work_custs = deal_customers - wo_customers
        open_deal_no_work_list = []
        for cust in open_deal_no_work_custs:
            deal_sub = open_deals[open_deals['normalized_customer'] == cust]
            pipe_val = float(deal_sub['deal_value'].sum())
            open_deal_no_work_list.append({
                "customer": cust,
                "open_deals_count": len(deal_sub),
                "pipeline_value_formatted": format_currency_inr(pipe_val),
                "sectors": deal_sub['sector'].unique().tolist()
            })

        # 3. High Pipeline + Outstanding Receivables customers
        receivables_by_cust = df_work_orders.groupby('normalized_customer')['outstanding_receivable'].sum().to_dict()
        pipeline_by_cust = open_deals.groupby('normalized_customer')['deal_value'].sum().to_dict()

        high_risk_customers = []
        for cust, rec_val in receivables_by_cust.items():
            if cust != "UNKNOWN" and rec_val > 0 and cust in pipeline_by_cust:
                high_risk_customers.append({
                    "customer": cust,
                    "outstanding_receivable_formatted": format_currency_inr(rec_val),
                    "open_pipeline_formatted": format_currency_inr(pipeline_by_cust[cust])
                })

        return {
            "active_work_no_active_deals": active_work_no_deal_list,
            "active_work_no_active_deals_count": len(active_work_no_deal_list),
            "open_deals_no_active_work": open_deal_no_work_list,
            "open_deals_no_active_work_count": len(open_deal_no_work_list),
            "high_pipeline_and_outstanding_receivables": high_risk_customers
        }

    @staticmethod
    def owner_analytics(
        df_deals: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Aggregates open deal pipeline, deal counts, and weighted forecast by BD/KAM Personnel code.
        """
        open_deals = df_deals[df_deals['status'] == 'Open'].copy()
        if open_deals.empty:
            return {"owner_breakdown": [], "total_owners": 0}

        owner_summary = []
        for owner, grp in open_deals.groupby('owner'):
            pipe_val = float(grp['deal_value'].sum())
            weighted_val = float(grp['weighted_value'].sum())
            avg_val = float(grp['deal_value'].mean())
            owner_summary.append({
                "owner": str(owner).strip(),
                "open_deals_count": len(grp),
                "open_pipeline_value": pipe_val,
                "open_pipeline_formatted": format_currency_inr(pipe_val),
                "weighted_pipeline_value": weighted_val,
                "weighted_pipeline_formatted": format_currency_inr(weighted_val),
                "avg_deal_value_formatted": format_currency_inr(avg_val),
                "sectors": grp['sector'].unique().tolist()
            })

        owner_summary.sort(key=lambda x: x['open_pipeline_value'], reverse=True)

        return {
            "owner_breakdown": owner_summary,
            "total_owners": len(owner_summary),
            "top_owner": owner_summary[0]['owner'] if owner_summary else "N/A"
        }

    @staticmethod
    def deal_risk_analysis(
        df_deals: pd.DataFrame,
        high_val_threshold: Optional[float] = None,
        low_prob_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Identifies high-value open deals (deal_value >= high_val_threshold) with low closure probability (probability <= low_prob_threshold).
        Computes combined deal value and combined weighted value as exact mathematical sums over ALL qualifying deals.
        """
        h_threshold = high_val_threshold if high_val_threshold is not None else HIGH_VALUE_THRESHOLD
        l_threshold = low_prob_threshold if low_prob_threshold is not None else LOW_PROBABILITY_THRESHOLD

        open_deals = df_deals[df_deals['status'] == 'Open'].copy()
        if open_deals.empty:
            return {
                "qualifying_deals": [],
                "qualifying_count": 0,
                "combined_deal_value": 0.0,
                "combined_deal_value_formatted": "₹0",
                "combined_weighted_value": 0.0,
                "combined_weighted_value_formatted": "₹0",
                "high_value_threshold": h_threshold,
                "high_value_threshold_formatted": format_currency_inr(h_threshold),
                "low_probability_threshold": l_threshold,
                "low_probability_threshold_pct": int(l_threshold * 100),
                "excluded_missing_values_count": 0
            }

        # Filter qualifying deals by BOTH high deal value AND low closure probability
        mask = (open_deals['deal_value'] >= h_threshold) & (open_deals['probability'] <= l_threshold)
        qualifying = open_deals[mask].copy()
        qualifying = qualifying.sort_values(by='deal_value', ascending=False)

        qualifying_list = []
        combined_deal_val = float(qualifying['deal_value'].sum())
        combined_weighted_val = float(qualifying['weighted_value'].sum())

        for idx, row in qualifying.iterrows():
            d_val = float(row['deal_value'])
            prob = float(row['probability'])
            w_val = float(row['weighted_value'])

            # Python-calculated concentration percentages
            deal_pct = round((d_val / combined_deal_val) * 100.0, 1) if combined_deal_val > 0 else 0.0
            weighted_pct = round((w_val / combined_weighted_val) * 100.0, 1) if combined_weighted_val > 0 else 0.0

            qualifying_list.append({
                "deal_name": row['deal_name'],
                "customer": row['normalized_customer'],
                "owner": row['owner'],
                "sector": row['sector'],
                "stage": row['stage'],
                "deal_value": d_val,
                "deal_value_formatted": format_currency_inr(d_val),
                "deal_contribution_pct": deal_pct,
                "probability": prob,
                "probability_pct": int(prob * 100),
                "weighted_value": w_val,
                "weighted_value_formatted": format_currency_inr(w_val),
                "weighted_contribution_pct": weighted_pct,
                "risk_reason": f"High deal value ({format_currency_inr(d_val)}, {deal_pct}% of qualifying total) with low closure probability ({int(prob * 100)}%) in stage '{row['stage']}'."
            })

        # Mathematical assertions for numerical integrity
        if qualifying_list:
            sum_deals = sum(d['deal_value'] for d in qualifying_list)
            sum_weighted = sum(d['weighted_value'] for d in qualifying_list)
            sum_pcts = sum(d['deal_contribution_pct'] for d in qualifying_list)
            assert abs(combined_deal_val - sum_deals) < 1.0, f"Combined deal sum discrepancy: {combined_deal_val} vs {sum_deals}"
            assert abs(combined_weighted_val - sum_weighted) < 1.0, f"Combined weighted sum discrepancy: {combined_weighted_val} vs {sum_weighted}"
            assert abs(sum_pcts - 100.0) < 1.5, f"Concentration percentage sum discrepancy: {sum_pcts}% vs 100%"

        excluded_count = int((open_deals['deal_value'] == 0.0).sum())

        top_concentration_insight = ""
        if qualifying_list:
            top_item = qualifying_list[0]
            top_concentration_insight = f"{top_item['deal_name']} ({top_item['customer']}) represents {top_item['deal_contribution_pct']}% of the qualifying high-value deal pipeline value."

        filter_transparency = {
            "status_filter": "Open",
            "high_value_threshold": f">= {format_currency_inr(h_threshold)}",
            "low_probability_threshold": f"<= {int(l_threshold * 100)}%",
            "records_considered": len(open_deals),
            "qualifying_records": len(qualifying_list),
            "excluded_records_missing_value": excluded_count,
            "exclusion_reasons": ["Missing or zero monetary deal value", f"Deal value < {format_currency_inr(h_threshold)}", f"Closure probability > {int(l_threshold * 100)}%"]
        }

        return {
            "qualifying_deals": qualifying_list,
            "qualifying_count": len(qualifying_list),
            "combined_deal_value": combined_deal_val,
            "combined_deal_value_formatted": format_currency_inr(combined_deal_val),
            "combined_weighted_value": combined_weighted_val,
            "combined_weighted_value_formatted": format_currency_inr(combined_weighted_val),
            "high_value_threshold": h_threshold,
            "high_value_threshold_formatted": format_currency_inr(h_threshold),
            "low_probability_threshold": l_threshold,
            "low_probability_threshold_pct": int(l_threshold * 100),
            "excluded_missing_values_count": excluded_count,
            "top_concentration_insight": top_concentration_insight,
            "filter_transparency": filter_transparency
        }

    @staticmethod
    def customer_combined_value_analysis(
        df_deals: pd.DataFrame,
        df_work_orders: pd.DataFrame,
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Ranks top customer accounts by combined deal pipeline + active work order contract value.
        """
        open_deals = df_deals[df_deals['status'] == 'Open']
        active_wo = df_work_orders[df_work_orders['execution_status'] == 'Active']

        deal_by_cust = open_deals.groupby('normalized_customer')['deal_value'].sum().to_dict()
        wo_by_cust = active_wo.groupby('normalized_customer')['order_value'].sum().to_dict()

        all_customers = set(deal_by_cust.keys()) | set(wo_by_cust.keys())
        all_customers.discard("UNKNOWN")

        combined_list = []
        for cust in all_customers:
            pipe_val = float(deal_by_cust.get(cust, 0.0))
            wo_val = float(wo_by_cust.get(cust, 0.0))
            combined_val = pipe_val + wo_val

            combined_list.append({
                "customer": cust,
                "open_pipeline_value": pipe_val,
                "open_pipeline_formatted": format_currency_inr(pipe_val),
                "active_work_order_value": wo_val,
                "active_work_order_formatted": format_currency_inr(wo_val),
                "combined_total_value": combined_val,
                "combined_total_formatted": format_currency_inr(combined_val)
            })

        combined_list.sort(key=lambda x: x['combined_total_value'], reverse=True)

        return {
            "top_combined_customers": combined_list[:top_n],
            "total_customers_analyzed": len(combined_list)
        }

