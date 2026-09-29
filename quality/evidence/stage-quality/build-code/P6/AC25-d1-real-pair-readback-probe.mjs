// Read-only diagnostic for the historical AC-25 pair. This is not a public
// WorkflowHub command or a canonical receipt producer.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { openTask } from "../../../../../runtime/task/task-handle.mjs";

const TASK_ID = "workflowhub-thin-core-card-04-20260919";
const PAIR_ID = "d1fd1157-3519-4258-88be-a772415f39ca";
const TASK_DIR = process.argv[2] ?? `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/${TASK_ID}`;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const READER_PATH = resolve(ROOT, "runtime/review/review-record-route.mjs");
const RED_REF = "quality/reviews/attempts/5f798a09-caee-5912-ae05-a1cf5ea88968/attempt.json";
const BLUE_REF = "quality/reviews/attempts/04df852d-39a7-5ae0-a133-06e0b1964d10/attempt.json";
const PAIR_REF = "quality/reviews/reports/make-decision-simple-1a2e192a-6ef7-5780-ac4f-d896b539d28a.md";
const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");

const task = openTask(TASK_DIR, "workflowhub", TASK_ID);
const inventory = task.listCanonicalReviewAttemptRefs();
if (!inventory.includes(RED_REF) || !inventory.includes(BLUE_REF)) {
  throw new Error("specified pair members are absent from the authenticated TaskHandle inventory");
}
const read = (ref) => {
  const raw = task.readRecord(ref);
  return { ref, sha256: sha256(raw), bytes: Buffer.byteLength(raw) };
};
const red = JSON.parse(task.readRecord(RED_REF));
const blue = JSON.parse(task.readRecord(BLUE_REF));
if (red.pair_id !== PAIR_ID || blue.pair_id !== PAIR_ID || red.role !== "red" || blue.role !== "blue") {
  throw new Error("specified pair identities do not match the stored attempts");
}
const summaryText = task.readRecord(PAIR_REF);
const summary = JSON.parse(summaryText.match(/```json\n([\s\S]*?)\n```/)?.[1] ?? "null");
if (summary?.pair_id !== PAIR_ID) throw new Error("specified pair summary identity is invalid");

const records = [RED_REF, BLUE_REF, red.report_ref, blue.report_ref, red.result_ref, PAIR_REF,
  ...red.provider_attempts.map((item) => item.output_ref).filter(Boolean),
  ...blue.provider_attempts.map((item) => item.output_ref).filter(Boolean)].map(read);

// The reader is private. Export only an in-memory copy of the current source;
// turn its existing report-binding throw into the same throw plus a diagnostic
// global. The canonical Task store and repository runtime source stay untouched.
const readerSource = readFileSync(READER_PATH, "utf8");
let memorySource = readerSource.replace(/from "(\.{1,2}\/[^\"]+)"/g,
  (_, relative) => `from "${pathToFileURL(resolve(dirname(READER_PATH), relative)).href}"`);
const bindingThrow = 'throw new Error("canonical review report binding is invalid");';
if (memorySource.split(bindingThrow).length !== 2) throw new Error("reader diagnostic anchor changed");
memorySource = memorySource.replace(bindingThrow, `globalThis.__ac25_d1_binding = {
  attempt_ref: ref, attempt_report_ref: attempt.report_ref,
  prepared_attempt_ref: prepared.refs.attempt_ref,
  prepared_report_ref: prepared.refs.report_ref,
  saved_semantic_status: saved.semantic_status,
  prepared_semantic_status: prepared.semantic_status,
  saved_coverage: saved.coverage,
  prepared_coverage: prepared.coverage
}; ${bindingThrow}`);
memorySource += "\nexport { readCanonicalReviewHistory };\n";
const { readCanonicalReviewHistory } = await import(`data:text/javascript;base64,${Buffer.from(memorySource).toString("base64")}`);
const scope = {
  stage: blue.stage,
  snapshotTree: blue.snapshot_tree,
  materialRevision: blue.material_revision,
  reviewTrack: blue.review_track ?? null,
  reviewKind: blue.review_kind ?? null,
  subjectKind: blue.subject_kind ?? "worktree",
  reviewScope: blue.review_scope ?? null,
  phaseId: blue.phase_id ?? null,
  subjectSha256: blue.closure_manifest?.subject_sha256,
};
let readback;
try {
  const entries = readCanonicalReviewHistory(task, scope);
  const pair = entries.find((entry) => entry.pairSummary?.pair_id === PAIR_ID);
  readback = { ok: Boolean(pair), entry_count: entries.length,
    pair: pair ? { pair_id: pair.pairSummary.pair_id, fact: pair.fact,
      role_results: pair.pairSummary.role_results } : null };
} catch (error) {
  readback = { ok: false, error_name: error.name, error_message: error.message,
    review_attempt_ref: error.review_attempt_ref ?? null,
    binding_diagnostic: globalThis.__ac25_d1_binding ?? null };
  process.exitCode = 1;
}
console.log(JSON.stringify({
  probe: "AC25-d1-real-pair-readback",
  mode: "read-only TaskHandle + private reader in-memory export; not public verify or canonical receipt",
  task_dir: TASK_DIR,
  task_identity: task.identity,
  reader_source: { path: READER_PATH, sha256: sha256(readerSource) },
  pair_id: PAIR_ID,
  scope,
  stored: {
    red: { attempt_ref: RED_REF, terminal_status: red.terminal_status,
      result_ref: red.result_ref, report_ref: red.report_ref },
    blue: { attempt_ref: BLUE_REF, terminal_status: blue.terminal_status,
      result_ref: blue.result_ref ?? null, report_ref: blue.report_ref },
    summary: { ref: PAIR_REF, semantic_status: summary.semantic_status,
      partial: summary.partial, role_results: summary.role_results },
  },
  records,
  readback,
}, null, 2));
