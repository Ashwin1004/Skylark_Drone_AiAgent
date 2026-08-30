from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ChatRequest(BaseModel):
    question: str = Field(..., description="User's natural language question")
    conversation_id: Optional[str] = Field(default=None, description="Optional conversation tracking ID")
    request_id: Optional[str] = Field(default=None, description="Unique client request tracking ID")
    context_history: Optional[List[Dict[str, Any]]] = Field(default=None, description="Recent conversation turns for follow-ups")

class DataQualityReport(BaseModel):
    score: float = Field(..., description="Data quality score percentage (0-100%)")
    total_records: int = Field(..., description="Total raw records inspected")
    valid_records: int = Field(..., description="Records fully valid for monetary & state calculations")
    missing_values_count: int = Field(0, description="Records with missing monetary/essential values")
    invalid_dates_count: int = Field(0, description="Records with missing or unparseable dates")
    unknown_statuses_count: int = Field(0, description="Records with unknown or unmapped statuses")
    excluded_records_count: int = Field(0, description="Records excluded from specific calculations")
    deductions: List[str] = Field(default_factory=list, description="Specific breakdown of score deductions")

class ExplainabilityMetadata(BaseModel):
    data_sources: List[str] = Field(..., description="Boards or datasets queried (e.g., ['Deals', 'Work Orders'])")
    filters_applied: Dict[str, Any] = Field(default_factory=dict, description="Active filters applied (sector, timeframe, stage)")
    timeframe_resolved: str = Field("All Time", description="Resolved date bounds (e.g., 'Q3 2026')")
    calculation_method: str = Field(..., description="Transparent calculation methodology")
    assumptions: List[str] = Field(default_factory=list, description="Explicit assumptions made in the analysis")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="Business-friendly formatted markdown response")
    intent: str = Field(..., description="Classified intent (e.g., 'pipeline_overview', 'cross_board_customer_analysis')")
    data_sources: List[str] = Field(..., description="Data sources used for the response")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Calculated deterministic metric payload")
    data_quality: DataQualityReport = Field(..., description="Audit report of data quality and score")
    explainability: ExplainabilityMetadata = Field(..., description="Explainability metadata")
    suggested_followups: List[str] = Field(default_factory=list, description="Contextual follow-up question suggestions")

class HealthResponse(BaseModel):
    status: str
    monday_connected: bool
    deals_board_id: Optional[str] = None
    work_orders_board_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
