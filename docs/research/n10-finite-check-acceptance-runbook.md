# N10 原36AC验收重跑

本入口消费P1–P6首次验收和后修原件，复核当前CLI接线，首次核SET4/5。GREEN只说明本次逐条证据有效，不是独立质量通过或追加磁盘四AC完成。唯一判据为`specs/archive/n10-finite-check-wiring-20261020/spec.md` Appendix A。

## 命令与输入

在认证worktree执行：

```bash
N10_TASK_ROOT=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n10-finite-check-wiring-20261020 npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs
```

- gate_cmd：上面具名Vitest入口；oracle：`ORACLE-N10-FINAL-ACCEPTANCE`。
- evidence_path：外置任务`quality/evidence/n10-finite-check-wiring-20261020/2026-10-21-051-p7-p7-final-acceptance.json`（077修后当前真实原件）。同字节复用，变化时追加唯一新原件并在stdout返回真实路径，旧报告不覆写。
- 当前实施基准：`0c3087580f841d3e38c249466462351c0a3a019e`；常驻文档“改前”基准：N9合入、P1未实施的`b8856e5ef5f18e67b51e9660c662d52efc174a1b`。代码不计常驻文档分母；新增runbook与治理材料另列，不藏字节。
- owner：T033作者维护测试/runbook；T034只读执行和读回；verify-code独立复核。P1–P6问题回原Phase owner，P7不改冻结测试/生产代码。
- 输入必须是同任务真实原件。P1汇总还需039修复、041审查范围解释；P3还需062/063/065/067；P4需071四态与真实读回；P5需077及真实完整stdout；P6需当前Done-after-073-074、074repair/green与probe。旧summary的pending字段是历史时点，不能覆盖后续事实。

## 实际执行与档位

验收器运行当前无参数六段、显式当前材料六段＋材料段、真实`--task-path`单JSON三条CLI；消费上游合法/负例/恢复的原始回执和输出，逐条保留hash、执行argv/cwd/exit/signal/timeout与owner。六条人工读回不伪装机器语义验证。其余已验上游集合不无理由全量重跑，不造目标RED。

输出包含36份`raw/AC-*.json`、聚合、两份就绪件、常驻字节表、13项记录与六项结论。原输出保存任务证据，先比字节后复用；变动使用现有appendRecord追加。没有新报告schema、公共命令、facts字段或第二进度。

fail/inconsistent使gate非零；缺件、timeout、材料恢复不一致停对应路径并保原失败，不改判据凑绿。命令超时120秒只针对本机CLI，不是审查provider等待政策。GREEN不替代独立OCR或同源补充。

N9十环报告有十行不表示十行completed。SET3/6只按原接口/缺环/参数判据；实际completion与各环状态留原件。RC2严格carrier仍未修，PROCESS8只消费真实一次探针与未解最小设计；不冒完整review/300秒五窗口。N8历史P7四路按用户决定不再跑；归档不改。P8四AC本轮未实施，不出pass。

## 字节、清理与失败交接

SET5用`git show`改前字节与真实`wc -c`改后输出逐文件给分母、增减、理由；**本卡不声称严格不增**。figure-it-out四条正文只在verify-code，stage-reflection保持指针。17来源、10机制、figure单项分别计数。

正常36AC的CLI不创建临时根、不改真实材料；077/TCR2私有控制负例创建少量owned输入根并finally清理，collector未计总数（null不冒零）；上游临时夹具恢复由其原件承接。运行前后在内存比spec、decision、catalog与N8两归档SHA；不保存工作树快照或目录清单。浏览器不适用，无登录态复用；测试工具是Vitest/Node CLI/wc/git只读。

缺件交原owner补真实原件后重跑受影响路径；P7测试缺陷回T033同会话修；冻结测试变更必须先原Phase TCR。首次失败原件保留，修后GREEN不改写历史。本Phase正式084三路已完成、075/076同源两轴及9项发现按077/085处置，原文与覆盖限制保留；root接完整实际diff、逐AC结论、56来源映射及修复原件，记录既有事实并审后Git，不重派084。最终40AC对账在P8后进行。

## 失败记录修复与当前原件

077窄TCR先等价提取，原36 P2P后取得真实缺P6/真实spawn超时的两条目标RED，再修collector及发布前判定；109独立复验38pass。输入缺件不等于上游行为失败；没有执行的AC保持missing/incomplete，timeout为inconclusive，不用空结果写error0/读回完成。恢复collector不冒36AC通过；合法36P2P另有真实执行。

旧未编号`P7-final-acceptance.json`是081期间空results/六入口pass的历史错件，保留不覆写，不能用它验当前结论。当前仅引用上方011真实ref；以后从stdout的aggregate_ref取得实际新件，不新建latest指针或进度账本。109/085空stderr的跨命令复用限制与084其余发现保留，质量未完成；后续执行者复用前同时核命令/退出事实和字节，不为此单独重跑。

## 085修复与最终读取

最终130独立回执、127 stdout、128新stderr、129原生JSON：75pass＝F2P37＋P2P38，当前原36AC聚合为上方051真实ref。112为必要上游具名复核32pass＋唯一指定skip，仍归原owner；CHECK6消费001/003双文件及三具名失败、skip真实名字/原因，不把数字当身份。METHOD1消费071完整19行及有效行段；六AC绑定实际case状态，SET6核同ring缺失与字节恢复。

命令输出仅在真实argv/cwd/exit/signal/timeout/stream均相同且字节相同时复用；无法证明归属保新件并说明unknown。新独立capture不再复用跨命令空stderr；旧085/109已引用原件和限制保留。通用报告immutable不替代命令归属判断，不增dedup ledger。receipt和machine_ref在读bytes前核当前任务quality真实范围，owned越界与symlink拒绝。

actual HEAD仅执行事实；BASE为P7实施参考，BEFORE为字节基准，不作HEAD相等/祖先门。SET5实际字节输出返回值直接进入现有resident_bytes_ref，旧040 null不覆写。当前审查与修复工作收妥，原provider findings不改为空，覆盖unknown/undetermined保真；P8四AC未启动，最终40仍在P8后。
