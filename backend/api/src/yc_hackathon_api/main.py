import asyncio
import json
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from yc_hackathon_ai_core import InspectionResult, inspect_sneaker
from yc_hackathon_shared import get_logger, get_settings

from yc_hackathon_api.database import init_db
from yc_hackathon_api.db import (
    create_session,
    get_detail_image_path,
    get_detail_point_ids,
    get_original_image_path,
    get_session,
    save_detail_image,
    save_identified_shoe,
    save_result,
)

logger = get_logger("api")

app = FastAPI(title="YC Hackathon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[4]
INSPECTION_MD_PATH = PROJECT_ROOT / "data" / "inspection" / "sop.md"


def _load_inspection_md() -> str:
    return INSPECTION_MD_PATH.read_text(encoding="utf-8")


class CreateSessionResponse(BaseModel):
    session_id: str


class SessionResponse(BaseModel):
    id: str
    mime_type: str
    identified_shoe: str | None
    result: InspectionResult | None
    created_at: str


class IdentifyResponse(BaseModel):
    name: str


class DetailStatusResponse(BaseModel):
    uploaded_point_ids: list[int]


class DetailUploadResponse(BaseModel):
    point_id: int
    status: str


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    settings = get_settings()
    logger.info("=== API server starting ===")
    logger.info("PROJECT_ROOT: %s", PROJECT_ROOT)
    logger.info("INSPECTION_MD_PATH: %s (exists=%s)", INSPECTION_MD_PATH, INSPECTION_MD_PATH.exists())
    logger.info("GEMINI_API_KEY configured: %s", bool(settings.GEMINI_API_KEY))


# --- Sessions ---


@app.post("/api/sessions")
async def api_create_session(image: UploadFile) -> CreateSessionResponse:
    logger.info("--- POST /api/sessions ---")
    logger.info("filename=%s, content_type=%s", image.filename, image.content_type)

    image_bytes = await image.read()
    logger.info("image size: %d bytes (%.1f KB)", len(image_bytes), len(image_bytes) / 1024)

    mime = image.content_type or "image/jpeg"
    session_id = await asyncio.to_thread(create_session, image_bytes, mime)

    return CreateSessionResponse(session_id=session_id)


@app.get("/api/sessions/{session_id}")
async def api_get_session(session_id: str) -> SessionResponse:
    logger.debug("GET /api/sessions/%s", session_id)
    session = await asyncio.to_thread(get_session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = None
    if session["result"]:
        result = InspectionResult(**session["result"])

    return SessionResponse(
        id=session["id"],
        mime_type=session["mime_type"],
        identified_shoe=session["identified_shoe"],
        result=result,
        created_at=session["created_at"],
    )


@app.get("/api/sessions/{session_id}/image")
async def api_get_session_image(session_id: str) -> FileResponse:
    path = await asyncio.to_thread(get_original_image_path, session_id)
    if not path:
        raise HTTPException(status_code=404, detail="Image not found")

    session = await asyncio.to_thread(get_session, session_id)
    return FileResponse(path, media_type=session["mime_type"] if session else "image/jpeg")


# --- Identify (mock) ---


@app.post("/api/sessions/{session_id}/identify")
async def api_identify_shoe(session_id: str) -> IdentifyResponse:
    logger.info("--- POST /api/sessions/%s/identify ---", session_id)

    session = await asyncio.to_thread(get_session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Mock: simulate AI identification with a short delay
    await asyncio.sleep(2)
    shoe_name = "Nike Air Max SC"

    await asyncio.to_thread(save_identified_shoe, session_id, shoe_name)
    logger.info("shoe identified (mock): %s", shoe_name)
    return IdentifyResponse(name=shoe_name)


# --- Inspect ---


@app.post("/api/sessions/{session_id}/inspect")
async def api_run_inspect(session_id: str) -> InspectionResult:
    request_start = time.monotonic()
    logger.info("--- POST /api/sessions/%s/inspect ---", session_id)

    session = await asyncio.to_thread(get_session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    image_path = await asyncio.to_thread(get_original_image_path, session_id)
    if not image_path:
        raise HTTPException(status_code=404, detail="Image not found")

    image_bytes = image_path.read_bytes()
    settings = get_settings()
    inspection_md = _load_inspection_md()

    try:
        result = await inspect_sneaker(
            image_bytes=image_bytes,
            mime_type=session["mime_type"],
            inspection_md=inspection_md,
            api_key=settings.GEMINI_API_KEY,
        )
    except Exception:
        elapsed = time.monotonic() - request_start
        logger.exception("inspect failed after %.2fs", elapsed)
        raise

    result_json = json.dumps(result.model_dump(), ensure_ascii=False)
    await asyncio.to_thread(save_result, session_id, result_json)

    elapsed = time.monotonic() - request_start
    logger.info("inspect completed: %d points in %.2fs", len(result.points), elapsed)
    return result


# --- Detail images ---


@app.get("/api/sessions/{session_id}/details")
async def api_get_details(session_id: str) -> DetailStatusResponse:
    point_ids = await asyncio.to_thread(get_detail_point_ids, session_id)
    return DetailStatusResponse(uploaded_point_ids=point_ids)


@app.post("/api/sessions/{session_id}/details/{point_id}")
async def api_upload_detail(session_id: str, point_id: int, image: UploadFile) -> DetailUploadResponse:
    logger.info("--- POST /api/sessions/%s/details/%d ---", session_id, point_id)

    image_bytes = await image.read()
    mime = image.content_type or "image/jpeg"
    logger.info("detail image: %d bytes, mime=%s", len(image_bytes), mime)

    await asyncio.to_thread(save_detail_image, session_id, point_id, image_bytes, mime)
    return DetailUploadResponse(point_id=point_id, status="uploaded")


@app.get("/api/sessions/{session_id}/details/{point_id}/image")
async def api_get_detail_image(session_id: str, point_id: int) -> FileResponse:
    path = await asyncio.to_thread(get_detail_image_path, session_id, point_id)
    if not path:
        raise HTTPException(status_code=404, detail="Detail image not found")
    return FileResponse(path)
