const ACCEPTANCE_MODE = Object.freeze({
  "make-decision": "human",
  "build-spec": "automatic",
  "build-plan": "human",
  "build-code": "automatic",
  "verify-code": "human",
});

export function acceptanceModeFor(stage) {
  const mode = ACCEPTANCE_MODE[stage];
  if (!mode) throw new TypeError(`unsupported stage: ${stage}`);
  return mode;
}

export function requiresHumanConfirmation(stage) {
  return acceptanceModeFor(stage) === "human";
}
