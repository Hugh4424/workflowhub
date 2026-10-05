#!/usr/bin/env node
import readline from "node:readline";
readline.createInterface({ input: process.stdin }).once("line", () => {
  process.stdout.write("TERMINAL\n");
  setTimeout(() => { process.stderr.write("LATE_SESSION\n"); process.exit(0); }, 30);
});
