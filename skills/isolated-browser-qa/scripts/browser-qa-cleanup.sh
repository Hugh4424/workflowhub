#!/usr/bin/env bash
set -euo pipefail

SESSION="${1:?session required}"
ENGINE="${2:-${BROWSER_QA_ENGINE:-agent-browser}}"
TMP_ROOT="${TMPDIR:-/tmp}"
AGENT_BROWSER_HOME="${AGENT_BROWSER_HOME:-$HOME/.agent-browser}"

case "$ENGINE" in
  agent-browser|browser-use|all) ;;
  *)
    printf 'unsupported_cleanup_engine=%s\n' "$ENGINE" >&2
    exit 64
    ;;
esac

run_with_timeout() {
  local seconds="$1"
  shift

  "$@" >/dev/null 2>&1 &
  local pid="$!"
  local waited=0

  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$seconds" ]; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      return 124
    fi
    sleep 1
    waited=$((waited + 1))
  done

  wait "$pid" >/dev/null 2>&1 || true
}

if [ "$ENGINE" = "browser-use" ] || [ "$ENGINE" = "all" ]; then
  if command -v browser-use >/dev/null 2>&1; then
    run_with_timeout 8 browser-use --session "$SESSION" close || true
  fi
fi

sleep 1

if [ "$ENGINE" = "browser-use" ] || [ "$ENGINE" = "all" ]; then
  if command -v browser-use >/dev/null 2>&1; then
    run_with_timeout 8 browser-use --session "$SESSION" close || true
  fi
fi

python3 - "$SESSION" "$ENGINE" "$TMP_ROOT" "$AGENT_BROWSER_HOME" <<'PY'
import os
import re
import shutil
import signal
import subprocess
import sys
from pathlib import Path

session = sys.argv[1]
engine = sys.argv[2]
tmp_root = Path(sys.argv[3])
agent_browser_home = Path(sys.argv[4]).expanduser()
session_sock_file = agent_browser_home / f"{session}.sock"
session_runtime_files = (
    agent_browser_home / f"{session}.pid",
    agent_browser_home / f"{session}.sock",
    agent_browser_home / f"{session}.stream",
)

ps_output = subprocess.check_output(
    ["ps", "-axo", "pid=,ppid=,command="],
    text=True,
)

rows = []
for raw in ps_output.splitlines():
    raw = raw.strip()
    if not raw:
        continue
    parts = raw.split(None, 2)
    if len(parts) < 3:
        continue
    pid, ppid, command = int(parts[0]), int(parts[1]), parts[2]
    rows.append({"pid": pid, "ppid": ppid, "command": command})

by_pid = {row["pid"]: row for row in rows}
children = {}
for row in rows:
    children.setdefault(row["ppid"], []).append(row["pid"])


def is_agent_browser_command(command: str) -> bool:
    return bool(re.search(r"(^|[ /])agent-browser($|[ -])", command))


def lsof_pids_for_path(path: Path) -> set[int]:
    if not path.exists():
        return set()
    try:
        output = subprocess.check_output(
            ["lsof", "-t", str(path)],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.CalledProcessError):
        return set()
    return {int(line.strip()) for line in output.splitlines() if line.strip().isdigit()}

browser_use_roots = {
    row["pid"]
    for row in rows
    if re.search(rf"browser_use\.skill_cli\.(server|daemon) --session {re.escape(session)}(\s|$)", row["command"])
}

all_browser_use_roots = {
    row["pid"]
    for row in rows
    if "browser_use.skill_cli.server" in row["command"] or "browser_use.skill_cli.daemon" in row["command"]
}

playwright_mcp_roots = {
    row["pid"]
    for row in rows
    if "playwright-mcp" in row["command"] or "@playwright/mcp" in row["command"]
}

agent_browser_pid_file = agent_browser_home / f"{session}.pid"
agent_browser_roots = set()
if agent_browser_pid_file.exists():
    raw_pid = agent_browser_pid_file.read_text(errors="ignore").strip()
    if raw_pid.isdigit():
        pid = int(raw_pid)
        row = by_pid.get(pid)
        if row and is_agent_browser_command(row["command"]):
            agent_browser_roots.add(pid)

for pid in lsof_pids_for_path(session_sock_file):
    row = by_pid.get(pid)
    if row and is_agent_browser_command(row["command"]):
        agent_browser_roots.add(pid)

def descendants(root_pid: int) -> set[int]:
    stack = [root_pid]
    found = set()
    while stack:
        current = stack.pop()
        for child in children.get(current, []):
            if child not in found:
                found.add(child)
                stack.append(child)
    return found

kill_pids = set()
if engine in ("browser-use", "all"):
    for root_pid in browser_use_roots:
        kill_pids.add(root_pid)
        kill_pids.update(descendants(root_pid))

if engine in ("agent-browser", "all"):
    for root_pid in agent_browser_roots:
        kill_pids.add(root_pid)
        kill_pids.update(descendants(root_pid))

for root_pid in playwright_mcp_roots:
    kill_pids.add(root_pid)
    kill_pids.update(descendants(root_pid))

def has_browser_use_ancestor(pid: int) -> bool:
    current = by_pid.get(pid)
    while current:
        if current["pid"] in all_browser_use_roots:
            return True
        current = by_pid.get(current["ppid"])
    return False

if engine in ("browser-use", "all"):
    for row in rows:
        if "browser-use-user-data-dir-" in row["command"] and not has_browser_use_ancestor(row["pid"]):
            kill_pids.add(row["pid"])
            kill_pids.update(descendants(row["pid"]))

for pid in sorted(kill_pids, reverse=True):
    try:
        os.kill(pid, signal.SIGKILL)
    except OSError:
        pass

def extract_user_data_dir(command):
    match = re.search(r"--user-data-dir=(\"[^\"]+\"|'[^']+'|[^ ]+)", command)
    if not match:
        return None
    return match.group(1).strip("\"'")


active_ps_output = subprocess.check_output(
    ["ps", "-axo", "pid=,ppid=,command="],
    text=True,
)
active_rows = []
for raw in active_ps_output.splitlines():
    raw = raw.strip()
    if not raw:
        continue
    parts = raw.split(None, 2)
    if len(parts) < 3:
        continue
    pid, ppid, command = int(parts[0]), int(parts[1]), parts[2]
    active_rows.append({"pid": pid, "ppid": ppid, "command": command})

active_tmp_dirs = set()
for row in active_rows:
    user_data_dir = extract_user_data_dir(row["command"])
    if user_data_dir and Path(user_data_dir).exists():
        active_tmp_dirs.add(str(Path(user_data_dir)))

patterns = (
    "agent-browser-chrome-",
    "browser-use-user-data-dir-",
    "browser-use-downloads-",
    "playwright-artifacts-",
)

removed_dirs = 0
if tmp_root.exists():
    for child in tmp_root.iterdir():
        if not any(child.name.startswith(prefix) for prefix in patterns):
            continue
        if str(child) in active_tmp_dirs:
            continue
        try:
            if child.is_dir():
                shutil.rmtree(child, ignore_errors=True)
            else:
                child.unlink(missing_ok=True)
            removed_dirs += 1
        except OSError:
            pass

final_ps = subprocess.check_output(["ps", "-axo", "pid=,command="], text=True)
final_rows = []
excluded_pids = {os.getpid(), os.getppid()}
for raw in final_ps.splitlines():
    raw = raw.strip()
    if not raw:
        continue
    parts = raw.split(None, 1)
    if len(parts) < 2:
        continue
    pid, command = int(parts[0]), parts[1]
    if pid in excluded_pids:
        continue
    final_rows.append({"pid": pid, "command": command})

final_row_pids = {row["pid"] for row in final_rows}
final_session_root_pids = {
    pid for pid in lsof_pids_for_path(session_sock_file) if pid in final_row_pids
}

if agent_browser_pid_file.exists():
    raw_pid = agent_browser_pid_file.read_text(errors="ignore").strip()
    if raw_pid.isdigit():
        pid = int(raw_pid)
        row = next((item for item in final_rows if item["pid"] == pid), None)
        if row and is_agent_browser_command(row["command"]):
            final_session_root_pids.add(pid)

browser_use_session_residual = sum(
    1
    for row in final_rows
    if "browser_use.skill_cli" in row["command"] and f"--session {session}" in row["command"]
)

browser_use_global_residual = sum(
    1
    for row in final_rows
    if "browser_use.skill_cli" in row["command"] or "browser-use-user-data-dir-" in row["command"]
)

agent_browser_session_residual = sum(
    1
    for row in final_rows
    if row["pid"] in final_session_root_pids
)

agent_browser_global_residual = sum(
    1
    for row in final_rows
    if (
        is_agent_browser_command(row["command"])
        or "agent-browser-chrome-" in row["command"]
        or "Google Chrome for Testing" in row["command"]
    )
)

playwright_mcp_residual = sum(
    1
    for row in final_rows
    if "playwright-mcp" in row["command"] or "@playwright/mcp" in row["command"]
)

residual_tmp_dirs = 0
if tmp_root.exists():
    for child in tmp_root.iterdir():
        if any(child.name.startswith(prefix) for prefix in patterns):
            residual_tmp_dirs += 1

if not final_session_root_pids:
    for runtime_file in session_runtime_files:
        try:
            runtime_file.unlink(missing_ok=True)
        except OSError:
            pass

print(f"cleanup_engine={engine}")
print(f"agent_browser_session_residual_processes={agent_browser_session_residual}")
print(f"agent_browser_global_residual_processes={agent_browser_global_residual}")
print(f"browser_use_session_residual_processes={browser_use_session_residual}")
print(f"browser_use_global_residual_processes={browser_use_global_residual}")
print(f"playwright_mcp_residual_processes={playwright_mcp_residual}")
print(f"browser_residual_tmp_dirs={residual_tmp_dirs}")
print(f"browser_removed_tmp_dirs={removed_dirs}")

exit_code = 0
if agent_browser_session_residual > 0:
    exit_code = 1
if browser_use_session_residual > 0:
    exit_code = 1
if playwright_mcp_residual > 0:
    exit_code = 1

sys.exit(exit_code)
PY
