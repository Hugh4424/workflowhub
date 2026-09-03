import { assertRunnerCompatibility } from "./runner-contract.mjs";

export const RUNTIME_BEHAVIORS = Object.freeze([
  "doctor",
  "status",
  "run",
  "review",
  "verify",
  "confirm",
  "authorize",
]);

const BEHAVIOR_BY_INTERNAL_OPERATION = Object.freeze({
  doctor: "doctor",
  status: "status",
  artifact: "run",
  "review-risk-pause": "review",
  "review-record": "review",
  "capture-tests": "verify",
  confirm: "confirm",
  "authorize-operation": "authorize",
  run: "run",
  reflect: "run",
});

function behaviorForInternalOperation(operation) {
  const behavior = BEHAVIOR_BY_INTERNAL_OPERATION[operation];
  if (!behavior) throw new Error("unknown private runtime route");
  return behavior;
}

export function createRuntimeFacade({
  delegates = {},
  skillBundleContract,
  runnerContract,
} = {}) {
  const target = Object.fromEntries(RUNTIME_BEHAVIORS.map((behavior) => [
    behavior,
    async (request) => {
      assertRunnerCompatibility(skillBundleContract, runnerContract);
      const delegate = delegates[behavior];
      if (typeof delegate !== "function") {
        throw new Error(`runtime behavior delegate is unavailable: ${behavior}`);
      }
      return delegate(request);
    },
  ]));
  return Object.freeze(new Proxy(target, {
    get(object, property) {
      if (typeof property === "symbol" || Object.hasOwn(object, property)) return object[property];
      throw new Error(`unknown runtime behavior: ${String(property)}`);
    },
    set() { throw new Error("runtime facade is immutable"); },
  }));
}

export async function invokeRuntimeCommand(
  behavior,
  request,
  delegate,
  contracts = {},
  internalOperation,
) {
  if (!RUNTIME_BEHAVIORS.includes(behavior)) throw new Error(`unknown public runtime behavior: ${behavior}`);
  if (behaviorForInternalOperation(internalOperation) !== behavior) {
    throw new Error("private runtime route does not belong to public behavior");
  }
  const facade = createRuntimeFacade({
    delegates: { [behavior]: delegate },
    skillBundleContract: contracts.skillBundleContract,
    runnerContract: contracts.runnerContract,
  });
  return facade[behavior](request);
}
