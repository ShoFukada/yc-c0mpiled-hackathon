from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def find_env_file() -> str | None:
    """プロジェクトルート(backend/)の.envファイルを再帰的に探す"""
    current_path: Path = Path(__file__).resolve()

    for parent in current_path.parents:
        env_file: Path = parent / ".env"
        if env_file.exists():
            return str(env_file)

    return None


class Settings(BaseSettings):
    """共通設定クラス

    pydantic-settingsの値解決の優先順位:
    1. 環境変数（最優先）
    2. .envファイル（存在する場合）
    3. デフォルト値
    """

    model_config = SettingsConfigDict(
        env_file=find_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    GEMINI_API_KEY: str = ""


@lru_cache
def get_settings() -> Settings:
    """設定を取得"""
    return Settings()
