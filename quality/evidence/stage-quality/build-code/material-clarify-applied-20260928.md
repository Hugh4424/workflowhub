# CARD-04 本批材料纠偏（2026-09-28）

仅改认证 worktree 的 `spec.md`、`phases/P4.md`、`P6.md`、`P10.md`、`P11.md`、`phases/index.md`；未改生产代码、测试、Task facts 或历史原件，未提交。P5 零例外问题未获用户答复，本批没有改 P5、decision-log 或零例外规则。

| 位置 | 本批纠偏 | 仍缺的实际执行 |
| --- | --- | --- |
| P4/T006 | 现行就近测试为七项，旧五项只作历史；无 U/V 索引时 `source_ids=[]` 合法。单独规划 `tests/contract/post-acceptance-chain-source-index.test.mjs`：读当前 decision-log/spec 中 AC-29 的 `U-006-01..06`，先由 move-map owner `status:add` 登记，再做清空已认证 ID 必红、恢复必绿，旧七项只读。 | 新测试尚未创建/运行，负控尚未执行；本批不称 P4 完成。 |
| P10/T021 | 明确旧“仅接口/无产品授权”段为历史；现行私有代码已有实现。给官方 `runOfficialStage` 发布后私有点与 `freshness.mjs` 只读认证登记窄写面：把**P10 本次**新阶段行、P10 测试回执和逐 AC 质量事实同源绑定，再由 `case-reconciliation.mjs` 读取。禁止借 P5 证书、改固定阶段行、用同树旧回执假绿。 | 同次来源尚未实现/验证，业务效果仍 unknown。 |
| P11/T022 | 现有 aggregate reader 可核浏览器原始 ref/hash，但逐 AC fact 仍可能漏浏览器项。计划按 handler 原始 browser items 算覆盖候选→writer 先 aggregate 再逐 AC→reader 独立重读的单向次序，避免读取尚未发布的投影。后台仅按扩展名判 N/A 的分支改为消费已认证后台→页面关系；关系未知记 unknown。 | 逐 AC 修复与真实页面/服务浏览器检查尚未做。 |
| P6/AC-17..19 | `spec.md` 旧“样例没有”改为实际证据边界：17/18 有独立复核窄样例；19 的独立纯文档 Task 可失败检查样例层成立，裁决原件 `P6/T027-current-independent-verdict-20260928.md` SHA-256 `144e3b617ce586fe25d1bd264322431acfbd2dfa0cad1f17326373cc89e58010`。 | P6、样例 Task 交付/关闭和 CARD-04 整体仍未完成。 |

`phases/index.md` 只同步上述 Phase 的路径、职责、写面、依赖和消费者指针。此批材料变化会改变当前材料 revision，并使 P8 catalog 对 P6 规则来源的旧 SHA 失效；待材料稳定后由 P8 owner 核语义再重绑。旧正式测试/审查收据是旧材料版本，不能直接宣称本批当前版通过。

本批符合宪法 F1/F2/F3/F8/F9/F11、Q1/Q2/Q3 的方向：复用既有 stage/Task 原件与 reader，缺同源事实维持 unknown，review 保留独立判断；新增 P4 测试先登记唯一 owner/consumer/delete_condition，不增公共命令、stage、gate 或第二进度账本。结构检查见本页后续附记；正式 build-plan 完成与完整 build-code 均未宣称。

## 定向结构检查

- `node --input-type=module -e '<六材料/四索引指针及关键边界检查>'`：exit 0，输出 `six materials and four pointers/guards: OK`；只核文件存在、换行、P4/P6/P10/P11 指针和本批关键文字，不替代语义审查或行为测试。
- 独立 AC-19 裁决文件重算 SHA-256：`144e3b617ce586fe25d1bd264322431acfbd2dfa0cad1f17326373cc89e58010`，与引文一致。
- 六份当前材料 SHA-256：`spec.md=38bc36f7944549e39f8ef51d37ad7d1029598e4805b18a24a4d6810516e9daa9`，`P4=b56eb1347be8e0881d0b76c79bb0a2827e8d4ee58db4f592942c84d7a1814beb`，`P6=35b15b6739106d5f4e2ac8e2e0f69b3c1b365f81ce45bf4efcfd9471b85967c3`，`P10=3dc2f00ed5e1f4ffca8d104482ec7004f6c53f1ddcac783d41739ddec5010244`，`P11=8814c821f22cf9157ea7d3ca0f8d0fa6aee649e440b707821bbcb9de74b5a769`，`index=ff2bb7b8933407ae46436c0c372c80451f61e853c4bbedad22161388b4eb8337`。
