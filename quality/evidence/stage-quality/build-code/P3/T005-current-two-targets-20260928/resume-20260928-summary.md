# P3 当前有界收尾

只读消费现行 P3 卡；没有修改 Phase/spec/index、代码或测试，没有审查/游标/阶段事实写入。按 `test-routing-advisor` 判为 feature，实际使用 `skills/backend-testing/SKILL.md`：一个 CLI 功能域，通过真实临时 Task/Git 工作树、材料文件、CLI 子进程验证，无外部服务。

- 冻结原 status 命令 `npx vitest run tests/contract/stage-runtime-material-check.test.mjs`：隔离同 HEAD 基线真实收集四项，make-decision/build-plan 缺 spec 的两项报目标错误 `current task material missing or unreadable: spec.md`，守卫两项通过，exit 1；当前工作区同字节测试 4/4，exit 0。冻结测试 SHA-256 两侧相同 `7369285cde321c82180e9b07254e1295a3360771235d1bec11c03ae2849192d5`。
- 当前 adjunct 命令 `npx vitest run tests/contract/post-build-plan-missing-index.test.mjs`：4/4，exit 0。明确验证 execute 缺 index 的精确首行错误/无裸 ENOENT；draft 仍可补 index；合法 index/P1 越过材料预检，随后被真正的执行合同拒绝。最后一项 fixture 的 CLI exit 1 是预期后置拒绝，不是验收完成。
- 隔离首次缺 Vitest 可执行入口而 exit 127，该原件保持环境失败，不作 RED。仅给隔离进程补当前工作树 npx 沿父目录使用的现有 `.bin` PATH，再跑同一冻结命令取得上述目标 RED；锁文件字节一致，没有安装依赖。两个临时 clone 都已删除。三次有效测试均有 WebSocket 端口占用警告；目标实际收集/执行/断言和退出码完整，未以警告替代结果，也未为此扩大测试。

全部原始输出、命令/exit/hash/CWD、两侧源码与测试 SHA、前后材料及运行时身份见同目录 `resume-20260928.evidence.json`；当前两目标前后相关字节和运行时身份一致。HEAD `ef920f1fbd415fe87d50930359059b661e141acd` 是隔离基线，当前工作区身份另记，不把未提交代码冒充 HEAD。所有原件 hash 已读回核对；旧原件没有覆盖。

收尾补记：P5 材料 owner 此后一次修改并冻结 P5.md/spec.md/规则文档。本次重新只读 status 和相关 SHA，记录在原 evidence JSON 的 `after_concurrent_material_freeze` 及 `resume-20260928-after-material-freeze.raw.txt`。P3 两份受测源码、两份测试和 P3 卡仍为同字节；后来的材料/工作树身份已不同，故上述测试不能声称证明当前整卡单一不变身份。没有因无关材料变动重复 P3 测试，也没有再审。

真实 consumer：`tools/cli/stage-runtime.mjs:1486-1494` 只向 build-code/verify-code 要求完整 post 材料；`runtime/stage/stage-context.mjs:35-39,92-99` 向 post build-plan 的官方 run 提供 typed missing-material 预检。P3 与 P2 无依赖，未改基线数字；这八项不证明其它阶段完整材料、全部身份攻击或 UI/业务验收。

既有两次正式审查继续原样引用，不再派第三次：旧结果 `quality/reviews/results/build-code-simple-e0d109e4-be5d-5ad1-a137-cb7d47c5696c.json` 有五项，第二次 `...4f2643f1-2185-507d-ad19-ec19bedb433b.json` 在旧树/材料下两方均零 finding，不能迁成现版已审。

旧 finding 对照（沿 `P3/finding-dispositions-20260926.json` 原处置，不用第二次零项抹掉）：`F-43f84486636f` 为 P6 镜像 schema 两合同漂移；`F-446100afc988` 为 P2 基线守卫；`F-b06de78e4d06` 为 P5 真实来源；`F-e14a80e3213d` 为 P6 E2E required_materials 观测契约，各保持其 owner/历史 needs_human，后续由所属功能核现状；`F-ef43871ce16b` 的 P5 Markdown 转义已有历史 fixed 原件。本次只验证 P3 两目标，不对上述其它功能作新的完成裁决。

P3 status 原 G-2 缺测试问题已有同字节、有效目标 RED→GREEN；缺 index 局部修复也由当前正反路径支持。无新增修复缺口；正式阶段发布及最终验收由主会话消费当前原件，原审查事实/现版未重审限制继续如实保留。Phase 增量蓝图还含“P1库存仍RED”等旧描述，本次没有按它否定已完成的 P1 文档检查，也没有越权改规划；UI 关系保持 unknown，由对应真实消费者阶段核验。
