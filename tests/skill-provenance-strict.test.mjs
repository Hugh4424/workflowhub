import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";
import { checkSkillClosure, parseStrictReviewDate } from "../runtime/evidence/check-skill-closure.mjs";
import { validateSkillBundle } from "../runtime/adapters/local-skill-resolver.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const yamlOptions = { schema: yaml.CORE_SCHEMA };
const catalog = yaml.load(fs.readFileSync(path.join(root, "skills/catalog.yaml"), "utf8"), yamlOptions);

describe("strict skill provenance", () => {
  it("binds every runtime skill review to its current local bundle", () => {
    for (const entry of catalog.skills) {
      expect(entry.local_version, entry.name).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.local_bundle_hash, entry.name).toMatch(/^[a-f0-9]{64}$/);
      const entryReviewedAt = parseStrictReviewDate(entry.last_reviewed_at);
      const catalogReviewedAt = parseStrictReviewDate(catalog.last_reviewed_at);
      expect(entryReviewedAt, `${entry.name} last_reviewed_at`).not.toBeNull();
      expect(catalogReviewedAt, "catalog last_reviewed_at").not.toBeNull();
      expect(entryReviewedAt, `${entry.name} last_reviewed_at`).toBeGreaterThanOrEqual(catalogReviewedAt);
      if (!["native", "adopted", "adapted"].includes(entry.status) || !entry.path) continue;
      const checked = validateSkillBundle(root, `skills/${entry.name}/skill-bundle.json`, entry.path);
      expect(checked.bundleHash, `${entry.name} local_bundle_hash`).toBe(entry.local_bundle_hash);
    }
    const browser = catalog.skills.find(entry => entry.name === "isolated-browser-qa");
    expect(browser.upstream[0]).toMatchObject({
      kind: "user-provided-local-source",
      snapshot_sha256: browser.local_bundle_hash,
      review_outcome: "accepted",
    });
    expect(browser.upstream[0].authorization_basis).toContain("user explicitly supplied");
  });
  it("preserves four-digit years below 0100 when parsing review dates", () => {
    expect(parseStrictReviewDate("0000-01-01")).toBe(-62167219200000);
    expect(parseStrictReviewDate("0099-01-01")).toBe(-59042995200000);
    expect(parseStrictReviewDate("0099-01-01")).toBeLessThan(parseStrictReviewDate("0100-01-01"));
  });
  it("fails closure for invalid baselines, stale entries, and invalid entries", () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-skill-closure-"));
    try {
      for (const directory of ["config", "runtime", "workflows", "skills"]) {
        fs.cpSync(path.join(root, directory), path.join(fixture, directory), { recursive: true });
      }
      fs.cpSync(path.join(root, "THIRD_PARTY_NOTICES.md"), path.join(fixture, "THIRD_PARTY_NOTICES.md"));
      const catalogPath = path.join(fixture, "skills/catalog.yaml");
      const rewriteCatalog = (mutate) => {
        const next = yaml.load(fs.readFileSync(catalogPath, "utf8"), yamlOptions);
        mutate(next);
        fs.writeFileSync(catalogPath, yaml.dump(next), "utf8");
        return checkSkillClosure(fixture).errors;
      };
      expect(rewriteCatalog((next) => { next.last_reviewed_at = "not-a-date"; }))
        .toContain("catalog: last_reviewed_at must be a valid YYYY-MM-DD date baseline");
      expect(rewriteCatalog((next) => {
        next.last_reviewed_at = catalog.last_reviewed_at;
        next.skills.find((entry) => entry.path && ["native", "adopted", "adapted"].includes(entry.status)).last_reviewed_at = "2026-07-13";
      }).some((error) => error.includes("provenance review date must be on or after the catalog baseline"))).toBe(true);
      expect(rewriteCatalog((next) => {
        next.skills.find((entry) => entry.path && ["native", "adopted", "adapted"].includes(entry.status)).last_reviewed_at = "2026-02-30";
      }).some((error) => error.includes("provenance review date must be on or after the catalog baseline"))).toBe(true);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
  it("pins every public upstream source to a real commit URL and review", () => {
    for (const entry of [...catalog.skills, ...catalog.capability_decisions]) {
      for (const source of entry.upstream || []) {
        if (!source.github_url) continue;
        expect(source.commit, `${entry.name} commit`).toMatch(/^[a-f0-9]{40}$/);
        expect(source.commit_url, `${entry.name} commit_url`).toContain(`/commit/${source.commit}`);
        expect(source.skill_url, `${entry.name} skill_url`).toContain(source.commit);
        expect(source.license, `${entry.name} license`).toBeTruthy();
        const sourceReviewedAt = parseStrictReviewDate(source.reviewed_at);
        const catalogReviewedAt = parseStrictReviewDate(catalog.last_reviewed_at);
        expect(sourceReviewedAt, `${entry.name} reviewed_at`).not.toBeNull();
        expect(catalogReviewedAt, "catalog last_reviewed_at").not.toBeNull();
        expect(sourceReviewedAt, `${entry.name} reviewed_at`).toBeGreaterThanOrEqual(catalogReviewedAt);
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

  it("records every selected Matt and gstack adoption decision", () => {
    const names = new Set(catalog.capability_decisions.map(item => item.name));
    for (const name of [
      "matt-code-review", "matt-research", "matt-to-tickets", "matt-prototype", "matt-implement", "matt-setup-and-experimental",
      "gstack-evidence-visibility", "gstack-state-data-flow", "gstack-ship-release-discipline", "gstack-canary",
    ]) expect(names, name).toContain(name);
  });
});
