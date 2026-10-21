// Task-owned capture delegates to the existing single native executor.
import { assertTaskHandle } from "../../runtime/task/task-capability.mjs";
export function runCapture({task,recordDir,...input}={}) {
  assertTaskHandle(task);
  if(recordDir!==undefined&&recordDir!==task.recordPath("quality/tests"))throw new TypeError("capture directory differs from the explicit task");
  return task.captureCommand(input);
}
