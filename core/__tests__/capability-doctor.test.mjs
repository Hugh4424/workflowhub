import { describe, expect, it } from "vitest";
import { assertRequiredCapabilities, doctorCapabilities } from "../capability-doctor.mjs";

const manifest = {
  runtime_capabilities: [
    { id: "node", kind: "cli", required_when: "always", doctor: ["node", "--version"], version_policy: ">=24", absence_semantics: "blocked" },
  ],
  external_capabilities: [
    { id: "host-subagent", kind: "host", required_when: "review", doctor: ["host-capability", "host-subagent"], absence_semantics: "human_required" },
    { id: "optional-search", kind: "mcp", required_when: "research", doctor: ["host-capability", "optional-search"], absence_semantics: "diagnostic" },
  ],
};

describe("capability doctor", () => {
  it("uses argv without a shell and enforces version policy", () => {
    const calls = [];
    const results = doctorCapabilities({ manifest, run: (command, args, options) => { calls.push({ command, args, options }); return { status: 0, stdout: "v24.1.0" }; } });
    expect(results[0].status).toBe("available");
    expect(calls[0]).toEqual(expect.objectContaining({ command: "node", args: ["--version"], options: expect.objectContaining({ shell: false }) }));
  });

  it("distinguishes not-required, diagnostic and human-required capabilities", () => {
    const results = doctorCapabilities({ manifest, activeConditions: ["review", "research"], run: () => ({ status: 0, stdout: "v24" }), probes: { "optional-search": false, "host-subagent": false } });
    expect(results.map(item => [item.id, item.status])).toEqual([["node", "available"], ["host-subagent", "human_required"], ["optional-search", "diagnostic"]]);
    expect(() => assertRequiredCapabilities({ manifest, activeConditions: ["review"], run: () => ({ status: 0, stdout: "v24" }), probes: { "host-subagent": false } })).toThrow(/host-subagent:human_required/);
  });

  it("uses the real target command argv and accepts browser alternatives", () => {
    const custom = { runtime_capabilities: [
      { id: "target-test-command", kind: "command", required_when: "always", doctor: ["placeholder"], absence_semantics: "blocked" },
      { id: "browser-cli", kind: "cli", required_when: "ui", doctor_any: [["agent-browser", "--version"], ["browser-use", "doctor"]], absence_semantics: "blocked" },
    ] };
    const calls = [];
    const results = doctorCapabilities({ manifest: custom, activeConditions: ["ui"], commands: { "target-test-command": ["npm", "test", "--", "--runInBand"] }, run: (command, args) => {
      calls.push([command, ...args]);
      return { status: command === "agent-browser" ? 1 : 0, stdout: "ok" };
    } });
    expect(calls[0]).toEqual(["npm", "test", "--", "--runInBand"]);
    expect(calls).toContainEqual(["browser-use", "doctor"]);
    expect(results.every(item => item.status === "available")).toBe(true);
  });
});
