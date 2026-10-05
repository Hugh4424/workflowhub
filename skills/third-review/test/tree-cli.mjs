#!/usr/bin/env node
import { spawn } from "node:child_process";

const child = spawn(process.execPath, [new URL("./slow-cli.mjs", import.meta.url).pathname], { stdio: "ignore" });
console.log(JSON.stringify({ child_pid: child.pid }));
setInterval(() => {}, 1_000);
