from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from bot.config import DATA_DIR, QueueConfig
from bot.models import QueueActionType, QueueTask, QueueTaskStatus
from bot.storage import JsonStore


QUEUE_PATH = DATA_DIR / "queue.json"


class QueueLimitExceededError(RuntimeError):
    pass


class QueueService:
    def __init__(self, queue_config: QueueConfig, queue_path: Path = QUEUE_PATH) -> None:
        self.queue_config = queue_config
        self.store = JsonStore(queue_path, default=[])

    def list_tasks(self) -> list[QueueTask]:
        tasks = [QueueTask.model_validate(item) for item in self.store.read()]
        changed = False
        now = datetime.now(timezone.utc)

        for task in tasks:
            if task.status == QueueTaskStatus.queued and task.scheduled_for <= now:
                task.status = QueueTaskStatus.ready
                changed = True

        if changed:
            self._save(tasks)

        return tasks

    def enqueue_tasks(
        self,
        usernames: list[str],
        action: QueueActionType,
        notes: str | None = None,
    ) -> list[QueueTask]:
        existing = self.list_tasks()
        self._enforce_hourly_limit(existing, len(usernames))

        cursor = datetime.now(timezone.utc)
        new_tasks: list[QueueTask] = []

        for username in usernames:
            delay_seconds = random.randint(
                self.queue_config.min_delay_seconds,
                self.queue_config.max_delay_seconds,
            )
            cursor += timedelta(seconds=delay_seconds)
            new_tasks.append(
                QueueTask(
                    id=str(uuid4()),
                    influencer_username=username,
                    action=action,
                    scheduled_for=cursor,
                    delay_seconds=delay_seconds,
                    notes=notes,
                    created_at=datetime.now(timezone.utc),
                )
            )

        all_tasks = existing + new_tasks
        self._save(all_tasks)
        return new_tasks

    def complete_task(self, task_id: str) -> QueueTask:
        tasks = self.list_tasks()
        updated_task: QueueTask | None = None

        for task in tasks:
            if task.id == task_id:
                task.status = QueueTaskStatus.completed
                updated_task = task
                break

        if updated_task is None:
            raise KeyError(task_id)

        self._save(tasks)
        return updated_task

    def _enforce_hourly_limit(self, tasks: list[QueueTask], requested_count: int) -> None:
        window_start = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_count = sum(1 for task in tasks if task.created_at >= window_start)
        projected = recent_count + requested_count
        if projected > self.queue_config.max_tasks_per_hour:
            raise QueueLimitExceededError(
                f"Queue limit exceeded: {projected} would be above "
                f"{self.queue_config.max_tasks_per_hour} tasks in the last hour."
            )

    def _save(self, tasks: list[QueueTask]) -> None:
        self.store.write([task.model_dump(mode="json") for task in tasks])

