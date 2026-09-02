import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const root = resolve(import.meta.dirname, "../..");
const taskRoot = resolve(root, "specs/workflowhub-m16-evolution-20260831");
const reviewChain = resolve(root, "tests/fixtures/workflow-evolution/run-final-review-chain.mjs");
const reviewValidator = resolve(root, "tests/fixtures/workflow-evolution/validate-final-review-chain.mjs");
const aggregateRunner = resolve(root, "tests/fixtures/workflow-evolution/run-final-aggregate.sh");
const temporaryRoots = [];

afterEach(() => { while (temporaryRoots.length) rmSync(temporaryRoots.pop(), { recursive: true, force: true }); });

function currentMaterials() {
  return Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => [name, readFileSync(join(taskRoot, name), "utf8")]));
}

function currentMaterialSha() {
  const manifest = ["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => {
    const bytes = readFileSync(join(taskRoot, name));
    return { path: name, bytes: bytes.length, sha256: sha256(bytes) };
  });
  return sha256(JSON.stringify(manifest));
}

const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");

function runReview(requestPath, outputPath, extraEnv = {}) {
  return spawnSync(process.execPath, [reviewChain, join(taskRoot, "spec.md"), outputPath], {
    cwd: root,
    timeout: 5000,
    env: {
      ...process.env,
      WORKFLOWHUB_WH_REVIEW_REQUEST: requestPath,
      ...(extraEnv.WORKFLOWHUB_WH_REVIEW_CLI ? { WORKFLOWHUB_REVIEW_TEST_MODE: "1" } : {}),
      ...extraEnv,
    },
    encoding: "utf8",
  });
}

function writeCurrentMaterialsRequest(temp) {
  const request = join(temp, "request.json");
  writeFileSync(request, JSON.stringify({
    stage: "build-plan",
    review_subject: "current-materials",
    host_provider: "codex",
    providers: ["kimi"],
    materials: currentMaterials(),
  }));
  return request;
}

function validCurrentCodeMaterials(result) {
  const changedPath = "runtime/stage/stage-handlers.mjs";
  const testPath = "tests/contract/workflow-evolution-final-aggregate.test.mjs";
  const sourceBytes = readFileSync(join(root, changedPath));
  const testBytes = readFileSync(join(root, testPath));
  return {
    ...currentMaterials(),
    changed_files: [changedPath],
    implementation_assessment: {
      reviewed_files: [{ path: changedPath, state: "changed", bytes: sourceBytes.length, sha256: sha256(sourceBytes) }],
      implementation_sources: [{ path: changedPath, bytes: sourceBytes.length, sha256: sha256(sourceBytes), content: sourceBytes.toString("utf8") }],
    },
    test_context: {
      test_files: [{ path: testPath, bytes: testBytes.length, sha256: sha256(testBytes) }],
      commands: ["npx vitest run tests/contract/workflow-evolution-final-aggregate.test.mjs"],
      results: [result],
    },
    open_risks: { status: "incomplete", risks: ["fixture"] },
    implementation_diff: {
      format: "git-diff.v1",
      files: [changedPath],
      content: `diff --git a/${changedPath} b/${changedPath}\n@@ fixture\n`,
    },
    browser_evidence: { manifest: { status: "incomplete", reason: "fixture" }, screenshots: [] },
  };
}

function writeReviewCli(temp, source) {
  const cli = join(temp, "review-cli.mjs");
  writeFileSync(cli, source);
  return cli;
}

describe("M16 final aggregate review boundary", () => {
  it("requires an explicit task-owned output path", () => {
    const result = spawnSync(process.execPath, [reviewChain, join(taskRoot, "spec.md")], {
      cwd: root,
      env: { ...process.env, WORKFLOWHUB_WH_REVIEW_REQUEST: "" },
      encoding: "utf8",
    });
    expect(result.status).toBe(32);
    expect(JSON.parse(result.stdout)).toMatchObject({ error: { code: "REVIEW_OUTPUT_PATH_REQUIRED" } });
  });

  it.each([
    ["missing request file", "missing", "REVIEW_REQUEST_INVALID"],
    ["invalid request JSON", "not-json", "REVIEW_REQUEST_INVALID"],
  ])("classifies %s as invalid input (32) without leaking a host path", (label, content, code) => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    if (content !== "missing") writeFileSync(request, content);
    const result = runReview(request, output);
    expect(result.status, label).toBe(32);
    const serialized = readFileSync(output, "utf8");
    expect(serialized).not.toContain(temp);
    expect(JSON.parse(serialized)).toMatchObject({
      schema_version: "workflowhub-review-chain.v1",
      status: "unavailable",
      findings: [],
      error: { code },
    });
  });

  it("does not overwrite an existing review result when preflight fails", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-immutable-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    const oldBytes = "immutable old review\n";
    writeFileSync(request, "not-json");
    writeFileSync(output, oldBytes);
    const result = runReview(request, output);
    expect(result.status).toBe(32);
    expect(readFileSync(output, "utf8")).toBe(oldBytes);
  });

  it("rejects a request whose four materials are no longer current", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-stale-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    const materials = currentMaterials();
    materials["spec.md"] = `${materials["spec.md"]}\nold request\n`;
    writeFileSync(request, JSON.stringify({ stage: "verify-code", host_provider: "codex", providers: ["kimi"], materials }));
    const result = runReview(request, output);
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_MATERIAL_IDENTITY_MISMATCH" } });
  });

  it("rejects an external or symlinked spec path before reading task materials", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-root-binding-"));
    temporaryRoots.push(temp);
    const specAlias = join(temp, "spec.md");
    symlinkSync(join(taskRoot, "spec.md"), specAlias);
    const output = join(temp, "review.json");
    const request = join(temp, "request.json");
    writeFileSync(request, JSON.stringify({ stage: "build-plan", review_subject: "current-materials", host_provider: "codex", providers: ["kimi"], materials: currentMaterials() }));
    const result = spawnSync(process.execPath, [reviewChain, specAlias, output], {
      cwd: root, env: { ...process.env, WORKFLOWHUB_WH_REVIEW_REQUEST: request }, encoding: "utf8",
    });
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_MATERIAL_INVALID" } });
  });

  it("does not treat the current four planning materials as a verify-code review", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-scope-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    writeFileSync(request, JSON.stringify({ stage: "verify-code", host_provider: "codex", providers: ["kimi"], materials: currentMaterials() }));
    const result = runReview(request, output);
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({
      status: "unavailable",
      error: { code: "REVIEW_SCOPE_MISMATCH" },
    });
  });

  it("requires implementation, test, and browser bytes for the current-code subject", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-materials-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    writeFileSync(request, JSON.stringify({
      stage: "verify-code",
      review_subject: "current-code",
      host_provider: "codex",
      providers: ["kimi"],
      materials: {
        ...currentMaterials(),
        changed_files: "runtime/stage/stage-handlers.mjs",
        implementation_assessment: "current implementation assessment",
        test_context: "",
        open_risks: "none",
        implementation_diff: "",
        browser_evidence: "",
      },
    }));
    const result = runReview(request, output);
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({
      status: "unavailable",
      error: { code: "REVIEW_MATERIAL_INCOMPLETE" },
    });
    expect(readFileSync(output, "utf8")).toContain("test_context, implementation_diff, browser_evidence");
  });

  it.each([
    ["negative count", { scope: "focused", status: "passed", total_tests: -1, passed_tests: 1, failed_tests: 0, skipped_tests: 0 }],
    ["inconsistent total", { scope: "focused", status: "passed", total_tests: 2, passed_tests: 1, failed_tests: 0, skipped_tests: 0 }],
  ])("rejects current-code test receipts with %s", (_label, receipt) => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-test-counts-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    writeFileSync(request, JSON.stringify({ stage: "verify-code", review_subject: "current-code", host_provider: "codex", providers: ["kimi"], materials: validCurrentCodeMaterials(receipt) }));
    const result = runReview(request, output);
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_MATERIAL_INCOMPLETE" } });
    expect(readFileSync(output, "utf8")).toMatch(/test counts|non-negative/);
  });

  it("rejects current-code packets whose implementation bytes do not match their hash", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-hash-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    writeFileSync(request, JSON.stringify({
      stage: "verify-code",
      review_subject: "current-code",
      host_provider: "codex",
      providers: ["kimi"],
      materials: {
        ...currentMaterials(),
        changed_files: ["runtime/stage/stage-handlers.mjs"],
        implementation_assessment: {
          reviewed_files: [{ path: "runtime/stage/stage-handlers.mjs", state: "changed", bytes: 11, sha256: sha256("placeholder") }],
          implementation_sources: [{ path: "runtime/stage/stage-handlers.mjs", bytes: 11, sha256: "a".repeat(64), content: "placeholder" }],
        },
        test_context: { test_files: ["tests/contract/workflow-evolution-final-aggregate.test.mjs"], commands: ["test"], results: ["passed"] },
        open_risks: { status: "incomplete", risks: [] },
        implementation_diff: { format: "git-diff.v1", content: "diff", sha256: sha256("diff") },
        browser_evidence: { manifest: { status: "passed", checks: {} }, screenshots: [{ path: "screenshot.png", bytes: 1, sha256: "b".repeat(64) }] },
      },
    }));
    const result = runReview(request, output);
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_MATERIAL_INCOMPLETE" } });
    expect(readFileSync(output, "utf8")).toContain("hash-mismatched");
  });

  it("requires implementation sources to exactly cover changed files", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-source-coverage-"));
    temporaryRoots.push(temp);
    const request = join(temp, "request.json");
    const output = join(temp, "review.json");
    const changedPath = "runtime/stage/stage-handlers.mjs";
    const extraPath = "runtime/stage/stage-runner.mjs";
    const source = (path) => {
      const bytes = readFileSync(join(root, path));
      return { path, bytes: bytes.length, sha256: sha256(bytes), content: bytes.toString("utf8") };
    };
    writeFileSync(request, JSON.stringify({
      stage: "verify-code",
      review_subject: "current-code",
      host_provider: "codex",
      providers: ["kimi"],
      materials: {
        ...currentMaterials(),
        changed_files: [changedPath],
        implementation_assessment: {
          reviewed_files: [source(changedPath), source(extraPath)].map(({ path, bytes, sha256: digest }) => ({ path, bytes, sha256: digest, state: "changed" })),
          implementation_sources: [source(changedPath), source(extraPath)],
        },
        test_context: { test_files: ["tests/contract/workflow-evolution-final-aggregate.test.mjs"], commands: ["test"], results: ["passed"] },
        open_risks: { status: "incomplete", risks: [] },
        implementation_diff: { format: "git-diff.v1", content: "diff", sha256: sha256("diff") },
        browser_evidence: { manifest: { status: "incomplete", reason: "fixture" }, screenshots: [] },
      },
    }));
    const result = runReview(request, output);
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_MATERIAL_INCOMPLETE" } });
    expect(readFileSync(output, "utf8")).toContain("exactly cover changed_files");
  });

  it("rejects a legacy review result without an explicit review scope and packet identity", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-validator-"));
    temporaryRoots.push(temp);
    const output = join(temp, "review.json");
    writeFileSync(output, JSON.stringify({ schema_version: "workflowhub-review-chain.v1", status: "clean", findings: [], material_sha256: "a".repeat(64) }));
    const result = spawnSync(process.execPath, [reviewValidator, output], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(32);
  });

  it("accepts an honest unavailable review without a provider result", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-unavailable-"));
    temporaryRoots.push(temp);
    const output = join(temp, "review.json");
    writeFileSync(output, JSON.stringify({
      schema_version: "workflowhub-review-chain.v1",
      status: "unavailable",
      findings: [],
      material_sha256: "a".repeat(64),
      provider: "wh-review",
      error: { code: "REVIEW_REQUEST_MISSING", message: "request unavailable" },
    }));
    const result = spawnSync(process.execPath, [reviewValidator, output], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ status: "ok", review_status: "unavailable", findings: 0 });
  });

  it.each([
    ["timeout", "process.exit(124);", "REVIEW_EXECUTION_TIMEOUT"],
    ["cancel", "process.kill(process.pid, \"SIGTERM\");", "REVIEW_CANCELLED"],
    ["interrupted", "process.exit(137);", "REVIEW_EXECUTION_INTERRUPTED"],
    ["material mismatch", "process.stderr.write(JSON.stringify({ code: \"MATERIAL_INCOMPLETE\", message: \"review material is stale\" })); process.exit(1);", "MATERIAL_INCOMPLETE"],
  ])("preserves the review failure category for a provider process %s", (label, source, code) => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-provider-error-"));
    temporaryRoots.push(temp);
    const request = writeCurrentMaterialsRequest(temp);
    const output = join(temp, "review.json");
    const cli = writeReviewCli(temp, source);
    const result = runReview(request, output, { WORKFLOWHUB_WH_REVIEW_CLI: cli });
    expect(result.status, label).toBe(31);
    const receipt = JSON.parse(readFileSync(output, "utf8"));
    expect(receipt).toMatchObject({
      status: "unavailable",
      error: { code },
    });
    expect(readFileSync(output, "utf8")).not.toContain(temp);
    expect(readFileSync(output, "utf8")).not.toContain("REVIEW_PROVIDER_UNAVAILABLE");
  });

  it("classifies malformed provider output separately from provider availability", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-provider-output-"));
    temporaryRoots.push(temp);
    const request = writeCurrentMaterialsRequest(temp);
    const output = join(temp, "review.json");
    const cli = writeReviewCli(temp, "process.stdout.write(\"not-json\");");
    const result = runReview(request, output, { WORKFLOWHUB_WH_REVIEW_CLI: cli });
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_RESULT_INVALID" } });
    expect(readFileSync(output, "utf8")).not.toContain("REVIEW_PROVIDER_UNAVAILABLE");
  });

  it("bounds a hanging provider process and records a timeout", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-provider-timeout-"));
    temporaryRoots.push(temp);
    const request = writeCurrentMaterialsRequest(temp);
    const output = join(temp, "review.json");
    const cli = writeReviewCli(temp, "setTimeout(() => {}, 5000);");
    const result = runReview(request, output, {
      WORKFLOWHUB_WH_REVIEW_CLI: cli,
      WORKFLOWHUB_REVIEW_TIMEOUT_MS: "50",
    });
    expect(result.status).toBe(31);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_EXECUTION_TIMEOUT" } });
  });

  it("fails closed when the request changes while the provider is running", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-request-drift-"));
    temporaryRoots.push(temp);
    const request = writeCurrentMaterialsRequest(temp);
    const originalRequestBytes = readFileSync(request, "utf8");
    const output = join(temp, "review.json");
    const cli = writeReviewCli(temp, `import { readFileSync, writeFileSync } from "node:fs";
const requestPath = process.argv[3];
writeFileSync(requestPath, readFileSync(requestPath, "utf8") + "\\n");
process.stdout.write("not used");
`);
    const result = runReview(request, output, { WORKFLOWHUB_WH_REVIEW_CLI: cli });
    writeFileSync(request, originalRequestBytes);
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_REQUEST_DRIFT" } });
  });

  it("returns a structured redacted result when review receipt publication fails", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-write-error-"));
    temporaryRoots.push(temp);
    const request = writeCurrentMaterialsRequest(temp);
    const outputParent = join(temp, "output-parent");
    writeFileSync(outputParent, "not a directory");
    const output = join(outputParent, "review.json");
    const cli = writeReviewCli(temp, "process.stdout.write(\"not-json\");");
    const result = runReview(request, output, { WORKFLOWHUB_WH_REVIEW_CLI: cli });
    expect(result.status).toBe(32);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({ error: { code: "REVIEW_OUTPUT_WRITE_FAILED" } });
    expect(result.stdout).not.toContain(temp);
  });

  it("rejects a clean envelope without a semantic provider result", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-empty-clean-"));
    temporaryRoots.push(temp);
    const request = writeCurrentMaterialsRequest(temp);
    const output = join(temp, "review.json");
    const materialId = createSimpleReviewPacket({ stage: "build-plan", materials: currentMaterials() }).material_id;
    const cli = writeReviewCli(temp, `const materialId = ${JSON.stringify(materialId)}; process.stdout.write(JSON.stringify({ stage: "build-plan", material_id: materialId, status: "clean", findings: [] }));`);
    const result = runReview(request, output, { WORKFLOWHUB_WH_REVIEW_CLI: cli });
    expect(result.status).toBe(32);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ error: { code: "REVIEW_RESULT_INVALID" } });
  });

  it("accepts a clean result only when a semantic provider is attested", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-semantic-clean-"));
    temporaryRoots.push(temp);
    const request = writeCurrentMaterialsRequest(temp);
    const output = join(temp, "review.json");
    const materialId = createSimpleReviewPacket({ stage: "build-plan", materials: currentMaterials() }).material_id;
    const cli = writeReviewCli(temp, `const materialId = ${JSON.stringify(materialId)}; const identity = { provider: "fixture", adapter: "fixture", source_id: "fixture-source", config_id: "${"f".repeat(64)}" }; process.stdout.write(JSON.stringify({ stage: "build-plan", material_id: materialId, status: "available", outcome: "completed", runtime_id: "fixture-runtime", minimum_heterologous: 1, provider_selection: { providers: ["fixture"], provider_identities: { fixture: { source_id: "fixture-source", config_id: "${"f".repeat(64)}" } } }, provider_results: [{ provider: "fixture", identity, status: "completed", error: null, evidence_anchor_valid: [] }], findings: [] }));`);
    const result = runReview(request, output, { WORKFLOWHUB_WH_REVIEW_CLI: cli });
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({ status: "clean", findings: [] });
  });

  it("rejects a scoped review whose material hash is not the current task bytes", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-review-stale-hash-"));
    temporaryRoots.push(temp);
    const output = join(temp, "review.json");
    writeFileSync(output, JSON.stringify({
      schema_version: "workflowhub-review-chain.v1",
      status: "clean",
      findings: [],
      material_sha256: "a".repeat(64),
      current_material_sha256: "a".repeat(64),
      review_material_sha256: "b".repeat(64),
      review_subject: "current-materials",
      public_result: { stage: "build-plan", findings: [] },
    }));
    const result = spawnSync(process.execPath, [reviewValidator, output], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(32);
    expect(result.stderr).not.toMatch(/Error|at file:/);
  });

  it("executes the aggregate runner and stops after review failure", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-aggregate-"));
    temporaryRoots.push(temp);
    const marker = join(temp, "browser-ran");
    const gateLog = join(temp, "later-gates-ran");
    const browserScript = join(temp, "browser-pass.sh");
    const bin = join(temp, "bin");
    mkdirSync(bin);
    writeFileSync(browserScript, `#!/usr/bin/env bash
set -euo pipefail
printf passed > "$WORKFLOWHUB_BROWSER_MARKER"
`, { mode: 0o755 });
    for (const command of ["npx", "npm"]) {
      writeFileSync(join(bin, command), `#!/usr/bin/env bash
printf invoked >> "$WORKFLOWHUB_GATE_LOG"
`, { mode: 0o755 });
    }
    const aggregatePath = join(temp, "quality/tests/m16-final-aggregate.json");
    mkdirSync(join(temp, "quality/tests"), { recursive: true });
    writeFileSync(aggregatePath, "old aggregate bytes\n");

    const result = spawnSync("bash", [aggregateRunner], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        WORKFLOWHUB_TASK_ROOT: temp,
        WORKFLOWHUB_BROWSER_QA_SCRIPT: browserScript,
        WORKFLOWHUB_BROWSER_MARKER: marker,
        WORKFLOWHUB_GATE_LOG: gateLog,
        WORKFLOWHUB_WH_REVIEW_REQUEST: "",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(31);
    expect(readFileSync(marker, "utf8")).toBe("passed");
    expect(existsSync(gateLog)).toBe(false);
    expect(readFileSync(aggregatePath, "utf8")).toBe("old aggregate bytes\n");
    expect(JSON.parse(readFileSync(join(temp, "quality/tests/m16-final-aggregate/review.json"), "utf8"))).toMatchObject({
      status: "unavailable",
      error: { code: "REVIEW_REQUEST_MISSING" },
    });
  });

  it("publishes the clean aggregate after every injected gate succeeds", () => {
    const temp = mkdtempSync(join(tmpdir(), "workflowhub-final-aggregate-success-"));
    temporaryRoots.push(temp);
    const marker = join(temp, "browser-ran");
    const gateLog = join(temp, "later-gates-ran");
    const browserScript = join(temp, "browser-pass.sh");
    const reviewScript = join(temp, "review-pass.mjs");
    const bin = join(temp, "bin");
    mkdirSync(bin);
    writeFileSync(browserScript, `#!/usr/bin/env bash
set -euo pipefail
printf passed > "$WORKFLOWHUB_BROWSER_MARKER"
`, { mode: 0o755 });
writeFileSync(reviewScript, `import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
const output = process.argv[3];
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({
  schema_version: "workflowhub-review-chain.v1",
  status: "clean",
  findings: [],
  material_sha256: "${currentMaterialSha()}",
  current_material_sha256: "${currentMaterialSha()}",
  review_material_sha256: "b".repeat(64),
  review_subject: "current-materials",
  attempt_id: "fixture-attempt",
  owner: "run-final-review-chain:fixture-attempt",
  idempotency_key: "c".repeat(64),
  provider: "fixture",
  public_result: {
    stage: "build-plan", status: "clean", outcome: "completed", runtime_id: "fixture-runtime",
    minimum_heterologous: 1,
    provider_results: [{ provider: "fixture", status: "completed", error: null }],
    findings: [],
  },
}) + "\\n");
`);
    for (const command of ["npx", "npm"]) {
      writeFileSync(join(bin, command), `#!/usr/bin/env bash
printf invoked >> "$WORKFLOWHUB_GATE_LOG"
`, { mode: 0o755 });
    }

    const result = spawnSync("bash", [aggregateRunner], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        WORKFLOWHUB_TASK_ROOT: temp,
        WORKFLOWHUB_BROWSER_QA_SCRIPT: browserScript,
        WORKFLOWHUB_BROWSER_MARKER: marker,
        WORKFLOWHUB_GATE_LOG: gateLog,
        WORKFLOWHUB_REVIEW_CHAIN_SCRIPT: reviewScript,
        WORKFLOWHUB_WH_REVIEW_REQUEST: "",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(readFileSync(marker, "utf8")).toBe("passed");
    expect(readFileSync(gateLog, "utf8")).toBe("invokedinvokedinvoked");
    expect(JSON.parse(readFileSync(join(temp, "quality/tests/m16-final-aggregate.json"), "utf8"))).toMatchObject({
      schema_version: "workflow-evolution-final-aggregate.v1",
      status: "passed",
      browser_status: 0,
      focused_status: 0,
      repository_test_status: 0,
      repository_check_status: 0,
      review_ref: expect.stringMatching(/^quality\/reviews\/[a-f0-9]{64}\.json$/),
      review_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    const aggregate = JSON.parse(readFileSync(join(temp, "quality/tests/m16-final-aggregate.json"), "utf8"));
    expect(existsSync(join(temp, aggregate.review_ref))).toBe(true);
    expect(existsSync(join(temp, "quality/tests/m16-final-aggregate/review.json"))).toBe(false);
  });
});
