import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { load as loadYaml } from "js-yaml";

const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..");

const retiredFiles = [
  "core/multica-source-adapter.mjs",
  "scripts/agenthub-baseline.mjs",
];

const currentContractDocs = [
  "docs/audit-contracts.md",
  "docs/migration-and-fallback.md",
];

const workflowStages = [
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
];

function listFiles(directory, predicate) {
  const absoluteDirectory = join(repoRoot, directory);
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(absoluteDirectory, entry.name);
    if (entry.isDirectory()) {
      return listFiles(relative(repoRoot, absolutePath), predicate);
    }
    const repoPath = relative(repoRoot, absolutePath);
    return predicate(repoPath) ? [repoPath] : [];
  });
}

function skillClosureSurfaceFiles() {
  const files = new Set();
  for (const stage of workflowStages) {
    const declaration = `workflows/${stage}/skill-deps.yaml`;
    const closure = loadYaml(readFileSync(join(repoRoot, declaration), "utf8"));
    files.add(declaration);
    for (const dependency of closure.skills ?? []) {
      const bundle = JSON.parse(readFileSync(join(repoRoot, dependency.bundle), "utf8"));
      files.add(dependency.bundle);
      for (const entry of bundle.files ?? []) {
        const bundlePath = typeof entry === "string" ? entry : entry.path;
        files.add(join(dirname(dependency.bundle), bundlePath));
      }
    }
  }
  return [...files];
}

function activeSurfaceFiles() {
  const runtime = ["core", "scripts", "metrics"].flatMap((directory) =>
    listFiles(
      directory,
      (path) => extname(path) === ".mjs" && !path.includes("/__tests__/"),
    ),
  );
  const skills = listFiles(
    "workflows",
    (path) => path.endsWith("/SKILL.md"),
  );
  const ci = listFiles(
    ".github/workflows",
    (path) => path.endsWith(".yml") || path.endsWith(".yaml"),
  );
  return [
    ...runtime,
    ...skills,
    ...skillClosureSurfaceFiles(),
    ...ci,
    ...currentContractDocs,
    ".gitignore",
  ].filter((path, index, files) => files.indexOf(path) === index).sort();
}

function isSourceRecord(repoPath) {
  return /(?:^|\/)(?:LICENSE|NOTICE|THIRD_PARTY_NOTICES\.md)$/u.test(repoPath)
    || repoPath === "skills/catalog.yaml"
    || repoPath === "skills/reuse-registry.md";
}

function lineFindings(repoPath, pattern, reason) {
  return readFileSync(join(repoRoot, repoPath), "utf8")
    .split("\n")
    .flatMap((line, index) =>
      pattern.test(line)
        ? [`${repoPath}:${index + 1} ${reason}: ${line.trim()}`]
        : [],
    );
}

describe("WorkflowHub host independence", () => {
  it("has retired the Multica source adapter and AgentHub baseline bridge", () => {
    const present = retiredFiles.filter((path) => existsSync(join(repoRoot, path)));

    expect(present, `retired host bridges still exist:\n${present.join("\n")}`).toEqual([]);
  });

  it("keeps active runtime, CLI, Skills, CI, and contracts host-neutral", () => {
    const findings = activeSurfaceFiles().flatMap((repoPath) => {
      if (isSourceRecord(repoPath)) return [];
      const isGenericHostGuard = new Set([
        "tools/cli/check-anti-host.mjs",
        "tools/cli/check-task-record-paths.mjs",
      ]).has(repoPath);
      return [
        ...lineFindings(
          repoPath,
          /\bMultica\b.*\b(?:API|Issue|status|mention|generation|comment|instructions)\b|normalizeMulticaSource|multica-source-adapter/iu,
          "Multica behavior",
        ),
        ...(isGenericHostGuard ? [] : lineFindings(
          repoPath,
          /(?:\/Users\/|\/home\/)[^\s"'`]*multica-agenthub|Knowledge\/Projects\/multica-agenthub|\.machine\/source/iu,
          "AgentHub machine-local path",
        )),
        ...lineFindings(
          repoPath,
          /(?:scripts\/agenthub-baseline\.mjs|tests\/agenthub-baseline\.test\.mjs)/u,
          "retired AgentHub bridge reference",
        ),
        ...(isGenericHostGuard ? [] : lineFindings(
          repoPath,
          /^(?!.*AgentHub historical import).*(?:\bmultica\b|\.multica\/)/iu,
          "host-specific active restriction",
        )),
      ];
    });

    expect(findings, `active host coupling:\n${findings.join("\n")}`).toEqual([]);
  });
});
