import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Thin v4-only boundary. It deliberately has no wall-clock killer: broker owns
 * provider liveness and duration limits. A workflow shutdown must call cancel.
 */
export class BrokerClient {
  constructor({ command, config, attachmentRoot, spawnImpl = spawn } = {}) {
    if (!command) throw new TypeError("third_review.command is required");
    if (!config) throw new TypeError("third_review.config is required");
    this.command = Array.isArray(command) ? command : [command];
    this.config = config;
    this.attachmentRoot = attachmentRoot;
    this.spawnImpl = spawnImpl;
  }

  async run({ request, attachments, attachmentDelivery } = {}) {
    const temp = mkdtempSync(join(tmpdir(), "wh-review-v4-broker-"));
    try {
      const requestFile = join(temp, "request.json");
      writeFileSync(requestFile, `${JSON.stringify(request)}\n`, { mode: 0o600 });
      const args = [...this.command.slice(1), "run", `--config=${this.config}`, `--request=${requestFile}`];
      if (attachments) {
        if (!this.attachmentRoot || !attachmentDelivery) throw new TypeError("attachments require attachmentRoot and attachmentDelivery");
        const manifestFile = join(temp, "attachments.json");
        writeFileSync(manifestFile, `${JSON.stringify(attachments)}\n`, { mode: 0o600 });
        args.push(`--attachments=${manifestFile}`, `--attachments-root=${this.attachmentRoot}`, `--attachment-delivery=${attachmentDelivery}`);
      }
      const result = await this.#execute(this.command[0], args);
      if (result.code !== 0) return { transport_error: { code: "BROKER_FAILED", message: result.stderr.slice(0, 4096) } };
      try { return JSON.parse(result.stdout); }
      catch { return { transport_error: { code: "BROKER_OUTPUT_INVALID", message: "3rd-review returned non-JSON" } }; }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }

  async cancel({ runtime_id, provider, source = "workflow_shutdown" }) {
    if (!runtime_id || !provider) throw new TypeError("runtime_id and provider are required");
    const result = await this.#execute(this.command[0], [...this.command.slice(1), "cancel", `--config=${this.config}`, `--runtime-id=${runtime_id}`, `--provider=${provider}`, `--source=${source}`]);
    if (result.code !== 0) throw new Error(`3rd-review cancel failed: ${result.stderr.slice(0, 4096)}`);
    return JSON.parse(result.stdout);
  }

  async status({ runtime_id }) {
    if (!runtime_id) throw new TypeError("runtime_id is required");
    const result = await this.#execute(this.command[0], [...this.command.slice(1), "status", `--config=${this.config}`, `--runtime-id=${runtime_id}`]);
    if (result.code !== 0) throw new Error(`3rd-review status failed: ${result.stderr.slice(0, 4096)}`);
    return JSON.parse(result.stdout);
  }

  #execute(command, args) {
    return new Promise((resolve, reject) => {
      const child = this.spawnImpl(command, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "", stderr = "";
      child.stdout?.on("data", (value) => { stdout += value; }); child.stderr?.on("data", (value) => { stderr += value; });
      child.once("error", reject); child.once("close", (code) => resolve({ code, stdout, stderr }));
    });
  }
}
