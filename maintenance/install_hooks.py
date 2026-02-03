"""
Install git hooks for the Slash Prompt repository.

Current sentinel behavior:
- pre-commit: if any _QUARANTINE_* directory exists in the repo root,
  block the commit and remind the developer to resolve or restore
  quarantined files before committing.
"""

from __future__ import annotations

import os
from pathlib import Path


PRE_COMMIT_SCRIPT = """#!/bin/sh
# Sentinel pre-commit hook installed by maintenance/install_hooks.py
# Blocks commits when quarantined suspects exist.

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
if [ ! -d "$ROOT_DIR" ]; then
  exit 0
fi

cd "$ROOT_DIR" || exit 0

if ls _QUARANTINE_* >/dev/null 2>&1; then
  echo "❌ Commit blocked: quarantined files detected in _QUARANTINE_*."
  echo "   Review or restore suspects before committing."
  exit 1
fi

exit 0
"""


def install_pre_commit(repo_root: Path) -> None:
  git_dir = repo_root / ".git"
  hooks_dir = git_dir / "hooks"
  hooks_dir.mkdir(parents=True, exist_ok=True)

  hook_path = hooks_dir / "pre-commit"
  hook_path.write_text(PRE_COMMIT_SCRIPT, encoding="utf-8")
  os.chmod(hook_path, 0o755)


def main() -> None:
  repo_root = Path(__file__).resolve().parents[1]
  if not (repo_root / ".git").exists():
    raise SystemExit("Not a git repository (missing .git)")
  install_pre_commit(repo_root)
  print("pre-commit hook installed.")


if __name__ == "__main__":
  main()

