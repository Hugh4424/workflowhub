/**
 * Spike design component — FR-ST-003.
 * Receives the intake output object, resolves + reads the intake result file,
 * produces a design artifact file, returns the narrow-contract object.
 *
 * Importable: export runDesign(intakeOutput) -> { component_id, output_path }
 * CLI:        node design.mjs <intake-output-json-string>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { resolvePath } from "../../core/resolve-path.mjs";

const COMPONENT_ID = "spike-design";
const OUT_DIR = join(tmpdir(), "wfh-spike-design");

/**
 * @param {{ component_id: string, output_path: string }} intakeOutput
 * @returns {{ component_id: string, output_path: string }}
 */
export async function runDesign(intakeOutput) {
  if (!intakeOutput || !intakeOutput.output_path) {
    throw new Error("runDesign: intakeOutput with output_path is required");
  }

  // Resolve the intake output_path (FR-PATHG-004).
  const resolvedIntakePath = resolvePath(intakeOutput.output_path);

  // Real file read — design actually reads what intake wrote.
  const raw = readFileSync(resolvedIntakePath, "utf8");
  const intakeResult = JSON.parse(raw);

  // Derive a design artifact from the intake result.
  const designArtifact = {
    component_id: COMPONENT_ID,
    designed_at: new Date().toISOString(),
    // Echo a key fact from intake to prove we read the file.
    derived_from: resolvedIntakePath,
    intake_component: intakeResult.component_id,
    design_notes: `Design derived from intake source: ${intakeResult.source_path}`,
    input_fields: intakeResult.input_summary?.fields ?? [],
  };

  // Write output to OS tmpdir (never tracked by git).
  mkdirSync(OUT_DIR, { recursive: true });
  // Unique filename per intake path to avoid collision.
  const slug = createHash("sha256").update(resolvedIntakePath).digest("hex").slice(0, 8);
  const outPath = join(OUT_DIR, `design-result-${slug}.json`);
  writeFileSync(outPath, JSON.stringify(designArtifact, null, 2), "utf8");

  // Return the narrow-contract object.
  return {
    component_id: COMPONENT_ID,
    output_path: outPath,
  };
}

// CLI entry point: accepts intake output JSON as first arg.
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const intakeOutput = JSON.parse(process.argv[2] ?? "{}");
  runDesign(intakeOutput).then((output) => {
    process.stdout.write(JSON.stringify(output) + "\n");
  });
}
