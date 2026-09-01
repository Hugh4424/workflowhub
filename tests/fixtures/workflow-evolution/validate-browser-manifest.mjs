#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";

const canonicalChecks = ["open", "evolution_tab", "content", "no_page_errors", "no_runtime_requests", "viewport_390x844", "viewport_1280x800"];
const canonicalAssertions = ["Evolution", "建议行动", "仅供参考", "前期质量税", "不是质量裁决或 stage gate", "evolution tab is reachable", "390x844 and 1280x800 snapshots", "no page errors", "no external runtime network requests"];
const sameArray = (left, right) => Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);

try {
  const value = JSON.parse(readFileSync(resolve(process.argv[2]), "utf8"));
  if (value.schema_version !== "browser-qa-evidence.v1"
      || !["passed", "qa_failed", "unavailable", "incomplete"].includes(value.status)
      || value.login_reused !== false
      || value.engine !== "agent-browser") process.exit(22);
  if (value.status === "passed") {
    const hashes = value.material_identity;
    const requiredHashes = ["page_sha256", "data_sha256", "move_map_sha256", "fixture_sha256"];
    const paths = Object.fromEntries(process.argv.slice(3).map((arg) => { const index = arg.indexOf("="); return [arg.slice(2, index), resolve(arg.slice(index + 1))]; }));
    const checkKeys = Object.keys(value.checks ?? {}).sort();
    const viewports = value.viewports;
    const manifestRoot = dirname(resolve(process.argv[2]));
    if (!hashes || requiredHashes.some((key) => !/^[a-f0-9]{64}$/.test(hashes[key] ?? ""))
        || !sameArray(checkKeys, [...canonicalChecks].sort()) || canonicalChecks.some((key) => value.checks[key] !== true)
        || !sameArray(value.assertions, canonicalAssertions)
        || typeof value.session !== "string" || value.session.trim() === "" || value.cleanup !== "complete"
        || !Array.isArray(viewports) || viewports.length !== 2
        || viewports[0]?.width !== 390 || viewports[0]?.height !== 844
        || viewports[1]?.width !== 1280 || viewports[1]?.height !== 800
        || viewports.some((viewport) => !/^[a-f0-9]{64}$/.test(viewport?.snapshot_sha256 ?? "") || !/^[A-Za-z0-9._-]+\.png$/.test(viewport?.evidence_ref ?? ""))
        || !Array.isArray(value.evidence) || value.evidence.length !== 2) process.exit(22);
    for (const viewport of viewports) {
      const bytes = readFileSync(join(manifestRoot, viewport.evidence_ref));
      if (createHash("sha256").update(bytes).digest("hex") !== viewport.snapshot_sha256
          || !value.evidence.some((entry) => entry?.ref === viewport.evidence_ref && entry.sha256 === viewport.snapshot_sha256)) process.exit(22);
    }
    for (const [name, key] of [["page", "page_sha256"], ["data", "data_sha256"], ["move-map", "move_map_sha256"], ["fixture", "fixture_sha256"]]) {
      if (!paths[name] || createHash("sha256").update(readFileSync(paths[name])).digest("hex") !== hashes[key]) process.exit(22);
    }
  }
  process.exit(value.status === "passed" ? 0 : value.status === "qa_failed" ? 20 : 21);
} catch {
  process.exit(22);
}
