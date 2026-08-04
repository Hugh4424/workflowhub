import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const runtime = fileURLToPath(new URL("../tools/cli/stage-runtime.mjs", import.meta.url));

function invoke(...args) {
  return spawnSync(process.execPath, [runtime, ...args], { encoding: "utf8" });
}

describe("make-decision public CLI cutover", () => {
  it("exposes high-level behaviors instead of caller-owned journal operations", () => {
    const result = invoke("help");
    expect(result.status, result.stderr).toBe(0);
    const help = JSON.parse(result.stdout);
    expect(help.behaviors).toEqual(expect.arrayContaining([
      "doctor", "status", "run", "review", "confirm", "authorize",
    ]));
    expect(help.behaviors).not.toEqual(expect.arrayContaining([
      "prepare", "record-step-entry", "record-step-exit",
    ]));
  });

  it.each([
    "prepare",
    "record-step-entry",
    "record-step-exit",
    "invoke-stage-skill",
    "publish-content-evidence",
  ])("fails loudly when deleted internal operation %s is invoked", (operation) => {
    const result = invoke(
      operation,
      "--stage=make-decision",
      "--project=Demo",
      "--task=missing",
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/unknown public runtime behavior/i);
  });

  it.each([
    ["doctor", "workspace"],
    ["status", "begin"],
    ["run", "execute"],
    ["review", "invoke"],
    ["confirm", "decision"],
    ["authorize", "commit"],
  ])("recognizes public route %s:%s before task lookup", (behavior, action) => {
    const result = invoke(
      behavior,
      `--action=${action}`,
      "--stage=make-decision",
      "--project=Demo",
      "--task=missing",
    );
    expect(`${result.stdout}${result.stderr}`)
      .not.toMatch(/unknown public runtime behavior|unknown public runtime action/i);
  });
});
