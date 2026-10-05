import fs from "node:fs";
import path from "node:path";
import { invalid, nonempty, plan, publicOutputRewritePrompt } from "./shared.mjs";

const resumeHintPattern = /^To resume this session:\s*kimi\s+-r\s+([A-Za-z0-9_-]+)\s*$/i;

function assistantText(value) {
  if (typeof value === "string") return value.length ? value : null;
  if (!Array.isArray(value)) return null;
  const blocks = value.filter((block) => block && block.type === "text" && typeof block.text === "string").map((block) => block.text);
  return blocks.length ? blocks.join("\n") : null;
}

function attachmentAccessContract(cwd) {
  const candidate = path.join(cwd, "bundle");
  if (!fs.existsSync(candidate)) return "";
  let files;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(candidate, "attachments-manifest.json"), "utf8"));
    const bundleRoot = fs.realpathSync(candidate);
    files = [...new Set(manifest.files.map((item) => item?.target).filter((target) => typeof target === "string" && target.length > 0))]
      .map((target) => {
        const absolute = path.resolve(bundleRoot, target);
        const relative = path.relative(bundleRoot, absolute);
        if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return null;
        return { target, absolute: fs.realpathSync(absolute) };
      })
      .filter(Boolean)
      .filter(({ absolute }) => {
        const relative = path.relative(bundleRoot, absolute);
        return !relative.startsWith("..") && !path.isAbsolute(relative);
      });
  } catch { return ""; }
  if (!files.length) return "";
  const first = files.find(({ target }) => target === "review-instructions.md") ?? files.find(({ target }) => target === "review-packet.v1.json") ?? files[0];
  const logical = (target) => `bundle/${target}`;
  return [
    "Provider attachment access contract (host-generated):",
    "- Logical names below are the only names allowed in the public review response.",
    "- Read only these relative bundle paths with the Read tool; never create or reproduce absolute paths in the final response:",
    ...files.map(({ target }) => `  - ${JSON.stringify(logical(target))}`),
    `- First Read target: ${JSON.stringify(logical(first.target))}.`,
    "- Do not read any other path, parent directory, or the host-only attachment manifest; do not use shell, Git, or network.",
    "- The host already verified delivery integrity. Do not recompute or validate hashes.",
  ].join("\n");
}

function configuredModel(provider) {
  const model = nonempty(provider.model);
  if (!model) return null;
  // Kimi Code 0.40.x registers the local provider as kimi-for-coding. Keep
  // existing 3rd-review config files working without changing their tiers.
  return model.replace(/^kimi-code\//, "kimi-for-coding/");
}

function sessionFromItem(item) {
  if (item?.role !== "meta" || item?.type !== "session.resume_hint") return null;
  const session = nonempty(item.session_id ?? item.sessionId);
  return session && /^[A-Za-z0-9_-]+$/.test(session) ? session : null;
}

function parseAssistantItem(item) {
  if (item?.role !== "assistant") return null;
  return assistantText(item.content) ?? assistantText(item.message?.content) ?? assistantText(item.text) ?? assistantText(item.result);
}

function writePromptFile(cwd, contents) {
  const file = path.join(cwd, ".3rd-review-kimi-prompt.md");
  try {
    const existing = fs.lstatSync(file);
    if (existing.isSymbolicLink() || !existing.isFile()) throw new Error("Kimi prompt file is not a regular file");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  fs.writeFileSync(file, contents, { mode: 0o600 });
  fs.chmodSync(file, 0o600);
  return file;
}

function streamPlan(provider, cwd, prompt, session = null) {
  const bundle = path.join(cwd, "bundle");
  const hasBundle = fs.existsSync(bundle);
  const skills = hasBundle ? path.join(bundle, "skills") : path.join(cwd, "skills");
  const contract = attachmentAccessContract(cwd);
  const providerPrompt = contract ? `${contract}\n\n${prompt}` : prompt;
  writePromptFile(cwd, providerPrompt);
  const argv = ["--prompt", "Read .3rd-review-kimi-prompt.md with the Read tool first. Follow its complete review instruction and return only the requested final review.", "--output-format", "stream-json"];
  const model = configuredModel(provider);
  if (model) argv.push("--model", model);
  if (fs.existsSync(skills)) argv.push("--skills-dir", hasBundle ? "bundle/skills" : "skills");
  if (session) argv.push("--session", session);

  const state = { cursor: 0, session, expectedSession: session, protocolError: null };
  const terminalFailure = (message, code = "PROVIDER_OUTPUT_INVALID") => ({
    liveness: true,
    terminal: {
      state: "failed",
      session_id: state.session,
      cursor: state.cursor,
      wait_for_close: true,
      error: { code, message },
    },
  });
  const observeLine = (stream, line) => {
    state.cursor += 1;
    if (stream === "stderr") {
      const hinted = line.match(resumeHintPattern)?.[1] ?? null;
      if (hinted && state.expectedSession && hinted !== state.expectedSession) {
        state.protocolError = "Kimi changed the requested continuation session";
        return terminalFailure(state.protocolError, "PROVIDER_SESSION_MISMATCH");
      }
      state.session ??= hinted;
      const retry_count = (line.match(/APIEmptyResponseError/g) ?? []).length;
      return { liveness: Boolean(line.trim()), progress: retry_count > 0, progress_key: `kimi-retry:${state.cursor}`, session_id: state.session, cursor: state.cursor, event: retry_count > 0 ? "retry" : null, retry_count };
    }
    if (!line.trim()) return { cursor: state.cursor, session_id: state.session };
    let item;
    try { item = JSON.parse(line); }
    catch {
      state.protocolError = "Kimi emitted malformed stream-json";
      return { ...terminalFailure(state.protocolError), session_id: state.session, cursor: state.cursor };
    }
    const observedSession = sessionFromItem(item);
    if (observedSession && state.session && observedSession !== state.session) {
      state.protocolError = "Kimi changed its native session identity";
      return terminalFailure(state.protocolError, state.expectedSession ? "PROVIDER_SESSION_MISMATCH" : "PROVIDER_OUTPUT_INVALID");
    }
    state.session ??= observedSession;
    const isMeta = item?.role === "meta";
    const isKnown = isMeta || item?.role === "assistant" || item?.role === "tool";
    const retry = isMeta && typeof item?.type === "string" && /retry/i.test(item.type);
    return {
      liveness: true,
      progress: !isMeta || retry,
      progress_key: `kimi-stream:${state.cursor}`,
      cursor: state.cursor,
      session_id: state.session,
      event: item?.type ?? item?.role ?? "json",
      retry_count: retry ? 1 : 0,
      ...(isKnown ? {} : { progress: true }),
    };
  };
  return { ...plan(provider, cwd, argv, null), expectedSession: session, observeLine };
}

function parse(stdout, stderr = "", expectedSession = null) {
  let session = stderr.split(/\r?\n/).map((line) => line.match(resumeHintPattern)?.[1] ?? null).find(Boolean) ?? null;
  let explicitSessionHint = Boolean(session);
  let text = null;
  let usage = null;
  let malformed = false;
  for (const raw of stdout.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    let item;
    try { item = JSON.parse(raw); } catch { malformed = true; continue; }
    const hinted = sessionFromItem(item);
    if (hinted) {
      if (session && session !== hinted) malformed = true;
      session ??= hinted;
      explicitSessionHint = true;
    }
    session ??= nonempty(item.session_id ?? item.sessionId);
    usage ??= item.usage ?? null;
    text = parseAssistantItem(item) ?? text;

    // Keep accepting the old final-record shape so previously captured Kimi
    // transcripts remain inspectable, while execution uses stream-json.
    if (["final", "result", "message.completed"].includes(item.type)) {
      text = assistantText(item.text ?? item.result ?? item.content) ?? text;
      session ??= nonempty(item.session_id ?? item.sessionId);
    }
  }
  if (expectedSession && session !== expectedSession) return invalid("Kimi did not preserve the requested continuation session");
  return !malformed && explicitSessionHint && text && session ? { ok: true, text, session_id: session, usage } : invalid(malformed ? "Kimi emitted malformed stream-json" : "Kimi emitted no final assistant response");
}

const reviewInstruction = "Review only the supplied instruction and the attachment files named in the provider attachment access contract. Use only the Read tool for those files. Do not use Git, shell, network, or paths outside that contract. Return only the requested review.";

export default {
  capabilities: { continuation: true, attachment_delivery: ["file_only"] },
  modelInstruction: reviewInstruction,
  publicOutputRewritePrompt,
  requiresWritableCwd: true,
  stableContinuationCwd: true,
  runFromWritableRoot: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start(provider, cwd, prompt) { return streamPlan(provider, cwd, prompt); },
  resume(provider, cwd, session, prompt) { return streamPlan(provider, cwd, prompt, session); },
  parse,
};
