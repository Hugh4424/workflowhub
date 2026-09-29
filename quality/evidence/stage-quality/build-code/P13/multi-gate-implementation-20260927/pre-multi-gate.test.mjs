import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { authenticateP5StageEndReport } from "../../runtime/evidence/freshness.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";

// Public seam: the ordinary, final CARD-04 report artifact, not a mock stage run.
// This test does not write a receipt or infer that a passing contract means business acceptance.
const root = resolve(import.meta.dirname, "../..");
const card = "workflowhub-thin-core-card-04-20260919";
// External task facts are optional until actually cited; absence is a verdict limitation,
// never an import/collection error or a reason to fabricate receipts.
const taskRoot = resolve(root, "../../Knowledge/Projects/workflowhub/tasks", card);
function authenticateTaskRoot() {
  const identity = JSON.parse(readFileSync(resolve(taskRoot, "task.json"), "utf8"));
  expect(identity.project_name).toBe("workflowhub");
  expect(identity.task_id).toBe(card);
}
const artifact = `quality/evidence/stage-quality/build-code/P13/final-aggregate.json`;
const markdown = `quality/evidence/stage-quality/build-code/P13/final-aggregate.md`;
const delivery = `quality/evidence/stage-quality/build-code/P13/T024-delivery.json`;
const ids = Array.from({ length: 12 }, (_, n) => `P${n + 1}`);
const unresolved = new Set(["failed", "not_done", "unknown", "unavailable", "incomplete"]);
const states = new Set(["passed", ...unresolved]);
const p1PhaseChecks = ["P1-DOC-ASSERTIONS", "P1-ADR-TRACKED"];
const p1PhaseSuccess = ["P1 doc assertions OK", "ADR-0033 tracked"];
const p1TaskSuccess = {
  T001: "rules doc OK",
  T002: "entry inventory OK",
  T003: "ADR-0033 OK",
};
const p1TaskChecks = {
  T001: ["P1-RULES-DOC"],
  T002: ["P1-ENTRY-INVENTORY"],
  T003: ["P1-ADR-TRACKED"],
};

function assertP1OutputText(raw, command, markers) {
  const normalized = raw.replace(/\r\n/g, "\n");
  expect(normalized).not.toMatch(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]|\p{Cf}/u);
  const transcript = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;
  const lines = transcript.split("\n");
  expect(lines).toEqual([`COMMAND=${command}`, ...markers, "EXIT=0"]);
  const output = lines.slice(1, -1);
  for (const marker of markers) {
    expect(output.filter((line) => line === marker), `missing unique stdout check line: ${marker}`).toHaveLength(1);
  }
  expect(output.filter((line) => markers.includes(line))).toEqual(markers);
}
function assertP1RawCheck(observed, markers) {
  expect(observed?.path).toEqual(expect.any(String));
  assertP1OutputText(source(observed.path).toString("utf8"), observed.command, markers);
}

// P1 is a Node/git document-check gate, not a test runner. Never manufacture
// reporter test IDs merely to satisfy the final aggregate's shape checks.
function assertExecutionIds(phaseId, observed, expectedChecks) {
  if (phaseId === "P1") {
    expect(observed?.kind).toBe("command_checks");
    expect(expectedChecks).toEqual(expect.any(Array));
    expect(observed?.check_ids).toEqual(expectedChecks);
    expect(observed?.test_ids ?? []).toEqual([]);
    expect(observed?.command).toEqual(expect.any(String));
    expect(observed?.exit_code).toBe(0);
  } else {
    expect(observed?.test_ids?.length).toBeGreaterThan(0);
  }
}

function within(parent, candidate) {
  const suffix = relative(parent, candidate);
  return suffix !== "" && suffix !== ".." && !suffix.startsWith(`../`) && !isAbsolute(suffix);
}
function source(path) {
  expect(typeof path).toBe("string");
  expect(path.length).toBeGreaterThan(0);
  // Repo paths remain relative. External paths are accepted ONLY beneath this
  // task's authenticated task-store root, never another task or arbitrary home path.
  const full = isAbsolute(path) ? resolve(path) : resolve(root, path);
  if (isAbsolute(path)) authenticateTaskRoot();
  const allowed = isAbsolute(path) ? taskRoot : root;
  expect(within(allowed, full), `source outside authenticated ${isAbsolute(path) ? "task-store" : "worktree"} root: ${path}`).toBe(true);
  expect(existsSync(full), `source missing: ${path}`).toBe(true);
  expect(within(realpathSync(allowed), realpathSync(full)), `source symlink escapes authenticated root: ${path}`).toBe(true);
  return readFileSync(full);
}
function sha(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function authenticated(ref) {
  expect(ref).toEqual(expect.objectContaining({ path: expect.any(String), sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }));
  expect(sha(source(ref.path)), `stale or wrongly bound source: ${ref.path}`).toBe(ref.sha256);
  expect(ref.path).not.toMatch(/(?:^|\/)(?:prewritten-red|fixtures?)(?:\/|$)/);
}
function authoritative(phase) {
  const text = source(`specs/${card}/phases/${phase}.md`).toString("utf8");
  const gate = text.match(/^- \*\*gate_cmd\*\*: `([^`]+)`/m)?.[1];
  const tasks = [...text.matchAll(/^### (T\d{3}) —/gm)].map((m) => m[1]);
  expect(gate, `${phase} missing phase gate`).toBeTruthy();
  expect(tasks.length, `${phase} missing task identity`).toBeGreaterThan(0);
  return { gate, tasks };
}
function assertP5T008Report(task, observed) {
  expect(["recorded", "missing", "unavailable"]).toContain(observed?.status);
  expect(typeof observed?.authenticated).toBe("boolean");
  if (task.status === "passed") {
    expect(observed, "P5/T008 cannot pass without the authenticated Task report").toMatchObject({
      status: "recorded", authenticated: true,
      facts: expect.any(Object),
      source_ref: expect.any(String),
      source_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(observed.source_ref).toBe(`quality/evidence/stage-quality/build-code/P5/source-${observed.source_sha256}.json`);
    expect(Array.isArray(task.evidence_refs)).toBe(true);
    expect(task.evidence_refs, "P5/T008 passed must cite the authenticated report source and exact hash")
      .toContainEqual({ path: resolve(taskRoot, observed.source_ref), sha256: observed.source_sha256 });
  } else if (observed.status !== "recorded") {
    expect(unresolved.has(task.status), "a missing P5 report must remain unresolved").toBe(true);
  }
}
function validate(actual) {
  expect(actual.schema_version).toBe("card04-final-aggregate.v1");
  expect(actual.card_id).toBe(card);
  expect(actual.phase_order).toEqual(ids);
  expect(actual.phases).toHaveLength(ids.length);
  expect(states.has(actual.overall_status)).toBe(true);
  for (const [index, phase] of actual.phases.entries()) {
    const phaseId = ids[index];
    const { gate, tasks } = authoritative(phaseId);
    expect(phase.phase_id).toBe(phaseId);
    expect(phase.gate_cmd).toBe(gate);
    expect(states.has(phase.status)).toBe(true);
    expect(phase.tasks.map((task) => task.task_id)).toEqual(tasks);
    expect(states.has(phase.gate_status)).toBe(true);
    if (phase.gate_status === "passed") {
      expect(phase.gate_evidence.command).toBe(gate);
      expect(phase.gate_evidence.exit_code).toBe(0);
      assertExecutionIds(phaseId, phase.gate_evidence, p1PhaseChecks);
      authenticated(phase.gate_evidence);
      if (phaseId === "P1") assertP1RawCheck(phase.gate_evidence, p1PhaseSuccess);
      // A hashed plan, arbitrary file, or task.json is NOT raw runner proof.
      const gateSource = phase.gate_evidence.path;
      expect(gateSource).toMatch(/(?:^quality\/evidence\/stage-quality\/build-code\/|\/quality\/(?:tests|evidence)\/)/);
      expect(gateSource).not.toMatch(/(?:task\.json|facts\.jsonl|\/phases\/|\/spec\.md)$/);
      expect(phase.gate_evidence.snapshot).toMatch(/^[a-f0-9]{40,64}$/);
      expect(phase.gate_evidence.task_id).toBe(card);
    } else {
      expect(phase.gate_evidence?.exit_code).not.toBe(0);
      expect(phase.gate_status_reason).toEqual(expect.any(String));
      expect(phase.gate_status_owner).toEqual(expect.any(String));
    }
    for (const task of phase.tasks) {
      expect(states.has(task.status)).toBe(true);
      if (phaseId === "P5" && task.task_id === "T008") {
        const handle = openTask(taskRoot, "workflowhub", card);
        assertP5T008Report(task, authenticateP5StageEndReport(handle));
      }
      expect(Array.isArray(task.evidence_refs)).toBe(true);
      task.evidence_refs.forEach(authenticated);
      if (task.status === "passed") {
        expect(task.evidence_refs.length, `${phaseId}/${task.task_id} has no source`).toBeGreaterThan(0);
        expect(phase.gate_status, `${phaseId}/${task.task_id} cannot pass a nonpassing phase gate`).toBe("passed");
        expect(task.evidence_refs.some((ref) => isAbsolute(ref.path) && ref.path.startsWith(resolve(taskRoot, "quality") + "/")), `${phaseId}/${task.task_id} lacks task-store quality source`).toBe(true);
        expect(task.receipt?.task_id).toBe(card);
        expect(task.receipt?.phase_id).toBe(phaseId);
        expect(task.receipt?.task_id_in_phase).toBe(task.task_id);
        expect(task.receipt?.snapshot).toMatch(/^[a-f0-9]{40,64}$/);
        if (phaseId === "P1") {
          const phaseText = source(`specs/${card}/phases/P1.md`).toString("utf8");
          const taskText = phaseText.split(new RegExp(`^### ${task.task_id} —`, "m"))[1]?.split(/^### T\d{3} —|^## L2/m)[0];
          const taskGate = taskText?.match(/^- \*\*RED\/GREEN gate_cmd\*\*: `([^`]+)`/m)?.[1];
          expect(taskGate, `P1/${task.task_id} missing document check gate`).toBeTruthy();
          expect(task.receipt.command).toBe(taskGate);
        }
        assertExecutionIds(phaseId, task.receipt, p1TaskChecks[task.task_id]);
        if (phaseId === "P1") {
          const rawRef = task.evidence_refs.find((ref) => ref.path === task.receipt.output_ref);
          expect(rawRef, `P1/${task.task_id} lacks a hashed raw command output`).toBeTruthy();
          assertP1RawCheck({ ...task.receipt, path: rawRef.path }, [p1TaskSuccess[task.task_id]]);
        }
      } else {
        expect(task.reason).toEqual(expect.any(String));
        expect(task.reason.trim().length).toBeGreaterThan(0);
        expect(task.owner).toEqual(expect.any(String));
        expect(task.owner.trim().length).toBeGreaterThan(0);
        expect(task.impact).toEqual(expect.any(String));
        expect(task.impact.trim().length).toBeGreaterThan(0);
      }
    }
    if (phase.status === "passed") {
      expect(phase.gate_status).toBe("passed");
      expect(phase.tasks.every((task) => task.status === "passed")).toBe(true);
    } else {
      expect(phase.reason).toEqual(expect.any(String));
      expect(phase.owner).toEqual(expect.any(String));
      expect(phase.impact).toEqual(expect.any(String));
      expect(phase.reason.trim().length).toBeGreaterThan(0);
      expect(phase.owner.trim().length).toBeGreaterThan(0);
      expect(phase.impact.trim().length).toBeGreaterThan(0);
    }
  }
  assertOverall(actual);
}
function assertOverall(actual) {
  expect(states.has(actual.overall_status)).toBe(true);
  if (actual.overall_status === "passed") {
    expect(actual.phases.every((phase) => phase.status === "passed" && phase.gate_status === "passed" && phase.tasks.every((task) => task.status === "passed"))).toBe(true);
  } else {
    expect(actual.overall_reason).toEqual(expect.any(String));
    expect(actual.overall_owner).toEqual(expect.any(String));
  }
}

function currentReport() {
  return JSON.parse(source(artifact).toString("utf8"));
}
function badNews(text, nextHeading, label) {
  // Scope assertions to the FIRST actual bad-news section; echoed text in a
  // route/execution appendix or passing summary must never satisfy them.
  const start = text.search(/^#{1,6}\s+没做到(?:\s|$)/m);
  const end = text.search(nextHeading);
  expect(start, `${label} lacks an explicit bad-news heading`).toBeGreaterThanOrEqual(0);
  expect(end, `${label} lacks a following boundary heading`).toBeGreaterThan(start);
  expect(text.slice(0, start).trim(), `${label} places content before bad news`).toBe("");
  return text.slice(start, end);
}
function assertIssueInBadNews(section, issue, label) {
  const values = [issue.id, issue.status, issue.reason, issue.impact, issue.owner];
  // A single bullet ties all five fields to this precise issue, rather than
  // allowing a different issue's owner/reason or later section to satisfy it.
  const line = section.split(/\r?\n/).find((entry) => entry.trimStart().startsWith(`- ${issue.id} |`));
  expect(line, `${label} missing bad-news bullet for ${issue.id}`).toEqual(expect.any(String));
  for (const value of values) {
    expect(typeof value).toBe("string");
    expect(value.trim().length).toBeGreaterThan(0);
    expect(line, `${label} omits ${issue.id}: ${value}`).toContain(value);
  }
}
function issuesIn(report) {
  return report.phases.flatMap((phase) => [
    ...(phase.status !== "passed" ? [{ id: phase.phase_id, status: phase.status, reason: phase.reason, impact: phase.impact, owner: phase.owner }] : []),
    ...phase.tasks.filter((task) => task.status !== "passed").map((task) => ({ id: `${phase.phase_id}/${task.task_id}`, ...task })),
  ]);
}

describe("ORACLE-CARD04-FINAL-AGGREGATE: P13/T024 ordinary final report", () => {
  it("requires the actual final artifact after P1–P12, with canonical gate and task identities", () => {
    validate(currentReport());
  });

  it("delivers a distinct final rendering and an independently authored, unchanged plain-language narrative", () => {
    const report = currentReport();
    const md = source(markdown).toString("utf8");
    const record = JSON.parse(source(delivery).toString("utf8"));
    const mdBadNews = badNews(md, /^#{1,6}\s+路线适用(?:\s|$)/m, "final markdown");
    expect(md).toMatch(/^#{1,6}\s+执行事实(?:\s|$)/m);
    expect(md.indexOf("路线适用")).toBeLessThan(md.indexOf("执行事实"));
    expect(record.author_agent_id).toEqual(expect.any(String));
    expect(record.author_agent_id.length).toBeGreaterThan(0);
    expect(record.posted_at_utc).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(record.narrative_text).toEqual(expect.any(String));
    expect(record.narrative_text.length).toBeGreaterThan(0);
    expect(record.posted_text).toBe(record.narrative_text);
    expect(record.unedited).toBe(true);
    expect(record.aggregate_ref).toEqual({ path: artifact, sha256: sha(source(artifact)) });
    expect(record.markdown_ref).toEqual({ path: markdown, sha256: sha(source(markdown)) });
    const narrativeBadNews = badNews(record.narrative_text, /^#{1,6}\s+通过项(?:\s|$)/m, "independent narrative");
    for (const issue of issuesIn(report)) {
      assertIssueInBadNews(mdBadNews, issue, "final markdown");
      assertIssueInBadNews(narrativeBadNews, issue, "independent narrative");
    }
  });

  // Negative controls mutate only the final artifact in memory; never create fake runtime facts.
  // They become meaningful only after the actual artifact exists. The first test is always RED meanwhile.
  it("rejects absent, stale, displaced bad-news and unknown-laundered refs without creating receipts", () => {
    const ref = { path: `specs/${card}/phases/P12.md`, sha256: sha(source(`specs/${card}/phases/P12.md`)) };
    expect(() => authenticated({ ...ref, path: `specs/${card}/phases/no-such-phase.md` })).toThrow();
    expect(() => authenticated({ ...ref, sha256: "0".repeat(64) })).toThrow();
    // Canonical source access is conditional: absent external task store must not
    // turn the target assertion RED into import/setup failure.
    if (existsSync(resolve(taskRoot, "task.json"))) {
      const canonical = { path: resolve(taskRoot, "task.json"), sha256: sha(source(resolve(taskRoot, "task.json"))) };
      expect(() => authenticated(canonical)).not.toThrow(); // Identity bytes alone never prove a passed gate/Task.
      expect(() => authenticated({ ...canonical, path: resolve(taskRoot, "../another-task/task.json") })).toThrow();
      expect(() => authenticated({ ...canonical, path: resolve(taskRoot, "../../other-secret.json") })).toThrow();
      expect(() => authenticated({ ...canonical, sha256: "0".repeat(64) })).toThrow();
      const p5Current = authenticateP5StageEndReport(openTask(taskRoot, "workflowhub", card));
      const p5Marker = resolve(taskRoot, "quality/evidence/stage-quality/build-code/P5/report-facts.json");
      if (!existsSync(p5Marker)) {
        expect(p5Current).toMatchObject({ status: "missing", authenticated: false });
      }
    }
    // P6 exercises actual Task file removal/certificate corruption. Here the
    // final consumer must reject those returned missing states even when a
    // report and delivery file happen to remain on disk.
    for (const reason of [
      "completion marker absent; report and delivery remain",
      "certificate hash mismatch; report and delivery remain",
      "partial write; report and delivery remain",
    ]) {
      expect(() => assertP5T008Report({ status: "passed" }, {
        status: "missing", authenticated: false, reason,
      })).toThrow();
    }
    // In-memory contract examples only; these do not create or claim a real P5 report.
    const reportHash = "a".repeat(64);
    const reportSource = `quality/evidence/stage-quality/build-code/P5/source-${reportHash}.json`;
    const reportObserved = { status: "recorded", authenticated: true, facts: {},
      source_ref: reportSource, source_sha256: reportHash };
    const reportPath = resolve(taskRoot, reportSource);
    const reportTask = { status: "passed", evidence_refs: [{ path: reportPath, sha256: reportHash }] };
    expect(() => assertP5T008Report(reportTask, reportObserved)).not.toThrow();
    expect(() => assertP5T008Report({ ...reportTask, evidence_refs: [] }, reportObserved)).toThrow();
    expect(() => assertP5T008Report({ ...reportTask,
      evidence_refs: [{ path: resolve(taskRoot, "quality/evidence/stage-quality/build-code/P5/other.json"), sha256: reportHash }] },
    reportObserved)).toThrow();
    expect(() => assertP5T008Report({ ...reportTask,
      evidence_refs: [{ path: reportPath, sha256: "0".repeat(64) }] }, reportObserved)).toThrow();
    // In-memory layout negative controls are not fake runtime receipts/reports.
    const issue = { id: "P11/T022", status: "unknown", reason: "not run", impact: "UI unverified", owner: "CARD-04" };
    const bullet = `- ${issue.id} | ${issue.status} | ${issue.reason} | ${issue.impact} | ${issue.owner}`;
    const validMd = `# 没做到\n${bullet}\n## 路线适用\n## 执行事实\n`;
    const validNarrative = `# 没做到\n${bullet}\n## 通过项\n`;
    expect(() => assertIssueInBadNews(badNews(validMd, /^#{1,6}\s+路线适用(?:\s|$)/m, "md"), issue, "md")).not.toThrow();
    expect(() => assertIssueInBadNews(badNews(validNarrative, /^#{1,6}\s+通过项(?:\s|$)/m, "narrative"), issue, "narrative")).not.toThrow();
    for (const [text, heading] of [
      [`# 没做到\n## 路线适用\n${bullet}\n## 执行事实\n`, /^#{1,6}\s+路线适用(?:\s|$)/m],
      [`# 没做到\n## 通过项\n${bullet}\n`, /^#{1,6}\s+通过项(?:\s|$)/m],
    ]) {
      expect(() => assertIssueInBadNews(badNews(text, heading, "displaced"), issue, "displaced")).toThrow();
    }
    // The P1 document gate and its three Tasks have check identities, never
    // invented runner identities. Wrong/missing/duplicate check IDs fail.
    const p1Gate = { kind: "command_checks", check_ids: p1PhaseChecks, test_ids: [], command: "node --version" };
    expect(() => assertExecutionIds("P1", { ...p1Gate, exit_code: 0 }, p1PhaseChecks)).not.toThrow();
    expect(() => assertExecutionIds("P1", { kind: "command_checks", check_ids: p1TaskChecks.T001, exit_code: 0, command: "node --version" }, p1TaskChecks.T001)).not.toThrow();
    for (const wrong of [
      { ...p1Gate, check_ids: ["P1-DOC-ASSERTIONS"] },
      { ...p1Gate, check_ids: ["P1-DOC-ASSERTIONS", "P1-DOC-ASSERTIONS"] },
      { ...p1Gate, check_ids: ["P1-ADR-TRACKED", "P1-DOC-ASSERTIONS"] },
      { ...p1Gate, test_ids: ["fake test"] },
      { ...p1Gate, kind: "runner" },
      { ...p1Gate, exit_code: 1 },
    ]) expect(() => assertExecutionIds("P1", { exit_code: 0, ...wrong }, p1PhaseChecks)).toThrow();
    expect(() => assertExecutionIds("P1", { kind: "command_checks", check_ids: p1TaskChecks.T001, exit_code: 0, command: "node --version" }, p1TaskChecks.T003)).toThrow();
    expect(() => assertExecutionIds("P2", { test_ids: [] })).toThrow();
    // Echoing a command that contains success text is not runner stdout.
    const echoed = `COMMAND=${p1Gate.command} console.log('P1 doc assertions OK') console.log('ADR-0033 tracked')\nEXIT=0\n`;
    expect(() => assertP1OutputText(echoed, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).not.toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\r\nP1 doc assertions OK\r\nADR-0033 tracked\r\nEXIT=0\r\n`, p1Gate.command, p1PhaseSuccess)).not.toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\u2029`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\u0085`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\u0007`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=1\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\nEXIT=1\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nEXIT=1\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\nother line\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n EXIT=1\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nADR-0033 tracked\nP1 doc assertions OK\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n  EXIT=1\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nCOMMAND=node --version\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nCOMMAND=${p1Gate.command}\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\n COMMAND=node --version\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\n\u00a0COMMAND=node --version\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\n\u00a0EXIT=1\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\n\u200bEXIT=1\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\n\u200bCOMMAND=node --version\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXI\u200bT=1\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nCOM\u200bMAND=node --version\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\nADR-0033 tracked\nEXI\u001b[0mT=1\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\n\u001b[2J P1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\rP1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\u2028P1 doc assertions OK\nADR-0033 tracked\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    expect(() => assertP1OutputText(`COMMAND=${p1Gate.command}\nP1 doc assertions OK\u202e\nADR-0033 tracked\nEXIT=0\n`, p1Gate.command, p1PhaseSuccess)).toThrow();
    // A hashed plan is not P1's actual command/output, even if shaped as a check.
    expect(() => assertP1RawCheck({ path: `specs/${card}/phases/P1.md`, command: "node --version" }, p1PhaseSuccess)).toThrow();
    for (const id of ["T001", "T002", "T003"]) {
      const phaseText = source(`specs/${card}/phases/P1.md`).toString("utf8");
      const taskText = phaseText.split(new RegExp(`^### ${id} —`, "m"))[1]?.split(/^### T\d{3} —|^## L2/m)[0];
      expect(taskText?.match(/^- \*\*RED\/GREEN gate_cmd\*\*: `([^`]+)`/m)?.[1], `${id} must have its own executable check`).toBeTruthy();
      expect(p1TaskSuccess[id]).toEqual(expect.any(String));
    }
    // Pure negative controls on known plan bytes, never presented as an execution receipt.
    for (const actual of [
      { overall_status: "passed", phases: [{ status: "unknown", gate_status: "passed", tasks: [] }] },
      { overall_status: "passed", phases: [{ status: "passed", gate_status: "unknown", tasks: [] }] },
      { overall_status: "passed", phases: [{ status: "passed", gate_status: "passed", tasks: [{ status: "unknown" }] }] },
    ]) expect(() => assertOverall(actual)).toThrow();
  });
});
