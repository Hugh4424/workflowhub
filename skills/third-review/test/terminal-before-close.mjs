#!/usr/bin/env node
import readline from "node:readline";

readline.createInterface({ input: process.stdin }).once("line", () => {
  process.stdout.write("TERMINAL\n");
  setTimeout(() => { process.stdout.write("LATE_AFTER_TERMINAL\n"); process.exit(0); }, 50);
});
