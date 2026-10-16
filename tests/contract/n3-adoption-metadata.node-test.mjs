import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import yaml from "js-yaml";

// A source-registration oracle only. Passing does not prove correct application,
// actual skill invocation, method effectiveness, independent review, or AC pass.
// Expected coordinates come from the confirmed N3 16+8 adoption table and its
// quality/evidence/research/n3-upstream-source-research.md original, not catalog.
// js-yaml is the existing reader used by check-skill-consistency.mjs; no new
// production schema/reader, source fields, runtime entry, or dispatch is added.
const root = fileURLToPath(new URL("../../", import.meta.url));
const catalogPath = path.join(root, "skills/catalog.yaml");
const moveMap = JSON.parse(fs.readFileSync(path.join(root, "docs/architecture/move-map.json"), "utf8"));
const ADDY = "https://github.com/addyosmani/agent-skills";
const PSTACK = "https://github.com/backnotprop/pstack";
const ADDY_COMMIT = "aeac41d4d005999432bb7312f7ff06383a91d59d";
// No git commit was available for this content package. This is its real identity.
const PSTACK_COMMIT = "unresolved-pstack-content-snapshot";
const PSTACK_PACKAGE = "f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8";
const reviewConsumers = [
  "skills/wh-review/SKILL.md",
  "skills/wh-review/contracts/provider-protocol.md",
  "skills/review/SKILL.md",
];
const diagnosisConsumers = ["skills/diagnosing-bugs/SKILL.md"];
const simplicityConsumers = ["skills/simplicity-guard/SKILL.md"];
const source = (name, repo, locator, consumers) => ({ name, repo, locator, consumers });
const requirements = {
  P2: [
    source("doubt-driven-development", ADDY, "skills/doubt-driven-development/SKILL.md", reviewConsumers),
    source("interrogate", PSTACK, "skills/interrogate/SKILL.md", reviewConsumers),
    source("attack-the-premise", PSTACK, "skills/principle-attack-the-premise/SKILL.md", reviewConsumers),
    source("blast-radius", PSTACK, "skills/blast-radius/SKILL.md", reviewConsumers),
    source("architect", PSTACK, "skills/architect/SKILL.md", reviewConsumers),
    source("arena", PSTACK, "skills/arena/SKILL.md", reviewConsumers),
    source("show-me-your-work", PSTACK, "skills/show-me-your-work/SKILL.md", reviewConsumers),
  ],
  P5: [
    source("debugging-and-error-recovery", ADDY, "skills/debugging-and-error-recovery/SKILL.md", diagnosisConsumers),
    source("perf-issue.md", PSTACK, "skills/poteto-mode/playbooks/perf-issue.md", diagnosisConsumers),
  ],
  P6: [
    source("code-simplification", ADDY, "skills/code-simplification/SKILL.md", simplicityConsumers),
    source("laziness-protocol", PSTACK, "skills/principle-laziness-protocol/SKILL.md", simplicityConsumers),
    source("interrogate", PSTACK, "skills/interrogate/SKILL.md", simplicityConsumers),
    source("subtract-before-you-add", PSTACK, "skills/principle-subtract-before-you-add/SKILL.md", simplicityConsumers),
  ],
};

function load(text) {
  const catalog = yaml.load(text);
  assert.ok(Array.isArray(catalog?.skills), "catalog skills must parse as an array");
  assert.ok(Array.isArray(catalog?.capability_decisions), "catalog capability_decisions must parse as an array");
  return catalog;
}

function registrations(catalog) {
  return [
    ...catalog.skills.filter(row => ["native", "adopted", "adapted"].includes(row.status))
      .map(row => ({ ...row, consumers: [row.path] })),
    ...catalog.capability_decisions.filter(row => row.status === "absorbed")
      .map(row => ({ ...row, consumers: typeof row.local_path === "string"
        ? row.local_path.split(/\s*[;\n]\s*/).filter(Boolean) : [] })),
  ];
}

function sameLocator(actual, expected) {
  // Existing upstream records use either a SKILL.md or its containing directory.
  return actual === expected || (expected.endsWith("/SKILL.md")
    && actual === expected.slice(0, -"/SKILL.md".length));
}

function hasSource(row, expected) {
  return Array.isArray(row.upstream) && row.upstream.some(upstream => {
    if (upstream.github_url !== expected.repo || !sameLocator(upstream.path, expected.locator)
        || upstream.license !== "MIT" || !/^\d{4}-\d{2}-\d{2}$/.test(upstream.reviewed_at ?? "")
        || typeof upstream.review_outcome !== "string" || !upstream.review_outcome.trim()
        || !Array.isArray(upstream.adopted) || upstream.adopted.length === 0
        || upstream.adopted.some(item => typeof item !== "string" || !item.trim())
        || typeof upstream.skill_url !== "string") return false;
    if (expected.repo === ADDY) {
      return upstream.commit === ADDY_COMMIT
        && upstream.commit_url === `${ADDY}/commit/${ADDY_COMMIT}`
        && ["blob", "tree"].some(kind => upstream.skill_url === `${ADDY}/${kind}/${ADDY_COMMIT}/${upstream.path}`);
    }
    // main in a discovery URL is not a revision claim: the package hash below
    // pins content. Never manufacture a git commit or unresolved commit URL.
    return upstream.commit === PSTACK_COMMIT
      && (!upstream.commit_url || upstream.commit_url === PSTACK)
      && upstream.skill_url.startsWith(`${PSTACK}/`)
      && upstream.skill_url.endsWith(`/${upstream.path}`)
      && !upstream.skill_url.includes(PSTACK_COMMIT)
      && [row.local_changes, row.update_policy].some(value =>
        typeof value === "string" && value.includes(PSTACK_PACKAGE));
  });
}

function missingRegistrations(catalog, phase) {
  const rows = registrations(catalog);
  return requirements[phase].filter(expected => !rows.some(row =>
    typeof row.local_changes === "string" && row.local_changes.trim()
    && typeof row.update_policy === "string" && row.update_policy.trim()
    && row.consumers.some(consumer => expected.consumers.includes(consumer))
    && hasSource(row, expected)))
    .map(expected => `${phase}: missing complete upstream/consumer registration: ${expected.name}; `
      + `${expected.repo}:${expected.locator} -> ${expected.consumers.join(" OR ")}`);
}

function legalSample(phase) {
  return load(yaml.dump({
    schema_version: 2,
    projects: {},
    // An absorbed record need not change the native skill's identity/upstream.
    skills: ["wh-review", "decision-log", "simplicity-guard"].map(name => ({
      name, path: `skills/${name}/SKILL.md`, status: "native", upstream: [],
    })),
    capability_decisions: requirements[phase].map(expected => ({
      name: `sample-${expected.name.replace(/\./g, "-")}`,
      status: "absorbed",
      purpose: "Source metadata fixture; not a method-effect claim",
      design_idea: "Existing absorbed registration shape",
      used_by_stages: [],
      local_path: expected.consumers[0],
      upstream: [{
        github_url: expected.repo,
        commit: expected.repo === ADDY ? ADDY_COMMIT : PSTACK_COMMIT,
        ...(expected.repo === ADDY ? { commit_url: `${ADDY}/commit/${ADDY_COMMIT}` } : {}),
        license: "MIT", reviewed_at: "2026-10-16", review_outcome: "accepted",
        path: expected.locator,
        skill_url: `${expected.repo}/blob/${expected.repo === ADDY ? ADDY_COMMIT : "main"}/${expected.locator}`,
        adopted: [`${expected.locator} — adopted content for ${expected.name}`],
      }],
      local_changes: `Bound consumer in local_path; pstack package sha256 ${PSTACK_PACKAGE}; git commit unknown`,
      dependency_closure: [],
      update_policy: "Compare fixed sources; do not restore an independent skill or infer method effectiveness",
    })),
  }));
}

for (const phase of ["P2", "P5", "P6"]) {
  test(`${phase} adopted upstream coordinates and concrete consumer registration`, async t => {
    await t.test("legal absorbed fixture passes while native skills keep upstream=[]", () => {
      const sample = legalSample(phase);
      assert.deepEqual(missingRegistrations(sample, phase), []);
      assert.ok(sample.skills.every(row => row.status === "native" && row.upstream.length === 0));
    });
    await t.test("removing each required upstream or consumer makes the fixture fail", () => {
      for (const [index, expected] of requirements[phase].entries()) {
        const noSource = legalSample(phase);
        noSource.capability_decisions[index].upstream = [];
        assert.ok(missingRegistrations(noSource, phase).some(message => message.includes(`${expected.name};`)));
        const noConsumer = legalSample(phase);
        noConsumer.capability_decisions[index].local_path = "tests/metadata-only-fixture.md";
        assert.ok(missingRegistrations(noConsumer, phase).some(message => message.includes(`${expected.name};`)));
      }
      const noPin = legalSample(phase);
      for (const row of noPin.capability_decisions) row.local_changes = "No content pin";
      assert.equal(missingRegistrations(noPin, phase).length,
        requirements[phase].filter(expected => expected.repo === PSTACK).length);
    });
    await t.test("missing or empty adopted descriptions make the fixture fail", () => {
      for (const [index, expected] of requirements[phase].entries()) {
        const noAdopted = legalSample(phase);
        delete noAdopted.capability_decisions[index].upstream[0].adopted;
        assert.ok(missingRegistrations(noAdopted, phase).some(message => message.includes(`${expected.name};`)));
        const emptyAdopted = legalSample(phase);
        emptyAdopted.capability_decisions[index].upstream[0].adopted = [];
        assert.ok(missingRegistrations(emptyAdopted, phase).some(message => message.includes(`${expected.name};`)));
      }
    });
    await t.test("catalog declares the confirmed sources at existing production consumers", () => {
      // Physical presence and move-map registration prove only named local
      // destinations; independent full-input consumption must prove real use.
      for (const consumer of new Set(requirements[phase].flatMap(expected => expected.consumers))) {
        assert.ok(fs.statSync(path.join(root, consumer)).isFile(), `consumer file missing: ${consumer}`);
        assert.ok(moveMap.entries.some(entry => entry.destination === consumer && entry.role === "production"),
          `consumer lacks an existing production responsibility: ${consumer}`);
      }
      const actual = load(fs.readFileSync(catalogPath, "utf8"));
      const missing = missingRegistrations(actual, phase);
      assert.equal(missing.length, 0, missing.join("\n"));
    });
  });
}
