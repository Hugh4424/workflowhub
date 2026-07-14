#!/usr/bin/env node
import fs from "node:fs";

export function routeTests(input, now = () => new Date()) {
  const files = input?.changed_files;
  if (!Array.isArray(files) || files.length === 0 || !files.every(value => typeof value === "string" && value.length > 0)) {
    return { routing_tier: "fullstack", routing_rationale: "changed_files 缺失或无效，无法证明更窄边界", result: "fail", ts: now().toISOString() };
  }
  const joined = files.join(" ").toLowerCase();
  const fullstack = /(^|[\/_.-])(api|db|database|migration|auth|deploy|infra|schema|protocol)([\/_.-]|$)/.test(joined)
    || new Set(files.map(file => file.split("/")[0])).size > 1;
  const simple = files.every(file => /(^|\/)(docs?|readme|changelog)(\/|\.|$)|\.(md|txt|ya?ml|json)$/.test(file.toLowerCase()));
  const routing_tier = fullstack ? "fullstack" : simple ? "simple" : "feature";
  return {
    routing_tier,
    routing_rationale: `${files.join(", ")} => ${routing_tier} 边界`,
    result: "pass",
    ts: now().toISOString(),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(fs.readFileSync(process.argv[2] || 0, "utf8"));
  process.stdout.write(`${JSON.stringify(routeTests(input))}\n`);
}
