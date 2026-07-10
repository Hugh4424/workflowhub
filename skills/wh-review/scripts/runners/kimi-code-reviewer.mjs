#!/usr/bin/env node
import { createHash } from "node:crypto";
import { realpathSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const arg = (name) => process.argv.slice(2).find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) || "";
const diff = arg("diff"), output = arg("output");
if (!diff || !output) process.exit(2);
const payload = JSON.parse(readFileSync(diff, "utf8"));
const host = process.env.WH_REVIEW_HOST_AGENT || "codex";
const sameFamily = /^(kimi|kimi-code|moonshot|moonshot-ai)$/i.test(host);
const failure = (reason, extra = {}) => ({ verdict:"escalate_to_human", findings:[], resolutionSummary:reason, actual_mode:"not_executed", provider:"kimi-code", provider_cli:"kimi", source_family:"moonshot-ai", host, trueCrossEngine:false, synthetic:true, execution_status:"failed", failure_reason:reason, ...extra });
const atomic = (value) => { const tmp = `${output}.${process.pid}.tmp`; writeFileSync(tmp, JSON.stringify(value, null, 2), { mode:0o600 }); renameSync(tmp, output); };
if (sameFamily) { atomic(failure("same-source-family")); process.exit(0); }
const configured = process.env.KIMI_CODE_BIN || "kimi";
let binary = configured;
if (configured.includes("/")) {
  try { binary = realpathSync(resolve(configured)); const st = statSync(binary); if (!st.isFile() || (st.mode & 0o022)) throw new Error(); }
  catch { atomic(failure("kimi-code-binary-untrusted")); process.exit(0); }
}
const schema = `Return exactly one JSON object with keys verdict (pass|revise_required|escalate_to_human), findings (array of {severity,file,line,issue,recommendation}), resolutionSummary, skillResults. No markdown.`;
const prompt = `You are Kimi Code acting as a heterologous reviewer. ${schema}\n\nREVIEW CONTRACT:\n${payload.contract || ""}\n\nMATERIALS:\n${payload.materials || ""}`;
const timeoutMs = Math.max(1000, Number(process.env.KIMI_CODE_REVIEW_TIMEOUT_MS || 600000));
const maxBytes = Math.max(4096, Number(process.env.KIMI_CODE_REVIEW_MAX_BYTES || 8 * 1024 * 1024));
let stdout = "", stderrBytes = 0, timedOut = false, spawnError = null;
const child = spawn(binary, ["--print", "--input-format", "text", "--output-format", "stream-json"], { shell:false, detached:true, cwd:dirname(diff), stdio:["pipe","pipe","pipe"] });
const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGTERM"); } catch {} setTimeout(() => { try { process.kill(-child.pid, "SIGKILL"); } catch {} }, 1000).unref(); }, timeoutMs);
child.on("error", (e) => { spawnError = e; });
child.stdout.on("data", (b) => { if (Buffer.byteLength(stdout) < maxBytes) stdout += b.toString("utf8").slice(0, maxBytes - Buffer.byteLength(stdout)); });
child.stderr.on("data", (b) => { stderrBytes += b.length; });
child.stdin.end(prompt);
const terminal = await new Promise((r) => child.on("close", (code, signal) => r({code,signal})));
clearTimeout(timer);
if (timedOut) { atomic(failure("kimi-code-timeout", { stderr_summary:{bytes:stderrBytes} })); process.exit(0); }
if (spawnError || terminal.code !== 0) { atomic(failure("kimi-code-non-zero-exit", { exit_status:terminal.code, stderr_summary:{bytes:stderrBytes} })); process.exit(0); }
function jsonCandidates(text) {
  const out=[]; for (const raw of text.split(/\r?\n/)) { let e; try { e=JSON.parse(raw); } catch { continue; }
    const values=[e?.content,e?.message?.content,e?.delta?.content,e?.result];
    for (const v of values) if (typeof v === "string") out.push(v);
  } return out;
}
function extract(text) {
  const clean=text.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  try { return JSON.parse(clean); } catch {}
  for (let i=0;i<clean.length;i++) if (clean[i]==="{") { let d=0,s=false,e=false; for(let j=i;j<clean.length;j++){const c=clean[j]; if(e){e=false;continue;} if(c==="\\"&&s){e=true;continue;} if(c==='"'){s=!s;continue;} if(s)continue; if(c==="{")d++; if(c==="}"&&--d===0){try{return JSON.parse(clean.slice(i,j+1));}catch{} break;}} }
  return null;
}
const contents=jsonCandidates(stdout); const parsed=extract(contents.at(-1)||contents.join("")||stdout);
const valid = parsed && ["pass","revise_required","escalate_to_human"].includes(parsed.verdict) && Array.isArray(parsed.findings);
if (!valid) { atomic(failure("kimi-code-output-unparseable", { diagnostic_hash:createHash("sha256").update(stdout).digest("hex"), stderr_summary:{bytes:stderrBytes} })); process.exit(0); }
atomic({ ...parsed, actual_mode:payload.mode||"full", provider:"kimi-code", provider_cli:"kimi", source_family:"moonshot-ai", host, trueCrossEngine:true, synthetic:false, execution_status:"completed" });
