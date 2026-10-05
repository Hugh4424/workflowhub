import { fail } from "../errors.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { invalid, nonempty, plan, publicOutputRewritePrompt, restrictedFiles, writeFile } from "./shared.mjs";

const reviewInstruction = "Review only the supplied instruction and the hash-verified frozen files under bundle/ when present. Stay read-only. For file_only material, use only the third-review-bundle MCP server's list_bundle, read_bundle, and search_bundle tools. read_bundle is bounded and may be called repeatedly with start_line/max_lines or max_bytes when it reports truncation. When the instruction ships no attached material, it is complete on its own: answer from its text alone and call no tools at all, treating any path or path:line it mentions as literal text rather than something to open. Do not use native file reads, shell, network, web, other MCP servers, plugins, subagents, or other files. Return exactly the requested final response as visible assistant text.";
// A prompt-only review carries no bundle, so every tool call is by definition
// outside the scoped review bundle and supervision denies it. Review prose is
// dense with `path:line` citations, which is exactly the shape that makes the
// agent reach for a read tool. The broker cannot rely on the caller prefixing
// its own "do not read files" text, so the adapter states the constraint
// itself on the prompt-only path.
const promptOnlyConstraint = "TEXT-ONLY REVIEW. No files are attached to this request and no bundle exists, so there is nothing to open. Do not call any tool: no file reads, no listing, no search, no shell, no MCP calls, not even to check whether a path exists. Every `path`, `path:line`, and `path:line:col` below is literal quoted text supplied for your reference, not an instruction to open that file. Answer entirely from the text of this message and reply with the requested review as visible assistant text.";
// Escalation used only after supervision denied a prompt-only tool call. It
// repeats the same rule in stronger, more explicit terms; it never grants any
// capability, so a denied file_only run can never be laundered through it.
const promptOnlyEscalation = "STOP. Your previous attempt at this review was terminated because you tried to call a tool. This request has no attached files, no bundle, and no readable tool of any kind — every tool call will be killed again. You must produce the entire review from the message text alone, on your first response, with zero tool calls. Treat all file paths and `path:line` references as literal strings that were pasted for you to reason about; they are not openable and their contents are not available. Write the requested review now as plain assistant text.";
const projectConfig = Object.freeze({
  permissions: {
    // Let the adapter inspect shell calls before Cursor executes them. The
    // adapter below admits only read-only inspection of an already admitted
    // spill file.
    allow: ["Mcp(third-review-bundle:*)", "Shell(rg)", "Shell(head)", "Shell(sed)", "Shell(wc)", "Shell(grep)", "Shell(cat)"],
    deny: [
      "Read(**)", "Write(**)", "WebFetch(*)",
    ],
  },
});
const isolatedCliConfig = Object.freeze({
  version: 1,
  ...projectConfig,
  approvalMode: "unrestricted",
  autoAcceptWebSearch: false,
  sandbox: { mode: "enabled", networkAccess: "user_config_with_defaults" },
});
const bundleServer = path.join(path.dirname(fileURLToPath(import.meta.url)), "cursor-bundle-mcp.mjs");

function parse(stdout, _stderr = "", expectedSession = null) {
  let session_id = null; let terminal = null; let initialized = false;
  for (const line of String(stdout ?? "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let value;
    try { value = JSON.parse(line); }
    catch { return invalid("Cursor Agent emitted malformed stream JSON"); }
    if (terminal) return invalid("Cursor Agent emitted events after its terminal result");
    const observedSession = nonempty(value.session_id);
    if (observedSession && session_id && observedSession !== session_id) return invalid("Cursor Agent changed session identity during the turn");
    session_id ??= observedSession;
    initialized ||= value.type === "system" && value.subtype === "init";
    if (value.type === "result") {
      if (terminal) return invalid("Cursor Agent emitted multiple terminal result events");
      terminal = value;
    }
  }
  if (!session_id) return invalid("Cursor Agent emitted no session id");
  if (!initialized) return invalid("Cursor Agent emitted no initialization event");
  if (expectedSession && session_id !== expectedSession) return invalid("Cursor Agent did not preserve the requested continuation session");
  if (!terminal || terminal.subtype !== "success" || terminal.is_error === true) return invalid("Cursor Agent emitted no successful terminal result");
  const text = nonempty(terminal.result);
  return text ? { ok: true, text, session_id, usage: terminal.usage ?? null } : invalid("Cursor Agent emitted no final assistant text");
}

function terminalError(session_id, code, message) {
  return {
    liveness: true, progress: false, event: "tool_call", session_id,
    terminal: {
      state: "failed", session_id,
      error: { code, message },
    },
  };
}

function permissionDenied(session_id) {
  return terminalError(session_id, "PROVIDER_PERMISSION_DENIED", "Cursor Agent attempted a tool outside the scoped review bundle");
}

function protocolInvalid(session_id, message = "Cursor Agent emitted an unattributable MCP tool event") {
  return terminalError(session_id, "PROVIDER_MCP_PROTOCOL_INVALID", message);
}

function toolUnsupported(session_id, message = "Cursor Agent emitted an unsupported tool call") {
  return terminalError(session_id, "PROVIDER_TOOL_UNSUPPORTED", message);
}

function spillIdentityChanged(session_id) {
  return terminalError(session_id, "PROVIDER_SPILL_IDENTITY_CHANGED", "Cursor Agent changed or replaced an admitted MCP spill file during the tool call");
}

function isBenignMcpArgumentProbe(value) {
  const error = value.tool_call?.mcpToolCall?.result?.error;
  const message = [error?.error, error?.readToolDefReminder].filter((item) => typeof item === "string").join("\n");
  return error?.error === "Tool execution error"
    && typeof message === "string"
    && (/Invalid arguments:\s*server: Required\s*toolName: Required/.test(message)
      || /Failed to parse arguments string as JSON object/.test(message));
}

function scopedSpillFile(filePath, cursorData) {
  if (!nonempty(filePath) || !path.isAbsolute(filePath) || !nonempty(cursorData)) return null;
  try {
    const root = fs.realpathSync(cursorData);
    const resolved = path.resolve(filePath);
    const real = fs.realpathSync(resolved);
    const relative = path.relative(root, real);
    // Compare canonical paths so `/tmp` and `/private/tmp` spellings remain
    // equivalent on macOS. A symlink that resolves outside cursor-data fails
    // the relative-root check below.
    const stat = fs.statSync(real);
    if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
    if (!relative.split(path.sep).includes("agent-tools") || !stat.isFile() || stat.nlink !== 1) return null;
    return {
      path: real,
      identity: { dev: String(stat.dev), ino: String(stat.ino), size: stat.size, mtimeNs: String(stat.mtimeNs ?? "") },
    };
  } catch { return null; }
}

function scopedSpillPath(filePath, cursorData) {
  return scopedSpillFile(filePath, cursorData)?.path ?? null;
}

function sameSpillIdentity(filePath, cursorData, expected) {
  const current = scopedSpillFile(filePath, cursorData);
  return current && current.path === expected.path
    && Object.entries(expected.identity).every(([key, value]) => current.identity[key] === value);
}

function spillOutputPaths(value) {
  const content = value.tool_call?.mcpToolCall?.result?.success?.content;
  if (!Array.isArray(content)) return [];
  return content.flatMap((item) => {
    const filePath = item?.text?.outputLocation?.filePath;
    return typeof filePath === "string" && filePath.trim() ? [filePath] : [];
  });
}

const spillShellCommands = new Set(["cat", "grep", "head", "rg", "sed", "wc"]);

function stripQuotes(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length >= 2 && ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")))) return text.slice(1, -1);
  return text;
}

function hasUnquoted(command, target) {
  let quote = null; let escaped = false;
  for (const char of command) {
    if (escaped) { escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (quote) { if (char === quote) quote = null; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === target) return true;
  }
  return false;
}

function shellAssignments(command) {
  const variables = new Map(); let remaining = command.trim();
  while (true) {
    const match = remaining.match(/^([A-Za-z_][A-Za-z0-9_]*)=(?:"([^"]*)"|'([^']*)'|([^\s;]+))\s*/);
    if (!match) break;
    variables.set(match[1], match[2] ?? match[3] ?? match[4]);
    remaining = remaining.slice(match[0].length);
  }
  return variables;
}

function shellArgumentPath(value, variables) {
  const candidate = stripQuotes(value);
  if (path.isAbsolute(candidate ?? "")) return candidate;
  const variable = candidate?.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$|^\$([A-Za-z_][A-Za-z0-9_]*)$/);
  return variable ? variables.get(variable[1] ?? variable[2]) ?? null : null;
}

function commandAbsolutePaths(command) {
  const paths = [];
  const pattern = /(?:^|[\s=])(?:"(\/[^"`]+)"|'(\/[^'`]+)'|(\/[^\s"'`|;&]+))/g;
  for (const match of command.matchAll(pattern)) paths.push(match[1] ?? match[2] ?? match[3]);
  return paths;
}

function scopedSpillShell(call, cursorData, spillPaths) {
  const args = call.shellToolCall?.args;
  const parsing = args?.parsingResult;
  if (!args || typeof args.command !== "string" || !parsing || parsing.parsingFailed
      || parsing.hasRedirects || parsing.hasCommandSubstitution || parsing.hasPipes || parsing.hasPipe
      || args.hasInputRedirect || args.hasOutputRedirect || hasUnquoted(args.command, "|")) return null;
  const commands = Array.isArray(parsing.executableCommands) ? parsing.executableCommands : [];
  if (commands.length === 0 || commands.some(({ name }) => !spillShellCommands.has(name))) return null;
  const paths = new Set();
  const variables = shellAssignments(args.command);
  for (const candidate of commandAbsolutePaths(args.command)) {
    const spillPath = scopedSpillPath(candidate, cursorData);
    if (!spillPath) return null;
    paths.add(spillPath);
  }
  for (const command of commands) {
    for (const arg of Array.isArray(command.args) ? command.args : []) {
      const candidate = shellArgumentPath(arg?.value, variables);
      if (!candidate) continue;
      const spillPath = scopedSpillPath(candidate, cursorData);
      if (!spillPath) return null;
      paths.add(spillPath);
    }
  }
  if (paths.size === 0) return null;
  for (const spillPath of paths) if (!spillPaths.has(spillPath)) return null;
  return paths;
}

function scopedSpillNative(call, cursorData, spillPaths, spillIdentities = null) {
  const read = call.readToolCall?.args;
  const grep = call.grepToolCall?.args;
  if (!read && !grep) return null;
  const candidates = grep
    ? [grep.path, ...(Array.isArray(grep.paths) ? grep.paths : [])]
    : [read.path];
  if (candidates.length === 0 || candidates.some((candidate) => typeof candidate !== "string" || !path.isAbsolute(candidate))) return read ? { denied: true } : null;
  const files = candidates.map((candidate) => scopedSpillFile(candidate, cursorData));
  if (files.some((file) => !file)) return { denied: true };
  const paths = files.map((file) => file.path);
  if (paths.some((filePath) => !spillPaths.has(filePath))) return { denied: true };
  if (spillIdentities && files.some((file) => {
    const expected = spillIdentities.get(file.path);
    return expected && !sameSpillIdentity(file.path, cursorData, expected);
  })) return { identityChanged: true };
  return { kind: grep ? "spill-grep" : "spill-read", files };
}

function admittedMcpCall(call) {
  const discovery = call.getMcpToolsToolCall?.args;
  if (discovery
    && discovery.server === "third-review-bundle"
    && (discovery.toolName === undefined || ["list_bundle", "read_bundle", "search_bundle"].includes(discovery.toolName))) {
    return { kind: discovery.toolName === undefined ? "mcp-discovery" : discovery.toolName };
  }
  const mcp = call.mcpToolCall?.args;
  if (mcp
    && mcp.serverIdentifier === "third-review-bundle"
    && mcp.providerIdentifier === "third-review-bundle"
    && ["list_bundle", "read_bundle", "search_bundle"].includes(mcp.toolName)) {
    return { kind: mcp.toolName };
  }
  return null;
}

function observeLine(stream, line, scope = null) {
  if (stream !== "stdout") return { progress: false };
  try {
    const value = JSON.parse(line); const session_id = nonempty(value.session_id);
    if (value.type === "interaction_query" && value.subtype === "request") return permissionDenied(session_id);
    if (value.type === "tool_call" && ["started", "completed"].includes(value.subtype)) {
      const call = value.tool_call ?? {};
      const callId = nonempty(value.call_id);
      if (!callId) return protocolInvalid(session_id, "Cursor Agent emitted a tool event without call_id");
      // The `started` event carries the authoritative target identity. Cursor
      // may omit those arguments from `completed`, so pair by call_id rather
      // than re-deriving admission from the completion event.
      if (value.subtype === "started") {
        const mcpAdmission = admittedMcpCall(call);
        if (mcpAdmission) scope?.calls?.set(callId, mcpAdmission);
        else {
          // Cursor spills large MCP results to its isolated agent-tools
          // directory and then asks its native Read tool to fetch that exact
          // file. This is an internal transport step, not a new host-file
          // read. Admit only paths previously returned by list_bundle or
          // read_bundle, after
          // realpath-checking them below the current isolated cursor-data.
          const native = scopedSpillNative(call, scope?.cursorData, scope?.spillPaths ?? new Set(), scope?.spillIdentities);
          if (native?.kind) scope.calls?.set(callId, native);
          else {
            if (native?.identityChanged) return spillIdentityChanged(session_id);
            const shellPaths = scopedSpillShell(call, scope?.cursorData, scope?.spillPaths ?? new Set());
            if (!shellPaths) {
              if (native?.denied) return permissionDenied(session_id);
              if (call.shellToolCall?.args?.command && commandAbsolutePaths(call.shellToolCall.args.command).length) return permissionDenied(session_id);
              if (call.mcpToolCall || call.getMcpToolsToolCall) return permissionDenied(session_id);
              return toolUnsupported(session_id);
            }
            scope.calls?.set(callId, {
              kind: "spill-shell",
              paths: shellPaths,
              files: [...shellPaths].map((filePath) => scopedSpillFile(filePath, scope.cursorData)).filter(Boolean),
            });
          }
        }
      } else {
        const admission = scope?.calls?.get(callId);
        if (!admission) {
          // Cursor 1.0.x occasionally emits a synthetic MCP completion after a
          // thinking turn with no matching start event. It is an internal
          // argument probe, not an executed host capability; consume only this
          // exact known shape and keep all other orphan completions fail-closed.
          if (isBenignMcpArgumentProbe(value)) return { liveness: true, progress: true, event: "tool_call", session_id };
          return protocolInvalid(session_id, "Cursor Agent completed a tool call that was never admitted");
        }
        if (["spill-read", "spill-grep"].includes(admission.kind)) {
          const completed = scopedSpillNative(call, scope.cursorData, scope.spillPaths ?? new Set(), scope.spillIdentities);
          if (completed?.identityChanged) return spillIdentityChanged(session_id);
          if (completed && (completed.kind !== admission.kind || completed.files.length !== admission.files.length
              || completed.files.some((file, index) => !sameSpillIdentity(file.path, scope.cursorData, admission.files[index])))) return spillIdentityChanged(session_id);
          if (admission.files.some((file) => !sameSpillIdentity(file.path, scope.cursorData, file))) return spillIdentityChanged(session_id);
        }
        if (admission.kind === "spill-shell" && call.shellToolCall?.args !== undefined) {
          const completedPaths = scopedSpillShell(call, scope.cursorData, scope.spillPaths ?? new Set());
          if (!completedPaths || completedPaths.size !== admission.paths.size || [...completedPaths].some((filePath) => !admission.paths.has(filePath))) return permissionDenied(session_id);
          if (admission.files.some((file) => !sameSpillIdentity(file.path, scope.cursorData, file))) return spillIdentityChanged(session_id);
        }
        scope.calls.delete(callId);
        if (["list_bundle", "read_bundle", "search_bundle"].includes(admission.kind)) {
          for (const filePath of spillOutputPaths(value)) {
            const spillFile = scopedSpillFile(filePath, scope.cursorData);
            if (!spillFile) return permissionDenied(session_id);
            scope.spillPaths?.add(spillFile.path);
            scope.spillIdentities?.set(spillFile.path, spillFile);
          }
        }
      }
    }
    if (value.type === "result") {
      if (scope?.calls?.size) return protocolInvalid(session_id, "Cursor Agent emitted a terminal result with pending tool calls");
      const completed = value.subtype === "success" && value.is_error !== true && nonempty(value.result);
      return {
        liveness: true, progress: true, event: value.type, session_id,
        terminal: completed
          ? { state: "completed", session_id }
          : { state: "failed", session_id, error: { code: "PROVIDER_HEALTH_FAILED", message: "Cursor Agent returned a terminal error" } },
      };
    }
    if (value.type === "retry" && value.subtype === "starting") return { liveness: true, progress: true, retry_count: 1, event: "retry", session_id };
    if (["system", "user", "connection", "status", "heartbeat"].includes(value.type)) return { liveness: true, progress: false, event: value.type, session_id };
    return { liveness: true, progress: true, event: value.type ?? "json", session_id };
  } catch { return { progress: false }; }
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
  return directory;
}

function ensureKeychainLink(home) {
  const source = path.join(process.env.HOME ?? "", "Library", "Keychains", "login.keychain-db");
  if (!path.isAbsolute(source) || !fs.existsSync(source)) fail("RUNTIME_UNAVAILABLE", "Cursor native authentication requires the macOS login keychain");
  const directory = ensureDirectory(path.join(home, "Library", "Keychains"));
  const target = path.join(directory, "login.keychain-db");
  let existing = false;
  try { fs.lstatSync(target); existing = true; } catch {}
  if (existing) {
    let matches = false;
    try { matches = fs.realpathSync(target) === fs.realpathSync(source); } catch {}
    if (!matches) fail("RUNTIME_UNAVAILABLE", "Cursor isolated keychain link has an unexpected target");
    return target;
  }
  try { fs.symlinkSync(source, target); }
  catch (error) { fail("RUNTIME_UNAVAILABLE", `cannot create Cursor isolated keychain link: ${error.message}`); }
  return target;
}

function isolatedEnvironment(runtime, provider) {
  if (!runtime) fail("RUNTIME_UNAVAILABLE", "Cursor Agent requires a stable broker runtime directory");
  const root = restrictedFiles(runtime, provider);
  const home = ensureDirectory(path.join(root, "home"));
  if (provider.auth?.type !== "env") ensureKeychainLink(home);
  const config = ensureDirectory(path.join(root, "xdg-config"));
  const cache = ensureDirectory(path.join(root, "xdg-cache"));
  const data = ensureDirectory(path.join(root, "xdg-data"));
  const cursorConfig = ensureDirectory(path.join(root, "cursor-config"));
  const cursorData = ensureDirectory(path.join(root, "cursor-data"));
  const cliConfig = `${JSON.stringify(isolatedCliConfig, null, 2)}\n`;
  writeFile(path.join(ensureDirectory(path.join(config, "cursor")), "cli-config.json"), cliConfig);
  writeFile(path.join(cursorConfig, "cli-config.json"), cliConfig);
  return {
    cursorData,
    env: {
      HOME: home,
      XDG_CONFIG_HOME: config,
      XDG_CACHE_HOME: cache,
      XDG_DATA_HOME: data,
      CURSOR_CONFIG_DIR: cursorConfig,
      CURSOR_DATA_DIR: cursorData,
    },
  };
}

function executionPlan(provider, cwd, prompt, runtime, session = null, { escalatePromptOnly = false } = {}) {
  if (!provider.allow_host_state) fail("PROVIDER_HOST_STATE_UNACKNOWLEDGED", "Cursor Agent persists prompts and conversations in its native profile; set allow_host_state=true only for trusted material");
  if (provider.effort) fail("PROVIDER_OPTION_UNSUPPORTED", "Cursor Agent does not support generic provider.effort; select the required model variant instead");
  if (provider.thinking === false) fail("PROVIDER_OPTION_UNSUPPORTED", "Cursor Agent thinking is controlled by the selected model variant");
  const isolated = isolatedEnvironment(runtime, provider);
  const hasBundle = fs.existsSync(path.join(cwd, "bundle"));
  const bundle = hasBundle
    ? path.join(cwd, "bundle")
    : ensureDirectory(path.join(isolated.cursorData, "empty-bundle"));
  const configDir = path.join(cwd, ".cursor");
  fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  writeFile(path.join(configDir, "cli.json"), `${JSON.stringify(projectConfig, null, 2)}\n`);
  writeFile(path.join(configDir, "mcp.json"), `${JSON.stringify({
    mcpServers: {
      "third-review-bundle": {
        command: process.execPath,
        args: [bundleServer, bundle],
      },
    },
  }, null, 2)}\n`);
  const argv = [
    "-p", "--trust", "--workspace", cwd, "--output-format", "stream-json",
    "--sandbox", "enabled", "--disable-indexing", "--disable-codebase-ref",
    "--approve-mcps",
    "--data-dir", isolated.cursorData,
  ];
  // `ask` is the CLI's read-only Q&A mode. There is no native "no tools at
  // all" switch, so this only narrows the surface; the prompt constraint and
  // stream supervision remain the actual guarantee. It is applied only when no
  // bundle exists, so file_only reviews keep their unchanged tool surface.
  if (!hasBundle) argv.push("--mode", "ask");
  if (provider.model) argv.push("--model", provider.model);
  if (session) argv.push("--resume", session);
  const scope = { calls: new Map(), spillPaths: new Set(), spillIdentities: new Map(), cursorData: isolated.cursorData };
  // The prompt-only constraint is prepended by the adapter rather than trusted
  // to the caller, and the escalation replaces it verbatim on the one retry.
  const providerPrompt = hasBundle
    ? prompt
    : `${escalatePromptOnly ? promptOnlyEscalation : promptOnlyConstraint}\n\n${prompt}`;
  return {
    ...plan(provider, cwd, argv, providerPrompt, isolated.env),
    clientArgv: argv, expectedSession: session,
    // Declares to the broker that this exact run may be retried once with a
    // hardened prompt when supervision denied a tool call. Only prompt-only
    // runs carry it, so a file_only permission denial stays terminal.
    ...(hasBundle || escalatePromptOnly ? {} : { promptOnlyRetry: true }),
    observeLine: (stream, line) => observeLine(stream, line, scope),
  };
}

export default {
  capabilities: { continuation: true, attachment_delivery: ["file_only", "always_embed"] },
  modelInstruction: reviewInstruction,
  publicOutputRewritePrompt,
  promptViaStdin: true,
  requiresWritableCwd: true,
  stableContinuationCwd: true,
  runFromWritableRoot: true,
  doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null),
  start: (provider, cwd, prompt, runtime) => executionPlan(provider, cwd, prompt, runtime),
  resume: (provider, cwd, session, prompt, runtime) => executionPlan(provider, cwd, prompt, runtime, session),
  // A denied prompt-only attempt is retried once as a brand new turn, never as
  // a resume: the previous session was killed mid-tool-call, so its native
  // state is not a sound base to continue from.
  retryPromptOnly: (provider, cwd, prompt, runtime) => executionPlan(provider, cwd, prompt, runtime, null, { escalatePromptOnly: true }),
  parse,
  observeLine,
};
