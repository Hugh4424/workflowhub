import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rootWriters = [
  "core/__tests__/check-extensibility.test.mjs",
  "core/__tests__/check-anti-host.test.mjs",
];

describe("Vitest resource policy", () => {
  it("runs only root-writing tests in the exclusive batch", () => {
    const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;
    const config = readFileSync(join(root, "vitest.config.mjs"), "utf8");
    const checks = readFileSync(join(root, "tools/cli/run-checks.mjs"), "utf8");

    expect(scripts.test).toBe("npm run test:safe && npm run test:exclusive");
    for (const file of rootWriters) {
      expect(scripts["test:safe"]).toContain(`--exclude=${file}`);
      expect(scripts["test:exclusive"]).toContain(file);
    }
    expect(scripts["test:exclusive"]).toContain("--poolOptions.forks.singleFork");
    expect(scripts["test:exclusive"]).toContain("--no-fileParallelism");
    expect(config).toContain("minForks: 1");
    expect(config).toContain("maxForks: 2");
    expect(config).toContain("fileParallelism: true");
    expect(config).not.toContain("singleFork: true");
    expect(checks).not.toContain("retryTransientCheckerFailure");
  });
});
