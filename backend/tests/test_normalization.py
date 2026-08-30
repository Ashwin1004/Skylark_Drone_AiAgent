import pytest
from datetime import date
from app.utils.dates import parse_date, resolve_relative_timeframe
from app.services.data_cleaning import (
    clean_currency_or_number,
    clean_probability,
    clean_sector,
    normalize_customer_name,
    DataNormalizer
)

def test_parse_date():
    assert parse_date("2026-08-30") == date(2026, 8, 30)
    assert parse_date("30/08/2026") == date(2026, 8, 30)
    assert parse_date("None") is None
    assert parse_date("-") is None
    assert parse_date(None) is None

def test_clean_currency_or_number():
    assert clean_currency_or_number("₹2,64,398.08") == 264398.08
    assert clean_currency_or_number("Rs. 1.5 Cr") == 15000000.0
    assert clean_currency_or_number("10 Lakh") == 1000000.0
    assert clean_currency_or_number(154150) == 154150.0
    assert clean_currency_or_number("-") is None
    assert clean_currency_or_number("N/A") is None

def test_clean_probability():
    assert clean_probability("High") == 0.8
    assert clean_probability("Medium") == 0.5
    assert clean_probability("Low") == 0.2
    assert clean_probability("80%") == 0.8
    assert clean_probability(0.75) == 0.75
    assert clean_probability(None) == 0.5

def test_clean_sector():
    assert clean_sector("energy") == "Powerline"
    assert clean_sector("Mining") == "Mining"
    assert clean_sector("Renewables Sector") == "Renewables"
    assert clean_sector("-") == "Unspecified"

def test_normalize_customer_name():
    assert normalize_customer_name("Tata Steel Limited") == "TATA STEEL"
    assert normalize_customer_name("TATA STEEL LTD") == "TATA STEEL"
    assert normalize_customer_name("  WOCOMPANY_002 ") == "WOCOMPANY_002"

def test_normalize_deals_data_quality():
    raw_deals = [
        {
            "Deal Name": "Deal Alpha",
            "Owner code": "OWNER_001",
            "Client Code": "COMPANY001",
            "Deal Status": "Open",
            "Masked Deal value": 500000.0,
            "Closure Probability": "High",
            "Sector/service": "Mining",
            "Created Date": "2026-01-15"
        },
        {
            "Deal Name": "Deal Beta (Missing Value)",
            "Deal Status": "Open",
            "Masked Deal value": None,
            "Sector/service": "Powerline"
        }
    ]
    df_deals, dq_report = DataNormalizer.normalize_deals(raw_deals)
    assert len(df_deals) == 2
    assert dq_report.total_records == 2
    assert dq_report.missing_values_count == 1
    assert dq_report.score < 100.0
