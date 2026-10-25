#!/usr/bin/env bash
set -euo pipefail

SESSION="${1:?session required}"
ENGINE="${2:-${BROWSER_QA_ENGINE:-agent-browser}}"
TMP_ROOT="${TMPDIR:-/tmp}"
AGENT_BROWSER_HOME="${AGENT_BROWSER_HOME:-$HOME/.agent-browser}"

case "$ENGINE" in
  ego-lite)
    # A session name cannot authorize closing user pages or the whole app.
    printf 'ego_cleanup=requires_owned_taskspace_handle\n' >&2
    printf 'reason=finish_once_on_normal_completion_only\n' >&2
    exit 1
    ;;
  agent-browser|browser-use) ;;
  *)
    printf 'unsupported_cleanup_engine=%s\n' "$ENGINE" >&2
    exit 64
    ;;
esac

python3 - "$SESSION" "$ENGINE" "$TMP_ROOT" "$AGENT_BROWSER_HOME" <<'PY'
import os
import re
import shutil
import signal
import subprocess
import sys
import time
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
    *(agent_browser_home / f"{session}.{ext}" for ext in ("config", "engine", "target", "version")),
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

def start_identities():
    output = subprocess.check_output(["ps", "-axo", "pid=,ppid=,lstart=,command="], text=True)
    identities = {}
    for raw in output.splitlines():
        parts = raw.strip().split(None, 7)
        if len(parts) == 8 and parts[0].isdigit() and parts[2] in ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"):
            identities[int(parts[0])] = (" ".join(parts[2:7]), parts[7])
    return identities

initial_identities = start_identities()
# Capture owned profiles before graceful close removes the process records.
def extract_user_data_dir(command):
    match = re.search(r"--user-data-dir=(\"[^\"]+\"|'[^']+'|[^ ]+)", command)
    return match.group(1).strip("\"'") if match else None
owned_roots = agent_browser_roots if engine == "agent-browser" else browser_use_roots
owned_pids = set(owned_roots)
for root_pid in owned_roots:
    owned_pids.update(descendants(root_pid))
owned_profiles = {extract_user_data_dir(by_pid[pid]["command"]) for pid in owned_pids}
owned_profiles.discard(None)
close_error = False
try:
    closed = subprocess.run([engine, "--session", session, "close"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=8)
    close_error = closed.returncode != 0
except (OSError, subprocess.TimeoutExpired):
    close_error = True
kill_pids = set()
if engine in ("browser-use", "all"):
    for root_pid in browser_use_roots:
        kill_pids.add(root_pid)
        kill_pids.update(descendants(root_pid))

if engine in ("agent-browser", "all"):
    for root_pid in agent_browser_roots:
        kill_pids.add(root_pid)
        kill_pids.update(descendants(root_pid))

# TERM only an authenticated main browser, not its entire process tree.
kill_pids = {pid for pid in kill_pids if "--user-data-dir=" in by_pid[pid]["command"]}
# Only exact authenticated roots may receive TERM; never sweep other engines.
current_rows = subprocess.check_output(["ps", "-axo", "pid=,ppid=,command="], text=True)
current_commands = {}
for raw in current_rows.splitlines():
    parts = raw.strip().split(None, 2)
    if len(parts) == 3 and parts[0].isdigit():
        current_commands[int(parts[0])] = parts[2]
current_identities = start_identities() if kill_pids.intersection(current_commands) else {}
for pid in sorted(kill_pids, reverse=True):
    if (pid not in initial_identities or current_identities.get(pid) != initial_identities[pid]
            or current_commands.get(pid) != by_pid[pid]["command"]):
        continue
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass

time.sleep(0.15)
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

# A replacement PID must never authorize deletion of its data-dir, even if
# its command string is identical. Keep the historical profile on uncertainty.
latest_identities = start_identities() if owned_pids.intersection(row["pid"] for row in active_rows) else {}
replacement_profiles = set()
for pid in owned_pids:
    if pid in latest_identities and latest_identities.get(pid) != initial_identities.get(pid):
        value = extract_user_data_dir(by_pid[pid]["command"])
        if value:
            replacement_profiles.add(value)
removed_dirs = 0
for value in owned_profiles:
    child = Path(value)
    if value in replacement_profiles or child.is_symlink() or not child.is_relative_to(tmp_root) or str(child) in active_tmp_dirs:
        continue
    if child.exists():
        shutil.rmtree(child)
        removed_dirs += 1

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

metadata_error = False
if not final_session_root_pids:
    for runtime_file in session_runtime_files:
        try:
            runtime_file.unlink(missing_ok=True)
        except OSError:
            metadata_error = True

print(f"cleanup_engine={engine}")
print(f"agent_browser_session_residual_processes={agent_browser_session_residual}")
print(f"agent_browser_global_residual_processes={agent_browser_global_residual}")
print(f"browser_use_session_residual_processes={browser_use_session_residual}")
print(f"browser_use_global_residual_processes={browser_use_global_residual}")
print(f"playwright_mcp_residual_processes={playwright_mcp_residual}")
print(f"browser_residual_tmp_dirs={residual_tmp_dirs}")
print(f"browser_removed_tmp_dirs={removed_dirs}")
print(f"graceful_close_failed={int(close_error)}")
owned_profile_residual = sum(Path(value).exists() for value in owned_profiles)
print(f"owned_profile_residual_dirs={owned_profile_residual}")

exit_code = int(metadata_error or owned_profile_residual > 0)
if agent_browser_session_residual > 0:
    exit_code = 1
if browser_use_session_residual > 0:
    exit_code = 1


sys.exit(exit_code)
PY
