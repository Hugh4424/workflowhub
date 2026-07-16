import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

import { resolveStorageRoot } from "../storage-root.mjs";

const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
const temporaryDirs = [];

function temporaryDirectory(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirs.push(directory);
  return directory;
}

function writeConfig(configHome, value) {
  const directory = join(configHome, "workflowhub");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "config.json"), value, "utf8");
}

afterEach(() => {
  if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
  else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});

describe("resolveStorageRoot", () => {
  it("uses an absolute WORKFLOWHUB_TASK_DIR as the global storage root", () => {
    const storageRoot = temporaryDirectory("workflowhub-storage-root-");
    process.env.WORKFLOWHUB_TASK_DIR = storageRoot;

    expect(resolveStorageRoot()).toBe(storageRoot);
  });

  it("gives a non-blank environment override precedence over the config file", () => {
    const home = temporaryDirectory("workflowhub-home-");
    const configHome = temporaryDirectory("workflowhub-config-");
    const configuredRoot = join(home, "configured");
    const overrideRoot = join(home, "override");
    writeConfig(configHome, JSON.stringify({ task_dir: configuredRoot }));

    expect(
      resolveStorageRoot({
        home,
        env: {
          XDG_CONFIG_HOME: configHome,
          WORKFLOWHUB_TASK_DIR: overrideRoot,
        },
      }),
    ).toBe(overrideRoot);
  });

  it.each([undefined, "", "   "])(
    "reads task_dir from XDG_CONFIG_HOME when the env override is absent or blank (%s)",
    (value) => {
      const home = temporaryDirectory("workflowhub-home-");
      const configHome = temporaryDirectory("workflowhub-config-");
      const configuredRoot = join(home, "Knowledge");
      writeConfig(configHome, JSON.stringify({ task_dir: configuredRoot }));
      const env = { XDG_CONFIG_HOME: configHome };
      if (value !== undefined) env.WORKFLOWHUB_TASK_DIR = value;

      expect(resolveStorageRoot({ env, home })).toBe(configuredRoot);
    },
  );

  it("uses ~/.config/workflowhub/config.json when XDG_CONFIG_HOME is unset", () => {
    const home = temporaryDirectory("workflowhub-home-");
    const configuredRoot = join(home, "Knowledge");
    writeConfig(join(home, ".config"), JSON.stringify({ task_dir: configuredRoot }));

    expect(resolveStorageRoot({ env: {}, home })).toBe(configuredRoot);
  });

  it("falls back to homedir when neither override nor config file exists", () => {
    const home = temporaryDirectory("workflowhub-home-");

    expect(resolveStorageRoot({ env: {}, home })).toBe(home);
  });

  it("keeps the real os.homedir fallback contract", () => {
    const configHome = temporaryDirectory("workflowhub-empty-config-");

    expect(resolveStorageRoot({ env: { XDG_CONFIG_HOME: configHome } })).toBe(
      homedir(),
    );
  });

  it.each([
    ["malformed JSON", "{"],
    ["missing task_dir", JSON.stringify({ storageRoot: "/tmp/wrong-field" })],
    ["non-string task_dir", JSON.stringify({ task_dir: 42 })],
    ["blank task_dir", JSON.stringify({ task_dir: "   " })],
    ["relative task_dir", JSON.stringify({ task_dir: "relative/storage" })],
  ])("fails loud for %s", (_label, contents) => {
    const home = temporaryDirectory("workflowhub-home-");
    const configHome = temporaryDirectory("workflowhub-config-");
    writeConfig(configHome, contents);

    expect(() =>
      resolveStorageRoot({ env: { XDG_CONFIG_HOME: configHome }, home }),
    ).toThrow();
  });

  it("rejects a relative storage root", () => {
    process.env.WORKFLOWHUB_TASK_DIR = "relative/storage";

    expect(() => resolveStorageRoot()).toThrow(/absolute/i);
  });

  it("rejects the legacy project tasks-root meaning before creating anything", () => {
    const storageRoot = temporaryDirectory("workflowhub-legacy-root-");
    const legacyRoot = join(storageRoot, "Projects", "PaperBuilder", "tasks");
    mkdirSync(legacyRoot, { recursive: true });
    process.env.WORKFLOWHUB_TASK_DIR = legacyRoot;

    expect(() => resolveStorageRoot()).toThrow(
      /legacy WORKFLOWHUB_TASK_DIR semantics/i,
    );
  });
});
