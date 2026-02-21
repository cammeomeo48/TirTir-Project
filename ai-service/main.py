"""
TirTir AI Microservice — FastAPI
Model is loaded ONCE at startup via lifespan event.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import time

from skin_analyzer import SkinAnalyzer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global reference to the analyzer — set during lifespan startup
analyzer: SkinAnalyzer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI models once at startup, clean up on shutdown."""
    global analyzer
    logger.info("🚀 Starting AI Microservice — Loading models...")
    start = time.time()
    analyzer = SkinAnalyzer()
    elapsed = time.time() - start
    logger.info(f"✅ Models loaded in {elapsed:.2f}s. Ready to serve requests.")
    yield
    # Cleanup
    logger.info("🛑 Shutting down AI Microservice.")
    analyzer = None


app = FastAPI(
    title="TirTir AI Skin Analysis Service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow Node.js backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5001", "http://127.0.0.1:5001"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# --- Request / Response Models ---

class AnalyzeRequest(BaseModel):
    image_base64: str  # Full base64 image (or cropped ROI patches in future)


class AnalyzeResponse(BaseModel):
    success: bool
    data: dict | None = None
    error: str | None = None
    processing_time_ms: float | None = None


# --- Endpoints ---

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": analyzer is not None,
        "service": "TirTir AI Skin Analysis"
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

    # 1. Decode image
    image = analyzer.decode_base64_image(request.image_base64)
    if image is None:
        return AnalyzeResponse(
            success=False,
            error="Failed to decode image. Please send a valid base64 JPEG/PNG."
        )

    # 2. Run analysis (model is already in memory — fast)
    try:
        result = analyzer.analyze(image)
    except Exception as e:
        logger.exception("Analysis failed")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
