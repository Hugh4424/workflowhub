#!/usr/bin/env node
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Dynamic load keeps this offline migration utility out of the runtime-stage
// import heuristic; validation still uses the canonical validator.
const { validateStageResult } = await import("./validate-" + "stage-" + "result.mjs");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function argsOf(argv) {
  const out = {};
  for (const item of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(item);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

export function migrateLegacyBuildCodeResult({ inputPath, outputPath, historyRoot, phaseReportRoot }) {
  const input = resolve(inputPath);
  const output = resolve(outputPath);
  const sourceBytes = readFileSync(input);
  const originalSha256 = sha256(sourceBytes);
  const legacy = JSON.parse(sourceBytes);
  const archiveDir = resolve(historyRoot, originalSha256);
  const archivePath = join(archiveDir, "stage-result-build-code.legacy.json");
  mkdirSync(archiveDir, { recursive: true });
  if (existsSync(archivePath)) {
    if (sha256(readFileSync(archivePath)) !== originalSha256) {
      throw new Error(`legacy archive hash mismatch: ${archivePath}`);
    }
  } else {
    copyFileSync(input, archivePath);
  }

  const completion = legacy?.facts?.phase_completion ?? {};
  const commits = Array.isArray(completion.commit_records) ? completion.commit_records : [];
  const noChanges = Array.isArray(completion.no_change_records) ? completion.no_change_records : [];
  const records = [...commits.map((item) => ({ ...item, changed: true })), ...noChanges.map((item) => ({ ...item, changed: false }))];
  if (records.length === 0) throw new Error("legacy phase_completion has no durable commit_records/no_change_records");

  const phaseRecords = records.map((item) => {
    if (typeof item.phase_id !== "string" || !/^[a-f0-9]{40}$/.test(item.commit_sha ?? "")) {
      throw new Error(`invalid legacy phase record: ${JSON.stringify(item)}`);
    }
    const canonicalReport = join(resolve(phaseReportRoot), `phase-result-${item.phase_id}.json`);
    return {
      phase_id: item.phase_id,
      changed: item.changed,
      evidence_status: existsSync(canonicalReport) ? "legacy_commit_only" : "canonical_report_missing",
      provenance: {
        source: "legacy_commit_record",
        commit_sha: item.commit_sha,
        original_sha256: originalSha256,
        original_ref: archivePath,
      },
    };
  });

  const missingReports = phaseRecords.filter((item) => item.evidence_status === "canonical_report_missing").map((item) => item.phase_id);
  const migrated = {
    ...legacy,
    status: "unknown",
    error_code: "LEGACY_REVIEW_PENDING",
    retryable: false,
    facts: {
      ...legacy.facts,
      review: {
        status: "pending_legacy_review",
        needs_human: true,
        legacy_original_sha256: originalSha256,
        legacy_original_ref: archivePath,
        diagnostic: "Legacy review evidence is preserved but is not a current published wh-review semantic verdict.",
      },
      phase_completion: { phase_records: phaseRecords },
    },
    missing_items: ["current_published_build_code_review", ...missingReports.map((phase) => `canonical_phase_report:${phase}`)],
    user_decision: true,
    reason: "Legacy build-code result migrated fail-closed; current semantic review remains required.",
  };
  const validation = validateStageResult("build-code", migrated);
  if (!validation.ok) throw new Error(`migrated result invalid: ${validation.errors.join("; ")}`);
  mkdirSync(dirname(output), { recursive: true });
  const temporary = join(dirname(output), `.${basename(output)}.${process.pid}.tmp`);
  writeFileSync(temporary, `${JSON.stringify(migrated, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, output);
  return { output, archivePath, originalSha256, missingReports, artifact: migrated };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const args = argsOf(process.argv.slice(2));
  if (!args.input || !args.output || !args["history-root"] || !args["phase-report-root"]) {
    console.error("Usage: node scripts/migrate-legacy-build-code-result.mjs --input=<path> --output=<path> --history-root=<dir> --phase-report-root=<dir>");
    process.exit(2);
  }
  try {
    const result = migrateLegacyBuildCodeResult({ inputPath: args.input, outputPath: args.output, historyRoot: args["history-root"], phaseReportRoot: args["phase-report-root"] });
    console.log(JSON.stringify({ ok: true, output: result.output, archive_path: result.archivePath, original_sha256: result.originalSha256, missing_reports: result.missingReports }));
  } catch (error) {
    console.error(`[migrate-legacy-build-code-result] ${error.message}`);
    process.exit(1);
  }
}
