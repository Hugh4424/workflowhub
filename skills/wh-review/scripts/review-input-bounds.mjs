import { createHash } from "node:crypto";

export const TASK_BOUND_PROVIDER_INPUT_MAX_BYTES = 300 * 1024;
// Keep the bounded projection below the inline threshold so packet identity
// remains stable when a frozen provider input is rehydrated.
export const TASK_BOUND_DIFF_BUDGET_BYTES = 150 * 1024;
export const TASK_BOUND_DIFF_INLINE_LIMIT_BYTES = 160 * 1024;
export const TASK_BOUND_CONTEXT_BUDGET_BYTES = 96 * 1024;

const CODE_FILE = /\.(?:c|cc|cpp|cxx|css|fish|go|h|hpp|java|js|jsx|kt|m|mjs|mm|php|py|pyi|rb|rs|sass|scss|sh|sql|svelte|swift|ts|tsx|vue|zsh)$/i;
const REVIEW_DIFF_PRIORITY = [
  "skills/wh-review/scripts/wh-review-cli.mjs",
  "skills/wh-review/scripts/review-runner.mjs",
  "skills/wh-review/scripts/review-materials.mjs",
  "skills/wh-review/scripts/review-provider-client.mjs",
  "skills/wh-review/scripts/simple-review-runner.mjs",
  "skills/wh-review/scripts/third-review-host-config.mjs",
  "runtime/review/review-record-route.mjs",
  "runtime/stage/stage-runner.mjs",
  "runtime/stage/stage-agent-outcome-adapter.mjs",
  "runtime/evidence/freshness.mjs",
  "runtime/evidence/canonical-evidence-validators.mjs",
  "runtime/task/task-kernel-implementation.mjs",
];
const REVIEW_DIFF_PRIORITY_INDEX = new Map(REVIEW_DIFF_PRIORITY.map((path, index) => [path, index]));

function diffSectionPath(section) {
  const header = section.match(/^diff --git a\/(.+) b\/(.+)$/m);
  return header?.[1] === header?.[2] ? header[1] : (header?.[2] ?? header?.[1] ?? null);
}

function diffSectionKind(path) {
  if (!path || !CODE_FILE.test(path)) return "summary";
  const segments = path.toLowerCase().split("/");
  const basename = segments.at(-1) ?? "";
  return segments.some((segment) => ["test", "tests", "__tests__", "spec", "specs"].includes(segment))
    || /(?:^|[._-])(?:test|spec)(?:[._-]|$)/.test(basename) ? "test" : "implementation";
}

export function compactReviewDiff(diff, { budgetBytes = TASK_BOUND_DIFF_BUDGET_BYTES, inlineLimitBytes = TASK_BOUND_DIFF_INLINE_LIMIT_BYTES } = {}) {
  if (typeof diff !== "string") throw new TypeError("review diff must be text");
  const bytes = Buffer.byteLength(diff, "utf8");
  const fullDiffSha256 = createHash("sha256").update(diff).digest("hex");
  if (bytes <= inlineLimitBytes) {
    return { diff, index: { mode: "full", full_diff_bytes: bytes, full_diff_sha256: fullDiffSha256 } };
  }
  const sections = diff.split(/(?=^diff --git )/m).filter((section) => section.startsWith("diff --git "))
    .map((section) => ({ section, path: diffSectionPath(section), kind: diffSectionKind(diffSectionPath(section)), bytes: Buffer.byteLength(section, "utf8") }));
  if (sections.length === 0) {
    throw Object.assign(new Error("MATERIAL_TOO_LARGE: verify-code implementation diff has no reviewable diff sections"), { code: "MATERIAL_TOO_LARGE" });
  }
  const rank = (entry) => entry.kind === "implementation" ? 0 : entry.kind === "test" ? 1 : 2;
  const candidateRank = (entry) => [REVIEW_DIFF_PRIORITY_INDEX.get(entry.path) ?? Number.MAX_SAFE_INTEGER, rank(entry), entry.path ?? "", entry.bytes];
  sections.sort((left, right) => {
    const a = candidateRank(left); const b = candidateRank(right);
    return a[0] - b[0] || a[1] - b[1] || a[2].localeCompare(b[2]) || a[3] - b[3];
  });
  const candidates = sections.filter((entry) => entry.kind !== "summary");
  const included = [];
  let remaining = budgetBytes;
  const implementationCandidates = candidates.filter((entry) => entry.kind === "implementation");
  const testCandidates = candidates.filter((entry) => entry.kind === "test");
  const mandatory = [];
  if (implementationCandidates.length > 0 && testCandidates.length > 0) {
    const implementation = implementationCandidates.find((entry) => testCandidates.some((test) => entry.bytes + test.bytes <= budgetBytes));
    const test = implementation && testCandidates.find((entry) => implementation.bytes + entry.bytes <= budgetBytes);
    if (implementation && test) mandatory.push(implementation, test);
  } else if (implementationCandidates.length > 0) {
    const implementation = implementationCandidates.find((entry) => entry.bytes <= budgetBytes);
    if (implementation) mandatory.push(implementation);
  }
  for (const entry of mandatory) {
    included.push(entry);
    remaining -= entry.bytes;
  }
  for (const entry of candidates) {
    if (included.includes(entry)) continue;
    if (entry.bytes <= remaining) {
      included.push(entry);
      remaining -= entry.bytes;
    }
  }
  for (const kind of ["implementation", "test"]) {
    if (!sections.some((entry) => entry.kind === kind) || included.some((entry) => entry.kind === kind)) continue;
    const candidate = sections.find((entry) => entry.kind === kind);
    if (!candidate || remaining < 1024) continue;
    const marker = "\n\n# WH_REVIEW_TRUNCATED_SECTION path=" + candidate.path + " full_bytes=" + candidate.bytes + "\n";
    const markerBytes = Buffer.byteLength(marker, "utf8");
    const prefix = Buffer.from(candidate.section, "utf8").subarray(0, Math.max(0, remaining - markerBytes));
    const section = prefix.toString("utf8") + marker;
    included.push({ ...candidate, section, bytes: Buffer.byteLength(section, "utf8") });
    remaining = Math.max(0, remaining - Buffer.byteLength(section, "utf8"));
  }
  if (!included.some((entry) => entry.kind === "implementation")) {
    throw Object.assign(new Error("MATERIAL_TOO_LARGE: verify-code implementation diff exceeds the bounded provider budget"), { code: "MATERIAL_TOO_LARGE" });
  }
  const includedPaths = new Set(included.map((entry) => entry.path));
  const bounded = included.map((entry) => entry.section).join("");
  return {
    diff: bounded,
    index: {
      mode: "bounded",
      full_diff_bytes: bytes,
      full_diff_sha256: fullDiffSha256,
      included_diff_bytes: Buffer.byteLength(bounded, "utf8"),
      included_paths: [...includedPaths].sort(),
      omitted_paths: sections.filter((entry) => !includedPaths.has(entry.path)).map((entry) => ({ path: entry.path, kind: entry.kind, bytes: entry.bytes })),
      note: "Provider receives complete selected implementation/test sections; the host retains the full snapshot and diff identity.",
    },
  };
}

export function compactVerifyCodeMaterials(materials) {
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) return { materials, diff: null };
  const candidate = Object.entries(materials).find(([key, value]) => typeof value === "string"
    && /(?:implementation[-_]diff|diff[-_]patch|changes\.diff)/i.test(key)
    && Buffer.byteLength(value, "utf8") > TASK_BOUND_DIFF_INLINE_LIMIT_BYTES);
  let projected = materials;
  let diff = null;
  if (candidate) {
    const [key, value] = candidate;
    const compacted = compactReviewDiff(value);
    projected = {
      ...projected,
      [key]: compacted.diff,
      "implementation-index": {
        ...(projected["implementation-index"] && typeof projected["implementation-index"] === "object" ? projected["implementation-index"] : {}),
        diff_sha256: compacted.index.full_diff_sha256,
        diff_bytes: compacted.index.full_diff_bytes,
        delivery: compacted.index,
      },
    };
    diff = compacted.index;
  }
  const byteSize = (value) => Buffer.isBuffer(value) ? value.length : Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value), "utf8");
  const totalBytes = Object.values(projected).reduce((sum, value) => sum + byteSize(value), 0);
  if (totalBytes <= TASK_BOUND_PROVIDER_INPUT_MAX_BYTES) return { materials: projected, diff };
  const contextKeys = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
  const available = contextKeys.filter((key) => typeof projected[key] === "string");
  if (available.length === 0) throw Object.assign(new Error("MATERIAL_TOO_LARGE: verify-code provider input exceeds the bounded budget"), { code: "MATERIAL_TOO_LARGE" });
  const perMaterial = Math.max(8 * 1024, Math.floor(TASK_BOUND_CONTEXT_BUDGET_BYTES / available.length));
  const compactText = (key, value) => {
    const bytes = Buffer.byteLength(value, "utf8");
    if (bytes <= perMaterial) return value;
    const sourceHash = createHash("sha256").update(value, "utf8").digest("hex");
    const source = Buffer.from(value, "utf8");
    const head = Math.floor(perMaterial * 0.65);
    const tail = Math.max(0, perMaterial - head);
    return `# Bounded verify-code context: ${key}\n# full_bytes=${bytes} full_sha256=${sourceHash}\n# host retains full material; provider receives context excerpts only.\n\n${source.subarray(0, head).toString("utf8")}\n\n[... omitted middle ...]\n\n${source.subarray(Math.max(0, source.length - tail)).toString("utf8")}\n`;
  };
  projected = { ...projected };
  for (const key of available) projected[key] = compactText(key, projected[key]);
  const projectedBytes = Object.values(projected).reduce((sum, value) => sum + byteSize(value), 0);
  if (projectedBytes > TASK_BOUND_PROVIDER_INPUT_MAX_BYTES) throw Object.assign(new Error("MATERIAL_TOO_LARGE: verify-code provider input exceeds the bounded budget"), { code: "MATERIAL_TOO_LARGE" });
  return { materials: projected, diff };
}
