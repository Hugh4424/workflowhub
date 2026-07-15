#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createCanonicalSource, createSourceManifest, canonicalJson } from "../core/canonical-source.mjs";

function fail(code, message) { process.stderr.write(`${code}: ${message}\n`); process.exitCode = 2; }
function args(argv) {
  const result = {};
  for (let index = 2; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith("--") || !argv[index + 1]) throw new TypeError("USAGE: --input <json> --output-dir <dir>");
    result[argv[index].slice(2)] = argv[index + 1];
  }
  return result;
}
try {
  const options = args(process.argv);
  if (!options.input || !options["output-dir"]) throw new TypeError("USAGE: --input <json> --output-dir <dir>");
  const input = JSON.parse(readFileSync(resolve(options.input), "utf8"));
  const canonical = createCanonicalSource(input.canonical_source ?? input.source ?? input);
  const result = createSourceManifest({ canonical_source: canonical, atoms: input.atoms });
  if (!result.ok) { fail(result.code ?? "SOURCE_INCOMPLETE", result.errors?.join("; ") ?? "invalid source manifest input"); }
  else {
    const outputDir = resolve(options["output-dir"]); const output = join(outputDir, `source-manifest.${result.manifest_hash}.json`);
    mkdirSync(outputDir, { recursive: true });
    const bytes = `${canonicalJson(result.manifest)}\n`;
    if (existsSync(output) && readFileSync(output, "utf8") !== bytes) fail("IMMUTABLE_MANIFEST_CONFLICT", basename(output));
    else { if (!existsSync(output)) writeFileSync(output, bytes, { encoding: "utf8", flag: "wx" }); process.stdout.write(`${output}\n`); }
  }
} catch (error) { fail("SOURCE_MANIFEST_ERROR", error.message); }
