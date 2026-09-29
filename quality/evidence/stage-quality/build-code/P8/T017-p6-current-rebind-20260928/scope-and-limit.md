# P8/T017 当前 P6 来源重绑：范围与限制

- 工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。
- 原目录 SHA-256 `a16fd876ad2935fd812835c56f863a4b91bd33ac4f618b3edca32d5d763a32d9`；当前目录 SHA-256 `269e8ed894b2d0d4ed7a7f55ff8cbebe69117549419118de9932b9c3c56be343`。原字节见 `catalog-before.json`。
- 实读 `phases/P6.md` SHA-256 `35b15b6739106d5f4e2ac8e2e0f69b3c1b365f81ce45bf4efcfd9471b85967c3`。其 T009 仍要求从真实 decision-log 解析 U/V/R 三节、非零 U/V 分母、零错误及 R-001..R-008 索引；目录第一例规则文字及正反观察条件仍对应此要求。P6 后段 T027 新增纯文档样例结论，不改变第一例普查规则。decision-log SHA-256 `01a9cb30dee551d30ffc929752ac137f76f14313e30de8e05837ea23ce6bbd40`，P7 SHA-256 `d8e15fd017d53ff91fcb3bd4197f424bcb0779deb156d7a7daef24de3e3bb097`，前后测试中均未变化。
- 目录 diff 恰三处：目录修订 `.11`→`.12`；第一例 `rule.revision` 与 `effect_observation.rule_revision` 从旧 P6 SHA 更新为当前 SHA。未改规则文字、case 身份、来源路径、测试身份、效果谓词或观察状态；三例仍为 `not_yet_observed`。
- 同一测试字节 SHA-256 `b6cbed445ecedb3fb10cbe88ea916abe1eb2a523ba251d6e78e752e87de8c7fd`、同一命令 `npx vitest run tests/contract/business-case-source-binding.test.mjs`：改前 exit 1，10 项中仅第一例报 `stale rule.revision`；改后 exit 0，10/10。原始输出、退出码与输入哈希见 `red/`、`green/`。
- 本记录由目录修改者编写，只说明改动范围与可核证据，不充当独立质量裁决。来源绑定通过不证明三项业务效果已观察，也不证明 P8 或整个 build-code 已完成。
