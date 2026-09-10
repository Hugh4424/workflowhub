import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

import {
  deriveResearchStatus,
  listCurrentResearchReports,
  parseResearchReport,
  publishResearchReport,
  readResearchReport,
} from "../../runtime/evidence/research-report.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(resolve(repoRoot, relativePath), "utf8");
const identity = {
  task_id: "research-task",
  stage: "make-decision",
  snapshot_tree: "a".repeat(40),
  material_scope_revision: `revision-${"b".repeat(64)}`,
};
const expectedIdentity = {
  taskId: identity.task_id,
  stage: identity.stage,
  snapshotTree: identity.snapshot_tree,
  materialScopeRevision: identity.material_scope_revision,
};

function report(status = "completed", overrides = {}) {
  const common = {
    schema_version: "research-report.v1",
    ...identity,
    status,
    question: "Which route is safe?",
    decision_axis: "fallback route",
    tool_usage: [{ tool: "anysearch", attempts: [{ route: "anysearch", attempt: 1, status: "ok", elapsed_ms: 12, http_status: 200, error_code: null, message: null }] }],
    open_items: [{ question_id: "Q-1", code: "open", reason: "needs user choice", next_action: "ask user" }],
    review: { status: "pending", evidence_ref: null },
    fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
  };
  if (status === "completed") {
    return {
      ...common,
      rounds: 1,
      sources: [
        { url_or_ref: "https://example.test/one", source_tier: "primary", read_original: true, locator: "§1" },
        { url_or_ref: "https://example.test/two", source_tier: "secondary", read_original: true, locator: "§2" },
        { url_or_ref: "https://example.test/three", source_tier: "inferred", read_original: true, locator: "§3" },
      ],
      evidence: [{ claim: "route is bounded", source_ref: "https://example.test/one", locator: "§1", confidence: "high", read_original: true }],
      triangulation: { status: "supported", conflicts: [] },
      coverage: { dimensions: ["failure"], first_party_ratio: 0.34, required_questions: ["Q-1"], covered_questions: [] },
      saturation: { status: "saturated", reason: "two rounds added no new direction-changing evidence" },
      ...overrides,
    };
  }
  if (status === "skipped") return { ...common, reason: "existing facts settle the axis", non_impact_basis: "no direction-changing question remains", evidence_refs: ["decision-log.md#facts"], ...overrides };
  return { ...common, error_class: "timeout", reason: "preferred route timed out", pending_questions: ["Q-1"], fallback: { approval_status: "awaiting_user_approval", requested_route: "host-web", used_routes: [] }, ...overrides };
}

describe("T001 research report contract", () => {
  it("uses the canonical research evidence namespace instead of test receipts", () => {
    expect(read("runtime/stage/stage-handlers.mjs")).toContain('research: "quality/evidence/research/"');
  });

  it("has a content-addressed report schema and reader module", () => {
    expect(existsSync(resolve(repoRoot, "runtime/schemas/research-report.v1.json"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "runtime/evidence/research-report.mjs"))).toBe(true);
  });

  it("makes fallback approval states explicit in the research contract", () => {
    const source = read("skills/deep-research/SKILL.md");
    expect(source).toMatch(/awaiting/);
    expect(source).toMatch(/approved/);
    expect(source).toMatch(/declined/);
  });

  it("authenticates raw bytes, ref hash, and current identity without reserialization", () => {
    const raw = `${JSON.stringify(report())}\n`;
    const ref = `quality/evidence/research/${createHash("sha256").update(raw).digest("hex")}.json`;
    const record = readResearchReport({
      read: (candidate) => candidate === ref ? raw : (() => { throw new Error("unexpected ref"); })(),
      ref,
      ...expectedIdentity,
    });
    expect(record.raw).toBe(raw);
    expect(record.sha256).toBe(ref.slice("quality/evidence/research/".length, -".json".length));
    expect(() => readResearchReport({ read: () => raw, ref, ...expectedIdentity, snapshotTree: "c".repeat(40) })).toThrow(/snapshot identity mismatch/);
    expect(() => readResearchReport({ read: () => `${raw}tampered`, ref, ...expectedIdentity })).toThrow(/hash/);
  });

  it("keeps completed, skipped, and unavailable mutually explicit", () => {
    for (const status of ["completed", "skipped", "unavailable"]) {
      expect(() => parseResearchReport(`${JSON.stringify(report(status))}\n`, expectedIdentity)).not.toThrow();
    }
    const unavailable = parseResearchReport(JSON.stringify(report("unavailable")), expectedIdentity);
    expect(deriveResearchStatus([{ ref: "quality/evidence/research/x.json", sha256: "x", value: unavailable }])).toMatchObject({ status: "unavailable", fallback: { approval_status: "awaiting_user_approval" } });
    expect(() => parseResearchReport(JSON.stringify({ ...report("unavailable"), fallback: { approval_status: "declined", requested_route: "host-web", used_routes: ["web_search"] } }), expectedIdentity)).toThrow(/used after approved/);
  });

  it("publishes one canonical report and does not create a receipt wrapper", () => {
    const writes = new Map();
    const published = publishResearchReport({
      report: report("skipped"),
      taskId: identity.task_id,
      stage: identity.stage,
      snapshotTree: identity.snapshot_tree,
      materialScopeRevision: identity.material_scope_revision,
      publish: (ref, raw) => writes.set(ref, raw),
    });
    expect(writes.size).toBe(1);
    expect(published.ref).toMatch(/^quality\/evidence\/research\/[a-f0-9]{64}\.json$/);
    expect(published.ref).not.toContain("quality/tests");
    expect(published.value.status).toBe("skipped");
  });

  it("injects a trusted publication time and selects a unique later terminal report", () => {
    const writes = new Map();
    const earlier = publishResearchReport({
      report: report("unavailable"), recordedAt: "2026-09-10T00:00:00.000Z",
      ...expectedIdentity,
      taskId: identity.task_id, snapshotTree: identity.snapshot_tree, materialScopeRevision: identity.material_scope_revision,
      publish: (ref, raw) => writes.set(ref, raw),
    });
    const later = publishResearchReport({
      report: report("completed"), recordedAt: "2026-09-10T00:00:01.000Z",
      taskId: identity.task_id, stage: identity.stage, snapshotTree: identity.snapshot_tree,
      materialScopeRevision: identity.material_scope_revision,
      publish: (ref, raw) => writes.set(ref, raw),
    });
    expect(earlier.value.recorded_at).toBe("2026-09-10T00:00:00.000Z");
    expect(deriveResearchStatus([earlier, later])).toMatchObject({ status: "completed", report_ref: later.ref });
    const tied = publishResearchReport({
      report: report("skipped"), recordedAt: later.value.recorded_at,
      taskId: identity.task_id, stage: identity.stage, snapshotTree: identity.snapshot_tree,
      materialScopeRevision: identity.material_scope_revision,
      publish: (ref, raw) => writes.set(ref, raw),
    });
    expect(deriveResearchStatus([later, tied])).toMatchObject({ status: "unavailable", reason: "research_record_ambiguous" });
    expect(() => parseResearchReport(JSON.stringify({ ...report(), recorded_at: "not-a-time" }), expectedIdentity)).toThrow(/recorded_at/);
  });

  it("enforces attempt count per question and the aggregate active budget", () => {
    const questions = ["Q-1", "Q-2"].map((question_id) => ({ question_id, text: question_id }));
    const base = report("unavailable", {
      questions,
      tool_usage: questions.map(({ question_id }) => ({
        tool: "anysearch",
        question_id,
        attempts: [{ route: "anysearch", attempt: 1, status: "timeout", elapsed_ms: 30000, http_status: null, error_code: "timeout", message: "timed out" }],
      })),
    });
    expect(() => parseResearchReport(JSON.stringify(base), expectedIdentity)).not.toThrow();
    expect(() => parseResearchReport(JSON.stringify({ ...base, tool_usage: [...base.tool_usage, { ...base.tool_usage[0] }] }), expectedIdentity)).toThrow(/unique sequence numbers per question/);

    const budgetQuestions = ["Q-1", "Q-2", "Q-3", "Q-4", "Q-5"].map((question_id) => ({ question_id, text: question_id }));
    const overBudget = report("unavailable", {
      questions: budgetQuestions,
      tool_usage: budgetQuestions.map(({ question_id }, index) => ({
        tool: "anysearch",
        question_id,
        attempts: [{ route: "anysearch", attempt: 1, status: "timeout", elapsed_ms: index === 4 ? 1 : 30000, http_status: null, error_code: "timeout", message: "timed out" }],
      })),
    });
    expect(() => parseResearchReport(JSON.stringify(overBudget), expectedIdentity)).toThrow(/active tool budget exceeded/);
  });

  it("requires approved fallback approval and both host route provenance records", () => {
    const approved = report("unavailable", {
      fallback: { approval_status: "approved", requested_route: "host-web", used_routes: ["web_search", "web_fetch"], approval_ref: "quality/confirmations/approved.json" },
      tool_usage: [
        { tool: "host", route: "web_search", attempt: 1, status: "ok", elapsed_ms: 10, http_status: 200, error_code: null, message: null },
        { tool: "host", route: "web_fetch", attempt: 2, status: "ok", elapsed_ms: 10, http_status: 200, error_code: null, message: null },
      ],
    });
    expect(() => parseResearchReport(JSON.stringify(approved), expectedIdentity)).not.toThrow();
    expect(() => parseResearchReport(JSON.stringify({ ...approved, fallback: { ...approved.fallback, approval_ref: null } }), expectedIdentity)).toThrow(/approval_ref/);
    expect(() => parseResearchReport(JSON.stringify({ ...approved, tool_usage: approved.tool_usage.slice(0, 1) }), expectedIdentity)).toThrow(/web_search and web_fetch provenance/);
  });

  it("projects corrupt canonical research bytes as integrity unavailable rather than missing", () => {
    const refs = [`quality/evidence/research/${"c".repeat(64)}.json`];
    const records = listCurrentResearchReports({
      task: { listCanonicalResearchReportRefs: () => refs, readRecord: () => "not json" },
      ...expectedIdentity,
    });
    expect(records).toHaveLength(1);
    expect(deriveResearchStatus(records)).toMatchObject({ status: "unavailable", reason: "research_record_integrity_failure", report_ref: refs[0] });
  });

  it("ignores a valid stale report instead of relabeling it as current corruption", () => {
    const raw = `${JSON.stringify(report())}\n`;
    const ref = `quality/evidence/research/${createHash("sha256").update(raw).digest("hex")}.json`;
    const records = listCurrentResearchReports({
      task: { listCanonicalResearchReportRefs: () => [ref], readRecord: () => raw },
      ...expectedIdentity,
      snapshotTree: "d".repeat(40),
    });
    expect(records).toEqual([]);
    expect(deriveResearchStatus(records)).toMatchObject({ status: "unavailable", reason: "research_record_missing" });
  });

});
