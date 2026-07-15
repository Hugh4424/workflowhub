import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const protocol = "workflowhub-result.v1";

function failure(code, message) { const error = new Error(`${code}: ${message}`); error.code = code; return error; }

function execute(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] }); let stdout = "", stderr = "";
    child.stdout.on("data", (bytes) => { stdout += bytes; }); child.stderr.on("data", (bytes) => { stderr += bytes; });
    child.once("error", reject); child.once("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

function validatePublicProvider(value, provider, materialId) {
  if (!value || typeof value !== "object" || value.result_protocol !== protocol || value.provider !== provider) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review returned an incompatible provider result");
  if (!["completed", "failed", "cancelled"].includes(value.status)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review returned an invalid provider status");
  if (value.material_id !== materialId) throw failure("MATERIAL_INCOMPLETE", "3rd-review result is bound to different material");
  if (value.session_id !== null && typeof value.session_id !== "string") throw failure("PROTOCOL_INCOMPATIBLE", "session_id must be a string or null");
  if (value.output !== null && typeof value.output !== "string") throw failure("PROTOCOL_INCOMPATIBLE", "output must be a string or null");
  if (value.error !== null && (typeof value.error?.code !== "string" || typeof value.error?.message !== "string")) throw failure("PROTOCOL_INCOMPATIBLE", "error must contain code and message");
  return Object.freeze({ provider, status: value.status, session_id: value.session_id, output: value.output, error: value.error });
}

export class ReviewProviderClient {
  constructor({ command = null, config = null, invoke = null } = {}) {
    if (!invoke && (!command || !config)) throw new TypeError("command and config are required without an injected invoke function");
    this.command = Array.isArray(command) ? command : command ? [command] : null; this.config = config; this.invoke = invoke ?? ((value) => this.#invokeCli(value));
  }

  async run({ hostProvider, provider, materials, prompt, continuationRuntimeId = null } = {}) {
    if (!(hostProvider && provider && materials?.bundleRoot && materials?.materialId && prompt)) throw new TypeError("hostProvider, provider, materials, and prompt are required");
    const entries = (materials.deliveryManifest ?? materials.manifest ?? []).map(({ path, bytes, sha256 }) => ({ source: `${materials.sourcePrefix}/${path}`, destination: path, size: bytes, sha256, embed: false }));
    const request = { version: 4, host_provider: hostProvider, required_result_protocol: protocol, provider_allowlist: [provider], prompt, continuation: continuationRuntimeId ? { runtime_id: continuationRuntimeId } : null };
    const attachments = { version: 1, bundle_id: materials.materialId, entries };
    const wire = await this.invoke({ request, attachments, attachmentsRoot: materials.attachmentRoot, attachmentDelivery: "file_only" });
    if (![0, 3].includes(wire.exitCode)) {
      let parsed; try { parsed = JSON.parse(wire.stderr); } catch { throw failure("PROVIDER_UNAVAILABLE", wire.stderr || `3rd-review exited ${wire.exitCode}`); }
      throw failure(parsed?.error?.code ?? "PROVIDER_UNAVAILABLE", parsed?.error?.message ?? "3rd-review preflight failed");
    }
    let result; try { result = JSON.parse(wire.stdout); } catch { throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review run stdout is not JSON"); }
    if (typeof result?.runtime_id !== "string" || !Array.isArray(result.providers)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review run result is incomplete");
    const publicProvider = result.providers.find((item) => item?.provider === provider);
    if (!publicProvider) throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review omitted provider ${provider}`);
    return { runtimeId: result.runtime_id, provider: validatePublicProvider(publicProvider, provider, materials.materialId) };
  }

  async #invokeCli({ request, attachments, attachmentsRoot, attachmentDelivery }) {
    const temporary = mkdtempSync(join(tmpdir(), "wh-review-public-"));
    try {
      const requestPath = join(temporary, "request.json"); const attachmentsPath = join(temporary, "attachments.json");
      writeFileSync(requestPath, `${JSON.stringify(request)}\n`, { mode: 0o600 }); writeFileSync(attachmentsPath, `${JSON.stringify(attachments)}\n`, { mode: 0o600 });
      const args = [...this.command.slice(1), "run", `--config=${this.config}`, `--request=${requestPath}`, `--attachments=${attachmentsPath}`, `--attachments-root=${attachmentsRoot}`, `--attachment-delivery=${attachmentDelivery}`];
      return await execute(this.command[0], args);
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  }
}
