#!/usr/bin/env bash
set -euo pipefail

ENGINE="${1:-${BROWSER_QA_ENGINE:-agent-browser}}"

status=0

check_agent_browser() {
  if ! command -v agent-browser >/dev/null 2>&1; then
    echo "agent_browser=missing"
    return 1
  fi

  echo "agent_browser=$(command -v agent-browser)"
  local guide
  if guide="$(agent-browser skills get core --full 2>/dev/null)" && [[ "$guide" == *"# agent-browser core"* ]] && [[ "$guide" == *"## The core loop"* ]]; then
    echo "agent_browser_skill=ok"
  else
    echo "agent_browser_skill=failed"
    return 1
  fi
}

check_browser_use() {
  local python helper cli
  python="${BROWSER_QA_BROWSER_USE_PYTHON:-}"
  if [ -z "$python" ]; then
    if ! cli="$(command -v browser-use)"; then
      echo "browser_use_native_capability=unavailable"
      return 1
    fi
    echo "browser_use=$cli"
    IFS= read -r python < "$cli"
    if [[ "$python" != '#!'* || "$python" != *python* ]]; then
      echo "browser_use_native_capability=unavailable"
      return 1
    fi
    python="${python#\#!}"
  fi
  helper="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/browser-qa-browser-use.py"
  if "$python" "$helper" probe >/dev/null 2>&1; then
    echo "browser_use_native_capability=ok"
    echo "browser_use_check=dependencies_only"
  else
    echo "browser_use_native_capability=unavailable"
    return 1
  fi
}

case "$ENGINE" in
  ego-lite)
    if ! command -v ego-browser >/dev/null 2>&1; then
      printf 'ego_cli=missing\n' >&2
      status=1
    else
      printf 'ego_cli=%s\n' "$(command -v ego-browser)"
      printf 'ego_mode=existing_owned_taskspace\n'
      printf 'ego_storage=shared_profile\n'
      printf 'ego_check=dependencies_only_not_background_guarantee\n'
    fi
    ;;
  agent-browser)
    check_agent_browser || status=1
    ;;
  browser-use)
    check_browser_use || status=1
    ;;
  *)
    echo "unsupported_engine=$ENGINE"
    echo "supported_engines=agent-browser,browser-use"
    status=1
    ;;
esac

exit "$status"
