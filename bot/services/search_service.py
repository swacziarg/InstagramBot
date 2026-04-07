from __future__ import annotations

from pathlib import Path

from bot.config import DATA_DIR
from bot.models import Influencer
from bot.providers.base import InfluencerProvider
from bot.storage import JsonStore


INFLUENCERS_PATH = DATA_DIR / "influencers.json"


class SearchService:
    def __init__(
        self,
        provider: InfluencerProvider,
        results_path: Path = INFLUENCERS_PATH,
    ) -> None:
        self.provider = provider
        self.store = JsonStore(results_path, default=[])

    def search(self, niche: str) -> list[Influencer]:
        results = self.provider.search(niche)
        self.replace_results(results)
        return results

    def list_results(self) -> list[Influencer]:
        return [Influencer.model_validate(item) for item in self.store.read()]

    def replace_results(self, results: list[Influencer]) -> None:
        self.store.write([result.model_dump(mode="json") for result in results])
