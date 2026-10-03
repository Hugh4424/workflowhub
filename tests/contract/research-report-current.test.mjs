import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import { createTask } from "../../runtime/task/task-handle.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
async function storage(){const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-research-literal-")));roots.push(root);const task=await createTask({storageRoot:root,manifest:{schema_version:"1.0.0",activation_cohort:"post",execution_mode:"per_invocation",record_model:"vnext-single-write",project_name:"ResearchLiteral",task_id:"research-task",created_at:"2026-10-03T00:00:00Z",target_repo_root:root,issue_ids:[],inputs:{}}});const recordDir=task.recordPath("quality/evidence/research");mkdirSync(recordDir,{recursive:true});return{root,task,recordDir};}

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
};
const expectedIdentity = {
  taskId: identity.task_id,
  stage: identity.stage,
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
  it("uses the ordinary research evidence namespace rather than test receipt wrappers",async()=>{const f=await storage(),r=await publishResearchReport({recordDir:f.recordDir,slug:"namespace",report:report("skipped"),...expectedIdentity});expect(r.ref).toMatch(/^quality\/evidence\/research\/\d{4}-\d{2}-\d{2}-\d{3}-namespace\.json$/);expect(r.ref).not.toContain("quality/tests");expect(JSON.parse(readFileSync(r.path))).toEqual(r.value);});
  it("validates ordinary report shape through the retained module without requiring the retired schema file",()=>{expect(typeof parseResearchReport).toBe("function");expect(parseResearchReport(JSON.stringify(report()),expectedIdentity).status).toBe("completed");expect(()=>parseResearchReport(JSON.stringify({...report(),review:{status:"pending"}}),expectedIdentity)).toThrow(/review/);});

  it("makes fallback approval states explicit in the research contract", () => {
    const source = read("skills/deep-research/SKILL.md");
    expect(source).toMatch(/awaiting/);
    expect(source).toMatch(/approved/);
    expect(source).toMatch(/declined/);
  });

  it("reads exact ordinary bytes and task/stage identity without hash or snapshot certification", () => {
    const raw = `${JSON.stringify(report())}\n`;
    const ref = "quality/evidence/research/2026-10-03-001-owned-report.json";
    const record = readResearchReport({
      read: (candidate) => candidate === ref ? raw : (() => { throw new Error("unexpected ref"); })(),
      ref,
      ...expectedIdentity,
    });
    expect(record.raw).toBe(raw);
    expect(record).not.toHaveProperty("sha256");
    expect(() => readResearchReport({ read: () => raw, ref, ...expectedIdentity, snapshotTree: "c".repeat(40) })).not.toThrow();
    expect(() => readResearchReport({ read: () => raw, ref, ...expectedIdentity, taskId: "wrong-task" })).toThrow(/task identity mismatch/);
    expect(() => readResearchReport({ read: () => raw, ref, ...expectedIdentity, stage: "build-plan" })).toThrow(/stage identity mismatch/);
    expect(() => readResearchReport({ read: () => `${raw}tampered`, ref, ...expectedIdentity })).toThrow(/research report JSON is invalid/);
  });

  it("keeps completed, skipped, and unavailable mutually explicit", () => {
    for (const status of ["completed", "skipped", "unavailable"]) {
      expect(() => parseResearchReport(`${JSON.stringify(report(status))}\n`, expectedIdentity)).not.toThrow();
    }
    const unavailable = parseResearchReport(JSON.stringify(report("unavailable")), expectedIdentity);
    expect(deriveResearchStatus([{ ref: "quality/evidence/research/x.json", sha256: "x", value: unavailable }])).toMatchObject({ status: "unavailable", fallback: { approval_status: "awaiting_user_approval" } });
    expect(() => parseResearchReport(JSON.stringify({ ...report("unavailable"), fallback: { approval_status: "declined", requested_route: "host-web", used_routes: ["web_search"] } }), expectedIdentity)).toThrow(/used after approved/);
  });

  it("projects declared candidates as delivered only with summaries, bound sources, and recommendations", () => {
    const completed = report("completed", {
      evidence: [
        { evidence_id: "E-ONE", claim: "route one is bounded", source_ref: "https://example.test/one", locator: "§1", confidence: "high", read_original: true, candidate_ids: ["route-one"] },
        { evidence_id: "E-TWO", claim: "route two has recovery evidence", source_ref: "https://example.test/two", locator: "§2", confidence: "medium", read_original: true, candidate_ids: ["route-two"] },
      ],
      candidates: [
        { candidate_id: "route-one", plain_language_summary: "Route one keeps the bounded path.", source_refs: ["https://example.test/one"], evidence_refs: ["E-ONE"], recommendation: "recommended", recommendation_reason: "It has the strongest primary evidence." },
        { candidate_id: "route-two", plain_language_summary: "Route two is viable but less direct.", source_refs: ["https://example.test/two"], evidence_refs: ["E-TWO"], recommendation: "not_recommended", recommendation_reason: "Its recovery proof is weaker." },
      ],
    });
    const raw = `${JSON.stringify(completed)}\n`;
    const ref = "quality/evidence/research/2026-10-03-001-owned-report.json";
    const record = readResearchReport({ read: () => raw, ref, ...expectedIdentity });
    expect(deriveResearchStatus([record]).candidate_delivery).toMatchObject({
      status: "delivered",
      full_report: { ref },
      candidates: [
        { candidate_id: "route-one", status: "delivered" },
        { candidate_id: "route-two", status: "delivered" },
      ],
      missing_candidate_ids: [],
    });

    const incomplete = report("completed", {
      candidates: [{ candidate_id: "route-one", plain_language_summary: "Route one.", source_refs: ["https://example.test/three"], evidence_refs: ["missing"], recommendation: "recommended" }],
    });
    const incompleteRaw = `${JSON.stringify(incomplete)}\n`;
    const incompleteRef = "quality/evidence/research/2026-10-03-001-owned-report.json";
    const incompleteRecord = readResearchReport({ read: () => incompleteRaw, ref: incompleteRef, ...expectedIdentity });
    expect(deriveResearchStatus([incompleteRecord]).candidate_delivery).toMatchObject({
      status: "incomplete",
      missing_candidate_ids: ["route-one"],
      missing_fields_by_candidate: {
        "route-one": ["evidence_refs_bound_to_candidate", "source_refs_bound_to_candidate_evidence", "recommendation_reason"],
      },
    });
  });

  it("rejects evidence borrowed from a different candidate", () => {
    const crossBound = report("completed", {
      evidence: [{ evidence_id: "E-ONE", claim: "only route one is bounded", source_ref: "https://example.test/one", locator: "§1", confidence: "high", read_original: true, candidate_ids: ["route-one"] }],
      candidates: [{ candidate_id: "route-two", plain_language_summary: "Route two.", source_refs: ["https://example.test/one"], evidence_refs: ["E-ONE"], recommendation: "not_recommended", recommendation_reason: "Evidence is only for route one." }],
    });
    const raw = `${JSON.stringify(crossBound)}\n`;
    const ref = "quality/evidence/research/2026-10-03-001-owned-report.json";
    const record = readResearchReport({ read: () => raw, ref, ...expectedIdentity });
    expect(deriveResearchStatus([record]).candidate_delivery).toMatchObject({
      status: "incomplete",
      missing_fields_by_candidate: { "route-two": ["evidence_refs_bound_to_candidate"] },
    });
  });

  it("requires every completed report to declare whether candidate delivery applies", () => {
    const undeclaredRaw = `${JSON.stringify(report("completed"))}\n`;
    const undeclaredRef = "quality/evidence/research/2026-10-03-001-owned-report.json";
    const undeclared = readResearchReport({ read: () => undeclaredRaw, ref: undeclaredRef, ...expectedIdentity });
    expect(deriveResearchStatus([undeclared]).candidate_delivery).toMatchObject({
      status: "incomplete",
      reason: "candidate_set_not_declared",
    });

    const noCandidatesRaw = `${JSON.stringify(report("completed", { candidates: [] }))}\n`;
    const noCandidatesRef = "quality/evidence/research/2026-10-03-001-owned-report.json";
    const noCandidates = readResearchReport({ read: () => noCandidatesRaw, ref: noCandidatesRef, ...expectedIdentity });
    expect(deriveResearchStatus([noCandidates]).candidate_delivery).toMatchObject({
      status: "not_applicable",
      reason: "no_candidates_declared",
      missing_candidate_ids: [],
    });
  });

  it("publishes one immutable ordinary report and does not create a receipt wrapper",async()=>{const f=await storage(),r=await publishResearchReport({recordDir:f.recordDir,slug:"ordinary-report",report:report("skipped"),...expectedIdentity});expect(r.ref).toMatch(/^quality\/evidence\/research\/\d{4}-\d{2}-\d{2}-\d{3}-ordinary-report\.json$/);expect(r.ref).not.toContain("quality/tests");expect(r.value.status).toBe("skipped");const original=readFileSync(r.path),next=await publishResearchReport({recordDir:f.recordDir,slug:"ordinary-report",report:report("unavailable"),...expectedIdentity});expect(next.path).not.toBe(r.path);expect(readFileSync(r.path)).toEqual(original);expect(existsSync(join(f.task.taskPath,"quality","verify.v1"))).toBe(false);});
  it("retains explicit report time and selects unique later terminal facts, with ties visibly ambiguous",async()=>{const f=await storage(),base={recordDir:f.recordDir,...expectedIdentity};const earlier=await publishResearchReport({...base,report:report("unavailable"),recordedAt:"2026-09-10T00:00:00.000Z"});const later=await publishResearchReport({...base,report:report("completed"),recordedAt:"2026-09-10T00:00:01.000Z"});expect(earlier.value.recorded_at).toBe("2026-09-10T00:00:00.000Z");expect(deriveResearchStatus([earlier,later])).toMatchObject({status:"completed",report_ref:later.ref});const tied=await publishResearchReport({...base,report:report("skipped"),recordedAt:later.value.recorded_at});expect(deriveResearchStatus([later,tied])).toMatchObject({status:"unavailable",reason:"research_record_ambiguous"});expect(()=>parseResearchReport(JSON.stringify({...report(),recorded_at:"not-a-time"}),expectedIdentity)).toThrow(/recorded_at/);});

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

  it("projects actual corrupt report bytes as visible integrity unavailable rather than missing",async()=>{const f=await storage(),ref="quality/evidence/research/2026-10-03-001-corrupt.json",raw="not json";await f.task.writeRecordAtomic(ref,raw);const records=listCurrentResearchReports({task:f.task,...expectedIdentity});expect(records).toHaveLength(1);expect(records[0].error).toContain("research report JSON is invalid");expect(deriveResearchStatus(records)).toMatchObject({status:"unavailable",reason:"research_record_integrity_failure",report_ref:ref});expect(f.task.readRecord(ref)).toBe(raw);});
  it("reads an old report and its retired binding fields passively instead of enforcing snapshot freshness or rewriting it",async()=>{const f=await storage(),ref="quality/evidence/research/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json",value={...report(),snapshot_tree:"a".repeat(40),material_scope_revision:"revision-old"},raw=JSON.stringify(value,null,2)+"\r\n";await f.task.writeRecordAtomic(ref,raw);const records=listCurrentResearchReports({task:f.task,...expectedIdentity,snapshotTree:"b".repeat(40),materialScopeRevision:"revision-new"});expect(records).toHaveLength(1);expect(records[0]).toMatchObject({ref,raw,value});expect(deriveResearchStatus(records).status).toBe("completed");expect(f.task.readRecord(ref)).toBe(raw);await expect(publishResearchReport({recordDir:f.recordDir,report:value,...expectedIdentity})).rejects.toThrow(/retired research bindings are read-only/);expect(f.task.readRecord(ref)).toBe(raw);});
});
