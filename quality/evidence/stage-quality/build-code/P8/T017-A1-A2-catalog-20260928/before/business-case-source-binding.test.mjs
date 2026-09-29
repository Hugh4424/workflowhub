import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const catalogPath = resolve(root, "docs/quality/business-case-catalog.json");
const phaseRoot = "specs/workflowhub-thin-core-card-04-20260919";
const expected = Object.freeze({
  "CARD04-DECISION-LOG-CENSUS": {
    acId: "AC-26",
    source: `${phaseRoot}/decision-log.md`,
    rule: `${phaseRoot}/phases/P6.md`,
    ruleId: "CARD-04-RULING-P6-FULL-EXEC / FR-26",
    sourceMarkers: ["## 需求变更记录", "## 原始需求索引", "## 逐字声明层（verbatim）"],
    ruleMarkers: ["### T009", "source_units"],
  },
  "CARD04-ACCEPTANCE-MACHINE-CLASSES": {
    acId: "AC-27",
    source: `${phaseRoot}/phases/P7.md`,
    rule: `${phaseRoot}/phases/P7.md`,
    ruleId: "CARD-04-RULING-A1-TRUTH / FR-27",
    sourceMarkers: ["### T015", "8 值"],
    ruleMarkers: ["deferred", "incomplete"],
  },
  "CARD04-DEFERRED-ACCEPTANCE-REGRESSION": {
    acId: "AC-27",
    source: `${phaseRoot}/phases/P7.md`,
    rule: `${phaseRoot}/phases/P7.md`,
    ruleId: "CARD-04-RULING-A1-TRUTH / FR-27",
    sourceMarkers: ["### T015", "tests/deferred-acceptance-semantics.test.mjs"],
    ruleMarkers: ["deferred", "quality-fact.v1.status"],
  },
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourceRevision = (path) => `sha256:${sha256(readFileSync(resolve(root, path)))}`;

function bindingErrors(entry, authority) {
  const errors = [];
  if (entry?.source?.path !== authority.source) errors.push("wrong source.path");
  if (typeof entry?.source?.path !== "string" || !existsSync(resolve(root, entry.source.path))) {
    errors.push("missing declared source");
  }
  if (!existsSync(resolve(root, authority.source))) errors.push("missing authoritative source");
  else {
    const sourceText = readFileSync(resolve(root, authority.source), "utf8");
    if (entry?.source?.revision !== sourceRevision(authority.source)) errors.push("stale source.revision");
    for (const marker of authority.sourceMarkers) {
      if (!sourceText.includes(marker)) errors.push(`missing source rule marker: ${marker}`);
    }
  }
  if (!existsSync(resolve(root, authority.rule))) errors.push("missing authoritative rule");
  else {
    const ruleText = readFileSync(resolve(root, authority.rule), "utf8");
    if (entry?.rule?.revision !== sourceRevision(authority.rule)) errors.push("stale rule.revision");
    for (const marker of authority.ruleMarkers) {
      if (!ruleText.includes(marker)) errors.push(`missing rule marker: ${marker}`);
    }
  }
  if (entry?.rule?.id !== authority.ruleId) errors.push("wrong rule.id");
  return errors;
}

function observationContractErrors(entry, authority) {
  const value = entry?.effect_observation;
  if (!value || typeof value !== "object") return ["missing observation contract"];
  const errors = [];
  if (value.schema_version !== "workflowhub-business-effect-observation.v1") errors.push("wrong observation schema");
  if (value.observation_status !== "not_yet_observed") errors.push("unproven effect was claimed observed");
  if (value.rule_revision !== entry.rule.revision) errors.push("observation uses another rule revision");
  const source = value.canonical_source;
  if (source?.type !== "current_task_acceptance_quality_fact_chain"
      || source?.stage !== "build-code" || source?.subject !== authority.acId
      || source?.quality_fact_schema !== "quality-fact.v1"
      || source?.quality_fact_ref_template !== "quality/facts/{fact_digest}.json"
      || source?.acceptance_schema !== "acceptance-evidence.v1"
      || source?.acceptance_ref_template !== `quality/evidence/acceptance/build-code/${authority.acId}-{acceptance_sha256}.json`
      || !Array.isArray(source?.required_binding)
      || ["task_id", "snapshot_tree", "material_revision", "ref_sha256"].some((key) => !source.required_binding.includes(key))) {
    errors.push("canonical quality fact source is unbound");
  }
  if (value.reader?.owner !== "CARD-04 P10/T021"
      || value.reader?.implementation_status !== "not_implemented"
      || typeof value.reader?.interface !== "string" || !value.reader.interface.includes("TaskHandle")
      || !Array.isArray(value.reader?.consumers)
      || !["P10/T021 case reconciliation", "verify-code read-only sampling"].every((name) => value.reader.consumers.includes(name))) {
    errors.push("read-only reader owner or consumer missing");
  }
  if (typeof value.positive_predicate !== "string" || value.positive_predicate.trim() === ""
      || typeof value.negative_predicate !== "string" || value.negative_predicate.trim() === "") {
    errors.push("positive/negative business predicate missing");
  }
  if (value.missing_evidence_outcome !== "unknown" || value.stale_evidence_outcome !== "unknown") {
    errors.push("missing or stale evidence was treated as success");
  }
  if (!Array.isArray(value.ac_ids) || !value.ac_ids.includes(authority.acId)) errors.push("AC link missing");
  if (entry?.id === "CARD04-ACCEPTANCE-MACHINE-CLASSES") {
    if (value.producer_status !== "not_implemented" || value.capability_scope !== "helper_validator_only") {
      errors.push("AC-27 machine-class producer falsely claimed ready");
    }
    if (!/helper.*validator.*capability/i.test(value.positive_predicate ?? "")) {
      errors.push("helper capability was presented as an official AC-27 effect");
    }
    if (!/deferred.*stage_end_spec_analyze.*AC-27/i.test(value.negative_predicate ?? "")) {
      errors.push("different-subject or deferred evidence could falsely satisfy AC-27");
    }
  }
  return errors;
}

describe("CARD-04 P8 case source binding", () => {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const cases = new Map(catalog.cases.map((entry) => [entry.id, entry]));

  for (const [id, authority] of Object.entries(expected)) {
    it(`${id} binds its source and rule revision to current material bytes`, () => {
      expect(cases.has(id)).toBe(true);
      expect(bindingErrors(cases.get(id), authority)).toEqual([]);
    });
  }

  it("rejects a different existing source, a missing source, and a stale rule revision", () => {
    const id = "CARD04-ACCEPTANCE-MACHINE-CLASSES";
    const authority = expected[id];
    const entry = cases.get(id);
    expect(entry).toBeDefined();
    expect(bindingErrors({ ...entry, source: { ...entry.source, path: `${phaseRoot}/decision-log.md` } }, authority))
      .toContain("wrong source.path");
    expect(bindingErrors({ ...entry, source: { ...entry.source, path: `${phaseRoot}/phases/absent.md` } }, authority))
      .toContain("missing declared source");
    expect(bindingErrors({ ...entry, rule: { ...entry.rule, revision: `sha256:${"0".repeat(64)}` } }, authority))
      .toContain("stale rule.revision");
  });

  it("pins the proposed effect reader to the existing canonical fact and acceptance ref writers", () => {
    const qualityFactProducer = readFileSync(resolve(root, "runtime/evidence/quality-fact.mjs"), "utf8");
    const stageProducer = readFileSync(resolve(root, "runtime/stage/stage-runner.mjs"), "utf8");
    expect(qualityFactProducer).toContain("quality/facts/${digest}.json");
    expect(stageProducer).toContain("quality/evidence/acceptance/${ctx.stage}/${subject}-${acceptanceHash}.json");
    expect(stageProducer).toContain('ctx.stage === "build-code" && Array.isArray(result.facts?.acceptance_coverage?.items)');
  });

  for (const [id, authority] of Object.entries(expected)) {
    it(`${id} records a source-bound future observation without claiming an effect`, () => {
      expect(observationContractErrors(cases.get(id), authority)).toEqual([]);
    });
  }

  it("rejects fake observation and missing-evidence success in the proposed contract", () => {
    const entry = cases.get("CARD04-DECISION-LOG-CENSUS");
    const authority = expected[entry.id];
    expect(entry.effect_observation).toBeDefined();
    expect(observationContractErrors({ ...entry, effect_observation: {
      ...entry.effect_observation, observation_status: "observed",
    } }, authority)).toContain("unproven effect was claimed observed");
    expect(observationContractErrors({ ...entry, effect_observation: {
      ...entry.effect_observation, missing_evidence_outcome: "pass",
    } }, authority)).toContain("missing or stale evidence was treated as success");
  });

  it("does not let deferred or another subject stand in for AC-27 machine-class effects", () => {
    const id = "CARD04-ACCEPTANCE-MACHINE-CLASSES";
    const entry = cases.get(id);
    const authority = expected[id];
    const stageProducer = readFileSync(resolve(root, "runtime/stage/stage-runner.mjs"), "utf8");
    expect(stageProducer).toContain('subject !== "stage_end_spec_analyze"');
    expect(stageProducer).toContain('subject: "stage_end_spec_analyze"');
    expect(stageProducer).toContain('if (status === "deferred" || status === "missing" || status === "not_applicable") return "deferred"');
    expect(observationContractErrors(entry, authority)).toEqual([]);
    expect(observationContractErrors({ ...entry, effect_observation: {
      ...entry.effect_observation,
      producer_status: "implemented",
    } }, authority)).toContain("AC-27 machine-class producer falsely claimed ready");
  });
});
