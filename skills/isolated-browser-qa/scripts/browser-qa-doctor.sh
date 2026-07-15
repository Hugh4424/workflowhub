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
  if agent-browser skills get agent-browser >/dev/null 2>&1; then
    echo "agent_browser_skill=ok"
  else
    echo "agent_browser_skill=failed"
    return 1
  fi
}

check_browser_use() {
  if ! command -v browser-use >/dev/null 2>&1; then
    echo "browser_use=missing"
    return 1
  fi

  echo "browser_use=$(command -v browser-use)"
  if browser-use doctor >/dev/null 2>&1; then
    echo "browser_use_doctor=ok"
  else
    echo "browser_use_doctor=failed"
    return 1
  fi
}

case "$ENGINE" in
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
