import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scripts = join(import.meta.dirname, "..");
const cli = readFileSync(join(scripts, "wh-review-cli.mjs"), "utf8");

describe("simple wh-review reliability", () => {
  it("has a new runner that does not depend on the V4 facade", () => {
    expect(existsSync(join(scripts, "review-runner.mjs"))).toBe(true);
    expect(cli).not.toContain("ReviewRoundFacade");
  });

  it("removes reset and recover from the production CLI", () => {
    expect(cli).not.toMatch(/\breset\b/);
    expect(cli).not.toMatch(/\brecover\b/);
  });

  it("does not use permanent source context or projection recovery", () => {
    const production = [
      "wh-review-cli.mjs",
      "review-runner.mjs",
      "review-source.mjs",
      "review-materials.mjs",
      "review-provider-client.mjs",
      "review-result.mjs"
    ].map((name) => readFileSync(join(scripts, name), "utf8")).join("\n");
    expect(production).not.toContain("source-context");
    expect(production).not.toContain("projection-pending");
  });

  it("does not read broker private state after provider completion", () => {
    const brokerClient = readFileSync(join(scripts, "review-provider-client.mjs"), "utf8");
    expect(brokerClient).not.toMatch(/state\.json|privateState|runtimeDir/);
  });

  it("keeps runtime artifacts out of the source tree", () => {
    expect(existsSync(join(scripts, "review-source.mjs"))).toBe(true);
    expect(existsSync(join(scripts, "review-materials.mjs"))).toBe(true);
  });
});
