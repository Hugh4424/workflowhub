import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const runtime = fileURLToPath(new URL("../stage-runtime.mjs", import.meta.url));

function invoke(...args) {
  return spawnSync(process.execPath, [runtime, ...args], { encoding: "utf8" });
}

describe("deleted build-spec recovery surface", () => {
  it("does not advertise recovery as a public behavior or action", () => {
    const result = invoke("help");
    expect(result.status, result.stderr).toBe(0);
    const help = JSON.parse(result.stdout);
    expect(help.behaviors).not.toContain("recover");
    expect(Object.values(help.actions).flat()).not.toContain("recover-spec-receipt");
  });

  it.each([
    "recover-spec-receipt",
    "recover-run",
    "verify-recovery",
  ])("fails loudly when the deleted internal command %s is invoked", (command) => {
    const result = invoke(
      command,
      "--stage=build-spec",
      "--project=Demo",
      "--task=missing",
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/unknown public runtime behavior/i);
  });

  it("does not provide a recovery action alias", () => {
    const result = invoke(
      "status",
      "--action=recover",
      "--stage=build-spec",
      "--project=Demo",
      "--task=missing",
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/unknown public runtime action/i);
  });
});
