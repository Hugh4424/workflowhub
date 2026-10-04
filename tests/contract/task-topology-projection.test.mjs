import{describe,expect,it}from"vitest";import{readTaskTypeFromDecisionLog}from"../../runtime/stage/stage-content-contracts.mjs";
const log=v=>`# Decision\n\n## 任务身份\n\n- **任务类型**：${v}\n`;
describe("human task type material reading",()=>{
 it.each(["普通任务","规划任务"])("reads the explicit human %s declaration without a runtime cohort projection",type=>{expect(readTaskTypeFromDecisionLog(log(type))).toBe(type);expect(readTaskTypeFromDecisionLog(`## 任务身份\n| 字段 | 内容 |\n| --- | --- |\n| 任务类型 | **${type}** |\n`)).toBe(type);});
 it.each(["",log("unknown"),"##任务身份\n- **任务类型**：普通任务\n",log("普通任务")+"- **任务类型**：普通任务\n",log("普通任务")+"- **任务类型**：规划任务\n",log("普通任务")+"## 任务身份\n- **任务类型**：普通任务\n"])("keeps invalid/missing/duplicate/conflicting human input unknown",value=>{expect(readTaskTypeFromDecisionLog(value)).toBe("unknown");});
 it("does not infer the type from later sections or fenced example declarations",()=>{expect(readTaskTypeFromDecisionLog("##任务身份\n\n##备注\n\n- **任务类型**：普通任务\n")).toBe("unknown");expect(readTaskTypeFromDecisionLog("## 任务身份\n```\n- **任务类型**：普通任务\n```\n")).toBe("unknown");});
});
