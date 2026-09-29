# P5/T007 来源复核停点

- 当前真实目标 RED：`npx vitest run runtime/stage/stage-end-report.test.mjs -t '负控：首项|负控：多条|当前生产者单条'`，exit 1，4 failed、56 skipped。原始输出 `red.txt`；未运行全量测试。
- 本轮仅在 `stage-end-report.test.mjs` 添加 3 个错误来源负控与 1 个单条判决披露正控。`stage-end-report.mjs` 仍是本轮之前的字节。旧冻结断言仍在，未改写。
- `before-stage-end-report.mjs` SHA-256：`22b27300760d45866ddaec58a38d50650a1b25a2efaa08efa7007eca0ba741c4`。
- `before-stage-end-report.test.mjs` SHA-256：`3704bce0fb79511deb3a9e86d87eab06941a84a93639b3983cb1f3a62557bd`。
- `red-stage-end-report.test.mjs` SHA-256：`7bef8492d35cf43cd704b982f9c9a94d786da72ad6c2ef3cef425c73e323fb3b`。
- `red.txt` SHA-256：`f20e834e62cf310c0f157224cad4b37083ef8994c45eeacef77f86d3bd67a590`。
- 旧冻结测试要具体原件路径，但现有输入无同主题、同判决、ref/hash 的可核绑定；安全修复与该断言冲突。见 `material-clarify-proposal.md`。等 build-plan owner 修订和独立审查，不在本轮自改材料或生产代码。
