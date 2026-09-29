// Host preparation and read-only Docker audit only. Never starts Docker/Codex
// or invokes a mutating Git command against the CARD04 worktree.
// Usage after the P5 owner freezes a new RED:
//   node T025-ac17-host-prep-20260927.mjs prepare <frozen-meta.json>
//   node T025-ac17-host-prep-20260927.mjs test <prepared-manifest.json> before|after
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { deflateSync } from "node:zlib";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync,
  readdirSync, realpathSync, rmSync, rmdirSync, statSync, symlinkSync, writeFileSync, chmodSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const ROOT = "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919";
const TASK = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919";
const BRANCH = "task/workflowhub/workflowhub-thin-core-card-04-20260919";
const HEAD = "ef920f1fbd415fe87d50930359059b661e141acd";
const TEST = "tests/contract/p5-same-run-report-source.test.mjs";
const PHASE = "specs/workflowhub-thin-core-card-04-20260919/phases/P5.md";
const EVIDENCE = join(TASK, "quality/evidence/stage-quality/build-code/P6");
const DEPS_ROOT = "/Users/Hugh/Hugh/Project/workflowhub/node_modules";
const IMAGE = "sha256:38c8b386e738307326e9371c83d0948f3574613b34d67d75c1a50ddd3e923b54";
const PROXY_SHA = "357da154a4f55a210073d54e091ed7a27c737341ab7e52d0919eb3bd3185c627";
const INNER = "card04-ac17-inner";
const GATEWAY = "card04-ac17-gateway-v4";
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
  if (meta.schema_version !== "card04-p5-t008-target-red.v3") fail("P5 owner v3 freeze is required");
  if (real(process.cwd()) !== ROOT || real(ROOT) !== ROOT || git("rev-parse", "--show-toplevel") !== ROOT
      || git("branch", "--show-current") !== BRANCH || git("rev-parse", "HEAD") !== HEAD
      || git("rev-parse", "HEAD^{tree}") !== meta.head_tree
      || meta.worktree !== ROOT || meta.branch !== BRANCH || meta.head !== HEAD
      || meta.task_id !== "workflowhub-thin-core-card-04-20260919"
      || meta.phase_id !== "P5" || meta.task_step_id !== "T008") fail("CARD04 source or frozen RED identity changed");
  const task = json(join(TASK, "task.json"));
  if (task.project_name !== "workflowhub" || task.task_id !== meta.task_id
      || task.record_model !== "vnext-single-write" || task.activation_cohort !== "post") fail("Task identity differs");
  const p5Hash = meta.source_files_sha256_after_red?.[PHASE];
  if (!SHA.test(p5Hash ?? "") || sha(readFileSync(join(ROOT, PHASE))) !== p5Hash) {
    fail("P5 material differs from frozen RED");
  }
  for (const path of ["runtime/stage/stage-runner.mjs", "runtime/stage/stage-end-report.mjs",
    PHASE, "specs/workflowhub-thin-core-card-04-20260919/spec.md", TEST]) {
    const expected = meta.source_files_sha256_after_red?.[path];
    if (!SHA.test(expected ?? "") || sha(readFileSync(join(ROOT, path))) !== expected) {
      fail(`source differs from P5 frozen RED: ${path}`);
    }
  }
  if (!isAbsolute(meta.worktree_status_ref) || !inside(real(TASK), real(meta.worktree_status_ref))
      || !SHA.test(meta.worktree_status_sha256)
      || sha(readFileSync(meta.worktree_status_ref)) !== meta.worktree_status_sha256
      || !gitRaw("status", "--short").equals(readFileSync(meta.worktree_status_ref))) {
    fail("frozen RED worktree status record is unavailable");
  }
  if (!SHA.test(meta.test_sha256) || !isAbsolute(meta.test_ref)
      || !inside(real(TASK), real(meta.test_ref)) || !real(meta.test_ref).includes("/quality/evidence/")) {
    fail("frozen test ref is outside the CARD04 Task evidence directory");
  }
  const frozen = readFileSync(meta.test_ref), current = readFileSync(join(ROOT, TEST));
  if (sha(frozen) !== meta.test_sha256 || sha(current) !== meta.test_sha256 || !frozen.equals(current)) {
    fail("worktree test bytes differ from the owner-frozen test");
  }
  if (meta.command !== `npx vitest run ${TEST}` || meta.exit_code !== 1
      || !isAbsolute(meta.raw_output_ref) || !inside(real(TASK), real(meta.raw_output_ref))
      || !SHA.test(meta.raw_output_sha256) || sha(readFileSync(meta.raw_output_ref)) !== meta.raw_output_sha256) {
    fail("frozen RED command/output is missing or changed");
  }
  const raw = readFileSync(meta.raw_output_ref, "utf8");
  if (!raw.includes("Tests  1 failed | 2 passed (3)")
      || !raw.includes("P5 same-run report source > publishes same-run content hashes")
      || !raw.includes("ENOENT")) fail("frozen RED is not the expected target behavior failure");
  return frozen;
}
function omit(rel, dir) {
  const parts = rel.split("/");
  const name = parts.at(-1);
  if (parts.some((part) => new Set([".git", ".codex", ".claude", ".agents", ".vite", ".cache", "quality", "node_modules", "tests", "test", "__tests__", "fixtures", "coverage", "dist"]).has(part))
      || parts[0] === "specs" && parts[1] === "archive") return true;
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
  if (!base.startsWith("/private/tmp/card04-ac17-p5-") || !inside(base, src) || !inside(base, oracle)
      || src !== join(base, "src") || oracle !== join(base, "oracle")
      || manifest.schema !== "card04-ac17-p5-host-prepared.v1") fail("prepared paths are not the isolated layout");
  if (existsSync(join(src, ".git")) || existsSync(join(src, "tests")) || existsSync(join(src, "quality"))
      || existsSync(join(src, "node_modules"))) fail("container source contains Git, tests, quality, or dependencies");
  return { manifest, base, src, oracle };
}
function prepare(metaPath) {
  const meta = json(metaPath);
  const frozen = sourceIdentity(meta);
  const beforeStageRunner = sha(readFileSync(join(ROOT, "runtime/stage/stage-runner.mjs")));
  const base = real(mkdtempSync("/private/tmp/card04-ac17-p5-"));
  const src = join(base, "src"), oracle = join(base, "oracle"), out = join(base, "out");
  mkdirSync(src); mkdirSync(oracle); mkdirSync(out);
  const rows = copySource(ROOT, src).sort((a, b) => a.path.localeCompare(b.path));
  if (rows.some((row) => readFileSync(join(src, row.path)).includes(frozen))) {
    fail("the frozen oracle appears inside the container source view; preserve this failed temp tree");
  }
  const oracleTest = join(oracle, basename(TEST));
  writeFileSync(oracleTest, frozen, { flag: "wx", mode: 0o444 });
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
  chmodSync(oracleTest, 0o444); chmodSync(join(privateGit, "HEAD"), 0o444);
  chmodSync(join(privateGit, "config"), 0o444);
  chmodSync(join(objectDir, oracleBlobOid.slice(2)), 0o444);
  for (const dir of [objectDir, join(privateGit, "objects", "info"), join(privateGit, "objects", "pack"),
    join(privateGit, "refs", "heads"), join(privateGit, "refs"), join(privateGit, "objects"), privateGit, oracle]) {
    chmodSync(dir, 0o555);
  }
  if (sha(readFileSync(join(src, "runtime/stage/stage-runner.mjs"))) !== beforeStageRunner
      || sha(readFileSync(join(src, PHASE))) !== meta.source_files_sha256_after_red[PHASE]
      || sha(readFileSync(join(ROOT, "runtime/stage/stage-runner.mjs"))) !== beforeStageRunner
      || git("rev-parse", "HEAD") !== HEAD
      || !gitRaw("status", "--short").equals(readFileSync(meta.worktree_status_ref))) {
    fail("source changed during preparation; preserve this failed temp tree");
  }
  const inventoryRaw = `${JSON.stringify(rows, null, 2)}\n`;
  const inventoryPath = join(out, "source-before.json");
  writeFileSync(inventoryPath, inventoryRaw, { flag: "wx" });
  const manifest = { schema: "card04-ac17-p5-host-prepared.v1", task_id: meta.task_id,
    branch: BRANCH, head: HEAD, base, source: src, oracle, oracle_test: oracleTest,
    oracle_private_git: privateGit, oracle_blob_oid: oracleBlobOid,
    frozen_meta: real(metaPath), frozen_test_sha256: meta.test_sha256,
    p5_material_sha256: meta.source_files_sha256_after_red[PHASE], spec_sha256: sha(readFileSync(join(src,
      "specs/workflowhub-thin-core-card-04-20260919/spec.md"))),
    source_inventory_ref: inventoryPath, source_inventory_sha256: sha(inventoryRaw),
    before_stage_runner_sha256: beforeStageRunner, source_file_count: rows.length,
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
  const frozen = sourceIdentity(meta);
  if (sha(frozen) !== manifest.frozen_test_sha256 || sha(readFileSync(manifest.oracle_test)) !== manifest.frozen_test_sha256
      || sha(readFileSync(join(src, PHASE))) !== manifest.p5_material_sha256
      || sha(readFileSync(join(src, "specs/workflowhub-thin-core-card-04-20260919/spec.md"))) !== manifest.spec_sha256
      || sha(readFileSync(manifest.source_inventory_ref)) !== manifest.source_inventory_sha256) {
    fail("prepared material, oracle, or source inventory changed");
  }
  const beforeRows = json(manifest.source_inventory_ref), currentRows = fileRows(src);
  const before = new Map(beforeRows.map((row) => [row.path, row.sha256]));
  const changed = currentRows.filter((row) => before.get(row.path) !== row.sha256).map((row) => row.path);
  if (currentRows.length !== beforeRows.length || changed.some((row) => row !== "runtime/stage/stage-runner.mjs")
      || (phase === "before" && changed.length !== 0) || (phase === "after" && changed.length !== 1)) {
    fail(`source changes are outside the single authorized file: ${changed.join(",")}`);
  }
  const testPath = join(src, TEST), deps = join(src, "node_modules");
  if (existsSync(testPath) || existsSync(deps)) fail("host runner temporary test/dependency paths already exist");
  mkdirSync(dirname(testPath), { recursive: true });
  let result;
  try {
    writeFileSync(testPath, frozen, { flag: "wx" });
    symlinkSync(DEPS_ROOT, deps, "dir");
    const home = join(base, "host-test-home"), temp = join(base, "host-test-tmp");
    mkdirSync(home, { recursive: true }); mkdirSync(temp, { recursive: true });
    result = spawnSync(join(DEPS_ROOT, ".bin/vitest"),
      ["run", TEST], { cwd: src, encoding: "utf8", shell: false,
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: home, TMPDIR: temp,
          NODE_ENV: "test", CI: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
        timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  } finally {
    if (existsSync(testPath)) rmSync(testPath);
    // Only these initially absent paths belong to the host runner. A test
    // that created anything else leaves a nonempty directory and fails here.
    if (existsSync(dirname(testPath))) rmdirSync(dirname(testPath));
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
  const rawPath = join(EVIDENCE, `T025-p5-host-${id}.raw.txt`);
  const metaPath = join(EVIDENCE, `T025-p5-host-${id}.meta.json`);
  writeFileSync(rawPath, raw, { flag: "wx" });
  const target = "P5 same-run report source > publishes same-run content hashes";
  const valid = phase === "before"
    ? result.status === 1 && /Tests\s+1 failed \| 2 passed \(3\)/.test(plain) && plain.includes(target) && plain.includes("ENOENT")
    : result.status === 0 && /Tests\s+3 passed \(3\)/.test(plain) && plain.includes(target);
  writeFileSync(metaPath, `${JSON.stringify({ phase, task_id: manifest.task_id, source: src,
    branch: manifest.branch, head: manifest.head, frozen_test_sha256: manifest.frozen_test_sha256,
    p5_material_sha256: manifest.p5_material_sha256, stage_runner_sha256: sha(readFileSync(join(src, "runtime/stage/stage-runner.mjs"))),
    changed, argv: ["vitest", "run", TEST], exit_code: result.status,
    raw_ref: rawPath, raw_sha256: sha(raw), target_oracle_met: valid,
    docker_started_by_this_script: false }, null, 2)}\n`, { flag: "wx" });
  if (!valid) fail(`host ${phase} test did not meet its behavior oracle; raw preserved at ${rawPath}`);
  process.stdout.write(`${metaPath}\n`);
}
function dockerObject(kind, name) {
  const raw = execFileSync("docker", ["inspect", "--type", kind, name],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const values = JSON.parse(raw);
  if (!Array.isArray(values) || values.length !== 1) fail(`Docker ${kind} identity is ambiguous`);
  return values[0];
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
  if (!/^card04-ac17-p5-[a-z0-9-]+$/.test(name ?? "")
      || !["ro", "hidden"].includes(mode) || !["before", "after"].includes(phase)) {
    fail("audit requires a named AC17 container, ro|hidden mode, and before|after phase");
  }
  const { manifest, base, src, oracle } = safePrepared(path);
  const frozen = sourceIdentity(json(manifest.frozen_meta));
  const image = dockerObject("image", IMAGE);
  const candidate = dockerObject("container", name);
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
  const expectedMounts = mode === "ro" ? ["/workspace", "/oracle", "/tmp/auth.json"] : ["/workspace", "/tmp/auth.json"];
  if (mounts.size !== expectedMounts.length || expectedMounts.some((target) => !mounts.has(target))
      || real(mounts.get("/workspace")?.Source) !== src || mounts.get("/workspace")?.RW !== true
      || mounts.get("/workspace")?.Type !== "bind"
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
  if (sourceRows.length !== beforeRows.length || changed.some((row) => row !== "runtime/stage/stage-runner.mjs")
      || phase === "before" && changed.length !== 0) fail("container source changed outside the single P5 file");
  for (const row of sourceRows) {
    const bytes = readFileSync(join(src, row.path));
    if (bytes.includes(frozen) || secrets.some((secret) => bytes.includes(secret))) {
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
  if (promptBytes.includes(frozen) || secrets.some((secret) => promptBytes.includes(secret))) {
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
  const attestationPath = join(EVIDENCE, `T025-p5-docker-audit-${id}.json`);
  const attestation = { schema: "card04-ac17-p5-docker-audit.v1", phase, mode,
    container_id: candidate.Id, image_id: candidate.Image, state: candidate.State?.Status,
    exit_code: phase === "after" ? candidate.State?.ExitCode : null,
    network_id: network.Id, network_internal: network.Internal,
    gateway_id: gateway.Id, gateway_image: gateway.Image,
    gateway_argv: gateway.Config.Cmd, gateway_script_sha256: PROXY_SHA,
    source_inventory_sha256: sha(JSON.stringify(sourceRows)), changed,
    test_sha256: manifest.frozen_test_sha256, auth_mount_readonly: true,
    auth_outside_source_and_output: true, auth_value_absent_from_source_and_logs: true,
    prompt_ref: promptRef, prompt_sha256: sha(promptBytes),
    command: candidate.Config.Cmd, mounts: expectedMounts.map((target) => ({ target,
      readonly: target !== "/workspace" })), attached_output: attached, logs: logs === null ? null : {} };
  if (logs) {
    for (const [channel, bytes] of Object.entries(logs)) {
      const ref = join(EVIDENCE, `T025-p5-docker-${id}.${channel}.raw.txt`);
      writeFileSync(ref, bytes, { flag: "wx" });
      attestation.logs[channel] = { ref, sha256: sha(bytes), bytes: bytes.length };
    }
  }
  writeFileSync(attestationPath, `${JSON.stringify(attestation, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${attestationPath}\n`);
}
const [action, one, two, three, four] = process.argv.slice(2);
if (action === "prepare" && one && !two) prepare(one);
else if (action === "test" && one && two) hostTest(one, two);
else if (action === "audit" && one && two && three && four) auditDocker(one, two, three, four);
else fail("expected prepare <frozen-meta.json>, test <prepared-manifest.json> before|after, or audit <prepared-manifest.json> <container-name> ro|hidden before|after");
