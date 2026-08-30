# Skylark BI — Executive AI Business Intelligence Agent

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?style=flat&logo=react)](https://reactjs.org)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-orange.svg?style=flat)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)

An executive-ready, AI-powered Business Intelligence Agent built for Skylark Drones leadership. It dynamically retrieves operational data from Monday.com GraphQL API, normalizes cross-board sales and operations datasets, executes 100% deterministic Pandas analytics, and delivers explainable executive insights via Groq (`llama-3.3-70b-versatile`).

---

## 🎯 Problem Statement & Executive Value

Skylark Drones leadership needs instant, reliable answers regarding sales pipeline performance, operational work order execution, cash collections, and cross-board customer alignment without manually sorting through raw rows across multiple Monday.com boards.

### Key Capabilities:
1. **Dynamic Live Ingestion**: Fetches live Deals (`5030964098`) and Work Orders (`5030964276`) board items via Monday.com GraphQL API v2023-10 with cursor pagination and parallel execution.
2. **Deterministic Analytics**: Computes 100% of pipeline totals, weighted sums, stage distributions, and cross-board set joins using Python Pandas 2.2 (guaranteeing zero math hallucinations).
3. **Intent Classification**: Pre-classifies messages into Greetings, Casual Conversations, Farewells, Out-of-Scope, and Business Queries to prevent unnecessary API calls.
4. **Multi-Intent Reporting**: Seamlessly processes compound executive queries (e.g., *"What are our revenue risks? How is the Energy sector performing?"*) into unified reports.
5. **Page Reload Resiliency**: Tracks requests via client `request_id` and `localStorage` state persistence, automatically recovering active analyses on browser reload.
6. **Data Quality & Auditability**: Evaluates dataset health (0-100%) and provides an Inspect Metadata slide-over drawer detailing applied filters, calculation rules, and assumptions.

---

## 🏗️ Architecture & System Data Flow

```
User Question
      │
      ▼
React UI (Skylark BI Frontend)
      │  (HTTP POST /api/chat)
      ▼
FastAPI Backend (app.main)
      │
      ├─► Intent Classifier & Parameter Extractor (query_understanding.py)
      │        │  (Filters greetings/casual text before Monday.com API calls)
      │        ▼
      ├─► Monday.com Service GraphQL API v2023-10 (monday_service.py)
      │        │  Reads Deals & Work Orders boards in parallel (with 5-min TTL cache)
      │        ▼
      ├─► Data Normalization & Quality Auditor (data_cleaning.py)
      │        │  Standardizes INR currencies, dates, sectors, probabilities
      │        ▼
      ├─► Deterministic Analytics Engine (analytics.py)
      │        │  Computes pipeline sums, weighted totals, cross-board joins in Pandas
      │        ▼
      └─► Groq AI Explanation Service (groq_service.py)
               │  Formats verified metrics into executive markdown answers
               ▼
React UI (Renders Markdown Reports, Recharts Visualizations, Invoicing Cards, Metadata Drawer)
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, React Markdown, Remark GFM.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Pandas 2.2, HTTPX.
- **Data Source**: Monday.com GraphQL API (`v2023-10`).
- **AI Engine**: Groq API (`llama-3.3-70b-versatile`).

---

## 🔐 Security & Production Isolation

- **Token Isolation**: API tokens (`MONDAY_API_TOKEN`, `GROQ_API_KEY`) reside strictly on the FastAPI backend in environment variables.
- **Read-Only Integration**: The Monday.com integration only executes GraphQL read queries (`query { boards ... }`). No mutation operations exist.
- **Zero Raw Math Expositions**: Deterministic metrics are pre-calculated in Python before passing to the LLM.

---

## 🚀 Quick Start & Local Development

### 1. Clone & Configure Environment
Create a `.env` file in the root workspace folder:
```bash
cp .env.example .env
```

Configure your credentials:
```env
MONDAY_API_TOKEN=your_monday_api_token
MONDAY_DEALS_BOARD_ID=5030964098
MONDAY_WORK_ORDERS_BOARD_ID=5030964276

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

PORT=8000
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

### 2. Run Backend (FastAPI)
```bash
# Activate virtual environment
.venv\Scripts\activate

# Start uvicorn server
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend live at `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`).

### 3. Run Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Frontend live at `http://localhost:5173`.

---

## ☁️ Production Deployment (Vercel / Cloud)

### Deployment Configuration (`vercel.json`)
The application includes a production `vercel.json` configuring Vercel serverless rewrites to route frontend `/api/*` traffic to the FastAPI production deployment:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend-production-domain.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment Variables on Vercel:
- `VITE_API_BASE_URL`: Defaults to `/api` (or custom backend URL).

---

## 🧪 Testing

Run the automated backend test suite:
```bash
.venv\Scripts\pytest backend/tests
```

**Test Results**: `22 passed in 1.73s` (100% pass rate covering intent classification, multi-intent extraction, Monday.com normalization, cross-board set joins, and response completeness).

---

## 📡 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | GET | System health & Monday/Groq connectivity check |
| `/api/chat` | POST | Main business intelligence query endpoint |
| `/api/chat/status/{request_id}` | GET | Request status & recovery endpoint |
| `/api/metadata` | GET | Platform capabilities manifest |

---

## 🎯 Executive Demo Queries

1. `"How is our pipeline looking this quarter?"`
2. `"How is the Energy sector performing?"`
3. `"What are our biggest revenue and collection risks? How is the Energy sector performing?"`
4. `"Which customers have active work orders but no active deals?"`
5. `"How much money is pending billing or collection?"`
6. `"Prepare a leadership update."`
