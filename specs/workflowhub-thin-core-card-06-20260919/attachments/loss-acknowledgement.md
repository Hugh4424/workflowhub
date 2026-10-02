# P5/T016 损失清单（待用户过目确认）

当前状态：**草稿；四项真实用户答复均 pending。** 本件只准备原有四项选择，不代表用户已接受，也不授权公共入口切换或引擎删除。T017 尚未开始；没有针对本清单的真实确认记录。

批前本地标签 `backup/card-06-b4` 已由主会话在干净工作树、HEAD `6da46d6d4fc4060ce83944781bb856ec7379d124` 上创建；本件是 T016 声明的首个源码新写入。标签是回退依据，不是用户批准或质量通过。

## 四项损失及缓解

| 项目 | 将失去什么 | 缓解与仍不能承诺的部分 | 用户实际答复 |
| --- | --- | --- | --- |
| 1. 自动拒绝错绑或过期证据 | 删除通用事实引擎后，不再用材料哈希、快照自动判定每份测试或审查证据属于眼前版本。测试前后自动快照比对也退役（G3-09），不能再自动发现测试命令改动被测代码。 | 真实运行有范围的验收，保留单份原始输出、实际命令和退出码；核实际源码、直接消费者、Git 提交和覆盖限制，独立审查不把旧 GREEN 当当前通过。不可逆 Git 动作仍核授权分支、当时 HEAD 与当前 HEAD。HEAD 不能发现尚未提交的字节变化，也不替代所有材料和证据的版本核实。 | pending；未记录接受、拒绝或部分接受 |
| 2. 跨宿主证明“此答复批准此版本” | 四 revision、展示稿哈希及跨宿主回复认证链退役（G3-18）。另一个宿主不能仅凭有答复，自动证明它批准的就是眼前稿件。 | 先展示完整可审稿，记录真实回复、材料路径与当时 HEAD；实际内容变化影响原选择时说明具体差异，再取得需要的选择。已有授权覆盖同动作和范围时继续有效，针对当前 HEAD 记录与消费；HEAD 不一致拒绝旧授权记录，不能拿旧批准冒充新稿批准。不对全部稿件恢复机器哈希绑定。 | pending；未记录接受、拒绝或部分接受 |
| 3. 跨宿主自动恢复精确执行现场 | 旧 bridge/session、恢复对象和历史认证链不再自动接回上一次完整执行。 | 每阶段末保留人读交接；新宿主读当前材料、实际 facts、源码与 Git，核已做、待做和失败。窄工具在已声明范围内保留锁、同 step 幂等及重放拒绝；批前 Git 标签与非破坏性 revert 提供回退。不能承诺不检查就自动续跑，也不能重放结果未知的外部动作。 | pending；未记录接受、拒绝或部分接受 |
| 4. 机器可查的完整阶段状态 | 旧完成谓词、投射和认证状态引擎退役，不能再由它自动证明整阶段已完成、所有证据仍当前。 | status 继续读取基本 task/facts、材料存在性及当前 Phase/Task 游标；游标只定位续跑，不证明完成。测试、外审、用户选择、Git 与物理交付分开报告，缺失质量按真实结果标 unknown/incomplete。Git 游标只有材料提交变化才 stale；未提交的材料变更不会自动使它 stale（T022 的既定取舍）。Card-08 回读保持已定职责，不能把未来改接写成已验证。 | pending；未记录接受、拒绝或部分接受 |

G3-09 纳入第1项；G3-18 纳入第2项。未提交材料不使 Git 游标 stale 是第4项已定取舍。这些说明没有增加第五项决定，也没有改变原问题的四项范围。

## 真正的安全保护不在可接受损失中

本清单不接受安全保护被删除或弱化：原子写与锁；真实路径包含、symlink/nlink/realpath 拒绝；不可逆 Git 的分支/HEAD 核对、单 step 消费与重放拒绝；close 允许按实际范围捕获计划前的 dirty 源，保留计划后源漂移与脏目标拒绝、sidecar 发布、失败传播、merge abort 与只清理本次拥有的资源；审查输出解析、128KiB 上限、外发脱敏、取消后事实 flush 和 provenance；用户配置原子写与防覆盖；Multica 的 dirty/origin、I_CONFIRM、确认后重新审计、snapshot 漂移拒绝及写后读回。它们由既有实体或窄工具承接，P5 真实消费者改接后仍需实核和修正。

当前准备证据的边界必须保留：

- close/workspace 的6项 native 检查与3个既有定向 close/mini case，共9项，已有真实基线；都是隔离夹具，不是实际任务授权、真实远端交付或未来 P5 整条执行链通过。
- 当前公开 status 在缺少质量事实的隔离样本中显示 `in_progress`、work=`ready`；所要求的质量 `unknown` 尚未证明，T017 必须在真实新消费者上核实，不能称当前已满足。
- 实际材料入口的普通文件正例通过；同路径 symlink、nlink=2 hardlink、祖先目录 realpath alias均真实拒绝。只证明这些选定路径样本，不代表所有路径或全部 pipeline 已安全。
- 当前实际 provider-facing 材料 bundle 未剥离合成 `api_key` 和 Bearer 标记，原证166保留真实断言失败。公开 pinned URL 也有原证162的真实误脱敏失败。URL credential/query 标记因整个 URL 被错误替换而消失，不能当作秘密保护通过；未知外部 broker是否另有保护仍是 unknown，不能替本机入口背书。后续按既定 NARROW 的真实生产者与消费者处置、实核并修正，不把安全缺口混进四项损失让用户接受，不借修复恢复旧认证机器。

## 当前证据与准备时点

原始件只引用，不复制测试输出、报告或目录：

- 批前标签：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-06-20260919/quality/evidence/card06-batches/2026-10-02-p5-b4-before-loss-draft-tag.json`。
- close/workspace：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-06-20260919/quality/tests/2026-10-02-p5-close-workspace-native-baseline.json`；close/mini：同目录 `2026-10-02-p5-close-mini-current-baseline.json`。
- status：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-06-20260919/quality/evidence/card06-batches/2026-10-02-p5-public-status-empty-quality-independent-baseline.json`。
- 定向准备与 count/time：同目录 `2026-10-02-160-p5-survivor-preparation-baseline-binding.json`；TaskStore/terminal：`2026-10-02-161-p5-native-records-preparation-baseline-binding.json`；公开 URL：`2026-10-02-162-p5-public-url-redaction-failure-baseline-binding.json`。
- 材料路径与合成秘密：同目录 `2026-10-02-166-p5-material-entry-path-secret-baseline-binding.json`；单独 realpath 分支：`2026-10-02-167-p5-material-entry-realpath-branch-binding.json`。

160 的 Card04/Card06 count/time 是准备时点事实，不是当前值，更不是“正式确认后已采基线”。Card04 真实任务目录已核，旧 A3b 虽归档在 Card03 材料中，统计对象确为 Card04。用户真实确认后，再由主会话按 T016 的同口径采当时当前 count/time；本次不重采。

当前 T016 原文所称 `loss acknowledgement` 命名 ledger case实际不存在；151/152技术候选虽已独立认可，尚未应用。不能用空选/跳过测试的 exit0 代替四项真实回复。本件按纯材料 G2 读回，未运行该命令，也不新增 oracle、gate 或运行对象。

## 用户待决定的范围与停止点

一次明确回复可覆盖完整四项，无需制造四轮问题。原两个可选方向不变：

1. 接受上述四项损失及所列缓解，按已定计划继续 P5。代价是宿主必须读真实来源和结果，不再依赖旧跨宿主自动认证；这不接受真实安全保护损失。
2. 暂缓 P5 切换与删除，指出仍需自动保证的具体一项。当前源码与历史原件保留，先给有限修正的代价与风险，不自行恢复退役控制面或改冻结处置。

**STOP：真实用户未确认完整四项，不能进入 T017，也不能删除引擎。** 只同意部分、回复含糊或未答时，逐项保持 pending并说明缺什么；不得默认为全部接受。本件不是 build-code 整体验收、质量通过或 push/merge/archive/cleanup 授权。真实答复到达后由既有 human-confirm 记录，不在本草稿伪填确认。

## 与先前 brief 的语义差异

先前外置 brief `2026-10-02-p5-t016-four-loss-confirmation-brief.md`（SHA256 `67023214dca68d6b24e49368e2ac01dbdc2b937d4710739903cc72c4afc26dc3`）保持历史原件不改。这里更新为正式 SD 路径的可审查草稿，说明 P4 已提交、b4已建立、已有准备基线及实际安全失败/未覆盖；旧 brief 的“未采基线”等文字仍代表它的生成时点。四项损失、缓解含义与两个选择不变；没有新增用户决定范围，也没有新增批准事实。

来源：本任务 `decision-log.md` ADR-017（751–762）、ADR-020（804–809），`spec.md` FR-30/AC-30，`phases/P5.md` T016/T022，以及主迁移表 G3-09/G3-18。以上契约未在本次修改。
