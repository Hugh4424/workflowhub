import { spawn } from "node:child_process";
import {
  closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync,
  readdirSync, realpathSync, unlinkSync, writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { constants as osConstants } from "node:os";
import { join, parse, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const LIMIT = 8 * 1024 * 1024;
const TRUNCATION_MARKER = Buffer.from("\n[TRUNCATED: output exceeded 8 MiB]\n");
const sameFile = (a, b) => a.dev === b.dev && a.ino === b.ino;
const failure = (code, message, details = {}) => Object.assign(new Error(message), { code, ...details });

function recordStorage(path) {
  if (typeof path !== "string" || !path) throw failure("INVALID_RECORD_DIRECTORY", "recordDir is required");
  if (!Number.isInteger(constants.O_NOFOLLOW)) throw failure("UNSUPPORTED_PLATFORM", "O_NOFOLLOW is required for capture records");
  const absolute = resolve(path);
  const paths = [];
  let cursor = parse(absolute).root;
  paths.push(cursor);
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    paths.push(cursor);
  }
  const identities = paths.map((name) => {
    const stat = lstatSync(name);
    const alias = stat.isSymbolicLink() && process.platform === "darwin"
      && ((name === "/tmp" && realpathSync(name) === "/private/tmp")
        || (name === "/var" && realpathSync(name) === "/private/var"));
    if (stat.isSymbolicLink() && !alias) throw failure("SYMLINK_TARGET", `symlinked record directory: ${name}`);
    if (!stat.isDirectory() && !alias) throw failure("NOT_A_DIRECTORY", `not a record directory: ${name}`);
    return { path: name, dev: stat.dev, ino: stat.ino, real: realpathSync(name) };
  });
  const root = realpathSync(absolute);
  const identity = lstatSync(root);
  const verify = () => {
    for (const before of identities) {
      if (!sameFile(lstatSync(before.path), before) || realpathSync(before.path) !== before.real) {
        throw failure("ANCESTOR_REPLACED", `record directory replaced: ${before.path}`);
      }
    }
  };
  verify();
  return { root, identity, verify };
}

function optionalStat(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function syncDirectory(storage) {
  storage.verify();
  const fd = openSync(storage.root, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!sameFile(fstatSync(fd), storage.identity)) throw failure("ANCESTOR_REPLACED", "record directory identity changed");
    fsyncSync(fd);
  } finally { closeSync(fd); }
}

function reserveOutput(storage, slug) {
  const day = new Date().toISOString().slice(0, 10);
  let sequence = 1;
  for (const name of readdirSync(storage.root)) {
    const match = name.match(/^(\d{4}-\d{2}-\d{2})-(\d{3})-[a-z0-9-]+\.(?:json|output)$/);
    if (match?.[1] === day) sequence = Math.max(sequence, Number(match[2]) + 1);
  }
  for (; sequence <= 999; sequence += 1) {
    storage.verify();
    const base = `${day}-${String(sequence).padStart(3, "0")}-${slug}`;
    const output = join(storage.root, `${base}.output`);
    const receipt = join(storage.root, `${base}.json`);
    if (optionalStat(receipt)) continue;
    let fd;
    try { fd = openSync(output, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); }
    catch (error) { if (error.code === "EEXIST") continue; throw error; }
    const identity = fstatSync(fd);
    try {
      storage.verify();
      if (!sameFile(lstatSync(output), identity)) throw failure("ANCESTOR_REPLACED", `output replaced while creating: ${output}`);
    } catch (error) { closeSync(fd); throw error; }
    return { output, receipt, fd, identity };
  }
  throw failure("RECORD_SEQUENCE_EXHAUSTED", `capture sequence exhausted for ${day}`);
}

function publishReceipt(storage, path, record) {
  const temporary = join(storage.root, `.${randomUUID()}.tmp`);
  let fd;
  let identity;
  try {
    storage.verify();
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    identity = fstatSync(fd);
    writeFileSync(fd, `${JSON.stringify(record, null, 2)}\n`);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    storage.verify();
    const named = lstatSync(temporary);
    if (named.isSymbolicLink() || !sameFile(named, identity)) throw failure("ANCESTOR_REPLACED", "receipt temporary replaced");
    try { linkSync(temporary, path); }
    catch (error) { if (error.code === "EEXIST") throw failure("RECORD_CONFLICT", `receipt already exists: ${path}`); throw error; }
    storage.verify();
    const published = lstatSync(path);
    if (published.isSymbolicLink() || !sameFile(published, identity)) throw failure("ANCESTOR_REPLACED", "receipt replaced during publication");
    syncDirectory(storage);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (identity) {
      storage.verify();
      const named = optionalStat(temporary);
      if (named && !named.isSymbolicLink() && sameFile(named, identity)) unlinkSync(temporary);
    }
  }
}

function execute(cwd, argv, output, timeoutMs, signal) {
  return new Promise((done) => {
    let child;
    let timer;
    let deadline;
    let settled = false;
    let spawned = false;
    let timedOut = false;
    let cancelled = false;
    let cancellationReason;
    let writeFailed = false;
    let error;
    let written = 0;
    const truncated = { stdout: false, stderr: false };
    let markerWritten = false;
    const finish = (code, childSignal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(deadline);
      signal?.removeEventListener("abort", onAbort);
      done({ code, signal: childSignal, spawned, timedOut, cancelled, cancellationReason, truncated, error });
    };
    const killGroup = () => {
      if (!child?.pid) return;
      try { process.kill(-child.pid, "SIGKILL"); }
      catch (caught) {
        if (caught.code !== "ESRCH") error ??= failure("PROCESS_CLEANUP_FAILED", "could not kill capture process group", { cause: caught });
      }
      if (!deadline) deadline = setTimeout(() => {
        error ??= failure("PROCESS_CLEANUP_FAILED", "capture process group did not close after termination");
        child.stdout?.destroy(); child.stderr?.destroy(); child.unref();
        finish(null, null);
      }, 3000);
    };
    const collect = (stream, chunk) => {
      if (settled || writeFailed) return; // Pipes remain in flowing mode and drain.
      try {
        const remaining = Math.max(0, LIMIT - written);
        if (remaining > 0) {
          const kept = chunk.subarray(0, remaining);
          writeFileSync(output.fd, kept);
          written += kept.length;
        }
        if (chunk.length > remaining) {
          truncated[stream] = true;
          if (!markerWritten) { writeFileSync(output.fd, TRUNCATION_MARKER); markerWritten = true; }
        }
      } catch (caught) {
        writeFailed = true;
        error = error ? failure("CAPTURE_FAILED", "output write failed during interruption", { cause: caught, interruption: error }) : caught;
        killGroup();
      }
    };
    const onAbort = () => {
      if (settled || timedOut || cancelled) return;
      cancelled = true;
      cancellationReason = typeof signal.reason === "string" ? signal.reason : String(signal.reason ?? "aborted");
      error ??= failure("ABORT_ERR", "command capture cancelled", { cause: signal.reason });
      clearTimeout(timer);
      if (child?.pid) killGroup();
      else finish(null, null);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    try { child = spawn(argv[0], argv.slice(1), { cwd, detached: true, shell: false, stdio: ["ignore", "pipe", "pipe"] }); }
    catch (caught) { error = caught; finish(null, null); return; }
    child.stdout.on("data", (chunk) => collect("stdout", chunk));
    child.stderr.on("data", (chunk) => collect("stderr", chunk));
    for (const stream of [child.stdout, child.stderr]) stream.on("error", (caught) => { error ??= caught; killGroup(); });
    child.once("spawn", () => {
      spawned = true;
      if (cancelled) killGroup();
      else if (timeoutMs !== undefined) timer = setTimeout(() => { timedOut = true; killGroup(); }, timeoutMs);
    });
    child.once("error", (caught) => { error ??= caught; if (child.pid) killGroup(); });
    // close follows both stdout/stderr closure, so every received byte has
    // already been synchronously written before output fsync and JSON publish.
    child.once("close", (code, signal) => finish(code, signal));
  });
}

export async function captureCommand({ cwd, recordDir, slug, argv, shell, timeoutMs, signal } = {}) {
  if (process.platform === "win32") throw failure("UNSUPPORTED_PLATFORM", "POSIX process groups are required");
  if (typeof cwd !== "string" || !cwd) throw failure("INVALID_CWD", "cwd is required");
  const working = realpathSync(resolve(cwd));
  if (!lstatSync(working).isDirectory()) throw failure("NOT_A_DIRECTORY", `cwd is not a directory: ${working}`);
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,48}$/.test(slug)) throw failure("INVALID_SLUG", "slug must match [a-z0-9-]{1,48}");
  if ((argv === undefined) === (shell === undefined)) throw failure("INVALID_COMMAND", "provide exactly one of argv or shell");
  if (argv !== undefined && (!Array.isArray(argv) || argv.length === 0 || typeof argv[0] !== "string" || !argv[0]
    || argv.some((arg) => typeof arg !== "string" || arg.includes("\0")))) throw failure("INVALID_COMMAND", "argv must be a nonempty string array without NUL bytes");
  if (shell !== undefined && (typeof shell !== "string" || !shell || shell.includes("\0"))) throw failure("INVALID_COMMAND", "shell must be nonempty shell text without NUL bytes");
  if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)) throw failure("INVALID_TIMEOUT", "timeoutMs must be a positive safe integer");
  if (signal !== undefined && (typeof signal?.aborted !== "boolean"
    || typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function")) {
    throw failure("INVALID_SIGNAL", "signal must be an AbortSignal");
  }
  const command = argv === undefined ? ["/bin/sh", "-c", shell] : [...argv];
  const storage = recordStorage(recordDir);
  const output = reserveOutput(storage, slug);
  const startedAt = new Date().toISOString();
  let result;
  try {
    result = await execute(working, command, output, timeoutMs, signal);
    storage.verify();
    const named = lstatSync(output.output);
    if (named.isSymbolicLink() || !sameFile(named, output.identity)) throw failure("ANCESTOR_REPLACED", "capture output replaced during execution");
    fsyncSync(output.fd);
  } finally { closeSync(output.fd); }
  // Failed spawn may report a negative libuv errno on close (e.g. -2), which
  // is not a child exit code. Keep the original spawn error and record null.
  const cancellationExit = result.cancellationReason === "SIGTERM" ? 143 : 130;
  const exit = result.cancelled ? cancellationExit : result.timedOut ? 124 : !result.spawned ? null
    : result.code ?? (result.signal ? 128 + osConstants.signals[result.signal] : null);
  const receipt = {
    argv: command, cwd: working, exit_code: exit, signal: result.signal,
    timed_out: result.timedOut, cancelled: result.cancelled,
    ...(result.cancelled ? { cancellation_reason: result.cancellationReason } : {}),
    truncated: result.truncated.stdout || result.truncated.stderr,
    started_at: startedAt, ended_at: new Date().toISOString(), output_ref: output.output,
    ...(result.error ? { error: { code: result.error.code ?? "CAPTURE_FAILED", message: result.error.message } } : {}),
  };
  publishReceipt(storage, output.receipt, receipt);
  if (result.error) throw Object.assign(result.error, { output_ref: output.output, receipt_ref: output.receipt, exitCode: result.error.code === "ABORT_ERR" ? cancellationExit : result.error.code === "ENOENT" ? 127 : 1 });
  return { ...receipt, exit, stdoutTruncated: result.truncated.stdout, stderrTruncated: result.truncated.stderr, receipt_ref: output.receipt };
}

async function main(argv) {
  const separator = argv.indexOf("--");
  if (separator < 0 || separator === argv.length - 1) throw failure("INVALID_ARGUMENT", "usage: --cwd DIR --record-dir DIR --slug NAME [--timeout-ms N] [--shell] -- COMMAND");
  const flags = argv.slice(0, separator);
  const command = argv.slice(separator + 1);
  const options = {};
  let shellMode = false;
  const names = { "--cwd": "cwd", "--record-dir": "recordDir", "--slug": "slug", "--timeout-ms": "timeoutMs" };
  for (let index = 0; index < flags.length; index += 1) {
    const token = flags[index];
    if (token === "--shell") { if (shellMode) throw failure("INVALID_ARGUMENT", "duplicate --shell"); shellMode = true; continue; }
    const equals = token.indexOf("=");
    const key = equals < 0 ? token : token.slice(0, equals);
    const value = equals < 0 ? flags[++index] : token.slice(equals + 1);
    const field = names[key];
    if (!field || !value || options[field] !== undefined) throw failure("INVALID_ARGUMENT", `unknown, missing or duplicate option: ${key}`);
    options[field] = value;
  }
  if (options.timeoutMs !== undefined) {
    if (!/^\d+$/.test(options.timeoutMs)) throw failure("INVALID_TIMEOUT", "--timeout-ms must be a positive integer");
    options.timeoutMs = Number(options.timeoutMs);
  }
  if (shellMode && command.length !== 1) throw failure("INVALID_ARGUMENT", "--shell requires one shell-text argument after --");
  const controller = new AbortController();
  const interrupt = (name) => controller.abort(name);
  const onInt = () => interrupt("SIGINT");
  const onTerm = () => interrupt("SIGTERM");
  process.on("SIGINT", onInt);
  process.on("SIGTERM", onTerm);
  try {
    const result = await captureCommand({ ...options, signal: controller.signal, ...(shellMode ? { shell: command[0] } : { argv: command }) });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.exit;
  } finally {
    process.off("SIGINT", onInt);
    process.off("SIGTERM", onTerm);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? "CAPTURE_FAILED", message: error.message, ...(error.receipt_ref ? { receipt_ref: error.receipt_ref, output_ref: error.output_ref } : {}) })}\n`);
    process.exitCode = error.exitCode ?? 1;
  });
}
