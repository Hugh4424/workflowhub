#!/usr/bin/env bash
set -u
skill_dir="${SKILL_DIR:-/Users/Hugh/.codex/skills/isolated-browser-qa}"
evidence_root="${WORKFLOWHUB_TASK_ROOT:-$(pwd)}"
manifest_dir="$evidence_root/quality/evidence/browser-qa/m16-monitor"
mkdir -p "$manifest_dir"
if ! command -v agent-browser >/dev/null 2>&1; then
  printf '%s\n' '{"schema_version":"browser-qa-evidence.v1","status":"unavailable","reason":"agent-browser is not installed","engine":"agent-browser","login_reused":false,"cleanup":"complete"}' > "$manifest_dir/manifest.json"
  node tests/fixtures/workflow-evolution/validate-browser-manifest.mjs "$manifest_dir/manifest.json"
  exit $?
fi
tmp_root="$(mktemp -d -t workflowhub-m16-browser.XXXXXX)"
cleanup() {
  bash "$skill_dir/scripts/browser-qa-cleanup.sh" "${BROWSER_QA_SESSION:-workflowhub-m16}" agent-browser >/dev/null 2>&1 || true
  if [[ -f "$manifest_dir/manifest.json" ]]; then
    node -e 'const fs=require("fs");const p=process.argv[1];const v=JSON.parse(fs.readFileSync(p,"utf8"));v.cleanup="complete";fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n")' -- "$manifest_dir/manifest.json" || true
  fi
  rm -rf "$tmp_root"
}
trap cleanup EXIT
fixture_json="$(node tests/fixtures/workflow-evolution/setup-browser-fixture.mjs --root="$tmp_root")"
html_path="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).html)' "$fixture_json")"
eval "$(bash "$skill_dir/scripts/browser-qa-context.sh" "http://127.0.0.1:18765/workflowhub-monitor.html")"
bash "$skill_dir/scripts/browser-qa-doctor.sh" agent-browser >/dev/null
BROWSER_QA_SESSION="$(agent-browser session id --scope worktree --prefix m16-browser)"
export BROWSER_QA_SESSION
bash "$skill_dir/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" agent-browser >/dev/null 2>&1 || true
port=""
for candidate_port in 18765 18766 18767; do
  python3 -m http.server "$candidate_port" --directory "$(dirname "$html_path")" >"$tmp_root/server-$candidate_port.log" 2>&1 &
  server_pid=$!
  sleep 0.3
  if curl -fsS "http://127.0.0.1:$candidate_port/workflowhub-monitor.html" >/dev/null 2>&1; then port="$candidate_port"; break; fi
  kill "$server_pid" 2>/dev/null || true
done
if [[ -z "$port" ]]; then
  printf '%s\n' '{"schema_version":"browser-qa-evidence.v1","status":"incomplete","reason":"fixture server did not expose a port","engine":"agent-browser","login_reused":false}' > "$manifest_dir/manifest.json"
  exit 21
fi
open_status=0
timeout 12 agent-browser --session "$BROWSER_QA_SESSION" --allowed-domains "127.0.0.1,localhost" --content-boundaries open "http://127.0.0.1:$port/workflowhub-monitor.html" >/dev/null || open_status=$?
snapshot_default="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" snapshot 2>&1 || true)"
click_status=0
timeout 12 agent-browser --session "$BROWSER_QA_SESSION" click "#evolution-tab" >/dev/null 2>&1 || click_status=$?
snapshot_evolution="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" snapshot 2>&1 || true)"
timeout 12 agent-browser --session "$BROWSER_QA_SESSION" set viewport 390 844 >/dev/null 2>&1 || true
snapshot_narrow="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" snapshot 2>&1 || true)"
timeout 12 agent-browser --session "$BROWSER_QA_SESSION" set viewport 1280 800 >/dev/null 2>&1 || true
timeout 12 agent-browser --session "$BROWSER_QA_SESSION" screenshot "$manifest_dir/m16-monitor.png" >/dev/null 2>&1 || true
errors="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" errors 2>&1 || true)"
requests="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" network requests 2>&1 || true)"
node -e 'const fs=require("fs");const crypto=require("crypto");const [def,evo,narrow,errs,reqs,open,click]=process.argv.slice(1);const text=[def,evo,narrow].join("\n");const expected=["Evolution","建议行动","仅供参考","前期质量税","不是质量裁决或 stage gate"];const checks={open:open==="0",evolution_tab:click==="0",content:expected.every((item)=>text.includes(item)),no_page_errors:errs.trim()===""||/no errors|No errors/i.test(errs),no_runtime_requests:!/(https?:\/\/(?!(127\.0\.0\.1|localhost)))/i.test(reqs)};const status=Object.values(checks).every(Boolean)?"passed":"qa_failed";const m={schema_version:"browser-qa-evidence.v1",status,engine:"agent-browser",login_reused:false,session:process.env.BROWSER_QA_SESSION,snapshot_sha256:crypto.createHash("sha256").update(text).digest("hex"),assertions:[...expected,"evolution tab is reachable","390x844 and 1280x800 snapshots","no page errors","no external runtime network requests"],checks,evidence:["m16-monitor.png"],cleanup:"pending"};fs.writeFileSync(process.argv[8],JSON.stringify(m,null,2)+"\n")' -- "$snapshot_default" "$snapshot_evolution" "$snapshot_narrow" "$errors" "$requests" "$open_status" "$click_status" "$manifest_dir/manifest.json"
kill "$server_pid" 2>/dev/null || true
node tests/fixtures/workflow-evolution/validate-browser-manifest.mjs "$manifest_dir/manifest.json"
exit $?
