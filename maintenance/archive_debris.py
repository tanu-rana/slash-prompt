"""
Archive debris safely based on cleanup_config.json.

Atomic operations:
1) Validate manifest.json exists
2) Create _ARCHIVE_[timestamp] folder
3) Move configured targets into archive, preserving relative structure
4) Write restore_map.json (archive_path -> original_path)

This script DOES NOT delete; it only moves.
"""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


@dataclass(frozen=True)
class Config:
    project_root: Path
    archive_dir_prefix: str
    protected_files: List[str]
    targets: List[str]


def _load_config(config_path: Path) -> Config:
    data = json.loads(config_path.read_text(encoding="utf-8"))
    return Config(
        project_root=Path(data["project_root"]),
        archive_dir_prefix=str(data["archive_dir_prefix"]),
        protected_files=list(data.get("protected_files", [])),
        targets=list(data.get("targets", [])),
    )


def _is_protected(target: str, protected: Iterable[str]) -> bool:
    """
    Conservative protection:
    - Exact match
    - Target is inside a protected directory (e.g., node_modules/anything)
    """
    norm_target = target.replace("\\", "/").strip("/")
    for p in protected:
        norm_p = str(p).replace("\\", "/").strip("/")
        if not norm_p:
            continue
        if norm_target == norm_p:
            return True
        # If protected is a directory, protect everything under it.
        if norm_target.startswith(norm_p + "/"):
            return True
    return False


def _timestamp() -> str:
    # Example: 20240203_1230
    return datetime.now().strftime("%Y%m%d_%H%M")


def _ensure_manifest_exists(project_root: Path) -> None:
    manifest = project_root / "manifest.json"
    if not manifest.exists():
        raise SystemExit(f"Safety check failed: missing {manifest}")


def _resolve_targets(project_root: Path, targets: List[str]) -> List[Path]:
    """
    Resolve targets to actual filesystem paths.
    - A target can be a file or directory path relative to project_root.
    - If the target doesn't exist, it will be skipped later.
    """
    resolved: List[Path] = []
    for t in targets:
        t = str(t).strip()
        if not t:
            continue
        # treat as relative path; do not expand globs here (keeps config explicit)
        resolved.append(project_root / t)
    return resolved


def _move_one(project_root: Path, archive_root: Path, src_path: Path) -> Tuple[str, str] | None:
    """
    Move src_path into archive_root, preserving relative structure:
      project_root/foo/bar.txt -> archive_root/foo/bar.txt
    Returns (archive_rel, original_rel) if moved, otherwise None.
    """
    if not src_path.exists():
        return None

    src_rel = src_path.relative_to(project_root)
    dst_path = archive_root / src_rel
    dst_path.parent.mkdir(parents=True, exist_ok=True)

    # shutil.move works for both files and directories
    shutil.move(str(src_path), str(dst_path))

    return (src_rel.as_posix(), src_rel.as_posix())


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    config_path = repo_root / "cleanup_config.json"
    if not config_path.exists():
        raise SystemExit(f"Missing config: {config_path}")

    cfg = _load_config(config_path)
    project_root = (repo_root / cfg.project_root).resolve()

    _ensure_manifest_exists(project_root)

    archive_root = project_root / f"{cfg.archive_dir_prefix}_{_timestamp()}"
    archive_root.mkdir(parents=True, exist_ok=False)

    restore_map: Dict[str, str] = {}

    for src in _resolve_targets(project_root, cfg.targets):
        src_rel_str = src.relative_to(project_root).as_posix()
        if _is_protected(src_rel_str, cfg.protected_files):
            # Never move protected targets even if mistakenly listed.
            continue

        moved = _move_one(project_root, archive_root, src)
        if moved is None:
            continue

        archive_rel, original_rel = moved
        # Map uses archive-relative path to original-relative path.
        # Since we preserve structure, these are identical, but we keep the mapping explicit.
        restore_map[archive_rel] = original_rel

    (archive_root / "restore_map.json").write_text(
        json.dumps(restore_map, indent=2, sort_keys=True),
        encoding="utf-8",
    )

    print(f"Archive created: {archive_root.name}")
    print(f"Moved items: {len(restore_map)}")


if __name__ == "__main__":
    main()

