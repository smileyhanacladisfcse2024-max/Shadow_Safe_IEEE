"""Pydantic-settings configuration for ShadowSafe backend."""
from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    grace_seconds: int = 5
    eval_interval_s: int = 10
    silent_checkin_s: int = 120
    checkin_timeout_s: int = 30
    demo_clock_start: str = "20:28"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
