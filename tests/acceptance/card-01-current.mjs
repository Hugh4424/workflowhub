import { spawnSync } from "node:child_process";

const ACCEPTANCE_CRITERIA = [
  "AC-TYPE-001", "AC-TYPE-002", "AC-TYPE-003", "AC-TOPO-001", "AC-TOPO-002", "AC-MIG-001",
  "AC-PRD-001", "AC-PRD-002", "AC-PRD-003",
  "AC-FLOW-001", "AC-FLOW-002", "AC-FLOW-003",
  "AC-GATE-001", "AC-GATE-002", "AC-GATE-003", "AC-GATE-004",
  "AC-STATE-001", "AC-STATE-002", "AC-STATE-003",
  "AC-IFACE-001", "AC-IFACE-002", "AC-IFACE-003", "AC-REVIEW-001",
];

const ASSERTIONS = Object.freeze({
  "AC-TYPE-001": { file: "tests/contract/task-topology-projection.test.mjs", test: "keeps exactly the two human-controlled task type values" },
  "AC-TYPE-002": { file: "tests/contract/task-topology-projection.test.mjs", test: "uses the same declaration normalization for table and bullet syntax" },
  "AC-TYPE-003": { file: "tests/contract/task-topology-projection.test.mjs", test: "records an unknown task type attempt without inventing a topology" },
  "AC-TOPO-001": { file: "tests/contract/task-topology-projection.test.mjs", test: "projects the frozen planning and ordinary topologies without dynamic splicing" },
  "AC-TOPO-002": { file: "tests/contract/task-topology-projection.test.mjs", test: "authenticates a planning portable route and rejects an ordinary portable request" },
  "AC-MIG-001": { file: "tests/contract/activation-cohort.test.mjs", test: "freezes exactly three cohort fields and preserves in-flight pre topology" },
  "AC-PRD-001": { file: "tests/contract/portable-workflow-run.test.mjs", test: "loads exactly the six portable steps without importing the formal-stage validator" },
  "AC-PRD-002": { file: "tests/contract/portable-workflow-run.test.mjs", test: "records a succeeded terminal only when every portable step is complete" },
  "AC-PRD-003": { file: "tests/contract/portable-workflow-run.test.mjs", test: "preserves missing and malformed outcomes as failed terminal facts" },
  "AC-FLOW-001": { file: "tests/contract/zero-machine-gate-advancement.test.mjs", test: "lets the real make-decision entry continue and publish the stale aggregate as an unavailable fact" },
  "AC-FLOW-002": { file: "tests/contract/zero-machine-gate-advancement.test.mjs", test: "does not consume a missing supplied interaction receipt as a progress gate" },
  "AC-FLOW-003": { file: "tests/contract/zero-machine-gate-advancement.test.mjs", test: "turns stale interaction aggregation into a retained diagnostic instead of a make-decision work permit" },
  "AC-GATE-001": { file: "tests/contract/zero-machine-gate-advancement.test.mjs", test: "freezes the plan's five families and eighteen concrete predicates, not a made-up count of twenty-four" },
  "AC-GATE-002": { file: "tests/contract/stage-runtime-reflect-entry.test.mjs", test: "writes an executed judgment through the stage-end row transaction and keeps confirmation distinct from irreversible authorization" },
  "AC-GATE-003": { file: "tests/contract/zero-machine-gate-advancement.test.mjs", test: "does not downgrade a physically unreadable current material into a machine-binding diagnostic" },
  "AC-GATE-004": { file: "tests/contract/zero-machine-gate-advancement.test.mjs", test: "retains a malformed interaction aggregate as an unbound diagnostic instead of throwing" },
  "AC-STATE-001": { file: "tests/contract/portable-workflow-run.test.mjs", test: "uses the seven-value projection without making machine gaps blocked" },
  "AC-STATE-002": { file: "tests/contract/activation-cohort.test.mjs", test: "requires all three activation facts before selecting post" },
  "AC-STATE-003": { file: "tests/contract/portable-workflow-run.test.mjs", test: "appends a new terminal on re-entry and never starts a code-stage outcome" },
  "AC-IFACE-001": { file: "tests/contract/task-topology-projection.test.mjs", test: "drives planning build-prd status, doctor, and run through the public CLI entry" },
  "AC-IFACE-002": { file: "tests/contract/task-topology-projection.test.mjs", test: "authenticates public build-prd writes before an unknown type can append an attempt" },
  "AC-IFACE-003": { file: "tests/contract/task-topology-projection.test.mjs", test: "leaves parent and sibling fixture bytes untouched while a planning journey runs" },
  "AC-REVIEW-001": { file: "tests/contract/review-step-forward-progress.test.mjs", test: "keeps every existing formal-stage review scope as an independent forward-only step" },
});

const assertionIdentities = Object.values(ASSERTIONS).map(({ file, test }) => `${file}\u0000${test}`);
if (Object.keys(ASSERTIONS).length !== ACCEPTANCE_CRITERIA.length
    || ACCEPTANCE_CRITERIA.some((criterion) => !ASSERTIONS[criterion])
    || new Set(assertionIdentities).size !== ACCEPTANCE_CRITERIA.length) {
  throw new Error("CARD-01 acceptance assertions must cover every criterion exactly once");
}

// The TaskHandle lock recovery is not a CARD-01 product AC, but it is the
// review transport repair that makes the current independent review runnable.
// Keep it in the final targeted command without claiming it as an AC oracle.
const targetedTests = [...new Set([
  ...Object.values(ASSERTIONS).map(({ file }) => file),
  "tests/contract/task-handle.test.mjs",
  "tests/contract/stage-runtime-reflect-entry.test.mjs",
])];

const child = spawnSync("npx", [
  "--no-install", "vitest", "run", ...targetedTests,
  "--poolOptions.forks.singleFork", "--no-fileParallelism", "--reporter=json",
], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  timeout: 120000,
});
// The independent-review transport has its own failure boundary. Keep this
// one regression targeted (rather than broadening CARD-01 to the whole
// wh-review suite), because an unrecordable unavailable result is a false
// availability claim even when the product AC assertions are all green.
const reviewTransport = spawnSync("npx", [
  "--no-install", "vitest", "run",
  "skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs",
  "-t", "records a managed-observation identity gap as an unavailable failed member instead of crashing the recorder",
  "--poolOptions.forks.singleFork", "--no-fileParallelism", "--reporter=json",
], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  timeout: 120000,
});

let report = null;
try { report = JSON.parse(child.stdout ?? ""); } catch { /* emit actual parse failure below */ }
const observedResults = Array.isArray(report?.testResults) ? report.testResults : [];
const observedAssertion = ({ file, test }) => {
  const result = observedResults.find((entry) => String(entry?.name ?? "").replace(/\\/g, "/").endsWith(file));
  return result?.assertionResults?.find((assertion) => assertion?.title === test) ?? null;
};
const entries = ACCEPTANCE_CRITERIA.map((acceptance_criterion_id) => {
  const assertion = ASSERTIONS[acceptance_criterion_id];
  const observed = observedAssertion(assertion);
  return {
    acceptance_criterion_id,
    assertions: [{
      id: `${acceptance_criterion_id}:${assertion.test}`,
      expected: { status: "passed" },
      actual: { status: observed?.status ?? "missing" },
    }],
  };
});
const missingOrFailed = entries.filter(({ assertions }) => assertions.some(({ actual }) => actual.status !== "passed"));
const passed = child.status === 0 && report?.success === true && report?.numFailedTests === 0
  && reviewTransport.status === 0 && missingOrFailed.length === 0;

process.stdout.write(`${JSON.stringify({
  entries,
  ...(missingOrFailed.length ? { missing_or_failed_criteria: missingOrFailed.map(({ acceptance_criterion_id }) => acceptance_criterion_id) } : {}),
})}\n`);
process.exitCode = passed ? 0 : (child.status ?? 1) || 1;
