import { createHash } from "node:crypto";
import { lstat, readdir, readFile, readlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function walk(root, relative = "") {
  const absolute = path.join(root, relative);
  let stat;
  try {
    stat = await lstat(absolute);
  } catch (error) {
    if (error.code === "ENOENT") return [{ path: relative || ".", type: "missing" }];
    throw error;
  }
  if (stat.isSymbolicLink()) {
    return [{ path: relative || ".", type: "symlink", target: await readlink(absolute) }];
  }
  if (stat.isFile()) {
    return [{ path: relative || ".", type: "file", mode: stat.mode & 0o777, sha256: sha256(await readFile(absolute)) }];
  }
  if (!stat.isDirectory()) return [{ path: relative || ".", type: "other", mode: stat.mode & 0o777 }];
  const entries = await readdir(absolute);
  const children = await Promise.all(entries.sort().map((entry) => walk(root, path.join(relative, entry))));
  return [{ path: relative || ".", type: "directory", mode: stat.mode & 0o777 }, ...children.flat()];
}

function git(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return result.status === 0 ? result.stdout : null;
}

export async function captureSideEffects({ storageRoot, workspaceRoot, authorityRoot }) {
  return {
    storage: await walk(storageRoot),
    authority: await walk(authorityRoot),
    git: {
      head: git(workspaceRoot, ["rev-parse", "HEAD"]),
      refs: git(workspaceRoot, ["for-each-ref", "--format=%(refname) %(objectname)"]),
      status: git(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"]),
    },
  };
}

export async function loadPhaseCapability(modulePath, exportName) {
  const target = new URL(`../${modulePath}`, import.meta.url).href;
  try {
    const module = await import(target);
    if (typeof module[exportName] === "function") return module[exportName];
  } catch (error) {
    const missing = error.code === "ERR_MODULE_NOT_FOUND"
      || /Failed to load url|Cannot find module|Does the file exist/i.test(error.message);
    if (!missing) throw error;
  }
  throw new Error(`PHASE_CAPABILITY_MISSING: ${modulePath}#${exportName}`);
}

export async function assertSchemaFixture(schemaName, value) {
  const schemaPath = new URL(`../../schemas/${schemaName}`, import.meta.url);
  const schema = JSON.parse(await readFile(schemaPath));
  const ajv = new Ajv2020({ strict: false, formats: { "date-time": true } });
  const validate = ajv.compile(schema);
  if (!validate(value)) throw new Error(`FIXTURE_SCHEMA_INVALID: ${JSON.stringify(validate.errors)}`);
}
