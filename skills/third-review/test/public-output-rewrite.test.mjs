import { test } from "vitest";
import assert from "node:assert/strict";
import cursor from "../lib/adapters/cursor.mjs";
import kimi from "../lib/adapters/kimi.mjs";
import opencode from "../lib/adapters/opencode.mjs";

test("continuable review adapters expose the safe public-output rewrite contract", () => {
  for (const adapter of [cursor, kimi, opencode]) {
    assert.equal(adapter.capabilities.continuation, true);
    assert.equal(typeof adapter.resume, "function");
    assert.match(adapter.publicOutputRewritePrompt, /complete replacement JSON review/i);
    assert.match(adapter.publicOutputRewritePrompt, /never quote, reproduce, construct/i);
  }
});
