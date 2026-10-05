import { fail } from "../errors.mjs";
import { SUPPORTED_PROVIDER_IDS } from "../provider-ids.mjs";
import claudeCode from "./claude-code.mjs";
import codex from "./codex.mjs";
import cursor from "./cursor.mjs";
import dsh from "./dsh.mjs";
import grok from "./grok.mjs";
import kimi from "./kimi.mjs";
import opencode from "./opencode.mjs";
import antigravity from "./antigravity.mjs";
import pi from "./pi.mjs";
import { failureCode, failureDetails } from "../provider-failure.mjs";

const registry = { "claude-code": claudeCode, codex, cursor, dsh, grok, kimi, opencode, antigravity, pi };
const missing = SUPPORTED_PROVIDER_IDS.filter((id) => !registry[id]);
if (missing.length) throw new Error(`adapter registry is missing supported providers: ${missing.join(", ")}`);
export function adapter(id) { if (!registry[id]) fail("UNSUPPORTED_PROVIDER", `no adapter for ${id}`); return registry[id]; }
export { failureCode, failureDetails };
