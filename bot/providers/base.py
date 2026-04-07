from __future__ import annotations

from abc import ABC, abstractmethod

from bot.models import Influencer


class InfluencerProvider(ABC):
    @abstractmethod
    def search(self, niche: str) -> list[Influencer]:
        """Return discovery results for the requested niche."""

