import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const runtime = fileURLToPath(new URL("../stage-runtime.mjs", import.meta.url));

describe("public vNext runtime cutover", () => {
  it("exposes only the compact public behavior surface", () => {
    const help = spawnSync(process.execPath, [runtime, "help"], { encoding: "utf8" });
    expect(help.status, help.stderr).toBe(0);
    expect(JSON.parse(help.stdout).behaviors).toEqual(expect.arrayContaining([
      "doctor", "status", "run", "review", "verify", "confirm", "authorize",
    ]));
  });

  it.each(["prepare", "recover-run", "verify-recovery", "invoke-stage-skill"])(
    "proves deleted internal command %s is unreachable",
    (command) => {
      const result = spawnSync(process.execPath, [
        runtime, command, "--stage=make-decision", "--project=Demo", "--task=missing",
      ], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/unknown public runtime behavior|usage/i);
    },
  );

  it.each([
    ["doctor", "workspace"],
    ["status", "begin"],
    ["run", "execute"],
    ["review", "invoke"],
    ["verify", "tests"],
    ["confirm", "decision"],
    ["authorize", "decision"],
  ])("routes %s:%s before task lookup", (behavior, action) => {
    const result = spawnSync(process.execPath, [
      runtime, behavior, `--action=${action}`, "--stage=make-decision",
      "--project=Demo", "--task=missing",
    ], { encoding: "utf8" });
    expect(`${result.stdout}${result.stderr}`).not.toMatch(/unknown public runtime behavior|unknown public runtime action/i);
  });
});
