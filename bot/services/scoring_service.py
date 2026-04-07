from __future__ import annotations

import math
import re

from bot.models import Influencer


TOKEN_PATTERN = re.compile(r"[a-z0-9]+")


class ScoringService:
    def prepare_results(
        self,
        influencers: list[Influencer],
        query: str | None = None,
    ) -> list[Influencer]:
        scored_results = [
            influencer.model_copy(update={"score": self.score_influencer(influencer)})
            for influencer in influencers
        ]
        return sorted(
            scored_results,
            key=lambda influencer: self._sort_key(influencer, query=query),
        )

    def score_influencer(self, influencer: Influencer) -> float:
        total = (
            self._score_audience(influencer.followers_count)
            + self._score_engagement(influencer.engagement_rate)
            + self._score_completeness(influencer)
            + self._score_topic_fit(influencer)
        )
        return round(min(100.0, total), 1)

    def _sort_key(
        self,
        influencer: Influencer,
        query: str | None = None,
    ) -> tuple[float, float, float, int, int, str]:
        return (
            -self._query_relevance(influencer, query=query),
            -(influencer.score or 0),
            -(influencer.engagement_rate or -1),
            -influencer.followers_count,
            -len(influencer.tags),
            influencer.username.casefold(),
        )

    def _query_relevance(
        self,
        influencer: Influencer,
        query: str | None = None,
    ) -> float:
        normalized_query = (query or "").strip().casefold()
        if not normalized_query:
            return 0.0

        influencer_tokens = {
            token
            for token in self._tokenize(
                " ".join([influencer.niche, influencer.username, *influencer.tags])
            )
        }
        query_tokens = self._tokenize(normalized_query)
        matching_tokens = sum(
            1 for token in query_tokens if token in influencer_tokens
        )

        exact_tag_match = any(
            tag.casefold() == normalized_query for tag in influencer.tags
        )
        partial_tag_matches = sum(
            1 for tag in influencer.tags if normalized_query in tag.casefold()
        )

        relevance = 0.0
        if influencer.niche.casefold() == normalized_query:
            relevance += 30.0
        if exact_tag_match:
            relevance += 20.0
        relevance += min(20.0, matching_tokens * 8.0)
        relevance += min(12.0, partial_tag_matches * 4.0)
        if normalized_query in influencer.username.casefold():
            relevance += 6.0

        return relevance

    def _score_audience(self, followers_count: int) -> float:
        floor = 1_000
        ceiling = 1_000_000
        bounded = min(max(followers_count, floor), ceiling)
        normalized = (
            math.log10(bounded) - math.log10(floor)
        ) / (math.log10(ceiling) - math.log10(floor))
        return normalized * 40.0

    def _score_engagement(self, engagement_rate: float | None) -> float:
        if engagement_rate is None:
            return 10.0

        capped_rate = min(engagement_rate, 8.0)
        return 10.0 + (capped_rate / 8.0) * 20.0

    def _score_completeness(self, influencer: Influencer) -> float:
        score = 0.0
        if influencer.email:
            score += 12.0
        if influencer.profile_url:
            score += 4.0
        score += 4.0 if influencer.source != "mock_catalog" else 2.0
        return score

    def _score_topic_fit(self, influencer: Influencer) -> float:
        unique_tags = {
            tag.casefold().strip() for tag in influencer.tags if tag.strip()
        }
        extra_tags = unique_tags - {influencer.niche.casefold()}
        return 2.0 + min(8.0, len(extra_tags) * 3.0)

    def _tokenize(self, value: str) -> list[str]:
        return TOKEN_PATTERN.findall(value.casefold())
