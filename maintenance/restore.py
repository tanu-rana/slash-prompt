"""
Restore the latest _ARCHIVE_[timestamp] archive created by archive_debris.py.

Operations:
1) Find latest archive directory in repo root matching prefix
2) Read restore_map.json inside it
3) Move everything back to original locations
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from typing import Dict, List, Tuple


ARCHIVE_DIR_PATTERN = re.compile(r"^_ARCHIVE_\d{8}_\d{4}$")


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _find_latest_archive(root: Path) -> Path:
    candidates: List[Path] = []
    for child in root.iterdir():
        if not child.is_dir():
            continue
        if ARCHIVE_DIR_PATTERN.match(child.name):
            candidates.append(child)

    if not candidates:
        raise SystemExit("No archive directories found (expected _ARCHIVE_YYYYMMDD_HHMM).")

    # Timestamp sortable lexicographically due to YYYYMMDD_HHMM format
    return sorted(candidates, key=lambda p: p.name)[-1]


def _load_restore_map(archive_dir: Path) -> Dict[str, str]:
    restore_map_path = archive_dir / "restore_map.json"
    if not restore_map_path.exists():
        raise SystemExit(f"Missing restore map: {restore_map_path}")
    return json.loads(restore_map_path.read_text(encoding="utf-8"))


def _move_back(project_root: Path, archive_dir: Path, archive_rel: str, original_rel: str) -> None:
    src = archive_dir / archive_rel
    dst = project_root / original_rel

    if not src.exists():
        # If archive is incomplete, skip; do not error.
        return

    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))


def main() -> None:
    root = _repo_root()
    archive_dir = _find_latest_archive(root)
    restore_map = _load_restore_map(archive_dir)

    # We restore deepest paths first to avoid parent-dir collisions.
    items: List[Tuple[str, str]] = sorted(
        restore_map.items(),
        key=lambda kv: kv[0].count("/"),
        reverse=True,
    )

    for archive_rel, original_rel in items:
        _move_back(root, archive_dir, archive_rel, original_rel)

    print(f"Restored from: {archive_dir.name}")
    print(f"Attempted restores: {len(items)}")


if __name__ == "__main__":
    main()

