#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const VALID_TYPES = ["direct", "proxy", "weak_proxy"];
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const evidencePath = (evidence) => evidence.task_root ? join(evidence.task_root, evidence.path) : evidence.path;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function validateStageContent([specPath, planPath, tasksPath]) {
  for (const path of [specPath, planPath, tasksPath]) {
    if (!path || !existsSync(path)) fail(`missing canonical input: ${path ?? "<unset>"}`);
  }
  const reportPath = "apply/evidence/stage-content-coverage.json";
  if (!existsSync(reportPath)) fail(`missing coverage report: ${reportPath}`);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const expected = {
    requirements: 61,
    acceptance_criteria: 53,
    original_problems: 5,
    constitution_principles: 21,
  };
  for (const [section, count] of Object.entries(expected)) {
    const entries = report[section];
    if (!Array.isArray(entries) || entries.length !== count) fail(`${section} expected ${count}, got ${entries?.length ?? "missing"}`);
    if (new Set(entries.map((entry) => entry.id)).size !== count) fail(`${section} contains duplicate IDs`);
    for (const entry of entries) {
      if (!entry.source_ref?.path || !existsSync(entry.source_ref.path)) fail(`${section}/${entry.id} has no real source ref`);
      if (!["verified", "unknown"].includes(entry.evidence_status)) fail(`${section}/${entry.id} has invalid evidence status`);
      if (entry.evidence_status === "unknown" && !entry.unknown_reason) fail(`${section}/${entry.id} hides unknown evidence`);
      for (const evidence of entry.evidence_refs ?? []) {
        const absoluteEvidence = evidencePath(evidence);
        if (!existsSync(absoluteEvidence)) fail(`${section}/${entry.id} evidence ref is missing: ${evidence.path}`);
        if (evidence.sha256 !== sha256(absoluteEvidence)) fail(`${section}/${entry.id} evidence hash mismatch: ${evidence.path}`);
      }
    }
    if (report.totals?.[section]?.covered !== count || report.totals?.[section]?.expected !== count) {
      fail(`${section} summary does not prove ${count}/${count} coverage`);
    }
  }
  const spec = readFileSync(specPath, "utf8");
  const tasks = readFileSync(tasksPath, "utf8");
  const frIds = [...new Set(spec.match(/FR-[A-Z]+-[0-9]{3}/gu) ?? [])];
  const acIds = [...new Set(spec.match(/AC[0-9]+/gu) ?? [])];
  if (frIds.length !== 61 || acIds.length !== 53) fail(`canonical spec cardinality mismatch: ${frIds.length} FR / ${acIds.length} AC`);
  const orphanFr = frIds.filter((id) => !tasks.includes(id));
  const orphanAc = acIds.filter((id) => !tasks.includes(id));
  if (orphanFr.length || orphanAc.length) fail(`orphan mappings: FR=${orphanFr.join(",")} AC=${orphanAc.join(",")}`);
  console.log(
    `stage-content coverage: PASS (61/61 FR, 53/53 AC, 5/5 original problems, 21/21 constitution; `
    + `unknown is explicit: FR=${report.totals.requirements.unknown}, AC=${report.totals.acceptance_criteria.unknown}, `
    + `problems=${report.totals.original_problems.unknown}, constitution=${report.totals.constitution_principles.unknown})`,
  );
}

function validateM10() {
  const schema = JSON.parse(readFileSync("contracts/field-mapping.schema.json", "utf8"));
  if (!schema.title) fail("missing schema title");
  if (schema.properties.mappings.minItems !== 5) fail("minItems != 5");
  if (schema.properties.mappings.items.required.length !== 7) fail("required != 7 columns");
  if (!schema.properties.mappings.items.properties.source_type.enum.every((type) => VALID_TYPES.includes(type))) {
    fail("source_type enum mismatch");
  }
  const rows = readFileSync("specs/m10-baseline-switch/field-mapping.md", "utf8").split("\n").filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("|") && VALID_TYPES.some((value) => trimmed.includes(value));
  });
  if (rows.length !== 5) fail(`expected exactly 5 data rows, got ${rows.length}`);
  for (const row of rows) {
    const columns = row.split("|").map((column) => column.trim()).filter(Boolean);
    if (columns.length !== 7) fail(`expected 7 columns, got ${columns.length}`);
    if (!VALID_TYPES.includes(columns[5])) fail(`invalid source_type "${columns[5]}"`);
  }
  console.log("M10 field-mapping: PASS (schema valid, 5 rows × 7 cols with valid source_types)");
}

const inputs = process.argv.slice(2);
if (inputs[0]?.endsWith("stage-content-contracts/spec.md")) validateStageContent(inputs);
else validateM10();
