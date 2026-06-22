/**
 * Spike intake component — FR-ST-002.
 * Reads an input file, writes a result file to OS tmpdir, returns the narrow-contract object.
 *
 * Importable: export runIntake(inputPath) -> { component_id, output_path }
 * CLI:        node intake.mjs <input-file-path>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const COMPONENT_ID = "spike-intake";
const OUT_DIR = join(tmpdir(), "wfh-spike-intake");

/**
 * @param {string} inputPath - absolute path to an input JSON file to read
 * @returns {{ component_id: string, output_path: string }}
 */
export async function runIntake(inputPath) {
  if (!inputPath) {
    throw new Error("runIntake: inputPath is required");
  }

  // Real file read.
  const raw = readFileSync(inputPath, "utf8");
  const inputData = JSON.parse(raw);

  // Produce an output record — enrich with intake metadata.
  const result = {
    component_id: COMPONENT_ID,
    source_path: inputPath,
    received_at: new Date().toISOString(),
    input_summary: {
      field_count: Object.keys(inputData).length,
      fields: Object.keys(inputData),
      raw: inputData,
    },
  };

  // Write output to OS tmpdir (never tracked by git).
  mkdirSync(OUT_DIR, { recursive: true });
  // Unique filename per input to avoid collision when test calls intake twice.
  const slug = createHash("sha256").update(inputPath).digest("hex").slice(0, 8);
  const outPath = join(OUT_DIR, `intake-result-${slug}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");

  // Return the narrow-contract object.
  return {
    component_id: COMPONENT_ID,
    output_path: outPath,
  };
}

// CLI entry point.
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const inputPath = process.argv[2];
  runIntake(inputPath).then((output) => {
    process.stdout.write(JSON.stringify(output) + "\n");
  });
}
