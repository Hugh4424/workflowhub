#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  const value = JSON.parse(readFileSync(resolve(process.argv[2]), "utf8"));
  if (value.schema_version !== "browser-qa-evidence.v1"
      || !["passed", "qa_failed", "unavailable", "incomplete"].includes(value.status)
      || value.login_reused !== false
      || typeof value.engine !== "string") process.exit(22);
  if (value.status === "passed") {
    const hashes = value.material_identity;
    const requiredHashes = ["page_sha256", "data_sha256", "move_map_sha256", "fixture_sha256"];
    if (!hashes || requiredHashes.some((key) => !/^[a-f0-9]{64}$/.test(hashes[key] ?? ""))
        || !value.checks || Object.values(value.checks).length < 5 || Object.values(value.checks).some((entry) => entry !== true)) process.exit(22);
  }
  process.exit(value.status === "passed" ? 0 : value.status === "qa_failed" ? 20 : 21);
} catch {
  process.exit(22);
}
