import { createHash } from "node:crypto";
import { lstatSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertTaskHandle } from "../../../core/task-handle.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(readFileSync(resolve(here, "..", "stage-materials.json"), "utf8"));
const skillPlan = JSON.parse(readFileSync(resolve(here, "..", "stage-skill-plan.json"), "utf8"));
const workflowhubSkills = resolve(here, "..", "..");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeRelative(path) {
  return typeof path === "string" && path !== "" && !path.startsWith("/") && !path.includes("\\")
    && !path.split("/").some((part) => part === "" || part === "." || part === "..");
}

function write(root, path, bytes) {
  if (!safeRelative(path)) throw new Error(`MATERIAL_INCOMPLETE: unsafe material path ${JSON.stringify(path)}`);
  const target = resolve(root, ...path.split("/"));
  if (!relative(root, target) || relative(root, target).startsWith("..")) throw new Error("MATERIAL_INCOMPLETE: material path escapes bundle");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes, { flag: "wx" });
}

function materialBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
}

function materialPresent(value) {
  if (Buffer.isBuffer(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && typeof value === "object" && Object.keys(value).length > 0;
}

function filesUnder(root, current = root) {
  const found = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(root, path));
    else if (entry.isFile()) found.push(relative(root, path).replaceAll("\\", "/"));
  }
  return found;
}

export function canonicalMaterialManifest(entries) {
  const sorted = [...entries].sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
  return JSON.stringify(sorted.map(({ path, bytes, sha256: digest }) => ({ path, bytes, sha256: digest })));
}

function ruleFor(stage, track) {
  const stageRule = matrix.stages[stage];
  if (!stageRule) throw new Error(`MATERIAL_INCOMPLETE: unknown stage ${stage}`);
  if (stage === "make-decision") {
    const rule = stageRule.tracks?.[track];
    if (!rule) throw new Error(`MATERIAL_INCOMPLETE: make-decision requires direction or detail track`);
    return rule;
  }
  if (track !== null && track !== undefined) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use a review track`);
  return stageRule;
}

function stagePlanFor(stage, track) {
  const stagePlan = skillPlan.stages[stage];
  return stage === "make-decision" ? stagePlan?.tracks?.[track] : stagePlan;
}

export function reviewInstructionsFor(stage, track = null, uiScope = false) {
  ruleFor(stage, track);
  const plan = stagePlanFor(stage, track);
  if (!plan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${track ?? "default"}`);
  const selectedSkills = [...new Set([...(plan.required_skills ?? []), ...(uiScope === true ? (plan.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])])];
  if (["build-code", "verify-code"].includes(stage) && selectedSkills.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  const scope = stage === "make-decision" ? `${stage}/${track}` : stage;
  const blind = stage === "make-decision" && track === "direction"
    ? "The bundle intentionally contains no proposed solution. Judge only the requirement, facts, constraints, and decision direction."
    : "Judge the supplied stage artifact against its requirements, contract, and evidence.";
  const skillInstruction = selectedSkills.length ? `Read these manifest-declared reviewer skills before reviewing: ${selectedSkills.map((name) => `skills/${name}/SKILL.md`).join(", ")}.` : "No reviewer skills are declared for this stage.";
  return `Review stage ${scope}. Read only files in this bundle. Read contracts/ and ${skillInstruction} Recompute SHA-256 for every canonical-evidence entity and its referenced output/evidence file using canonical-evidence.json before trusting it. ${blind} Return only one JSON object with verdict, summary, and findings using the requested reviewer schema. Do not access the repository, parent directories, Git, shell, network, or host paths.\n`;
}

export function minimumReviewersFor(stage, track = null) { return ruleFor(stage, track).minimum_reviewers; }

function readRegisteredFile(path, label) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path) throw new Error(`MATERIAL_INCOMPLETE: ${label} must be a registered regular file`);
  return readFileSync(path);
}

export function buildReviewMaterials({ reviewDataRoot, attachmentRoot, source, task, taskId, stage, reviewTrack = null, uiScope = false, materials = {} } = {}) {
  if (!(reviewDataRoot && attachmentRoot && source && taskId)) throw new TypeError("reviewDataRoot, attachmentRoot, source, and taskId are required");
  const rule = ruleFor(stage, reviewTrack);
  for (const key of rule.required) if (!(key in materials) || !materialPresent(materials[key])) throw new Error(`MATERIAL_INCOMPLETE: missing or empty ${key}`);
  if (stage === "make-decision" && reviewTrack === "direction") {
    const allowed = new Set(rule.required);
    for (const key of Object.keys(materials)) if (!allowed.has(key)) throw new Error(`MATERIAL_FORBIDDEN: direction forbids unknown material ${key}`);
  }
  for (const key of rule.forbidden) if (key in materials) throw new Error(`MATERIAL_FORBIDDEN: ${stage}/${reviewTrack ?? "default"} forbids ${key}`);
  const fixedInstructions = reviewInstructionsFor(stage, reviewTrack, uiScope);
  if (materials.review_instructions !== fixedInstructions) throw new Error("MATERIAL_FORBIDDEN: review_instructions must use the fixed stage template");

  const packetRoot = resolve(attachmentRoot, ".wh-review-packets");
  mkdirSync(packetRoot, { recursive: true });
  const bundleRoot = mkdtempSync(join(packetRoot, `bundle-${stage}-${reviewTrack ?? "default"}-`));
  if (rule.source_bundle === "required") {
    write(bundleRoot, "source.json", Buffer.from(`${JSON.stringify({
      target_commit: source.targetCommit,
      base_commit: source.baseCommit,
      base_tree: source.baseTree,
      captured_head: source.capturedHead,
      snapshot_tree: source.snapshotTree
    })}\n`));
    write(bundleRoot, "changes.diff", Buffer.from(source.diff));
    write(bundleRoot, "changed-files.json", Buffer.from(`${JSON.stringify(source.changedFiles)}\n`));
    for (const item of source.changedFiles) {
      if (item.status !== "deleted") write(bundleRoot, `changed/${item.path}`, source.readSnapshotFile(item.path));
    }
  }

  const stagePlan = stagePlanFor(stage, reviewTrack);
  if (!stagePlan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${reviewTrack ?? "default"}`);
  const contractName = stage === "make-decision" ? "make-decision" : stage;
  write(bundleRoot, `contracts/${contractName}.md`, readRegisteredFile(resolve(here, "..", "contracts", `${contractName}.md`), `${contractName} contract`));
  write(bundleRoot, "contracts/provider-protocol.md", readRegisteredFile(resolve(here, "..", "contracts", "provider-protocol.md"), "provider protocol"));
  const selectedSkills = [...(stagePlan?.required_skills ?? []), ...(uiScope === true ? (stagePlan?.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])];
  if (["build-code", "verify-code"].includes(stage) && (stagePlan.required_skills ?? []).length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  for (const skill of selectedSkills) {
    write(bundleRoot, `skills/${skill}/SKILL.md`, readRegisteredFile(resolve(workflowhubSkills, skill, "SKILL.md"), `${skill} skill`));
  }

  for (const [key, value] of Object.entries(materials)) {
    const path = key === "review_instructions" ? "review-instructions.md" : `requirements/${key}.${typeof value === "string" ? "md" : "json"}`;
    write(bundleRoot, path, materialBytes(value));
  }
  freezeCanonicalEvidence({ bundleRoot, task, materials });
  const payloadFiles = filesUnder(bundleRoot);
  const entries = payloadFiles.map((path) => {
    const bytes = readFileSync(join(bundleRoot, ...path.split("/")));
    return { path, bytes: bytes.length, sha256: sha256(bytes) };
  });
  const manifest = canonicalMaterialManifest(entries);
  const materialId = sha256(Buffer.from(manifest, "utf8"));
  write(bundleRoot, "manifest.json", Buffer.from(manifest, "utf8"));
  const manifestBytes = Buffer.from(manifest, "utf8");
  const deliveryManifest = [...entries, { path: "manifest.json", bytes: manifestBytes.length, sha256: sha256(manifestBytes) }];
  const sourcePrefix = relative(resolve(attachmentRoot), bundleRoot).replaceAll("\\", "/");
  return Object.freeze({ bundleRoot, attachmentRoot: resolve(attachmentRoot), sourcePrefix, materialId, files: Object.freeze([...payloadFiles, "manifest.json"]), manifest: Object.freeze(entries), deliveryManifest: Object.freeze(deliveryManifest) });
}

function freezeCanonicalEvidence({ bundleRoot, task, materials }) {
  const discovered = [];
  const canonicalRef = (value) => typeof value === "string" && /^(?:receipts|reviews\/results|evidence)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) && !value.split("/").includes("..");
  const normalizeHash = (value) => typeof value === "string" ? value.replace(/^sha256:/, "") : undefined;
  const scan = (value, relation, from = "materials") => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach((item, index) => scan(item, `${relation}[${index}]`, from)); return; }
    for (const [key, child] of Object.entries(value)) {
      if (key === "ref" && canonicalRef(child) && typeof value.sha256 === "string") discovered.push({ ref: child, expected: normalizeHash(value.sha256), relation, from });
      else if (key.endsWith("_ref") && canonicalRef(child)) {
        const hashKey = `${key.slice(0, -4)}_hash`;
        if (typeof value[hashKey] === "string") discovered.push({ ref: child, expected: normalizeHash(value[hashKey]), relation: `${relation}.${key}`, from });
      }
      scan(child, `${relation}.${key}`, from);
    }
  };
  scan(materials, "materials");
  if (discovered.length === 0) return;
  const handle = assertTaskHandle(task);
  const queue = [...discovered], records = new Map();
  while (queue.length) {
    const item = queue.shift();
    if (!canonicalRef(item.ref) || !/^[a-f0-9]{64}$/.test(item.expected ?? "")) throw new Error(`MATERIAL_INCOMPLETE: invalid canonical evidence reference ${item.ref}`);
    const first = handle.readRecord(item.ref), firstHash = sha256(Buffer.from(first));
    if (firstHash !== item.expected) throw new Error(`MATERIAL_INCOMPLETE: canonical evidence hash mismatch ${item.ref}`);
    const second = handle.readRecord(item.ref);
    if (second !== first || sha256(Buffer.from(second)) !== firstHash) throw new Error(`MATERIAL_INCOMPLETE: canonical evidence changed while freezing ${item.ref}`);
    const existing = records.get(item.ref);
    if (existing) { existing.relations.push({ from: item.from, relation: item.relation }); continue; }
    const bundlePath = `canonical/${item.ref}`;
    write(bundleRoot, bundlePath, Buffer.from(first));
    const record = { source_ref: item.ref, bundle_path: bundlePath, bytes: Buffer.byteLength(first), sha256: firstHash, relations: [{ from: item.from, relation: item.relation }] };
    records.set(item.ref, record);
    try { const parsed = JSON.parse(first); const nested = []; scanInto(parsed, item.ref, nested); queue.push(...nested); } catch {}
  }
  const evidenceManifest = [...records.values()].sort((a, b) => a.source_ref.localeCompare(b.source_ref));
  write(bundleRoot, "canonical-evidence.json", Buffer.from(`${JSON.stringify(evidenceManifest, null, 2)}\n`));

  function scanInto(value, from, output, relation = "record") {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach((item, index) => scanInto(item, from, output, `${relation}[${index}]`)); return; }
    for (const [key, child] of Object.entries(value)) {
      if (key === "ref" && canonicalRef(child) && typeof value.sha256 === "string") output.push({ ref: child, expected: normalizeHash(value.sha256), relation, from });
      else if (key.endsWith("_ref") && canonicalRef(child)) { const hashKey = `${key.slice(0, -4)}_hash`; if (typeof value[hashKey] === "string") output.push({ ref: child, expected: normalizeHash(value[hashKey]), relation: `${relation}.${key}`, from }); }
      scanInto(child, from, output, `${relation}.${key}`);
    }
  }
}
