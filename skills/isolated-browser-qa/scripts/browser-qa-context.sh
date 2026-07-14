#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="${1:-}"
PROFILE_MAP_FILE="${BROWSER_QA_PROFILE_MAP:-$HOME/.config/workflowhub/browser-qa-profiles.conf}"
ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"

case "$ENGINE" in
  agent-browser|browser-use) ;;
  *)
    printf 'unsupported_browser_qa_engine=%s\n' "$ENGINE" >&2
    printf 'supported_browser_qa_engines=agent-browser,browser-use\n' >&2
    exit 64
    ;;
esac

project_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
project_name="$(basename "$project_root")"

session_slug="$(
  printf '%s' "$project_name" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
)"

if [ -z "$session_slug" ]; then
  session_slug="project"
fi

host_name=""
if [ -n "$TARGET_URL" ]; then
  host_name="$(
    python3 - "$TARGET_URL" <<'PY'
import sys
from urllib.parse import urlparse

value = sys.argv[1]
parsed = urlparse(value if "://" in value else f"http://{value}")
print(parsed.hostname or "")
PY
  )"
fi

allowed_domains=""
case "$host_name" in
  localhost|127.0.0.1|::1)
    allowed_domains="localhost,127.0.0.1"
    ;;
  "")
    allowed_domains=""
    ;;
  *)
    allowed_domains="$host_name"
    ;;
esac

profile_name=""
profile_source=""
if [ -n "$host_name" ] && [ -f "$PROFILE_MAP_FILE" ]; then
  while IFS= read -r line; do
    case "$line" in
      ''|\#*) continue ;;
    esac

    pattern="${line%%[[:space:]]*}"
    profile="${line#"$pattern"}"
    profile="$(printf '%s' "$profile" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"

    if [ -n "$pattern" ] && [ -n "$profile" ] && [[ "$host_name" == $pattern ]]; then
      profile_name="$profile"
      profile_source="$PROFILE_MAP_FILE:$pattern"
      break
    fi
  done < "$PROFILE_MAP_FILE"
fi

printf 'export BROWSER_QA_SESSION=%q\n' "workflowhub-qa-$session_slug"
printf 'export BROWSER_QA_ENGINE=%q\n' "$ENGINE"
printf 'export BROWSER_QA_HOST=%q\n' "$host_name"
printf 'export BROWSER_QA_ALLOWED_DOMAINS=%q\n' "$allowed_domains"
printf 'export BROWSER_QA_AUTH_MODE=%q\n' "none"
printf 'export BROWSER_QA_PROFILE=%q\n' "$profile_name"
printf 'export BROWSER_QA_PROFILE_SOURCE=%q\n' "$profile_source"
