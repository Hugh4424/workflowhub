# Phase P11 — 全 AC 终末验收给出一条一结论

- **Global spec**：`spec.md#实现设计（全局权威）`
- **Write set**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-416-p11-final-current-acceptance-delta.md`
- **Dependency**：P1、P2、P3、P4、P5、P6、P7、P8、P9、P10
- **Consumer**：verify-code 终末复核与用户
- **gate_cmd**：`node -e "const fs=require('fs');const s=fs.readFileSync('/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-416-p11-final-current-acceptance-delta.md','utf8');const fail=m=>{throw Error('ORACLE-P11-FINAL-ACCEPTANCE '+m)};const lines=s.split(/\\r?\\n/);const starts=lines.flatMap((l,i)=>l==='## 原AC一条一结论'?[i]:[]);if(starts.length!==1)fail('target heading must occur once');const start=starts[0]+1;let end=lines.findIndex((l,i)=>i>=start&&/^#{1,2} /.test(l));if(end<0)end=lines.length;const section=lines.slice(start,end);const first=section.findIndex(l=>l.startsWith('|'));if(first<0)fail('matrix missing');const rows=[];let at=first;while(at<section.length&&section[at].startsWith('|'))rows.push(section[at++]);if(section.slice(at).some(l=>l.includes('|'))||section.slice(0,first).some(l=>l.includes('|'))||section.slice(at).some(l=>l.trim()))fail('extra matrix or malformed multiline row');const cells=l=>{if(!l.endsWith('|'))fail('unterminated row');const c=l.slice(1,-1).split('|').map(v=>v.trim());if(c.length!==4||c.some(v=>!v))fail('four nonempty fields required');return c};if(JSON.stringify(cells(rows[0]))!==JSON.stringify(['AC','档位','具名原件','原义范围、原因及owner']))fail('exact four-column header required');if(rows.length!==13)fail('exactly eleven data rows required');if(!cells(rows[1]).every(v=>/^:?-+:?$/.test(v)))fail('separator invalid');const allowed=['pass','fail','inconclusive','deferred','missing','inconsistent','incomplete','unavailable'];const data=rows.slice(2).map(cells);const ids=data.map(c=>c[0]);if(new Set(ids).size!==11||ids.some(id=>!/^AC-(0[1-9]|1[01])$/.test(id)))fail('AC-01 through AC-11 exactly once required');if(data.some(c=>!allowed.includes(c[1])))fail('invalid evidence vocabulary');console.log('ORACLE-P11-FINAL-ACCEPTANCE ok rows=11');"`
- **oracle**：ORACLE-P11-FINAL-ACCEPTANCE
- **evidence_path**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-416-p11-final-current-acceptance-delta.md`
- **STOP**：某条 AC 缺证据或证据不可读时，该条记非 `pass` 并写缺口、影响与负责人；不得读成通过，也不得为了让结论好看而重跑或放宽判据。修复人：本 Phase 实施者。
- **覆盖 AC**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11
- **Done**：当前独立增量为9条限定pass/2条incomplete：AC10异源计划身份/逐点覆盖不足、AC11历史及87/88未机核仍缺。012只确认501实际展示的准备内容，不冒完整C09或全质量通过；旧416/469保原时点，当前事实见012后小结。

## 工作包声明（人读事实）

- **读集**：当前spec Appendix A及本聚合具名来源；394/408/409为当前补证；未取得的历史原独立全文/历史事实明确记缺，不以“全部”声明冒全读。
- **定序写主**：本 Phase 是验收记录的唯一写者；`spec.md` 与 `facts.jsonl` 的回写归 verify-code 终末，本 Phase 不改。
- **接口符号清单**：N/A — 汇总判定。
- **合并责任**：本 Phase 实施者提交并处理冲突。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`。

## 速读卡（人读）

- **本 Phase 结果**：一张按 AC 逐条给结论的验收记录，每条带一条能重放的命令或原件。
- **非目标**：不重跑全量、不改判据、不回写 spec.md；理由是全量重跑与判据改动都要用户或独立审查授权。
- **改动前**：各 Phase 各自收口，没有跨 AC 的统一结论。
- **改动后**：11 条 AC 各有档位与指针；未通过的有原因与负责人。
- **与相邻 Phase 的边界**：P1～P10 产证据与本 Phase 判定；本 Phase 不产新实验。
- **主要风险**：把 incomplete 读成 pass。返工时替代走法：保留缺口、写负责人，不重跑到绿。
- **下一步**：verify-code 终末复核；用户决定是否进入下一阶段。
- **动手前必读**：`spec.md#Appendix A` 全节、`skills/spec-plan/templates/phase-template.md:225-257`（验收 Phase 13 项）。
- **未决事实**：AC-02/AC-03 依赖目标仓与设计源服务，若 P3/P4 未执行则本 Phase 只能给非 pass。

## 本 Phase 材料导航（人读）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#Appendix A` | 取每条 AC 的判据 | 开工前 |
| P1～P10 证据原件 | 逐条取证据路径 | 开工前 |

## L0 — 结果与变更

交付一次覆盖全部 AC 的终末验收。它不重做实验，只消费前十个 Phase 的原件并补必要未闭环 case。

- **结果**：11 行 AC 结论，每行档位加证据指针。
- **非目标**：不重跑全量、不改判据、不回写 spec。
- **与其它 Phase 的区别**：其它 Phase 产证据，本 Phase 判结论。

## L1 — 可执行契约

### 文件边界

- **新增**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-416-p11-final-current-acceptance-delta.md`；旧P11矩阵及两就绪件immutable只读，当前部分就绪沿349/350，不覆旧件。
- **修改**：N/A。
- **禁止改动**：`spec.md`、`decision-log.md`、P1～P10 原件、冻结测试。

### 任务顺序

T014 单卡：入口准则 → 两件就绪件状态 → 逐 AC 结论 → 五类执行事实 → 六项结论。

### Task graph 与纵向切片

一张卡切穿“前十个 Phase 原件 → 逐 AC 结论 → 用户与 verify-code”，形成可独立演示的窄增量。

### 测试策略

- **命令面**：现有scoped API以 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-367-final-current-scoped-bounded-verify-input.json`、tests233原回执及368回读为已执行来源；保reviewReadScope/phase_id/changeScope显式输入。旧125无scope仅历史；本次换报告路径门另保实际新回执，不冒整任务语义通过。
- **人工读面**：只能人读的 AC（03、05、06、07、08、09、10）由未参与实施的人判断。
- **不适用面**：不做浏览器端到端（两页是空壳，理由在 spec 测试标准）。

### 覆盖边界

- **覆盖上限**：只能确立“本任务交付到哪”，不能确立 C09 效果或产品达标。
- **显式不覆盖**：正式对比、最终验证阶段。

### 停止

某条 AC 缺证据时记非 pass 并写缺口；不为结论好看重跑或放宽。

### 完成

11 行结论、就绪件状态、五类执行事实、六项结论齐；未通过的写明原因与负责人。

### 风险与回滚

- **风险**：把 incomplete 读成 pass。
- **影响**：虚假完成。
- **缓解**：档位只引用既有 8 值词表；非 pass 一律不计通过。
- **回滚**：改结论不改原件。
- **触发条件**：出现无证据的 pass。

### 交接知识（给下游 Phase 与审查的已核实事实）

- AC 判定方式分三类：机器可判、只能人读、需真实环境+用户在场（spec Appendix A 已标）。
- 本 Phase 不回写 `spec.md` 的 AC 表；回写归 verify-code 终末。

### T014 — 逐 AC 终末验收记录

- **Source / FR / AC**：R-021 与各 Phase 的来源；FR-REPAIR-001、FR-BASELINE-001、FR-TARGET-001、FR-SAMPLE-001、FR-NODRAFT-001、FR-METRIC-001、FR-EXTERNAL-001、FR-READY-001、FR-HANDOFF-001、FR-FREEZE-001、FR-EVIDENCE-001（各域代表）；AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11。逐条结论、档位、证据指针。
- **Files / symbols**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-416-p11-final-current-acceptance-delta.md`；symbol：N/A — 验收记录。
- **Action**：①先在认证 worktree 跑一次 `node tools/cli/check-stage-steps.mjs --stage=build-plan --task-path=<任务目录>` 并读回输出；②核入口准则：逐条核对前十个 Phase 的 Done、写入集落地与两件就绪件状态；②写数据就绪件与环境就绪件的状态；③逐 AC 一行：编号、档位、一条证据路径、未通过原因；④写五类执行事实；⑤写六项结论（评估与局限、偏差、未充分测试项、未解决事件、残留风险、签核对象）。
- **Inputs**：前十个 Phase 的 Done 与证据；`spec.md#Appendix A`；两件就绪件。
- **Outputs / failure**：验收记录；缺证据的 AC 记非 pass。
- **Boundary / DO NOT TOUCH**：spec.md、decision-log、上游原件、冻结测试。
- **Dependency**：P1～P10；没有原件无法判定。
- **Test tier / skill**：命令面 + 人工读 / spec-analyze。
- **Scenario / fixture or service**：正例＝每条 AC 有证据路径；反例＝无证据写 pass（判失败）。
- **预写测试**：无测试文件；客观替代为 gate 断言（11 行）与逐条人读。
- **可观察接缝**：P1～P10 原件 → AC 结论 → verify-code 与用户；我是怎么知道的：`spec.md#Appendix A` 与各 Phase Done 实读。
- **RED/GREEN gate_cmd**：`node -e "const fs=require('fs');const s=fs.readFileSync('/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-416-p11-final-current-acceptance-delta.md','utf8');const fail=m=>{throw Error('ORACLE-P11-FINAL-ACCEPTANCE '+m)};const lines=s.split(/\\r?\\n/);const starts=lines.flatMap((l,i)=>l==='## 原AC一条一结论'?[i]:[]);if(starts.length!==1)fail('target heading must occur once');const start=starts[0]+1;let end=lines.findIndex((l,i)=>i>=start&&/^#{1,2} /.test(l));if(end<0)end=lines.length;const section=lines.slice(start,end);const first=section.findIndex(l=>l.startsWith('|'));if(first<0)fail('matrix missing');const rows=[];let at=first;while(at<section.length&&section[at].startsWith('|'))rows.push(section[at++]);if(section.slice(at).some(l=>l.includes('|'))||section.slice(0,first).some(l=>l.includes('|'))||section.slice(at).some(l=>l.trim()))fail('extra matrix or malformed multiline row');const cells=l=>{if(!l.endsWith('|'))fail('unterminated row');const c=l.slice(1,-1).split('|').map(v=>v.trim());if(c.length!==4||c.some(v=>!v))fail('four nonempty fields required');return c};if(JSON.stringify(cells(rows[0]))!==JSON.stringify(['AC','档位','具名原件','原义范围、原因及owner']))fail('exact four-column header required');if(rows.length!==13)fail('exactly eleven data rows required');if(!cells(rows[1]).every(v=>/^:?-+:?$/.test(v)))fail('separator invalid');const allowed=['pass','fail','inconclusive','deferred','missing','inconsistent','incomplete','unavailable'];const data=rows.slice(2).map(cells);const ids=data.map(c=>c[0]);if(new Set(ids).size!==11||ids.some(id=>!/^AC-(0[1-9]|1[01])$/.test(id)))fail('AC-01 through AC-11 exactly once required');if(data.some(c=>!allowed.includes(c[1])))fail('invalid evidence vocabulary');console.log('ORACLE-P11-FINAL-ACCEPTANCE ok rows=11');"`
- **expected_exit**：RED nonzero（断言失败）；GREEN 0；证据型卡若无既有分支，RED 记 unavailable 并写原因，不伪造。
- **RED target failure**：ORACLE-P11-FINAL-ACCEPTANCE 断言：验收记录必须含 11 行 AC 结论；改动前原件不存在，记 unavailable 并写原因。
- **RED 证据**：unavailable — 无既有行为分支；客观替代为读回断言与逐条人读。
- **GREEN 判定器**：ORACLE-P11-FINAL-ACCEPTANCE 与头部同一字面命令退出 0；唯一精确“原AC一条一结论”节内唯一四列表、恰 11 数据行、AC-01～AC-11 各一次，四字段 trim 后非空，档位沿既有八值并允许 incomplete，不要求全 pass；拒绝重复目标标题、同节重复表、额外第 12 行、重复/漏号、空字段及多行或 pipe 畸形单元格，不忽略畸形行。其它节合法 AC 说明不参与计数；未通过原因/owner/具名证据有效性仍逐条独立人读，不以结构通过冒语义通过。
- **Evidence**：`quality/evidence/P11-final-acceptance.md`。
- **覆盖上限**：只确立本任务交付状态。
- **STOP / recovery**：缺证据即记非 pass，不重跑到绿。
- **完成**：11 条 AC 有结论与指针；未通过写明原因与负责人。

### 本 Phase 自带判据小结（真实收口整理，不是全任务完成）

- **012后当前事实**：用户对501实际展示内容答复“确认，继续”，原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-012-verify-code-preparation-content-confirmed.json`；当前独立判断 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-current-preparation-after-012-independent-verdict.md` 为9限定pass/2incomplete。AC07准备逐项判断与AC08五类直接指针回读限定满足；AC10用户子条件补齐，但异源身份/逐点计划覆盖仍不足，整体incomplete；AC11机器87/88 complete=false与历史欠账仍在。旧469、416及以下012前判读保各时点，不回填旧质量或产品效果。

- **本轮九格来源修正**：当前唯一收敛清单读decision-log现指针 `quality/evidence/2026-10-26-498-current-convergence-checklist.md`；旧310/461及原清单保原时点。仅补来源定位，不改parser/AC判据；331真实报告87/88字段present、仅包5消费者未机核，complete=false，328命名路由失败保原；不冒历史11/11。历史0/60、原RED/全文及整体AC11欠账保留。

- 已验当前：233 scoped API exit0及367/368来源、当前P7两code recorded对账事实；125旧unavailable仍历史。
- 已验历史：121检查器 exit0 仍报12未留痕/unknown；122旧结构CLI usage失败 exit1（不是目标RED），保原。125经批准有界API结构 exit0、完整11Phase/14Task，但未传phase_id/changeScope，实际diff写集对账 unavailable；不等全仓aggregate/triageSkipReasons。128正式新gate原位合法矩阵 exit0；129/140合法含incomplete与表外说明 exit0，130–139重复替漏/空三字段/12行/双标题双表/续行/pipe/未闭合各真实exit1。原输出见TASKROOT `quality/tests/2026-10-26-121-p11-build-plan-steps.json` 至相应125/128–140具名回执，确切fixture与命令见 `quality/evidence/2026-10-26-239-p11-tcr-counterexample-input.json`；不冒历史事前RED。128在127逻辑验证后、native补采前，未改原位字节，无需重跑恢复。
- 独立质量：054 codex有效major经230独立TCR批准、原材料owner232/233修命令；父中继原feb定向技术核支持fixed，仅结构oracle。`quality/evidence/2026-10-26-242-p11-independent-fixed-parent-relay.md`是摘要非独立全文，原报告仅父消息；ST/SP也只父中继不冒本owner已读全文。054 kimi connectionerror保真实失败、coverage undetermined/read_confirmed未知不改，不称全轴或阶段pass。三件当前hash见241。
- **012前历史判读**：没验与条件：当前AC03/06/09准备范围分别由394/408/409新独立原件承接；AC04仅新交接合同，历史业务仍未执行。AC06仅H1八critical局部消费，不冒N52/M238全局或产品norm批准。AC07/08/10用户内容未确认、AC11历史不可补证；准确条档位/owner见当前416聚合，不把新补证回填原072审查。
- 写集与影响：本owner只三件外置P11及本卡Done/小结与认证原件；卡7/110/114方法修归原材料owner。生产、spec/index/decision-log、P5和上游不动，未Git写、不生成stage-handoff。规范同步已实际读取路由并执行无变化判读，原件 `quality/evidence/2026-10-26-243-p11-norm-sync-no-change.md`；现验收专业源已承接原始件/未知/独立判断，无新通用规则或经验迁移项，不改专业源/索引或退役未解规则。
- 下一消费者：父转原1f最后增量核后再决定五材料限定提交；当前不Git、不宣阶段完成，最终stage-handoff只由主会话按真实状态生成。

## L2 — 可删除参考

各 AC 的历史讨论可删；删除不改变 L0/L1。
