## Appendix A — 验收判据（唯一权威）

本节是 73 条验收判据的唯一权威：AC 编号、判定方式三词、验证、环境与数据、谁判、承接、成本七字段、通过、失败与证据只在这里写；正文、decision-log 与 Phase 卡只引用编号。

判定方式只取三词：`机器可判`（本任务内一条命令可重放真假）、`只能人读`（判据是语义可用性，命令输出不构成结论，由独立执行单元按协议复读）、`需真实环境，可用自动化采集判`（真实外部环境产生判据，执行单元自动取回并留原件）。
落点里的 `phases/P<包>-<短名>.md` 是 build-plan 的目标路径，当前任务材料下 `phases/` 尚未生成（真实缺口，owner＝build-plan 作者）：卡未出时落点只到 `P<包>/T<任务号>`，Phase 卡出后按同名路径回填，不另建第二份判据。
受限状态：P4 的真实自动作业与对外传输**未交付**（用户已批：只写方法要求，真实行为记 `incomplete`），故 P4 各条只判方法文本与既有契约，不冒充已验；P12 只有 C2 现在修，C1/B2/B3/C3/D1 为 blocked，各自写 owner、缺什么与恢复条件。
具名缺口：`decision-log.md#包级收敛台账` 在本决策日志中**不存在**（只有第 957 行把它写成待落目标）；它同时是 P8 接线与 P9 硬门的环——该节 owner 是包 13，而包 13 又依赖 P9 提交。相关判据（AC-P8-002、AC-P9-003、AC-P9-005）对此只记具名 `incomplete`，不判过、不假装存在。

### A.1 包 1 — 规则归属与入口（AC-P1-001 .. AC-P1-007）

- [ ] **AC-P1-001**：在任务工作区内不带显式身份跑只读入口 `status`，退出码为 0，且输出不索要 `--project` 与 `--task`。
  关联 FR-CODE-P1。
  判定方式：机器可判；判定时点：P1 实现提交后、合入前。
  落点：P1/T003 与 `phases/P1-规则归属与入口.md`。
  验证：从任务工作区 `<任务根>` 起跑 `node tools/cli/stage-runtime.mjs status`（记录完整命令、stdout/stderr 与退出码）；再在同一目录跑一次显式带 `--project` 与 `--task` 的同命令作对照，比较两者退出码与 workspace 字段。
  环境与数据：本机 Node（仓内既有版本）、真实任务工作区 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-code-20261124`、HEAD `b25626ca` 非浅克隆；工作区不在本机时记 `unavailable`，原因写缺哪个真实任务根，恢复条件＝提供该根或换一个真实任务根。
  谁判：未参与 P1 实现的独立执行单元，在 P1 提交后只读真实命令输出。
  承接：结论写 P1/T003 的完成记录与 `quality/tests/p1-read-entry-green.output`；原件由执行者发布。
  成本：executor=独立执行者；estimate_min=8；hard_cap_min=20；resources=仓内 CLI、真实任务工作区；observation=退出码、是否索要显式身份、workspace 指向；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内 `tools/cli/stage-runtime.mjs` 与真实任务工作区，不新造夹具、不改任务事实。
  为什么不能再简：再简只剩「命令能跑」，判不出「不要求显式身份」与解析结果是否落回当前任务。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：退出 0；输出未出现 `IDENTITY_MISSING`/`IDENTITY_INCOMPLETE`；workspace 指当前任务。
  失败：把 `tools/cli/stage-runtime.mjs` 的只读分支改回强制 `--project` 与 `--task`（恢复 P1 前预检），同命令必须退 1 并报 `IDENTITY_INCOMPLETE`；若仍退 0，本条判失败。
  证据：quality/tests/p1-read-entry-green.output。

- [ ] **AC-P1-002**：在主线目录用显式身份指向另一任务时，`stage-runtime status --action=begin` 与 `task-close status`（不带 `--action`）都退 0，且两者 task_id 与 quality_status 相同。
  关联 FR-CODE-P1。
  判定方式：机器可判；判定时点：P1 实现提交后、合入前。
  落点：P1/T003 与 `phases/P1-规则归属与入口.md`。
  验证：`cd` 到主线目录 `/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-code-20261124`，用同一显式身份跑 `node tools/cli/stage-runtime.mjs status --action=begin` 与 `node tools/cli/task-close.mjs status`，逐字段比较退出码、task_id、quality_status。
  环境与数据：本机 Node、主线目录、另一个真实任务根（只读使用，不写）；task-close 不认 `--action`，命令形状必须按实际接口写，不补猜测参数。
  谁判：未参与实现的独立执行单元，在同一台机器同一提交上跑两条命令。
  承接：结论写 P1/T003 完成记录与 `quality/tests/p1-two-entry-ambiguity.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=两入口 CLI、另一真实任务根；observation=两入口退出码与 task_id/quality_status 两个字段；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内两入口与真实任务根，不新造第二任务库。
  为什么不能再简：只比退出码会漏掉「同结论」这半条，两入口可能都退 0 却指向不同任务。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两入口退出码 0，task_id 与 quality_status 逐字相同。
  失败：把 `core/task-close.mjs` 的收口判定切成只认收口模式（或让 `stage-runtime.mjs` 只读走收口模式），同输入必然一边退 1、一边退 0，本条必须判失败；此时若判通过即口径被弄反。
  证据：quality/tests/p1-two-entry-ambiguity.output。

- [ ] **AC-P1-003**：三组坏输入在两入口得到同一具名错误码：只给 project → `IDENTITY_INCOMPLETE`；`--task-path` 指另一任务库或别处 storage root 的同名镜像 → `TASK_PATH_MISMATCH`；既无显式身份也推不出 → `IDENTITY_MISSING`。
  关联 FR-CODE-P1。
  判定方式：机器可判；判定时点：P1 实现提交后、合入前。
  落点：P1/T003 与 `phases/P1-规则归属与入口.md`。
  验证：三组输入各跑两入口共 6 次（命令形状同 AC-P1-002）；第二组的同名镜像在 `mkdtemp` 临时根内就地复制（同名目录、不同 storage root），只用于本次输入。
  环境与数据：本机 Node、`mkdtemp` 临时根与一份同名目录镜像、配置解析出的 storage root 由 `HOME`/env 显式给定；真实任务库只读，不写入。
  谁判：未参与实现的独立执行单元，P1 提交后。
  承接：结论写 P1/T003 完成记录与 `quality/tests/p1-bad-input-matrix.output`（6 行输入×错误码×退出码）。
  成本：executor=独立执行者；estimate_min=15；hard_cap_min=40；resources=临时镜像、两入口 CLI；observation=6 组错误码与退出码是否成对一致；retry_cap=1；evidence_tier=命令级。
  资源来源：`mkdtemp` 就地造同名镜像与另一任务库副本，复用仓内真实判定模块；镜像用完即删，不存目录快照。
  为什么不能再简：只跑一组判不出「同结论」；只比退出码判不出「具名」，三组各自对应哪个 code 也判不出。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：三组×两入口的错误码两两相同，且分别等于上述三个具名 code。
  失败：删掉 `runtime/task/task-entry-identity.mjs` 里以配置解析 storage root＋后缀比对的分支（放行同名镜像），第二组必须报 `TASK_PATH_MISMATCH`；若退 0 或给成别的 code，本条判失败。
  证据：quality/tests/p1-bad-input-matrix.output。

- [ ] **AC-P1-004**：写入口或收口出现「主线目录＋显式另一任务」被放行即本条失败；写/收口冲突仍故意用不同错误码，且不得以「只读放宽」扩散到写。
  关联 FR-CODE-P1。
  判定方式：机器可判；判定时点：P1 实现提交后、合入前。
  落点：P1/T001、T002 与 `phases/P1-规则归属与入口.md`。
  验证：在主线目录用显式身份指向另一任务，分别跑写入口（`node tools/cli/task-bootstrap.mjs` 的 `create`/打开路径）与收口入口（`node tools/cli/task-close.mjs` 的 close 路径），记录两者错误码与退出码，并核对没有新写入的任务事实。
  环境与数据：本机 Node、主线目录、另一任务根副本（复制到 `mkdtemp` 后再跑，避免污染真实任务）；写集外不得新增文件。
  谁判：未参与实现的独立执行单元，与 AC-P1-002 同一人同批跑。
  承接：结论写 P1/T001、T002 完成记录与 `quality/tests/p1-write-close-not-relaxed.output`。
  成本：executor=独立执行者；estimate_min=12；hard_cap_min=30；resources=两写入路径 CLI、任务根副本；observation=两个非 0 退出码、两码不相等、任务事实无新行；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内写入口与收口入口，任务根用 `mkdtemp` 副本，不碰真实任务字节。
  为什么不能再简：只判「都拒绝」会漏掉「两入口授权差异」；只判退出码会漏掉写入副作用。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两入口均非 0、两错误码不同、目标任务 `facts.jsonl` 前后无新增行。
  失败：把 `tools/cli/stage-runtime.mjs` 中按 `!readOnly` 关预检的开关改成恒关（把只读放宽扩散到写与收口），同输入必须被放行退 0；若此时仍判通过，本条失败。
  证据：quality/tests/p1-write-close-not-relaxed.output。

- [ ] **AC-P1-005**：从主线目录跨目标仓只读时，`stage-runtime status` 返回的 workspace 描述的是被查任务根，不是调用目录。
  关联 FR-CODE-P1。
  判定方式：机器可判；判定时点：P1 实现提交后、合入前。
  落点：P1/T003 与 `phases/P1-规则归属与入口.md`。
  验证：`cd` 主线目录，跑 `node tools/cli/stage-runtime.mjs status --task-path=<另一任务根>`，把输出 workspace 与 `realpath` 后的任务根比较；再在同一命令下观察是否出现 `NOT_A_WORKTREE`。
  环境与数据：本机 Node、主线目录、另一个真实任务根；无第二任务根时用 `mkdtemp` 内的最小任务副本，并写明是副本。
  谁判：未参与实现的独立执行单元，P1 提交后。
  承接：结论写 P1/T003 完成记录与 `quality/tests/p1-cross-repo-read.output`。
  成本：executor=独立执行者；estimate_min=8；hard_cap_min=20；resources=仓内 CLI、第二任务根；observation=workspace 字段与调用目录是否相同；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内 CLI 与真实第二任务根（或 `mkdtemp` 副本），不新造夹具。
  为什么不能再简：只判退出 0 判不出 workspace 是否错落回调用目录（面板显示错仓库时仍可能退 0）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：workspace 等于被查任务根的规范路径，且无 `NOT_A_WORKTREE`。
  失败：删掉 `tools/cli/stage-runtime.mjs` 中「跨目录先设 target 为解析出的任务工作区」那一步，同命令的 workspace 必须变成调用目录（或报 `NOT_A_WORKTREE`）；若此时仍判通过，本条失败。
  证据：quality/tests/p1-cross-repo-read.output。

- [ ] **AC-P1-006**：施工卡的 `动作` 与 `文件 / 符号` 两处写出本包规则的唯一新家 `runtime/task/task-entry-identity.mjs`、入口数与调用者名单，且没有新增字段名。
  关联 FR-CODE-P1。
  判定方式：只能人读；判定时点：build-plan 出 P1 卡后、build-code 开工前。
  落点：P1/T004 与 `phases/P1-规则归属与入口.md`。
  验证：独立读者只打开一张 P1 卡与 `skills/spec-plan/templates/phase-template.md`，在卡正文定位 `动作` 与 `文件 / 符号` 两处，逐项读出规则新家、入口数、调用者；另跑既有卡校验器确认字段存在（只作字段存在性报告，不作通过条件）。
  环境与数据：真实 P1 卡（build-plan 产出）、Phase 模板当前字节；卡未出时记 `incomplete`，原因写「卡未生成」，恢复条件＝build-plan 第 6 步出卡。
  谁判：没参与写卡与写本判据的独立读者，在 P1 卡出后、build-code 开工前。
  承接：结论写 P1/T004 完成记录与 `quality/tests/p1-card-declaration.md`。
  成本：executor=独立读者；estimate_min=10；hard_cap_min=25；resources=P1 卡、Phase 模板；observation=两处是否写出新家/入口数/调用者；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用 build-plan 出的真实卡与仓内模板，不另写样卡。
  为什么不能再简：只跑字段存在性校验判不出写的是新家还是旧家、也判不出入口数；只读技能正文判不出卡面是否声明。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两处都在卡正文、都指 `runtime/task/task-entry-identity.mjs`、入口数与调用者与第 6 项接口一致，且卡上没有新字段名。
  失败：把两处里的规则新家改写成旧家 `runtime/task/task-identity.mjs`，或删掉入口数与调用者只留「按规范改」，读者必须判不成立。
  证据：quality/tests/p1-card-declaration.md。

- [ ] **AC-P1-007**：四个旧文案子串 `identity conflict`、`identity missing`、`task storage path does not match project/task identity`、`supplied together` 在改后代码里逐字保留。
  关联 FR-CODE-P1。
  判定方式：机器可判；判定时点：P1 实现提交后。
  落点：P1/T001 与 `phases/P1-规则归属与入口.md`。
  验证：对 `runtime/task/task-entry-identity.mjs`、`runtime/task/task-identity.mjs`、`core/task-close.mjs`、`tools/cli/stage-runtime.mjs` 逐串做精确串检查（`grep -F`），并跑 `tests/acceptance/card-03-current.test.mjs` 看既有断言。
  环境与数据：仓内当前字节（HEAD `b25626ca` 之上的 P1 改动）；旧回执只读，不追扫历史行。
  谁判：未参与实现的独立执行单元，P1 提交后。
  承接：结论写 P1/T001 完成记录与 `quality/tests/p1-legacy-messages.output`。
  成本：executor=独立执行者；estimate_min=5；hard_cap_min=15；resources=仓内四文件、既有验收测试；observation=四串命中/缺失与测试退出码；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内既有文案与既有测试，不新造样张。
  为什么不能再简：只跑测试可能因断言宽松而漏掉某串；只 grep 判不出旧断言是否仍通过。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：四串各至少命中一次，`card-03-current` 退出 0。
  失败：把任一子串改成同义中文（例如 `identity conflict` → `身份冲突`），精确串检查必须报缺失；若仍判通过即本条失败。
  证据：quality/tests/p1-legacy-messages.output。

### A.2 包 2 — 错误、默认值与接口取舍（AC-P2-001 .. AC-P2-006）

- [ ] **AC-P2-001**：`node tools/cli/check-added-failure-masks.mjs --self-test` 退出 0，且自测只含新增行正反例，不含历史行。
  关联 FR-CODE-P2。
  判定方式：机器可判；判定时点：P2 实现提交后。
  落点：P2/T004 与 `phases/P2-错误默认与接口取舍.md`。
  验证：在仓根跑 `node tools/cli/check-added-failure-masks.mjs --self-test`，记录退出码与逐条自测输出。
  环境与数据：仓内当前字节、本机 Node；不接真实任务库。
  谁判：未参与实现的独立执行单元，P2 提交后。
  承接：结论写 P2/T004 完成记录与 `quality/tests/p2-self-test.output`。
  成本：executor=独立执行者；estimate_min=5；hard_cap_min=15；resources=仓内检查器；observation=退出码与自测条数；retry_cap=1；evidence_tier=命令级。
  资源来源：复用检查器自带 `--self-test`，不新造样例文件。
  为什么不能再简：只看脚本存在判不出自测是否覆盖正反例；只跑一次判不出「历史行不报」。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：退出 0，自测输出列出正例与反例两类且无历史行命中。
  失败：往 `--self-test` 用例里塞一条历史行命中（例如把一条 `tests/fixtures` 里的旧 `catch{}` 当自测输入），必须退 1；若仍退 0，本条失败。
  证据：quality/tests/p2-self-test.output。

- [ ] **AC-P2-002**：以本 Phase 起点提交为 `--base` 在真实新增行上跑一次，每条命中都有处置，新增空错误处理或「出错返回空/假」零漏报。
  关联 FR-CODE-P2。
  判定方式：机器可判；判定时点：P2 实现提交后，用本 Phase 真实差异。
  落点：P2/T004 与 `phases/P2-错误默认与接口取舍.md`。
  验证：在 P2 分支上先造一处 `catch { return null }`（RED 捕获，留原件），跑 `node tools/cli/check-added-failure-masks.mjs --base <Phase 起点 commit>`，核对命中行号与文件正是该处；再补齐处置后同命令确认仍只报该行或零命中。
  环境与数据：本 Phase 真实差异（含未跟踪文件，按 `-U0`）、Phase 起点 commit、本机 Node；不得用历史提交差异替代。
  谁判：未参与实现的独立执行单元，P2 提交后。
  承接：结论写 P2/T004 完成记录与 `quality/tests/p2-real-added-lines.output`（含 RED 与处置后两份）。
  成本：executor=独立执行者；estimate_min=15；hard_cap_min=35；resources=Phase 真实差异、检查器；observation=命中行是否等于故意弄坏那一行、有无漏报；retry_cap=1；evidence_tier=命令级。
  资源来源：复用本 Phase 真实 diff 与就地造的 RED 行；用完删除该行，只留输出原件。
  为什么不能再简：只跑自测判不出真实新增行是否命中；只判退出码判不出是否漏报。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：故意造的两类新增行各被命中一次并给出行号，处置列非空；无「未报出」行。
  失败：删掉检查器里「出错返回空/假」的模式（只留空 `catch`），同命令对 `return null` 那行必须漏报；若仍判通过，本条失败。
  证据：quality/tests/p2-real-added-lines.output。

- [ ] **AC-P2-003**：检查器不报历史行，也不报 `tests/`、`fixtures`、`docs/` 下的同款；测试文件里的同款只计入跳过。
  关联 FR-CODE-P2。
  判定方式：机器可判；判定时点：P2 实现提交后。
  落点：P2/T004 与 `phases/P2-错误默认与接口取舍.md`。
  验证：同一次运行里读输出，抽三条历史命中候选（已知旧 `catch{}` 位置）与至少一条 `tests/` 内同款，核对前者未出现在命中列表、后者出现在跳过计数里。
  环境与数据：仓内当前字节、已知历史行位置清单（由执行者从 `git log -S` 或旧文件取，只读）；跳过计数口径以检查器输出为准。
  谁判：未参与实现的独立执行单元，P2 提交后。
  承接：结论写 P2/T004 完成记录与 `quality/tests/p2-scope-boundary.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=仓内历史行清单、检查器；observation=历史行是否出现在命中、跳过计数是否含测试同款；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内文件与检查器自带跳过口径，不新造夹具。
  为什么不能再简：只判「没有历史行」会漏掉「测试同款被当命中」；只看跳过总数判不出计数对象。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：命中列表无历史行、无 `tests/`/`fixtures`/`docs/` 路径；测试同款出现在跳过计数。
  失败：把扫描起点从显式 `--base` 改成无范围全仓扫描，同命令必须报出至少一条历史行；若此时仍判通过，本条失败。
  证据：quality/tests/p2-scope-boundary.output。

- [ ] **AC-P2-004**：本次审查记录里「两问」（默认谁定/依据哪条、坏输入会不会看起来成功）与「四问」（对外承诺哪些错误/顺序/副作用、删层谁合并、只剩一个调用点可删、两个以上各写一遍并指出挡住哪个非法状态）各有结论，并写路径与锚。
  关联 FR-CODE-P2。
  判定方式：只能人读；判定时点：P2 审查提交后、合入前。
  落点：P2/T001 与 `phases/P2-错误默认与接口取舍.md`。
  验证：独立读者打开 `skills/simplicity-guard/SKILL.md` 与本次 `quality/reviews/` 下 P2 审查件，逐问找结论，并核对结论写的是「路径＋锚」而不是「已检查」。
  环境与数据：真实 P2 审查件（review-record-route 保存的原件）、simplicity-guard 当前字节；审查件未产生时记 `incomplete`，恢复条件＝P2 审查提交。
  谁判：没参与本次实现与写审查的独立读者，P2 审查提交后。
  承接：结论写 P2/T001 完成记录与 `quality/reviews/p2-two-four-questions.md`。
  成本：executor=独立读者；estimate_min=20；hard_cap_min=45；resources=审查原件、技能正文；observation=六问是否各有结论且带路径锚；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实审查件与技能正文，不新写审查模板。
  为什么不能再简：只数问句条数判不出有没有结论；只看技能里写了问句判不出审查是否真答。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两问与四问逐条有结论，每条带 `path#anchor`；无一条为空。
  失败：把审查结论压成一句「已按规范检查」并删掉路径与锚，读者必须判不成立（三问 0 结论即失败的口径同样适用于此处）。
  证据：quality/reviews/p2-two-four-questions.md。

- [ ] **AC-P2-005**：每处绕行在施工卡 `非目标` 行有唯一删除票（绕行、删除条件、决定人、结束条件）；无票绕行判失败，审查只核不写票。
  关联 FR-CODE-P2。
  判定方式：只能人读；判定时点：build-plan 写票后、P2 审查时。
  落点：P2/T003 与 `phases/P2-错误默认与接口取舍.md`。
  验证：独立读者把本 Phase 真实绕行逐处列出，对照 P2 卡 `非目标` 行逐条核四要素；同时核对审查件里只出现「已核／缺票」判断，没有新增票文本。
  环境与数据：真实 P2 卡（含 `非目标` 行）、`skills/spec-plan/templates/phase-template.md` 当前字节、P2 审查件；卡未出时记 `incomplete`。
  谁判：没参与写卡与写审查的独立读者，审查时。
  承接：结论写 P2/T003 完成记录与 `quality/reviews/p2-deletion-tickets.md`。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=35；resources=P2 卡、模板、审查件；observation=每处绕行是否有四要素票、审查是否越权写票；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实卡与审查件，不新造票样张。
  为什么不能再简：只数票数判不出四要素是否齐；只读模板判不出本 Phase 每处绕行是否都上票。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：每处绕行对应一条四要素票；审查件只判断不写票；无第二处票。
  失败：把删除票改写到 `quality/reviews/` 的 finding 里、让卡 `非目标` 行为空，读者必须判失败（第二家票即失败）。
  证据：quality/reviews/p2-deletion-tickets.md。

- [ ] **AC-P2-006**：门命令回执在第 5 步由 `task.captureCommand` 捕获、第 7 步读回；挂错步判失败。
  关联 FR-CODE-P2。
  判定方式：机器可判；判定时点：P2 实现提交后，用一份真实 build-code 事实。
  落点：P2/T002 与 `phases/P2-错误默认与接口取舍.md`。
  验证：取一份真实 build-code 任务根副本，读 `facts.jsonl`：第 5 步必须有 `captureCommand` 产生的回执行（命令、退出码、原件），第 7 步必须引用同一份回执字节；再对照 `workflows/build-code/SKILL.md` 第 5、7 步口径。
  环境与数据：真实 build-code 事实副本（`mkdtemp` 内，避免污染）、`workflows/build-code/SKILL.md`；无真实回执时记 `incomplete`，恢复条件＝P2 Phase 内真实门命令产生回执。
  谁判：未参与实现的独立执行单元，P2 提交后。
  承接：结论写 P2/T002 完成记录与 `quality/tests/p2-receipt-step.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=真实 facts 副本、技能第 5/7 步口径；observation=回执挂在哪一步、第 7 步引用字节是否同源；retry_cap=1；evidence_tier=命令级。
  资源来源：复用真实 build-code 回执与技能正文，不新造回执。
  为什么不能再简：只判「有回执」判不出挂错步；只读技能正文判不出事实是否真按第 5 步捕获。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：第 5 步有回执行、第 7 步引用同一字节；无跨步重复捕获。
  失败：把捕获挂到第 7 步（改 `workflows/build-code/SKILL.md` 与对应事实，或让 captureCommand 写在第 7 步），检查必须红并点名该步；若仍判通过，本条失败。
  证据：quality/tests/p2-receipt-step.output。

### A.3 包 3 — 检查记录与开工就绪（AC-P3-001 .. AC-P3-009）

- [ ] **AC-P3-001**：删掉最新声明门的身份后，验证项失败、原因写身份缺失、证据指向被删的那一件（不回退到更早件），close 拒绝。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后、合入前。
  落点：P3/T002 与 `phases/P3-检查记录与开工就绪.md`。
  验证：把一份真实任务事实复制到 `mkdtemp` 隔离根，删掉最新声明门记录的 `gate_identity`，跑 `node tools/cli/stage-runtime.mjs` 的 close 投影与收口入口，读验证项、失败原因、证据指针与退出码。
  环境与数据：真实任务事实副本（任务三归档事实或本任务事实，只读复制）、本机 Node；原件字节不得改动，前后各记 sha256。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T002 完成记录与 `quality/evidence/p3/identity-delete.json`。
  成本：executor=独立执行者；estimate_min=20；hard_cap_min=45；resources=真实事实副本、收口入口；observation=验证项状态、原因串、证据指针指向哪一件、退出码；retry_cap=1；evidence_tier=命令级。
  资源来源：复用任务三归档事实的只读副本，`mkdtemp` 内删字段造负例；不新造假任务。
  为什么不能再简：只判「close 被拒」判不出证据是否错指更早件；只判原因串判不出退出码。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：验证项失败、原因＝身份缺失、证据指针＝被删那件、close 非 0。
  失败：把 `runtime/stage/stage-content-contracts.mjs` 的身份选择改回「跳到更早带身份的门」，同输入必须变成通过；若此时仍判失败即通过口径被弄反，本条失败。
  证据：quality/evidence/p3/identity-delete.json。

- [ ] **AC-P3-002**：无身份记录判「未取得」并拒绝 close，且原件字节前后不变。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后、合入前。
  落点：P3/T002 与 `phases/P3-检查记录与开工就绪.md`。
  验证：用同一份副本，这次不清字段而是选一条本就无身份的旧记录，跑 close 投影与收口；记录判定文本、退出码与原件 sha256。
  环境与数据：真实任务事实副本、旧无身份记录（任务三 hardening 类材料）；本任务只读，前后 sha256 必须相同。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T002 完成记录与 `quality/evidence/p3/identity-absent.json`。
  成本：executor=独立执行者；estimate_min=12；hard_cap_min=30；resources=真实旧记录副本、收口入口；observation=判定是否为「未取得」、退出码、原件 sha256；retry_cap=1；evidence_tier=命令级。
  资源来源：复用归档任务里真实无身份记录，复制后使用；不改原件。
  为什么不能再简：只判 close 拒绝判不出是否写成「未取得」（可能写成失败或跳过）；不记 sha256 判不出有没有回写原件。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：判定为「未取得」、close 非 0、原件 sha256 与操作前一致。
  失败：把该条改写成补身份后通过（例如给它编一个 `gate_identity`），必须判失败；若仍判通过即本条失败。
  证据：quality/evidence/p3/identity-absent.json。

- [ ] **AC-P3-003**：早先红、后来重跑同一个检查变绿时，最终判通过。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后。
  落点：P3/T001 与 `phases/P3-检查记录与开工就绪.md`。
  验证：在副本里构造同一命令两轮记录（第一轮 exit 1，第二轮 exit 0，命令字符串经 `canonicalCommand` 剥离后等同），跑判定读结果。
  环境与数据：`mkdtemp` 副本内两轮记录、本机 Node；命令字符串用真实门命令，不编造。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T001 完成记录与 `quality/tests/p3-same-command-green.json`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=副本事实、判定入口；observation=最终判定是否通过、用的是哪一轮证据；retry_cap=1；evidence_tier=命令级。
  资源来源：复用副本里的真实门命令，两轮记录就地造，不新造任务。
  为什么不能再简：只判「最后一条是绿」会把「后置别的绿」也放过；必须同时判命令等同。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：最终通过，且证据取第二轮同命令记录。
  失败：把第二轮的 `canonicalCommand` 改成与第一轮不同（改命令里的路径或参数），必须判失败；若仍判通过即本条失败。
  证据：quality/tests/p3-same-command-green.json。

- [ ] **AC-P3-004**：早先红、后来跑别的命令变绿时仍判失败。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后。
  落点：P3/T001 与 `phases/P3-检查记录与开工就绪.md`。
  验证：同一副本里，第一轮命令为门命令（exit 1），第二轮换成另一条命令（exit 0），跑判定读结果。
  环境与数据：`mkdtemp` 副本、两条真实命令记录；不改原件。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T001 完成记录与 `quality/tests/p3-other-command-red.json`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=副本事实、判定入口；observation=是否仍判失败、原因是否点名命令不同；retry_cap=1；evidence_tier=命令级。
  资源来源：复用副本里的真实命令，第二轮换命令就地造。
  为什么不能再简：只判「有红记录」判不出后置绿是否被正确拒绝；只判最终状态判不出拒绝原因。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：仍判失败，失败原因点名两轮命令不同。
  失败：把判定改成只比较退出码序列（忽略命令身份），同输入必须变成通过；若此时仍判失败即口径被弄反，本条失败。
  证据：quality/tests/p3-other-command-red.json。

- [ ] **AC-P3-005**：遇到不可读原件时必须报「原件不可读」，不得跨过未知件回退到更早的绿件。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后。
  落点：P3/T001 与 `phases/P3-检查记录与开工就绪.md`。
  验证：在副本里把最新门证据文件 `chmod 000`（或删掉），跑判定与 close，读是否报「原件不可读」而不是回退通过。
  环境与数据：`mkdtemp` 副本、被改权限的原件副本；真实原件不动，操作后用 `chmod` 还原并记 sha256。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T001 完成记录与 `quality/tests/p3-unreadable-original.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=副本原件、判定与收口入口；observation=错误文本是否「原件不可读」、是否回退到更早绿件；retry_cap=1；evidence_tier=命令级。
  资源来源：复用副本原件，权限就地改；不删真实原件。
  为什么不能再简：只判「失败」判不出是「不可读」还是「未取得」，也判不出有没有回退。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：报「原件不可读」，close 非 0，未使用更早件。
  失败：在身份选择里加一条「原件不可读则跳到更早带身份件」的兜底，同输入必须变成通过；若此时仍判通过口径被弄反，本条失败。
  证据：quality/tests/p3-unreadable-original.output。

- [ ] **AC-P3-006**：双层包装捕获的记录能被认出是声明门并绑上身份。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后。
  落点：P3/T001 与 `phases/P3-检查记录与开工就绪.md`。
  验证：就地造一层 `bash -c` 包装再套一层（真实双层捕获），命令字符串与记录形状按真实门命令生成，跑 `canonicalCommand` 剥离与门识别，读是否识别为声明门、身份是否绑定。
  环境与数据：`mkdtemp` 副本、本机 bash 与 Node；包装层数固定两层，形态写进输出。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T001 完成记录与 `quality/tests/p3-double-wrap.json`。
  成本：executor=独立执行者；estimate_min=12；hard_cap_min=30；resources=bash、副本事实；observation=是否识别为声明门、身份是否绑定；retry_cap=1；evidence_tier=命令级。
  资源来源：就地造双层包装，复用仓内剥离函数；不上传、不外发。
  为什么不能再简：只测单层判不出「剥离过度」与「剥不掉」两种错；只判退出码判不出绑定。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：识别为声明门、身份绑定成功、剥离层数记录为 2。
  失败：把剥离上限从 4 层改成 1 层，双层输入必须识别失败；若仍判通过即本条失败。
  证据：quality/tests/p3-double-wrap.json。

- [ ] **AC-P3-007**：就绪输出点名「人判未验证＝N」但**不阻断**，退出码与既有断言保持不变。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后。
  落点：P3/T002 与 `phases/P3-检查记录与开工就绪.md`。
  验证：用一份含人判行的真实就绪材料副本跑就绪输出，读 `human_rows.length` 与输出里的计数是否一致，并比较改动前后退出码；再跑既有 `tests/contract/build-code-readiness.test.mjs`。
  环境与数据：真实就绪材料副本（任务三 `readiness-p4.json` 类）、既有契约测试；材料缺时记 `unavailable` 并写恢复条件。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T002 完成记录与 `quality/evidence/p3/readiness-human.json`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=真实就绪副本、契约测试；observation=计数是否等于人判行数、退出码、既有断言是否未改；retry_cap=1；evidence_tier=命令级。
  资源来源：复用任务三真实就绪材料与既有契约测试，不新造就绪样张。
  为什么不能再简：只判「输出了计数」判不出是否等于真实人判行数；不跑既有断言判不出是否被改成阻断。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：计数等于真实人判行数、退出码 0、既有断言未改动且通过。
  失败：把就绪输出改成「有人判未验证则退 1」（把诊断变成门），既有断言必须红；若此时仍判通过，本条失败。
  证据：quality/evidence/p3/readiness-human.json。

- [ ] **AC-P3-008**：就绪材料过期或漂移时，既有具名失败保持不变，不被新规则顺带改掉。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后。
  落点：P3/T002 与 `phases/P3-检查记录与开工就绪.md`。
  验证：在副本里把就绪材料改成过期（改时间戳或让材料版本落后一版），跑就绪判定，读失败名与退出码；与改动前基线输出逐字比较。
  环境与数据：真实就绪材料副本、改动前基线输出（P3 提交前捕获）、本机 Node。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T002 完成记录与 `quality/tests/p3-readiness-stale.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=副本材料、基线输出；observation=失败名与退出码是否与基线一致；retry_cap=1；evidence_tier=命令级。
  资源来源：复用真实就绪材料与提交前基线输出，不新造。
  为什么不能再简：只判「有失败」判不出名是否被换掉；不回读基线判不出「既有」两字。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：失败名与退出码与基线逐字一致。
  失败：把过期材料归到新加的「人判未验证」名下，失败名必须与基线不同；若此时仍判一致即本条失败。
  证据：quality/tests/p3-readiness-stale.output。

- [ ] **AC-P3-009**：未收敛包带 `kind` 时退出码按 `kind` 判（文案改成同义仍为 1）；没有 `kind` 的旧 gap 走边界兜底。
  关联 FR-CODE-P3。
  判定方式：机器可判；判定时点：P3 实现提交后。
  落点：P3/T004 与 `phases/P3-检查记录与开工就绪.md`。
  验证：造两条 gap 记录（一条带 `kind`、文案改成同义中文；一条无 `kind` 的旧形态），分别跑 `tools/cli/check-stage-steps.mjs` 与 `tools/cli/run-checks.mjs` 的未收敛退出点，读退出码与 `gap_codes`。
  环境与数据：`mkdtemp` 副本内两条 gap 记录；旧形态记录按既有历史形状复制，不新造枚举。
  谁判：未参与实现的独立执行单元，P3 提交后。
  承接：结论写 P3/T004 完成记录与 `quality/tests/p3-gap-kind.output`。
  成本：executor=独立执行者；estimate_min=15；hard_cap_min=35；resources=副本 gap 记录、两个退出点 CLI；observation=退出码是否仍为 1、`gap_codes` 是否来自 `kind`、旧 gap 是否走兜底；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内两处退出点与真实旧 gap 形状，`mkdtemp` 内造样本。
  为什么不能再简：只测带 `kind` 的正例判不出中文子串依赖是否已删；不测旧形态判不出兜底是否越界。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：带 `kind` 且文案改成同义时退 1 并给 `gap_codes`；无 `kind` 旧 gap 走 `UNCLASSIFIED` 兜底仍计失败。
  失败：把退出点改回匹配中文字串（例如 `未收敛：` 前缀），同义文案那条必须退 0；若此时仍判退 1 即兜底被删，本条失败。
  证据：quality/tests/p3-gap-kind.output。

### A.4 包 4 — 方法接线要求（AC-P4-001 .. AC-P4-006）

本包按用户 2026-11-24 的批准（U-026 / OI-001、OI-002）**只写方法要求，不做真实自动作业与外发演示**：真实行为未交付，属具名缺口，下列各条只判方法文本与既有契约，不把方法当已验。

- [ ] **AC-P4-001**：三份方法文件各有该节、指路与指针，四段名（分诊、实际处理、发布、原使用方读回）能逐字读到。
  关联 FR-CODE-P4。
  判定方式：机器可判；判定时点：P4 实现提交后。
  落点：P4/T001、T002、T003 与 `phases/P4-方法接线要求.md`。
  验证：对 `skills/backend-testing/SKILL.md` 查「自动作业与对外传输」节名与四段名；对 `workflows/build-code/SKILL.md` 查第 4 步指路句；对 `skills/simplicity-guard/SKILL.md` 查那一句指针；四条分别精确匹配后记录命中位置。
  环境与数据：三份文件当前字节（HEAD `b25626ca` 之上的 P4 改动）；本机 Node 与 grep；真实自动作业入口不存在，属已知缺口，不在本条判。
  谁判：未参与实现的独立执行单元，P4 提交后。
  承接：结论写 P4/T001–T003 完成记录与 `quality/tests/p4-method-sections.output`。
  成本：executor=独立执行者；estimate_min=8；hard_cap_min=20；resources=三份方法文件；observation=节名、四段名、指路句与指针四处是否命中；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内三份方法文件，不新写方法样张。
  为什么不能再简：只判「有这一节」判不出四段名是否都在；只判四段名判不出施工流程与简化审查两处是否指到同一节。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：节名与四段名逐字命中、两处指路各命中一次。
  失败：把「原使用方读回」段名删掉或把四段压成一句「要真验」，命中检查必须报缺失；若仍判通过即本条失败。
  证据：quality/tests/p4-method-sections.output。

- [ ] **AC-P4-002**：三条契约测试与 OCR「发送前拦住」测试退出 0；此条只证方法引用的契约仍绿，不证方法效果。
  关联 FR-CODE-P4。
  判定方式：机器可判；判定时点：P4 方法落定后。
  落点：P4/T001 与 `phases/P4-方法接线要求.md`。
  验证：跑 `npx vitest run tests/contract/n10-source-disposition.test.mjs tests/contract/final-chain-declarations.test.mjs tests/contract/terminal-chain.test.mjs` 与 `npx vitest run tests/contract/ocr-delegation-adapter.test.mjs -t "fails before dispatch"`，记录退出码与用例数。
  环境与数据：仓内当前字节、本机 Node 与 vitest；测试只跑不改（不进 P4 写集）。
  谁判：未参与实现的独立执行单元，P4 提交前。
  承接：结论写 P4/T001 完成记录与 `quality/tests/p4-contracts-green.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=四条测试文件、vitest；observation=两命令退出码与用例计数；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内既有契约测试，不新造夹具。
  为什么不能再简：不跑判不出契约是否被 P4 改动带红；但跑到绿也不证方法效果，故结论只写「契约仍绿」。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两命令退出 0，用例计数与基线一致。
  失败：把 `n10-source-disposition.test.mjs` 的期望处置值改成任意值（断言失效），同命令必须红；若此时仍判通过，本条失败。
  证据：quality/tests/p4-contracts-green.output。

- [ ] **AC-P4-003**：独立读者对一条真实接线或外发改动答对三问（证到哪段、拒了什么、接收侧有没有收到）；答「函数被调用了」「最终没变所以没发」「发送侧拦住了所以没发」均不通过。
  关联 FR-CODE-P4。
  判定方式：只能人读；判定时点：P4 方法落定后、合入前。
  落点：P4/T004 与 `phases/P4-方法接线要求.md`。
  验证：给一名没参与写作的读者一份真实改动材料（本任务内取一条接线类或外发类改动；没有时用方法正文自带的 OCR 派发与 `git-authorize` 两个实例），只读方法与材料，按三问作答，答案存原件。
  环境与数据：方法正文、真实改动材料；真实接收侧记录**未取得**（本包未交付真实外发），读者须答出「接收侧该由谁记录、缺了记 unknown/incomplete」，真实收到与否记 `incomplete` 并写恢复条件＝出现真实入口并跑完。
  谁判：没参与写作的独立读者（非实现者、非判据作者），P4 合入前。
  承接：结论写 P4/T004 完成记录与 `quality/evidence/decision-maker/p4/reader-answers.md`。
  成本：executor=独立读者；estimate_min=25；hard_cap_min=60；resources=方法正文、真实改动材料；observation=三问答案是否具名、是否落在接收侧记录上；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用方法正文与真实改动，读者就地作答；不新造受控接收方。
  为什么不能再简：只判「读过」判不出是否把发送侧自记当接收侧证据；三问缺任一问则「最终没变所以没发」这类推断会漏过。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：三问都有具名答案，接收侧一问答到「谁记录、缺了怎么记」，未用发送侧自记代替。
  失败：把接收侧那一段从方法里删掉、只留发送侧 `blocked_before_dispatch` 与 calls=0，读者必然答成「发送侧拦住了所以没发」，必须判不通过。
  证据：quality/evidence/decision-maker/p4/reader-answers.md。

- [ ] **AC-P4-004**：三份目标文件里不出现「本卡已验」这一精确串。
  关联 FR-CODE-P4。
  判定方式：机器可判；判定时点：P4 提交后。
  落点：P4/T001、T002、T003 与 `phases/P4-方法接线要求.md`。
  验证：对 `skills/backend-testing/SKILL.md`、`workflows/build-code/SKILL.md`、`skills/simplicity-guard/SKILL.md` 做 `grep -F "本卡已验"`，只查这三份与这一串，不做全仓扫描。
  环境与数据：三份文件当前字节；不追扫历史文档。
  谁判：未参与实现的独立执行单元，P4 提交后。
  承接：结论写 P4/T001 完成记录与 `quality/tests/p4-no-claimed-verified.output`。
  成本：executor=独立执行者；estimate_min=3；hard_cap_min=10；resources=三份文件；observation=精确串命中数；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内三份文件，不新造。
  为什么不能再简：只判「没写已验」的语义判断会因读者不同而摇摆；精确串是唯一可重放的替代，但必须限定这三份，避免扫成全仓。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：三份文件命中 0 次。
  失败：把「本卡已验」写进 `skills/backend-testing/SKILL.md` 的该节，同命令必须命中并判失败。
  证据：quality/tests/p4-no-claimed-verified.output。

- [ ] **AC-P4-005**：同一处读取口径只出现一套话术，不同文件不得各写一套「怎么算证到第几段」的判法。
  关联 FR-CODE-P4。
  判定方式：只能人读；判定时点：P4 方法落定后。
  落点：P4/T001、T002、T003 与 `phases/P4-方法接线要求.md`。
  验证：独立读者把三份文件里涉及「证到第几段」的句子逐条摘出并列成一张对照，判断是否只有一套判法、指路两处是否只引用不重写。
  环境与数据：三份文件当前字节；P6 与本包的分工句（P6 管规范入口、P4 管测试证据）须能读到。
  谁判：没参与写作的独立读者，P4 合入前。
  承接：结论写 P4/T001 完成记录与 `quality/tests/p4-single-reading-voice.md`。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=35；resources=三份文件；observation=「证到第几段」的判法是否只有一套、指路处是否复写；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用三份文件正文，不新写对照表模板。
  为什么不能再简：只判「都提到四段」判不出判法是否冲突；冲突时执行者会照自己顺手那份写。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：只有一套判法，另两处只引用并指向同一节。
  失败：在 `workflows/build-code/SKILL.md` 第 4 步另写一套「只要跑过命令就算证到发布段」的判法，读者必须判失败。
  证据：quality/tests/p4-single-reading-voice.md。

- [ ] **AC-P4-006**：纯内部改动可写 N/A 加理由，不被要求四段全证。
  关联 FR-CODE-P4。
  判定方式：只能人读；判定时点：P4 方法落定后。
  落点：P4/T001 与 `phases/P4-方法接线要求.md`。
  验证：独立读者读方法里的 N/A 例外句，再取本任务内一条真实纯内部改动记录，按方法判它是否只需 N/A 加理由；两者对照看是否自洽。
  环境与数据：方法正文、一条真实纯内部改动记录（本任务内取）；没有这类改动时记 `incomplete`，恢复条件＝出现一条纯内部改动。
  谁判：没参与写作的独立读者，P4 合入前。
  承接：结论写 P4/T001 完成记录与 `quality/tests/p4-na-exception.md`。
  成本：executor=独立读者；estimate_min=12；hard_cap_min=30；resources=方法正文、真实改动记录；observation=N/A 例外是否存在、该记录按方法是否被要求四段；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用方法正文与真实改动记录，不新造记录。
  为什么不能再简：只判「有 N/A 三字」判不出理由是否被要求；只看方法判不出真实改动会不会被误判成四段全证。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：纯内部改动按方法写 N/A ＋理由即可，未被要求四段。
  失败：把方法改成「所有改动必须四段全证」，该记录必须被判不合格，读者据此判本条失败。
  证据：quality/tests/p4-na-exception.md。

### A.5 包 5 — 单元复盘（AC-P5-001 .. AC-P5-006）

- [ ] **AC-P5-001**：五个技能都有固定收尾小节，节名逐字可读。
  关联 FR-CODE-P5。
  判定方式：机器可判；判定时点：P5 实现提交后。
  落点：P5/T001、T002 与 `phases/P5-单元复盘.md`。
  验证：对 `skills/stage-reflection/SKILL.md`（单元模式节）与 `skills/task-maker/SKILL.md`、`skills/phase-maker/SKILL.md`、`skills/run-phase/SKILL.md`、`skills/decision-maker/SKILL.md`（各固定收尾小节）逐个精确匹配固定节名，记录命中位置。
  环境与数据：五份技能当前字节；节名以 P5 卡写定的固定串为准，卡未出时按 `skills/stage-reflection/SKILL.md` 单元模式节的节名对齐（卡未出记 `incomplete`）。
  谁判：未参与实现的独立执行单元，P5 提交后。
  承接：结论写 P5/T001、T002 完成记录与 `quality/tests/p5-section-names.output`。
  成本：executor=独立执行者；estimate_min=8；hard_cap_min=20；resources=五份技能；observation=五处节名是否逐字命中；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内五份技能，不新写样张。
  为什么不能再简：只判「加了复盘」判不出节名固定（合同测试要靠节名断言）；只判一个技能判不出五处。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：五处节名全部命中。
  失败：把 `skills/run-phase/SKILL.md` 的收尾节改名（或删掉该节），命中检查必须报缺；若仍判通过即本条失败。
  证据：quality/tests/p5-section-names.output。

- [ ] **AC-P5-002**：合同测试断言节名与五问字段并通过；`check-skill-consistency` 只作报告，不构成门。
  关联 FR-CODE-P5。
  判定方式：机器可判；判定时点：P5 实现提交后。
  落点：P5/T004 与 `phases/P5-单元复盘.md`。
  验证：跑 `npx vitest run tests/contract/unit-reflection-wiring.test.mjs` 记录退出码与断言项；再跑一次 `check-skill-consistency`，确认其结果不改变本条通过与否。
  环境与数据：仓内测试与一致性检查脚本当前字节；一致性检查非 0 时只报告，不据此判失败。
  谁判：未参与实现的独立执行单元，P5 提交后。
  承接：结论写 P5/T004 完成记录与 `quality/tests/p5-reflection-contract.output`。
  成本：executor=独立执行者；estimate_min=8；hard_cap_min=20；resources=合同测试、一致性检查；observation=断言是否覆盖节名与五问字段、一致性检查是否被当门；retry_cap=1；evidence_tier=命令级。
  资源来源：复用新写的合同测试与既有一致性检查，不新造。
  为什么不能再简：只跑绿判不出断言对象（可能只断言文件存在）；把一致性检查接成门会让噪音阻断 P5。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：合同测试退出 0 且断言含节名与五问字段；一致性检查结果不改变判定。
  失败：把五问字段里「怎么证明」一条从测试断言中删掉，同命令必须因缺断言而红；若仍判通过即本条失败。
  证据：quality/tests/p5-reflection-contract.output。

- [ ] **AC-P5-003**：一份真实单元复盘记录五问齐，且其中指针能打开读回。
  关联 FR-CODE-P5。
  判定方式：只能人读；判定时点：P5 实现提交后。
  落点：P5/T002 与 `phases/P5-单元复盘.md`。
  验证：取 `quality/evidence/reflection/` 下一份真实记录，逐问读「问题｜以前有没有｜实际改了什么｜为什么不用更高层｜怎么证明」，并逐个打开证明里的指针（路径＋行位）核对能读回同字节。
  环境与数据：真实复盘记录（P5 Phase 内产生）、指针指向的原件；记录未产生时记 `incomplete`，恢复条件＝P5 Phase 内完成一个单元并当场留记录。
  谁判：没参与写记录的独立读者，P5 提交后。
  承接：结论写 P5/T002 完成记录与 `quality/tests/p5-reflection-five-questions.md`。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=35；resources=真实记录、指针原件；observation=五问是否齐、指针是否可打开；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用 P5 当场产生的真实记录，不新造记录。
  为什么不能再简：只判「有记录」判不出五问；只判五问判不出指针是否可回读（形式化最常见的漏洞）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：五问齐、每个证明指针可打开并与所述内容一致。
  失败：把「怎么证明」写成「已证明」且不给指针，或只加「复盘」三字没有输入输出，读者必须判未完成。
  证据：quality/tests/p5-reflection-five-questions.md。

- [ ] **AC-P5-004**：记录里「命中」与「首次」各有一例；P6 规则表未交付时状态只标「待补」。
  关联 FR-CODE-P5。
  判定方式：只能人读；判定时点：P5 实现提交后。
  落点：P5/T002 与 `phases/P5-单元复盘.md`。
  验证：读同一批真实记录，逐条看状态列：至少一条写命中（带域与规则名）、一条写首次；再核 P6 表是否已交付，未交付时状态是否停在「待 P6 表/待补」。
  环境与数据：真实复盘记录、P6 规则表当前状态（本稿时未交付）；P6 表交付后本条按表状态复核。
  谁判：没参与写记录的独立读者，P5 提交后。
  承接：结论写 P5/T002 完成记录与 `quality/tests/p5-status-column.md`。
  成本：executor=独立读者；estimate_min=12；hard_cap_min=30；resources=真实记录、P6 表状态；observation=命中与首次各一例、未交付时是否标待补、有无自造列名；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实记录；P6 表未交付时只读状态，不新建表。
  为什么不能再简：只判「有状态列」判不出两例是否都有；不核 P6 表状态会逼作者自造列名或提前写死状态。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：命中与首次各一例，未交付时标「待补」，列名与 P5/P6 约定一致。
  失败：把状态写进尚未建好的 `specs/code-changes/README.md` 或自造「第几次」列，读者必须判失败。
  证据：quality/tests/p5-status-column.md。

- [ ] **AC-P5-005**：聊天里有 ≤5 条摘要与记录路径，超 5 条时合并并说明。
  关联 FR-CODE-P5。
  判定方式：只能人读；判定时点：P5 实现提交后。
  落点：P5/T002 与 `phases/P5-单元复盘.md`。
  验证：读 P5 Phase 内一次单元完成的聊天记录，数摘要条数、找记录路径，判断超出时是否写明合并理由。
  环境与数据：真实会话记录（P5 Phase 的聊天原件）；会话不可回读时记 `unavailable`，原因写会话未保存，恢复条件＝下次单元完成时同批保存。
  谁判：没参与写作的独立读者，P5 提交后。
  承接：结论写 P5/T002 完成记录与 `quality/tests/p5-chat-summary.md`。
  成本：executor=独立读者；estimate_min=10；hard_cap_min=25；resources=会话记录、复盘记录路径；observation=条数、是否有记录路径、超限是否说明；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实会话与记录路径，不重写聊天。
  为什么不能再简：只判「发了摘要」判不出 ≤5 与路径；只判条数判不出是否抄了改动清单。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：≤5 条、带记录路径、超限有合并说明。
  失败：把摘要写成改动清单（只列改了哪些文件、没有「以前有没有／为什么不用更高层」），读者必须判不合格。
  证据：quality/tests/p5-chat-summary.md。

- [ ] **AC-P5-006**：复盘不被写成门——五份技能与步骤表里不出现「阶段结束才能复盘」这类阻断语义。
  关联 FR-CODE-P5。
  判定方式：只能人读；判定时点：P5 实现提交后、合入前。
  落点：P5/T003 与 `phases/P5-单元复盘.md`。
  验证：独立读者逐份读五份技能新节与四份 `steps.json` 的口径，判断是否把复盘写成阶段门（出现「阶段结束」「不得交付」等阻断义），并核对 `workflows/build-code/SKILL.md` 局部段是否已改成「Phase 内动作，不新增阶段门」。
  环境与数据：五份技能、四份 `steps.json`、`workflows/build-code/SKILL.md` 当前字节；不新增门是用户已定口径（R-009）。
  谁判：没参与写作的独立读者，P5 合入前。
  承接：结论写 P5/T003 完成记录与 `quality/reviews/p5-no-new-gate.md`。
  成本：executor=独立读者；estimate_min=20；hard_cap_min=45；resources=五技能、四份步骤表；observation=是否出现阻断语义、是否新增阶段门字段；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用仓内技能与步骤表，不新造。
  为什么不能再简：只 grep「阶段结束」判不出同义阻断句；只看技能判不出步骤表是否被加门。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：无阻断语义、无新增门字段，`build-code` 局部段写的是「Phase 内动作」。
  失败：在 `skills/run-phase/SKILL.md` 收尾节写「本阶段结束前必须完成复盘记录，否则不得交付」，读者必须判失败。
  证据：quality/reviews/p5-no-new-gate.md。

### A.6 包 6 — 规范索引与开工读取（AC-P6-001 .. AC-P6-005）

- [ ] **AC-P6-001**：9 个新文件都非空且各含五列表头，8 处既有改动逐处可读、不是占位。
  关联 FR-CODE-P6。
  判定方式：机器可判；判定时点：P6 实现提交后。
  落点：P6/T001 与 `phases/P6-规范索引与开工读取.md`。
  验证：逐个 `test -s` 九个新文件（`specs/code-changes/` 六个、`specs/design/README.md`、`specs/frontend/README.md`、`specs/frontend/frontend.md`）并查五列表头；再按 P6 卡逐条读 8 处既有改动，确认每处有非空内容。
  环境与数据：九个新文件、P6 卡写集；**8 处清单在 decision-log 中只写数量、未逐条点名 → 未取得**，以 P6 卡写集为准，卡未出记 `incomplete`（恢复条件＝build-plan 出 P6 卡）。
  谁判：未参与实现的独立执行单元，P6 提交后。
  承接：结论写 P6/T001 完成记录与 `quality/tests/p6-nine-files.output`。
  成本：executor=独立执行者；estimate_min=12；hard_cap_min=30；resources=九个新文件、P6 卡写集；observation=文件非空、五列表头、8 处改动是否可读；retry_cap=1；evidence_tier=命令级。
  资源来源：复用本包新建文件与卡写集，不新造样张。
  为什么不能再简：只判文件存在会放过空文件当入口（决策日志已列为反例）；只判九个文件判不出既有改动是否落地。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：九个文件非空且五列表头齐；8 处改动逐处可读。
  失败：把 `specs/code-changes/defaults.md` 建成空文件（或只留标题），非空与表头检查必须红；若仍判通过即本条失败。
  证据：quality/tests/p6-nine-files.output。

- [ ] **AC-P6-002**：`node tools/cli/verify-structure.mjs` 退出 0——每行链接存在且非空、锚点合并重复连字符后匹配、三个 legacy 锚点期望通过。
  关联 FR-CODE-P6。
  判定方式：机器可判；判定时点：P6 实现提交后。
  落点：P6/T006 与 `phases/P6-规范索引与开工读取.md`。
  验证：在仓根跑 `node tools/cli/verify-structure.mjs`，记录退出码与逐行结果；再抽一行把锚点还原成未合并的旧写法，确认合并规则确实生效。
  环境与数据：仓内检查器与结构文件当前字节、`AGENTS.md` 三个双连字符锚点（:9/:138/:140）。
  谁判：未参与实现的独立执行单元，P6 提交时。
  承接：结论写 P6/T006 完成记录与 `quality/tests/p6-verify-structure.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=检查器、AGENTS 与域文件；observation=退出码、每行链接与锚点结果、legacy 三锚点；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内检查器与真实结构文件，不新造。
  为什么不能再简：只判「有 AGENTS 段」判不出锚点匹配；不做合并规则判定会让三个 legacy 锚点永远红。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：退出 0，三个 legacy 锚点逐个 pass。
  失败：把 `specs/design/README.md` 里某行的链接改成不存在路径（或把 IPv6 式锚点写成未合并形态），同命令必须退 1 并点名该行；若仍退 0 即本条失败。
  证据：quality/tests/p6-verify-structure.output。

- [ ] **AC-P6-003**：四个读点各有一段三句（命中哪条／改了什么／为什么没命中），同一文件不出现两套读取话术。
  关联 FR-CODE-P6。
  判定方式：只能人读；判定时点：P6 实现提交后、合入前。
  落点：P6/T004 与 `phases/P6-规范索引与开工读取.md`。
  验证：独立读者打开四个读点（`workflows/make-decision/SKILL.md`:108、`workflows/build-plan/SKILL.md`:67、`workflows/build-code/SKILL.md`:99/:133、`workflows/build-prd/SKILL.md` 第 1 步）逐处读三句结构，并判断同文件内是否只此一套话术。
  环境与数据：四份工作流正文当前字节；行号可能漂移，按实际内容定位。
  谁判：没参与写作的独立读者，P6 合入前。
  承接：结论写 P6/T004 完成记录与 `quality/tests/p6-four-reading-points.md`。
  成本：executor=独立读者；estimate_min=20；hard_cap_min=45；resources=四份工作流正文；observation=每处是否三句、同文件是否两套；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实工作流正文，不新写读取段样板。
  为什么不能再简：只判「提到规范」判不出三句结构；只判一处判不出另外三处是否也被改。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：四处都有三句，同一文件只有一套话术。
  失败：把某处改成「已读规范」而没有命中锚点与改变动作，读者必须判不合格；若仍判通过即本条失败。
  证据：quality/tests/p6-four-reading-points.md。

- [ ] **AC-P6-004**：`git diff -- specs/Improvements.md` 为空，Improvements 保留原未决角色。
  关联 FR-CODE-P6。
  判定方式：机器可判；判定时点：P6 提交后。
  落点：P6/T001–T006（写集边界；本包无任务写该文件）与 `phases/P6-规范索引与开工读取.md`。
  验证：在 P6 分支上跑 `git diff -- specs/Improvements.md`，记录输出字节；再确认文件仍存在且未被改成规则索引。
  环境与数据：P6 分支工作树、`specs/Improvements.md` 当前字节；只比这一文件。
  谁判：未参与实现的独立执行单元，P6 提交后。
  承接：结论写 P6/T001 完成记录与 `quality/tests/p6-improvements-untouched.output`。
  成本：executor=独立执行者；estimate_min=3；hard_cap_min=10；resources=git、该文件；observation=diff 是否为空、文件角色是否被改；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内 git 历史，不新造对照件。
  为什么不能再简：只判文件存在判不出是否被改成索引（U-016 只问不改，R-026 要求保留未决角色）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：diff 为空，文件仍是未决记录。
  失败：把 Improvements 的未决段改成规则索引（增删任一行），同命令必须非空；若此时仍判通过，本条失败。
  证据：quality/tests/p6-improvements-untouched.output。

- [ ] **AC-P6-005**：前端四处消费者同批改成「入口→正文」，读点计数一致为 4 个。
  关联 FR-CODE-P6。
  判定方式：机器可判；判定时点：P6 提交后。
  落点：P6/T002 与 `phases/P6-规范索引与开工读取.md`。
  验证：对 `skills/project-norm-init/SKILL.md`:21、`skills/plan-design-review/SKILL.md`:22/23/25、`skills/spec-plan/step-consumer-design.md`:48 等前端消费者逐个查是否写成「先读 README 入口，再读 frontend.md 正文」，数命中处并核对等于 4。
  环境与数据：四份消费者文件当前字节；行号漂移按内容定位；漏一处即失败。
  谁判：未参与实现的独立执行单元，P6 提交后。
  承接：结论写 P6/T002 完成记录与 `quality/tests/p6-frontend-consumers.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=四份消费者文件、两个前端文件；observation=命中处数是否等于 4、写法是否「入口→正文」；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内消费者文件，不新造。
  为什么不能再简：只判「有指向 README」判不出正文也读了；只判一个文件判不出漏改（决策日志已把漏一处列为失败）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：四处命中、写法一致、计数为 4。
  失败：把 `skills/plan-design-review/SKILL.md` 其中一处留成旧路径（只指 `frontend.md` 不指 README），计数必须变成 3；若仍判 4 即本条失败。
  证据：quality/tests/p6-frontend-consumers.output。

### A.7 包 7 — 阶段收口汇总（AC-P7-001 .. AC-P7-010）

- [ ] **AC-P7-001**：`skills/stage-handoff/SKILL.md` 与 `skills/stage-close/SKILL.md` 各有一处「阶段复盘」段。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 实现提交后。
  落点：P7/T001、T002 与 `phases/P7-阶段收口汇总.md`。
  验证：对两份方法逐个精确匹配「阶段复盘」段名并记录位置；再确认 stage-close 的 §7 只引用交接同一行、不复述条目。
  环境与数据：两份方法当前字节；阶段末交接件未产生时只判方法文本，实际行文另见 AC-P7-002/003。
  谁判：未参与实现的独立执行单元，P7 提交后。
  承接：结论写 P7/T001、T002 完成记录与 `quality/tests/p7-two-methods.output`。
  成本：executor=独立执行者；estimate_min=6；hard_cap_min=15；resources=两份方法；observation=两处段名是否命中、stage-close 是否只引用；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内两份方法，不新写段样板。
  为什么不能再简：只判一处判不出两处都有；只判段名判不出 stage-close 是否复制了条目（会形成第二份权威）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两处段名命中，stage-close 段只引用交接行。
  失败：把 stage-close 段里的引用改成逐条复述晋升条目，必须判失败（第二份权威）。
  证据：quality/tests/p7-two-methods.output。

- [ ] **AC-P7-002**：真实交接的第五行可定位、行内记录路径可回读。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 实现提交后，用本阶段真实交接件。
  落点：P7/T001 与 `phases/P7-阶段收口汇总.md`。
  验证：取 `handoff/` 下本阶段真实交接件，定位「阶段复盘｜」行，抽出其中的记录路径，按路径打开并读回首条内容；核对行内格式与 ≤300 字上限。
  环境与数据：本阶段真实交接件；交接件未产生时记 `incomplete`，恢复条件＝P7 阶段末交接写出。
  谁判：未参与实现的独立执行单元，P7 提交后。
  承接：结论写 P7/T001 完成记录与 `quality/tests/p7-handoff-fifth-line.output`。
  成本：executor=独立执行者；estimate_min=10；hard_cap_min=25；resources=交接件、记录原件；observation=行是否可定位、路径是否可开、字数；retry_cap=1；evidence_tier=命令级。
  资源来源：复用本阶段真实交接与记录，不新造交接样张。
  为什么不能再简：只判「有这一行」判不出路径可开；只判可开判不出字上限与格式。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：行可定位、路径可打开读回、≤300 字。
  失败：把行内路径改成一个不存在的记录路径，打开必须失败；若此时仍判通过，本条失败。
  证据：quality/tests/p7-handoff-fifth-line.output。

- [ ] **AC-P7-003**：本阶段若没有单元复盘记录，交接写「未执行：本阶段无单元复盘记录（缺 <单元>），原因…」，不写「无」。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 阶段末交接写出后。
  落点：P7/T001 与 `phases/P7-阶段收口汇总.md`。
  验证：读本阶段真实交接第五行，精确匹配「未执行」前缀与括号内的缺件单元、原因；核对没有把「无」当答案。
  环境与数据：本阶段真实交接件；`quality/evidence/reflection/` 实际有无记录决定本条走哪支（有记录则本条记不适用并写明理由）。
  谁判：未参与实现的独立执行单元，交接写出后。
  承接：结论写 P7/T001 完成记录与 `quality/tests/p7-unexecuted-line.output`。
  成本：executor=独立执行者；estimate_min=6；hard_cap_min=15；resources=交接件、复盘记录目录；observation=前缀与缺件单元、原因是否具名；retry_cap=1；evidence_tier=命令级。
  资源来源：复用真实交接与记录目录，不新造记录。
  为什么不能再简：只判「写了未执行」判不出缺哪个单元；写「无」会让读者以为做过（rev2 B4 已否）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：前缀命中、缺件单元具名、原因具体或标 unknown。
  失败：把整行写成「阶段复盘｜无」，前缀检查必须不命中；若此时仍判通过，本条失败。
  证据：quality/tests/p7-unexecuted-line.output。

- [ ] **AC-P7-004**：声称晋升时，旧错原件在旧字节上退出码非 0、当前字节上退出码为 0；本阶段不声称则不触发。
  关联 FR-CODE-P7。
  判定方式：需真实环境，可用自动化采集判；判定时点：每次交接声称晋升时；本阶段无晋升声称，按不触发记 `incomplete`，恢复条件＝首次真实声称晋升。
  落点：P7/T001 与 `phases/P7-阶段收口汇总.md`。
  验证：按交接行给出的旧错 `path#L` 取旧字节（git 历史或任务库外原件，须标出处与校验值），跑同一命令记录退出码；再对当前字节跑同一命令记录退出码；两次输出各存原件。
  环境与数据：旧错原件、当前字节、真实运行环境；旧原件不可得时记 `unavailable`，原因写缺哪件，恢复条件＝取回同字节原件。
  谁判：未参与实现的独立执行单元，声称晋升时。
  承接：结论写 P7/T001 完成记录与 `quality/tests/p7-promotion-olderror.output`（本阶段记 incomplete）。
  成本：executor=独立执行者；estimate_min=20；hard_cap_min=50；resources=旧错原件、当前字节、真实命令环境；observation=两次退出码、两次字节校验值；retry_cap=1；evidence_tier=真实采集。
  资源来源：复用旧错原件与当前字节，命令用原门命令；不新造失败。
  为什么不能再简：只判「现在通过」判不出是否曾有失败（等于没证明修好）；只判旧错不判当前会把回退当完成。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：旧字节退非 0、当前字节退 0、两件出处与校验值齐。
  失败：拿当前代码冒充旧错（两次都退 0），必须判失败；或声称晋升却不给旧错读数，也必须判失败。
  证据：quality/tests/p7-promotion-olderror.output。

- [ ] **AC-P7-005**：8 条退役逐条有承接与证据，不是只删不写。
  关联 FR-CODE-P7。
  判定方式：只能人读；判定时点：P7 实现提交后、合入前。
  落点：P7/T003 与 `phases/P7-阶段收口汇总.md`。
  验证：独立读者按 8 条清单（wh-review 悬空指针、stage-handoff「五个 workflow」、标准方法 C05、AGENTS:136、验收规范第三份测试范围、入口库存横幅、task-close 私有解析、Improvements 围栏）逐条读改动与承接句，核对每条都有承接与可回读证据。
  环境与数据：8 条涉及文件当前字节、退役批准原件（talk/2026-11-24-004-retirement.md）；文件行号按内容定位。
  谁判：没参与写作的独立读者，P7 合入前。
  承接：结论写 P7/T003 完成记录与 `quality/reviews/p7-eight-retirements.md`。
  成本：executor=独立读者；estimate_min=35；hard_cap_min=80；resources=8 条文件、退役批准原件；observation=每条是否有承接与证据、是否有只删不写；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用仓内 8 条文件与批准原件，不新造清单。
  为什么不能再简：只数改了 8 个文件判不出承接；漏一条会让旧规矩继续互相矛盾。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：8 条各有承接句与证据指针，无一条只删。
  失败：把 `skills/wh-review/SKILL.md`:132 的悬空指针直接删掉而不写承接（现有 OCR 路由测试），读者必须判失败。
  证据：quality/reviews/p7-eight-retirements.md。

- [ ] **AC-P7-006**：`core/task-close.mjs` 用共享任务类型解析、私有副本已删，且有规划任务收尾测试。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 实现提交后。
  落点：P7/T004 与 `phases/P7-阶段收口汇总.md`。
  验证：查 `core/task-close.mjs` 是否 import 并调用 `readTaskTypeFromDecisionLog`、私有解析函数是否已删；跑规划任务收尾测试，记录退出码；再读申报的 19/108 判定变化句。
  环境与数据：仓内 `core/task-close.mjs`、共享解析器、规划任务收尾测试；19 份历史材料只读，不改字节。
  谁判：未参与实现的独立执行单元，P7 提交后。
  承接：结论写 P7/T004 完成记录与 `quality/tests/p7-task-close-shared.output`。
  成本：executor=独立执行者；estimate_min=15；hard_cap_min=35；resources=收口工具、共享解析器、测试；observation=是否调用共享、私有副本是否删、测试退出码、判定变化是否申报；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内收口工具与历史只读材料，不新造规划任务。
  为什么不能再简：只判「调用了共享」判不出私有副本是否还在（第二份家）；不跑测试判不出规划任务是否被当普通任务收尾。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：调用共享、私有副本已删、规划任务测试退 0、判定变化已申报。
  失败：把私有解析副本加回 `core/task-close.mjs`（或在共享之外再算一遍类型），检查必须报第二份家；若仍判通过，本条失败。
  证据：quality/tests/p7-task-close-shared.output。

- [ ] **AC-P7-007**：`docs/architecture/real-entry-inventory.md` 文首有带日期横幅，文件仍在。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 提交后。
  落点：P7/T003 与 `phases/P7-阶段收口汇总.md`。
  验证：读该文件首屏，精确匹配「截至 2026-11-23 的历史快照；当前入口以 --help 为准」类横幅与日期；确认文件未被删除。
  环境与数据：该文件当前字节；横幅日期按 P7 卡写定，卡未出按决策日志第 6 项口径。
  谁判：未参与实现的独立执行单元，P7 提交后。
  承接：结论写 P7/T003 完成记录与 `quality/tests/p7-entry-inventory-banner.output`。
  成本：executor=独立执行者；estimate_min=5；hard_cap_min=12；resources=入口库存文件；observation=横幅是否存在、日期是否具名、文件是否在；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内入口库存，不新造快照。
  为什么不能再简：只判文件在判不出是否标明历史（读者会当现行）；只判横幅判不出文件是否被删。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：文件在、首屏有带日期历史横幅。
  失败：把横幅删掉或把文件整份删除（应为保留加横幅），检查必须红；若仍判通过即本条失败。
  证据：quality/tests/p7-entry-inventory-banner.output。

- [ ] **AC-P7-008**：`specs/Improvements.md` 的迁移围栏块已删、文件头指针仍在。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 提交后。
  落点：P7/T003 与 `phases/P7-阶段收口汇总.md`。
  验证：跑 `git diff -- specs/Improvements.md` 读删改范围，确认删的是迁移前原文围栏（:7-15 一类的引用块），并确认文件头指针句仍存在。
  环境与数据：P7 分支工作树、该文件改动 diff；与 P6 的 AC-P6-004 互补（P6 判全包不改，P7 判本包按退役第 8 条改）。
  谁判：未参与实现的独立执行单元，P7 提交后。
  承接：结论写 P7/T003 完成记录与 `quality/tests/p7-improvements-fence.output`。
  成本：executor=独立执行者；estimate_min=5；hard_cap_min=15；resources=git、该文件；observation=围栏是否删、头指针是否在；retry_cap=1；evidence_tier=命令级。
  资源来源：复用 git 历史与该文件，不新造对照。
  为什么不能再简：只判 diff 非空判不出删的是围栏不是头指针；只判头指针判不出围栏是否还在。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：围栏块已删、头指针仍在。
  失败：把文件头指针一并删掉，检查必须报缺失；若仍判通过，本条失败。
  证据：quality/tests/p7-improvements-fence.output。

- [ ] **AC-P7-009**：退役后没有悬空指针，重点 `skills/wh-review/SKILL.md`:132 指向的旧测试已不再被引用。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 提交后。
  落点：P7/T003 与 `phases/P7-阶段收口汇总.md`。
  验证：抽 8 条退役涉及的指针逐个解析（路径存在、行位有内容），重点读 wh-review:132 是否已改指现有 OCR 路由测试；只查这 8 处，不做全仓扫描。
  环境与数据：8 条涉及文件的当前字节；测试目录真实存在的文件名。
  谁判：未参与实现的独立执行单元，P7 提交后。
  承接：结论写 P7/T003 完成记录与 `quality/tests/p7-no-dangling.output`。
  成本：executor=独立执行者；estimate_min=12；hard_cap_min=30；resources=8 处文件、测试目录；observation=每处指针是否可解析、是否指已删测试；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内文件与测试目录，不新造。
  为什么不能再简：只查 wh-review 一处判不出其余退役指针；做全仓扫描会越出 R-009 范围。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：8 处指针全部可解析，无指向已删测试。
  失败：把 wh-review:132 保留指向已删测试，检查必须报悬空；若仍判通过即本条失败。
  证据：quality/tests/p7-no-dangling.output。

- [ ] **AC-P7-010**：`git diff --name-only` 的结果只在声明写集内。
  关联 FR-CODE-P7。
  判定方式：机器可判；判定时点：P7 提交后、合入前。
  落点：P7/T001–T004 与 `phases/P7-阶段收口汇总.md`。
  验证：跑 `git diff --name-only <P7 起点>..HEAD`，逐行与 P7 卡声明的写集比对，列出越界文件；核对 `AGENTS.md`（归 P6）、`stage-reflection`（归 P5）未被本包改。
  环境与数据：P7 分支提交区间、P7 卡写集；写集按任务三指针模式（卡内只留指针＋sha256）。
  谁判：未参与实现的独立执行单元，P7 合入前。
  承接：结论写 P7/T001 完成记录与 `quality/tests/p7-writeset-boundary.output`。
  成本：executor=独立执行者；estimate_min=8；hard_cap_min=20；resources=git、P7 卡写集；observation=越界文件清单、跨包文件是否被动；retry_cap=1；evidence_tier=命令级。
  资源来源：复用 git 提交区间与卡写集，不新造清单。
  为什么不能再简：只判「改了该改的」判不出多改的文件（跨包覆盖会让 P5/P6 的句子被冲掉）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：diff 全部落在写集内，跨包文件未动。
  失败：在 P7 提交里顺手改 `skills/stage-reflection/SKILL.md`（归 P5），比对必须报越界；若仍判通过，本条失败。
  证据：quality/tests/p7-writeset-boundary.output。

### A.8 包 8 — 设计时质量、四技能流程与四阶段接线（AC-P8-001 .. AC-P8-005）

- [ ] **AC-P8-001**：没参与写作的读者只打开一张 `phases/P<n>-*.md` 与卡模板，能指出「为什么能解决／对应原问题／残余」三句在该卡正文的位置。
  关联 FR-CODE-P8。
  判定方式：只能人读；判定时点：build-plan 第 6 步出卡后、第 7 步渲染索引前。
  落点：P8/T001、T002 与 `phases/P8-设计时质量与四阶段接线.md`。
  验证：给读者一张真实新卡与 `skills/spec-plan/templates/phase-template.md`，要求只读卡正文指出三句位置；逐句记录在第几节第几行。
  环境与数据：build-plan 出的真实卡、Phase 模板当前字节；卡未出时记 `incomplete`，恢复条件＝build-plan 第 6 步出卡。
  谁判：没参与写作的独立读者，出卡后、渲染索引前。
  承接：结论写 P8/T001、T002 完成记录与 `quality/tests/p8-card-five-sentences.md`。
  成本：executor=独立读者；estimate_min=12；hard_cap_min=30；resources=真实卡、模板；observation=三句是否在卡正文、是否写成「见 spec」；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用 build-plan 出卡与仓内模板，不写样卡。
  为什么不能再简：只判「字段在」判不出三句是否成句（本轮风险正是「字段齐即质量」）；只读模板判不出卡面是否落位。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：三句都在卡正文、各自可定位，没有一句写成「见 spec」。
  失败：把「残余/未闭环」一句从卡里删掉（或改写成「见 spec」），读者必须指不出位置，本条判失败。
  证据：quality/tests/p8-card-five-sentences.md。

- [ ] **AC-P8-002**：`node --test tests/contract/four-skill-wiring.test.mjs` 五项全过。
  关联 FR-CODE-P8。
  判定方式：机器可判；判定时点：P8 提交后。
  落点：P8/T006 与 `phases/P8-设计时质量与四阶段接线.md`。
  验证：在仓根跑 `node --test tests/contract/four-skill-wiring.test.mjs`，记录五项结果与退出码；再单跑 `node tools/cli/check-stage-steps.mjs --stage=build-plan --step=6 --task-path=<当前任务根> --material-root=<材料根> --json`，确认第 6 步只剩 facts 槽类缺口、不再出现「目录仅作导航」「原件不可读」。
  环境与数据：仓内测试与四份 `steps.json`、本任务材料根；具名缺口：`workflows/make-decision/steps.json` 第 9 步目标锚 `decision-log.md#包级收敛台账` 在本决策日志**不存在**（现锚 `#每个包定了哪些决定` 也不存在），该节 owner 是包 13，而包 13 依赖 P9 提交，构成环——本判据对该步只记 `incomplete`，不判过、不假装该节存在；其余四项照判。
  谁判：未参与实现的独立执行单元，P8 提交后。
  承接：结论写 P8/T006 完成记录与 `quality/tests/p8-four-skill-wiring.output`。
  成本：executor=独立执行者；estimate_min=12；hard_cap_min=30；resources=接线测试、四份步骤表、材料根；observation=五项通过/失败、第 6 步 gap 名单；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内测试与步骤表，隔离临时目录由测试自建，不读真实任务库。
  为什么不能再简：只跑绿判不出「证据形态是否合法」（第 2 条断言）；不跑单步判不出第 6 步是否仍被目录类缺口挡住。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：五项全过且退出 0；第 6 步不再出现目录类与不可读类缺口。
  失败：把 `workflows/build-code/steps.json` 第 2 步改回 `{"kind":"test","uri_or_path":"quality/tests/"}`，同命令必须红并点名该步；若仍五项全过，本条失败。
  证据：quality/tests/p8-four-skill-wiring.output。

- [ ] **AC-P8-003**：陌生执行者只读 `workflows/<stage>/SKILL.md` 与对应技能正文，对「调哪个技能、何时调、交出什么」三问都给出具名答案（技能路径＋锚＋产物）。
  关联 FR-CODE-P8。
  判定方式：只能人读；判定时点：P8 合并前。
  落点：P8/T006 与 `phases/P8-设计时质量与四阶段接线.md`。
  验证：给一名没参与写作的执行者四份阶段正文与四份技能正文，限时只读，逐问记录答案；核对每问是否给路径、锚与产物，且答案能从正文直接读到（不需要翻会话）。
  环境与数据：四份阶段正文、四份技能正文（decision-maker/task-maker/phase-maker/run-phase）当前字节。
  谁判：没参与写作的执行者，P8 合并前。
  承接：结论写 P8/T006 完成记录与 `quality/tests/p8-stranger-readback.md`。
  成本：executor=陌生执行者；estimate_min=25；hard_cap_min=55；resources=八份正文；observation=三问是否有路径＋锚＋产物、是否答成「按技能执行」；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用仓内正文，读者就地作答；不另写导读。
  为什么不能再简：只判「正文提到技能」判不出何时调与交出什么；只问一个人判不出是否靠会话记忆补齐。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：三问都有具名答案，且都能在正文里定位到对应句。
  失败：把 build-plan 第 6 步的技能点名句删掉，陌生执行者必然答成「按技能执行」，本条必须判不通过。
  证据：quality/tests/p8-stranger-readback.md。

- [ ] **AC-P8-004**：独立审查者按本包五问判三条真实坏例，三条都判不成立并写明死在第几问。
  关联 FR-CODE-P8。
  判定方式：只能人读；判定时点：P8 合并前。
  落点：P8/T001、T002 与 `phases/P8-设计时质量与四阶段接线.md`。
  验证：独立审查者逐条读三个坏例并作答：①任务三 P4（`specs/archive/delivery-quality-plan-20261123/phases/P4-计划首卡与供件.md:284` 的 Done 写 7773 B／`5348ba5b…`／`skill_binding.ok=true`）；②任务三 P8（`.../phases/P8-代码红测与演示.md:189` 门 7/7 但 AC-QUAL-020 incomplete）；③任务四 P4 旧版（`convergence-notes.md:46`）。每条写「死在第几问」并引原文行位。
  环境与数据：前两例原件在归档任务三只读区，可直接打开；**第三例 `convergence-notes.md:46` 在本仓未找到 → 未取得**，原因：仓内无该文件，owner＝任务四材料 owner，恢复条件＝提供该原件或由原决定人确认同源替代件；缺该件时本条对第三例只记 `incomplete`，前两例照判，不因缺一例判整条通过。
  谁判：独立审查者（非写者、非判据作者），P8 合并前。
  承接：结论写 P8/T001、T002 完成记录与 `quality/reviews/p8-bad-examples.md`。
  成本：executor=独立审查者；estimate_min=30；hard_cap_min=70；resources=两个归档坏例、第三例原件（缺）；observation=三条是否都判不成立、是否写明死在第几问；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用归档任务三原件（只读）与任务四材料，不重造坏例。
  为什么不能再简：只判一条判不出「填满但方案空」的普遍性；不写死在第几问会退化成「感觉不行」。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：每条都判不成立且写明死在第几问，引原文行位。
  失败：把任务三 P4 那条判成成立（只因字段齐就给过），本条必须判失败；同理任一条判成立即失败。
  证据：quality/reviews/p8-bad-examples.md。

- [ ] **AC-P8-005**：同一审查者对一条好例（接手者按新卡写出首改路径）判通过，且理由落在「第 4 问有真实信号」。
  关联 FR-CODE-P8。
  判定方式：只能人读；判定时点：P8 合并前，与 AC-P8-004 同批。
  落点：P8/T001、T002 与 `phases/P8-设计时质量与四阶段接线.md`。
  验证：同一审查者读好例（P4 新卡＋接手者写出的首改路径），作答通过与否并写明理由落在哪一问；核对理由不是「字节≠旧卡」或「字段齐」。
  环境与数据：好例原件（P4 新卡与接手者首改记录）；原件未取得时记 `incomplete`，恢复条件＝提供该好例或由原决定人指定同源好例。
  谁判：与 AC-P8-004 同一独立审查者，同批。
  承接：结论写 P8/T001 完成记录与 `quality/reviews/p8-bad-examples.md` 末节。
  成本：executor=独立审查者；estimate_min=15；hard_cap_min=35；resources=好例原件；observation=是否通过、理由落在第几问；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实好例，不新造。
  为什么不能再简：只判「通过」判不出是不是因为字段齐；不写理由落点会让好例与坏例无法区分。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：判通过且理由明确落在「第 4 问有真实信号」。
  失败：只因「字段齐」就判通过（理由写「六件都在」），本条必须判失败。
  证据：quality/reviews/p8-bad-examples.md。

### A.9 包 9 — 验收证据落点与步骤硬门（AC-P9-001 .. AC-P9-005）

- [ ] **AC-P9-001**：一份新 PRD 任务节第 4 行同时有「证据落点」与「真跑或替代」两样；替代写清不能在证明什么与 owner。
  关联 FR-CODE-P9。
  判定方式：只能人读；判定时点：build-prd 第 4 步后。
  落点：P9/T001 与 `phases/P9-验收证据落点与硬门.md`。
  验证：打开一份真实新 PRD 的任务节，读第 4 行，逐样找证据落点（原件路径＋行位）与真跑/替代；替代还要读「不能证明什么」与 owner 两项。
  环境与数据：真实新 PRD（本任务或下一任务）、`skills/spec-prd/SKILL.md` 与模板当前字节；新 PRD 未产生时记 `incomplete`，恢复条件＝build-prd 第 4 步真实产出。
  谁判：没参与写 PRD 的独立读者，build-prd 第 4 步后。
  承接：结论写 P9/T001 完成记录与 `quality/tests/p9-four-row.md`。
  成本：executor=独立读者；estimate_min=12；hard_cap_min=30；resources=真实 PRD、技能与模板；observation=两样是否都在、替代四要素是否齐；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实 PRD 与仓内技能模板，不新写 PRD。
  为什么不能再简：只判「有第 4 行」判不出落点与真跑边界（本轮坏例正是只写「测试会过」）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两样都在，替代四要素齐且都具名。
  失败：把第 4 行写成「测试会过／检查通过」而无落点与替代，读者必须判不合格。
  证据：quality/tests/p9-four-row.md。

- [ ] **AC-P9-002**：Phase 卡「这一 Phase 怎么验收」里每条证据落点逐条打开都可读，且是原件不是目录。
  关联 FR-CODE-P9。
  判定方式：机器可判；判定时点：P9 提交后，用真实 Phase 卡。
  落点：P9/T002 与 `phases/P9-验收证据落点与硬门.md`。
  验证：从真实 Phase 卡抽取「怎么验收」节全部落点，逐个 `test -r` 并判断是文件还是目录；目录一律记失败。
  环境与数据：真实 Phase 卡（build-plan 产出）、落点指向的原件；卡未出时记 `incomplete`，恢复条件＝卡出。
  谁判：未参与实现的独立执行单元，P9 提交后。
  承接：结论写 P9/T002 完成记录与 `quality/tests/p9-six-items-openable.output`。
  成本：executor=独立执行者；estimate_min=8；hard_cap_min=20；resources=真实卡、落点原件；observation=可读性、文件/目录类型；retry_cap=1；evidence_tier=命令级。
  资源来源：复用真实卡与原件，不新造落点。
  为什么不能再简：只判「写了路径」判不出目录冒充原件（审计已抓到裸目录）；只判一条判不出其余。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：全部落点可读且都是文件。
  失败：把某条落点写成 `quality/tests/`（目录），检查必须报不可读/目录；若仍判通过即本条失败。
  证据：quality/tests/p9-six-items-openable.output。

- [ ] **AC-P9-003**：用 `record-step-evidence` 写一条证据后，`check-stage-steps` 对该步判「已完成」；从 `facts.jsonl` 删该条后同命令判「未留痕」。
  关联 FR-CODE-P9。
  判定方式：机器可判；判定时点：P9-3 提交后。
  落点：P9/T003 与 `phases/P9-验收证据落点与硬门.md`。
  验证：在隔离任务根上先跑 `node tools/cli/record-step-evidence.mjs --task-path=<任务> --stage=build-code --step=2 --ref=<RED 捕获> --command="<原命令>" --exit-code=1 --failure-signature=<具名串>`，再跑 `node tools/cli/check-stage-steps.mjs --stage=build-code --step=2 --task-path=<任务> --material-root=<材料根> --current-read-receipt=<回执> --json`，读 `judgment`；随后从 `facts.jsonl` 删该条并重跑。
  环境与数据：`mkdtemp` 隔离任务根与材料根、真实 RED 捕获件；不写真实任务库。具名缺口：make-decision 第 9 步的锚向不存在的 `decision-log.md#包级收敛台账`，该步不在本条样本内（样本用 build-code 第 2 步），但同一生产者对第 9 步仍会因缺节判不了——记 `incomplete`，owner＝包 13，恢复条件＝该节真实落地。
  谁判：未参与实现的独立执行单元，P9-3 提交后。
  承接：结论写 P9/T003 完成记录与 `quality/tests/p9-step-evidence.json`。
  成本：executor=独立执行者；estimate_min=15；hard_cap_min=40；resources=隔离任务根、真实 RED 原件；observation=两次 `judgment` 值；retry_cap=1；evidence_tier=命令级。
  资源来源：复用真实 RED 捕获与仓内两个 CLI，任务根就地造隔离副本。
  为什么不能再简：只判「写了记录」判不出完成判定是否真读该槽；不删再跑判不出是否「有记录就算完成」。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：写入后 `judgment:"已完成"`；删除后 `judgment:"未留痕"`。
  失败：把 `check-stage-steps` 的完成判定改成只看槽存在不看内容（或让 record-step-evidence 写错槽），删除后必须仍判「已完成」；若此时仍判「未留痕」即口径被弄反，本条失败。
  证据：quality/tests/p9-step-evidence.json。

- [ ] **AC-P9-004**：`node --test tests/contract/four-skill-wiring.test.mjs` 通过；删 `phases/index.md` 后 build-plan 第 6 步不得判完成并点名缺件；三份既有测试默认走隔离根且改坏即红。
  关联 FR-CODE-P9。
  判定方式：机器可判；判定时点：P9-4 提交后。
  落点：P9/T004 与 `phases/P9-验收证据落点与硬门.md`。
  验证：跑接线测试记录五项；在隔离材料根删掉 `phases/index.md` 后跑 `check-stage-steps --stage=build-plan --step=6` 读判定与缺件名；逐个跑 `skill-usage-negative.test.mjs`、`phase-author-first-card.test.mjs`、`phase-index-write-authority.test.mjs` 记录退出码，再按各自的被检字段改坏一次，确认各红一次。
  环境与数据：仓内测试、隔离材料根（`mkdtemp`）、本机 Node；当前任务 `phases/` 尚未生成，样本在隔离根内就地造。
  谁判：未参与实现的独立执行单元，P9-4 提交后。
  承接：结论写 P9/T004 完成记录与 `quality/tests/p9-wiring-assertions.output`。
  成本：executor=独立执行者；estimate_min=20；hard_cap_min=50；resources=四份测试、隔离材料根；observation=五项结果、删索引后的判定与缺件名、三次反向断言是否红；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内测试与就地造的隔离材料根，不读真实任务库。
  为什么不能再简：只跑绿判不出断言是否真能红（审计 A3 的核心）；不删索引判不出缺件是否被点名。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：接线测试五项通过；删索引后判不完成并点名 `phases/index.md`；三门测试正向退 0、改坏各红一次。
  失败：把 `phase-index-write-authority.test.mjs` 的隔离根改回真实任务三路径，反向断言必须失效（改坏也不红）；若仍判通过，本条失败。
  证据：quality/tests/p9-wiring-assertions.output。

- [ ] **AC-P9-005**：`node tools/cli/run-checks.mjs --task-path=<任务根>` 在指定 11 步任一步未完成时退 1 并列缺步；补齐后退 0；未声明 `skill` 的步骤缺口仍只报告、不改退出码。
  关联 FR-CODE-P9。
  判定方式：机器可判；判定时点：P9-5 提交后。
  落点：P9/T005 与 `phases/P9-验收证据落点与硬门.md`。
  验证：在隔离任务根上跑 `node tools/cli/run-checks.mjs --task-path=<任务根>`，读退出码与 `missing_steps`；用 `record-step-evidence` 逐步补齐后再跑；另造一个未声明 `skill` 的步骤缺口，确认退出码不变。
  环境与数据：隔离任务根、四份 `steps.json` 派生出的 11 步清单、本机 Node。具名缺口：make-decision 第 9 步的完成证据要求指向 `decision-log.md#包级收敛台账`，该节不存在（现锚 `#每个包定了哪些决定` 同样不存在），owner＝包 13，包 13 又依赖 P9 提交，构成环——因此真实任务本轮不可能 11 步全绿；本条对真实任务的第 9 步记 `incomplete`，对「补齐后 0」的通过信号只在**不含该步**的隔离样本上判，并写明该样本缺哪一步、为什么不假装全绿。
  谁判：未参与实现的独立执行单元，P9-5 提交后。
  承接：结论写 P9/T005 完成记录与 `quality/tests/p9-hard-gate.output`。
  成本：executor=独立执行者；estimate_min=20；hard_cap_min=50；resources=隔离任务根、`run-checks`、11 步清单；observation=退出码、`missing_steps` 名单、未声明 skill 的缺口是否被误伤；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内 `run-checks` 与就地造的隔离任务根，不写真实任务库。
  为什么不能再简：只判「报告了缺步」判不出硬门（审计已证报告加行仍 exit 0）；不造未声明 skill 的缺口判不出是否误伤。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：有缺步时退 1 且 `missing_steps` 点名；隔离样本补齐后退 0；未声明 `skill` 的缺口不改变退出码。
  失败：把 `stepCoverageExit` 的缺步分支改回只报告（退 0），有缺步时必须仍退 1；若此时退 0 而判定通过即本条失败。
  证据：quality/tests/p9-hard-gate.output。

### A.10 包 10 — 真实使用者与首用（AC-P10-001 .. AC-P10-004）

- [ ] **AC-P10-001**：下一包作者不看写作会话，只凭卡与指针写出首个决定或首处改动，并留下含「做了什么、结果、卡在哪」的开工记录。
  关联 FR-CODE-P10。
  判定方式：只能人读；判定时点：下一包开工后，P10 合并前。
  落点：P10/T001 与 `phases/P10-真实使用者与首用.md`。
  验证：让下一包作者在不知道本轮写作会话的条件下，只按卡与指针开工，留下第一条记录；独立审查者核记录来源（记录者≠写者）与内容三样，判断是否复述。
  环境与数据：真实下一包卡与指针、作者开工记录；下一包尚未开工时记 `incomplete`，恢复条件＝下一包真实开工。
  谁判：独立审查者（非写者），下一包开工后。
  承接：结论写 P10/T001 完成记录与 `quality/tests/p10-next-package-first-step.md`。
  成本：executor=独立审查者；estimate_min=20；hard_cap_min=50；resources=下一包卡、开工记录；observation=三样是否齐、是否只写「清楚／已读」、记录者是否写者；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用下一包真实卡与记录，不代写记录。
  为什么不能再简：只判「有记录」判不出是否复述（本轮正是「已通知下游」当用过）；不核记录者会退化成自述。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：记录有三样且能看出真的做了第一个动作；记录者≠写者。
  失败：记录只写「清楚／已读」或由原写者自记，必须判失败。
  证据：quality/tests/p10-next-package-first-step.md。

- [ ] **AC-P10-002**：接手实施者按卡打开文件，写下第一处改动前的读回，含首读符号与首改路径，两样都指向真实符号。
  关联 FR-CODE-P10。
  判定方式：只能人读；判定时点：下一 Phase 实施开工后。
  落点：P10/T002 与 `phases/P10-真实使用者与首用.md`。
  验证：读接手实施者的读回记录，逐样核对首读符号（在真实文件里能定位）与首改路径（真实存在）；再判断是否照抄了卡面六件。
  环境与数据：真实读回记录、被读文件与符号；记录未产生时记 `incomplete`，恢复条件＝下一 Phase 真实开工。
  谁判：独立读者（非写者），开工后。
  承接：结论写 P10/T002 完成记录与 `quality/tests/p10-next-package-first-step.md` 末节。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=35；resources=读回记录、真实文件；observation=符号是否可定位、路径是否真实、是否照抄卡面；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实读回与文件，不新造符号。
  为什么不能再简：只判「写了读回」判不出符号真假；照抄卡面六件会看不出「读过文件」。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：两样都有且都能在真实文件里定位。
  失败：把首读符号写成卡面里没有对应实现的虚构符号，读者必须判失败。
  证据：quality/tests/p10-next-package-first-step.md。

- [ ] **AC-P10-003**：新交接在「关键事实与数据状态」之外有一行「真实使用者动作：<谁、做了什么、留下什么>」，且是动作不是通知。
  关联 FR-CODE-P10。
  判定方式：只能人读；判定时点：P10 提交后，用一份真实新交接。
  落点：P10/T003 与 `phases/P10-真实使用者与首用.md`。
  验证：打开新交接件，找「真实使用者动作」行，逐项读谁、做了什么、留下什么；判断是否只是「已通知下游／已说明」。
  环境与数据：真实新交接件、`skills/stage-handoff/SKILL.md` 当前字节；交接件未产生时记 `incomplete`，恢复条件＝下一阶段交接。
  谁判：独立读者（非写者），P10 合并前。
  承接：结论写 P10/T003 完成记录与 `quality/tests/p10-handoff-user-action.md`。
  成本：executor=独立读者；estimate_min=10；hard_cap_min=25；resources=新交接件、方法正文；observation=三项是否具名、是否只是通知；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实交接与方法正文，不新写交接。
  为什么不能再简：只判「有这一行」判不出是不是动作（「已通知」也能占位）；`grep` 只能辅助，不作门。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：三项具名，且能看出对方真做了事并留下件。
  失败：把该行写成「已通知下游」，读者必须判失败。
  证据：quality/tests/p10-handoff-user-action.md。

- [ ] **AC-P10-004**：任务一二三 24 条 blocked 逐条有「缺什么＋恢复条件」，无一条写成 pass、无一条漏列；抽三条对照归档原件复核一致。
  关联 FR-CODE-P10。
  判定方式：只能人读；判定时点：P10 提交后。
  落点：P10/T004 与 `phases/P10-真实使用者与首用.md`。
  验证：独立读者读 P10 第 9 项 24 行 blocked 表，逐条核缺什么与恢复条件；抽三条（任务三 AC-020、任务一 AC-CLOSE-001、任务二 9 条中的一条）对照归档原件（任务三 closeout、任务一 closeout `:720-735`、`p12/context.md:8`）复核。
  环境与数据：本任务材料第 9 项（24 行）、三份归档只读原件；任务二无 closeout，其 2 项 pass 名单未取得（owner＝任务二 owner）。
  谁判：独立读者（非写者），P10 提交后。
  承接：结论写 P10/T004 完成记录与 `quality/tests/p10-blocked-ledger.md`。
  成本：executor=独立读者；estimate_min=30；hard_cap_min=70；resources=24 行 blocked 表、三份归档原件；observation=条数是否为 24、每条是否有缺什么与恢复条件、有无写成 pass 或漏列；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用本任务材料与归档只读原件，不重写 closeout。
  为什么不能再简：只数 24 行判不出恢复条件；不抽核会漏掉与原件不一致（例如把 inconclusive 记成 pass）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：24 行齐全、每条有缺什么与恢复条件、抽样三条与原件一致、无 pass。
  失败：把任务三 AC-015 的 inconclusive 写成 pass（或漏掉任务一 AC-MAT-001 一行），读者必须判失败。
  证据：quality/tests/p10-blocked-ledger.md。

### A.11 包 11 — 缺口分诊与闭环收口（AC-P11-001 .. AC-P11-003）

- [ ] **AC-P11-001**：任务三 9 项 incomplete 逐条分到设计／实现／验收标准／资源四类，至少各有一个该类例子；未分类不得收口。
  关联 FR-CODE-P11。
  判定方式：只能人读；判定时点：P11 提交后。
  落点：P11/T001、T002 与 `phases/P11-缺口分诊与闭环.md`。
  验证：独立读者读 9 项（AC-007/008/009/016/019/020/021/022/023）逐条分类结果，核每类至少一例，并核对每条写「哪类、证据、owner、下一步」。
  环境与数据：本任务材料里的 9 项分类（P11 提交时产出）、任务三 closeout 只读原件；分类件未产生时记 `incomplete`，恢复条件＝P11 提交。
  谁判：独立读者（非写者），P11 提交后。
  承接：结论写 P11/T001 完成记录与 `quality/tests/p11-gap-triage.md`。
  成本：executor=独立读者；estimate_min=25；hard_cap_min=60；resources=9 项分类、归档 closeout；observation=是否逐条分类、四类是否各有例子、每项四要素是否齐；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用任务三真实缺口与归档只读原件，不新造缺口。
  为什么不能再简：只判「有分类列」判不出四类是否都有例子；不分到具体类别会退化成「缺材料」这类无效标签。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：9 项逐条有类别、证据、owner、下一步；四类各至少一例。
  失败：把 AC-016 只写「缺材料」不分到四类，读者必须判未分类，本条失败。
  证据：quality/tests/p11-gap-triage.md。

- [ ] **AC-P11-002**：设计缺口回 P8/P9/P10 重设计并复验；实现缺口修复并重跑；验收标准缺口回原决定人；资源缺口写恢复条件或明确接受限制。
  关联 FR-CODE-P11。
  判定方式：只能人读；判定时点：P11 提交后，逐类路由核完。
  落点：P11/T002 与 `phases/P11-缺口分诊与闭环.md`。
  验证：独立读者按四类各取一条，核对处置是否走对应闭环：设计类是否回 P8/P9/P10 并留复验、实现类是否有修复提交与重跑回执、验收标准类是否回原决定人、资源类是否写恢复条件或接受限制。
  环境与数据：9 项分类与各自处置原件、对应 Phase 的复验回执；处置未发生时记 `incomplete`，恢复条件＝对应类处置真实发生。
  谁判：独立读者（非写者），P11 提交后。
  承接：结论写 P11/T002 完成记录与 `quality/tests/p11-triage-closure.md`。
  成本：executor=独立读者；estimate_min=30；hard_cap_min=70；resources=分类、处置原件、复验回执；observation=四类是否各走对闭环、有无以修复冒充资源恢复；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实处置与复验回执，不新造。
  为什么不能再简：只判「都处理了」判不出路由是否对（把资源缺口当实现缺口改代码会越界）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：四类各走对闭环，且各有可回读的原件。
  失败：把资源类缺口（如缺真实下游）当实现缺口直接改代码并声称修好，读者必须判失败。
  证据：quality/tests/p11-triage-closure.md。

- [ ] **AC-P11-003**：有分类／owner／动作／验证的缺口可以通过收口；只有未分类的缺口才被拒，不因「有 incomplete」硬拒。
  关联 FR-CODE-P11。
  判定方式：机器可判；判定时点：P11 提交后。
  落点：P11/T003、T004 与 `phases/P11-缺口分诊与闭环.md`。
  验证：造两份隔离任务样本：一份 9 项都已分类且带 owner/动作/验证，一份有一项未分类；分别跑收口入口，读退出码与拒绝原因。
  环境与数据：`mkdtemp` 隔离任务根两份、真实收口入口 `node tools/cli/task-close.mjs`；真实任务库不写。
  谁判：未参与实现的独立执行单元，P11 提交后。
  承接：结论写 P11/T003 完成记录与 `quality/tests/p11-close-condition.output`。
  成本：executor=独立执行者；estimate_min=15；hard_cap_min=40；resources=两份隔离样本、收口入口；observation=两份退出码与拒绝原因；retry_cap=1；evidence_tier=命令级。
  资源来源：复用真实收口入口，样本就地造；不新建成套材料。
  为什么不能再简：只测一份判不出「不硬拒 incomplete」与「未分类才拒」的边界；只看拒绝原因判不出退出码。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：已分类样本通过收口；未分类样本被拒并点名缺分类。
  失败：把收口条件改成「存在任何 incomplete 即拒」（硬拒），已分类样本必须被拒；若此时仍判它通过而口径已是硬拒，本条失败。
  证据：quality/tests/p11-close-condition.output。

### A.12 包 12 — 任务一二三修复（AC-P12-001 .. AC-P12-002）

本包受限状态写清：**只有 C2 现在修**（用户 2026-11-25 决定，原件 `talk/2026-11-25-004-p12-blocked.md`）；C1、B2、B3、C3、D1 保持 blocked，各自写 owner、缺什么与恢复条件，任何一条都不得写成 pass。B2 只交付设计（解析前移＋fallback），实施不在本轮。

- [ ] **AC-P12-001**：材料缺 `approved_direction` 时，wh-review detail 报 `MATERIAL_INCOMPLETE`；只给 instructions 的那份不得退 0。
  关联 FR-CODE-P12。
  判定方式：机器可判；判定时点：P12a 提交后。
  落点：P12/T001 与 `phases/P12-任务一二三修复.md`。
  验证：造两份材料（一份只给 instructions 缺 `approved_direction`，一份完整），分别跑 `skills/wh-review/scripts/review-materials.mjs` 的 detail 路径与 `simple-review-runner.mjs`，记录 detail 报错码、`runSimpleReview` 可用状态与退出码；再跑 `tests/contract/wh-review-detail-incomplete.test.mjs`（本包新建，当前仓内不存在）与更新后的 `ocr-delegation-route.test.mjs`。
  环境与数据：`mkdtemp` 内两份材料、仓内 wh-review 脚本与两份契约测试；真实任务材料只读，不改。
  谁判：未参与实现的独立执行单元，P12a 提交后。
  承接：结论写 P12/T001 完成记录与 `quality/tests/p12-c2-detail.output`。
  成本：executor=独立执行者；estimate_min=15；hard_cap_min=40；resources=两份材料、wh-review 脚本、契约测试；observation=detail 错误码、可用状态、三处退出码；retry_cap=1；evidence_tier=命令级。
  资源来源：复用仓内脚本与就地造的两份材料，不新造第二套审查器。
  为什么不能再简：只判「报了一句 incomplete」判不出是否具名（原缺陷正是只写 `Supplied material is incomplete` 一句并仍 available）；只跑一份判不出完整材料是否保持可用。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：缺键那份 detail 报 `MATERIAL_INCOMPLETE`、`runSimpleReview` 不可用、退出非 0；完整那份仍可用；两份契约测试通过。
  失败：把 `review-materials.mjs` 的缺键分支改回只写一句并让 `runSimpleReview` 保持 available，同命令必须退 0 且无码；若此时仍判通过，本条失败。
  证据：quality/tests/p12-c2-detail.output。

- [ ] **AC-P12-002**：C1、B2、B3、C3、D1 五条逐条有 owner、缺什么与恢复条件，无一条写成 pass。
  关联 FR-CODE-P12。
  判定方式：只能人读；判定时点：P12b、P12c 提交后。
  落点：P12/T003 与 `phases/P12-任务一二三修复.md`。
  验证：独立读者读五条 blocked 记录，逐条核 owner、缺什么、恢复条件三项；再核 B2 的设计件是否只写设计、没有实施声明；最后核对没有任何一条被写成 pass 或「已修」。
  环境与数据：P12 五条 blocked 记录、B2 设计件、用户决定原件 `talk/2026-11-25-004-p12-blocked.md`；五条 owner 现只能按角色记，**各 owner 的答复原件未取得**（原因：本轮只写设计与 blocked，未发起 owner 决策），恢复条件＝owner 出书面答复；记录未产生时记 `incomplete`，恢复条件＝P12b/c 提交。
  谁判：独立读者（非写者），P12b/c 提交后。
  承接：结论写 P12/T003 完成记录与 `quality/tests/p12-blocked.md`。
  成本：executor=独立读者；estimate_min=20；hard_cap_min=50；resources=五条记录、设计件、决定原件；observation=三项是否齐、有无写成 pass、B2 是否越界实施；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用本轮决定原件与设计件，不重写设计。
  为什么不能再简：只数五条判不出 owner 是否真人可找；写成 pass 会让「设计完成」冒充「修好」。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：五条各有 owner、缺什么、恢复条件；B2 只有设计；无一条写成 pass。
  失败：把 C1 写成「已修」或把 B2 写成已实施（随提交改了 `task-store` 的 `STAGE_ROW_KEYS`），读者必须判失败。
  证据：quality/tests/p12-blocked.md。

### A.13 包 13 — 当前任务重写与独立任务端到端设计（AC-P13-001 .. AC-P13-005）

- [ ] **AC-P13-001**：重写设计完整写出目标结构（FR→AC→Phase→oracle）、每张 Phase 卡五节、phase-maker 八步与旧 spec 副本路径；不要求现在写 spec 或 phases。
  关联 FR-CODE-P13。
  判定方式：只能人读；判定时点：P13 设计件提交后。
  落点：P13/T001 与 `phases/P13-重写与端到端设计.md`。
  验证：独立读者读 `quality/evidence/p13/rewrite-plan.md`，逐项找目标结构四段、五节名、八步名与旧 spec 副本路径（含 sha256），并确认文中没有把「计划完整」写成「已重写」。
  环境与数据：P13 设计件、旧 spec 副本（只作设计输入，不改）、`skills/phase-maker/SKILL.md#八步` 当前字节；设计件未产生时记 `incomplete`，恢复条件＝P13 提交。
  谁判：独立读者（非写者），P13 提交后。
  承接：结论写 P13/T001 完成记录与 `quality/tests/p13-plan-review.md`。
  成本：executor=独立读者；estimate_min=20；hard_cap_min=50；resources=设计件、旧 spec、phase-maker 八步；observation=四段结构、五节、八步、旧副本路径是否齐；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用旧 spec 副本与仓内技能，不新写重写方案。
  为什么不能再简：只判「有计划」判不出四段是否可执行；缺旧副本路径会让重写无法对照。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：四项齐全且可交接；文中没有把计划当完成。
  失败：把旧 spec 副本路径删掉（或写成「见任务库目录」），读者必须判不完整。
  证据：quality/tests/p13-plan-review.md。

- [ ] **AC-P13-002**：独立任务已选定，或写成未决＋owner＋恢复条件；候选标准可核（1–3 个 Phase、有真实使用者证据、能新旧对比）。
  关联 FR-CODE-P13。
  判定方式：只能人读；判定时点：P13 设计件提交后。
  落点：P13/T002 与 `phases/P13-重写与端到端设计.md`。
  验证：读 `candidate-research.md`：若已选定，核三个候选标准是否逐条有证据；若未定，核未决＋owner＋恢复条件三样是否齐，并确认没有作者自选。
  环境与数据：候选调研件、真实候选任务材料（若已选）；候选未定时记 `incomplete`（未决本身是合法出口），恢复条件＝owner 出候选。
  谁判：独立读者（非写者），P13 提交后。
  承接：结论写 P13/T002 完成记录与 `quality/tests/p13-plan-review.md` 末节。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=40；resources=候选调研件、候选材料；observation=三标准是否有据、未决三样是否齐；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用真实候选材料，不新造候选任务。
  为什么不能再简：只判「写了候选」判不出标准是否可核；作者自选会把写者验写者带进端到端。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：三标准逐条有据，或未决三样齐且无自选。
  失败：把作者自己当前任务写成实验对象（写者验写者），或只写「候选待定」而无 owner 与恢复条件，读者必须判失败。
  证据：quality/tests/p13-plan-review.md。

- [ ] **AC-P13-003**：build-code 执行计划六项模板齐（命令／原失败／红绿期望／证据／执行者／时点）；任务未选时标 blocked，不写假命令。
  关联 FR-CODE-P13。
  判定方式：只能人读；判定时点：P13 设计件提交后。
  落点：P13/T003 与 `phases/P13-重写与端到端设计.md`。
  验证：读 `e2e-plan.md` 逐项核六项；未选任务时核是否标 blocked 且没有编造命令（例如假测试名）。
  环境与数据：执行计划件、候选任务（若已选）；计划件未产生时记 `incomplete`。
  谁判：独立读者（非写者），P13 提交后。
  承接：结论写 P13/T003 完成记录与 `quality/tests/p13-plan-review.md`。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=35；resources=计划件；observation=六项是否齐、未选时是否 blocked、命令是否真实；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用计划件与真实命令候选，不新造命令。
  为什么不能再简：只判「有计划」判不出六项；不核命令真假会让计划在 build-code 阶段直接失败。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：六项齐；未选任务时标 blocked 且无假命令。
  失败：未选任务却写一条不存在的测试命令（如 `npx vitest run tests/e2e/p13-e2e.test.mjs`），读者必须判失败。
  证据：quality/tests/p13-plan-review.md。

- [ ] **AC-P13-004**：盲评计划五项齐（五问原文、盲评者条件、旧/新版本、证据、时点），五问原文在正文；不要求现在盲评。
  关联 FR-CODE-P13。
  判定方式：只能人读；判定时点：P13 设计件提交后。
  落点：P13/T004 与 `phases/P13-重写与端到端设计.md`。
  验证：读 `blind-plan.md` 逐项核五项，并确认五问原文（根因／映射／反例／需求回指／被否替代）逐字在正文而不是只给编号。
  环境与数据：盲评计划件；计划件未产生时记 `incomplete`。
  谁判：独立读者（非写者），P13 提交后。
  承接：结论写 P13/T004 完成记录与 `quality/tests/p13-plan-review.md`。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=35；resources=盲评计划件；observation=五项是否齐、五问是否原文在正文；retry_cap=1；evidence_tier=人读复读。
  资源来源：复用计划件，不找盲评者、现在不盲评。
  为什么不能再简：只判「有盲评计划」判不出五问是否原文（只给编号会让盲评者去猜）；不写时点会让盲评拖到收口后。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：五项齐、五问原文在正文。
  失败：把五问写成「见 decision-log 第 4 段」只给编号，读者必须判失败。
  证据：quality/tests/p13-plan-review.md。

- [ ] **AC-P13-005**：本包写集只有设计件（`quality/evidence/p13/` 四份计划），没有 spec／phases／e2e 输出。
  关联 FR-CODE-P13。
  判定方式：机器可判；判定时点：P13 提交后。
  落点：P13/T001–T004 与 `phases/P13-重写与端到端设计.md`。
  验证：跑 `git diff --name-only <P13 起点>..HEAD`，逐行核对只落在四份设计件；再确认 `specs/delivery-quality-code-20261124/` 下没有新增或改写 `spec.md`、`phases/`，也没有 e2e 输出件。
  环境与数据：P13 提交区间、本任务材料目录；真实执行与盲评归 build-code，本轮不产生其输出。
  谁判：未参与实现的独立执行单元，P13 提交后。
  承接：结论写 P13/T001 完成记录与 `quality/tests/p13-writeset.output`。
  成本：executor=独立执行者；estimate_min=5；hard_cap_min=15；resources=git 提交区间、材料目录；observation=越界路径清单；retry_cap=1；evidence_tier=命令级。
  资源来源：复用 git 提交区间与真实目录，不新造对照。
  为什么不能再简：只判「计划件在」判不出有没有顺手写 spec（那会把 build-plan 的活提前做掉，形成第二份权威）。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
  通过：diff 只在四份设计件内，无 spec/phases/e2e 输出。
  失败：在 P13 提交里新增 `phases/P1-规则归属与入口.md` 或 `tests/e2e/p13-e2e.test.mjs`，越界检查必须红；若仍判通过，本条失败。
  证据：quality/tests/p13-writeset.output。
