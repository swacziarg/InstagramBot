from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


class Influencer(BaseModel):
    username: str = Field(min_length=1)
    followers: str = Field(min_length=1)
    followers_count: int = Field(ge=0)
    profile_url: HttpUrl
    niche: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)
    engagement_rate: float | None = Field(default=None, ge=0, le=100)
    email: str | None = None
    source: str = "mock_catalog"


class SearchRequest(BaseModel):
    niche: str = Field(min_length=2, max_length=64)


class QueueActionType(str, Enum):
    review_profile = "review_profile"
    draft_outreach = "draft_outreach"
    manual_follow_up = "manual_follow_up"


class QueueTaskStatus(str, Enum):
    queued = "queued"
    ready = "ready"
    completed = "completed"


class QueueTask(BaseModel):
    id: str
    influencer_username: str
    action: QueueActionType
    scheduled_for: datetime
    delay_seconds: int = Field(ge=0)
    status: QueueTaskStatus = QueueTaskStatus.queued
    notes: str | None = None
    created_at: datetime


class QueueCreateRequest(BaseModel):
    usernames: list[str] = Field(min_length=1)
    action: QueueActionType
    notes: str | None = Field(default=None, max_length=200)


class QueueCompleteResponse(BaseModel):
    task: QueueTask
    message: str
