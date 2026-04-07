from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any


class JsonStore:
    def __init__(self, path: Path, default: Any) -> None:
        self.path = path
        self.default = default
        self.ensure_exists()

    def ensure_exists(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.write(deepcopy(self.default))

    def read(self) -> Any:
        self.ensure_exists()
        return json.loads(self.path.read_text(encoding="utf-8"))

    def write(self, payload: Any) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

