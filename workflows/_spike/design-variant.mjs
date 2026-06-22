/**
 * Spike design VARIANT component — proves contract-invariance (T009).
 * A DISTINCT implementation from design.mjs:
 *   - different COMPONENT_ID ("spike-design-variant")
 *   - different output directory (wfh-spike-design-variant)
 *   - different artifact shape: flat summary with field_csv + char_count
 *     instead of design_notes / input_fields array
 *   - slug derived from file mtime (not sha256 of path)
 * Still consumes ONLY { component_id, output_path } from intake via resolvePath,
 * still returns a contract-valid { component_id, output_path }.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolvePath } from "../../core/resolve-path.mjs";

const COMPONENT_ID = "spike-design-variant";
const OUT_DIR = join(tmpdir(), "wfh-spike-design-variant");

/**
 * @param {{ component_id: string, output_path: string }} intakeOutput
 * @returns {{ component_id: string, output_path: string }}
 */
export async function runDesignVariant(intakeOutput) {
  if (!intakeOutput || !intakeOutput.output_path) {
    throw new Error("runDesignVariant: intakeOutput with output_path is required");
  }

  // Resolve via the same narrow-contract entry point.
  const resolvedIntakePath = resolvePath(intakeOutput.output_path);

  // Real file read — distinct processing: count chars and list fields as CSV.
  const raw = readFileSync(resolvedIntakePath, "utf8");
  const intakeResult = JSON.parse(raw);

  const fieldCsv = (intakeResult.input_summary?.fields ?? []).join(",");
  const charCount = raw.length;

  // Distinct artifact shape from design.mjs.
  const variantArtifact = {
    component_id: COMPONENT_ID,
    variant_at: new Date().toISOString(),
    source_component: intakeOutput.component_id,
    field_csv: fieldCsv,
    char_count: charCount,
  };

  // Write to a different tmpdir to avoid collision with design.mjs output.
  mkdirSync(OUT_DIR, { recursive: true });
  // Slug from mtime (different derivation from design.mjs which uses sha256 of path).
  const mtime = statSync(resolvedIntakePath).mtimeMs;
  const outPath = join(OUT_DIR, `variant-result-${mtime}.json`);
  writeFileSync(outPath, JSON.stringify(variantArtifact, null, 2), "utf8");

  return {
    component_id: COMPONENT_ID,
    output_path: outPath,
  };
}
