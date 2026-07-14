import { spawnSync } from "node:child_process";

function isRequired(requiredWhen, activeConditions) {
  return requiredWhen === "always" || activeConditions.has(requiredWhen);
}

function major(version) { return Number(String(version).match(/v?(\d+)/)?.[1]); }

function versionSatisfied(output, policy) {
  if (!policy) return true;
  const match = policy.match(/^>=(\d+)$/);
  return !match || major(output) >= Number(match[1]);
}

export function doctorCapabilities({ manifest, activeConditions = [], probes = {}, run = spawnSync } = {}) {
  const conditions = new Set(activeConditions);
  const capabilities = [...(manifest?.runtime_capabilities || []), ...(manifest?.external_capabilities || [])];
  return capabilities.map(capability => {
    if (!isRequired(capability.required_when, conditions)) return { id: capability.id, status: "not_required" };
    let available = false;
    let detail = "";
    if (capability.kind === "cli" || capability.kind === "command") {
      const [command, ...args] = capability.doctor;
      const result = run(command, args, { encoding: "utf8", shell: false });
      detail = `${result.stdout || ""}${result.stderr || ""}`.trim();
      available = !result.error && result.status === 0 && versionSatisfied(detail, capability.version_policy);
    } else {
      const probe = probes[capability.id];
      const result = typeof probe === "function" ? probe(capability) : probe;
      available = result === true || result?.available === true;
      detail = result?.detail || "";
    }
    return available
      ? { id: capability.id, status: "available", detail }
      : { id: capability.id, status: capability.absence_semantics, detail: detail || `${capability.kind} capability unavailable` };
  });
}

export function assertRequiredCapabilities(options) {
  const results = doctorCapabilities(options);
  const failures = results.filter(result => ["blocked", "human_required"].includes(result.status));
  if (failures.length) throw new Error(`capability doctor failed: ${failures.map(item => `${item.id}:${item.status}`).join(", ")}`);
  return results;
}
