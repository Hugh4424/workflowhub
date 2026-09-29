import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reconcileCases } from "../../../../../workflows/build-code/case-reconciliation.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const root = mkdtempSync(join(tmpdir(), "p10-reconcile-probe-"));
try {
  const title = "cancellation preserves account balance direct-probe";
  const report = `TAP version 13\n# Subtest: ${title}\nok 1 - ${title}\n1..1\n# tests 1\n# pass 1\n# fail 0\n# skipped 0\n# todo 0\n`;
  const before = JSON.stringify({ account_id: "acct", balance_cents: 1200, cancelled: false });
  const after = JSON.stringify({ account_id: "acct", balance_cents: 1200, cancelled: true });
  const reportRef = join(root, "report.tap"), beforeRef = join(root, "before.json"), afterRef = join(root, "after.json");
  writeFileSync(reportRef, report); writeFileSync(beforeRef, before); writeFileSync(afterRef, after);
  const selection = { status: "selected", cases: [{ id: "case", acceptance_criterion_ids: ["AC"],
    execution: { target: "cancel.test.mjs", expected_test_identity: title, runner: "node:test" } }] };
  const observations = [{ case_id: "case", test_file: "cancel.test.mjs", full_id: title,
    status: "passed", exit_code: 0, report_ref: reportRef, raw_report_sha256: hash(report) }];
  const oracleEvidence = [{ case_id: "case", acceptance_criterion_id: "AC", report_ref: reportRef,
    raw_report_sha256: hash(report), before_ref: beforeRef, before_sha256: hash(before),
    after_ref: afterRef, after_sha256: hash(after), balance_before_cents: 1200,
    balance_after_cents: 1200, cancelled: true }];
  const task = { task_id: "t", acceptance_criterion_ids: ["AC"] };
  const call = (observed = observations, proofs = oracleEvidence) => reconcileCases({
    selection, observations: observed, oracleEvidence: proofs, task,
  });
  const merelyObserved = call();
  assert.equal(merelyObserved.reason, "unauthenticated_business_oracle");
  assert.equal(merelyObserved.entries[0].status, "observed");
  assert.equal(call([{ ...observations[0], raw_report_sha256: hash("false") }]).reason,
    "report_digest_mismatch");
  const wrongAccount = JSON.stringify({ account_id: "other", balance_cents: 1200, cancelled: true });
  writeFileSync(afterRef, wrongAccount);
  assert.equal(call(observations, [{ ...oracleEvidence[0], after_sha256: hash(wrongAccount) }]).reason,
    "business_effect_mismatch");
  console.log(JSON.stringify({ valid_artifacts: merelyObserved.reason,
    observed_status: merelyObserved.entries[0].status, forged_report: "report_digest_mismatch",
    wrong_account: "business_effect_mismatch" }));
} finally { rmSync(root, { recursive: true, force: true }); }
