"""
TirTir AI Microservice — FastAPI
Models are loaded ONCE at startup via lifespan event:
  - SkinAnalyzer (MediaPipe FaceLandmarker)
  - ChatbotEngine (CountVectorizer + Naive Bayes NLP)
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import time

from skin_analyzer import SkinAnalyzer
from chatbot_engine import ChatbotEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Global references — set during lifespan startup ──────────────────────────
analyzer: SkinAnalyzer | None = None
chatbot: ChatbotEngine | None = None

# Path to the product CSV (same dir as this file, mounted via Docker volume)
_CHATBOT_CSV = os.path.join(os.path.dirname(__file__), "chatbot_products.csv")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all AI models once at startup, clean up on shutdown."""
    global analyzer, chatbot

    logger.info("🚀 Starting AI Microservice — Loading models...")
    start = time.time()

    analyzer = SkinAnalyzer()
    logger.info("✅ SkinAnalyzer loaded.")

    # Load chatbot (CSV may be missing in some environments — graceful fallback)
    if os.path.exists(_CHATBOT_CSV):
        chatbot = ChatbotEngine(_CHATBOT_CSV)
        logger.info("✅ ChatbotEngine loaded.")
    else:
        logger.warning(f"⚠️  Chatbot CSV not found at {_CHATBOT_CSV}. /chat endpoint will be unavailable.")

    elapsed = time.time() - start
    logger.info(f"✅ All models loaded in {elapsed:.2f}s. Ready to serve.")
    yield

    # Cleanup
    logger.info("🛑 Shutting down AI Microservice.")
    analyzer = None
    chatbot = None


app = FastAPI(
    title="TirTir AI Service",
    version="2.0.0",
    lifespan=lifespan
)

# CORS — allow Node.js backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5001", "http://127.0.0.1:5001", "http://backend:5001"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ─── Request / Response Models ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    image_base64: str


class AnalyzeResponse(BaseModel):
    success: bool
    data: dict | None = None
    error: str | None = None
    processing_time_ms: float | None = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    success: bool
    data: dict | None = None   # contains: intent, message, type, product data
    error: str | None = None
    processing_time_ms: float | None = None


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "skin_analyzer_loaded": analyzer is not None,
        "chatbot_loaded": chatbot is not None,
        "service": "TirTir AI Service v2",
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_skin(request: AnalyzeRequest):
    """
    Analyze skin from a base64-encoded image.
    Returns skin tone, undertone, concerns, and confidence.
    """
    if analyzer is None:
        raise HTTPException(status_code=503, detail="AI model not loaded yet")

    start = time.time()

    image = analyzer.decode_base64_image(request.image_base64)
    if image is None:
        return AnalyzeResponse(
            success=False,
            error="Failed to decode image. Please send a valid base64 JPEG/PNG."
        )

    try:
        result = analyzer.analyze(image)
    except Exception as e:
        logger.exception("Skin analysis failed")
        return AnalyzeResponse(success=False, error=str(e))

    elapsed_ms = (time.time() - start) * 1000

    if "error" in result:
        return AnalyzeResponse(
            success=False,
            error=result["error"],
            processing_time_ms=round(elapsed_ms, 2)
        )

    return AnalyzeResponse(
        success=True,
        data=result,
        processing_time_ms=round(elapsed_ms, 2)
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a Vietnamese beauty query and return a structured bot response.
    Model is loaded at startup — sub-millisecond inference, no spawn overhead.
    """
    if chatbot is None:
        raise HTTPException(
            status_code=503,
            detail="Chatbot model not available. Ensure chatbot_products.csv exists in the ai-service directory."
        )

    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="message field is required and cannot be empty")

    start = time.time()
    try:
        result = chatbot.process(request.message.strip())
    except Exception as e:
        logger.exception("Chatbot processing failed")
        return ChatResponse(success=False, error=str(e))

    elapsed_ms = (time.time() - start) * 1000
    return ChatResponse(
        success=True,
        data=result,
        processing_time_ms=round(elapsed_ms, 2)
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
