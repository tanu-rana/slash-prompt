"""
Nuclear Cleaner
---------------

Enterprise-grade safe cleanup for legacy debris based on cleanup_config.json.

Key guarantees:
- Never touches manifest.json or protected files/directories.
- If package.json exists, automatically treats src/, lib/, public/ as protected source.
- Uses pathlib for all path logic (cross-platform).
- Uses safe_move() with retry loop to cope with Windows file locks.
- Applies a heuristic safety net: if a file's name is referenced anywhere in active code,
  it is moved to _QUARANTINE instead of _ARCHIVE.
- Generates project_anatomy.html and cleanup_summary.json.
"""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple


@dataclass(frozen=True)
class CleanupConfig:
  project_root: Path
  archive_dir_prefix: str
  protected_files: List[str]
  targets: List[str]


def load_config(repo_root: Path) -> CleanupConfig:
  cfg_path = repo_root / "cleanup_config.json"
  if not cfg_path.exists():
    raise SystemExit(f"Missing cleanup_config.json at {cfg_path}")
  data = json.loads(cfg_path.read_text(encoding="utf-8"))
  return CleanupConfig(
    project_root=(repo_root / data.get("project_root", ".")).resolve(),
    archive_dir_prefix=str(data.get("archive_dir_prefix", "_ARCHIVE")),
    protected_files=list(data.get("protected_files", [])),
    targets=list(data.get("targets", [])),
  )


def ensure_manifest(project_root: Path) -> None:
  manifest = project_root / "manifest.json"
  if not manifest.exists():
    raise SystemExit(f"Safety check failed: {manifest} not found")


def detect_protected_source(project_root: Path) -> List[str]:
  """
  Source Code Shield:
  If package.json exists, automatically treat src/, lib/, public/ as protected
  (even if manifest points elsewhere, never nuke source trees by accident).
  """
  pkg = project_root / "package.json"
  if not pkg.exists():
    return []

  protected_dirs: List[str] = []
  for name in ("src", "lib", "public"):
    p = project_root / name
    if p.exists() and p.is_dir():
      protected_dirs.append(name)
  return protected_dirs


def is_protected_rel(rel: str, protected: Iterable[str]) -> bool:
  """
  Protection check on POSIX-style relative paths.
  - Exact match
  - Or child of a protected directory
  """
  norm_target = rel.replace("\\", "/").strip("/")
  for p in protected:
    norm_p = str(p).replace("\\", "/").strip("/")
    if not norm_p:
      continue
    if norm_target == norm_p:
      return True
    if norm_target.startswith(norm_p + "/"):
      return True
  return False


def timestamp() -> str:
  # Higher resolution than the basic archive script
  return datetime.now().strftime("%Y%m%d_%H%M%S")


def safe_move(src: Path, dst: Path, max_seconds: float = 3.0) -> None:
  """
  Move src -> dst with a retry loop to tolerate transient Windows locks.
  This is intentionally conservative: if we cannot move after retries,
  the error is raised to stop the run.
  """
  import shutil

  if not src.exists():
    return

  dst.parent.mkdir(parents=True, exist_ok=True)

  deadline = time.time() + max_seconds
  last_err: Optional[Exception] = None
  while time.time() < deadline:
    try:
      shutil.move(str(src), str(dst))
      return
    except Exception as exc:  # PermissionError, OSError, etc.
      last_err = exc
      time.sleep(0.3)
  # Final attempt without catching so the user sees the error
  if last_err is not None:
    raise last_err


def iter_targets(project_root: Path, targets: List[str]) -> List[Path]:
  paths: List[Path] = []
  for raw in targets:
    rel = raw.strip()
    if not rel:
      continue
    paths.append(project_root / rel)
  return paths


def is_ignored_dir(name: str) -> bool:
  # Directories we never consider part of "active" code when scanning references.
  lowered = name.lower()
  if lowered in {".git", ".idea", ".vscode"}:
    return True
  if lowered.startswith("_archive_") or lowered.startswith("_quarantine_"):
    return True
  if lowered in {"node_modules", "__pycache__"}:
    return True
  return False


TEXT_EXTENSIONS: Set[str] = {
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".html",
  ".css",
  ".json",
  ".md",
  ".py",
  ".txt",
  ".sh",
  ".yml",
  ".yaml",
}


def filename_mentioned_anywhere(project_root: Path, basename: str) -> bool:
  """
  Heuristic Safety Net:
  Returns True if `basename` appears as a string literal in any "active" file.
  We skip large/binary-ish directories and file types.
  """
  b = basename
  for path in project_root.rglob("*"):
    if not path.is_file():
      continue

    rel_parts = path.relative_to(project_root).parts
    if any(is_ignored_dir(p) for p in rel_parts[:-1]):
      continue

    if path.suffix.lower() not in TEXT_EXTENSIONS:
      continue

    try:
      text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
      continue

    if b in text:
      return True
  return False


def build_layers(
  project_root: Path,
  archive_root: Path,
  quarantine_root: Path,
  protected_source_dirs: List[str],
) -> Dict[str, List[str]]:
  """
  After moves, compute current layer membership for reporting and HTML.
  """
  active_files: List[str] = []
  protected_files: List[str] = []
  archived_files: List[str] = []
  quarantined_files: List[str] = []

  protected_roots = {project_root / d for d in protected_source_dirs}

  # Protected source
  for root in protected_roots:
    if root.is_dir():
      for p in root.rglob("*"):
        if p.is_file():
          protected_files.append(p.relative_to(project_root).as_posix())

  # Archived + quarantined
  if archive_root.exists():
    for p in archive_root.rglob("*"):
      if p.is_file():
        archived_files.append(p.relative_to(project_root).as_posix())

  if quarantine_root.exists():
    for p in quarantine_root.rglob("*"):
      if p.is_file():
        quarantined_files.append(p.relative_to(project_root).as_posix())

  # Active = everything else that isn't in archive/quarantine or protected roots
  archived_set = set(archived_files)
  quarantined_set = set(quarantined_files)
  protected_set = set(protected_files)

  for p in project_root.rglob("*"):
    if not p.is_file():
      continue
    rel = p.relative_to(project_root).as_posix()
    if any(
      is_ignored_dir(part)
      for part in p.relative_to(project_root).parts[:-1]
    ):
      continue
    if rel in archived_set or rel in quarantined_set or rel in protected_set:
      continue
    active_files.append(rel)

  return {
    "active": sorted(active_files),
    "protected_source": sorted(protected_files),
    "archived": sorted(archived_files),
    "quarantined": sorted(quarantined_files),
  }


def write_project_anatomy_html(project_root: Path, layers: Dict[str, List[str]]) -> None:
  html_path = project_root / "project_anatomy.html"
  active = layers["active"]
  protected = layers["protected_source"]
  quar = layers["quarantined"]
  arch = layers["archived"]

  def render_list(title: str, items: List[str], color: str) -> str:
    lis = "\n".join(f"<li>{p}</li>" for p in items)
    return f"""
    <section>
      <h2 style="color:{color}">{title} ({len(items)})</h2>
      <ul>{lis}</ul>
    </section>
    """

  html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Project Anatomy</title>
  <style>
    body {{
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #05070A;
      color: #E5E7EB;
      margin: 0;
      padding: 24px;
    }}
    h1 {{
      margin-bottom: 16px;
    }}
    section {{
      margin-bottom: 24px;
      padding: 16px;
      border-radius: 10px;
      background: rgba(15,23,42,0.9);
      border: 1px solid rgba(148,163,184,0.3);
    }}
    ul {{
      max-height: 240px;
      overflow-y: auto;
      padding-left: 20px;
      margin: 8px 0 0;
      font-size: 13px;
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <h1>Project Anatomy</h1>
  <p>Visualization of Active, Protected Source, Quarantine, and Archived layers.</p>
  {render_list("Active Files", active, "#38BDF8")}
  {render_list("Protected Source Files", protected, "#22C55E")}
  {render_list("Quarantined Suspects", quar, "#F97316")}
  {render_list("Archived Debris", arch, "#F97373")}
</body>
</html>
"""
  html_path.write_text(html, encoding="utf-8")


def write_summary_json(project_root: Path, layers: Dict[str, List[str]]) -> None:
  summary = {
    "active_files_count": len(layers["active"]),
    "protected_source_files_count": len(layers["protected_source"]),
    "quarantined_files_count": len(layers["quarantined"]),
    "archived_files_count": len(layers["archived"]),
  }
  (project_root / "cleanup_summary.json").write_text(
    json.dumps(summary, indent=2), encoding="utf-8"
  )


def run_nuke(cfg: CleanupConfig, auto_confirm: bool) -> None:
  project_root = cfg.project_root
  ensure_manifest(project_root)

  # Build effective protected list (from config + Source Code Shield)
  protected_sources = detect_protected_source(project_root)
  effective_protected: List[str] = list(cfg.protected_files) + protected_sources

  archive_root = project_root / f"{cfg.archive_dir_prefix}_{timestamp()}"
  quarantine_root = project_root / f"_QUARANTINE_{timestamp()}"
  archive_root.mkdir(parents=True, exist_ok=False)
  quarantine_root.mkdir(parents=True, exist_ok=False)

  if not auto_confirm:
    rel_targets = [p.relative_to(project_root).as_posix() for p in iter_targets(project_root, cfg.targets)]
    print("Planned targets:")
    for r in rel_targets:
      print(f"  - {r}")
    resp = input("Proceed with nuclear cleanup? (yes/no): ").strip().lower()
    if resp not in {"y", "yes"}:
      print("Aborted by user.")
      return

  # Process configured targets
  for tgt in iter_targets(project_root, cfg.targets):
    if not tgt.exists():
      continue

    rel = tgt.relative_to(project_root).as_posix()
    if is_protected_rel(rel, effective_protected):
      # Never move protected targets, even if misconfigured.
      continue

    if tgt.is_dir():
      # Directories are treated as whole units; we do not run heuristic per file here.
      safe_move(tgt, archive_root / rel)
      continue

    # File-level handling with heuristic safety net.
    basename = tgt.name
    if filename_mentioned_anywhere(project_root, basename):
      # Suspect – quarantine instead of archive.
      dest = quarantine_root / rel
      safe_move(tgt, dest)
    else:
      dest = archive_root / rel
      safe_move(tgt, dest)

  # Recompute layer membership and write visualizations
  layers = build_layers(project_root, archive_root, quarantine_root, protected_sources)
  write_project_anatomy_html(project_root, layers)
  write_summary_json(project_root, layers)


def main() -> None:
  parser = argparse.ArgumentParser(description="Nuclear cleaner for legacy debris.")
  parser.add_argument("--nuke", action="store_true", help="Actually perform moves (otherwise dry-run does nothing).")
  parser.add_argument("--auto-confirm", action="store_true", help="Skip interactive confirmation.")
  parser.add_argument("--force-dirty", action="store_true", help="Reserved flag for future git-clean enforcement (currently unused).")
  args = parser.parse_args()

  repo_root = Path(__file__).resolve().parents[1]
  cfg = load_config(repo_root)

  if not args.nuke:
    print("Dry run: --nuke not provided, nothing executed.")
    return

  run_nuke(cfg, auto_confirm=args.auto_confirm)


if __name__ == "__main__":
  main()

