# Skylark BI — Executive Business Intelligence Agent

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?style=flat&logo=react)](https://reactjs.org)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-orange.svg?style=flat)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)

An executive-ready, AI-powered Business Intelligence Agent built for Skylark Drones leadership. It dynamically retrieves operational data from Monday.com GraphQL API, normalizes messy cross-board sales and operations datasets, executes deterministic Pandas analytics, and delivers explainable executive insights via Groq (`llama-3.3-70b-versatile`).

---

## 🎯 Problem Statement
Skylark Drones leadership needs instant, reliable answers regarding sales pipeline performance, operational work order execution, cash collections, and cross-board customer alignment without manually sorting through hundreds of raw rows across multiple Monday.com boards.

## 💡 Solution
Skylark BI acts as an executive intelligence platform that:
1. Dynamically fetches raw Deals and Work Orders board items from Monday.com GraphQL API.
2. Cleans and normalizes messy monetary strings, dates, and sector names.
3. Computes 100% of calculations deterministically in Python with Pandas (guaranteeing zero math hallucinations).
4. Generates founder-ready executive markdown explanations via Groq.
5. Provides complete explainability by rendering a Data Quality Score (`0-100%`) and an Analysis Metadata Drawer.

---

## 🏗️ Architecture & Data Flow

```
User Question
      │
      ▼
React UI (Skylark BI)
      │  (HTTP POST /api/chat)
      ▼
FastAPI Backend (app.main)
      │
      ├─► Intent Classifier & Parameter Extractor (query_understanding.py)
      │
      ├─► Monday.com Service GraphQL API v2023-10 (monday_service.py)
      │        │  Reads Deals & Work Orders boards dynamically
      │        ▼
      ├─► Data Normalization & Quality Auditor (data_cleaning.py)
      │        │  Standardizes currencies, dates, sectors, probabilities
      │        ▼
      ├─► Deterministic Analytics Engine (analytics.py)
      │        │  Computes pipeline sums, weighted totals, cross-board joins in Pandas
      │        ▼
      └─► Groq AI Explanation Service (groq_service.py)
               │  Formats verified metrics into executive markdown answers
               ▼
React UI (Renders Executive Headline, Metric Cards, Insights, Metadata Drawer)
```

---

## 🛠️ Tech Stack & Selection Rationale

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.
  - *Rationale*: Type-safe, ultra-fast Vite build (<350KB bundle), modern executive dark theme styling.
- **Backend**: Python 3.11, FastAPI, Pydantic, Pandas 2.2, HTTPX.
  - *Rationale*: High-performance ASGI server with Pydantic type validation; Pandas ensures 100% math determinism.
- **Data Source**: Monday.com GraphQL API (`v2023-10`).
  - *Rationale*: Read-only live operational source of truth with cursor pagination.
- **AI Engine**: Groq API (`llama-3.3-70b-versatile`).
  - *Rationale*: Ultra-fast inference with strict anti-hallucination prompts.

---

## 🔐 Security & Secret Isolation

- **Backend Secret Isolation**: API tokens (`MONDAY_API_TOKEN`, `GROQ_API_KEY`) reside exclusively on the FastAPI backend in `.env` (ignored by git).
- **Zero Frontend Secrets**: The React frontend communicates strictly with FastAPI relative endpoints (`/api/chat`).
- **Read-Only Integration**: The Monday.com service only executes GraphQL queries (`query { boards ... }`). No mutation operations exist in the codebase.

---

## 🚀 Quick Start & Local Development

### 1. Clone & Configure Environment
Create a `.env` file in the root workspace folder:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
MONDAY_API_TOKEN=your_monday_api_token
MONDAY_DEALS_BOARD_ID=5030964275
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
Backend live at `http://localhost:8000` (API Documentation: `http://localhost:8000/docs`).

### 3. Run Frontend (React + Vite)
```bash
# In a new terminal window
cd frontend
npm run dev
```
Frontend live at `http://localhost:5173`.

---

## 🧪 Testing

Run the automated backend test suite:
```bash
.venv\Scripts\pytest -o pythonpath=backend backend/tests
```
**Test Results**: 14/14 tests passing cleanly across date parsing, currency conversion, sector cleaning, pipeline analytics, opportunity ranking, cross-board set joins, and query classification.

---

## 📡 API Endpoints

- `GET /api/health`: System health and configuration check.
- `GET /api/health/monday`: Monday.com GraphQL integration status.
- `GET /api/health/ai`: Groq AI service status.
- `GET /api/metadata`: System capabilities manifest.
- `POST /api/chat`: Main query endpoint accepting `{ "question": "..." }` and returning structured `ChatResponse`.

---

## 🎯 Executive Demo Queries

1. `"How is our pipeline looking this quarter?"`
2. `"How is the energy sector performing?"`
3. `"What are our biggest high-probability opportunities?"`
4. `"How many active work orders do we have?"`
5. `"Which customers have active work orders but no active deals?"`
6. `"How much money is pending billing or collection?"`
7. `"Prepare a leadership update."`

---

## 📄 Additional Documentation
- [Decision Log (DECISION_LOG.md)](file:///m:/Skylark_Drones_Agent/DECISION_LOG.md)
- [Architecture Document (ARCHITECTURE.md)](file:///m:/Skylark_Drones_Agent/ARCHITECTURE.md)
- [Environment Template (.env.example)](file:///m:/Skylark_Drones_Agent/.env.example)
