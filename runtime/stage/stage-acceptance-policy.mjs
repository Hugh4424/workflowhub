const ACCEPTANCE_MODE = Object.freeze({
  "make-decision": "human",
  "build-spec": "automatic",
  "build-plan": "human",
  "build-code": "automatic",
  // verify-code records and validates the current code-review result. It no
  // longer waits for a second human acknowledgement of that same result;
  // physical close authorization remains a separate close-plan operation.
  "verify-code": "automatic",
});

export function acceptanceModeFor(stage) {
  const mode = ACCEPTANCE_MODE[stage];
  if (!mode) throw new TypeError(`unsupported stage: ${stage}`);
  return mode;
}

export function requiresHumanConfirmation(stage) {
  return acceptanceModeFor(stage) === "human";
}
