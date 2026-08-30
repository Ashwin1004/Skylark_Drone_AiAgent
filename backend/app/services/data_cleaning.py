import re
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
from app.utils.dates import parse_date
from app.models.schemas import DataQualityReport
from app.utils.logging import get_logger

logger = get_logger("DataCleaning")

# Sector canonical mapping
SECTOR_MAP = {
    "mining": "Mining",
    "powerline": "Powerline",
    "energy": "Powerline",
    "renewables": "Renewables",
    "railways": "Railways",
    "construction": "Construction",
    "tender": "Tender",
    "dsp": "DSP",
    "others": "Others",
    "other": "Others"
}

# Deal status canonical mapping
DEAL_STATUS_MAP = {
    "open": "Open",
    "won": "Won",
    "closed won": "Won",
    "dead": "Lost",
    "lost": "Lost",
    "closed lost": "Lost",
    "on hold": "On Hold",
    "projects on hold": "On Hold"
}

# Work order execution status canonical mapping
EXECUTION_STATUS_MAP = {
    "completed": "Completed",
    "ongoing": "Active",
    "executed until current month": "Active",
    "not started": "Not Started",
    "pause / struck": "Paused",
    "paused": "Paused",
    "stuck": "Paused"
}

PROBABILITY_MAP = {
    "high": 0.8,
    "medium": 0.5,
    "low": 0.2
}


def clean_currency_or_number(val: Any) -> Optional[float]:
    """
    Parses currency/numeric inputs, strips '₹', commas, 'Cr', 'Lakh', percentage, etc.
    """
    if pd.isna(val) or val is None or str(val).strip() in ("", "-", "N/A", "null", "NaN", "NaT"):
        return None
    if isinstance(val, (int, float)):
        return float(val)

    s = str(val).strip().replace("₹", "").replace(",", "").replace("Rs.", "").replace("Rs", "")
    
    # Handle Cr or Lakh if text
    is_cr = "cr" in s.lower()
    is_lakh = "lakh" in s.lower() or "lac" in s.lower()
    
    cleaned = re.sub(r"[^\d.-]", "", s)
    if not cleaned or cleaned == "-":
        return None

    try:
        num = float(cleaned)
        if is_cr:
            num *= 10_00_00_00
        elif is_lakh:
            num *= 1_00_000
        return num
    except Exception:
        return None


def clean_probability(val: Any) -> float:
    """Normalizes closure probability string/number into decimal float (0.0 to 1.0)."""
    if pd.isna(val) or val is None or str(val).strip() in ("", "-", "N/A"):
        return 0.5 # Default medium probability if missing

    if isinstance(val, (int, float)):
        # If given as percentage like 80 or fraction like 0.8
        if val > 1.0:
            return min(1.0, max(0.0, val / 100.0))
        return min(1.0, max(0.0, float(val)))

    s = str(val).strip().lower()
    if s in PROBABILITY_MAP:
        return PROBABILITY_MAP[s]

    cleaned = re.sub(r"[^\d.]", "", s)
    if cleaned:
        try:
            num = float(cleaned)
            return num / 100.0 if num > 1.0 else num
        except Exception:
            pass

    return 0.5


def clean_sector(val: Any) -> str:
    """Normalizes sector/service name to canonical string."""
    if pd.isna(val) or val is None or str(val).strip() in ("", "-", "N/A", "null"):
        return "Unspecified"

    s = str(val).strip().lower()
    for key, canonical in SECTOR_MAP.items():
        if key in s:
            return canonical

    return str(val).strip().title()


def normalize_customer_name(name: Any) -> str:
    """Normalizes customer name for robust cross-board matching."""
    if pd.isna(name) or not name:
        return "UNKNOWN"
    s = str(name).strip().upper()
    s = re.sub(r"\b(LIMITED|LTD|PVT|PRIVATE|INC|CORP|CORPORATION)\b", "", s)
    s = re.sub(r"[^\w\s]", "", s)
    return " ".join(s.split())


class DataNormalizer:
    
    @staticmethod
    def normalize_deals(raw_deals: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, DataQualityReport]:
        """
        Normalizes raw Deals board records into a structured Pandas DataFrame and produces a DataQualityReport.
        """
        deductions = []
        total_records = len(raw_deals)
        valid_records = 0
        missing_val_count = 0
        invalid_date_count = 0
        unknown_status_count = 0

        cleaned_rows = []

        for item in raw_deals:
            # Handle column name variations from Excel / Monday.com API
            deal_name = item.get("Deal Name") or item.get("Item Name") or item.get("Deal name masked") or "Unnamed Deal"
            
            # Header row check (e.g., if header string got parsed as data)
            if str(deal_name).strip() in ("Deal Name", "Deal name masked"):
                continue

            owner = item.get("Owner code") or item.get("BD/KAM Personnel code") or "Unassigned"
            client_code = item.get("Client Code") or item.get("Customer Name Code") or item.get("Client")
            
            raw_status = str(item.get("Deal Status") or item.get("Stage/Status") or "Open").strip()
            status = DEAL_STATUS_MAP.get(raw_status.lower(), raw_status.title())
            if status not in ("Open", "Won", "Lost", "On Hold"):
                unknown_status_count += 1
                status = "Open"

            raw_stage = str(item.get("Deal Stage") or item.get("Stage") or "Qualified").strip()
            sector = clean_sector(item.get("Sector/service") or item.get("Sector"))

            # Monetary
            raw_val = item.get("Masked Deal value") or item.get("Deal Value (INR)") or item.get("Deal Value")
            deal_value = clean_currency_or_number(raw_val)
            if deal_value is None:
                missing_val_count += 1
                deal_value = 0.0

            # Probability
            prob = clean_probability(item.get("Closure Probability") or item.get("Probability (%)"))
            weighted_value = deal_value * prob

            # Dates
            close_date = parse_date(item.get("Close Date (A)")) or parse_date(item.get("Tentative Close Date"))
            created_date = parse_date(item.get("Created Date")) or parse_date(item.get("Created At"))

            if not close_date and not created_date:
                invalid_date_count += 1

            is_valid = (deal_value > 0) and (close_date is not None or created_date is not None)
            if is_valid:
                valid_records += 1

            norm_customer = normalize_customer_name(client_code or deal_name)

            cleaned_rows.append({
                "deal_name": str(deal_name).strip(),
                "owner": str(owner).strip(),
                "client_code": str(client_code).strip() if client_code else None,
                "normalized_customer": norm_customer,
                "status": status,
                "stage": raw_stage,
                "sector": sector,
                "deal_value": deal_value,
                "probability": prob,
                "weighted_value": weighted_value,
                "close_date": close_date,
                "created_date": created_date,
                "is_valid_monetary": deal_value > 0
            })

        df = pd.DataFrame(cleaned_rows)

        # Calculate Data Quality Score
        base_score = 100.0
        if total_records > 0:
            missing_pct = (missing_val_count / total_records) * 40
            date_pct = (invalid_date_count / total_records) * 30
            status_pct = (unknown_status_count / total_records) * 10
            score = max(0.0, round(base_score - missing_pct - date_pct - status_pct, 1))

            if missing_val_count > 0:
                deductions.append(f"{missing_val_count} deals have missing deal values.")
            if invalid_date_count > 0:
                deductions.append(f"{invalid_date_count} deals have missing or unparseable close/creation dates.")
            if unknown_status_count > 0:
                deductions.append(f"{unknown_status_count} deals have unmapped status classifications.")
        else:
            score = 100.0

        report = DataQualityReport(
            score=score,
            total_records=total_records,
            valid_records=valid_records,
            missing_values_count=missing_val_count,
            invalid_dates_count=invalid_date_count,
            unknown_statuses_count=unknown_status_count,
            excluded_records_count=missing_val_count,
            deductions=deductions
        )

        return df, report

    @staticmethod
    def normalize_work_orders(raw_work_orders: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, DataQualityReport]:
        """
        Normalizes raw Work Order Tracker records into a structured Pandas DataFrame and produces a DataQualityReport.
        """
        deductions = []
        total_records = len(raw_work_orders)
        valid_records = 0
        missing_val_count = 0
        invalid_date_count = 0
        unknown_status_count = 0

        cleaned_rows = []

        for item in raw_work_orders:
            deal_name = item.get("Deal name masked") or item.get("Deal Name") or item.get("Item Name") or "Unnamed Work Order"
            if str(deal_name).strip() in ("Deal name masked", "Deal Name"):
                continue

            customer_code = item.get("Customer Name Code") or item.get("Client Code") or "UNKNOWN_CUST"
            serial_no = item.get("Serial #") or item.get("Item ID") or ""
            nature_of_work = item.get("Nature of Work") or "General Ops"
            
            raw_exec_status = str(item.get("Execution Status") or "Not Started").strip()
            exec_status = EXECUTION_STATUS_MAP.get(raw_exec_status.lower(), "Active")

            sector = clean_sector(item.get("Sector"))

            # Financial Fields
            val_excl = clean_currency_or_number(item.get("Amount in Rupees (Excl of GST) (Masked)"))
            val_incl = clean_currency_or_number(item.get("Amount in Rupees (Incl of GST) (Masked)"))
            billed_incl = clean_currency_or_number(item.get("Billed Value in Rupees (Incl of GST.) (Masked)")) or 0.0
            collected_incl = clean_currency_or_number(item.get("Collected Amount in Rupees (Incl of GST.) (Masked)")) or 0.0
            
            to_be_billed_incl = clean_currency_or_number(item.get("Amount to be billed in Rs. (Incl. of GST) (Masked)"))
            receivable = clean_currency_or_number(item.get("Amount Receivable (Masked)"))

            # Total value resolution
            total_order_val = val_incl if val_incl is not None else (val_excl if val_excl is not None else 0.0)

            if total_order_val == 0.0:
                missing_val_count += 1

            # Calculated billing & collection metrics
            pending_billing = to_be_billed_incl if to_be_billed_incl is not None else max(0.0, total_order_val - billed_incl)
            outstanding_receivable = receivable if receivable is not None else max(0.0, billed_incl - collected_incl)

            # Dates
            po_date = parse_date(item.get("Date of PO/LOI"))
            start_date = parse_date(item.get("Probable Start Date"))
            end_date = parse_date(item.get("Probable End Date"))
            last_invoice_date = parse_date(item.get("Last invoice date"))

            if not po_date and not start_date:
                invalid_date_count += 1

            if total_order_val > 0:
                valid_records += 1

            norm_customer = normalize_customer_name(customer_code or deal_name)

            cleaned_rows.append({
                "deal_name": str(deal_name).strip(),
                "customer_code": str(customer_code).strip(),
                "normalized_customer": norm_customer,
                "serial_no": str(serial_no).strip(),
                "nature_of_work": str(nature_of_work).strip(),
                "execution_status": exec_status,
                "sector": sector,
                "order_value": total_order_val,
                "billed_value": billed_incl,
                "collected_value": collected_incl,
                "pending_billing": pending_billing,
                "outstanding_receivable": outstanding_receivable,
                "po_date": po_date,
                "start_date": start_date,
                "end_date": end_date,
                "last_invoice_date": last_invoice_date
            })

        df = pd.DataFrame(cleaned_rows)

        base_score = 100.0
        if total_records > 0:
            missing_pct = (missing_val_count / total_records) * 35
            date_pct = (invalid_date_count / total_records) * 25
            score = max(0.0, round(base_score - missing_pct - date_pct, 1))

            if missing_val_count > 0:
                deductions.append(f"{missing_val_count} work orders have missing monetary total order values.")
            if invalid_date_count > 0:
                deductions.append(f"{invalid_date_count} work orders have missing PO or start dates.")
        else:
            score = 100.0

        report = DataQualityReport(
            score=score,
            total_records=total_records,
            valid_records=valid_records,
            missing_values_count=missing_val_count,
            invalid_dates_count=invalid_date_count,
            unknown_statuses_count=unknown_status_count,
            excluded_records_count=missing_val_count,
            deductions=deductions
        )

        return df, report
