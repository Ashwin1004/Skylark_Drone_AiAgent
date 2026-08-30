export interface DataQualityReport {
  score: number;
  total_records: number;
  valid_records: number;
  missing_values_count: number;
  invalid_dates_count: number;
  unknown_statuses_count: number;
  excluded_records_count: number;
  deductions: string[];
}

export interface ExplainabilityMetadata {
  data_sources: string[];
  filters_applied: Record<string, any>;
  timeframe_resolved: string;
  calculation_method: string;
  assumptions: string[];
}

export interface ChatResponse {
  answer: string;
  intent: string;
  data_sources: string[];
  metrics: Record<string, any>;
  data_quality: DataQualityReport;
  explainability: ExplainabilityMetadata;
  suggested_followups: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responseMetadata?: ChatResponse;
  timestamp: string;
  error?: boolean;
}

export interface HealthResponse {
  status: string;
  monday_connected: boolean;
  deals_board_id?: string;
  work_orders_board_id?: string;
  details: Record<string, any>;
}
