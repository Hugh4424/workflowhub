import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runReviewRecovery } from "../wh-review-cli.mjs";
import { createSimpleReviewPacket, runSimpleReview } from "../simple-review-runner.mjs";

const taskId = "workflowhub-mechanism-simplification-t2-20260911";
const OPN_2_COLLECTION = {
  schema_version: "workflowhub-review-sink-collection.v1",
  task_id: taskId,
  stage: "make-decision",
  authoritative: false,
  formal_review_result: false,
  review_origin: "unavailable",
  collection_kind: "opn-2-recovered-findings",
  consumer: "C4 AC-C4-016 OPN-2 acceptance evidence",
  owner: "workflowhub build-code task",
  total_raw_findings: 61,
  identity_note: "This record collects provenance pointers only. It does not upgrade either failed CLI run to conducted, and it is not consumed as a canonical review_result.",
  sources: [
    {
      track: "direction",
      raw_findings: 20,
      review_origin: "unavailable",
      materialization_status: "referenced",
      evidence_refs: ["decision-log.md#8.1", "decision-log.md#8.2"],
      source_note: "Historical raw broker evidence and the failed bare-sink invocation are identified in decision-log.md §8.1; no findings are reconstructed here.",
    },
    {
      track: "detail",
      raw_findings: 41,
      review_origin: "unavailable",
      materialization_status: "referenced",
      evidence_refs: ["decision-log.md#8.1b", "decision-log.md#8.3"],
      source_note: "Historical raw broker evidence and the failed bare-sink invocation are identified in decision-log.md §8.1b/§8.3; no findings are reconstructed here.",
    },
  ],
  limits: [
    "The referenced raw evidence is not reclassified as a formal review result.",
    "The collection is not a substitute for a missing canonical review_result_ref.",
    "No new runtime control plane or retry budget is introduced.",
  ],
};
const roots = [];
const priorSinkRoot = process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
  if (priorSinkRoot === undefined) delete process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
  else process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = priorSinkRoot;
});

function attachmentRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

function finding(role, number = 1) {
  return {
    severity: "major",
    path: "materials/01-decision.md",
    line: 1,
    issue: `${role} fixture finding ${number}`,
    recommendation: "preserve the finding while the other review role fails",
    root_cause: "channel fixture",
    evidence_kind: "direct",
    evidence: "fixture evidence",
  };
}

function pairMember(provider, { status = "completed", role = "red", findings = [], error = null } = {}) {
  return {
    provider,
    status,
    identity: { provider },
    error,
    ...(status === "completed" ? { output: JSON.stringify({ findings }) } : {}),
    timing: null,
    usage: null,
    ...(role ? { role } : {}),
  };
}

function pairedRequest(materials = { decision: "current decision" }) {
  return {
    stage: "make-decision",
    review_track: "direction",
    host_provider: "codex",
    materials,
  };
}

function pairedDependencies(root, groupForRole, pairId) {
  return {
    pairId,
    loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: root, command: ["unused"] }),
    resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round", minimum_heterologous: 1 }),
    selectProviders: () => ({ providers: ["model-a", "model-b"] }),
    client: {
      async runGroup(request) {
        return groupForRole(request.role, request);
      },
    },
  };
}

async function runPair(groupForRole, label) {
  const root = attachmentRoot(`channel-fixture-${label}-`);
  return runSimpleReview(pairedRequest(), pairedDependencies(root, groupForRole, `pair-${label}`));
}

function baseBareRequest(label) {
  return {
    stage: "build-code",
    host_provider: "codex",
    task_id: taskId,
    snapshot_tree: `tree-${label}`,
    material_revision: `revision-${label}`,
    materials: { implementation: `channel fixture ${label}` },
  };
}

function bareResult(request, overrides = {}) {
  const material_id = createSimpleReviewPacket({ stage: request.stage, materials: request.materials }).material_id;
  return {
    status: "unavailable",
    stage: request.stage,
    review_track: null,
    review_kind: null,
    material_id,
    runtime_id: null,
    outcome: "unavailable",
    dispatch_state: "dispatched",
    provider_results: [],
    findings: [],
    ...overrides,
  };
}

describe("C4 managed channel fixtures", () => {
  it("keeps the portable OPN-2 collection contract with the two observed raw finding counts", () => {
    const collection = OPN_2_COLLECTION;
    expect(collection).toMatchObject({
      schema_version: "workflowhub-review-sink-collection.v1",
      task_id: taskId,
      authoritative: false,
      formal_review_result: false,
      review_origin: "unavailable",
      total_raw_findings: 61,
      sources: [
        { track: "direction", raw_findings: 20, review_origin: "unavailable" },
        { track: "detail", raw_findings: 41, review_origin: "unavailable" },
      ],
    });
    expect(collection.sources.every((source) => Array.isArray(source.evidence_refs) && source.evidence_refs.length > 0)).toBe(true);
  });

  it("keeps one side's findings and marks the failed role in a paired partial group", async () => {
    const result = await runPair((role, request) => ({
      runtimeId: `runtime-${role}`,
      outcome: role === "red" ? "partial" : "completed",
      providers: role === "red"
        ? [
            pairMember("model-a", { role, findings: [finding(role)] }),
            pairMember("model-b", { role, status: "failed", error: { code: "RATE_LIMITED", message: "fixture failure" } }),
          ]
        : [pairMember("model-a", { role }) , pairMember("model-b", { role })],
    }), "single-side");

    expect(result).toMatchObject({ status: "available-with-failures", red_incomplete: true });
    expect(result).not.toHaveProperty("blue_incomplete");
    expect(result.findings).toEqual([expect.objectContaining({ issue: "red fixture finding 1", role: "red" })]);
    expect(result.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "red", provider: "model-b", status: "failed", error: expect.objectContaining({ code: "RATE_LIMITED" }) }),
      expect.objectContaining({ role: "blue", provider: "model-a", status: "completed" }),
    ]));
  });

  it("keeps findings from both roles when both managed groups are partial", async () => {
    const result = await runPair((role) => ({
      runtimeId: `runtime-${role}`,
      outcome: "partial",
      providers: [
        pairMember("model-a", { role, findings: [finding(role)] }),
        pairMember("model-b", { role, status: "failed", error: { code: "RATE_LIMITED", message: `${role} fixture failure` } }),
      ],
    }), "both-sides");

    expect(result).toMatchObject({ status: "available-with-failures", red_incomplete: true, blue_incomplete: true });
    expect(result.findings.map(({ issue }) => issue).sort()).toEqual(["blue fixture finding 1", "red fixture finding 1"]);
    expect(result.provider_results.filter(({ status }) => status === "failed")).toHaveLength(2);
  });

  it("does not turn an empty provider package into a clean result", async () => {
    const result = await runPair((role) => ({
      runtimeId: `runtime-${role}`,
      outcome: "partial",
      providers: [],
    }), "empty-package");

    expect(result).toMatchObject({ status: "unavailable", dispatch_state: "dispatched" });
    expect(result.findings).toEqual([]);
    expect(result.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "model-a", status: "failed", error: expect.objectContaining({ code: "PROVIDER_RESULT_MISSING" }) }),
      expect.objectContaining({ provider: "model-b", status: "failed", error: expect.objectContaining({ code: "PROVIDER_RESULT_MISSING" }) }),
    ]));
  });

  it("preserves the five observable sink states, including blocked and dispatched-uncollected", async () => {
    const sinkRoot = attachmentRoot("channel-fixture-sink-states-");
    process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = sinkRoot;
    const cases = [
      ["available-complete", { status: "available", outcome: "completed", findings: [finding("complete")] }],
      ["available-partial", { status: "available", outcome: "partial", findings: [finding("partial")] }],
      ["available-with-failures", { status: "available-with-failures", outcome: "partial", findings: [finding("failure")] }],
      ["unavailable-blocked", { status: "unavailable", dispatch_state: "blocked_before_dispatch", outcome: "unavailable" }],
      ["unavailable-dispatched", { status: "unavailable", dispatch_state: "dispatched", outcome: "unavailable", error: { code: "REVIEW_WAIT_EXCEEDED", message: "fixture" } }],
    ];

    for (const [label, overrides] of cases) {
      const request = baseBareRequest(label);
      let runCount = 0;
      const result = await runReviewRecovery(request, {
        resolveRouteIdentity: () => overrides.dispatch_state === "blocked_before_dispatch"
          ? (() => { throw new Error("route unavailable fixture"); })()
          : ({ route_identity: "a".repeat(64) }),
        runRound: async () => {
          runCount += 1;
          return bareResult(request, {
            ...overrides,
            provider_results: overrides.status === "available-with-failures"
              ? [{ provider: "model-a", status: "completed" }, { provider: "model-b", status: "failed" }]
              : overrides.status === "available" ? [{ provider: "model-a", status: "completed" }] : [],
          });
        },
      });
      expect(result.status).toBe(overrides.status);
      expect(result.dispatch_state).toBe(overrides.dispatch_state ?? "dispatched");
      expect(runCount).toBe(overrides.dispatch_state === "blocked_before_dispatch" ? 0 : 1);
      const sink = JSON.parse(readFileSync(result.sink_ref, "utf8"));
      expect(sink.authoritative).toBe(false);
      expect(sink.result.status).toBe(overrides.status);
      expect(sink.result.dispatch_state).toBe(overrides.dispatch_state ?? "dispatched");
      if (overrides.findings) expect(sink.result.findings).toHaveLength(1);
    }
  });

  it("reads findings back from the sink and does not dispatch the same request twice", async () => {
    const sinkRoot = attachmentRoot("channel-fixture-sink-reuse-");
    process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = sinkRoot;
    const request = baseBareRequest("reuse");
    let runCount = 0;
    const runRound = async () => {
      runCount += 1;
      return bareResult(request, {
        status: "available-with-failures",
        outcome: "partial",
        provider_results: [{ provider: "model-a", status: "completed" }, { provider: "model-b", status: "failed" }],
        findings: [finding("reused")],
      });
    };
    const options = { runRound, resolveRouteIdentity: () => ({ route_identity: "b".repeat(64) }) };
    const first = await runReviewRecovery(request, options);
    const second = await runReviewRecovery(request, options);
    expect(runCount).toBe(1);
    expect(second).toMatchObject({ reused: true, dispatch_state: "reused", status: "available-with-failures" });
    expect(JSON.parse(readFileSync(first.sink_ref, "utf8")).result.findings).toEqual([expect.objectContaining({ issue: "reused fixture finding 1" })]);
    expect(JSON.parse(readFileSync(second.sink_ref, "utf8")).result.findings).toEqual([expect.objectContaining({ issue: "reused fixture finding 1" })]);
  });
});
