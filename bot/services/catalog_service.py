from __future__ import annotations

import csv
import io
import re
from pathlib import Path

from pydantic import ValidationError

from bot.config import DATA_DIR
from bot.models import Influencer
from bot.storage import JsonStore


CATALOG_PATH = DATA_DIR / "influencer_catalog.json"
REQUIRED_COLUMNS = {"username", "followers", "niche", "engagement", "email"}


class CatalogImportError(ValueError):
    """Raised when a CSV catalog import cannot be completed."""


class CatalogService:
    def __init__(self, catalog_path: Path = CATALOG_PATH) -> None:
        self.store = JsonStore(catalog_path, default=[])

    def import_csv(self, csv_text: str) -> list[Influencer]:
        reader = csv.DictReader(io.StringIO(csv_text))
        if reader.fieldnames is None:
            raise CatalogImportError("CSV file is empty.")

        headers = {header.strip().lower() for header in reader.fieldnames if header}
        missing = sorted(REQUIRED_COLUMNS - headers)
        if missing:
            raise CatalogImportError(
                f"Missing required columns: {', '.join(missing)}."
            )

        imported: list[Influencer] = []
        seen_usernames: set[str] = set()

        for line_number, raw_row in enumerate(reader, start=2):
            row = self._normalize_row(raw_row)
            if not any(row.values()):
                continue

            influencer = self._build_influencer(row, line_number)
            username_key = influencer.username.casefold()
            if username_key in seen_usernames:
                raise CatalogImportError(
                    f"Duplicate username '{influencer.username}' on row {line_number}."
                )

            seen_usernames.add(username_key)
            imported.append(influencer)

        if not imported:
            raise CatalogImportError("CSV file did not contain any influencer rows.")

        self.store.write(
            [influencer.model_dump(mode="json") for influencer in imported]
        )
        return imported

    def _normalize_row(self, raw_row: dict[str | None, str | list[str] | None]) -> dict[str, str]:
        normalized: dict[str, str] = {}

        for key, value in raw_row.items():
            if key is None:
                continue

            if isinstance(value, list):
                normalized_value = " ".join(item.strip() for item in value if item)
            else:
                normalized_value = (value or "").strip()

            normalized[key.strip().lower()] = normalized_value

        return normalized

    def _build_influencer(
        self,
        row: dict[str, str],
        line_number: int,
    ) -> Influencer:
        username = self._require_text(row, "username", line_number)
        followers_raw = self._require_text(row, "followers", line_number)
        niche = self._require_text(row, "niche", line_number)

        followers_count = self._parse_followers(followers_raw, line_number)
        engagement_rate = self._parse_optional_percentage(
            row.get("engagement", ""),
            line_number,
        )
        email = row.get("email") or None
        profile_url = row.get("profile_url") or f"https://www.instagram.com/{username}/"
        tags = self._parse_tags(row.get("tags", ""), niche)
        source = row.get("source") or "csv_import"

        try:
            return Influencer(
                username=username,
                followers=self._format_followers(followers_count),
                followers_count=followers_count,
                profile_url=profile_url,
                niche=niche,
                tags=tags,
                engagement_rate=engagement_rate,
                email=email,
                source=source,
            )
        except ValidationError as exc:
            error = exc.errors()[0]
            field_name = ".".join(str(segment) for segment in error.get("loc", []))
            raise CatalogImportError(
                f"Row {line_number} has an invalid {field_name}: {error['msg']}."
            ) from exc

    def _require_text(
        self,
        row: dict[str, str],
        field_name: str,
        line_number: int,
    ) -> str:
        value = row.get(field_name, "").strip()
        if value:
            return value

        raise CatalogImportError(
            f"Row {line_number} is missing a value for '{field_name}'."
        )

    def _parse_followers(self, raw_value: str, line_number: int) -> int:
        cleaned = raw_value.strip().lower().replace(",", "").replace("_", "")
        if not cleaned:
            raise CatalogImportError(f"Row {line_number} is missing 'followers'.")

        multiplier = 1
        if cleaned.endswith("k"):
            multiplier = 1_000
            cleaned = cleaned[:-1]
        elif cleaned.endswith("m"):
            multiplier = 1_000_000
            cleaned = cleaned[:-1]
        elif cleaned.endswith("b"):
            multiplier = 1_000_000_000
            cleaned = cleaned[:-1]

        try:
            followers_count = int(float(cleaned) * multiplier)
        except ValueError as exc:
            raise CatalogImportError(
                f"Row {line_number} has an invalid followers value: '{raw_value}'."
            ) from exc

        if followers_count < 0:
            raise CatalogImportError(
                f"Row {line_number} has an invalid followers value: '{raw_value}'."
            )

        return followers_count

    def _parse_optional_percentage(
        self,
        raw_value: str,
        line_number: int,
    ) -> float | None:
        cleaned = raw_value.strip().replace("%", "")
        if not cleaned:
            return None

        try:
            value = float(cleaned)
        except ValueError as exc:
            raise CatalogImportError(
                f"Row {line_number} has an invalid engagement value: '{raw_value}'."
            ) from exc

        if value < 0 or value > 100:
            raise CatalogImportError(
                f"Row {line_number} has an out-of-range engagement value: '{raw_value}'."
            )

        return value

    def _parse_tags(self, raw_value: str, niche: str) -> list[str]:
        raw_tags = [segment.strip() for segment in re.split(r"[|;]", raw_value) if segment]
        tags = [niche, *raw_tags]

        deduped_tags: list[str] = []
        seen: set[str] = set()
        for tag in tags:
            normalized = tag.casefold()
            if normalized not in seen:
                deduped_tags.append(tag)
                seen.add(normalized)

        return deduped_tags

    def _format_followers(self, value: int) -> str:
        if value >= 1_000_000:
            return self._format_compact(value / 1_000_000, "M")
        if value >= 1_000:
            return self._format_compact(value / 1_000, "K")
        return str(value)

    def _format_compact(self, value: float, suffix: str) -> str:
        rounded = f"{value:.1f}".rstrip("0").rstrip(".")
        return f"{rounded}{suffix}"
