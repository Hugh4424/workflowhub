import { spawnSync } from "node:child_process";
import { createSkillDiagnostic } from "../adapters/local-skill-resolver.mjs";

function isRequired(requiredWhen, activeConditions) {
  return requiredWhen === "always" || activeConditions.has(requiredWhen);
}

function major(version) { return Number(String(version).match(/v?(\d+)/)?.[1]); }

function versionSatisfied(output, policy) {
  if (!policy) return true;
  const match = policy.match(/^>=(\d+)$/);
  return !match || major(output) >= Number(match[1]);
}

export function doctorCapabilities({ manifest, activeConditions = [], probes = {}, commands = {}, run = spawnSync } = {}) {
  const conditions = new Set(activeConditions);
  const capabilities = [...(manifest?.runtime_capabilities || []), ...(manifest?.external_capabilities || [])];
  return capabilities.map(capability => {
    if (!isRequired(capability.required_when, conditions)) {
      return {
        id: capability.id,
        ...createSkillDiagnostic({
          source: "doctor",
          skill: capability.id,
          status: "not_required",
          code: "CAPABILITY_NOT_REQUIRED",
        }),
      };
    }
    let available = false;
    let detail = "";
    if (capability.kind === "cli" || capability.kind === "command") {
      const candidates = capability.kind === "command" && commands[capability.id]
        ? [commands[capability.id]] : (capability.doctor_any || [capability.doctor]);
      const attempts = candidates.map(argv => {
        const [command, ...args] = argv;
        const result = run(command, args, { encoding: "utf8", shell: false });
        return { result, output: `${result.stdout || ""}${result.stderr || ""}`.trim() };
      });
      const passed = attempts.find(({ result, output }) => !result.error && result.status === 0 && versionSatisfied(output, capability.version_policy));
      detail = passed?.output || attempts.map(item => item.output).filter(Boolean).join(" | ");
      available = Boolean(passed);
    } else {
      const probe = probes[capability.id];
      const result = typeof probe === "function" ? probe(capability) : probe;
      available = result === true || result?.available === true;
      detail = result?.detail || "";
    }
    const status = available ? "available" : capability.absence_semantics;
    const message = available ? null : (detail || `${capability.kind} capability unavailable`);
    return {
      id: capability.id,
      ...createSkillDiagnostic({
        source: "doctor",
        skill: capability.id,
        status,
        code: available ? "CAPABILITY_AVAILABLE" : "CAPABILITY_UNAVAILABLE",
        message,
      }),
      detail: available ? detail : message,
    };
  });
}

export function assertRequiredCapabilities(options) {
  return doctorCapabilities(options);
}
