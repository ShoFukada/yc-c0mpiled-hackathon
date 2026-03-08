"""Database engine and session factory."""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from yc_hackathon_shared import get_logger

logger = get_logger("api.database")

PROJECT_ROOT = Path(__file__).resolve().parents[4]
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "app.db"
UPLOADS_DIR = DATA_DIR / "uploads"

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine)


def init_db() -> None:
    """Ensure data directories exist. Schema is managed by Alembic."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("DB path: %s", DB_PATH)
