import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reconcileCases } from "../../../../../workflows/build-code/case-reconciliation.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const root = mkdtempSync(join(tmpdir(), "p10-extra-observation-"));
try {
  const title = "cancellation preserves account balance A";
  const report = `TAP version 13\n# Subtest: ${title}\nok 1 - ${title}\n1..1\n# tests 1\n# pass 1\n# fail 0\n# skipped 0\n# todo 0\n`;
  const before = JSON.stringify({ account_id: "acct", balance_cents: 1200, cancelled: false });
  const after = JSON.stringify({ account_id: "acct", balance_cents: 1200, cancelled: true });
  const reportRef = join(root, "report.tap");
  const beforeRef = join(root, "before.json");
  const afterRef = join(root, "after.json");
  writeFileSync(reportRef, report);
  writeFileSync(beforeRef, before);
  writeFileSync(afterRef, after);
  const selection = { status: "selected", cases: [{ id: "A", acceptance_criterion_ids: ["AC-A"],
    execution: { target: "cancel.test.mjs", expected_test_identity: title, runner: "node:test" } }] };
  const a = { case_id: "A", test_file: "cancel.test.mjs", full_id: title, status: "passed",
    exit_code: 0, report_ref: reportRef, raw_report_sha256: hash(report) };
  const b = { case_id: "B", test_file: "extra.test.mjs", full_id: "unique extra B",
    status: "passed", exit_code: 0 };
  const oracleEvidence = [{ case_id: "A", acceptance_criterion_id: "AC-A", report_ref: reportRef,
    raw_report_sha256: hash(report), before_ref: beforeRef, before_sha256: hash(before),
    after_ref: afterRef, after_sha256: hash(after), balance_before_cents: 1200,
    balance_after_cents: 1200, cancelled: true }];
  const task = { task_id: "task", acceptance_criterion_ids: ["AC-A"] };
  const call = (observations) => reconcileCases({ selection, observations, oracleEvidence, task });
  const baseline = call([a]);
  assert.equal(baseline.reason, "unauthenticated_business_oracle");
  assert.equal(baseline.entries[0].status, "observed");
  const uniqueExtra = call([a, b]);
  console.log(JSON.stringify({ unique_extra: uniqueExtra.reason,
    unique_extra_entries: uniqueExtra.entries,
    baseline: baseline.reason }));
  assert.equal(uniqueExtra.reason, "runner_identity_mismatch");
  assert.equal(uniqueExtra.status, "unavailable");
  assert.ok(uniqueExtra.entries.every((entry) => entry.status !== "passed"));
  const duplicate = call([a, { ...a }]);
  assert.equal(duplicate.reason, "duplicate_runner_identity");
  assert.ok(duplicate.entries.every((entry) => entry.status !== "passed"));
  console.log(JSON.stringify({ duplicate: duplicate.reason, passed_entries: 0 }));
} finally {
  rmSync(root, { recursive: true, force: true });
}
