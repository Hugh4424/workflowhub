import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const runtime = fileURLToPath(new URL("../stage-runtime.mjs", import.meta.url));

function invoke(args) {
  return spawnSync(process.execPath, [runtime, ...args], {
    encoding: "utf8",
    env: process.env,
  });
}

describe("removed recover-run public behavior", () => {
  it("fails loud instead of recreating the deleted make-decision recovery state machine", () => {
    const result = invoke([
      "recover-run",
      "--stage=make-decision",
      "--project=Demo",
      "--task=recover-task",
      "--reason=obsolete",
    ]);
    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/unknown public runtime behavior/i);
  });

  it.each(["build-spec", "verify-code"])("does not expose recover-run for %s", (stage) => {
    const result = invoke([
      "recover-run",
      `--stage=${stage}`,
      "--project=Demo",
      "--task=recover-task",
      "--reason=obsolete",
    ]);
    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/unknown public runtime behavior/i);
  });

  it("keeps recovery out of the public help surface", () => {
    const result = invoke(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/\brecover-run\b/);
  });
});
