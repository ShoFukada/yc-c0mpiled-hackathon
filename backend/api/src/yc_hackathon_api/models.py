"""SQLAlchemy ORM models."""

from sqlalchemy import ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class SessionModel(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    mime_type: Mapped[str] = mapped_column(String)
    identified_shoe: Mapped[str | None] = mapped_column(String, nullable=True)
    result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(
        String,
        server_default=func.datetime("now"),
    )

    detail_images: Mapped[list["DetailImageModel"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )


class DetailImageModel(Base):
    __tablename__ = "detail_images"

    session_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("sessions.id"),
        primary_key=True,
    )
    point_id: Mapped[int] = mapped_column(primary_key=True)
    mime_type: Mapped[str] = mapped_column(String)
    created_at: Mapped[str] = mapped_column(
        String,
        server_default=func.datetime("now"),
    )

    session: Mapped["SessionModel"] = relationship(back_populates="detail_images")


class PointAnalysisModel(Base):
    __tablename__ = "point_analyses"

    session_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("sessions.id"),
        primary_key=True,
    )
    point_id: Mapped[int] = mapped_column(primary_key=True)
    verdict: Mapped[str] = mapped_column(String)
    observation: Mapped[str] = mapped_column(Text)
    comparison: Mapped[str] = mapped_column(Text)
    confidence: Mapped[int] = mapped_column(Integer)
    reasoning: Mapped[str] = mapped_column(Text)
    sop_reference: Mapped[str] = mapped_column(String)
    created_at: Mapped[str] = mapped_column(
        String,
        server_default=func.datetime("now"),
    )
