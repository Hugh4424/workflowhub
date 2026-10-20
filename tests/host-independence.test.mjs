import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { load as loadYaml } from "js-yaml";

const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..");

const currentContractDocs = [
  "docs/contracts/card-01-stage-material-interface.md",
  "docs/standard-workflow.md",
];

const workflowStages = [
  "make-decision",
  "build-plan",
  "build-code",
  "verify-code",
  "build-prd",
];

function listFiles(directory, predicate) {
  const absoluteDirectory = join(repoRoot, directory);
  if (!existsSync(absoluteDirectory)) {
    // T45 retired the GitHub-hosted workflow, so `.github/workflows` is the only
    // surface directory allowed to be absent: it contributes no files rather than
    // failing. Every other surface directory must fail loud, otherwise deleting
    // `core/`, `scripts/`, `metrics/` or `workflows/` would silently shrink this
    // scan to an empty set and pass.
    if (directory === ".github/workflows") return [];
    throw new Error(`host-independence surface directory is missing: ${directory}`);
  }
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
      const bundleFile = join(dirname(dependency.path), "skill-bundle.json");
      const bundle = JSON.parse(readFileSync(join(repoRoot, bundleFile), "utf8"));
      files.add(bundleFile);
      for (const entry of bundle.files ?? []) {
        const bundlePath = typeof entry === "string" ? entry : entry.path;
        files.add(join(dirname(bundleFile), bundlePath));
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

// Only these complete rejection statements carry host-named evidence data.
// Any contract drift keeps the original token visible to the host rule.
const sidecarRejections = {
  close: 'const SIDECARS = ["quality/", "evidence/", ".multica/", "qa-artifacts/"];',
  closeUse: 'const unsafe = all.filter((p) => SIDECARS.some((prefix) => p.startsWith(prefix) || p.startsWith(`specs/${taskId}/${prefix}`)));',
  closeThrow: 'if (unsafe.length) throw failure("CLOSE_EXECUTION_SIDECARS", `publish task-owned execution sidecars before close: ${unsafe.join(", ")}`);',
};

function sidecarDataView(repoPath, source) {
  const closePath = "core/task-close.mjs";
  if (repoPath !== closePath) return { text: source, reason: "" };
  const close = source;
  const exactLine = (text, statement) => text.split("\n").filter(line => line.trim() === statement).length === 1;
  const inside = (text, start, end, statements) => {
    const first = text.indexOf(start);
    const last = text.indexOf(end, first + start.length);
    return first >= 0 && last > first && statements.every(statement => exactLine(text.slice(first, last), statement));
  };
  const valid = exactLine(close, sidecarRejections.close)
    && inside(close, "function assertNoSidecars(root, taskId) {", "\nfunction sourceState(root, taskId) {", [sidecarRejections.closeUse, sidecarRejections.closeThrow])
    && close.includes("function sourceState(root, taskId) {\n  assertNoSidecars(root, taskId);")
    && exactLine(close, "assertNoSidecars(plan.worktree_root, plan.task_id);");
  if (!valid) return { text: source, reason: "; sidecar rejection contract mismatch" };
  const statements = [sidecarRejections.close];
  return {
    text: source.split("\n").map(line => statements.includes(line.trim()) ? line.replace('".multica/"', '"<execution-sidecar>/"') : line).join("\n"),
    reason: "",
  };
}

function lineFindings(repoPath, pattern, reason, classifySidecar = false) {
  const source = readFileSync(join(repoRoot, repoPath), "utf8");
  const view = classifySidecar ? sidecarDataView(repoPath, source) : { text: source, reason: "" };
  return view.text
    .split("\n")
    .flatMap((line, index) =>
      pattern.test(line)
        ? [`${repoPath}:${index + 1} ${reason}${view.reason}: ${source.split("\n")[index].trim()}`]
        : [],
    );
}

describe("WorkflowHub host independence", () => {
  it("keeps active runtime, CLI, Skills, CI, and contracts host-neutral", () => {
    const findings = activeSurfaceFiles().flatMap((repoPath) => {
      if (isSourceRecord(repoPath)) return [];
      const isGenericHostGuard = new Set([
        "tools/cli/check-anti-host.mjs",
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
          true,
        )),
      ];
    });

    expect(findings, `active host coupling:\n${findings.join("\n")}`).toEqual([]);
  });
});
