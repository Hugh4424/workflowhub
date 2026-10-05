import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function quote(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

// The Node test sandbox may kill a fixture launched through its .mjs shebang.
// Keep the provider command executable, but make the interpreter explicit.
export function nodeFixtureCommand(fixture) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-node-fixture-"));
  const command = path.join(root, "run-fixture");
  fs.writeFileSync(command, `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(fixture)} "$@"\n`, { mode: 0o700 });
  return command;
}
