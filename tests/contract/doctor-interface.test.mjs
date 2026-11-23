import { describe, expect, it } from "vitest";

import { RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

describe("doctor/status public interface", () => {
  it("advertises only the seven stable public behaviors", async () => {
    const help = await stageRuntimeCliMain(["--help"]);
    expect(help.behaviors).toEqual([...RUNTIME_BEHAVIORS]);
    expect(help.behaviors).toEqual(["doctor", "status", "run", "review", "verify", "confirm", "authorize"]);
  });

  it("keeps doctor workspace capability checks separate from status", async () => {
    const help = await stageRuntimeCliMain(["--help"]);
    expect(help.actions.doctor).toEqual(["workspace"]);
    expect(help.actions.status).toEqual(["begin"]);
    expect(help.actions.doctor).not.toContain("begin");
  });

  it("retires the old status repair route", async () => {
    await expect(stageRuntimeCliMain(["status", "--action=repair"])).rejects.toThrow(/unknown public runtime action/);
  });
});
