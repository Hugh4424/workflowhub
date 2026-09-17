# Task Plan: mechanism-waste-reduction build-spec 与 build-plan

## Goal

在认证 worktree 内严格按 manifest 顺序完成 build-spec 15 步和 build-plan 13 步：形成当前 spec.md、plan.md、tasks.md，保留真实 research/review/analyze/confirmation/outcome/reflection 事实，不把本阶段缺口推给下游，不执行 commit/merge/push。

## Next Step

等待冻结 spec 的唯一独立 review 返回；随后逐条处置并运行最终 analyzer/outcome/reflection。

## Current Phase

Phase 3 in_progress — build-spec 独立审查与阶段发布

## Phases

### Phase 1: build-spec steps 1–3
- [x] 核对认证 worktree、task identity、前序状态
- [x] 读取 build-spec manifest、portable package 与 dependencies
- [x] 汇总 decision-log 来源索引与条件研究
- [x] 判定 spec-clarify 是否触发并记录事实（已触发并取得真实答复：迟到追加窗口 10 分钟；跨仓结果合同采用扩展现有请求/状态合同）
- **Status:** complete

### Phase 2: build-spec steps 4–10
- [x] 编写并校验完整 spec.md
- [x] 执行 simplicity guard 与 CEO lens
- [x] 记录 non-UI steps 7–9 为不适用
- [x] 冻结当前 spec
- **Status:** complete

### Phase 3: build-spec steps 11–15
- [ ] 对冻结 spec 发起一次真实独立 review
- [ ] 逐条处置 findings 并完成最终修订
- [ ] 执行 strict stage-end spec-analyze
- [ ] 发布 stage outcome、普通话 handoff 与 stage reflection
- **Status:** pending

### Phase 4: build-plan steps 1–8
- [ ] 读取当前 decision/spec 与 build-plan portable package
- [ ] 记录 planning research 事实
- [ ] 建立 testing blueprint 与 test route
- [ ] 编写并校验 plan.md、tasks.md
- **Status:** pending

### Phase 5: build-plan steps 9–13
- [ ] 对 current plan/tasks 发起一次真实独立 review
- [ ] 逐条处置 findings 并运行 final strict spec-analyze
- [ ] 普通话 handoff并取得用户真实确认
- [ ] 发布 stage outcome 与 stage reflection
- **Status:** pending

### Phase 6: Final verification
- [ ] 读回 build-spec/build-plan 均 completed
- [ ] 披露所有 unavailable/unknown/incomplete/N/A
- [ ] 呈现三份当前材料并停止
- **Status:** pending

## Decisions Made

| Decision | Rationale |
|---|---|
| 严格先 build-spec 后 build-plan | build-plan 当前明确缺 spec.md，且用户要求不跳阶段 |
| 仅当前四材料是工作真相 | AGENTS.md 与 portable package 的 vNext 边界 |
| 重读、全仓映射、独立质量判断交给子代理 | 仓库规则要求控制主上下文且禁止自审自判 |
| 只跑契约校验和受影响定向检查 | 禁止无范围全量回归 |
| 不做 commit/merge/push | 用户未授权不可逆操作 |

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| 误猜 `tools/cli/workflowhub.mjs` 为入口，MODULE_NOT_FOUND | 1 | 改读真实入口 `tools/cli/stage-runtime.mjs`，随后 `help` exit 0 |
| 一次无变化 edit 被工具拒绝 | 1 | 不重试；该目标文本无需修改 |
| make-decision completed outcome 尝试要求完整当前 requirement coverage | 5 | 停止伪装完整重放；改用仅证明本轮批准、其余自动 unavailable 的真实 incomplete repair outcome，bridge exit 0 |
| 最小 repair bridge 首次带旧 material_revision | 1 | 读取当前身份并绑定与当前 decision-log 相同的确认；随后 bridge exit 0 |
| spec review request 生成器少一个右花括号 | 1 | 修正脚本语法后再执行；未产生 review 写入 |
| 前台 review 超过 120 秒被 harness SIGTERM，外部 managed session 仍在运行 | 1 | 不伪造结果；用后台 job 重连同一内容寻址请求，继续其他独立工作 |
| spec 11 项 findings 修复改变快照与确认范围 | 3 | 恢复确认/澄清 receipt/上游 repair outcome 至当前 revision 与 snapshot；新增 attempt id 避免 replay conflict |
| build-plan 起草子代理未返回产物 | 1 | 本轮改为主会话按模板和 seam map 编写 plan.md/tasks.md |
| build-spec 完成 run 后因材料继续修复导致 review attempt 与 freeze 链漂移 | 2 | 只保留零 major ambiguity + clarify 两个真实谓词，review/advisories 如实披露 unavailable/missing |
| build-spec reflection 首次 schema/identity 不匹配 | 3 | 绑定已发布 outcome 的 snapshot/material revision，并补齐 v2 schema 必填字段后 published/degraded 如实记录 |
| 后台 build-plan 起草代理在最终核验后污染 `plan.md`（47 卡/T101 遗留） | 1 | 主会话只读核验发现后，将 plan 的 Test Strategy / Traceability / Quick Read 重新对齐到实际 `tasks.md` 17 卡，并重跑 validators + draft registration |
| 旧 current handoff 投影停留在 failed/outcome-03，阻止更新 | 1 | 该文件为 `current_only` 非权威投影；备份到 `/tmp/wh-stale-build-plan-handoff.md` 后以当前 completed outcome + reflection 重新发布 |

## Stage Result

- build-spec 完成：`status=completed`，quality 完成谓词仅 `zero_major_ambiguities` + `clarify` 均 satisfied。
- 关键事实：`spec.md` 25 FR / 26 AC；Clarify receipt `quality/evidence/interactions/0df31b87bb0bc582307449b94a33f70a07d9aae336b3aeac28fab2baec9c3f85.json`；当前快照 `79eac51d46ae5b32d5170262a519621811e95746` / `revision-ac727b49521f356dd52c40cbb2cf932af79e7622b3bda9596cb891ac813d15a4`（后续 lesson merge 后 status 快照漂移，但 outcome 绑定保持发布时身份）。
- 质量边界：review / stage-end analyze / finding dispositions 为 advisory 或 unavailable，未伪造通过；stage reflection 已发布但标记 degraded（缺 status_matrix/source_completeness 投影）。
- 状态刷新：reflection lesson merge 造成快照漂移后，重新发布当前 clarify receipt `quality/evidence/interactions/90c69a2351a1e0db9f24d6c98ad3d1db82954878d9676dcad78e2d53076496e2.json` 并复跑官方 build-spec；最终 `status=completed`，quality `completed`，无 missing。
- build-plan 完成：最终官方 status `quality=completed`、`missing=[]`、`work=ready`；当前绑定 snapshot `0b4af1a1e6b200ecb4d3587689538c063d193043` / material `revision-a8f6d34cc12700d9e431af908308dd9ba4990b7d926bd1e024aa08e387e6eddd`。
- build-plan 当前 handoff：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-waste-reduction-20260915/quality/evidence/handoff/build-plan.md`（stage completed，reflection degraded，next=`build-code`）。
- 下一步：在别的会话进入 `build-code`，只消费四份当前材料、正式质量原件和上述 handoff；不要执行 commit/merge/push/close，除非用户另行授权。
