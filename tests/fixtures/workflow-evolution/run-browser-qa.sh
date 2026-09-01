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
server_pid=""
browser_cleanup_status=1
cleanup_browser() {
  local output status=0
  output="$(timeout 15 bash "$skill_dir/scripts/browser-qa-cleanup.sh" "${BROWSER_QA_SESSION:-workflowhub-m16}" agent-browser 2>&1)" || status=$?
  if [[ "$status" -eq 0 && "$output" == *"agent_browser_session_residual_processes=0"* ]]; then
    browser_cleanup_status=0
  else
    browser_cleanup_status=1
  fi
}
cleanup() {
  cleanup_browser
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$tmp_root"
}
trap cleanup EXIT
fixture_json="$(node tests/fixtures/workflow-evolution/setup-browser-fixture.mjs --root="$tmp_root")"
html_path="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).html)' "$fixture_json")"
data_path="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).data)' "$fixture_json")"
fixture_path="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).fixture)' "$fixture_json")"
eval "$(bash "$skill_dir/scripts/browser-qa-context.sh" "http://127.0.0.1:18765/workflowhub-monitor.html")"
bash "$skill_dir/scripts/browser-qa-doctor.sh" agent-browser >/dev/null
BROWSER_QA_SESSION="$(agent-browser session id --scope worktree --prefix m16-browser)"
export BROWSER_QA_SESSION
cleanup_browser
if [[ "$browser_cleanup_status" -ne 0 ]]; then
  printf '%s\n' '{"schema_version":"browser-qa-evidence.v1","status":"incomplete","reason":"preflight session cleanup left residual processes","engine":"agent-browser","login_reused":false,"cleanup":"incomplete"}' > "$manifest_dir/manifest.json"
  exit 21
fi
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
narrow_viewport_status=0
timeout 12 agent-browser --session "$BROWSER_QA_SESSION" set viewport 390 844 >/dev/null 2>&1 || narrow_viewport_status=$?
snapshot_narrow="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" snapshot 2>&1 || true)"
timeout 15 agent-browser --session "$BROWSER_QA_SESSION" screenshot body "$manifest_dir/m16-monitor-390x844.png" >"$tmp_root/screenshot-narrow.log" 2>&1 || narrow_viewport_status=$?
wide_viewport_status=0
timeout 12 agent-browser --session "$BROWSER_QA_SESSION" set viewport 1280 800 >/dev/null 2>&1 || wide_viewport_status=$?
snapshot_wide="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" snapshot 2>&1 || true)"
timeout 15 agent-browser --session "$BROWSER_QA_SESSION" screenshot body "$manifest_dir/m16-monitor-1280x800.png" >"$tmp_root/screenshot-wide.log" 2>&1 || wide_viewport_status=$?
errors="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" errors 2>&1 || true)"
requests="$(timeout 12 agent-browser --session "$BROWSER_QA_SESSION" network requests 2>&1 || true)"
cleanup_browser
server_cleanup_status=0
kill "$server_pid" 2>/dev/null || server_cleanup_status=$?
wait "$server_pid" 2>/dev/null || true
server_pid=""
if [[ ! -f "$manifest_dir/m16-monitor-390x844.png" || ! -f "$manifest_dir/m16-monitor-1280x800.png" ]]; then
  cleanup_value="incomplete"
  [[ "$browser_cleanup_status" -eq 0 && "$server_cleanup_status" -eq 0 ]] && cleanup_value="complete"
  node -e 'const fs=require("fs");const [out,narrow,wide,cleanup]=process.argv.slice(1);const value={schema_version:"browser-qa-evidence.v1",status:"incomplete",reason:`viewport screenshot evidence was not written (narrow_exit=${narrow}, wide_exit=${wide})`,engine:"agent-browser",login_reused:false,cleanup};fs.writeFileSync(out,JSON.stringify(value,null,2)+"\n")' -- "$manifest_dir/manifest.json" "$narrow_viewport_status" "$wide_viewport_status" "$cleanup_value"
  node tests/fixtures/workflow-evolution/validate-browser-manifest.mjs "$manifest_dir/manifest.json"
  exit $?
fi
node -e 'const fs=require("fs");const crypto=require("crypto");const [def,evo,narrow,wide,errs,reqs,open,click,narrowStatus,wideStatus,browserCleanup,serverCleanup,page,data,move,fixture,out]=process.argv.slice(1);const digest=v=>crypto.createHash("sha256").update(v).digest("hex");const hash=p=>digest(fs.readFileSync(p));const text=[def,evo,narrow,wide].join("\n");const expected=["Evolution","建议行动","仅供参考","前期质量税","不是质量裁决或 stage gate"];const checks={open:open==="0",evolution_tab:click==="0",content:expected.every((item)=>text.includes(item)),no_page_errors:errs.trim()===""||/no errors|No errors/i.test(errs),no_runtime_requests:!/(https?:\/\/(?!(127\.0\.0\.1|localhost)))/i.test(reqs),viewport_390x844:narrowStatus==="0"&&narrow.trim()!=="",viewport_1280x800:wideStatus==="0"&&wide.trim()!==""};const cleanup=browserCleanup==="0"&&serverCleanup==="0"?"complete":"incomplete";const status=cleanup!=="complete"?"incomplete":Object.values(checks).every(Boolean)?"passed":"qa_failed";const narrowRef="m16-monitor-390x844.png",wideRef="m16-monitor-1280x800.png",narrowSha=hash(require("path").join(require("path").dirname(out),narrowRef)),wideSha=hash(require("path").join(require("path").dirname(out),wideRef));const m={schema_version:"browser-qa-evidence.v1",status,engine:"agent-browser",login_reused:false,session:process.env.BROWSER_QA_SESSION,material_identity:{page_sha256:hash(page),data_sha256:hash(data),move_map_sha256:hash(move),fixture_sha256:hash(fixture)},assertions:[...expected,"evolution tab is reachable","390x844 and 1280x800 snapshots","no page errors","no external runtime network requests"],checks,viewports:[{width:390,height:844,evidence_ref:narrowRef,snapshot_sha256:narrowSha},{width:1280,height:800,evidence_ref:wideRef,snapshot_sha256:wideSha}],evidence:[{ref:narrowRef,sha256:narrowSha},{ref:wideRef,sha256:wideSha}],cleanup};fs.writeFileSync(out,JSON.stringify(m,null,2)+"\n")' -- "$snapshot_default" "$snapshot_evolution" "$snapshot_narrow" "$snapshot_wide" "$errors" "$requests" "$open_status" "$click_status" "$narrow_viewport_status" "$wide_viewport_status" "$browser_cleanup_status" "$server_cleanup_status" "$html_path" "$data_path" "docs/architecture/move-map.json" "$fixture_path" "$manifest_dir/manifest.json"
node tests/fixtures/workflow-evolution/validate-browser-manifest.mjs "$manifest_dir/manifest.json" --page="$html_path" --data="$data_path" --move-map="docs/architecture/move-map.json" --fixture="$fixture_path"
exit $?
