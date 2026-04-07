from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from bot.config import ConfigService
from bot.models import (
    QueueCompleteResponse,
    QueueCreateRequest,
    QueueStatusUpdateRequest,
    QueueStatusUpdateResponse,
    SearchRequest,
)
from bot.providers.mock_provider import MockInfluencerProvider
from bot.services.influencer_import_service import (
    InfluencerImportError,
    InfluencerImportService,
)
from bot.services.queue_service import QueueLimitExceededError, QueueService
from bot.services.search_service import SearchService


config_service = ConfigService()
config = config_service.load()
search_service = SearchService(provider=MockInfluencerProvider())
influencer_import_service = InfluencerImportService()
queue_service = QueueService(queue_config=config.queue)

app = FastAPI(
    title="Influencer Research Dashboard",
    version="0.1.0",
    description=(
        "A compliant research and manual outreach workspace. "
        "Instagram-specific action automation is intentionally not implemented."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/config")
def get_config() -> dict:
    return config.model_dump(mode="json")


@app.post("/search")
def search_influencers(payload: SearchRequest):
    results = search_service.search(payload.niche)
    return {"items": results, "count": len(results)}


@app.post("/influencers/import")
@app.post("/import-csv", include_in_schema=False)
async def import_influencers(file: UploadFile = File(...)):
    try:
        csv_text = (await file.read()).decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="CSV uploads must be UTF-8 encoded.",
        ) from exc

    try:
        items = influencer_import_service.import_csv(csv_text)
    except InfluencerImportError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"items": items, "count": len(items)}


@app.get("/influencers")
def list_influencers():
    items = search_service.list_results()
    return {"items": items, "count": len(items)}


@app.get("/queue")
def list_queue():
    tasks = queue_service.list_tasks()
    return {"items": tasks, "count": len(tasks)}


@app.post("/queue")
def create_queue_items(payload: QueueCreateRequest):
    try:
        tasks = queue_service.enqueue_tasks(
            usernames=payload.usernames,
            action=payload.action,
            notes=payload.notes,
        )
    except QueueLimitExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc

    return {"items": tasks, "count": len(tasks)}


@app.post("/queue/{task_id}/complete", response_model=QueueCompleteResponse)
def complete_queue_item(task_id: str):
    try:
        task = queue_service.complete_task(task_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Task not found.") from exc

    return QueueCompleteResponse(task=task, message="Task marked as completed.")


@app.patch("/queue/{task_id}/status", response_model=QueueStatusUpdateResponse)
def update_queue_item_status(task_id: str, payload: QueueStatusUpdateRequest):
    try:
        task = queue_service.update_task_status(task_id, payload.status)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Task not found.") from exc

    return QueueStatusUpdateResponse(
        task=task,
        message=f"Task moved to {payload.status.value}.",
    )
