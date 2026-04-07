from __future__ import annotations

from pathlib import Path

from bot.config import DATA_DIR
from bot.models import Influencer
from bot.providers.base import InfluencerProvider
from bot.storage import JsonStore


CATALOG_PATH = DATA_DIR / "influencer_catalog.json"


class MockInfluencerProvider(InfluencerProvider):
    def __init__(self, catalog_path: Path = CATALOG_PATH) -> None:
        self.store = JsonStore(catalog_path, default=[])

    def search(self, niche: str) -> list[Influencer]:
        needle = niche.strip().lower()
        records = self.store.read()
        matches = []

        for record in records:
            haystack = " ".join(
                [
                    record.get("niche", ""),
                    " ".join(record.get("tags", [])),
                    record.get("username", ""),
                ]
            ).lower()
            if needle in haystack:
                matches.append(Influencer.model_validate(record))

        matches.sort(key=lambda item: item.followers_count, reverse=True)
        return matches

