#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { closeSync, fsyncSync, mkdirSync, openSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [outputArg, browserArg, focusedArg, testArg, checkArg, reviewRef = null, reviewSha256 = null] = process.argv.slice(2);
if (!outputArg) throw new Error("output path is required");
const numeric = (value) => value === "pending" ? null : Number(value);
const value = {
  schema_version: "workflow-evolution-final-aggregate.v1",
  status: [browserArg, focusedArg, testArg, checkArg].every((value) => value === "0") ? "passed" : "failed",
  browser_status: numeric(browserArg), focused_status: numeric(focusedArg),
  repository_test_status: numeric(testArg), repository_check_status: numeric(checkArg), review_ref: reviewRef,
  review_sha256: reviewSha256,
};
value.content_sha256 = createHash("sha256").update(JSON.stringify(value)).digest("hex");
const output = resolve(outputArg); mkdirSync(dirname(output), { recursive: true });
const temporary = `${output}.tmp-${process.pid}-${randomUUID()}`;
const fd = openSync(temporary, "wx");
try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
renameSync(temporary, output);
const parent = openSync(dirname(output), "r"); try { fsyncSync(parent); } finally { closeSync(parent); }
