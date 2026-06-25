import { describe, it } from "vitest";
import { strict as assert } from "node:assert";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { runCapture } from "../workflows/build-code/capture.mjs";

const CAPTURE_MJS = fileURLToPath(new URL("../workflows/build-code/capture.mjs", import.meta.url));

function makeTmp() {
  return mkdtempSync(join(tmpdir(), "capture-test-"));
}

describe("runCapture", () => {
  // 1. Return shape
  it("returns object with all required keys", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    const result = await runCapture('node -e "process.exit(0)"', out);
    for (const key of [
      "command", "cwd", "git_sha", "exit_code", "timestamp",
      "test_files_line", "content_hash", "stdout_path", "stderr_path",
      "anomaly_flags", "warning",
    ]) {
      assert.ok(Object.prototype.hasOwnProperty.call(result, key), `missing key: ${key}`);
    }
  });

  it("writes JSON file at outputPath", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    await runCapture('node -e "process.exit(0)"', out);
    assert.ok(existsSync(out), "JSON file not written");
    const parsed = JSON.parse(readFileSync(out, "utf8"));
    assert.ok(parsed, "JSON not parseable");
  });

  // 2. exit_code is a real integer
  it("exit_code is a number for passing command", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    const result = await runCapture('node -e "process.exit(0)"', out);
    assert.strictEqual(typeof result.exit_code, "number");
    assert.strictEqual(result.exit_code, 0);
  });

  it("exit_code is a number for failing command", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    const result = await runCapture('node -e "process.exit(3)"', out);
    assert.strictEqual(typeof result.exit_code, "number");
    assert.strictEqual(result.exit_code, 3);
  });

  // 3. Failing command still writes file and does NOT throw
  it("failing command (exit 3) still writes JSON and does not throw", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    let result;
    await assert.doesNotReject(async () => {
      result = await runCapture('node -e "process.exit(3)"', out);
    });
    assert.ok(existsSync(out), "JSON file missing after non-zero exit");
    assert.strictEqual(result.exit_code, 3);
  });

  // 4. content_hash is sha256 hex, idempotent, and changes with different output
  it("content_hash is a 64-char hex string", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    const result = await runCapture('node -e "console.log(\'hello\')"', out);
    assert.match(result.content_hash, /^[0-9a-f]{64}$/, "not a sha256 hex");
  });

  it("content_hash is idempotent for same command output", async () => {
    const dir1 = makeTmp();
    const dir2 = makeTmp();
    const cmd = 'node -e "console.log(\'stable output\')"';
    const r1 = await runCapture(cmd, join(dir1, "r.json"));
    const r2 = await runCapture(cmd, join(dir2, "r.json"));
    assert.strictEqual(r1.content_hash, r2.content_hash);
  });

  it("content_hash differs for different command output", async () => {
    const dir1 = makeTmp();
    const dir2 = makeTmp();
    const r1 = await runCapture('node -e "console.log(\'aaa\')"', join(dir1, "r.json"));
    const r2 = await runCapture('node -e "console.log(\'bbb\')"', join(dir2, "r.json"));
    assert.notStrictEqual(r1.content_hash, r2.content_hash);
  });

  // 5. test_files_line extracted from stdout
  it("test_files_line captures the 'Test Files' line from stdout", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    const cmd = 'node -e "console.log(\'Test Files  1 passed (1)\')"';
    const result = await runCapture(cmd, out);
    assert.strictEqual(result.test_files_line, "Test Files  1 passed (1)");
  });

  it("test_files_line is null when no 'Test Files' line present", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    const cmd = 'node -e "console.log(\'no match here\')"';
    const result = await runCapture(cmd, out);
    assert.strictEqual(result.test_files_line, null);
  });

  // 5b. prefix-vs-substring falsifiability: substring but NOT prefix must not be captured
  it("test_files_line is null when stdout contains 'Test Files' as substring but NOT at line start", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    // "note: not a Test Files line" contains "Test Files" but doesn't start with it
    const cmd = 'node -e "console.log(\'note: not a Test Files line\')"';
    const result = await runCapture(cmd, out);
    assert.strictEqual(result.test_files_line, null, "substring-only match must not capture test_files_line");
    // exit===0 and test_files_line===null => green_test_files_empty should fire
    assert.ok(
      result.anomaly_flags.includes("green_test_files_empty"),
      `expected 'green_test_files_empty' anomaly for missing prefix line, got: ${JSON.stringify(result.anomaly_flags)}`
    );
  });

  // 5c. positive prefix case: a line starting with "Test Files" IS correctly captured
  it("test_files_line is captured when line starts with 'Test Files'", async () => {
    const dir = makeTmp();
    const out = join(dir, "result.json");
    const cmd = 'node -e "console.log(\'Test Files  1 passed (1)\')"';
    const result = await runCapture(cmd, out);
    assert.strictEqual(result.test_files_line, "Test Files  1 passed (1)", "prefix line must be captured");
    assert.ok(
      !result.anomaly_flags.includes("green_test_files_empty"),
      "green_test_files_empty must NOT fire when Test Files line is present"
    );
  });

  // 6. outputPath parent dir auto-created
  it("auto-creates nested output directory if missing", async () => {
    const base = makeTmp();
    const nested = join(base, "deep", "nested", "dir");
    const out = join(nested, "result.json");
    await assert.doesNotReject(async () => {
      await runCapture('node -e "process.exit(0)"', out);
    });
    assert.ok(existsSync(out), "file not written to auto-created nested dir");
  });

  // 7a. anomaly_flags: suspicious_red_exit
  it("anomaly_flags includes 'suspicious_red_exit' when exit≠0 and hash matches redBaselineHash", async () => {
    // First run to get the hash
    const dir1 = makeTmp();
    const cmd = 'node -e "console.log(\'unchanged output\')"';
    const r1 = await runCapture(cmd, join(dir1, "r.json"));
    const redBaselineHash = r1.content_hash;

    // Now run with same output but exit 1
    const dir2 = makeTmp();
    const failCmd = `node -e "console.log('unchanged output'); process.exit(1)"`;
    const r2 = await runCapture(failCmd, join(dir2, "r.json"), { redBaselineHash });
    assert.ok(
      Array.isArray(r2.anomaly_flags),
      "anomaly_flags must be an array"
    );
    assert.ok(
      r2.anomaly_flags.includes("suspicious_red_exit"),
      `expected 'suspicious_red_exit' in anomaly_flags, got: ${JSON.stringify(r2.anomaly_flags)}`
    );
  });

  // 7b. anomaly_flags: suspicious_green_exit
  it("anomaly_flags includes 'suspicious_green_exit' when exit===0 and hash matches redBaselineHash", async () => {
    const dir1 = makeTmp();
    const cmd = 'node -e "console.log(\'same output\')"';
    const r1 = await runCapture(cmd, join(dir1, "r.json"));
    const redBaselineHash = r1.content_hash;

    const dir2 = makeTmp();
    const r2 = await runCapture(cmd, join(dir2, "r.json"), { redBaselineHash });
    assert.ok(Array.isArray(r2.anomaly_flags), "anomaly_flags must be an array");
    assert.ok(
      r2.anomaly_flags.includes("suspicious_green_exit"),
      `expected 'suspicious_green_exit' in anomaly_flags, got: ${JSON.stringify(r2.anomaly_flags)}`
    );
  });

  // 7c. anomaly_flags: green_test_files_empty
  it("anomaly_flags includes 'green_test_files_empty' when exit===0 and no 'Test Files' line", async () => {
    const dir = makeTmp();
    const cmd = 'node -e "console.log(\'no test files line here\')"';
    const result = await runCapture(cmd, join(dir, "r.json"));
    assert.strictEqual(result.exit_code, 0);
    assert.strictEqual(result.test_files_line, null);
    assert.ok(Array.isArray(result.anomaly_flags), "anomaly_flags must be an array");
    assert.ok(
      result.anomaly_flags.includes("green_test_files_empty"),
      `expected 'green_test_files_empty' in anomaly_flags, got: ${JSON.stringify(result.anomaly_flags)}`
    );
  });

  // 8. warning field contains each present flag name when anomaly_flags non-empty
  it("warning contains flag name when anomaly_flags is non-empty (suspicious_green_exit)", async () => {
    const dir1 = makeTmp();
    const cmd = 'node -e "console.log(\'same\')"';
    const r1 = await runCapture(cmd, join(dir1, "r.json"));
    const redBaselineHash = r1.content_hash;

    const dir2 = makeTmp();
    const r2 = await runCapture(cmd, join(dir2, "r.json"), { redBaselineHash });
    assert.ok(
      typeof r2.warning === "string" && r2.warning.includes("suspicious_green_exit"),
      `expected warning to contain 'suspicious_green_exit', got: ${JSON.stringify(r2.warning)}`
    );
  });

  it("warning contains flag name 'suspicious_red_exit' when that flag is present", async () => {
    const dir1 = makeTmp();
    const cmd = 'node -e "console.log(\'red output\')"';
    const r1 = await runCapture(cmd, join(dir1, "r.json"));
    const redBaselineHash = r1.content_hash;

    const dir2 = makeTmp();
    const failCmd = `node -e "console.log('red output'); process.exit(1)"`;
    const r2 = await runCapture(failCmd, join(dir2, "r.json"), { redBaselineHash });
    assert.ok(
      typeof r2.warning === "string" && r2.warning.includes("suspicious_red_exit"),
      `expected warning to contain 'suspicious_red_exit', got: ${JSON.stringify(r2.warning)}`
    );
  });

  it("warning contains 'green_test_files_empty' when that flag is present", async () => {
    const dir = makeTmp();
    const cmd = 'node -e "console.log(\'no test files info\')"';
    const result = await runCapture(cmd, join(dir, "r.json"));
    assert.ok(
      typeof result.warning === "string" && result.warning.includes("green_test_files_empty"),
      `expected warning to contain 'green_test_files_empty', got: ${JSON.stringify(result.warning)}`
    );
  });

  // Confirm anomaly_flags is empty array (not null/undefined) when no anomalies
  it("anomaly_flags is empty array when no anomalies and exit===0 with Test Files line", async () => {
    const dir = makeTmp();
    const cmd = 'node -e "console.log(\'Test Files  5 passed (5)\')"';
    const result = await runCapture(cmd, join(dir, "r.json"));
    assert.ok(Array.isArray(result.anomaly_flags), "anomaly_flags must be array");
    assert.strictEqual(result.anomaly_flags.length, 0, "expected empty anomaly_flags");
  });
});

describe("capture.mjs CLI subprocess", () => {
  it("--help prints usage and exits 0", () => {
    const proc = spawnSync(process.execPath, [CAPTURE_MJS, "--help"], { encoding: "utf8" });
    assert.strictEqual(proc.status, 0, `expected exit 0, got ${proc.status}`);
    assert.ok(
      proc.stdout.includes("Usage:"),
      `expected 'Usage:' in stdout, got: ${proc.stdout}`
    );
  });

  it("missing args prints usage and exits 0", () => {
    const proc = spawnSync(process.execPath, [CAPTURE_MJS], { encoding: "utf8" });
    assert.strictEqual(proc.status, 0, `expected exit 0, got ${proc.status}`);
    assert.ok(proc.stdout.includes("Usage:"), `expected 'Usage:' in stdout, got: ${proc.stdout}`);
  });

  it("valid invocation writes JSON file and prints JSON to stdout", () => {
    const dir = mkdtempSync(join(tmpdir(), "capture-cli-test-"));
    const outputPath = join(dir, "result.json");
    const cmd = `node -e "console.log('Test Files  1 passed (1)')"`;
    const proc = spawnSync(
      process.execPath,
      [CAPTURE_MJS, cmd, outputPath],
      { encoding: "utf8" }
    );
    assert.strictEqual(proc.status, 0, `CLI exited ${proc.status}; stderr: ${proc.stderr}`);
    assert.ok(existsSync(outputPath), "output JSON file not created");
    const parsed = JSON.parse(readFileSync(outputPath, "utf8"));
    assert.strictEqual(typeof parsed.exit_code, "number", "exit_code must be a number");
    const stdoutParsed = JSON.parse(proc.stdout);
    assert.strictEqual(typeof stdoutParsed.exit_code, "number", "stdout JSON exit_code must be a number");
  });
});
