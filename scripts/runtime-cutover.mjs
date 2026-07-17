#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { readRuntimeMode, quiesceRuntime, rebindRuntimeRoot } from "../core/runtime-mode.mjs";
function parse(argv) { const [command, ...rest] = argv, values = {}; for (const item of rest) { const at = item.indexOf("="); if (!item.startsWith("--") || at < 3) throw new TypeError(`invalid argument: ${item}`); values[item.slice(2, at)] = item.slice(at + 1); } return { command, values }; }
export function runtimeCutover(argv = process.argv.slice(2)) {
  const { command, values } = parse(argv);
  if (command === "status") return readRuntimeMode();
  if (command === "quiesce") return quiesceRuntime({ storageRoot: values.root, expectedEpoch: values.epoch });
  if (command === "rebind-root" || command === "cutover") return rebindRuntimeRoot({ sourceRoot: values["source-root"], targetRoot: values["target-root"], expectedEpoch: values.epoch });
  throw new TypeError("usage: runtime-cutover.mjs <status|quiesce|rebind-root|cutover> ...");
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stderr.write("runtime-cutover.mjs is an internal handler; use the workflowhub public CLI\n");
  process.exitCode = 2;
}
