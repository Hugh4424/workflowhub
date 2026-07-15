import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");
const context = readFileSync(new URL("../scripts/browser-qa-context.sh", import.meta.url), "utf8");

describe("isolated-browser-qa portability", () => {
  it("resolves from workflowhub package root", () => {
    expect(skill).toContain("workflowhub_package_root");
    expect(skill).not.toMatch(/\/Users\//);
  });

  it("uses workflowhub-owned profile namespace", () => {
    expect(context).toContain(".config/workflowhub/browser-qa-profiles.conf");
    expect(context).toContain("workflowhub-qa-");
  });
});

describe("isolated-browser-qa executable context", () => {
  it("derives a localhost-only session without touching a browser", () => {
    const output = execFileSync("bash", [new URL("../scripts/browser-qa-context.sh", import.meta.url).pathname, "http://localhost:3000"], {
      encoding: "utf8",
      env: { ...process.env, BROWSER_QA_ENGINE: "agent-browser", BROWSER_QA_PROFILE_MAP: "/dev/null" },
    });
    expect(output).toContain("BROWSER_QA_SESSION=workflowhub-qa-");
    expect(output).toContain("BROWSER_QA_HOST=localhost");
    expect(output).toContain("BROWSER_QA_ALLOWED_DOMAINS=localhost\\,127.0.0.1");
  });

  it("fails loud for an unsupported engine", () => {
    expect(() => execFileSync("bash", [new URL("../scripts/browser-qa-context.sh", import.meta.url).pathname], {
      env: { ...process.env, BROWSER_QA_ENGINE: "unknown" }, stdio: "pipe",
    })).toThrow();
  });
});
