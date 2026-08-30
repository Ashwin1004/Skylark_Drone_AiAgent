import os
import sys
from dotenv import load_dotenv, find_dotenv

# Ensure backend directory is in sys.path for Vercel serverless execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load environment variables FIRST before importing any routes or services
load_dotenv(find_dotenv(usecwd=True))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, health
from app.utils.logging import get_logger

logger = get_logger("Main")

app = FastAPI(
    title="Skylark BI — Executive Intelligence API",
    description="AI-powered Business Intelligence Agent backend for Skylark Drones using Groq & Monday.com",
    version="1.0.0"
)

# CORS setup for local development and production Vercel frontend
frontend_url = os.getenv("FRONTEND_URL")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health.router, prefix="/api", tags=["Health & Metadata"])
app.include_router(chat.router, prefix="/api", tags=["BI Agent Chat"])

@app.get("/")
@app.get("/api")
async def root():
    return {
        "service": "Skylark BI Executive API",
        "status": "online",
        "llm_provider": "Groq",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
