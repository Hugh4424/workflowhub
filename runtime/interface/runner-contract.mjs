const POSITIVE_INTEGER = /^[1-9]\d*$/;
const NON_NEGATIVE_INTEGER = /^(?:0|[1-9]\d*)$/;

export const LOCAL_SKILL_BUNDLE_CONTRACT = Object.freeze({
  runner_contract_major: 1,
  runner_contract_min_minor: 0,
});
export const LOCAL_RUNNER_CONTRACT = Object.freeze({
  runner_contract_major: 1,
  runner_contract_minor: 0,
});

function integer(value, pattern, label) {
  if (!Number.isInteger(value) || !pattern.test(String(value))) {
    throw new TypeError(`runner contract ${label} must be ${pattern === POSITIVE_INTEGER ? "a positive" : "a non-negative"} integer`);
  }
  return value;
}

export function createRunnerContract({ major, minor }) {
  return Object.freeze({
    runner_contract_major: integer(major, POSITIVE_INTEGER, "major"),
    runner_contract_minor: integer(minor, NON_NEGATIVE_INTEGER, "minor"),
  });
}

export function createSkillBundleContract({ major, minMinor }) {
  return Object.freeze({
    runner_contract_major: integer(major, POSITIVE_INTEGER, "major"),
    runner_contract_min_minor: integer(minMinor, NON_NEGATIVE_INTEGER, "minimum minor"),
  });
}

export function assertRunnerCompatibility(bundle, runner) {
  const required = createSkillBundleContract({
    major: bundle?.runner_contract_major,
    minMinor: bundle?.runner_contract_min_minor,
  });
  const available = createRunnerContract({
    major: runner?.runner_contract_major,
    minor: runner?.runner_contract_minor,
  });
  if (required.runner_contract_major !== available.runner_contract_major) {
    throw new Error(`runner contract major mismatch: bundle=${required.runner_contract_major}, runner=${available.runner_contract_major}`);
  }
  if (available.runner_contract_minor < required.runner_contract_min_minor) {
    throw new Error(`runner contract minor mismatch: bundle requires >=${required.runner_contract_min_minor}, runner=${available.runner_contract_minor}`);
  }
  return Object.freeze({
    compatible: true,
    major: available.runner_contract_major,
    runner_minor: available.runner_contract_minor,
    required_minor: required.runner_contract_min_minor,
  });
}
