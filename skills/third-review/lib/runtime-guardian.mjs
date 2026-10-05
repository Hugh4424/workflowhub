import fs from "node:fs";
import path from "node:path";
import { reapRuntimeIfOwnerDead, readRuntime } from "./runtime.mjs";

const [root, runtimeId] = process.argv.slice(2);
if (!root || !runtimeId) process.exit(2);
const guardian = path.join(root, runtimeId, ".guardian");
const stop = () => { try { fs.rmSync(guardian, { recursive: true, force: true }); } catch {} process.exit(0); };
const tick = () => {
  try {
    const outcome = reapRuntimeIfOwnerDead(root, runtimeId);
    if (outcome.reaped || !outcome.running) return stop();
    readRuntime(root, runtimeId);
  } catch { return stop(); }
};
tick();
setInterval(tick, 1_000);
