#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Broker } from "./broker.mjs";

const [root, runtimeId, operationId] = process.argv.slice(2);
if (!root || !runtimeId || !operationId) process.exit(2);

const jobPath = path.join(root, runtimeId, "managed", "operations", `${operationId}.json`);
try {
  const job = JSON.parse(fs.readFileSync(jobPath, "utf8"));
  if (job.version !== 1 || job.runtime_id !== runtimeId || job.operation_id !== operationId) process.exitCode = 2;
  else await new Broker(job.config_snapshot, { managedSession: true }).runManagedOperation(runtimeId, operationId, job);
} catch {
  // The manager has no public stdout/stderr contract.  A later status call
  // observes its verified process identity and publishes SESSION_MANAGER_LOST.
  process.exitCode = 2;
}
