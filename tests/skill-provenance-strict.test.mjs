import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const catalog = yaml.load(fs.readFileSync(path.join(root, "skills/catalog.yaml"), "utf8"));

describe("strict skill provenance", () => {
  it("pins every public upstream source to a real commit URL and review", () => {
    for (const entry of [...catalog.skills, ...catalog.capability_decisions]) {
      for (const source of entry.upstream || []) {
        if (!source.github_url) continue;
        expect(source.commit, `${entry.name} commit`).toMatch(/^[a-f0-9]{40}$/);
        expect(source.commit_url, `${entry.name} commit_url`).toContain(`/commit/${source.commit}`);
        expect(source.skill_url, `${entry.name} skill_url`).toContain(source.commit);
        expect(source.license, `${entry.name} license`).toBeTruthy();
        expect(source.reviewed_at, `${entry.name} reviewed_at`).toBe("2026-07-14");
        expect(source.review_outcome, `${entry.name} review_outcome`).toMatch(/accepted|rejected|watch/);
      }
    }
  });

  it("records resolved AnySearch and Spec Kit revisions consistently", () => {
    const notices = fs.readFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
    expect(notices).toContain("db3d76e5597aec7261257be5322dd211c9d9bb87");
    expect(notices).toContain("b7e67f55bf7a937aaa57dbe0a8198774e285de3a");
    expect(JSON.stringify(catalog)).not.toContain("unresolved-");
  });

  it("covers rejected AgentHub host discovery and handoff semantics", () => {
    const names = new Set(catalog.capability_decisions.map(item => item.name));
    expect(names).toContain("agenthub-skill-discovery-symlinks");
    expect(names).toContain("agenthub-handoff-session-pair");
  });
});
