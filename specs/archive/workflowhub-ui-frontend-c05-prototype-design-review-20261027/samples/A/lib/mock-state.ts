export const states=['default','loading','empty','error','cancel','boundary','permission','duplicate','partial','unknown'] as const;
export type MockState=typeof states[number];
export function parseState(value:string|undefined):MockState{return states.includes(value as MockState)?value as MockState:'default'}
export const messages:Partial<Record<MockState,string>>={loading:'正在加载模拟记录…',empty:'暂无模拟记录',error:'读取失败。重试将重新读取本地fixture。',cancel:'取消反馈场景：取消不更改已有记录，不发送真实命令。',permission:'业务权限未接入：本地fixture只供研究操作，不声明生产许可或RBAC。',duplicate:'重复反馈场景：同一记录仍唯一；本样本不创建真实业务命令。',partial:'部分数据未提供，已知记录保留。',unknown:'结果未知，等待核对；不自动重发。'};
