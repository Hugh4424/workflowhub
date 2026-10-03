// ADR015 ordinary TAP/source/account effects remain; old receipt/snapshot/official-run authentication retires.
import {afterEach,describe,expect,it} from "vitest";
import {spawnSync}from"node:child_process";import{createHash,randomUUID}from"node:crypto";import{mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync}from"node:fs";import{tmpdir}from"node:os";import{join}from"node:path";
import{reconcileCases}from"../../workflows/build-code/targeted-runner.mjs";
const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function identity(label) {
  const tag = `${label}-${randomUUID()}`;
  return { caseId: `CASE-${tag}`, fullId: `cancellation preserves account balance ${tag}`,
    criterion: `AC-${tag}` };
}
const selection = (v) => ({ status: "selected", cases: [{ id: v.caseId, acceptance_criterion_ids: [v.criterion],
  execution: { target: "cancel.test.mjs", expected_test_identity: v.fullId, runner: "node:test" } }] });
const reconcile = (v, observations, oracleEvidence = []) => reconcileCases({ selection: selection(v), observations, oracleEvidence,
  task: { task_id: `p10-${v.caseId}`, acceptance_criterion_ids: [v.criterion] } });
function rejectsFor(result, reason) {
  expect(result.status).not.toBe("reconciled");
  expect(result.reason, "a blanket unavailable/not_implemented response is not cause-specific rejection").toBe(reason);
  expect((result.entries ?? []).some(({ status }) => status === "passed")).toBe(false);
}
function expectsObservedSyntheticCase(result, v, evidence) {
  expect(result.status).toBe("unavailable");
  expect(result.reason).toBe("unauthenticated_business_oracle");
  expect(result.task_id).toBe(`p10-${v.caseId}`);
  expect(result.entries).toEqual([{
    case_id: v.caseId, acceptance_criterion_id: v.criterion, status: "observed",
    report_ref: evidence.report_ref, raw_report_sha256: evidence.raw_report_sha256,
    before_ref: evidence.before_ref, before_sha256: evidence.before_sha256,
    after_ref: evidence.after_ref, after_sha256: evidence.after_sha256,
  }]);
  for (const [ref, digest] of [[evidence.report_ref, evidence.raw_report_sha256],
    [evidence.before_ref, evidence.before_sha256], [evidence.after_ref, evidence.after_sha256]]) {
    expect(sha256(readFileSync(ref))).toBe(digest);
  }
}
function runCancellation(v, { charge = false, leaveActive = false, weakTest = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-effect-")));
  roots.push(root);
  const account = join(root, "account.json"), beforeRef = join(root, "before.json"), reportRef = join(root, "runner.tap");
  const beforeBytes = Buffer.from(JSON.stringify({ account_id: `acct-${v.caseId}`, balance_cents: 1200, cancelled: false }));
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
    `test(${JSON.stringify(v.fullId)}, () => {`,
    '  const before = JSON.parse(readFileSync("before.json", "utf8"));',
    '  cancel("account.json");',
    '  const after = JSON.parse(readFileSync("account.json", "utf8"));',
    ...(weakTest ? ['  assert.equal(after.account_id, before.account_id);'] : [
      '  assert.equal(after.balance_cents, before.balance_cents);',
      '  assert.equal(after.cancelled, true);',
    ]),
    '});',
  ].join("\n"));
  const child = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "cancel.test.mjs"],
    { cwd: root, encoding: "utf8", shell: false });
  if (child.error) throw child.error;
  const report = child.stdout + child.stderr;
  writeFileSync(reportRef, report);
  const afterBytes = readFileSync(account);
  const observedFullId = report.match(/^# Subtest: (.+)$/m)?.[1];
  const observedPass = report.includes(`ok 1 - ${v.fullId}`) && /# pass 1\b/.test(report)
    && /# fail 0\b/.test(report) && child.status === 0;
  const observation = { case_id: v.caseId, test_file: "cancel.test.mjs", full_id: observedFullId,
    status: observedPass ? "passed" : "failed", exit_code: child.status,
    report_ref: reportRef, raw_report_sha256: sha256(report) };
  const evidence = { case_id: v.caseId, acceptance_criterion_id: v.criterion, before_ref: beforeRef,
    before_sha256: sha256(beforeBytes), after_ref: account, after_sha256: sha256(afterBytes),
    report_ref: reportRef, raw_report_sha256: sha256(report),
    source_sha256: sha256(readFileSync(program)), target_sha256: sha256(readFileSync(target)),
    balance_before_cents: JSON.parse(beforeBytes).balance_cents,
    balance_after_cents: JSON.parse(afterBytes).balance_cents,
    cancelled: JSON.parse(afterBytes).cancelled };
  return { account, beforeRef, reportRef, child, observation, evidence };
}

describe("ORACLE-P10-CASE-RECONCILIATION: runner identity plus independently read effect", () => {
  it.each(["pending", "skipped", "todo", "failed"])("identifies a %s result", (status) => {
    const v = identity(status);
    rejectsFor(reconcile(v, [{ case_id: v.caseId, test_file: "cancel.test.mjs", full_id: v.fullId,
      status, raw_report_sha256: sha256("negative runner report"), exit_code: status === "failed" ? 1 : 0 }]), "nonpassing_runner_status");
  });
  it("identifies duplicate passed identities alongside a real successful effect", () => {
    const v = identity("duplicate"), { observation, evidence } = runCancellation(v);
    expect(observation.status).toBe("passed");
    rejectsFor(reconcile(v, [observation, observation], [evidence]), "duplicate_runner_identity");
  });
  it("identifies a passing reporter name without an independent business oracle", () => {
    const v = identity("no-oracle"), { observation } = runCancellation(v);
    expect(observation.status).toBe("passed");
    rejectsFor(reconcile(v, [observation]), "missing_business_oracle");
  });
  it.each(["charged", "active"])("rejects a passing weak-name child with wrong actual %s effect", (variant) => {
    const v = identity(variant), { account, beforeRef, child, observation, evidence } = runCancellation(v,
      { charge: variant === "charged", leaveActive: variant === "active", weakTest: true });
    expect(child.status).toBe(0);
    expect(observation.status).toBe("passed");
    expect(observation.full_id).toBe(v.fullId);
    expect(readFileSync(evidence.report_ref, "utf8")).toContain(`# pass 1`);
    const actual = JSON.parse(readFileSync(account)), before = JSON.parse(readFileSync(beforeRef));
    if (variant === "charged") expect(actual.balance_cents).toBe(before.balance_cents + 100);
    else expect(actual.cancelled).toBe(false);
    rejectsFor(reconcile(v, [observation], [evidence]), "business_effect_mismatch");
  });
  it.each(["forged-report", "wrong-identity", "missing-effect"])("identifies %s rather than trusting claimed success", (variant) => {
    const v = identity(variant), { account, observation, evidence } = runCancellation(v);
    expect(observation.status).toBe("passed");
    const reported = { ...observation }, observed = { ...evidence };
    if (variant === "forged-report") reported.raw_report_sha256 = sha256("forged report");
    if (variant === "wrong-identity") reported.full_id = `other-${randomUUID()}`;
    if (variant === "missing-effect") { rmSync(account); observed.after_sha256 = sha256("made-up account"); }
    const reasons = { "forged-report": "report_digest_mismatch", "wrong-identity": "runner_identity_mismatch", "missing-effect": "missing_effect_artifact" };
    rejectsFor(reconcile(v, [reported], [observed]), reasons[variant]);
  });
  it.each(["alpha", "beta"])("reconciles %s child TAP, distinct account artifacts and AC", (label) => {
    const v = identity(label), { account, beforeRef, reportRef, observation, evidence } = runCancellation(v);
    expect(observation.status).toBe("passed");
    expect(observation.full_id).toBe(v.fullId);
    expect(evidence.before_sha256).toBe(sha256(readFileSync(beforeRef)));
    expect(evidence.after_sha256).toBe(sha256(readFileSync(account)));
    expect(observation.raw_report_sha256).toBe(sha256(readFileSync(reportRef)));
    expect(JSON.parse(readFileSync(account)).cancelled).toBe(true);
    expect(JSON.parse(readFileSync(account)).balance_cents).toBe(JSON.parse(readFileSync(beforeRef)).balance_cents);
    const result = reconcile(v, [observation], [evidence]);
    expectsObservedSyntheticCase(result, v, evidence);
  });
  it("rejects a blanket unavailable result with no observed account or source entries", () => {
    const v = identity("blanket"), { observation, evidence } = runCancellation(v);
    const result = reconcile(v, [observation], [evidence]);
    expectsObservedSyntheticCase(result, v, evidence);
    expect(() => expectsObservedSyntheticCase({ ...result, entries: [] }, v, evidence)).toThrow();
  });
});

