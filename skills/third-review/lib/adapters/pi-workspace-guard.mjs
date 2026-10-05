const workingDirectoryLine = /(^|\n)Current working directory:[^\r\n]*/g;

export function logicalWorkspaceSystemPrompt(value) {
  const source = String(value ?? "");
  const logical = source.replace(workingDirectoryLine, "$1Current working directory: workspace");
  return logical.includes("\nCurrent working directory:") ? logical : `${logical}\nCurrent working directory: workspace`;
}

export function isLogicalBundleRead(input) {
  const target = input?.path;
  if (typeof target !== "string" || !target.startsWith("bundle/") || target.includes("\\") || target.includes("\u0000")) return false;
  const segments = target.split("/");
  if (segments.length < 2 || segments.some((segment) => !segment || segment === "." || segment === "..")) return false;
  return target !== "bundle/attachments-manifest.json" && !/^file:/i.test(target) && !/^[A-Za-z]:/.test(target);
}

export function reviewToolGate(toolName, input) {
  return toolName === "read" && isLogicalBundleRead(input)
    ? null
    : { block: true, reason: "Review attachment access denied: use read with a logical bundle/<file> path." };
}

// Pi always injects its real cwd into the system prompt.  The broker workspace
// is host-private, so replace that display-only value before the model sees it.
// The tool gate then makes the logical workspace name enforceable: the model can
// only read declared, relative packet files and cannot recover the real cwd via
// an absolute path tool call.
export default function workspaceGuard(pi) {
  pi.on("before_agent_start", (event) => ({ systemPrompt: logicalWorkspaceSystemPrompt(event.systemPrompt) }));
  pi.on("tool_call", (event) => reviewToolGate(event.toolName, event.input));
}
