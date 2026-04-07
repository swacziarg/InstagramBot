from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel, Field


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
CONFIG_PATH = DATA_DIR / "config.json"


class LimitsConfig(BaseModel):
    searches_per_hour: int = 30
    manual_review_sessions_per_hour: int = 10


class QueueConfig(BaseModel):
    min_delay_seconds: int = 90
    max_delay_seconds: int = 240
    max_tasks_per_hour: int = 20


class BotConfig(BaseModel):
    limits: LimitsConfig = Field(default_factory=LimitsConfig)
    queue: QueueConfig = Field(default_factory=QueueConfig)


class ConfigService:
    def __init__(self, config_path: Path = CONFIG_PATH) -> None:
        self.config_path = config_path

    def load(self) -> BotConfig:
        if not self.config_path.exists():
            config = BotConfig()
            self.save(config)
            return config

        raw = json.loads(self.config_path.read_text(encoding="utf-8"))
        return BotConfig.model_validate(raw)

    def save(self, config: BotConfig) -> None:
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.config_path.write_text(
            json.dumps(config.model_dump(mode="json"), indent=2),
            encoding="utf-8",
        )

