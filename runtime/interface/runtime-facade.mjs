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
  "review-record": "review",
  "capture-tests": "verify",
  confirm: "confirm",
  "authorize-operation": "authorize",
  run: "run",
});

function behaviorForInternalOperation(operation) {
  const behavior = BEHAVIOR_BY_INTERNAL_OPERATION[operation];
  if (!behavior) throw new Error("unknown private runtime route");
  return behavior;
}

// 维护此接口的下一位 CLI/接口维护者也是用户：改输入检查前先读真实 caller。
// 判据：输入是否真的跨模块边界；能否先化成一次纯函数判断。通用机制留内，
// 专用策略留调用边缘；公共请求不透传 storage/transport/framework 的内部形状。
// 既有接缝：stageRuntimeCliMain 解析 behavior/action，传 {action, argv}；此处
// 在 delegate 前核 runner 兼容性，业务仍交原 delegate，不据委托返回声称业务完成。
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

// 修改 run 委托接缝时，先沿 stageRuntimeCliMain 的具名调用确认输入/输出与需求；
// 复用七 public behavior、私有路由归属及上面的兼容检查，不为“将来会用”扩接口。
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
