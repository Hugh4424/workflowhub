import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { validatePostPhaseContract } from "../../runtime/stage/stage-content-contracts.mjs";
import { inspectMaterialWorkspace } from "../../runtime/task/material-workspace.mjs";

// T011 is the one current-snapshot producer. Each achieved result is derived
// from a named child assertion; deferred and unavailable results additionally
// read their current task-material boundary. A green process exit alone must
// never promote this declaration into an AC result.
export const ACCEPTANCE_CRITERIA = Object.freeze([
  "AC-DOC-001", "AC-DOC-002", "AC-DOC-003", "AC-DOC-004", "AC-DOC-005", "AC-OI-001",
  "AC-TEST-001", "AC-TEST-002", "AC-TEST-003", "AC-TEST-004",
  "AC-REVIEW-001", "AC-REVIEW-002", "AC-REVIEW-003",
  "AC-AUTH-001", "AC-AUTH-002", "AC-FLOW-001", "AC-FLOW-002", "AC-FLOW-003",
  "AC-COVER-001", "AC-COVER-002", "AC-CLEAN-001", "AC-HANDOFF-001",
]);

export const TEST_ASSERTIONS = Object.freeze({
  "AC-DOC-003": { commandIndex: 0, file: "tests/acceptance/card-02-current.test.mjs", test: "validates independent post Phase files and rejects missing authority" },
  "AC-DOC-004": { commandIndex: 0, file: "tests/acceptance/card-02-current.test.mjs", test: "rejects index body copy and missing pointer" },
});

const STRUCTURE_ONLY_ACCEPTANCE_GAPS = Object.freeze({
  "AC-DOC-003": "independent weak-model implementation cold read and complete original Phase-field proof are missing",
  "AC-DOC-004": "real index-reader consumer and semantic-anchor readback proof are missing",
});

export const NON_ACHIEVED_READBACKS = Object.freeze({
  "AC-DOC-001": { outcome: "incomplete", owner: "CARD-02", reason: "no filled decision-log fixture proves unique ADR/OI/raw-source authority" },
  "AC-DOC-002": { outcome: "incomplete", owner: "CARD-02", reason: "no filled spec fixture proves narrative-to-Appendix-A pointers without duplicate acceptance prose" },
  "AC-DOC-005": { outcome: "incomplete", owner: "CARD-02", reason: "the four translated spec contents and their FR/AC/source pointers lack semantic readback" },
  "AC-OI-001": { outcome: "incomplete", owner: "CARD-02", reason: "reconstruct, reveal, challenge, confirmation, and build-plan OI projection are not tested as one lifecycle" },
  "AC-TEST-001": { outcome: "incomplete", owner: "CARD-02", reason: "all 22 original acceptance cards have not been checked for four observable parts and V0=0" },
  "AC-TEST-002": { outcome: "incomplete", owner: "CARD-02", reason: "frozen-test tampering and authorized test-change review are not exercised" },
  "AC-TEST-003": { outcome: "incomplete", owner: "CARD-02", reason: "the older dual-phase handoff fixture does not prove separate physical Phase files with a target-assertion RED" },
  "AC-TEST-004": {
    outcome: "deferred", owner: "CARD-10",
    reason: "real Luna E2E is explicitly deferred; the fixture proves only the deferred boundary",
    materialMarkers: ["AC-TEST-004", "real Luna E2E", "CARD-10"],
  },
  "AC-REVIEW-001": {
    outcome: "unavailable", owner: "wh-review",
    reason: "the current review route is inspected separately; no semantic provider result exists yet",
    materialMarkers: ["AC-REVIEW-001", "semantic_review_status=incomplete", "REVIEW_WAIT_EXCEEDED"],
  },
  "AC-REVIEW-002": {
    outcome: "unavailable", owner: "wh-review",
    reason: "there are no current semantic findings to dispose",
    materialMarkers: ["AC-REVIEW-002", "provider semantic result", "P1 `REVIEW_WAIT_EXCEEDED`"],
  },
  "AC-REVIEW-003": {
    outcome: "deferred", owner: "CARD-05",
    reason: "the real provider comparison remains owned by CARD-05",
    materialMarkers: ["AC-REVIEW-003", "CARD-05", "deferred"],
  },
  "AC-AUTH-001": { outcome: "incomplete", owner: "CARD-02", reason: "known-inventory ID and four-class authority samples lack current-material readback" },
  "AC-AUTH-002": { outcome: "incomplete", owner: "CARD-02", reason: "no one-authority product-goal change-propagation diff has been checked" },
  "AC-FLOW-001": { outcome: "incomplete", owner: "CARD-02", reason: "13-step semantic migration and net-zero public surface were not proved by the mapped review test" },
  "AC-FLOW-002": { outcome: "incomplete", owner: "CARD-02", reason: "K1-K12 lack individual real-consumer and oracle replay evidence" },
  "AC-FLOW-003": { outcome: "incomplete", owner: "CARD-02", reason: "physical Phase files are tested, but active writer/reader/validator dual-write census is not complete" },
  "AC-COVER-001": { outcome: "incomplete", owner: "CARD-02", reason: "five failure fixtures exist, but current complete inventory and confirmation-path readback are not bound to this AC" },
  "AC-COVER-002": { outcome: "incomplete", owner: "CARD-02", reason: "one-parser behavior exists, but both current decision logs have not been read back as 24 blocks and 96 fields" },
  "AC-CLEAN-001": { outcome: "incomplete", owner: "CARD-02", reason: "writer removal test alone does not establish absence of all active aggregate inputs, consumers and completion dependencies" },
  "AC-HANDOFF-001": { outcome: "incomplete", owner: "CARD-02", reason: "deferred and unavailable items lack a complete owner, trigger, handoff target, close condition and state readback" },
});

const mappedCriteria = [...Object.keys(TEST_ASSERTIONS), ...Object.keys(NON_ACHIEVED_READBACKS)];
if (mappedCriteria.length !== ACCEPTANCE_CRITERIA.length || new Set(mappedCriteria).size !== ACCEPTANCE_CRITERIA.length
    || ACCEPTANCE_CRITERIA.some((id) => !mappedCriteria.includes(id))) {
  throw new Error("CARD-02 acceptance observations must cover every criterion exactly once");
}

const commands = Object.freeze([
  ["npx", ["--no-install", "vitest", "run", "tests/acceptance/card-02-current.test.mjs", "-t",
    "validates independent post Phase files|rejects index body copy|rejects post plan/tasks dual write",
    "--poolOptions.forks.singleFork", "--no-fileParallelism", "--reporter=verbose"], 300000],
]);

const POST_PHASE_ACS = new Set(["AC-DOC-003", "AC-DOC-004", "AC-FLOW-003"]);
const ORIGINAL_REQUIREMENT_TRACE = Object.freeze({
  "AC-DOC-003": "specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md#R-002/AC-08",
  "AC-DOC-004": "specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md#R-002/AC-08",
  "AC-FLOW-003": "specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md#R-002/AC-09",
});

export function evaluateCard02PostPhaseEvidence({ spec, index, phases, legacyFiles = [] } = {}) {
  const errors = [];
  if (legacyFiles.includes("plan.md") || legacyFiles.includes("tasks.md")) errors.push("post task still has active plan.md/tasks.md");
  if (typeof index === "string" && (/`(?:gate_cmd|expected_exit|oracle|evidence_path)`\s*[:：]/i.test(index)
      || /^##\s+L[012]\b/m.test(index) || /```/.test(index))) {
    errors.push("post Phase index copies executable or contract body");
  }
  const result = validatePostPhaseContract({ spec, index, phases });
  errors.push(...result.errors);
  return { ok: errors.length === 0, errors, phase_count: result.facts?.phase_count ?? 0 };
}

export function readCard02PostPhaseEvidence(root) {
  const resolvedRoot = resolve(root);
  let inspection;
  try { inspection = inspectMaterialWorkspace(resolvedRoot, { activationCohort: "post" }); }
  catch (error) { return { ok: false, errors: [`post material read failed: ${error.message}`], phase_count: 0 }; }
  if (inspection.status !== "working") {
    return { ok: false, errors: [...inspection.missing, ...inspection.errors], phase_count: 0 };
  }
  const legacyFiles = ["plan.md", "tasks.md"].filter((name) => existsSync(join(resolvedRoot, name)));
  const phases = Object.fromEntries(Object.entries(inspection.files).filter(([name]) => /^phases\/P[1-9][0-9]*\.md$/.test(name)));
  return evaluateCard02PostPhaseEvidence({
    spec: inspection.files["spec.md"], index: inspection.files["phases/index.md"], phases, legacyFiles,
  });
}

function commandPassed(result) {
  return result?.exit_code === 0 && result.signal === null && result.error === null && result.timed_out === false;
}

function observedVitestAssertion(result, { file, test }) {
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const line = new RegExp(`(?:^|\\n)\\s*✓\\s+${escape(file)} > .+ > ${escape(test)}(?:\\s|$)`);
  return line.test(String(result?.stdout ?? "")) ? "passed" : "missing";
}

function observedNodeAssertion(result, { test }) {
  return String(result?.stdout ?? "").includes(`✔ ${test} `) ? "passed" : "missing";
}

function observedAssertion(results, assertion) {
  const result = results[assertion.commandIndex];
  return assertion.file ? observedVitestAssertion(result, assertion) : observedNodeAssertion(result, assertion);
}

/** Derive rows from observed child assertions and the current task boundary. */
export function deriveCard02Entries({ results, taskMaterials, postPhaseEvidence = null }) {
  const commandsPassed = results.length === commands.length && results.every(commandPassed);
  return ACCEPTANCE_CRITERIA.map((acceptance_criterion_id) => {
    const achieved = TEST_ASSERTIONS[acceptance_criterion_id];
    if (achieved) {
      const observed = observedAssertion(results, achieved);
      const postPhaseReady = !POST_PHASE_ACS.has(acceptance_criterion_id) || postPhaseEvidence?.ok === true;
      const originalAcceptanceGap = STRUCTURE_ONLY_ACCEPTANCE_GAPS[acceptance_criterion_id];
      const outcome = commandsPassed && observed === "passed" && postPhaseReady && !originalAcceptanceGap ? "achieved" : "incomplete";
      const reason = !postPhaseReady
        ? `the current post Phase files are incomplete: ${postPhaseEvidence?.errors?.join("; ") ?? "not read"}`
        : !commandsPassed || observed !== "passed"
          ? "the named current-snapshot assertion did not pass"
          : originalAcceptanceGap;
      return {
        acceptance_criterion_id, outcome,
        ...(POST_PHASE_ACS.has(acceptance_criterion_id) ? { original_requirement: ORIGINAL_REQUIREMENT_TRACE[acceptance_criterion_id] } : {}),
        ...(outcome === "achieved" ? {} : { owner: originalAcceptanceGap && postPhaseReady && commandsPassed && observed === "passed" ? "CARD-02" : "T011", reason }),
        assertions: [{ id: `${acceptance_criterion_id}:${achieved.test}`, expected: { status: "passed" }, actual: { status: observed } },
          ...(POST_PHASE_ACS.has(acceptance_criterion_id) ? [{ id: `${acceptance_criterion_id}:physical-post-phase-readback`, expected: { status: "passed" }, actual: { status: postPhaseReady ? "passed" : "missing" } }] : []),
          ...(originalAcceptanceGap ? [{ id: `${acceptance_criterion_id}:original-acceptance-proof`, expected: { status: "passed" }, actual: { status: "missing" } }] : [])],
      };
    }
    const readback = NON_ACHIEVED_READBACKS[acceptance_criterion_id];
    if (readback.outcome === "incomplete") {
      return {
        acceptance_criterion_id, outcome: "incomplete", owner: readback.owner, reason: readback.reason,
        ...(ORIGINAL_REQUIREMENT_TRACE[acceptance_criterion_id] ? { original_requirement: ORIGINAL_REQUIREMENT_TRACE[acceptance_criterion_id] } : {}),
        assertions: [{ id: `${acceptance_criterion_id}:original-requirement-proof`, expected: { status: "passed" }, actual: { status: "missing" } }],
      };
    }
    const observed = readback.assertion ? observedAssertion(results, readback.assertion) : "passed";
    const materialPresent = readback.materialMarkers.every((marker) => String(taskMaterials ?? "").includes(marker));
    const outcome = commandsPassed && observed === "passed" && materialPresent ? readback.outcome : "incomplete";
    return {
      acceptance_criterion_id, outcome,
      ...(outcome === "incomplete"
        ? { owner: "T011", reason: "the current task material or named boundary assertion is missing" }
        : { owner: readback.owner, reason: readback.reason }),
      assertions: [{
        id: `${acceptance_criterion_id}:current-boundary-readback`,
        expected: { status: "present" },
        actual: { status: observed === "passed" && materialPresent ? "present" : "missing" },
      }],
    };
  });
}

export function produceCard02Current({ run = spawnSync, cwd = process.cwd(), taskMaterials = null, postPhaseRoot = null } = {}) {
  const results = [];
  for (const [command, args, timeout] of commands) {
    const result = run(command, args, { cwd, encoding: "utf8", timeout, stdio: ["ignore", "pipe", "pipe"] });
    results.push({
      command, args, timeout_ms: timeout,
      exit_code: Number.isInteger(result.status) ? result.status : null,
      signal: result.signal ?? null,
      timed_out: result.error?.code === "ETIMEDOUT",
      error: result.error ? { code: result.error.code ?? "CHILD_PROCESS_ERROR", message: result.error.message } : null,
      stdout: result.stdout ?? "", stderr: result.stderr ?? "",
    });
    if (!commandPassed(results.at(-1))) break;
  }
  const materials = taskMaterials ?? readFileSync(join(cwd, "specs/archive/workflowhub-thin-core-card-02-20260919/tasks.md"), "utf8");
  const postPhaseEvidence = readCard02PostPhaseEvidence(postPhaseRoot ?? join(cwd, "specs/workflowhub-thin-core-card-07-20260919"));
  const entries = deriveCard02Entries({ results, taskMaterials: materials, postPhaseEvidence });
  return { schema_version: "card02-current-acceptance.v2", commands: results, post_phase_evidence: postPhaseEvidence, entries };
}

function main() {
  const output = produceCard02Current();
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exitCode = output.commands.length === commands.length && output.commands.every(commandPassed)
    && output.entries.every((entry) => entry.assertions.every((assertion) => assertion.expected.status === assertion.actual.status)) ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
