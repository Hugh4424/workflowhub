#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanonicalSource, createSourceManifest, canonicalJson } from "../core/canonical-source.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";

function fail(code, message) { process.stderr.write(`${code}: ${message}\n`); process.exitCode = 2; }
function args(argv) {
  const result = {};
  for (const item of argv.slice(2)) {
    const split = item.indexOf("=");
    if (!item.startsWith("--") || split < 3) throw new TypeError(`invalid argument: ${item}`);
    result[item.slice(2, split)] = item.slice(split + 1);
  }
  return result;
}

export function persistSourceManifest(taskHandle, input, ref) {
  const canonical = createCanonicalSource(input.canonical_source ?? input.source ?? input);
  const result = createSourceManifest({ canonical_source: canonical, atoms: input.atoms });
  if (!result.ok) throw new Error(result.errors?.join("; ") ?? "invalid source manifest input");
  const targetRef = ref ?? `source-manifests/source-manifest.${result.manifest_hash}.json`;
  taskHandle.createRecordAtomic(targetRef, `${canonicalJson(result.manifest)}\n`);
  return { ref: targetRef, manifest: result.manifest };
}

export function sourceManifestMain() { try {
  const options = args(process.argv);
  for (const key of ["task-path", "project", "task", "stage"]) if (!options[key]) throw new TypeError("task capability arguments required");
  const context = bootstrapStage(options.stage, { mode: "sidecar", taskPath: options["task-path"], projectName: options.project, taskId: options.task });
  const result = persistSourceManifest(context.task, JSON.parse(readFileSync(0, "utf8")), options.ref);
  process.stdout.write(`${JSON.stringify({ ref: result.ref })}\n`);
} catch (error) { fail("SOURCE_MANIFEST_ERROR", error.message); } }

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) sourceManifestMain();
