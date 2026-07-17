import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureSideEffects, loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";

const roots = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "workflowhub-cli-red-"));
  roots.push(root);
  const storageRoot = path.join(root, "storage");
  const authorityRoot = path.join(root, "authority");
  await mkdir(storageRoot);
  await mkdir(authorityRoot);
  await writeFile(path.join(storageRoot, "sentinel"), "unchanged\n");
  return { storageRoot, authorityRoot, workspaceRoot: process.cwd() };
}

const commands = ["doctor", "task", "stage", "commit", "close", "release", "routing", "admin-repin", "status"];
const cliInput = (inputSource) => JSON.stringify({ schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json", schema_version: "1.0.0", command: "stage", input_source: inputSource, payload: {} });
const forbidden = [
  ["--cwd", "/tmp/caller"],
  ["--worktree", "/tmp/caller"],
  ["--storage-root", "/tmp/caller"],
  ["--task-path", "/tmp/caller"],
  ["--input=/tmp/payload.json"],
  ["--capability-id", "reusable-secret"],
];

describe("public CLI rejects caller authority before side effects", () => {
  it.each(commands.flatMap((command) => forbidden.map((args) => [command, args])))
  ("rejects %s %s before payload/bootstrap/doctor/executor", async (command, args) => {
    const roots = await fixture();
    const before = await captureSideEffects(roots);
    const spies = { payload: vi.fn(), bootstrap: vi.fn(), doctor: vi.fn(), executor: vi.fn() };
    const executePublicCli = await loadPhaseCapability("../core/public-cli.mjs", "executePublicCli");
    await expect(executePublicCli({ argv: [command, ...args], ...spies })).rejects.toMatchObject({ code: "USAGE_FORBIDDEN_AUTHORITY" });
    for (const spy of Object.values(spies)) expect(spy).not.toHaveBeenCalled();
    expect(await captureSideEffects(roots)).toEqual(before);
  });

  it.each([
    ["stdin", ["stage", "run", "--project", "Demo", "--task", "one", "--stage", "build-code", "--input", "@-"], { stdin: cliInput("@-") }],
    ["launcher staging ref", ["stage", "run", "--project", "Demo", "--task", "one", "--stage", "build-code", "--input-ref", "staging:payloads/fixture.json"], { authorizedStagingRefs: ["staging:payloads/fixture.json"], stagedPayload: cliInput("staging:payloads/fixture.json") }],
  ])("allows %s payload authority to reach the next layer", async (_label, argv, extra) => {
    const executePublicCli = await loadPhaseCapability("../core/public-cli.mjs", "executePublicCli");
    const payload = vi.fn(() => ({ schema_version: "fixture.v1" }));
    await executePublicCli({ argv, payload, dryRun: true, ...extra });
    expect(payload).toHaveBeenCalledOnce();
  });
});
