# Engineering Decision Log - Skylark BI

This document records the engineering decisions, trade-offs, design rationale, and technical assumptions made while building the **Skylark BI Executive Intelligence Platform**.

---

## 1. Problem Interpretation & Goal
Skylark Drones leadership requires immediate operational and sales insights from Monday.com boards. Rather than creating a generic chatbot that attempts to answer questions by guessing math over unstructured text, Skylark BI implements a deterministic data pipeline that extracts live data from Monday.com GraphQL API, cleans and normalizes records in Pandas, computes verified metrics, and uses Groq to deliver clear executive explanations.

---

## 2. Technology Selection & Rationale

### Why React + Vite + TypeScript (Frontend)?
- **Type Safety & Speed**: TypeScript guarantees strict compile-time checking for API response metadata. Vite provides fast HMR during development and compiles an optimized production bundle (<350KB).

### Why Python + FastAPI + Pandas (Backend)?
- **Pandas for Math Determinism**: Python Pandas is the gold standard for dataset cleaning, relative date filtering, and cross-board set joins.
- **FastAPI**: Asynchronous ASGI framework providing native Pydantic validation, OpenAPI documentation generation, and high concurrency.

### Why Direct Monday.com GraphQL API v2023-10?
- **Deployment Autonomy**: Direct HTTP/GraphQL execution via `httpx` eliminates external server dependencies, making the backend deployable to cloud platforms like Render or Railway.

### Why Groq API (`llama-3.3-70b-versatile`)?
- **Ultra-Fast Executive Inference**: Groq provides ultra-fast LLM response times with strict adherence to anti-hallucination prompts.

### Why Separate Deterministic Math from LLM Explanations?
- **Zero Hallucination Risk**: LLMs are probabilistic language models, not arithmetic calculators. If an LLM is asked to sum or average raw rows directly, it frequently produces subtle calculation errors. By executing all calculations in Pandas and supplying verified JSON metrics to Groq, math accuracy is 100% guaranteed.

---

## 3. Data Cleaning & Resiliency Strategy
- **Non-Destructive Normalization**: Malformed or incomplete rows are never silently discarded. Missing deal values are recorded as `0.0`, invalid dates are tracked, and every analysis generates a **Data Quality Score (0-100%)** documenting exact deductions.
- **Cross-Board Customer Entity Resolution**: Customer identifiers across Deals (`Client Code`) and Work Orders (`Customer Name Code`) are normalized by stripping legal entity suffixes (`LTD`, `PVT`, `INC`) and special characters prior to performing set intersections.

---

## 4. UI Design Philosophy & Executive Layout
- **Executive SaaS Aesthetics**: Modern desktop-first design with clean typography, spacious padding, custom Skylark color palette, and subtle slate borders.
- **Progressive Transparency**: Executive KPI cards, Data Quality Badges, and an interactive **Analysis Metadata Drawer** provide complete auditability for every response.

---

## 5. Trade-offs & Future Improvements (Post 5-Hour Scope)

### What Was Prioritized:
- Monorepo architecture with FastAPI and Vite React.
- Read-only Monday.com GraphQL API client with cursor pagination and standby dataset fallback.
- Reusable data normalization, Pandas analytics engine, and Data Quality audit scoring.
- Groq AI service abstraction with fallback template generation.
- Cross-board analysis and 7-pillar executive leadership updates.
- 100% passing automated test suite and clean production build.

### What Would Be Improved With More Time:
1. **Redis Caching Layer**: Implement a 5-minute Redis cache for Monday.com GraphQL responses to reduce API roundtrips.
2. **Chart Visualizations**: Render interactive bar/donut charts directly in the chat timeline using Recharts.
3. **Scheduled Email/Slack Digests**: Webhook notifications pushing daily executive summaries directly to founders.

---

## 6. AI Tools Used During Development
- **Gemini 3.6 Flash / Antigravity Agent**: Utilized for rapid scaffold generation, schema inspection, unit test coverage, secret auditing, and documentation authoring.
