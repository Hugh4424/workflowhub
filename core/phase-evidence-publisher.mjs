import { assertTaskKernel } from "./task-kernel.mjs";

export function publishPhaseSubject(taskCapability, value) { return assertTaskKernel(taskCapability).publishPhaseSubject(value); }
export function publishPhaseDiff(taskCapability, value) { return assertTaskKernel(taskCapability).publishPhaseDiff(value); }
export function publishPhaseResult(taskCapability, value) { return assertTaskKernel(taskCapability).publishPhaseResult(value); }
