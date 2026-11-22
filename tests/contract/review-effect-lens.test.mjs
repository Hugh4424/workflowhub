import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { parseReviewerOutput } from "../../runtime/review/review-output.mjs";
import { aggregateCanonicalProviderResults } from "../../runtime/review/canonical-review-result.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { reviewInstructionsFor } from "../../skills/wh-review/scripts/review-materials.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

const finding = (lens = "user_effect") => ({
  severity: "major", path: "material.md", line: 7,
  issue: "The plan author receives the wrong package",
  recommendation: "Bind all five materials to the current package",
  root_cause: "The current card pointer is not bound to the delivered package",
  evidence_kind: "direct", evidence: "material.md:7 names another package", lens,
});
const member = (provider, role, review) => ({
  provider, role, status: "completed", parse_outcome: "ok",
  identity: { provider, adapter: provider.split("/")[0], source_id: `${provider}-source`, config_id: `${provider}-config` },
  review: { findings: [finding(review)] },
});

describe("ORACLE-REVIEW-LENS real instructions and controlled vocabulary", () => {
  it("delivers the fifth effect question and lens contract in direction and detail instructions", () => {
    for (const [track, mode] of [["direction", "combined"], ["direction", "challenge"], ["direction", "full"], ["detail", "full"]]) {
      const text = reviewInstructionsFor("make-decision", track, false, null, null, mode);
      expect(text, `${track}/${mode} must include question five`).toContain("(5) who observes");
      for (const expected of ["when do they observe", "using what evidence", "what does the user actually see", "lens"]) {
        expect(text, `${track}/${mode} missing ${expected}`).toContain(expected);
      }
    }
  });

  it("selects the build-plan finding budget by stage alone, with a non-build-plan negative control", () => {
    for (const role of [null, "red", "blue"]) {
      expect(reviewInstructionsFor("build-plan", null, false, null, null, "full", role)).toContain("每条 finding 给五项");
    }
    expect(reviewInstructionsFor("make-decision", "direction", false, null, null, "full", "red")).not.toContain("每条 finding 给五项");
  });

  it("preserves a legal lens through the public parser and rejects provider or role names", () => {
    const parsed = parseReviewerOutput(JSON.stringify({ findings: [finding()] }));
    expect(parsed.findings[0]).toMatchObject({ lens: "user_effect", path: "material.md", line: 7 });
    for (const lens of ["codex", "red", "blue"]) {
      expect(() => parseReviewerOutput(JSON.stringify({ findings: [finding(lens)] })), `${lens} is not a review lens`).toThrow(/lens/i);
    }
  });
});

describe("ORACLE-REVIEW-LENS paired and canonical contribution retention", () => {
  it("keeps equal issues separate across lenses and retains same-lens contributors", () => {
    const different = aggregateCanonicalProviderResults([
      member("codex/owned", "red", "user_effect"), member("other/owned", "blue", "acceptance"),
    ], 1);
    expect(different.findings).toHaveLength(2);
    expect(new Set(different.findings.map(item => item.lens))).toEqual(new Set(["user_effect", "acceptance"]));

    const same = aggregateCanonicalProviderResults([
      member("codex/owned", "red", "user_effect"), member("other/owned", "blue", "user_effect"),
    ], 1);
    expect(same.findings).toHaveLength(1);
    expect(same.findings[0].lens).toBe("user_effect");
    expect(same.findings[0].providers.sort()).toEqual(["codex/owned", "other/owned"]);
    expect(same.findings[0].provider_findings.every(item => item.lens === "user_effect")).toBe(true);
  });
});

describe("ORACLE-REVIEW-LENS unique record route", () => {
  it("persists lens with provider, role and readable provider-original bytes", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "review-effect-lens-")));
    roots.push(root);
    const repo = join(root, "repo");
    mkdirSync(repo);
    const task = await createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: randomUUID(),
      created_at: "2026-11-22T00:00:00Z", target_repo_root: repo,
      activation_cohort: "post", record_model: "vnext-single-write",
      execution_mode: "per_invocation", issue_ids: [], inputs: {},
    } });
    const provider = "codex/owned", role = "red", claim = { ...finding(), provider, role };
    const ref = await recordSimpleReviewRequest({
      taskDir: task.taskPath,
      request: { stage: "make-decision", review_track: "direction", materials: { raw_requirement: "Deliver the discussed package" } },
      runRound: async (_input, { onProviderOutput }) => {
        const output = JSON.stringify({ findings: [claim] });
        const raw_output_ref = await onProviderOutput({ provider, output });
        return {
          status: "available",
          provider_results: [{ provider, role, status: "completed", parse_outcome: "ok", raw_output_ref,
            identity: { provider, adapter: "codex", source_id: "owned-source", config_id: "owned-config" } }],
          findings: [claim],
        };
      },
    });
    const saved = JSON.parse(task.readRecord(ref.result_ref));
    expect(saved.findings[0]).toMatchObject({ lens: "user_effect", provider, role });
    const rawRef = saved.provider_results[0].raw_output_ref;
    expect(rawRef).toEqual(expect.any(String));
    expect(JSON.parse(task.readRecord(rawRef)).findings[0].lens).toBe("user_effect");
  });
});

describe("ORACLE-REVIEW-LENS historical compatibility versus new-output failures", () => {
  it("reads a historical finding without lens as unknown", () => {
    const historical = member("codex/owned", "red", "user_effect");
    delete historical.review.findings[0].lens;
    const result = aggregateCanonicalProviderResults([historical], 1);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].lens).toBe("unknown");
  });

  for (const track of ["direction", "detail"]) {
    it(`does not record a clean available ${track} result when the new finding omits lens`, async () => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), `review-missing-lens-${track}-`)));
      roots.push(root);
      const repo = join(root, "repo");
      mkdirSync(repo);
      const task = await createTask({ storageRoot: root, manifest: {
        schema_version: "1.0.0", project_name: "workflowhub", task_id: randomUUID(),
        created_at: "2026-11-22T00:00:00Z", target_repo_root: repo,
        activation_cohort: "post", record_model: "vnext-single-write",
        execution_mode: "per_invocation", issue_ids: [], inputs: {},
      } });
      const provider = "codex/owned", role = "red", claim = { ...finding(), provider, role };
      delete claim.lens;
      const ref = await recordSimpleReviewRequest({
        taskDir: task.taskPath,
        request: {
          stage: "make-decision", review_track: track,
          materials: {
            raw_requirement: "Deliver the discussed package",
            ...(track === "detail" ? { approved_direction: "Use the current package" } : {}),
          },
        },
        runRound: async () => ({
          status: "available",
          provider_results: [{ provider, role, status: "completed", parse_outcome: "ok",
            identity: { provider, adapter: "codex", source_id: "owned-source", config_id: "owned-config" } }],
          findings: [claim],
        }),
      });
      const saved = JSON.parse(task.readRecord(ref.result_ref));
      expect(saved.findings).toHaveLength(1);
      expect(saved.status, `new ${track} output without lens must remain failed or incomplete`).not.toBe("available");
    });
  }
});
