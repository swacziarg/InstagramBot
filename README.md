# Influencer Research Dashboard

This repository contains a compliant research and manual outreach workspace built with:

- Python
- FastAPI
- Playwright
- React

It intentionally does **not** implement Instagram auto-login, cookie harvesting, auto-likes, auto-comments, auto-DMs, or detection-evasion behavior.

## What is included

- `/bot`: modular Python services, config loading, JSON storage, catalog-backed influencer search, and a Playwright manual review helper
- `/api`: FastAPI backend with search, CSV import, and queue endpoints
- `/ui`: React dashboard for niche search, result review, and manual task queueing
- `/data`: JSON-backed storage for config, catalog data, cached results, queue state, and future session metadata

## Run it

Backend:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

Frontend:

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173`.

## Import influencers from CSV

The fastest way to replace the starter dataset is to import a CSV from the dashboard or with the API.

Required columns:

```csv
username,followers,niche
fitnessguy,45000,fitness
```

Optional extra columns:

- `engagement` or `engagement_rate`
- `email`
- `profile_url`
- `tags` using `|` or `;` as separators
- `source`

The importer also accepts common header aliases such as `handle`, `followers_count`, and `category`.

API example:

```bash
curl -L -X POST http://127.0.0.1:8000/influencers/import \
  -F "file=@/absolute/path/to/influencers.csv"
```

Each import replaces both `data/influencer_catalog.json` and `data/influencers.json`.

## Manual review browser

You can open a manual Playwright review session with:

```bash
source .venv/bin/activate
python -m bot.browser https://example.com/fitwithmaya
```

## Notes

- Search results currently come from `data/influencer_catalog.json`.
- Queue pacing is configurable in `data/config.json`.
- If you need real platform integrations, use official APIs and platform-approved automation paths instead of browser-driven engagement actions.
