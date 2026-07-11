import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { prepareReview, executeReview, normalizeMaterialSources } from "../wh-review-cli.mjs";

const roots = [];
afterEach(() => {
  const makeRemovable = (path) => {
    let stat; try { stat = lstatSync(path); } catch { return; }
    if (!stat.isDirectory() || stat.isSymbolicLink()) { try { chmodSync(path, 0o644); } catch {} return; }
    try { chmodSync(path, 0o755); } catch {}
    for (const name of readdirSync(path)) makeRemovable(join(path, name));
  };
  for (const root of roots.splice(0)) {
    makeRemovable(root);
    rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 10 });
  }
});

function temporaryRoot(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  roots.push(root);
  return root;
}

describe("stable wh-review facade", () => {
  it("normalizes exact stage descriptors and supported aliases", () => {
    expect(normalizeMaterialSources([{ id: "source:plan", path: "/tmp/plan.md" }])).toEqual([{ id: "source:plan", path: "/tmp/plan.md" }]);
    expect(normalizeMaterialSources([{ source_id: "source:spec", file_path: "/tmp/spec.md" }])).toEqual([{ id: "source:spec", path: "/tmp/spec.md" }]);
  });

  it.each([null, {}, [{ id: "missing-path" }], [{ path: "/tmp/missing-id" }], [{ id: "bad id", path: "/tmp/x" }]])(
    "rejects malformed material_sources safely: %j",
    (value) => expect(() => normalizeMaterialSources(value)).toThrow(/material_sources/),
  );

  it.each([
    [{ id: "source:a", source_id: "source:a", path: "/tmp/a" }],
    [{ id: "source:a", sourceId: "source:b", path: "/tmp/a" }],
    [{ id: "source:a", path: "/tmp/a", file_path: "/tmp/a" }],
    [{ id: "source:a", path: "/tmp/a", extra: true }],
    [{ id: "source:a", path: "/tmp/a" }, { id: "source:a", path: "/tmp/b" }],
    [{ id: "source:a", path: "/tmp/a\0tail" }],
  ])("rejects ambiguous or unsafe descriptor keys: %j", (value) => {
    expect(() => normalizeMaterialSources(value)).toThrow(/material_sources/);
  });
  it.each(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"])(
    "prepares the %s stage through the same adapter contract",
    (stage) => {
      const result = prepareReview({ task_id: `facade-${stage}`, stage, task_tracking_root: temporaryRoot("wh-facade-") });
      expect(result).toMatchObject({ status: "ready", total_round: 1 });
      expect(result.review_flow_id).toBeTruthy();
      expect(result.contract_path).toBeTruthy();
    }
  );

  it("propagates backend attestation fields without flattening them away", async () => {
    const root = temporaryRoot("wh-facade-execute-");
    const runnerDir = temporaryRoot("wh-facade-runner-");
    const runner = join(runnerDir, "runner.mjs");
    writeFileSync(runner, `
      import { readFileSync, writeFileSync } from "node:fs";
      const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
      const payload = JSON.parse(readFileSync(args.diff, "utf8"));
      writeFileSync(args.output, JSON.stringify({ verdict:"pass", findings:[], actual_mode:payload.mode,
        provider:"claude-code", backend_provider:"claude-code", reviewer_source:"Claude Code test",
        trueCrossEngine:true, synthetic:false, execution_status:"completed", diagnostic_path:"/diagnostic.json",
        artifactCoverage:payload.artifact_manifest.entries.map(({id,sha256}) => ({id,sha256,status:"read"})) }));
    `);
    const prep = prepareReview({ task_id: "facade-execute", stage: "build-code", task_tracking_root: root });
    const prompt = join(root, "facade-execute", "reviews", `prompt-${prep.review_flow_id}-r${prep.total_round}.md`);
    mkdirSync(dirname(prompt), { recursive: true });
    writeFileSync(prompt, "review this");

    const result = await executeReview({
      task_id: "facade-execute", stage: "build-code", task_tracking_root: root,
      review_flow_id: prep.review_flow_id, total_round: prep.total_round,
      current_content: "candidate", git_sha: "abc", covered_paths: [],
      provider: "claude-code", host_provider: "openai-codex",
      env: { THIRD_REVIEW_RUNNER: runner },
    });
    expect(result).toMatchObject({
      provider: "claude-code", backend_provider: "claude-code", reviewer_source: "Claude Code test",
      trueCrossEngine: true, synthetic: false, execution_status: "completed", diagnostic_path: "/diagnostic.json",
    });
  });

  it.each([
    ["claude-code", "same-source-provider"],
    [undefined, "host-provider-unknown"],
  ])("fails closed for host=%s", async (hostProvider, failureReason) => {
    const root = temporaryRoot("wh-facade-closed-");
    const prep = prepareReview({ task_id: "facade-closed", stage: "build-code", task_tracking_root: root });
    const prompt = join(root, "facade-closed", "reviews", `prompt-${prep.review_flow_id}-r${prep.total_round}.md`);
    mkdirSync(dirname(prompt), { recursive: true });
    writeFileSync(prompt, "review this");
    const result = await executeReview({ task_id: "facade-closed", stage: "build-code", task_tracking_root: root,
      review_flow_id: prep.review_flow_id, total_round: prep.total_round, current_content: "candidate",
      git_sha: "abc", covered_paths: [], provider: "claude-code", host_provider: hostProvider });
    expect(result).toMatchObject({ verdict: "escalate_to_human", synthetic: true,
      trueCrossEngine: false, failure_reason: failureReason });
  });
});
