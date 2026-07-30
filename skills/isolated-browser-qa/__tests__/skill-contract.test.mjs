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

describe("isolated-browser-qa evidence contract", () => {
  it.each([
    ["route/page and scenario", /route[\s\S]{0,100}page[\s\S]{0,120}scenario/i],
    ["tool, engine, and derived session", /tool[\s\S]{0,100}engine[\s\S]{0,120}(?:derived )?session/i],
    ["auth mode and login-state reuse", /auth(?:entication)? mode[\s\S]{0,140}(?:login state|登录态)[\s\S]{0,80}reus/i],
    ["measured or explained performance", /performance[\s\S]{0,160}(?:measured|not_measured)[\s\S]{0,120}reason/i],
    ["screenshot references", /screenshots?[\s\S]{0,100}(?:ref|reference)/i],
    ["test command, file, output, and exit", /test command[\s\S]{0,100}test file[\s\S]{0,100}output[\s\S]{0,100}exit/i],
    ["completed cleanup", /cleanup[\s\S]{0,100}completed/i],
    ["no engine switch", /engine_switch[\s\S]{0,40}no/i],
  ])("requires %s in the reportable evidence", (_label, pattern) => {
    expect(skill, `ORACLE-BQA: missing ${_label} contract`).toMatch(pattern);
  });

  it("forbids credential and profile contents in evidence", () => {
    expect(skill).toMatch(/(?:cookie|token|profile content)[\s\S]{0,180}(?:must not|never|禁止|不得)/i);
  });
});
