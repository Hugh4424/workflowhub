// Revised frozen P10/T021 target: P10-owned reconcileCases, not test-only accept().
// The original test and old RED remain in quality/evidence/prewritten-red/.
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reconcileCases } from "../../workflows/build-code/case-reconciliation.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const caseId = "CASE-CANCEL-NO-CHARGE";
const fullId = "cancellation preserves account balance";
const selection = { status: "selected", cases: [{ id: caseId, acceptance_criterion_ids: ["AC-33"],
  execution: { target: "cancel.test.mjs", expected_test_identity: fullId, runner: "node:test" } }] };
const negativeObservation = (status) => ({ case_id: caseId, test_file: "cancel.test.mjs",
  full_id: fullId, status, raw_report_sha256: sha256("negative runner report"), exit_code: status === "passed" ? 0 : 1 });
const reconcile = (observations, oracleEvidence = []) => reconcileCases({ selection, observations, oracleEvidence,
  task: { task_id: "p10-effect", acceptance_criterion_ids: ["AC-33"] } });

function runCancellation({ charge = false, leaveActive = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-effect-")));
  roots.push(root);
  const account = join(root, "account.json"), beforeRef = join(root, "before.json"), reportRef = join(root, "runner.tap");
  const beforeBytes = Buffer.from(JSON.stringify({ account_id: "acct-1", balance_cents: 1200, cancelled: false }));
  writeFileSync(account, beforeBytes);
  writeFileSync(beforeRef, beforeBytes);
  const program = join(root, "cancel.mjs"), target = join(root, "cancel.test.mjs");
  writeFileSync(program, [
    'import { readFileSync, writeFileSync } from "node:fs";',
    'export function cancel(accountRef) {',
    '  const account = JSON.parse(readFileSync(accountRef, "utf8"));',
    `  account.balance_cents += ${charge ? "100" : "0"};`,
    `  account.cancelled = ${leaveActive ? "false" : "true"};`,
    '  writeFileSync(accountRef, JSON.stringify(account));',
    '}',
  ].join("\n"));
  writeFileSync(target, [
    'import { test } from "node:test";',
    'import { strict as assert } from "node:assert";',
    'import { readFileSync } from "node:fs";',
    'import { cancel } from "./cancel.mjs";',
    `test(${JSON.stringify(fullId)}, () => {`,
    '  const before = JSON.parse(readFileSync("before.json", "utf8"));',
    '  cancel("account.json");',
    '  const after = JSON.parse(readFileSync("account.json", "utf8"));',
    '  assert.equal(after.balance_cents, before.balance_cents);',
    '  assert.equal(after.cancelled, true);',
    '});',
  ].join("\n"));
  const child = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "cancel.test.mjs"],
    { cwd: root, encoding: "utf8", shell: false });
  if (child.error) throw child.error;
  const report = child.stdout + child.stderr;
  writeFileSync(reportRef, report);
  const afterBytes = readFileSync(account);
  const observedFullId = report.match(/^# Subtest: (.+)$/m)?.[1];
  const observedPass = report.includes(`ok 1 - ${fullId}`) && /# pass 1\b/.test(report)
    && /# fail 0\b/.test(report) && child.status === 0;
  const observation = { case_id: caseId, test_file: "cancel.test.mjs", full_id: observedFullId,
    status: observedPass ? "passed" : "failed", exit_code: child.status,
    report_ref: reportRef, raw_report_sha256: sha256(report) };
  const evidence = { case_id: caseId, acceptance_criterion_id: "AC-33", before_ref: beforeRef,
    before_sha256: sha256(beforeBytes), after_ref: account, after_sha256: sha256(afterBytes),
    report_ref: reportRef, raw_report_sha256: sha256(report),
    source_sha256: sha256(readFileSync(program)), target_sha256: sha256(readFileSync(target)),
    balance_before_cents: JSON.parse(beforeBytes).balance_cents,
    balance_after_cents: JSON.parse(afterBytes).balance_cents,
    cancelled: JSON.parse(afterBytes).cancelled };
  return { account, beforeRef, reportRef, child, observation, evidence };
}

describe("ORACLE-P10-CASE-RECONCILIATION: runner identity plus independently read effect", () => {
  it.each(["pending", "skipped", "todo", "failed"])("never claims a %s result passed", (status) => {
    expect(reconcile([negativeObservation(status)]).entries.some((entry) => entry.status === "passed")).toBe(false);
  });

  it("rejects duplicate passed identities even alongside a real successful effect", () => {
    const { observation, evidence } = runCancellation();
    expect(observation.status).toBe("passed");
    const result = reconcile([observation, observation], [evidence]);
    expect(result.status).not.toBe("reconciled");
    expect(result.entries.some((entry) => entry.status === "passed")).toBe(false);
  });

  it("does not turn the actually passing runner name alone into a business oracle", () => {
    const { observation } = runCancellation();
    expect(observation.status).toBe("passed");
    expect(reconcile([observation]).entries.some((entry) => entry.status === "passed")).toBe(false);
  });

  it.each(["charged", "active", "forged-report", "wrong-identity", "missing-effect"])(
    "rejects %s instead of trusting claimed success", (variant) => {
      const { account, observation, evidence } = runCancellation({ charge: variant === "charged", leaveActive: variant === "active" });
      if (variant === "charged" || variant === "active") expect(observation.status).toBe("failed");
      const reported = { ...observation }, observed = { ...evidence };
      if (variant === "forged-report") reported.raw_report_sha256 = sha256("forged report");
      if (variant === "wrong-identity") reported.full_id = "other business test";
      if (variant === "missing-effect") { rmSync(account); observed.after_sha256 = sha256("made-up account"); }
      const result = reconcile([reported], [observed]);
      expect(result.entries.some((entry) => entry.status === "passed")).toBe(false);
    },
  );

  it("reconciles real child TAP identity with distinct before/after account artifacts and AC", () => {
    const { account, beforeRef, reportRef, observation, evidence } = runCancellation();
    expect(observation.status).toBe("passed");
    expect(observation.full_id).toBe(fullId);
    expect(evidence.before_sha256).toBe(sha256(readFileSync(beforeRef)));
    expect(evidence.after_sha256).toBe(sha256(readFileSync(account)));
    expect(observation.raw_report_sha256).toBe(sha256(readFileSync(reportRef)));
    expect(JSON.parse(readFileSync(account)).cancelled).toBe(true);
    expect(JSON.parse(readFileSync(account)).balance_cents).toBe(JSON.parse(readFileSync(beforeRef)).balance_cents);
    const result = reconcile([observation], [evidence]);
    expect(result.status, "stub is not a business-effect attestation").toBe("reconciled");
    expect(result.entries).toEqual(expect.arrayContaining([expect.objectContaining({
      case_id: caseId, acceptance_criterion_id: "AC-33", status: "passed",
    })]));
  });
});
