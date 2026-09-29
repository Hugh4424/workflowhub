# CARD-04 全局 19 AC 规格澄清：独立只读审查

**裁决：P13/T024 作为唯一全局验收声明卡，方向可取；当前提案不能直接写入正式材料，更不能据此发布任何 AC 通过。**已按提案 SHA-256 `d11a3beeb55d79d8a1b4f83b9baf5e8886bb66e1b962d1b34a29b4485c15512d` 复核。`spec.md` Appendix A 确为 AC-16…AC-34 共 19 条；当前 post 投影器跨全部 indexed Phase 要求恰一张 `acceptance_role=acceptance`/`acceptance_data` 卡，且当前不存在该卡。P13 原职责是 P1…P12 的最终事实汇总，放唯一**声明入口**符合索引和最终编排顺序；其实际执行和独立判决仍归原 Phase，P13 报告不能自签原件。此审查没有改正式材料、代码、Task facts，也没有运行测试。

## 必须先修的合同问题

1. **P13 的最终汇总早于 AC-34 的真实最后答复，不能同时称“19 条最终通过”。**当前 `P13.md` 明写 T024 在 P11/P12 之后产出最终三文件，随后“交给 verify-code”；`P12.md` 也只改 verify-code 技能说明，真人独立语义审查和最终答复尚在后面。提案正确让 build-code 的 AC-34 保持 `unknown`，但“P13 最后总核 19 条”和“verify-code 后读 AC-34”没有定义两个时点的不可变结论。现有 build-code `acceptanceComplete` 对 spec 中**所有** AC 要求 `covered`/有理由的 `not_applicable`；AC-34 持续 unknown 时它必然为 missing。**修订：**明确 P13 三文件是 build-code 当时的事实汇总，AC-34 列待 verify-code，不得写整体业务验收通过；最终授权者的接受/拒绝/延期只由现有 verify-code 确认读路在实际答复后记录。不得回写 P13 immutable 报告、倒填较早 build-code AC 叶，也不得把质量缺失升级成禁止继续 verify-code 的新 gate。若产品确实要求一份含答复的后置总报告，另证明现有 verify-code 输出能承载，再由材料 owner 精确修订；目前无此接口证明。

2. **AC-26 的“本次诊断”与“下次读取前次”不能混称。**执行顺序已核：build-code handler 先做验收场景，`runOfficialStage` 在 handler 返回后才生成并发布本次 `stage_end_spec_analyze`，P5 hook 更晚。下次 `run` 可以核前次同 Task、材料、源码树的诊断/报告，但绝非下次运行“本次”的后置原件；如要证真正同次，则必须在本次发布后由现有正式返回/只读消费者核本次 attempt/ref/hash，不能让前次质量事实替本次签名。**修订：**每个 AC-26 子场景写明 producer stage、source attempt、consumer attempt、ref/hash、树/材料及读回时间；文案区分“前次同身份”与“本次发布后”。源码或材料改变必须失效，缺 P5 报告则 AC-26 未完成。不得用两次互相递归的 `run` 假造永远“本次”。

3. **私有 `readback` 现在仅是候选，尚不足以认定“最小且合宪”。**当前 parser 只支持 `browser/command/service`，runner 无执行参数就返回 unavailable；handler 的非浏览器叶还要求 `execution_binding` 与**当前** attempt 相等。一个引用前次 attempt 的 `readback` 叶既不能直接通过现有校验，也不能靠放宽当前绑定通过。`freshness.mjs` 已有 P5 私有报告读者，verify-code 已有 `e2eAcceptanceFacts` 的执行／独立审查／确认读路；先比较这些真实读者能否消费后置来源。若 AC-26 等仍必须进入 build-code 逐 AC 事实，可为**已证明必要的具体场景**扩同一验收投影，但需定义 source attempt 与 consumer attempt 两套身份、原件 ref/hash、当前树/材料、独立 oracle、缺失/失败状态和唯一消费点；先用一条真来源做错 Task、错 attempt、换树、坏 hash、缺原件负控。把 locator 增到现有 `run` 输入/返回值仍是**公共接口变化**，不能因为不加新命令就叫“纯私有”；需按 F1/F2/F8/F10/F11 证明现有事实指针不足、成本收益、owner/consumer/删除条件。尚未证明前，不批准一口气给 19 条加 `readback` tier 或新增持久对象。

4. **静态场景表不能自行证明动态全集。**提案要求“19 条都声明、每 AC 多场景都通过”，但这只证明**已写入卡面的场景**。AC-16 分母是实际 19 条定义；AC-29 是六项责任；AC-30 的目录/独立库存要双向对应；AC-31 是每 Task/Phase 的层次；AC-32/33 的分母来自当前可信差分、选例和真实业务 case，修复后还会变化。材料漏写一个业务 case，当前 parser 无法凭卡面发现。**修订：**为每行定真实动态分母生产者、独立反向枚举、版本/树身份与漏项负控；解析层只核 19 个 AC ID 和逐场景 ID 的结构，不能把其结构 GREEN 叫全业务覆盖。AC-33 还须分别认证旧失败原始 reporter/旧树与修后新树的选择/回执/邻近回归，`requirePassed:true` 不能读旧失败。AC-27 逐文件旧字节基线找不到就保持 unknown。

5. **独立 oracle 目前只是一列类别，还不是可实施的判真合同。**`executeAcceptanceCommandOrService` 当前会用同一子进程自报的 `expected=actual` 发布 `passed`；`acceptanceCoverageForExecution` 只核叶身份和 `status=passed`，`publishVNextStage` 的单叶 `executionEvidence` 快捷路径会丢掉后补来源。提案指出了三处真问题，但表中未给每个场景的规则位置、真实输入、原始输出字段、判定算法及 owner，无法证明独立于实施者，也无法防止 P13 的总结文案成为 oracle。**修订：**先对 AC-26/27/33 和至少一条正常业务 case 写可执行的 producer→独立规则→只读消费者→发布点闭环，给“子进程自报相等但业务原件相反”、双场景缺一、单叶补源丢失三个真实负控；其他 AC 按原 owner 逐段补，不因 19 行卡面存在而批量宣称 achieved。

6. **不要扩大或缩小原 AC 条件。**提案 AC-24 行额外写了“实施者不能改/看目标”：AC-24 原文只要求 oracle 在写集外、`0444`、仓库无副本、消费约定；“只读可读／隐藏不可读”是 AC-17，不能把 AC-24 改成隐藏必需，也不能拿 `0444` 冒充 AC-17 的真正受限实施者。AC-19 原文是一个完整纯文档 Task 的可失败检查或理由+风险+披露，独立样例层已核；“交付/关闭”事实需要核实完整 Task 身份，但不应无依据新增“物理 close 必须完成”判据。AC-34 的最后授权者未答时不能通过，也不能以通用 `human_confirmation:passed` 代替其业务接受，更不能兼作 commit/merge/cleanup 授权。

## 材料 owner 可采用的修订顺序

1. 在 `spec.md` 只补两个时点的事实边界：build-code 的 19 条当前覆盖（AC-34 待最后答复）与 verify-code 后的最终答复；AC 原文不改。P13/T024 可成为唯一全局**声明**卡，`Source / FR / AC` 引全部 19 AC 时明确是索引，不把 P1…P12 实现 owner 迁入 P13。`phases/index.md` 仍只登记真实指针、写集、依赖和 consumer；P13 当前“不得改 runtime/**”须与每个实际代码 owner 的 Phase 写集分别对齐，不能靠改 P13 索引暗授跨相位写面。
2. 先由各原 owner 交出可认证场景清单：每一条列动态分母、正反例、独立规则、真实原件与产生时点；后置场景明确 source/consumer attempt 与缺失状态。P13 材料只汇总这些引用。P10 七候选仅是 AC-26/27/33 的部分来源，不可代表全卡。
3. 仅在一条真实后置来源证明现有读路不足后，决定要不要最小 `readback` 扩展；否则直接复用现有 P5/P13/verify-code 读者。若加字段/文件/schema，先登记 move-map 和受保护写面；拒绝新 stage、gate、latest 指针、第二套进度表。
4. 材料与代码各过独立复审；定向先 RED 后 GREEN，重点检漏 AC/场景、动态分母遗漏、子进程自报假绿、来源错绑、旧失败被误当 passed、AC-34 未答却通过。正式 Task 原件产生前，19 条中不能仅因本提案得到任何整项通过结论。

**核对来源：**`specs/workflowhub-thin-core-card-04-20260919/{spec.md,phases/P10.md,phases/P12.md,phases/P13.md,phases/index.md}`；`runtime/stage/stage-content-contracts.mjs:8154-8228`、`stage-handlers.mjs:1586-1682,1685-1730,1730-1840,4252-4291`、`stage-runner.mjs:2750-2935,3322-3410,4950-5040`；`CONSTITUTION.md` F1/F2/F3/F7/F8/F9/F10/F11 与 `constitution-checklist.md`；同目录全 AC 审计、P10 七场景独立审查。只读审查时现有实现/正式材料仍未具备全局卡、后置读回和最终授权者答复。
