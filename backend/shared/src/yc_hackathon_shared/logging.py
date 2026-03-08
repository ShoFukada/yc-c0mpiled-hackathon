"""共通ロガー設定。

コンソール（INFO）+ ファイル（DEBUG）の2系統で出力する。
ログファイルは backend/logs/ 配下に日付ローテーションで保存。
"""

import logging
import sys
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

# backend/ ディレクトリ直下に logs/ を作る
_BACKEND_DIR = Path(__file__).resolve().parents[3]  # shared/src/yc_hackathon_shared/ → backend/
_LOG_DIR = _BACKEND_DIR / "logs"
_LOG_DIR.mkdir(exist_ok=True)

_LOG_FILE = _LOG_DIR / "app.log"
_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

_initialized = False


def _setup_root_logger() -> None:
    """ルートロガーにコンソール + ファイルハンドラを設定（初回のみ）。"""
    global _initialized  # noqa: PLW0603
    if _initialized:
        return
    _initialized = True

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)

    formatter = logging.Formatter(_LOG_FORMAT, datefmt=_LOG_DATE_FORMAT)

    # Console handler (INFO+)
    console = logging.StreamHandler(sys.stderr)
    console.setLevel(logging.INFO)
    console.setFormatter(formatter)
    root.addHandler(console)

    # ファイル: DEBUG以上、日次ローテーション（7日分保持）
    file_handler = TimedRotatingFileHandler(
        _LOG_FILE,
        when="midnight",
        backupCount=7,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """名前付きロガーを取得する。初回呼び出し時にルートロガーも設定される。"""
    _setup_root_logger()
    return logging.getLogger(name)
