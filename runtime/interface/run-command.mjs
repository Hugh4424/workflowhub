import { spawn } from "node:child_process";
import {
  closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync,
  readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { constants as osConstants } from "node:os";
import { dirname, join, parse, resolve, sep } from "node:path";
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

async function reserveOutput(storage, slug, performWrite) {
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
    try { await performWrite({ kind: "output", path: output, bytes: 0, incomingFiles: 1 }, () => { storage.verify(); fd = openSync(output, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); }); }
    catch (error) { if (fd !== undefined) closeSync(fd); if (error.code === "EEXIST") continue; throw error; }
    const identity = fstatSync(fd);
    try {
      storage.verify();
      if (!sameFile(lstatSync(output), identity)) throw failure("ANCESTOR_REPLACED", `output replaced while creating: ${output}`);
    } catch (error) { closeSync(fd); throw error; }
    return { output, receipt, fd, identity };
  }
  throw failure("RECORD_SEQUENCE_EXHAUSTED", `capture sequence exhausted for ${day}`);
}

function publishReceipt(storage, path, serialized, publication) {
  const temporary = join(storage.root, `.${randomUUID()}.tmp`);
  let fd;
  let identity;
  try {
    storage.verify();
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    identity = fstatSync(fd);
    writeFileSync(fd, serialized);
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
    publication.identity = identity;
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

function receiptWasPublished(storage, path, serialized, identity) {
  if (!identity) return false;
  let fd;
  try {
    storage.verify();
    const named = lstatSync(path);
    if (!named.isFile() || named.isSymbolicLink() || !sameFile(named, identity)) return false;
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = fstatSync(fd);
    if (!opened.isFile() || !sameFile(opened, identity)) return false;
    const bytes = readFileSync(fd), after = fstatSync(fd), final = lstatSync(path);
    storage.verify();
    return after.isFile() && final.isFile() && !final.isSymbolicLink()
      && sameFile(after, identity) && sameFile(final, identity) && bytes.equals(Buffer.from(serialized));
  } catch { return false; }
  finally { if (fd !== undefined) closeSync(fd); }
}

function execute(cwd, argv, output, timeoutMs, signal, performWrite) {
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
    let queue = Promise.resolve();
    let pending = 0;
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
        queue.then(() => finish(null, null));
      }, 3000);
    };
    const collect = (stream, chunk) => {
      if (settled || writeFailed || cancelled || timedOut) return;
      child.stdout.pause(); child.stderr.pause();
      pending += 1;
      queue = queue.then(async () => {
        if (writeFailed) return;
        const write = async (kind, bytes) => {
          await performWrite({ kind, path: output.output, bytes: bytes.length, incomingFiles: 0 }, () => {
            writeFileSync(output.fd, bytes);
            // Count only bytes whose actual filesystem write completed. A
            // queued chunk still settles after interruption under its budget.
            if (kind === "chunk") written += bytes.length;
            else if (kind === "marker") markerWritten = true;
          });
        };
        const remaining = Math.max(0, LIMIT - written);
        if (remaining > 0) {
          const kept = chunk.subarray(0, remaining);
          await write("chunk", kept);
        }
        if (chunk.length > remaining) {
          truncated[stream] = true;
          if (!markerWritten) await write("marker", TRUNCATION_MARKER);
        }
      }).catch((caught) => {
        writeFailed = true;
        error = error ? failure("CAPTURE_FAILED", "output write failed during interruption", { cause: caught, interruption: error }) : caught;
        killGroup();
        child.stdout.destroy(); child.stderr.destroy();
      }).finally(() => {
        pending -= 1;
        if (!pending && !writeFailed && !cancelled && !timedOut) { child.stdout.resume(); child.stderr.resume(); }
      });
    };
    const onAbort = () => {
      if (settled || timedOut || cancelled) return;
      cancelled = true;
      cancellationReason = typeof signal.reason === "string" ? signal.reason : String(signal.reason ?? "aborted");
      error ??= failure("ABORT_ERR", "command capture cancelled", { cause: signal.reason });
      clearTimeout(timer);
      if (child?.pid) { killGroup(); child.stdout.destroy(); child.stderr.destroy(); }
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
      else if (timeoutMs !== undefined) timer = setTimeout(() => { timedOut = true; killGroup(); child.stdout.destroy(); child.stderr.destroy(); }, timeoutMs);
    });
    child.once("error", (caught) => { error ??= caught; if (child.pid) killGroup(); });
    // Both pipes share one observed-order queue; close waits for its writes.
    child.once("close", (code, signal) => { clearTimeout(timer); clearTimeout(deadline); queue.then(() => finish(code, signal)); });
  });
}

// Private capture caller seam: choose the original reference before the only
// create-only receipt publication. Default callers keep their fresh output.
function settleOutputReference(storage, output, requested) {
  if (requested === undefined || requested === null || requested === output.output) return output.output;
  if (typeof requested !== "string" || resolve(requested) !== requested || dirname(requested) !== storage.root
      || !/^\d{4}-\d{2}-\d{2}-\d{3}-[a-z0-9-]+\.output$/.test(parse(requested).base)) {
    throw failure("OUTPUT_REUSE_PATH_INVALID", "reuse requires a canonical output in the same record directory");
  }
  storage.verify();
  const read = (path, expected) => {
    const named = lstatSync(path);
    if (!named.isFile() || named.isSymbolicLink() || named.nlink !== 1 || realpathSync(path) !== path
        || (expected && !sameFile(named, expected))) throw failure("OUTPUT_REUSE_PATH_INVALID", "reuse output is not an unchanged single-link original");
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const before = fstatSync(fd);
      if (!sameFile(before, named)) throw failure("OUTPUT_REUSE_CHANGED", "reuse output replaced before reading");
      const bytes = readFileSync(fd);
      const after = fstatSync(fd);
      if (!sameFile(after, lstatSync(path)) || before.size !== after.size || before.mtimeMs !== after.mtimeMs)
        throw failure("OUTPUT_REUSE_CHANGED", "reuse output changed while reading");
      return { bytes, identity: after };
    } finally { closeSync(fd); }
  };
  const canonical = read(requested);
  const fresh = read(output.output, output.identity);
  if (!canonical.bytes.equals(fresh.bytes)) throw failure("OUTPUT_REUSE_BYTES_DIFFER", "reuse output has different bytes");
  storage.verify();
  if (!sameFile(lstatSync(requested), canonical.identity) || !sameFile(lstatSync(output.output), output.identity))
    throw failure("OUTPUT_REUSE_CHANGED", "reuse output replaced before cleanup");
  // No receipt or public ref has named this newly reserved output yet.
  unlinkSync(output.output);
  return requested;
}

export async function captureCommand({ cwd, recordDir, slug, argv, shell, timeoutMs, signal, resolveOutputRef, performWrite } = {}) {
  if (performWrite !== undefined && typeof performWrite !== "function") throw failure("INVALID_WRITE_EXECUTOR", "performWrite must be a function");
  performWrite ??= async (_request, writeActual) => writeActual();
  if (resolveOutputRef !== undefined && typeof resolveOutputRef !== "function") throw failure("INVALID_OUTPUT_RESOLVER", "resolveOutputRef must be a private caller function");
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
  const output = await reserveOutput(storage, slug, performWrite);
  const startedAt = new Date().toISOString();
  let result;
  try {
    result = await execute(working, command, output, timeoutMs, signal, performWrite);
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
  let settlementError, outputDisposition;
  if (resolveOutputRef && !result.error) {
    try {
      const observed = Object.freeze({ ...receipt, argv: Object.freeze([...receipt.argv]) });
      const selection = await resolveOutputRef(observed);
      const selected = selection && typeof selection === "object" ? selection : { output_ref: selection };
      if (Object.keys(selected).some(key => !["output_ref", "output_disposition"].includes(key))
          || selected.output_disposition !== undefined && (typeof selected.output_disposition !== "string" || !selected.output_disposition))
        throw failure("OUTPUT_SELECTION_INVALID", "output selection has unknown fields or an invalid disposition");
      receipt.output_ref = settleOutputReference(storage, output, selected.output_ref);
      // CLI-only presentation. Native receipt execution fields remain unchanged.
      if (selected.output_disposition !== undefined) outputDisposition = selected.output_disposition;
    } catch (cause) {
      const detail = `${cause?.code ?? "OUTPUT_RESOLVER_ERROR"}: ${cause?.message ?? String(cause)}`;
      settlementError = failure("OUTPUT_SETTLEMENT_FAILED", `deduplication: unknown; capture output settlement failed; ${detail}`, { cause });
      if (cause?.stack) settlementError.stack += `\n[output-settlement-cause] ${cause.stack}`;
      // This is the actual capture finalization error, not a fabricated child exit.
      receipt.error = { code: settlementError.code, message: settlementError.message };
    }
  }
  const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
  const publication = {};
  try {
    await performWrite({ kind: "receipt", path: output.receipt, bytes: Buffer.byteLength(serialized), incomingFiles: 2 },
      () => publishReceipt(storage, output.receipt, serialized, publication));
  } catch (cause) {
    const receiptSaved = receiptWasPublished(storage, output.receipt, serialized, publication.identity);
    throw Object.assign(cause, { execution: receipt, receipt_saved: receiptSaved, output_ref: receipt.output_ref,
      ...(receiptSaved ? { receipt_ref: output.receipt } : {}),
      ...(result.error ? { execution_error: result.error } : {}), exitCode: result.cancelled ? cancellationExit : 1 });
  }
  if (settlementError) throw Object.assign(settlementError, { output_ref: receipt.output_ref, receipt_ref: output.receipt, exitCode: 1 });
  if (result.error) throw Object.assign(result.error, { output_ref: output.output, receipt_ref: output.receipt, exitCode: result.error.code === "ABORT_ERR" ? cancellationExit : result.error.code === "ENOENT" ? 127 : 1 });
  return { ...receipt, exit, stdoutTruncated: result.truncated.stdout, stderrTruncated: result.truncated.stderr, receipt_ref: output.receipt,
    ...(outputDisposition === undefined ? {} : { output_disposition: outputDisposition }),
  };
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
    process.stderr.write(`${JSON.stringify({ code: error.code ?? "CAPTURE_FAILED", message: error.message, ...(error.output_ref ? { output_ref: error.output_ref } : {}), ...(error.receipt_ref ? { receipt_ref: error.receipt_ref } : {}), ...(error.execution ? { execution: error.execution, receipt_saved: error.receipt_saved } : {}) })}\n`);
    process.exitCode = error.exitCode ?? 1;
  });
}
