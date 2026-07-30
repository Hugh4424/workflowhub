import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  validatePlanTaskContract,
  validateSpecContentProfile,
} from "../core/stage-content-contracts.mjs";

const fixture = JSON.parse(readFileSync(
  new URL("./fixtures/template-content-quality/retention-map.json", import.meta.url),
  "utf8",
));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const repoRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const agentHubTemplateRoot = resolve(repoRoot, "../multica-agenthub/.specify/templates");

function headings(document) {
  return document.split(/\r?\n/).filter((line) => /^#{1,6}\s+\S/.test(line));
}

function sectionBody(document, heading) {
  const lines = document.split(/\r?\n/);
  const index = lines.indexOf(heading);
  const level = heading.match(/^#+/)[0].length;
  const next = lines.findIndex((line, lineIndex) =>
    lineIndex > index && new RegExp(`^#{1,${level}}\\s+`).test(line));
  return lines.slice(index + 1, next === -1 ? lines.length : next).join("\n").trim();
}

function inlineJson(document, label) {
  const match = document.match(new RegExp(
    `^\\s*-\\s+\\*\\*${label}\\*\\*\\s*[:：]\\s*` + "`(\\{.*\\}|\\[.*\\])`\\s*$",
    "mi",
  ));
  return match ? JSON.parse(match[1]) : null;
}

describe("AgentHub body with WorkflowHub overlays", () => {
  it("retains the AgentHub H2 backbone in declared order", () => {
    for (const entry of fixture.agenthub_backbone) {
      const document = read(entry.target_path);
      const liveSource = join(agentHubTemplateRoot, entry.source_path.split("/").at(-1));
      const sourceHeadings = existsSync(liveSource)
        ? headings(readFileSync(liveSource, "utf8")).filter((heading) => /^##\s+/.test(heading))
        : entry.source_headings;
      expect(sourceHeadings, `${entry.artifact} source inventory drift`).toEqual(entry.source_headings);
      expect(entry.mappings.map(({ source_heading }) => source_heading).sort())
        .toEqual([...entry.source_headings].sort());
      const declared = entry.target_heading_order;
      const positions = declared.map((heading) => document.split(/\r?\n/).indexOf(heading));
      expect(positions.every((position) => position >= 0), `${entry.artifact} lost an AgentHub H2`).toBe(true);
      expect(positions).toEqual([...positions].sort((left, right) => left - right));
      for (const mapping of entry.mappings) {
        expect(mapping.source_heading).toMatch(/^## /);
        expect(mapping.target_heading).toMatch(/^## /);
        expect(mapping.reason.length).toBeGreaterThan(8);
        expect(["retain", "refine", "move", "merge", "split"]).toContain(mapping.action);
        expect(sectionBody(document, mapping.target_heading), mapping.target_heading).not.toBe("");
      }
    }
  });

  it("retains every WorkflowHub execution contract", () => {
    for (const entry of fixture.workflowhub_overlays) {
      const document = read(entry.path);
      for (const marker of entry.markers) {
        expect(document, `${entry.artifact} lost ${marker}`).toContain(marker);
      }
    }
  });

  it("keeps spec, plan, and tasks responsibilities separate", () => {
    for (const entry of fixture.responsibilities) {
      const document = read(entry.path);
      for (const marker of entry.forbidden) {
        expect(document, `${entry.path} duplicates ${marker}`).not.toContain(marker);
      }
    }
  });
});

describe("published template quality", () => {
  for (const path of fixture.scope) {
    it(`${path} is readable Markdown`, () => {
      const document = read(path);
      const allHeadings = headings(document);
      expect(allHeadings.filter((line) => /^#\s+/.test(line))).toHaveLength(1);
      expect(new Set(allHeadings.filter((line) => /^##\s+/.test(line))).size)
        .toBe(allHeadings.filter((line) => /^##\s+/.test(line)).length);
      expect((document.match(/^```/gm) ?? []).length % 2).toBe(0);
      expect(document).not.toMatch(/<!--|-->|Lorem ipsum|\/Users\/Hugh/);
      for (const heading of allHeadings.filter((line) => /^##\s+/.test(line))) {
        expect(sectionBody(document, heading), `${path}: empty ${heading}`).not.toBe("");
      }
    });
  }

  it("uses parseable authoring bindings without fake valid hashes", () => {
    const plan = read("skills/spec-plan/templates/plan-template.md");
    const tasks = read("skills/spec-tasks/templates/tasks-template.md");
    const constitution = inlineJson(plan, "Constitution binding");
    const refs = inlineJson(tasks, "versioned_refs");

    expect(constitution).toMatchObject({ artifact_kind: "constitution", clause_count: 21 });
    expect(refs.map(({ artifact_kind }) => artifact_kind)).toEqual(["spec", "plan"]);
    expect(constitution.hash).toBe("[填写：真实 SHA-256]");
    expect(refs.every(({ hash }) => hash === "[填写：真实 SHA-256]")).toBe(true);
    expect(`${plan}\n${tasks}`).not.toMatch(/"hash":"([a-f0-9])\1{63}"/);
  });

  it("production validators reject every raw authoring template", () => {
    const spec = read("skills/spec-specify/templates/spec-template.md");
    const plan = read("skills/spec-plan/templates/plan-template.md");
    const tasks = read("skills/spec-tasks/templates/tasks-template.md");
    expect(validateSpecContentProfile(spec).errors).toContain("spec contains an unresolved placeholder");
    expect(validatePlanTaskContract({ spec, plan, tasks }).errors)
      .toContain("generated plan/tasks must not retain placeholders, template comments, or filler");
  });

  it("uses one flat task card and only the required completion-authority H5", () => {
    const tasks = read("skills/spec-tasks/templates/tasks-template.md");
    expect(tasks.match(/^#### T001 /gm)).toHaveLength(1);
    const authorityHeadings = tasks.split(/\r?\n/).filter((line) => /^##### /.test(line));
    expect(authorityHeadings).toHaveLength(2);
    expect(new Set(authorityHeadings)).toEqual(new Set(["##### 执行状态填写区（唯一完成权威）"]));
  });
});
