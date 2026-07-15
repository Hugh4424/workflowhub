import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const readStage = (stage) => readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8");

describe("v2 human boundary summaries", () => {
  it("all stages present their result or boundary to the human", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(readStage(stage)).toMatch(/present|human|user|用户|人工/i);
    }
  });

  it("irreversible close remains explicitly confirmed", () => {
    expect(readStage("verify-code")).toMatch(/Present[\s\S]*user[\s\S]*confirmed close/i);
  });
});
