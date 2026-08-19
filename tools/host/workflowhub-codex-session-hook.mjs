#!/usr/bin/env node

/**
 * Codex project-hook entrypoint for WorkflowHub.
 *
 * It registers the exact path supplied by Codex.  It does not search the
 * sessions directory, infer a task, or write canonical task facts.
 */

import { readFileSync } from "node:fs";
import process from "node:process";

import { endCodexSession, registerCodexSession } from "./workflowhub-codex-session-state.mjs";

function input() {
  const raw = readFileSync(0, "utf8");
  if (!raw.trim()) return {};
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Codex hook input must be an object");
  return value;
}

const value = input();
const event = typeof value.hook_event_name === "string" ? value.hook_event_name : "";
const sessionId = value.session_id;
const cwd = value.cwd ?? process.cwd();

if (event === "SessionStart" || event === "UserPromptSubmit") {
  if (typeof sessionId === "string" && (typeof value.transcript_path === "string" || value.transcript_path === null || value.transcript_path === undefined)) {
    registerCodexSession({
      sessionId,
      transcriptPath: value.transcript_path,
      cwd,
      model: value.model,
    });
  }
} else if (event === "SessionEnd" && typeof sessionId === "string") {
  endCodexSession({ sessionId, cwd });
}

// Hook output is intentionally empty: no prompt injection and no user-visible
// lifecycle machinery.  The handoff is consumed only by the WorkflowHub run.
