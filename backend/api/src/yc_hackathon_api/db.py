"""Session management using SQLAlchemy ORM.

Sessions (image + inspection result) and detail images are managed via ORM + file storage.
Images: data/uploads/{session_id}/
Metadata: data/app.db
"""

import json
from pathlib import Path
from uuid import uuid4

from yc_hackathon_ai_core import DetailAnalysisResult
from yc_hackathon_shared import get_logger

from yc_hackathon_api.database import UPLOADS_DIR, SessionLocal
from yc_hackathon_api.models import DetailImageModel, PointAnalysisModel, SessionModel

logger = get_logger("api.db")

_MIME_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _session_dir(session_id: str) -> Path:
    d = UPLOADS_DIR / session_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _ext(mime_type: str) -> str:
    return _MIME_EXT.get(mime_type, ".jpg")


def create_session(image_bytes: bytes, mime_type: str) -> str:
    session_id = uuid4().hex[:12]
    ext = _ext(mime_type)

    img_path = _session_dir(session_id) / f"original{ext}"
    img_path.write_bytes(image_bytes)

    with SessionLocal() as db:
        db.add(SessionModel(id=session_id, mime_type=mime_type))
        db.commit()

    logger.info(
        "session created: id=%s, image=%s (%d bytes)",
        session_id,
        img_path.name,
        len(image_bytes),
    )
    return session_id


def list_sessions() -> list[dict]:
    with SessionLocal() as db:
        rows = db.query(SessionModel).order_by(SessionModel.created_at.desc()).all()
        return [
            {
                "id": r.id,
                "mime_type": r.mime_type,
                "identified_shoe": r.identified_shoe,
                "has_result": r.result_json is not None,
                "created_at": str(r.created_at),
            }
            for r in rows
        ]


def get_session(session_id: str) -> dict | None:
    with SessionLocal() as db:
        row = db.get(SessionModel, session_id)
        if not row:
            return None
        return {
            "id": row.id,
            "mime_type": row.mime_type,
            "identified_shoe": row.identified_shoe,
            "result": json.loads(row.result_json) if row.result_json else None,
            "created_at": str(row.created_at),
        }


def save_identified_shoe(session_id: str, shoe_name: str) -> None:
    with SessionLocal() as db:
        row = db.get(SessionModel, session_id)
        if row:
            row.identified_shoe = shoe_name
            db.commit()
    logger.info("identified shoe saved: session=%s, name=%s", session_id, shoe_name)


def save_result(session_id: str, result_json: str) -> None:
    with SessionLocal() as db:
        row = db.get(SessionModel, session_id)
        if row:
            row.result_json = result_json
            db.commit()
    logger.info("result saved for session %s", session_id)


def get_original_image_path(session_id: str) -> Path | None:
    d = UPLOADS_DIR / session_id
    if not d.exists():
        return None
    for f in d.iterdir():
        if f.stem == "original":
            return f
    return None


def save_detail_image(
    session_id: str,
    point_id: int,
    image_bytes: bytes,
    mime_type: str,
) -> None:
    ext = _ext(mime_type)
    img_path = _session_dir(session_id) / f"detail_{point_id}{ext}"
    img_path.write_bytes(image_bytes)

    with SessionLocal() as db:
        existing = db.get(DetailImageModel, (session_id, point_id))
        if existing:
            existing.mime_type = mime_type
        else:
            db.add(
                DetailImageModel(
                    session_id=session_id,
                    point_id=point_id,
                    mime_type=mime_type,
                ),
            )
        db.commit()
    logger.info(
        "detail image saved: session=%s, point=%d (%d bytes)",
        session_id,
        point_id,
        len(image_bytes),
    )


def get_detail_point_ids(session_id: str) -> list[int]:
    with SessionLocal() as db:
        rows = (
            db.query(DetailImageModel.point_id)
            .filter(DetailImageModel.session_id == session_id)
            .order_by(DetailImageModel.point_id)
            .all()
        )
        return [r[0] for r in rows]


def save_point_analysis(
    session_id: str,
    analysis: DetailAnalysisResult,
) -> None:
    with SessionLocal() as db:
        existing = db.get(
            PointAnalysisModel,
            (session_id, analysis.point_id),
        )
        if existing:
            existing.verdict = analysis.verdict
            existing.observation = analysis.observation
            existing.comparison = analysis.comparison
            existing.confidence = analysis.confidence
            existing.reasoning = analysis.reasoning
            existing.sop_reference = analysis.sop_reference
        else:
            db.add(
                PointAnalysisModel(
                    session_id=session_id,
                    point_id=analysis.point_id,
                    verdict=analysis.verdict,
                    observation=analysis.observation,
                    comparison=analysis.comparison,
                    confidence=analysis.confidence,
                    reasoning=analysis.reasoning,
                    sop_reference=analysis.sop_reference,
                ),
            )
        db.commit()
    logger.info(
        "analysis saved: session=%s, point=%d, verdict=%s",
        session_id,
        analysis.point_id,
        analysis.verdict,
    )


def get_point_analyses(session_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = (
            db.query(PointAnalysisModel)
            .filter(PointAnalysisModel.session_id == session_id)
            .order_by(PointAnalysisModel.point_id)
            .all()
        )
        return [
            {
                "point_id": r.point_id,
                "verdict": r.verdict,
                "observation": r.observation,
                "comparison": r.comparison,
                "confidence": r.confidence,
                "reasoning": r.reasoning,
                "sop_reference": r.sop_reference,
            }
            for r in rows
        ]


def get_detail_image_path(session_id: str, point_id: int) -> Path | None:
    d = UPLOADS_DIR / session_id
    if not d.exists():
        return None
    for f in d.iterdir():
        if f.stem == f"detail_{point_id}":
            return f
    return None
