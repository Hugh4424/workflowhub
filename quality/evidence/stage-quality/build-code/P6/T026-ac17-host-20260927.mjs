// Host preparation and read-only Docker audit only. Never starts Docker/Codex
// or invokes a mutating Git command against the CARD04 worktree.
// P6/T026 only. It never executes a container or mutates the CARD04 worktree.
//   node T026-ac17-host-20260927.mjs prepare <T026-red-run-meta.json>
//   node T026-ac17-host-20260927.mjs test <prepared.json> before|after
//   node T026-ac17-host-20260927.mjs fault <prepared.json> <green-test-meta.json>
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { deflateSync } from "node:zlib";
import http from "node:http";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync,
  readdirSync, realpathSync, rmSync, rmdirSync, statSync, symlinkSync, writeFileSync, chmodSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const ROOT = "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919";
const TASK = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919";
const BRANCH = "task/workflowhub/workflowhub-thin-core-card-04-20260919";
const HEAD = "ef920f1fbd415fe87d50930359059b661e141acd";
const TEST = "tests/contract/acceptance-execution-tier.test.mjs";
const HELPER = "tests/helpers/stage-outcome.mjs";
const PHASE = "specs/workflowhub-thin-core-card-04-20260919/phases/P6.md";
const P11_PHASE = "specs/workflowhub-thin-core-card-04-20260919/phases/P11.md";
const SOURCE = "runtime/stage/stage-handlers.mjs";
const FILTER = "does not start a browser on invalid-";
const FROZEN_DIR = join(TASK, "quality/evidence/stage-quality/build-code/P6/T026-bad-receipt-browser-preflight-red-20260927");
const SNAPSHOT_DIR = join(TASK, "quality/evidence/stage-quality/build-code/P11/T022-actual-producer-red-v2-final-20260927");
const SOURCE_ARCHIVE = join(SNAPSHOT_DIR, "host-only-source-before-v2");
const EVIDENCE = join(TASK, "quality/evidence/stage-quality/build-code/P6");
const DEPS_ROOT = "/Users/Hugh/Hugh/Project/workflowhub/node_modules";
const IMAGE = "sha256:38c8b386e738307326e9371c83d0948f3574613b34d67d75c1a50ddd3e923b54";
const PROXY_SHA = "357da154a4f55a210073d54e091ed7a27c737341ab7e52d0919eb3bd3185c627";
const INNER = "card04-ac17-inner";
const GATEWAY = "card04-ac17-gateway-v4";
const SENTINEL = join(ROOT, "quality/evidence/stage-quality/build-code/P6/T026-ac17-sentinel-20260927.mjs");
const SENTINEL_SHA = "6586160f7c95e7fc3e5cbffa222f8cb5a4cedcb47a7dec6edca40a26591710be";
const SENTINEL_BODY = Buffer.from("AC17_T026_FIXED_HOST_SENTINEL_20260927\n");
const SHA = /^[a-f0-9]{64}$/;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const real = (path) => realpathSync(path);
const inside = (root, path) => {
  const rel = relative(root, path);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
function fail(message) { throw new Error(`AC17 host preparation stopped: ${message}`); }
function gitRaw(...args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")));
  return execFileSync("git", args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
}
const git = (...args) => gitRaw(...args).toString("utf8").trim();
function sourceIdentity(meta) {
  if (meta.schema_version !== "card04-p6-t026-bad-receipt-browser-target-red-candidate.v1"
      || meta.candidate_only !== true) fail("T026 frozen candidate RED is required");
  if (real(process.cwd()) !== ROOT || real(ROOT) !== ROOT || git("rev-parse", "--show-toplevel") !== ROOT
      || git("branch", "--show-current") !== BRANCH || git("rev-parse", "HEAD") !== HEAD
      || meta.worktree !== ROOT || meta.branch !== BRANCH || meta.head !== HEAD
      || meta.task_id !== "workflowhub-thin-core-card-04-20260919") {
    fail("CARD04 source or frozen RED identity changed");
  }
  const task = json(join(TASK, "task.json"));
  if (task.project_name !== "workflowhub" || task.task_id !== meta.task_id
      || task.record_model !== "vnext-single-write" || task.activation_cohort !== "post"
      || real(meta.task_identity_ref) !== join(SNAPSHOT_DIR, "task-identity.json")
      || sha(readFileSync(meta.task_identity_ref)) !== meta.task_identity_sha256
      || json(meta.task_identity_ref).task_id !== meta.task_id) fail("Task identity differs");
  if (real(meta.source_snapshot_ref) !== join(SNAPSHOT_DIR, "pre-v2-source-manifest.json")
      || !SHA.test(meta.source_snapshot_sha256)
      || sha(readFileSync(meta.source_snapshot_ref)) !== meta.source_snapshot_sha256) {
    fail("T026 full pre-change source manifest is missing or changed");
  }
  const sourceManifest = json(meta.source_snapshot_ref);
  if (sourceManifest.schema_version !== "card04-p11-t022-v2-final-prechange-source.v1"
      || sourceManifest.snapshot_id !== meta.source_snapshot_id || sourceManifest.head !== HEAD
      || !Array.isArray(sourceManifest.records) || sourceManifest.records.length !== 1849) {
    fail("T026 full source manifest identity differs");
  }
  const archivedRows = fileRows(SOURCE_ARCHIVE);
  const records = sourceManifest.records;
  if (archivedRows.length !== records.length) fail("T026 archived source file count differs from manifest");
  const byPath = new Map(archivedRows.map((row) => [row.path, row]));
  for (const record of records) {
    const actual = byPath.get(record.path);
    if (record.kind !== "file" || !actual || actual.sha256 !== record.sha256
        || actual.size !== record.bytes) fail(`T026 archived source differs: ${record.path}`);
  }
  const named = new Map(records.map((row) => [row.path, row.sha256]));
  if (named.get(SOURCE) !== meta.source_sha256?.stage_handlers
      || named.get("runtime/stage/stage-runner.mjs") !== meta.source_sha256?.stage_runner
      || named.get(PHASE) !== meta.material_sha256?.P6
      || named.get(P11_PHASE) !== meta.material_sha256?.P11
      || named.get("specs/workflowhub-thin-core-card-04-20260919/spec.md") !== meta.material_sha256?.spec
      || named.get(TEST) !== meta.frozen_test_sha256 || !SHA.test(named.get(HELPER) ?? "")) {
    fail("T026 key source/material/test/helper hashes differ from freeze");
  }
  if (sha(readFileSync(join(ROOT, SOURCE))) !== meta.source_sha256.stage_handlers) {
    fail("current handler changed before isolated preparation");
  }
  const frozen = readFileSync(join(SOURCE_ARCHIVE, TEST));
  const helper = readFileSync(join(SOURCE_ARCHIVE, HELPER));
  if (real(meta.frozen_test_ref) !== join(FROZEN_DIR, "frozen-target.test.mjs")
      || sha(readFileSync(meta.frozen_test_ref)) !== meta.frozen_test_sha256
      || sha(frozen) !== meta.frozen_test_sha256 || sha(helper) !== named.get(HELPER)) {
    fail("T026 frozen test/helper bytes differ");
  }
  if (meta.command !== `npx vitest run ${TEST} -t '${FILTER}'` || meta.exit_code !== 1
      || !isAbsolute(meta.raw_output_ref) || !inside(real(TASK), real(meta.raw_output_ref))
      || !SHA.test(meta.raw_output_sha256) || sha(readFileSync(meta.raw_output_ref)) !== meta.raw_output_sha256) {
    fail("frozen RED command/output is missing or changed");
  }
  const raw = readFileSync(meta.raw_output_ref, "utf8");
  if (!/Tests\s+2 failed \| 60 skipped \(62\)/.test(raw)
      || !raw.includes("does not start a browser on invalid-implementation receipt")
      || !raw.includes("does not start a browser on invalid-tests receipt")
      || !raw.includes("to have a length of +0 but got 1")) {
    fail("frozen RED is not the two browser preflight assertions");
  }
  return { frozen, helper, sourceManifest, helperSha256: named.get(HELPER) };
}
function omit(rel, dir) {
  const parts = rel.split("/");
  const name = parts.at(-1);
  if (parts.some((part) => new Set([".git", ".codex", ".claude", ".agents", ".planning", ".vite", ".cache", "quality", "node_modules", "tests", "test", "__tests__", "fixtures", "coverage", "dist"]).has(part))
      || parts[0] === "specs" && parts[1] === "archive") return true;
  if (!dir && new Set([".mcp.json", ".DS_Store"]).has(name)) return true;
  if (!dir && (/(?:^|[.-])(?:test|spec)\.[cm]?[jt]sx?$/.test(name)
      || /(?:oracle|golden|snapshot)/i.test(name) && /\.(?:json|txt|md|snap)$/.test(name))) return true;
  return false;
}
function copySource(from, to, rel = "", rows = []) {
  for (const entry of readdirSync(join(from, rel), { withFileTypes: true })) {
    const path = rel ? `${rel}/${entry.name}` : entry.name;
    if (omit(path, entry.isDirectory())) continue;
    if (entry.isSymbolicLink()) fail(`symlink in source view: ${path}`);
    if (entry.isDirectory()) { mkdirSync(join(to, path), { recursive: true }); copySource(from, to, path, rows); continue; }
    if (!entry.isFile()) fail(`nonregular source: ${path}`);
    const source = join(from, path);
    const bytes = readFileSync(source);
    mkdirSync(dirname(join(to, path)), { recursive: true });
    writeFileSync(join(to, path), bytes, { flag: "wx", mode: statSync(source).mode & 0o777 });
    if (sha(readFileSync(join(to, path))) !== sha(bytes)) fail(`copied source bytes differ: ${path}`);
    rows.push({ path, sha256: sha(bytes), size: bytes.length });
  }
  return rows;
}
function fileRows(root, rel = "", rows = []) {
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    const path = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) fail(`unexpected symlink in container source: ${path}`);
    if (entry.isDirectory()) { fileRows(root, path, rows); continue; }
    if (!entry.isFile()) fail(`unexpected nonregular file in container source: ${path}`);
    const bytes = readFileSync(join(root, path));
    rows.push({ path, sha256: sha(bytes), size: bytes.length });
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}
function safePrepared(path) {
  const manifest = json(path);
  const base = real(manifest.base), src = real(manifest.source), oracle = real(manifest.oracle);
  if (!base.startsWith("/private/tmp/card04-ac17-t026-") || !inside(base, src) || !inside(base, oracle)
      || src !== join(base, "src") || oracle !== join(base, "oracle")
      || manifest.schema !== "card04-ac17-t026-host-prepared.v1") fail("prepared paths are not the isolated layout");
  if (existsSync(join(src, ".git")) || existsSync(join(src, "tests")) || existsSync(join(src, "quality"))
      || existsSync(join(src, "node_modules"))) fail("container source contains Git, tests, quality, or dependencies");
  return { manifest, base, src, oracle };
}
function prepare(metaPath) {
  const meta = json(metaPath);
  const { frozen, helper, helperSha256 } = sourceIdentity(meta);
  const beforeHandler = meta.source_sha256.stage_handlers;
  const base = real(mkdtempSync("/private/tmp/card04-ac17-t026-"));
  const src = join(base, "src"), oracle = join(base, "oracle"), out = join(base, "out");
  mkdirSync(src); mkdirSync(oracle); mkdirSync(out);
  const rows = copySource(SOURCE_ARCHIVE, src).sort((a, b) => a.path.localeCompare(b.path));
  if (rows.some((row) => readFileSync(join(src, row.path)).includes(frozen))) {
    fail("the frozen oracle appears inside the container source view; preserve this failed temp tree");
  }
  const oracleTest = join(oracle, TEST), oracleHelper = join(oracle, HELPER);
  mkdirSync(dirname(oracleTest), { recursive: true });
  mkdirSync(dirname(oracleHelper), { recursive: true });
  writeFileSync(oracleTest, frozen, { flag: "wx", mode: 0o444 });
  writeFileSync(oracleHelper, helper, { flag: "wx", mode: 0o444 });
  const gitBlob = Buffer.concat([Buffer.from(`blob ${frozen.length}\0`), frozen]);
  const oracleBlobOid = createHash("sha1").update(gitBlob).digest("hex");
  const privateGit = join(oracle, "private-git");
  const objectDir = join(privateGit, "objects", oracleBlobOid.slice(0, 2));
  mkdirSync(objectDir, { recursive: true });
  for (const dir of [join(privateGit, "refs", "heads"), join(privateGit, "objects", "info"),
    join(privateGit, "objects", "pack")]) mkdirSync(dir, { recursive: true });
  writeFileSync(join(privateGit, "config"), "[core]\n\trepositoryformatversion = 0\n\tbare = true\n", { flag: "wx", mode: 0o444 });
  writeFileSync(join(privateGit, "HEAD"), "ref: refs/heads/unused\n", { flag: "wx", mode: 0o444 });
  writeFileSync(join(objectDir, oracleBlobOid.slice(2)), deflateSync(gitBlob), { flag: "wx", mode: 0o444 });
  chmodSync(oracleTest, 0o444); chmodSync(oracleHelper, 0o444);
  chmodSync(join(privateGit, "HEAD"), 0o444);
  chmodSync(join(privateGit, "config"), 0o444);
  chmodSync(join(objectDir, oracleBlobOid.slice(2)), 0o444);
  for (const dir of [objectDir, join(privateGit, "objects", "info"), join(privateGit, "objects", "pack"),
    join(privateGit, "refs", "heads"), join(privateGit, "refs"), join(privateGit, "objects"), privateGit,
    dirname(oracleTest), dirname(oracleHelper), join(oracle, "tests"), oracle]) {
    chmodSync(dir, 0o555);
  }
  if (sha(readFileSync(join(src, SOURCE))) !== beforeHandler
      || sha(readFileSync(join(src, PHASE))) !== meta.material_sha256.P6
      || sha(readFileSync(join(src, P11_PHASE))) !== meta.material_sha256.P11
      || sha(readFileSync(meta.source_snapshot_ref)) !== meta.source_snapshot_sha256
      || git("rev-parse", "HEAD") !== HEAD) {
    fail("source changed during preparation; preserve this failed temp tree");
  }
  const inventoryRaw = `${JSON.stringify(rows, null, 2)}\n`;
  const inventoryPath = join(out, "source-before.json");
  writeFileSync(inventoryPath, inventoryRaw, { flag: "wx" });
  const manifest = { schema: "card04-ac17-t026-host-prepared.v1", task_id: meta.task_id,
    branch: BRANCH, head: HEAD, base, source: src, oracle, oracle_test: oracleTest,
    oracle_helper: oracleHelper, frozen_helper_sha256: helperSha256,
    oracle_private_git: privateGit, oracle_blob_oid: oracleBlobOid,
    frozen_meta: real(metaPath), frozen_test_sha256: meta.frozen_test_sha256,
    frozen_source_snapshot_id: meta.source_snapshot_id,
    frozen_source_manifest_ref: meta.source_snapshot_ref,
    frozen_source_manifest_sha256: meta.source_snapshot_sha256,
    task_identity_ref: meta.task_identity_ref,
    task_identity_sha256: meta.task_identity_sha256,
    p6_material_sha256: meta.material_sha256.P6,
    p11_material_sha256: meta.material_sha256.P11,
    spec_sha256: sha(readFileSync(join(src,
      "specs/workflowhub-thin-core-card-04-20260919/spec.md"))),
    source_inventory_ref: inventoryPath, source_inventory_sha256: sha(inventoryRaw),
    before_stage_handlers_sha256: beforeHandler, source_file_count: rows.length,
    auth: "not staged; mount a separate read-only file only at launch",
    docker: "not launched by this script" };
  const manifestPath = join(out, "prepared.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  const checked = safePrepared(manifestPath);
  if (JSON.stringify(fileRows(checked.src)) !== JSON.stringify(rows)) fail("source inventory bytes differ after copy");
  process.stdout.write(`${manifestPath}\n`);
}
function hostTest(path, phase) {
  if (!["before", "after"].includes(phase)) fail("host test phase must be before or after");
  const { manifest, base, src } = safePrepared(path);
  const meta = json(manifest.frozen_meta);
  const { frozen, helper } = sourceIdentity(meta);
  if (sha(frozen) !== manifest.frozen_test_sha256 || sha(readFileSync(manifest.oracle_test)) !== manifest.frozen_test_sha256
      || sha(helper) !== manifest.frozen_helper_sha256 || sha(readFileSync(manifest.oracle_helper)) !== manifest.frozen_helper_sha256
      || sha(readFileSync(join(src, PHASE))) !== manifest.p6_material_sha256
      || sha(readFileSync(join(src, P11_PHASE))) !== manifest.p11_material_sha256
      || sha(readFileSync(join(src, "specs/workflowhub-thin-core-card-04-20260919/spec.md"))) !== manifest.spec_sha256
      || sha(readFileSync(manifest.task_identity_ref)) !== manifest.task_identity_sha256
      || sha(readFileSync(manifest.source_inventory_ref)) !== manifest.source_inventory_sha256
      || sha(readFileSync(manifest.frozen_source_manifest_ref)) !== manifest.frozen_source_manifest_sha256) {
    fail("prepared material, oracle, or source inventory changed");
  }
  const beforeRows = json(manifest.source_inventory_ref), currentRows = fileRows(src);
  const before = new Map(beforeRows.map((row) => [row.path, row.sha256]));
  const changed = currentRows.filter((row) => before.get(row.path) !== row.sha256).map((row) => row.path);
  if (currentRows.length !== beforeRows.length || changed.some((row) => row !== SOURCE)
      || (phase === "before" && changed.length !== 0) || (phase === "after" && changed.length !== 1)) {
    fail(`source changes are outside the single authorized file: ${changed.join(",")}`);
  }
  const testPath = join(src, TEST), helperPath = join(src, HELPER), deps = join(src, "node_modules");
  if (existsSync(testPath) || existsSync(helperPath) || existsSync(deps)
      || existsSync(join(src, "tests"))) fail("host runner temporary test/dependency paths already exist");
  mkdirSync(dirname(testPath), { recursive: true });
  mkdirSync(dirname(helperPath), { recursive: true });
  let result;
  try {
    writeFileSync(testPath, frozen, { flag: "wx" });
    writeFileSync(helperPath, helper, { flag: "wx" });
    symlinkSync(DEPS_ROOT, deps, "dir");
    const home = join(base, "host-test-home"), temp = join(base, "host-test-tmp");
    mkdirSync(home, { recursive: true }); mkdirSync(temp, { recursive: true });
    result = spawnSync("npx",
      ["vitest", "run", TEST, "-t", FILTER], { cwd: src, encoding: "utf8", shell: false,
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: home, TMPDIR: temp,
          NODE_ENV: "test", CI: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
        timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  } finally {
    if (existsSync(testPath)) rmSync(testPath);
    if (existsSync(helperPath)) rmSync(helperPath);
    // Only these initially absent paths belong to the host runner. A test
    // that created anything else leaves a nonempty directory and fails here.
    if (existsSync(dirname(testPath))) rmdirSync(dirname(testPath));
    if (existsSync(dirname(helperPath))) rmdirSync(dirname(helperPath));
    if (existsSync(join(src, "tests"))) rmdirSync(join(src, "tests"));
    if (!lstatSync(deps).isSymbolicLink() || readlinkSync(deps) !== DEPS_ROOT) {
      fail("host dependency link was replaced");
    }
    rmSync(deps);
  }
  safePrepared(path);
  if (result.error) fail(`host runner failed: ${result.error.message}`);
  const afterHostRows = fileRows(src);
  if (JSON.stringify(afterHostRows) !== JSON.stringify(currentRows)) {
    fail("host test changed the source view or left a nested symlink; preserve the temp tree");
  }
  const raw = `${result.stdout}${result.stderr}`;
  const plain = raw.replace(/\u001b\[[0-9;]*m/g, "");
  const id = `${Date.now()}-${phase}`;
  mkdirSync(EVIDENCE, { recursive: true });
  const rawPath = join(EVIDENCE, `T026-host-${id}.raw.txt`);
  const stdoutPath = join(EVIDENCE, `T026-host-${id}.stdout.raw.txt`);
  const stderrPath = join(EVIDENCE, `T026-host-${id}.stderr.raw.txt`);
  const metaPath = join(EVIDENCE, `T026-host-${id}.meta.json`);
  writeFileSync(rawPath, raw, { flag: "wx" });
  writeFileSync(stdoutPath, result.stdout, { flag: "wx" });
  writeFileSync(stderrPath, result.stderr, { flag: "wx" });
  const targets = ["does not start a browser on invalid-implementation receipt",
    "does not start a browser on invalid-tests receipt"];
  const valid = phase === "before"
    ? result.status === 1 && /Tests\s+2 failed \| 60 skipped \(62\)/.test(plain)
      && targets.every((target) => plain.includes(target))
      && plain.includes("to have a length of +0 but got 1")
    : result.status === 0 && /Tests\s+2 passed \| 60 skipped \(62\)/.test(plain)
      && /Test Files\s+1 passed \(1\)/.test(plain);
  writeFileSync(metaPath, `${JSON.stringify({ phase, task_id: manifest.task_id, source: src,
    branch: manifest.branch, head: manifest.head, source_snapshot_id: manifest.frozen_source_snapshot_id,
    frozen_red_meta_ref: manifest.frozen_meta, frozen_red_meta_sha256: sha(readFileSync(manifest.frozen_meta)),
    frozen_source_manifest_ref: manifest.frozen_source_manifest_ref,
    frozen_source_manifest_sha256: manifest.frozen_source_manifest_sha256,
    task_identity_ref: manifest.task_identity_ref,
    task_identity_sha256: manifest.task_identity_sha256,
    source_inventory_sha256: sha(JSON.stringify(currentRows)),
    frozen_test_sha256: manifest.frozen_test_sha256, frozen_helper_sha256: manifest.frozen_helper_sha256,
    p6_material_sha256: manifest.p6_material_sha256,
    p11_material_sha256: manifest.p11_material_sha256,
    spec_sha256: manifest.spec_sha256,
    stage_handlers_sha256: sha(readFileSync(join(src, SOURCE))),
    changed, argv: ["npx", "vitest", "run", TEST, "-t", FILTER], exit_code: result.status,
    stdout_ref: stdoutPath, stdout_sha256: sha(result.stdout), stderr_ref: stderrPath, stderr_sha256: sha(result.stderr),
    raw_ref: rawPath, raw_sha256: sha(raw), target_oracle_met: valid,
    docker_started_by_this_script: false }, null, 2)}\n`, { flag: "wx" });
  if (!valid) fail(`host ${phase} test did not meet its behavior oracle; raw preserved at ${rawPath}`);
  process.stdout.write(`${metaPath}\n`);
}
function faultTest(path, greenMetaRef) {
  const { manifest, src } = safePrepared(path);
  const { frozen, helper } = sourceIdentity(json(manifest.frozen_meta));
  if (!isAbsolute(greenMetaRef) || !inside(real(EVIDENCE), real(greenMetaRef))) {
    fail("GREEN result must be a retained CARD04 T026 evidence file");
  }
  const green = json(greenMetaRef);
  if (green.phase !== "after" || green.exit_code !== 0 || green.target_oracle_met !== true
      || green.source !== src || green.task_id !== manifest.task_id
      || green.frozen_test_sha256 !== manifest.frozen_test_sha256
      || green.frozen_helper_sha256 !== manifest.frozen_helper_sha256
      || green.source_snapshot_id !== manifest.frozen_source_snapshot_id
      || green.frozen_red_meta_sha256 !== sha(readFileSync(manifest.frozen_meta))
      || green.frozen_source_manifest_sha256 !== manifest.frozen_source_manifest_sha256
      || green.stage_handlers_sha256 !== sha(readFileSync(join(src, SOURCE)))
      || !isAbsolute(green.raw_ref) || !inside(real(EVIDENCE), real(green.raw_ref))
      || green.raw_sha256 !== sha(readFileSync(green.raw_ref))) {
    fail("GREEN source/test/raw result cannot be rebound to this fault copy");
  }
  const sourceRows = fileRows(src), beforeRows = json(manifest.source_inventory_ref);
  const before = new Map(beforeRows.map((row) => [row.path, row.sha256]));
  const changed = sourceRows.filter((row) => before.get(row.path) !== row.sha256).map((row) => row.path);
  if (sourceRows.length !== beforeRows.length || JSON.stringify(changed) !== JSON.stringify([SOURCE])) {
    fail("GREEN source is not a one-file T026 implementation");
  }
  const faultRoot = real(mkdtempSync("/private/tmp/card04-ac17-t026-fault-"));
  const faultSrc = join(faultRoot, "src");
  mkdirSync(faultSrc);
  const cloned = copySource(src, faultSrc).sort((a, b) => a.path.localeCompare(b.path));
  if (JSON.stringify(cloned) !== JSON.stringify(sourceRows)) fail("fault copy differs from reviewed GREEN source");
  const oldHandler = readFileSync(join(SOURCE_ARCHIVE, SOURCE));
  if (sha(oldHandler) !== manifest.before_stage_handlers_sha256) fail("fault source is not the frozen old handler");
  writeFileSync(join(faultSrc, SOURCE), oldHandler);
  const testPath = join(faultSrc, TEST), helperPath = join(faultSrc, HELPER), deps = join(faultSrc, "node_modules");
  mkdirSync(dirname(testPath), { recursive: true }); mkdirSync(dirname(helperPath), { recursive: true });
  let result;
  try {
    writeFileSync(testPath, frozen, { flag: "wx" });
    writeFileSync(helperPath, helper, { flag: "wx" });
    symlinkSync(DEPS_ROOT, deps, "dir");
    const home = join(faultRoot, "home"), temp = join(faultRoot, "tmp");
    mkdirSync(home); mkdirSync(temp);
    result = spawnSync("npx", ["vitest", "run", TEST, "-t", FILTER], {
      cwd: faultSrc, encoding: "utf8", shell: false,
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: home, TMPDIR: temp,
        NODE_ENV: "test", CI: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
      timeout: 120000, maxBuffer: 8 * 1024 * 1024,
    });
  } finally {
    if (existsSync(testPath)) rmSync(testPath);
    if (existsSync(helperPath)) rmSync(helperPath);
    if (existsSync(dirname(testPath))) rmdirSync(dirname(testPath));
    if (existsSync(dirname(helperPath))) rmdirSync(dirname(helperPath));
    if (existsSync(join(faultSrc, "tests"))) rmdirSync(join(faultSrc, "tests"));
    if (!lstatSync(deps).isSymbolicLink() || readlinkSync(deps) !== DEPS_ROOT) fail("fault dependency link changed");
    rmSync(deps);
  }
  if (result.error) fail(`fault runner failed: ${result.error.message}`);
  const faultRows = fileRows(faultSrc);
  if (faultRows.length !== beforeRows.length
      || faultRows.some((row) => row.sha256 !== before.get(row.path))) {
    fail("fault copy contains more than the frozen old handler mutation");
  }
  const raw = `${result.stdout}${result.stderr}`;
  const plain = raw.replace(/\u001b\[[0-9;]*m/g, "");
  const valid = result.status === 1 && /Tests\s+2 failed \| 60 skipped \(62\)/.test(plain)
    && plain.includes("does not start a browser on invalid-implementation receipt")
    && plain.includes("does not start a browser on invalid-tests receipt")
    && plain.includes("to have a length of +0 but got 1");
  const id = `${Date.now()}-fault`;
  const rawRef = join(EVIDENCE, `T026-host-${id}.raw.txt`);
  const stdoutRef = join(EVIDENCE, `T026-host-${id}.stdout.raw.txt`);
  const stderrRef = join(EVIDENCE, `T026-host-${id}.stderr.raw.txt`);
  const metaRef = join(EVIDENCE, `T026-host-${id}.meta.json`);
  writeFileSync(rawRef, raw, { flag: "wx" });
  writeFileSync(stdoutRef, result.stdout, { flag: "wx" });
  writeFileSync(stderrRef, result.stderr, { flag: "wx" });
  writeFileSync(metaRef, `${JSON.stringify({ phase: "fault", task_id: manifest.task_id,
    source_snapshot_id: manifest.frozen_source_snapshot_id, source: faultSrc, green_source: src,
    frozen_red_meta_ref: manifest.frozen_meta, frozen_red_meta_sha256: sha(readFileSync(manifest.frozen_meta)),
    frozen_source_manifest_ref: manifest.frozen_source_manifest_ref,
    frozen_source_manifest_sha256: manifest.frozen_source_manifest_sha256,
    green_meta_ref: real(greenMetaRef), green_meta_sha256: sha(readFileSync(greenMetaRef)),
    frozen_test_sha256: manifest.frozen_test_sha256, frozen_helper_sha256: manifest.frozen_helper_sha256,
    injected_handler_sha256: sha(oldHandler), source_inventory_sha256: sha(JSON.stringify(faultRows)),
    argv: ["npx", "vitest", "run", TEST, "-t", FILTER], exit_code: result.status,
    raw_ref: rawRef, raw_sha256: sha(raw), stdout_ref: stdoutRef, stdout_sha256: sha(result.stdout),
    stderr_ref: stderrRef, stderr_sha256: sha(result.stderr), target_oracle_met: valid,
    fault_copy_retained: faultRoot }, null, 2)}\n`, { flag: "wx" });
  if (!valid) fail(`fault copy did not reproduce browser preflight failure; raw preserved at ${rawRef}`);
  process.stdout.write(`${metaRef}\n`);
}
function dockerObject(kind, name) {
  const raw = execFileSync("docker", ["inspect", "--type", kind, name],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const values = JSON.parse(raw);
  if (!Array.isArray(values) || values.length !== 1) fail(`Docker ${kind} identity is ambiguous`);
  return values[0];
}
async function sentinelCheck(path, name, phase) {
  if (!/^card04-ac17-t026-[a-z0-9-]+$/.test(name ?? "")
      || !["before", "after"].includes(phase)) fail("sentinel requires a T026 container and before|after phase");
  const { manifest, src } = safePrepared(path);
  sourceIdentity(json(manifest.frozen_meta));
  const candidate = dockerObject("container", name);
  if (phase === "before" && candidate.State?.Status !== "created"
      || phase === "after" && candidate.State?.Status !== "exited") {
    fail("sentinel and Docker lifecycle phase differ");
  }
  if (sha(readFileSync(SENTINEL)) !== SENTINEL_SHA) fail("host sentinel source changed");
  const pids = execFileSync("lsof", ["-t", "-iTCP:48173", "-sTCP:LISTEN"], { encoding: "utf8" }).trim().split(/\s+/);
  if (pids.length !== 1 || !/^\d+$/.test(pids[0])) fail("host sentinel listener is missing or ambiguous");
  const command = execFileSync("ps", ["-p", pids[0], "-o", "command="], { encoding: "utf8" }).trim();
  if (command !== `node ${SENTINEL}`) fail("port 48173 is served by another process");
  const response = await new Promise((resolve, reject) => {
    const request = http.get("http://127.0.0.1:48173/", { timeout: 5000 }, (stream) => {
      const chunks = [];
      stream.on("data", (chunk) => {
        chunks.push(chunk);
        if (Buffer.concat(chunks).length > 1024) request.destroy(new Error("sentinel response too large"));
      });
      stream.on("end", () => resolve({ status: stream.statusCode, body: Buffer.concat(chunks) }));
      stream.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("sentinel timeout")));
    request.on("error", reject);
  });
  const rows = fileRows(src), beforeRows = json(manifest.source_inventory_ref);
  const before = new Map(beforeRows.map((row) => [row.path, row.sha256]));
  const changed = rows.filter((row) => before.get(row.path) !== row.sha256).map((row) => row.path);
  const beforeSentinel = phase === "after"
    ? json(join(EVIDENCE, `T026-sentinel-${candidate.Id.slice(0, 12)}-before.json`)) : null;
  const valid = response.status === 200 && response.body.equals(SENTINEL_BODY)
    && rows.length === beforeRows.length && changed.every((item) => item === SOURCE)
    && (phase !== "before" || changed.length === 0)
    && (phase !== "after" || beforeSentinel.container_id === candidate.Id
      && beforeSentinel.server_pid === Number(pids[0]));
  const id = `${candidate.Id.slice(0, 12)}-${phase}`;
  const rawRef = join(EVIDENCE, `T026-sentinel-${id}.raw.txt`);
  const metaRef = join(EVIDENCE, `T026-sentinel-${id}.json`);
  mkdirSync(EVIDENCE, { recursive: true });
  writeFileSync(rawRef, response.body, { flag: "wx", mode: 0o600 });
  writeFileSync(metaRef, `${JSON.stringify({ schema: "card04-ac17-t026-sentinel.v1", phase,
    recorded_at_utc: new Date().toISOString(),
    container_id: candidate.Id, container_status: candidate.State.Status,
    task_id: manifest.task_id, source_snapshot_id: manifest.frozen_source_snapshot_id,
    source_inventory_sha256: sha(JSON.stringify(rows)), changed,
    frozen_test_sha256: manifest.frozen_test_sha256,
    frozen_helper_sha256: manifest.frozen_helper_sha256,
    task_identity_sha256: manifest.task_identity_sha256,
    p6_material_sha256: manifest.p6_material_sha256,
    p11_material_sha256: manifest.p11_material_sha256, spec_sha256: manifest.spec_sha256,
    server_script_ref: SENTINEL, server_script_sha256: SENTINEL_SHA,
    server_pid: Number(pids[0]), server_argv: command,
    request_argv: ["GET", "http://127.0.0.1:48173/"], status_code: response.status,
    raw_ref: rawRef, raw_sha256: sha(response.body), oracle_met: valid }, null, 2)}\n`,
    { flag: "wx", mode: 0o600 });
  if (!valid) fail(`host sentinel ${phase} failed; raw preserved at ${rawRef}`);
  process.stdout.write(`${metaRef}\n`);
}
function checkedSentinel(candidate, manifest, phase) {
  const ref = join(EVIDENCE, `T026-sentinel-${candidate.Id.slice(0, 12)}-${phase}.json`);
  const record = json(ref);
  if (record.schema !== "card04-ac17-t026-sentinel.v1" || record.phase !== phase
      || record.container_id !== candidate.Id || record.oracle_met !== true
      || record.status_code !== 200 || record.server_script_sha256 !== SENTINEL_SHA
      || record.task_id !== manifest.task_id
      || record.source_snapshot_id !== manifest.frozen_source_snapshot_id
      || record.frozen_test_sha256 !== manifest.frozen_test_sha256
      || record.task_identity_sha256 !== manifest.task_identity_sha256
      || record.p6_material_sha256 !== manifest.p6_material_sha256
      || record.p11_material_sha256 !== manifest.p11_material_sha256
      || record.raw_sha256 !== sha(readFileSync(record.raw_ref))
      || record.raw_sha256 !== sha(SENTINEL_BODY)) fail("same-run host sentinel positive control differs");
  if (phase === "before" && Date.parse(record.recorded_at_utc) > Date.parse(candidate.State.StartedAt)
      && candidate.State.Status !== "created") fail("host sentinel before control was recorded after start");
  if (phase === "after" && Date.parse(record.recorded_at_utc) < Date.parse(candidate.State.FinishedAt)) {
    fail("host sentinel after control was recorded before container exit");
  }
  return { ref, sha256: sha(readFileSync(ref)) };
}
function secretCandidates(authBytes) {
  const values = [authBytes];
  try {
    const walk = (value) => {
      if (typeof value === "string" && value.length >= 24) values.push(Buffer.from(value));
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(JSON.parse(authBytes));
  } catch { /* The full credential bytes are still checked. */ }
  return values.filter((value) => value.length >= 24);
}
function auditDocker(path, name, mode, phase) {
  if (!/^card04-ac17-t026-[a-z0-9-]+$/.test(name ?? "")
      || !["ro", "hidden"].includes(mode) || !["before", "after"].includes(phase)) {
    fail("audit requires a named AC17 container, ro|hidden mode, and before|after phase");
  }
  const { manifest, base, src, oracle } = safePrepared(path);
  const { frozen, helper } = sourceIdentity(json(manifest.frozen_meta));
  const image = dockerObject("image", IMAGE);
  const candidate = dockerObject("container", name);
  const sentinelBefore = checkedSentinel(candidate, manifest, "before");
  const sentinelAfter = phase === "after" ? checkedSentinel(candidate, manifest, "after") : null;
  if (sentinelAfter && json(sentinelBefore.ref).server_pid !== json(sentinelAfter.ref).server_pid) {
    fail("host sentinel process changed during the container run");
  }
  const gateway = dockerObject("container", GATEWAY);
  const network = dockerObject("network", INNER);
  if (image.Id !== IMAGE || candidate.Image !== IMAGE || candidate.Config?.Image !== IMAGE
      || gateway.Image !== IMAGE || network.Internal !== true || network.Driver !== "bridge"
      || candidate.HostConfig?.NetworkMode !== INNER || candidate.HostConfig?.AutoRemove !== false
      || candidate.HostConfig?.ReadonlyRootfs !== true
      || candidate.HostConfig?.Privileged !== false
      || !(candidate.HostConfig?.CapDrop ?? []).includes("ALL")
      || (candidate.HostConfig?.CapAdd ?? []).length !== 0
      || (candidate.HostConfig?.Devices ?? []).length !== 0
      || (candidate.HostConfig?.DeviceRequests ?? []).length !== 0
      || !(candidate.HostConfig?.SecurityOpt ?? []).includes("no-new-privileges")
      || !candidate.HostConfig?.Tmpfs?.["/tmp"] || !candidate.HostConfig?.Tmpfs?.["/home/node"]
      || candidate.Config?.User !== "node") fail("AC17 container image, internal network, or isolation options differ");
  if (JSON.stringify(Object.keys(candidate.NetworkSettings?.Networks ?? {}).sort())
      !== JSON.stringify([INNER])) fail("Codex container is attached to another network");
  const expectedCommand = ["codex", "--no-daemon", "-C", "/workspace", "-s", "danger-full-access",
    "-a", "never", "exec", "--ephemeral", "--skip-git-repo-check", "--ignore-user-config", "-"];
  if (JSON.stringify(candidate.Config.Cmd) !== JSON.stringify(expectedCommand)) fail("Codex container argv differs");
  const vars = new Map((candidate.Config.Env ?? []).map((row) => {
    const split = row.indexOf("="); return [row.slice(0, split), row.slice(split + 1)];
  }));
  for (const [key, value] of Object.entries({ CODEX_HOME: "/tmp", HOME: "/home/node",
    HTTPS_PROXY: `http://${GATEWAY}:8080`, HTTP_PROXY: `http://${GATEWAY}:8080`,
    ALL_PROXY: `http://${GATEWAY}:8080`, NO_PROXY: "" })) {
    if (vars.get(key) !== value) fail(`Codex container ${key} differs`);
  }
  if ([...vars.keys()].some((key) => key.startsWith("GIT_") || key === "WORKFLOWHUB_TASK_DIR")) {
    fail("Codex container inherited Task or Git environment");
  }
  const mounts = new Map((candidate.Mounts ?? []).map((mount) => [mount.Destination, mount]));
  const handlerMount = `/workspace/${SOURCE}`;
  const expectedMounts = mode === "ro"
    ? ["/workspace", handlerMount, "/oracle", "/tmp/auth.json"]
    : ["/workspace", handlerMount, "/tmp/auth.json"];
  if (mounts.size !== expectedMounts.length || expectedMounts.some((target) => !mounts.has(target))
      || real(mounts.get("/workspace")?.Source) !== src || mounts.get("/workspace")?.RW !== false
      || mounts.get("/workspace")?.Type !== "bind"
      || real(mounts.get(handlerMount)?.Source) !== join(src, SOURCE)
      || mounts.get(handlerMount)?.RW !== true || mounts.get(handlerMount)?.Type !== "bind"
      || mode === "ro" && (real(mounts.get("/oracle")?.Source) !== oracle
        || mounts.get("/oracle")?.RW !== false || mounts.get("/oracle")?.Type !== "bind")) {
    fail("Codex mounts differ from the isolated source/oracle plan");
  }
  const authMount = mounts.get("/tmp/auth.json");
  const authPath = real(authMount?.Source);
  if (authMount?.Type !== "bind" || authMount.RW !== false || !statSync(authPath).isFile()
      || inside(base, authPath) || authPath === ROOT || inside(ROOT, authPath)
      || authPath === TASK || inside(TASK, authPath)) fail("authentication mount is inside a source/output/Task path");
  const authBytes = readFileSync(authPath);
  const secrets = secretCandidates(authBytes);
  const sourceRows = fileRows(src);
  if (sourceRows.some((row) => omit(row.path, false))) fail("container source contains a forbidden file");
  const beforeRows = json(manifest.source_inventory_ref);
  const before = new Map(beforeRows.map((row) => [row.path, row.sha256]));
  const changed = sourceRows.filter((row) => before.get(row.path) !== row.sha256).map((row) => row.path);
  if (sourceRows.length !== beforeRows.length || changed.some((row) => row !== SOURCE)
      || phase === "before" && changed.length !== 0) fail("container source changed outside the single T026 file");
  for (const row of sourceRows) {
    const bytes = readFileSync(join(src, row.path));
    if (bytes.includes(frozen) || bytes.includes(helper) || secrets.some((secret) => bytes.includes(secret))) {
      fail("test or authentication bytes appear in the container source");
    }
  }
  for (const row of fileRows(join(base, "out"))) {
    if (secrets.some((secret) => readFileSync(join(base, "out", row.path)).includes(secret))) {
      fail("authentication bytes appear in preparation output");
    }
  }
  const promptRef = join(base, "out", `${name}.prompt.txt`);
  if (real(promptRef) !== promptRef || !lstatSync(promptRef).isFile()
      || (statSync(promptRef).mode & 0o777) !== 0o600) {
    fail("implementation prompt is missing, linked, or not mode 0600");
  }
  const promptBytes = readFileSync(promptRef);
  if (promptBytes.includes(frozen) || promptBytes.includes(helper)
      || secrets.some((secret) => promptBytes.includes(secret))) {
    fail("oracle or authentication bytes appear in the implementation prompt");
  }
  if (phase === "before" && candidate.State?.Status !== "created"
      || phase === "after" && candidate.State?.Status !== "exited") fail("Docker lifecycle state differs");
  const networks = Object.keys(gateway.NetworkSettings?.Networks ?? {}).sort();
  const proxyMount = (gateway.Mounts ?? []).find((mount) => mount.Destination === "/proxy.mjs");
  if (gateway.State?.Status !== "running" || JSON.stringify(networks) !== JSON.stringify(["bridge", INNER].sort())
      || gateway.Config?.Cmd?.join(" ") !== "node /proxy.mjs"
      || proxyMount?.RW !== false || sha(readFileSync(proxyMount.Source)) !== PROXY_SHA) {
    fail("gateway v4 identity, argv, source, or dual network differs");
  }
  let logs = null;
  let attached = null;
  if (phase === "after") {
    attached = {};
    for (const channel of ["stdout", "stderr"]) {
      const ref = join(base, "out", `${name}.${channel}.raw`);
      if (real(ref) !== ref || !lstatSync(ref).isFile()
          || (statSync(ref).mode & 0o777) !== 0o600) {
        fail("attached Codex output is missing, linked, or not mode 0600");
      }
      const bytes = readFileSync(ref);
      if (secrets.some((secret) => bytes.includes(secret))) {
        fail("authentication bytes appear in attached output; do not display or publish it");
      }
      attached[channel] = { ref, sha256: sha(bytes), bytes: bytes.length };
    }
    const exitRef = join(base, "out", `${name}.docker-start.exit`);
    if (real(exitRef) !== exitRef || !lstatSync(exitRef).isFile()
        || (statSync(exitRef).mode & 0o777) !== 0o600
        || !/^\d+\n$/.test(readFileSync(exitRef, "utf8"))
        || Number(readFileSync(exitRef, "utf8").trim()) !== candidate.State?.ExitCode) {
      fail("attached Docker exit record differs from container inspect");
    }
    const captured = spawnSync("docker", ["logs", "--timestamps", name],
      { encoding: null, maxBuffer: 16 * 1024 * 1024 });
    if (captured.error || captured.status !== 0) fail("Docker logs could not be read before removal");
    logs = { stdout: captured.stdout, stderr: captured.stderr };
    if (Object.values(logs).some((stream) => secrets.some((secret) => stream.includes(secret)))) {
      fail("authentication bytes appear in Docker output; do not publish raw logs");
    }
  }
  mkdirSync(EVIDENCE, { recursive: true });
  const id = `${candidate.Id.slice(0, 12)}-${mode}-${phase}`;
  const attestationPath = join(EVIDENCE, `T026-docker-audit-${id}.json`);
  const attestation = { schema: "card04-ac17-t026-docker-audit.v1", phase, mode,
    container_id: candidate.Id, image_id: candidate.Image, state: candidate.State?.Status,
    exit_code: phase === "after" ? candidate.State?.ExitCode : null,
    network_id: network.Id, network_internal: network.Internal,
    gateway_id: gateway.Id, gateway_image: gateway.Image,
    gateway_argv: gateway.Config.Cmd, gateway_script_sha256: PROXY_SHA,
    source_inventory_sha256: sha(JSON.stringify(sourceRows)), changed,
    test_sha256: manifest.frozen_test_sha256, helper_sha256: manifest.frozen_helper_sha256,
    source_snapshot_id: manifest.frozen_source_snapshot_id,
    source_manifest_sha256: manifest.frozen_source_manifest_sha256,
    task_identity_sha256: manifest.task_identity_sha256,
    p6_material_sha256: manifest.p6_material_sha256,
    p11_material_sha256: manifest.p11_material_sha256,
    spec_sha256: manifest.spec_sha256,
    auth_mount_readonly: true,
    auth_scope: "complete existing Codex auth.json; not minimized",
    host_sentinel_before: sentinelBefore,
    host_sentinel_after: sentinelAfter,
    auth_outside_source_and_output: true, auth_value_absent_from_source_and_logs: true,
    prompt_ref: promptRef, prompt_sha256: sha(promptBytes),
    command: candidate.Config.Cmd, mounts: expectedMounts.map((target) => ({ target,
      readonly: target !== handlerMount })), attached_output: attached, logs: logs === null ? null : {} };
  if (logs) {
    for (const [channel, bytes] of Object.entries(logs)) {
      const ref = join(EVIDENCE, `T026-docker-${id}.${channel}.raw.txt`);
      writeFileSync(ref, bytes, { flag: "wx" });
      attestation.logs[channel] = { ref, sha256: sha(bytes), bytes: bytes.length };
    }
  }
  const attestationBytes = `${JSON.stringify(attestation, null, 2)}\n`;
  if (existsSync(attestationPath)) {
    if (readFileSync(attestationPath, "utf8") !== attestationBytes) {
      fail("a prior Docker audit exists with different bytes");
    }
  } else {
    writeFileSync(attestationPath, attestationBytes, { flag: "wx" });
  }
  process.stdout.write(`${attestationPath}\n`);
}
const [action, one, two, three, four] = process.argv.slice(2);
if (action === "prepare" && one && !two) prepare(one);
else if (action === "test" && one && two) hostTest(one, two);
else if (action === "fault" && one && two && !three) faultTest(one, two);
else if (action === "sentinel" && one && two && three && !four) await sentinelCheck(one, two, three);
else if (action === "audit" && one && two && three && four) auditDocker(one, two, three, four);
else fail("expected prepare <T026-red-meta>, test <prepared> before|after, fault <prepared> <GREEN-meta>, sentinel <prepared> <container> before|after, or audit <prepared> <container> ro|hidden before|after");
