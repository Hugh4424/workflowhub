import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const json = (path) => JSON.parse(read(path));

const trace = json("specs/m14a-audit-contract-layer/execution-trace.schema.json");
const inventory = json("specs/m14a-audit-contract-layer/skills-inventory.schema.json");
const taxonomy = read("specs/m14a-audit-contract-layer/quality-failure-taxonomy.md");
const surfaces = read("specs/m14a-audit-contract-layer/harness-surface.md");
const spec = read("specs/m14a-audit-contract-layer/spec.md");

const traceRequired = [
  "run_id", "session_id", "stage", "step_id", "attempt_id", "skill", "skill_version",
  "task_id", "task_dir", "worktree_root", "started_at", "status", "transcript_refs",
  "artifact_refs", "facts_refs", "provenance", "schema_version", "collector_version",
  "collector_supported_schema_versions",
];
const domains = [
  "task_dir", "worktree", "review", "verify", "handoff", "transcript",
  "skill_missing", "artifact_missing", "token_waste",
];
const surfaceNames = ["schema", "orchestrator", "skills", "adapters", "dashboard"];
const permissions = ["locked", "append_only", "editable", "human_controlled"];

function markdownRows(document, names) {
  return document
    .split("\n")
    .filter((line) => names.some((name) => line.startsWith("| " + name + " |")));
}

describe("M14a audit contract layer", () => {
  it("publishes parseable JSON schemas with closed object roots", () => {
    expect(trace).toMatchObject({ type: "object", additionalProperties: false });
    expect(inventory).toMatchObject({ type: "object", additionalProperties: false });
  });

  it("requires the execution-trace identity, context, result, reference, and version fields", () => {
    expect(trace.required).toEqual(expect.arrayContaining(traceRequired));
    for (const field of traceRequired) expect(trace.properties[field]).toBeDefined();
  });

  it("keeps execution status and provenance unknown semantics explicit", () => {
    expect(trace.properties.status.enum).toEqual([
      "pending", "running", "success", "failed", "blocked", "unknown", "skipped",
    ]);
    const provenance = trace.properties.provenance;
    expect(provenance.required).toEqual(["source_type", "source_ref", "confidence"]);
    expect(provenance.properties.source_type.enum).toContain("unknown");
    expect(provenance.properties.confidence.enum).toContain("unknown");
  });

  it("separates contract and collector versions instead of accepting one ambiguous version", () => {
    expect(trace.properties.version).toBeUndefined();
    expect(trace.properties.skill_version.type).toBe("string");
    expect(trace.properties.schema_version.type).toBe("string");
    expect(trace.properties.collector_version.type).toBe("string");
    expect(trace.properties.collector_supported_schema_versions).toMatchObject({
      type: "object", additionalProperties: false, required: ["min", "max"],
    });
  });

  it("uses typed, reusable fact references", () => {
    for (const field of ["transcript_refs", "artifact_refs", "facts_refs"]) {
      expect(trace.properties[field]).toMatchObject({
        type: "array", items: { $ref: "#/$defs/ref" },
      });
    }
    expect(trace.$defs.ref.properties.kind.enum).toEqual([
      "transcript", "artifact", "facts", "provenance", "human",
    ]);
  });

  it("keeps skills inventory as metadata, with no per-skill execution interface", () => {
    const skill = inventory.properties.skills.items;
    expect(inventory.required).toEqual(["schema_version", "generated_at", "skills"]);
    expect(skill.additionalProperties).toBe(false);
    expect(skill.required).toEqual([
      "name", "path", "version", "stage", "owner", "source",
      "portable", "metrics_expected", "subagent_friendly",
    ]);
    expect(skill.properties.source.enum).toEqual(["repo", "external_adapted", "unknown"]);
    for (const forbidden of ["index.mjs", "command", "runtime", "entrypoint"]) {
      expect(skill.properties[forbidden]).toBeUndefined();
    }
  });

  it("makes every declared required read non-empty", () => {
    expect(inventory.properties.skills.items.properties.required_reads).toMatchObject({
      type: "array", items: { type: "string", minLength: 1 },
    });
  });

  it("fixes the failure taxonomy to exactly nine domains", () => {
    const rows = taxonomy.split("\n")
      .filter((line) => line.startsWith("| \`"))
      .map((line) => line.split("|")[1].trim().replaceAll("\`", ""));
    expect(rows).toEqual(domains);
    expect(new Set(rows).size).toBe(domains.length);
  });

  it("keeps taxonomy descriptive rather than a severity, diagnosis, or solution engine", () => {
    expect(taxonomy).toContain("不表达解决方案、severity、root cause 或判断算法");
    expect(taxonomy).toContain("这类采集实现变更只更新 collector implementation version");
  });

  it("defines exactly five governed harness surfaces with all ownership fields", () => {
    const rows = markdownRows(surfaces, surfaceNames);
    expect(rows).toHaveLength(surfaceNames.length);
    for (const row of rows) {
      const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
      expect(cells).toHaveLength(5);
      expect(cells.every(Boolean)).toBe(true);
    }
  });

  it("defines the four permissions as governance semantics, not enforcement", () => {
    const rows = surfaces.split("\n")
      .filter((line) => line.startsWith("| \`"))
      .map((line) => line.split("|")[1].trim().replaceAll("\`", ""));
    expect(rows).toEqual(permissions);
    expect(surfaces).toContain("不授权自动流程、不触发自动修改，也不构成 blocking enforcement");
  });

  it("keeps the spec handoff-readable and artifact-first", () => {
    const top = spec.split("\n").slice(0, 30).join("\n");
    expect(top).toContain("速读卡（30 秒看懂这个需求）");
    expect(spec).toContain("**Known Gaps**");
    expect(spec).toContain("| 字段 | 归属层 | 生成者 | 采集方式 | 消费视图 | 可信来源 |");
    expect(spec).toContain("### 5. handoff required_reads");
    expect(spec).toContain("长报告写入 artifact 文件，回报只传路径");
  });

  it("keeps all required contract and evidence references discoverable", () => {
    for (const reference of [
      "specs/m14a-audit-contract-layer/spec.md",
      "specs/m14a-audit-contract-layer/execution-trace.schema.json",
      "specs/m14a-audit-contract-layer/quality-failure-taxonomy.md",
      "specs/m14a-audit-contract-layer/skills-inventory.schema.json",
      "specs/m14a-audit-contract-layer/harness-surface.md",
      "{task_root}/artifacts/build-spec-constitution-check.md",
      "{task_root}/artifacts/build-spec-baseline-report.md",
      "{task_root}/artifacts/build-spec-f10-analysis.md",
      "{task_root}/artifacts/build-spec-review-runner-diagnosis.md",
      "{task_root}/reviews/",
    ]) expect(spec).toContain(reference);
  });
});
