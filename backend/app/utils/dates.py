from datetime import datetime, date
from typing import Optional, Tuple, Any
import pandas as pd

def parse_date(val: Any) -> Optional[date]:
    """
    Safely parses various date formats into a standard datetime.date object.
    Handles: strings ('YYYY-MM-DD', 'DD/MM/YYYY', 'DD-Mon-YYYY'), pd.Timestamp, datetime objects, and NaNs.
    """
    if pd.isna(val) or val is None or str(val).strip() in ("", "-", "N/A", "null", "NaN", "NaT"):
        return None
    
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.date()
    
    if isinstance(val, date):
        return val

    val_str = str(val).strip()
    # Try standard pd.to_datetime with dayfirst=False and dayfirst=True fallbacks
    for dayfirst in [False, True]:
        try:
            parsed = pd.to_datetime(val_str, dayfirst=dayfirst, errors='coerce')
            if pd.notna(parsed):
                return parsed.date()
        except Exception:
            pass

    return None


def get_quarter_bounds(year: int, quarter: int) -> Tuple[date, date]:
    """Returns the (start_date, end_date) for a given year and quarter (1-4)."""
    start_months = {1: (1, 1), 2: (4, 1), 3: (7, 1), 4: (10, 1)}
    end_dates = {
        1: (3, 31),
        2: (6, 30),
        3: (9, 30),
        4: (12, 31)
    }
    sm, sd = start_months[quarter]
    em, ed = end_dates[quarter]
    return date(year, sm, sd), date(year, em, ed)


def resolve_relative_timeframe(timeframe_str: str, ref_date: Optional[date] = None) -> Tuple[Optional[date], Optional[date], str]:
    """
    Resolves relative time expressions into (start_date, end_date, description).
    Supports:
    - 'this quarter' / 'current quarter'
    - 'last quarter' / 'previous quarter'
    - 'next quarter'
    - 'this month'
    - 'last month'
    - 'ytd' / 'year to date'
    - 'this year'
    - 'all' / None
    """
    if not ref_date:
        ref_date = date.today()

    tf = (timeframe_str or "").strip().lower()
    
    year = ref_date.year
    month = ref_date.month
    current_q = (month - 1) // 3 + 1

    if "this quarter" in tf or "current quarter" in tf:
        start_d, end_d = get_quarter_bounds(year, current_q)
        return start_d, end_d, f"Q{current_q} {year} ({start_d.strftime('%b %d')} - {end_d.strftime('%b %d, %Y')})"

    if "last quarter" in tf or "previous quarter" in tf:
        lq = current_q - 1 if current_q > 1 else 4
        ly = year if current_q > 1 else year - 1
        start_d, end_d = get_quarter_bounds(ly, lq)
        return start_d, end_d, f"Q{lq} {ly} ({start_d.strftime('%b %d')} - {end_d.strftime('%b %d, %Y')})"

    if "next quarter" in tf:
        nq = current_q + 1 if current_q < 4 else 1
        ny = year if current_q < 4 else year + 1
        start_d, end_d = get_quarter_bounds(ny, nq)
        return start_d, end_d, f"Q{nq} {ny} ({start_d.strftime('%b %d')} - {end_d.strftime('%b %d, %Y')})"

    if "this month" in tf or "current month" in tf:
        start_d = date(year, month, 1)
        next_month_year = year if month < 12 else year + 1
        next_month = month + 1 if month < 12 else 1
        end_d = pd.to_datetime(f"{next_month_year}-{next_month:02d}-01").date() - pd.Timedelta(days=1)
        return start_d, end_d, f"{ref_date.strftime('%B %Y')}"

    if "last month" in tf or "previous month" in tf:
        lm_year = year if month > 1 else year - 1
        lm = month - 1 if month > 1 else 12
        start_d = date(lm_year, lm, 1)
        end_d = date(year, month, 1) - pd.Timedelta(days=1)
        return start_d, end_d, f"{start_d.strftime('%B %Y')}"

    if "ytd" in tf or "year to date" in tf or "this year" in tf:
        start_d = date(year, 1, 1)
        end_d = ref_date
        return start_d, end_d, f"YTD {year} (Jan 01 - {end_d.strftime('%b %d, %Y')})"

    return None, None, "All Time"
