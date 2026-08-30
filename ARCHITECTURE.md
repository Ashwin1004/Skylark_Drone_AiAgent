# Architecture Specification - Skylark BI

This document details the system architecture, component interactions, data pipeline, dynamic integration flows, error handling, and design patterns of the **Skylark BI Executive Intelligence Platform**.

---

## High-Level System Architecture

```
+-------------------------------------------------------------------+
|                  Executive User / Founder Browser                 |
+-------------------------------------------------------------------+
                                  │
                       (HTTP POST /api/chat)
                                  ▼
+-------------------------------------------------------------------+
|                 React + Vite + TypeScript UI                      |
| (Executive Metrics Cards, Metadata Drawer, Data Quality Badges)   |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                     FastAPI Backend Application                   |
|                   (app.main with FRONTEND_URL CORS)               |
+-------------------------------------------------------------------+
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
+------------------+    +------------------+    +------------------+
| Query Parser     |    | Monday.com       |    | Data Normalizer  |
| & Intent Router  |    | GraphQL API      |    | & Quality        |
| (query_          |    | Client (Read-    |    | Auditor (data_   |
| understanding.py)|    | Only v2023-10)   |    | cleaning.py)     |
+------------------+    +------------------+    +------------------+
                                                           │
                                                           ▼
                                                +------------------+
                                                | Deterministic    |
                                                | Pandas Analytics |
                                                | Engine           |
                                                | (analytics.py)   |
                                                +------------------+
                                                           │
                                                           ▼
                                                +------------------+
                                                | Groq AI Service  |
                                                | (llama-3.3-70b-  |
                                                | versatile)       |
                                                +------------------+
```

---

## Core Components & Data Flow

### 1. React Conversational Frontend (`frontend/`)
- Built with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**.
- **Chat Timeline**: Displays executive conversation stream with markdown rendering and contextual follow-up prompt chips.
- **Executive Metric Cards**: Compact KPI summary cards (Total Pipeline, Weighted Pipeline, Active Work Orders, Data Quality Score).
- **Data Quality Indicator**: Interactive score badge displaying overall dataset completeness (`0-100%`) with audit warnings.
- **Analysis Metadata Drawer**: Provides complete explainability by showing intent classification, active filters, timeframe bounds, calculation method, data quality deductions, and raw Pandas metrics JSON.

### 2. FastAPI Backend Application (`backend/app/`)
- **API Routes**:
  - `POST /api/chat`: Processes natural language queries and returns structured answers with explainability metadata.
  - `GET /api/health`: System health and configuration status.
  - `GET /api/health/monday`: Monday.com GraphQL integration status.
  - `GET /api/health/ai`: Groq AI service status.
  - `GET /api/metadata`: System capabilities manifest.
- **Pydantic Schemas**: Strict type enforcement for `ChatRequest`, `ChatResponse`, `DataQualityReport`, and `ExplainabilityMetadata`.

### 3. Dynamic Monday.com Integration (`monday_service.py`)
- **Runtime Source of Truth**: Dynamically queries Monday.com GraphQL API (`https://api.monday.com/v2`).
- **Pagination & Resiliency**: Uses GraphQL `cursor` pagination (`items_page(limit: 100)`) to ensure all records across multi-page boards are retrieved.
- **Read-Only Integration**: Executes GraphQL queries only (`query { boards ... }`). No mutation operations exist.
- **Resilient Fallback**: Automatically degrades to local dataset parser (`Deal funnel Data.xlsx` / `Work_Order_Tracker Data.xlsx`) if API credentials are not provided, allowing zero-crash offline testing.

### 4. Data Cleaning & Normalization Engine (`data_cleaning.py`)
- **Canonical Standardization**:
  - **Numeric & Currency**: Converts string values like `"₹2,64,398.08"`, `"1.5 Cr"`, `"10 Lakh"` into clean floating-point numbers.
  - **Sectors**: Maps `"energy"`, `"POWERLINE"`, `"Powerline Sector"` -> `"Powerline"`, `"mining"` -> `"Mining"`.
  - **Probability**: Maps `"High"` -> `0.8`, `"Medium"` -> `0.5`, `"Low"` -> `0.2`, or percentage strings `"80%"` -> `0.8`.
  - **Dates**: Robust parsing across multiple date formats (`YYYY-MM-DD`, `DD/MM/YYYY`, datetime objects) using `utils.dates.parse_date`.
  - **Customer Entity Resolution**: Normalizes customer strings by stripping corporate suffixes (`LTD`, `PVT`, `INC`) for cross-board set operations.
- **Data Quality Audit**: Calculates a transparent Data Quality Score (`0-100%`) based on missing values, unparseable dates, and unmapped statuses.

### 5. Deterministic Analytics Engine (`analytics.py`)
- **No LLM Math Policy**: All business metrics are calculated in Python using **Pandas**.
- **Supported Analytic Tools**:
  1. `pipeline_overview`: Open, won, lost deal counts, open pipeline sum, weighted pipeline sum, stage distribution.
  2. `sector_analysis`: Sector groupbys across pipeline value, win rates, active work orders, and billed values.
  3. `opportunity_analysis`: Ranks open opportunities deterministically by `Weighted Value = Deal Value × Closure Probability`.
  4. `work_order_analysis`: Active/completed work orders, total contract value, billed amount, collected amount, pending billing, and outstanding receivables.
  5. `cross_board_customer_analysis`: Cross-board joins identifying active work orders without sales deals, open pipeline without active work, and receivables bottlenecks.
  6. `leadership_update`: Consolidated 7-pillar executive update.

### 6. Groq AI Service (`groq_service.py` & `ai_service.py`)
- Leverages Groq API (`llama-3.3-70b-versatile`) via Groq's OpenAI-compatible API to format deterministic JSON metrics into a founder-ready markdown answer.
- **Fallback Template Generator**: If `GROQ_API_KEY` is missing or fails, formats the exact same structured answer using a local Python template string generator.
