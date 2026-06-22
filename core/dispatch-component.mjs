import { spawn } from "node:child_process";

/**
 * dispatchComponent — FR-CORE-002 / FR-CORE-004
 * Spawn `node <entry.path>`, collect stdout, parse JSON.
 * @param {{ component_id: string, path: string }} entry - Registry entry.
 * @returns {Promise<object>} Parsed JSON output from the component.
 * @throws {Error} On non-zero exit code or invalid JSON output.
 */
export function dispatchComponent(entry) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry.path], { stdio: ["ignore", "pipe", "inherit"] });

    const chunks = [];
    child.stdout.on("data", (chunk) => chunks.push(chunk));

    child.on("close", (code) => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();

      if (code !== 0) {
        reject(new Error(`Component "${entry.component_id}" exited with code ${code}`));
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        reject(new Error(`Component "${entry.component_id}" wrote invalid JSON: ${raw}`));
        return;
      }

      // FR-CORE-002 / D14: output must contain component_id matching the registry entry.
      if (typeof parsed.component_id !== "string") {
        reject(new Error(`Component "${entry.component_id}" output missing component_id field`));
        return;
      }
      if (parsed.component_id !== entry.component_id) {
        reject(
          new Error(
            `Component "${entry.component_id}" output component_id mismatch: expected "${entry.component_id}", got "${parsed.component_id}"`,
          ),
        );
        return;
      }

      resolve(parsed);
    });

    child.on("error", (err) => reject(err));
  });
}
