from __future__ import annotations

from pathlib import Path

from bot.config import DATA_DIR
from bot.models import Influencer
from bot.providers.base import InfluencerProvider
from bot.services.scoring_service import ScoringService
from bot.storage import JsonStore


INFLUENCERS_PATH = DATA_DIR / "influencers.json"


class SearchService:
    def __init__(
        self,
        provider: InfluencerProvider,
        results_path: Path = INFLUENCERS_PATH,
        scorer: ScoringService | None = None,
    ) -> None:
        self.provider = provider
        self.store = JsonStore(results_path, default=[])
        self.scorer = scorer or ScoringService()

    def search(self, niche: str) -> list[Influencer]:
        results = self.provider.search(niche)
        return self.replace_results(results, query=niche)

    def list_results(self) -> list[Influencer]:
        items = [Influencer.model_validate(item) for item in self.store.read()]
        return self.scorer.prepare_results(items)

    def replace_results(
        self,
        results: list[Influencer],
        query: str | None = None,
    ) -> list[Influencer]:
        prepared_results = self.scorer.prepare_results(results, query=query)
        self.store.write(
            [result.model_dump(mode="json") for result in prepared_results]
        )
        return prepared_results
