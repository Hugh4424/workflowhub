import { describe, expect, test, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RUNTIME_BEHAVIORS,
  createRuntimeFacade,
} from "../../runtime/interface/runtime-facade.mjs";
import { LOCAL_RUNNER_CONTRACT, LOCAL_SKILL_BUNDLE_CONTRACT } from "../../runtime/interface/runner-contract.mjs";
import { stageRuntimeCliMain, stageRuntimeMain } from "../../scripts/stage-runtime.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("runtime facade", () => {
  test("exposes exactly the seven stable behaviors", () => {
    expect([...RUNTIME_BEHAVIORS]).toEqual([
      "doctor", "status", "run", "review", "verify", "confirm", "authorize",
    ]);
  });

  test("delegates behavior without owning stage implementation", async () => {
    const run = vi.fn(async (request) => ({ request, delegated: true }));
    const facade = createRuntimeFacade({
      delegates: { run },
      skillBundleContract: LOCAL_SKILL_BUNDLE_CONTRACT,
      runnerContract: LOCAL_RUNNER_CONTRACT,
    });

    await expect(facade.run({ stage: "build-code" })).resolves.toEqual({
      request: { stage: "build-code" },
      delegated: true,
    });
    expect(run).toHaveBeenCalledOnce();
    expect(() => facade.writeEvidence).toThrow();
  });

  test("rejects old or unknown public commands before delegation", async () => {
    const delegate = vi.fn();
    await expect(stageRuntimeCliMain(["receipt", "--action=record"], { delegate }))
      .rejects.toThrow(/unknown public runtime behavior/);
    await expect(stageRuntimeCliMain(["run", "--action=surprise"], { delegate }))
      .rejects.toThrow(/unknown public runtime action/);
    await expect(stageRuntimeCliMain(["review", "--action=unavailable"], { delegate }))
      .rejects.toThrow(/unknown public runtime action/);
    await expect(stageRuntimeCliMain(["invalidate-run", "--stage=build-code"], { delegate }))
      .rejects.toThrow(/unknown public runtime behavior/);
    expect(delegate).not.toHaveBeenCalled();
  });

  test("workflow prose cannot document a private runtime route", async () => {
    const forbidden = /--operation=|capture-tests|publish-(?:phase|acceptance|verify|content)/;
    const documentedRoutes = new Set();
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      const prompt = fs.readFileSync(path.join(ROOT, "workflows", stage, "SKILL.md"), "utf8");
      const commands = [...prompt.matchAll(/stage-runtime\.mjs\s+([a-z-]+)/g)].map((match) => match[1]);
      expect(commands.every((command) => RUNTIME_BEHAVIORS.includes(command))).toBe(true);
      for (const match of prompt.matchAll(/stage-runtime\.mjs\s+([a-z-]+)\s+--action=([a-z-]+)/g)) {
        documentedRoutes.add(`${match[1]}:${match[2]}`);
      }
      const publicCalls = prompt.split("\n").filter((line) => line.includes("stage-runtime.mjs")).join("\n");
      expect(publicCalls).not.toMatch(forbidden);
    }
    for (const route of documentedRoutes) {
      const [behavior, action] = route.split(":");
      const delegate = vi.fn(async ([operation]) => operation);
      await expect(stageRuntimeCliMain([behavior, `--action=${action}`], { delegate })).resolves.toEqual(expect.any(String));
      expect(delegate).toHaveBeenCalledOnce();
    }
    expect(JSON.stringify(await stageRuntimeCliMain(["--help"]))).not.toMatch(forbidden);
  });

  test("runner contract is checked before every delegated operation", async () => {
    const delegate = vi.fn();
    await expect(stageRuntimeCliMain(["run", "--action=record"], {
      delegate,
      skillBundleContract: { runner_contract_major: 1, runner_contract_min_minor: 2 },
      runnerContract: { runner_contract_major: 1, runner_contract_minor: 1 },
    })).rejects.toThrow(/runner contract minor mismatch/);
    await expect(stageRuntimeCliMain(["run", "--action=record"], {
      delegate,
      skillBundleContract: null,
      runnerContract: LOCAL_RUNNER_CONTRACT,
    })).rejects.toThrow(/runner contract/);
    expect(delegate).not.toHaveBeenCalled();
  });

  test("routes material revision through the stable run behavior", async () => {
    const delegate = vi.fn(async (argv) => argv);
    await expect(stageRuntimeCliMain([
      "run", "--action=material-revision", "--stage=build-code", "--project=Demo", "--task=task", "--input=revision.json",
    ], { delegate })).resolves.toEqual([
      "publish-material-revision", "--stage=build-code", "--project=Demo", "--task=task", "--input=revision.json",
    ]);
    expect(delegate).toHaveBeenCalledOnce();
    expect(JSON.stringify(await stageRuntimeCliMain(["--help"]))).toMatch(/material-revision/);
  });

  test("keeps material revision input validation in the private stage runtime", async () => {
    await expect(stageRuntimeCliMain([
      "run", "--action=material-revision", "--stage=build-code", "--project=Demo", "--task=task",
    ], { delegate: (argv) => stageRuntimeMain(argv) })).rejects.toThrow(/publish-material-revision requires --input/i);
  });
});
