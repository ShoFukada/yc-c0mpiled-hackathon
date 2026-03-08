import time
from pathlib import Path

from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from yc_hackathon_ai_core import InspectionResult, inspect_sneaker
from yc_hackathon_shared import get_logger, get_settings

logger = get_logger("api")

app = FastAPI(title="YC Hackathon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# プロジェクトルートからの鑑定観点mdパス
PROJECT_ROOT = Path(__file__).resolve().parents[4]  # api/src/yc_hackathon_api/ → project root
INSPECTION_MD_PATH = PROJECT_ROOT / "data" / "inspection" / "sop.md"


def _load_inspection_md() -> str:
    return INSPECTION_MD_PATH.read_text(encoding="utf-8")


@app.on_event("startup")
async def on_startup() -> None:
    settings = get_settings()
    logger.info("=== API server starting ===")
    logger.info("PROJECT_ROOT: %s", PROJECT_ROOT)
    logger.info("INSPECTION_MD_PATH: %s (exists=%s)", INSPECTION_MD_PATH, INSPECTION_MD_PATH.exists())
    logger.info("GEMINI_API_KEY configured: %s", bool(settings.GEMINI_API_KEY))


@app.get("/api/hello")
def hello() -> dict:
    return {"message": "Hello from FastAPI!"}


@app.post("/api/inspect")
async def inspect(image: UploadFile) -> InspectionResult:
    request_start = time.monotonic()

    logger.info("--- /api/inspect request received ---")
    logger.info("filename=%s, content_type=%s", image.filename, image.content_type)

    image_bytes = await image.read()
    logger.info("image size: %d bytes (%.1f KB)", len(image_bytes), len(image_bytes) / 1024)

    settings = get_settings()
    inspection_md = _load_inspection_md()
    logger.debug("inspection_md loaded: %d chars", len(inspection_md))

    try:
        result = await inspect_sneaker(
            image_bytes=image_bytes,
            mime_type=image.content_type or "image/jpeg",
            inspection_md=inspection_md,
            api_key=settings.GEMINI_API_KEY,
        )
    except Exception:
        elapsed = time.monotonic() - request_start
        logger.exception("inspect_sneaker failed after %.2fs", elapsed)
        raise

    elapsed = time.monotonic() - request_start
    logger.info("inspect completed: %d points found in %.2fs", len(result.points), elapsed)
    for p in result.points:
        logger.debug(
            "  [%d] %s — bbox(x1=%.0f, y1=%.0f, x2=%.0f, y2=%.0f)",
            p.id,
            p.label,
            p.bbox.x1,
            p.bbox.y1,
            p.bbox.x2,
            p.bbox.y2,
        )

    return result
