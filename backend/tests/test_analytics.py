import pytest
import pandas as pd
from app.services.analytics import AnalyticsEngine, format_currency_inr

def test_format_currency_inr():
    assert format_currency_inr(25000000) == "₹2.50 Cr"
    assert format_currency_inr(500000) == "₹5.00 Lakh"
    assert format_currency_inr(45000) == "₹45,000"

def test_pipeline_overview_analytics():
    df_deals = pd.DataFrame([
        {
            "deal_name": "Deal 1", "status": "Open", "sector": "Mining",
            "deal_value": 1000000.0, "probability": 0.8, "weighted_value": 800000.0,
            "stage": "B. Proposal Sent", "close_date": None, "created_date": None
        },
        {
            "deal_name": "Deal 2", "status": "Won", "sector": "Powerline",
            "deal_value": 500000.0, "probability": 1.0, "weighted_value": 500000.0,
            "stage": "H. Closed Won", "close_date": None, "created_date": None
        }
    ])
    res = AnalyticsEngine.pipeline_overview(df_deals)
    assert res['total_deals'] == 2
    assert res['open_deals'] == 1
    assert res['won_deals'] == 1
    assert res['open_pipeline_value'] == 1000000.0
    assert res['weighted_pipeline_value'] == 800000.0

def test_opportunity_analysis_ranking():
    df_deals = pd.DataFrame([
        {
            "deal_name": "Small Deal", "status": "Open", "normalized_customer": "CUST1",
            "owner": "OWNER1", "sector": "Mining", "stage": "Qualified",
            "deal_value": 100000.0, "probability": 0.5, "weighted_value": 50000.0
        },
        {
            "deal_name": "Big Deal", "status": "Open", "normalized_customer": "CUST2",
            "owner": "OWNER2", "sector": "Powerline", "stage": "Proposal Sent",
            "deal_value": 2000000.0, "probability": 0.8, "weighted_value": 1600000.0
        }
    ])
    res = AnalyticsEngine.opportunity_analysis(df_deals, top_n=2)
    opps = res['top_opportunities']
    assert len(opps) == 2
    assert opps[0]['deal_name'] == "Big Deal" # Rank 1 should be Big Deal

def test_cross_board_customer_analysis():
    df_deals = pd.DataFrame([
        {"normalized_customer": "CUST_A", "status": "Open", "deal_value": 500000.0, "sector": "Mining"}
    ])
    df_wo = pd.DataFrame([
        {
            "normalized_customer": "CUST_B", "deal_name": "WO_B", "execution_status": "Active",
            "sector": "Powerline", "order_value": 300000.0, "billed_value": 100000.0,
            "collected_value": 50000.0, "pending_billing": 200000.0, "outstanding_receivable": 50000.0
        }
    ])
    res = AnalyticsEngine.cross_board_customer_analysis(df_deals, df_wo)
    assert res['active_work_no_active_deals_count'] == 1
    assert res['active_work_no_active_deals'][0]['customer'] == "CUST_B"
    assert res['open_deals_no_active_work_count'] == 1
    assert res['open_deals_no_active_work'][0]['customer'] == "CUST_A"

def test_empty_datasets_resilience():
    df_empty_deals = pd.DataFrame()
    df_empty_wo = pd.DataFrame()
    res_pipe = AnalyticsEngine.pipeline_overview(df_empty_deals)
    assert res_pipe['total_deals'] == 0
    res_wo = AnalyticsEngine.work_order_analysis(df_empty_wo)
    assert res_wo['total_work_orders'] == 0

def test_deal_risk_analysis_assertions():
    df_deals = pd.DataFrame([
        {
            "deal_name": "Deal A", "status": "Open", "normalized_customer": "CUST_A",
            "owner": "OWNER1", "sector": "Mining", "stage": "Feasibility",
            "deal_value": 305900000.0, "probability": 0.20, "weighted_value": 61180000.0
        },
        {
            "deal_name": "Deal B", "status": "Open", "normalized_customer": "CUST_B",
            "owner": "OWNER2", "sector": "Powerline", "stage": "Feasibility",
            "deal_value": 91800000.0, "probability": 0.20, "weighted_value": 18360000.0
        },
        {
            "deal_name": "Small Deal (Excluded)", "status": "Open", "normalized_customer": "CUST_C",
            "owner": "OWNER3", "sector": "Renewables", "stage": "Qualified",
            "deal_value": 5000000.0, "probability": 0.20, "weighted_value": 1000000.0
        }
    ])
    res = AnalyticsEngine.deal_risk_analysis(df_deals, high_val_threshold=10000000.0, low_prob_threshold=0.20)
    assert res['qualifying_count'] == 2
    assert res['combined_deal_value'] == 397700000.0
    assert res['combined_weighted_value'] == 79540000.0
    assert abs(res['combined_deal_value'] - sum(d['deal_value'] for d in res['qualifying_deals'])) < 1.0
    assert abs(res['combined_weighted_value'] - sum(d['weighted_value'] for d in res['qualifying_deals'])) < 1.0

    # Concentration percentage assertions
    q_deals = res['qualifying_deals']
    assert q_deals[0]['deal_contribution_pct'] == 76.9 # 305.9 / 397.7 * 100
    assert q_deals[1]['deal_contribution_pct'] == 23.1 # 91.8 / 397.7 * 100
    assert abs(sum(d['deal_contribution_pct'] for d in q_deals) - 100.0) < 0.5
    assert "filter_transparency" in res
    assert res["filter_transparency"]["qualifying_records"] == 2


