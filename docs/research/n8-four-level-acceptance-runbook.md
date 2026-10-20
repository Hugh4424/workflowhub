# N8 四级验收运行手册

读者：verify-code执行者、独立复核者、用户。当前交付仅build-code验收资产；未跑四路、负例/对照或G1。登记已补齐不等于首次消费已验。执行需真实会话与用户在场，不能把本JSON或测试GREEN当真实调用。

## 创建、四路执行与清理

先按fixtures README准备每路/每pair独立合成repo/worktree/remote并真实核身份，实读task-bootstrap.mjs参数与返回。禁止真实用户数据。small/normal只写make-decision阶段事实；complex按标准四stage；planning当前只写make-decision方向与八字段任务卡，不产spec/Phase、不实施，后继写PRD另按真实授权启动。四路定义目标与预期步骤见tasks.json，真实执行时重新读当前flows，不用静态表代调用。

逐路记录 cwd、执行者、runner版本、字面argv、退出码、原始输出落点、真实输入和环境；按现有run-command/public verify保存原件，refs沿execution_record/machine_report/negative_control已有类别，不增schema。每格记实际调用/未调用及理由，空跑不算跳过。保首次失败；出现失败先分诊回原owner、换上下文复验，不重跑求绿。清理沿README具名边界；本次未创建真实任务、未作清理。

## 中途负例与风险未变对照

负例用实际合成diff引入跨层/未知风险，暂停→真实影响证据→重新推荐→用户真实选择→仅补未做步骤与代码审。不得伪造用户答复。独立对照保持风险未变、small原档且无独立审。两者均未执行，owner=verify-code与用户。

## 合法跳过声明与读回

在同一decision-log/交接记录item、reason、rule_ref，独立消费者逐条读声明与facts.jsonl现有阶段行；不新增skip字段或第二进度对象。只有真实条件不触发才能合法跳过，当前未执行统一保未交付，不预填触发/合法跳过。

## 可复验执行资产

以下仅为本手册结构合同，非真实执行数据，不反写事实：

```json
{
  "executable_contract": {
    "creation": {
      "command": "node \"$WH_TOOL/tools/cli/task-bootstrap.mjs\" --project=workflowhub --task=\"$SYNTH_TASK\" --target-repo=\"$SYNTH_REPO\"",
      "cleanup": "记录独立合成owned_root与全部真实身份；保原件后按stage-closeout最终具名范围确认只清本次合成repo/worktree/bare；不删N8/main/历史任务或证据，未授权不清理。",
      "safety": "只绑定独立合成repo及其bootstrap创建的linked worktree，实际读回身份再比较；未知STOP；本次不创建、不运行四路。",
      "isolation": {
        "repository_per_route": true,
        "workspace_per_route": true,
        "branch_per_route": true,
        "remote_per_route": true,
        "protected_roots": [
          "/Users/Hugh/Hugh/Project/workflowhub-n8-four-level-route-20261019",
          "/Users/Hugh/Hugh/Project/workflowhub"
        ],
        "reject_shared_branch": true,
        "reject_shared_remote": true,
        "local_bare_only_proves": "local_git",
        "real_pr": {
          "requires_authorized_disposable_remote": true,
          "missing": "incomplete"
        },
        "protected_identities": {
          "common_dir": "/Users/Hugh/Hugh/Project/workflowhub/.git",
          "branch": "task/workflowhub/n8-four-level-route-20261019",
          "remote_url": "https://github.com/Hugh4424/workflowhub.git",
          "remote_source": "github.com/Hugh4424/workflowhub",
          "readback": "本次只读git三身份；执行时必须重新读取N8/目标repo真实身份，当前值不冒未来预检"
        },
        "identity_readback": {
          "target_realpath": "对实际SYNTH_REPO用realpath并核git顶层，不能依目录名推断",
          "workspace_realpath": "bootstrap返回workspace realpath，必须该owned_root内linked工作树且不同repo",
          "common_dir": "git rev-parse --path-format=absolute --git-common-dir后realpath，拒N8/业务main公共Git根及其别名",
          "branch": "git branch --show-current及真实common-dir组合核任务分支映射；不能仅不同branch就接受共用N8仓",
          "remote_url": "git remote get-url --all origin，缺失/多义/未知STOP；只本次专用本地bare或授权可弃真PR远端",
          "remote_source": "本地path/file URL取canonical realpath；远端URL按主机owner/repo身份统一比较https/ssh别名，无法证独立STOP",
          "compare_protected": "逐一与真实N8/main root、common-dir、分支来源映射、远端源身份比较，任一复用STOP；各route及baseline/candidate也彼此独立",
          "unknown": "STOP"
        },
        "route_identities": [
          {
            "route_id": "n8-controlled-small",
            "owned_root": "/private/tmp/n8-controlled-UNEXECUTED/small",
            "repo": "/private/tmp/n8-controlled-UNEXECUTED/small/repo",
            "workspace": "/private/tmp/n8-controlled-UNEXECUTED/small/repo-n8-controlled-small",
            "common_dir": "/private/tmp/n8-controlled-UNEXECUTED/small/repo/.git",
            "branch": "task/workflowhub/n8-controlled-small",
            "remote_url": "/private/tmp/n8-controlled-UNEXECUTED/small/origin.git",
            "remote_source": "/private/tmp/n8-controlled-UNEXECUTED/small/origin.git",
            "executed": false,
            "purpose": "静态负控模板，真实运行必须按runid及baseline/candidate分别创建并真实读回，不从此路径声称已隔离"
          },
          {
            "route_id": "n8-controlled-normal",
            "owned_root": "/private/tmp/n8-controlled-UNEXECUTED/normal",
            "repo": "/private/tmp/n8-controlled-UNEXECUTED/normal/repo",
            "workspace": "/private/tmp/n8-controlled-UNEXECUTED/normal/repo-n8-controlled-normal",
            "common_dir": "/private/tmp/n8-controlled-UNEXECUTED/normal/repo/.git",
            "branch": "task/workflowhub/n8-controlled-normal",
            "remote_url": "/private/tmp/n8-controlled-UNEXECUTED/normal/origin.git",
            "remote_source": "/private/tmp/n8-controlled-UNEXECUTED/normal/origin.git",
            "executed": false,
            "purpose": "静态负控模板，真实运行必须按runid及baseline/candidate分别创建并真实读回，不从此路径声称已隔离"
          },
          {
            "route_id": "n8-controlled-complex",
            "owned_root": "/private/tmp/n8-controlled-UNEXECUTED/complex",
            "repo": "/private/tmp/n8-controlled-UNEXECUTED/complex/repo",
            "workspace": "/private/tmp/n8-controlled-UNEXECUTED/complex/repo-n8-controlled-complex",
            "common_dir": "/private/tmp/n8-controlled-UNEXECUTED/complex/repo/.git",
            "branch": "task/workflowhub/n8-controlled-complex",
            "remote_url": "/private/tmp/n8-controlled-UNEXECUTED/complex/origin.git",
            "remote_source": "/private/tmp/n8-controlled-UNEXECUTED/complex/origin.git",
            "executed": false,
            "purpose": "静态负控模板，真实运行必须按runid及baseline/candidate分别创建并真实读回，不从此路径声称已隔离"
          },
          {
            "route_id": "n8-controlled-planning",
            "owned_root": "/private/tmp/n8-controlled-UNEXECUTED/planning",
            "repo": "/private/tmp/n8-controlled-UNEXECUTED/planning/repo",
            "workspace": "/private/tmp/n8-controlled-UNEXECUTED/planning/repo-n8-controlled-planning",
            "common_dir": "/private/tmp/n8-controlled-UNEXECUTED/planning/repo/.git",
            "branch": "task/workflowhub/n8-controlled-planning",
            "remote_url": "/private/tmp/n8-controlled-UNEXECUTED/planning/origin.git",
            "remote_source": "/private/tmp/n8-controlled-UNEXECUTED/planning/origin.git",
            "executed": false,
            "purpose": "静态负控模板，真实运行必须按runid及baseline/candidate分别创建并真实读回，不从此路径声称已隔离"
          }
        ]
      },
      "probe_commands": [
        "git -C \"$SYNTH_REPO\" rev-parse --show-toplevel",
        "git -C \"$RETURNED_WORKSPACE\" rev-parse --path-format=absolute --git-common-dir",
        "git -C \"$RETURNED_WORKSPACE\" branch --show-current",
        "git -C \"$RETURNED_WORKSPACE\" remote get-url --all origin"
      ]
    },
    "routes": [
      {
        "id": "n8-controlled-small",
        "steps": [
          "核small原流程及决策记录级别与路线",
          "bootstrap返回真实task_path，记录环境与runner版本",
          "按expected_calls逐步真实调用；记录读取原件字节、选择、测试和审查",
          "逐项比预期/实际调用，保失败与合法跳过，最后独立复核"
        ]
      },
      {
        "id": "n8-controlled-normal",
        "steps": [
          "核normal原流程及决策记录级别与路线",
          "bootstrap返回真实task_path，记录环境与runner版本",
          "按expected_calls逐步真实调用；记录读取原件字节、选择、测试和审查",
          "逐项比预期/实际调用，保失败与合法跳过，最后独立复核"
        ]
      },
      {
        "id": "n8-controlled-complex",
        "steps": [
          "核complex原流程及决策记录级别与路线",
          "bootstrap返回真实task_path，记录环境与runner版本",
          "按expected_calls逐步真实调用；记录读取原件字节、选择、测试和审查",
          "逐项比预期/实际调用，保失败与合法跳过，最后独立复核"
        ]
      },
      {
        "id": "n8-controlled-planning",
        "steps": [
          "核planning原流程及决策记录级别与路线",
          "bootstrap返回真实task_path，记录环境与runner版本",
          "按expected_calls逐步真实调用；记录读取原件字节、选择、测试和审查",
          "逐项比预期/实际调用，保失败与合法跳过，最后独立复核"
        ]
      }
    ],
    "negative_control": {
      "trigger": "small真实实施中受控增加跨层/未知架构风险",
      "evidence": "保真实diff与影响原ref，不能预写发生",
      "recommendation": "暂停相关路径按新事实重新推荐",
      "user_choice": "展示给用户，保真实答复/未答；代理不得替选",
      "preserve_completed": "保已完成研究、材料、代码原件",
      "fill_missing_only": "只补新路线未做步骤/适用审查，已写代码补一次代码审，不重做调研"
    },
    "unchanged_risk_control": {
      "level": "small",
      "independent_review": false,
      "evidence": "另跑风险未变合成对照，保影响比对/决策记录，保持small且无独立审，不凭规模加审"
    },
    "skip_declaration": {
      "fields": [
        "item",
        "reason",
        "rule_ref"
      ],
      "readback": [
        "declaration",
        "facts.jsonl"
      ],
      "new_machine_fields": false
    },
    "cost": {
      "metrics": [
        "stage_count",
        "step_count",
        "required_bytes",
        "human_confirmations"
      ],
      "n1_source": "N1完整实现 tools/cli/measure-main-agent-cost.mjs 与 skills/stage-reflection/SKILL.md#方法；成本原件必须是本次同范围四级完整窗口，历史N1完成不代本次数据。",
      "window": {
        "start_command": "先保存真实task-start用户事件原ref，不在阶段开始额外record。整个task首次实际stage末命令附--start-ref；后续已有ledger不再传start-ref，按tasks每route stage_windows逐stage执行。",
        "end_command": "每个实际stage末 node \"$WH_TOOL/tools/cli/measure-main-agent-cost.mjs\" --project=workflowhub --task=\"$SYNTH_TASK\" --stage=<该实际stage> --record；仅task首笔额外附真实start-ref；读main-agent-cost.md全部真实行与from/until，跨stage续上一账行until，全部尝试/失败/重做多行保留。",
        "scope": "同范围paired需求/输入/环境/命令/预算，完整task所有stage连续窗口及全部开销；四指标另列，planning全交付与实现不可比，common segment仅局部不签完整G1。",
        "complete_required": true
      },
      "original_ref_rule": "每个指标须引用真实命令、整数exit及原始输出和from/until原件；原始tokens/cacheRead/调用按来源原单位，不换算字节为token；缺源/窗口不完整记unknown/incomplete，噪声不可估记inconclusive，不填0、不静态估算、不以四路真跑替代G1。"
    },
    "external_denominators": {
      "shared_skills": 31,
      "adoptions": 54,
      "derived_only": 42
    }
  }
}
```

## G1 对照与完整 N1 窗口

四指标分别是阶段数、步骤数、必读字节、人工确认次数。来源为完整N1同范围观测，不能拿本次fixture GREEN、N7历史pair或四路真跑单独替代。每个任务cost_observation仅给采集入口，不含测量值；开始事件、主/子会话归属、from/until、全部尝试、error/work、噪声及来源缺报须当场读原件。未取得完整窗口时G1= incomplete，owner=verify-code执行者与N1成本维护者；本次不采样、不运行留账或成本对照。实际stage收口成本由主会话按stage-reflection在整个stage末唯一触发，不每Phase重复。

## 外部清单口径

31设计集合取父PRD:95–97；54取同文件“54条采用的具体方案与生效判据”逐行原键，不取外置68行历史adoption-table。约42仅推导值，不是新分母；answer-as-page是N6新增复用consumer，不能用它替换31/54原键或另增第55项。mini-task设计项只保历史原键，由P4已交evaluateEntryRoute承接，不能恢复旧技能目录。

以下两表是本次执行资产内的来源/consumer/首验映射，不是第二进度账本。状态“未交付”只指N8真实四级消费未运行，不声称来源owner未实施。真实执行时逐行按触发、合法跳过、未交付取其一并给原件；条件未实际观察不能标合法跳过，不能用54条数代逐项覆盖。各owner原首次验收沿具名来源读取，缺原件标unknown，不由P7末验代签；允许延迟仅是当前未触发的真实条件，具名下一consumer为verify-code/用户，触发时取本行原方法及独立oracle。N7登记已补齐，只解登记阻塞；catalog/reuse/notice及150真实原件不证明首次实际消费，历史reflect/AC013 incomplete与provider coverage undetermined保留。pstack Git commit和许可链unknown保原样。

## 31 共用技能

| key | 来源 | consumer与首次验收 | 状态 | 登记与首消费原ref |
| --- | --- | --- | --- | --- |
| mini-task | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→workflows/make-decision/scripts/entry-evaluation.mjs#evaluateEntryRoute（P4承接原mini-task，不恢复旧路线）；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| talk-with-zhipeng | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/talk-with-zhipeng/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| decision-log | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/decision-log/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| deep-research | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/deep-research/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| anysearch | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/anysearch/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| grill-with-docs | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/grill-with-docs/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| spec-clarify | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/spec-clarify/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| spec-specify | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/spec-specify/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| spec-prd | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/spec-prd/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| spec-analyze | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/spec-analyze/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| testing-system-blueprint | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/testing-system-blueprint/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| test-routing-advisor | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/test-routing-advisor/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| backend-testing | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/backend-testing/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| frontend-testing | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/frontend-testing/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| fullstack-slice-testing | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/fullstack-slice-testing/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| isolated-browser-qa | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/isolated-browser-qa/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| ui-project-init | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/ui-project-init/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| design-source-readiness | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/design-source-readiness/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| frontend-prototype-render | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/frontend-prototype-render/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| frontend-component-quality | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/frontend-component-quality/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| wh-review | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/wh-review/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| intake-decision-review | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/intake-decision-review/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| plan-ceo-review | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/plan-ceo-review/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| review | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/review/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| simplicity-guard | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/simplicity-guard/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| plan-design-review | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/plan-design-review/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| architect-code-review | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/architect-code-review/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| diagnosing-bugs | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/diagnosing-bugs/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| stage-reflection | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/stage-reflection/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| stage-handoff | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/stage-handoff/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |
| resolving-merge-conflicts | specs/archive/skills-framework-redesign-20261014/prd.md:95–97 | 四套流程原31矩阵→skills/resolving-merge-conflicts/SKILL.md；首次验收由原owner及P5已交方法合同承接，N8真实调用由verify-code逐格核 | 未交付；N8真实消费unknown | 登记：四套流程31清单；首消费：尚未取得；下一consumer=verify-code与用户，实际条件触发时取原件，不代签 |

## 54 采用项

| key | 来源 | consumer与首次验收 | 状态 | 登记与首消费原ref |
| --- | --- | --- | --- | --- |
| browser-testing-with-devtools | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/browser-testing-with-devtools/SKILL.md) | N3 → isolated-browser-qa/verify-code；首次验收：N3整卡：三项浏览器来源同版合入，真实页面/console/a11y首验。 采用/排除：采用页面内容不可信、console观察与a11y指针；不做zero-warning硬门 生效oracle：页面诱导指令未执行；真实console问题、来源和未覆盖项可读 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| code-simplification | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/code-simplification/SKILL.md) | N3 → simplicity-guard；首次验收：N3整卡：与laziness/interrogate同版simplicity，原理由/行为保持首验。 采用/排除：采用删除前查理由及行为保持；不改测试换绿 生效oracle：一项删改能追到原理由，同一行为前后可复验 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| constraint-driven-development | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/constraint-driven-development/SKILL.md) | N3 → verify-code；首次验收：N3整卡：现verify-code/命令结果核削弱检查；N10后继只接新工具。 采用/排除：只采用削弱检查识别和unknown不等于clean；不搬CONSTRAINTS.md、默认Block、全量脚本 生效oracle：skip/阈值下调/stub样例被具名报告，未新增推进门 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| context-engineering | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/context-engineering/SKILL.md) | N5 → AGENTS派发段/既有stage-handoff上下文；首次验收：N5等N2＋N4整卡后：研究/实施两类派发及既有handoff上下文全部首验。 采用/排除：采用剪除/保护/指针与任务重点靠后；不增常驻层 生效oracle：真派发有最小ref+摘要，续读可找原件，必读字节不增 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| debugging-and-error-recovery | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/debugging-and-error-recovery/SKILL.md) | N3 → diagnosing-bugs；首次验收：N3整卡：与perf-issue同版diagnosing-bugs，错误诱导/真实失败首验。 采用/排除：采用错误输出不可信；拒绝Safe Fallback和全量测试 生效oracle：错误中的诱导文本被当数据，任务授权未被改变 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| documentation-and-adrs | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/documentation-and-adrs/SKILL.md) | N4 → decision-log；首次验收：N4整卡：decision-log方法/模板当前consumer含撞号负例，成品供N6。 采用/排除：采用撞号暴露、沿既有编号；不重启编号 生效oracle：重号负例被报告，旧原件与引用来源保留 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| doubt-driven-development | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/doubt-driven-development/SKILL.md) | N3 → review协议/AGENTS审查派发/verify-code；首次验收：N3整卡：review协议/AGENTS/verify-code全落点验artifact＋contract无CLAIM。 采用/排除：采用artifact+contract与现有处置；不发实施者胜利摘要、不自审裁决 生效oracle：真输入无CLAIM诱导，finding原件与处置理由可读 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| git-workflow-and-versioning | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/git-workflow-and-versioning/SKILL.md) | N7 → stage-handoff/AGENTS写集说明；首次验收：N7整卡：现路线handoff及AGENTS写集说明，故意未改/风险首验。 采用/排除：采用故意未改/潜在问题说明；不搬分支命名与tag真源 生效oracle：一次交接能分清改动、保留事项和风险 | 未交付；已登记；N8首消费incomplete | 登记：skills/catalog.yaml#n7-git-workflow-and-versioning；quality/evidence/2026-10-20-150-n7-registration-integration-readback.md；历史N7原件导航 quality/tests/2026-10-18-038-p1-independent-method-readback.md；quality/tests/2026-10-18-077-p3-independent-consumer-readback.md（相对n7-route-delivery-closeout-experience-20261018任务库；此处不签其结论）；首消费：incomplete，N8尚未执行；下一consumer=verify-code与用户 |
| idea-refine | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/idea-refine/SKILL.md) | N6 → talk-with-zhipeng；首次验收：N6等N3＋N4整卡后：完整模块调研/发散/收敛旅程验talk七透镜，不凑方案数。 采用/排除：七类透镜按问题选；拒绝固定5–8方案和新ideas目录 生效oracle：真模块有不同方案取舍或不扩散理由，未凑数 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| incremental-implementation | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/incremental-implementation/SKILL.md) | N4 → spec-plan/Phase模板；首次验收：N4整卡：现spec-plan/Phase独立增量、范围外记录及保10红首验。 采用/排除：增量可运行、范围外只记录；“全绿”改受影响既有绿合同保持 生效oracle：增量可独立复验；10红照实保留，未扩修复范围 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| interview-me | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/interview-me/SKILL.md) | N6 → grill-with-docs；首次验收：N6等N3＋N4整卡后：完整grill旅程验模糊答复分类、真实选择与地板规则。 采用/排除：采用理解自检/模糊答复分类/地板规则；预测3问仅示例，不作退出门 生效oracle：模糊yes保具体未决，真实用户答复才关闭选择 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| observability-and-instrumentation | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/observability-and-instrumentation/SKILL.md) | N1 → 成本读回；首次验收：N1整卡：显式原始样本的信号映射/第二样本/坏字段首验。 采用/排除：问题→信号和遥测自验；不固定2–4问题 生效oracle：每指标对应消费问题，缺字段报unavailable非0 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| performance-optimization | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/performance-optimization/SKILL.md) | N1 → 对照方案；首次验收：N1整卡：首个同条件对照含噪声、全部尝试及撤回边界。 采用/排除：同条件/噪声/所有尝试保留；不自动回滚用户或上游改动 生效oracle：对照含波动，噪声内不称收益；只撤无其他已确认价值的本次实验并记理由 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| planning-and-task-breakdown | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/planning-and-task-breakdown/SKILL.md) | N4 → spec-plan/Phase模板；首次验收：N4整卡：现Phase以P8反例验独立consumer/oracle，不按数切卡。 采用/排除：采用独立结果/consumer/承载过量语义；不搬小时/文件数/≤3AC硬门和双计划 生效oracle：P8反例给可解释分解，没按数字机械切卡 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| security-and-hardening | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/security-and-hardening/SKILL.md) | N2 → 既有安全写/删除边界；首次验收：N2整卡：全部受影响现有安全入口，合法/越界/根目录/属主首验。 采用/排除：根允许范围、子层、属主证据及值的作者来源；不搬token/rate限额/新release门 生效oracle：越界/根目录/属主不符破坏动作不发生，合法路径可用 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| shipping-and-launch | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/shipping-and-launch/SKILL.md) | N4 → Phase回滚字段；首次验收：N4整卡：真实Phase回滚动作/路径/耗时依据或unknown首验。 采用/排除：回滚路径和耗时实测或unknown；不设外部固定上界 生效oracle：独立交付单元可找到实际回滚动作与观测依据 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| source-driven-development | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/source-driven-development/SKILL.md) | N4 → deep-research/spec-plan；首次验收：N4整卡：deep-research/spec-plan现来源链、深链/版本/推断首验。 采用/排除：来源权威、版本核对、深链、推断分离；不因缺版本扩大停机 生效oracle：核心结论可回到具名原件，未知版本未被猜值 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| spec-driven-development | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/spec-driven-development/SKILL.md) | N4 → spec模板模块划分；首次验收：N4整卡：spec模块/稳定名/无环依赖独立验，成品供N8。 采用/排除：capability可独立消费/验收、稳定名称和无环依赖；不搬多SPEC/四批准门 生效oracle：各模块有consumer/oracle，互需模块说明合并理由 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| test-driven-development | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/test-driven-development/SKILL.md) | N3 → 三个测试技能/既有Phase测试合同；首次验收：N3整卡：三个测试技能及现Phase合同，行为/替身/gate_cmd/重跑首验。 采用/排除：真实>Fake>Stub>Mock、替身理由、仓内gate_cmd来源、无新信息不重跑；无全量/比例门 生效oracle：真行为破坏会使目标测试失败，mock/重跑有理由 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| using-agent-skills | [addyosmani/agent-skills 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/addy-agent-skills/skills/using-agent-skills/SKILL.md) | N2 → reuse-registry；首次验收：N2整卡：索引/路由正负prompt及三测试技能边界首验。 采用/排除：任务语义路由+正负prompt评估；相似度只诊断，不套0.75/0.50/95%或DoD门 生效oracle：三类测试技能在正/负例上可区分，模板相似不误判语义冲突 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| create-verification-skill | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/create-verification-skill/SKILL.md) | N3 → reuse-registry/isolated-browser-qa；首次验收：N3整卡：索引/QA真执行、dry-run跳过、cleanup后原件首验。 采用/排除：真执行、cleanup后原件、dry-run核实际跳过；不搬宿主目录/新Doctor体系 生效oracle：一次执行可读，cleanup后证据仍在原命名位置 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| maintain-verification-skill | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/maintain-verification-skill/SKILL.md) | N3 → isolated-browser-qa/既有索引维护；首次验收：N3整卡：QA/索引维护验健康≠可用、重置/cleanup/漂移分诊。 采用/排除：健康≠可用、受控重置、doc drift与product regression分诊；不加periodic pass 生效oracle：进程健康但页面卡死被识别，产品坏没用改文档抹平 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| interrogate | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/interrogate/SKILL.md) | N3 → review协议/decision-log/simplicity-guard；首次验收：N3整卡：协议/既有decision-log/simplicity全部落点首验，N4后继保全。 采用/排除：同根因多源数、假阳性理由、幂等/并发/简化问句；不搬≤5行动/模型表/verdict/reconciliation 生效oracle：单源有效发现不丢；不凭路数升严重度；拒绝理由有证据 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| no-comments | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/no-comments/SKILL.md) | N7 → stage-reflection；首次验收：N7整卡：现收口核规则→consumer→可删文，未承接含义保留。 采用/排除：机制真承接后才删对应散文；拒绝拿不准就删或借此新建检查器 生效oracle：原规则→consumer→删除段可对账，未覆盖含义保留 | 未交付；已登记；N8首消费incomplete | 登记：skills/catalog.yaml#n7-no-comments；quality/evidence/2026-10-20-150-n7-registration-integration-readback.md；历史N7原件导航 quality/tests/2026-10-18-038-p1-independent-method-readback.md；quality/tests/2026-10-18-077-p3-independent-consumer-readback.md（相对n7-route-delivery-closeout-experience-20261018任务库；此处不签其结论）；首消费：incomplete，N8尚未执行；下一consumer=verify-code与用户 |
| technical-writing | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/technical-writing/SKILL.md) | N4 → WR001/四类写作出口；首次验收：N4整卡：与unslop同版WR001/当前四类出口，数字/消歧/原义首验。 采用/排除：可重生成计数、语言中性消歧、修改交原owner；无20/25词门与副本 生效oracle：一项当前计数能按命令重生成，一段歧义消除但原义保持 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| unslop | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/unslop/SKILL.md) | N4 → WR001/decision-log写法；首次验收：N4整卡：WR001/现decision-log验具体事实、稳定编号及保术语。 采用/排除：空话结构自检、稳定编号；不搬英文禁词/既有术语清洗 生效oracle：泛泛段改具名事实或删除，编号不洗牌 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| setup-pstack | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/setup-pstack/SKILL.md) | N2 → catalog登记维护；首次验收：N2整卡：catalog维护真读目标，坏path/consumer/保27条首验。 采用/排除：登记前真读目标，缺失如实报；不搬全局模型文件/无条件整覆写/新停机门 生效oracle：无效path/consumer可见，27条与无关记录保留 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| poteto-help | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-help/SKILL.md) | N2 → reuse-registry；首次验收：N2整卡：索引/指针与using-agent-skills同版验目标实读与语义边界。 采用/排除：引用前实读、相近技能边界；语义信目标、登记状态信catalog，冲突交owner 生效oracle：旧指针例子显露，正文与投影不互冒权威 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| figure-it-out | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/figure-it-out/SKILL.md) | N10 → 标准流程/收口；首次验收：N10等N9/全部内容整卡后：完整检查负例、标准流程/收口全部落点验检查归属，不前供半卡。 采用/排除：检查错在其范围修、过易通过先查观察法；不绕过或加下游豁免 生效oracle：受影响负例报真问题，未碰裁定保留10红 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| ketchup | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/ketchup/SKILL.md) | N7 → handoff；首次验收：N7整卡：现handoff/业务经验验用户动作、推荐/后果与真链接。 采用/排除：用户才能做的动作、推荐/理由/不答后果/unknown/真实链接；无150词或视觉副本 生效oracle：Agent可继续做的事不甩给用户，链接目标存在 | 未交付；已登记；N8首消费incomplete | 登记：skills/catalog.yaml#n7-ketchup；quality/evidence/2026-10-20-150-n7-registration-integration-readback.md；历史N7原件导航 quality/tests/2026-10-18-038-p1-independent-method-readback.md；quality/tests/2026-10-18-077-p3-independent-consumer-readback.md（相对n7-route-delivery-closeout-experience-20261018任务库；此处不签其结论）；首消费：incomplete，N8尚未执行；下一consumer=verify-code与用户 |
| explain-the-number | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-explain-the-number/SKILL.md) | N1 → 成本报告；首次验收：N1整卡：每次成本解释附次数/波动/替代解释/瓶颈，先于收益声明。 采用/排除：样本/波动/替代解释/瓶颈；六类嫌疑作提示，不凑六项门 生效oracle：收益数字附次数、spread、具名limiter或unknown | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| test-behavior-not-implementation | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-test-behavior-not-implementation/SKILL.md) | N3 → AGENTS/三个测试技能；首次验收：N3整卡：AGENTS及三个测试技能验undefined反问/独立预期/presence。 采用/排除：undefined自问、具体输入/独立预期、absence配presence；不按词lint或全仓改测试 生效oracle：选定弱断言在真行为破坏时失败，合法缺省有理由 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| laziness-protocol | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-laziness-protocol/SKILL.md) | N3 → simplicity-guard/既有AGENTS；首次验收：N3整卡：simplicity及既有AGENTS全部首验，N5后继派发保全。 采用/排除：最小有效路径、合并到已有唯一权威；不借consolidate造第二份 生效oracle：一个需求说明为何选小方案及没有第二机制 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| build-the-lever | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-build-the-lever/SKILL.md) | N4 → build-plan/Phase模板；首次验收：N4整卡：现build-plan/Phase比独立手工oracle，worker不改契约首验。 采用/排除：手工oracle对照、worker不改自身验收契约、标签查对应产物；不冻全树 生效oracle：生成结果与独立oracle比较，worker未改判据换绿 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| attack-the-premise | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-attack-the-premise/SKILL.md) | N3 → review/repair方法；首次验收：N3整卡：现review/repair真实失败证伪前提，分类与原件保留。 采用/排除：反复同前提失败时证伪前提、消除/补偿分类；≥2只示例，不加配额/账本/换provider 生效oracle：一个反复失败案例有能推翻前提的事实而非只换补丁 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| minimize-reader-load | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-minimize-reader-load/SKILL.md) | N4 → 材料模板；首次验收：N4整卡：四类现consumer均定位来源/owner，derive替代手抄sync。 采用/排除：来源在哪/谁能改、derive替代sync；不做30秒门或自动合职责层 生效oracle：新读者能找到唯一来源/owner，未加手抄同步字段 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| make-operations-idempotent | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-make-operations-idempotent/SKILL.md) | N2 → 既有写入口设计；首次验收：N2整卡：全部受影响现写入口验重复/半途失败/内容一致。 采用/排除：重复/半途失败两问和内容一致；无adopt/recovery/rebind/PID替换 生效oracle：重复调用不重复记同事实，失败不伪成功 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| type-system-discipline | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-type-system-discipline/SKILL.md) | N2 → 现有schema/检查；首次验收：N2整卡：现schema/检查验非法/合法组合，无consumer不加类型层。 采用/排除：非法组合和不同语义值区分；不为.mjs引TS/无consumer类型层 生效oracle：真实consumer拒非法组合，合法组合保持 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| boundary-discipline | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-boundary-discipline/SKILL.md) | N2 → interface职责/AGENTS；首次验收：N2整卡：现interface/AGENTS/CLAUDE全落点验边界/纯函数/公共表示。 采用/排除：输入是否过边界、能否纯函数；保文件系统/Git保护；不照抄Trust-the-types/外仓清单 生效oracle：新校验有真实边界，公共面不泄内部表示 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| experience-first | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/principle-experience-first/SKILL.md) | N2 → consumer登记；首次验收：N2整卡：现consumer登记验维护者/调用者具体使用动作。 采用/排除：维护者/调用者也是用户；不要求每事先原型 生效oracle：新能力能点名实际使用动作，无consumer不实施 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| blast-radius | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/blast-radius/SKILL.md) | N3 → review/verify-code；首次验收：N3整卡：现三维审查/verify核证据强弱/不可见耦合/unproven。 采用/排除：证据强弱、不可见耦合与一个安全事实；不增必填evidence_level/评分门 生效oracle：缺运行证据的主张标unproven，grep命中不冒验收 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| reflect | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/reflect/SKILL.md) | N7 → stage-reflection；首次验收：N7整卡：现每stage收口/经验验自动发起、结构优先、批准/落账分工。 采用/排除：结构优先、需批准/可落账分开、经验接受判据；无纯人触发/固定四路/逐行批准 生效oracle：自动收口留经验或具名无发现，已授权落账不反复问 | 未交付；已登记；N8首消费incomplete | 登记：skills/catalog.yaml#n7-reflect；quality/evidence/2026-10-20-150-n7-registration-integration-readback.md；历史N7原件导航 quality/tests/2026-10-18-038-p1-independent-method-readback.md；quality/tests/2026-10-18-059-p2-independent-complete-readback.json（相对n7-route-delivery-closeout-experience-20261018任务库；此处不签其结论）；首消费：incomplete，N8尚未执行；下一consumer=verify-code与用户 |
| recall | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/recall/SKILL.md) | N7 → stage-reflection；首次验收：N7整卡：现收口/经验格式/后继真读取全验，无可用项给理由。 采用/排除：默认读相关经验与人读状态；不新增机器reader/强制标签/状态对象 生效oracle：后继相关任务能指到消费项，无可用项有理由 | 未交付；已登记；N8首消费incomplete | 登记：skills/catalog.yaml#n7-recall；quality/evidence/2026-10-20-150-n7-registration-integration-readback.md；历史N7原件导航 quality/tests/2026-10-18-038-p1-independent-method-readback.md；quality/tests/2026-10-18-059-p2-independent-complete-readback.json（相对n7-route-delivery-closeout-experience-20261018任务库；此处不签其结论）；首消费：incomplete，N8尚未执行；下一consumer=verify-code与用户 |
| architect | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/architect/SKILL.md) | N3 → verify-code/review；首次验收：N3整卡：现架构/终末review以红旗、代码和有意义备选首验。 采用/排除：8类红旗作观察、有意义备选对比；不增审查轮次/自动门/默认实施 生效oracle：有具体代码证据和取舍；不因temporal decomposition标签推翻阶段骨架 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| arena | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/arena/SKILL.md) | N3 → wh-review协议；首次验收：N3整卡：现协议/受控对照验隔离、匿名同尺、分歧依据，不等N11首验。 采用/排除：rubric隔离、匿名同尺、分歧查依据；3–6非配额，不加评分账本/cross-judge/无限重跑 生效oracle：候选不见rubric，judge同尺，分歧具体可读 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| why | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/why/SKILL.md) | N4 → decision-log/spec-analyze/verify-code；首次验收：N4整卡：decision-log/spec-analyze/既有verify全落点验来源分类。 采用/排除：可得来源分类、空/跳过说明、Preserve/Change/Avoid/Risk；无固定7调查者或readonly:false 生效oracle：回执区分读到/空/不可得/未读，历史理由只作背景 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| multi-phase-plan.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md) | N4 → spec-plan现校验调用；首次验收：N4整卡：现spec-plan收口消费既有无状态校验/缺验收负例，N10后继总接。 采用/排除：无状态校验接作者收口；不搬<10行/1–2文件门、十泳道、review gate或证据抄计划 生效oracle：缺验收例由现reports报出，退出语义不变，开头可读结果/依赖 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| orchestrate.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/orchestrate.md) | N5 → AGENTS/实际派发方法；首次验收：N5等N2＋N4整卡后：与context同版，真brief/依赖中继/缺回传/原会话修复首验。 采用/排除：适量brief、依赖内容中继、真事实进展；TIMEBOX仅回报提示，修复回原会话 生效oracle：真子任务能凭brief执行，缺关键输入报清；不计时停审、不搬store/tick/默认新spawn | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| refactoring.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/refactoring.md) | N4 → spec-plan测试设计；首次验收：N4整卡：真实结构移动Phase先保行为，lint/typecheck不冒pin。 采用/排除：结构移动前钉行为，lint/typecheck不替代；无主观reader-load自动revert门 生效oracle：同一行为前后判定器可跑，保护断言未放松 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| perf-issue.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/perf-issue.md) | N3 → diagnosing-bugs性能段；首次验收：N3整卡：同版diagnosing-bugs性能分支验便宜方案与实测瓶颈。 采用/排除：先不做/少做/晚做/复用/便宜做；无trace/control-skill硬依赖 生效oracle：建议说明便宜选项为何不适用并有实测瓶颈 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| hillclimb.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/hillclimb.md) | N4 → 既有Phase效果合同/受控正反负载；首次验收：N4整卡：现Phase/受控正反负载验区分度、error/work、重复噪声/停止；N11后继用成品。 采用/排除：oracle先分好坏、error/work count、重复观测；无50%/10轮/固定次数下限/loop账本 生效oracle：正反负载可区分，样本/停止依据看噪声，证据不足inconclusive | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| prototype.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/prototype.md) | N6 → make-decision方法/既有AGENTS；首次验收：N6等N3＋N4整卡后：现make-decision/AGENTS技术分歧草图取事实，不替产品偏好答。 采用/排除：可观察技术分歧用一次性草图，无分歧不造；不代选产品偏好或新autonomy grant 生效oracle：草图给事实/反例，产品选择仍有真实答复 | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| eval.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/eval.md) | N4 → 既有Phase评测合同/受控匿名同尺正反负载；首次验收：N4整卡：现Phase合同/受控匿名同尺正反负载首验；N11才做自己的ModelTest适配/总对照。 采用/排除：匿名同尺、rubric隔离、独立judge、真实行动；无常驻eval技能或宿主会话扫描 生效oracle：输入预算可比、judge不见模型名，运行证据与结论对应；缺轨迹标unproven | 未交付；N8实际消费unknown | 登记：原owner目录/notice沿specs/archive/skills-framework-redesign-20261014/prd.md#migration逐项回源；首消费：unknown，N8尚未执行；下一consumer=verify-code实际条件触发时读取原owner首验原件 |
| opening-a-pr.md | [backnotprop/pstack 原文](/Users/Hugh/Downloads/workflowhub-skills-framework-references-20261014/sources/pstack/skills/poteto-mode/playbooks/opening-a-pr.md) | N7 → 交付说明；首次验收：N7整卡：现路线交付/PR说明验范围、故意不改/已知红代价，不触发Git。 采用/排除：Scope含故意不做，Blast Radius含已知红代价；不搬强制ready PR/新提交格式 生效oracle：实际范围、残留影响、验证可读，10红不被藏掉 | 未交付；已登记；N8首消费incomplete | 登记：skills/catalog.yaml#n7-opening-a-pr；quality/evidence/2026-10-20-150-n7-registration-integration-readback.md；历史N7原件导航 quality/evidence/2026-10-18-050-p4-independent-first-consumer.json；quality/evidence/2026-10-18-055-p4-compression-consumer.json（相对n7-route-delivery-closeout-experience-20261018任务库；此处不签其结论）；首消费：incomplete，N8尚未执行；下一consumer=verify-code与用户 |

## N7 登记依赖原件与残留边界

当前登记子面证据：N8任务库 quality/evidence/2026-10-20-150-n7-registration-integration-readback.md，精确source13f05f3a→d3666828；N7修复任务库 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-registration-repair-20261020/quality/evidence/2026-10-20-013-registration-delivery-readback.md。六项在skills/catalog.yaml n7-* absorbed、skills/reuse-registry.md与THIRD_PARTY_NOTICES.md可读。只有此登记实物缺口可证补齐，历史reflect/AC013 incomplete、外部coverage undetermined与许可/commit未知不被登记覆盖。若未来目标缺登记原件则等待N7 owner；若已登记仍缺本次首次调用原件则unknown/incomplete，不自动pass。AC-ACC-6最终判定依完整原条件，由verify-code独立核，本次不进入该阶段。

## 审查修复：独立 Git 环境与同范围配对

原README/runbook绑定N8工作树的命令已撤，独立task名不足以隔离Git。未来执行前先按README的 `git init`、`git init --bare` 建独立SYNTH_REPO及本地remote；用 `git rev-parse` 和 `git remote get-url --all origin` 读回真实身份，任一与保护N8/main的root、common-dir、分支来源映射、remote源身份相同或未知即STOP。静态route_identities未执行，不代真实读回；每pair baseline/candidate也分别隔离，拒用N8 clone/shared git common-dir。bare只证local_git，真PR需已获授权专用可弃远端，缺少即incomplete，不用stub填绿。清理仅具名合成owned路径，保证据，最终范围确认仍按原方法。

原四tasks保代表性路由演示用途，不能据它们不同goal计算减负。真正同范围样本在tasks.json comparison：共同labels去重/排序需求、固定输入内容、同实现oracle、固定环境/命令/预算与每路baseline/candidate源ref逐值绑定。源版本baseline是真实可读91ac8787对象，candidate为当前具名原流程；执行时需再核来源与宿主条件，不能把源ref存在当可比已成立。

planning只产同需求方向/八字段卡，与result.json实现结果不等价。common_segment仅比较同需求方向澄清→范围真实确认的共同语义，明确排除部分仍列全程成本，不充完整G1或AC-ACC-3。三实现路线如能合法适用才比较同一result.json成功oracle，入口/风险不允许就保pair incomplete/inconclusive，不能虚造用户选择或绕风险。完整四级收益不足仍inconclusive，不能把方向局部改善外推为完整交付收益。

run_bindings只定义未来真实身份、事件与窗口原件怎么绑定；目前没有任何测量值、真实选择或实际Git/PR结果。本次仅268批准的资产修复，未建repo/remote，未运行任何case。

## 审查修复：全阶段 N1 账本与完整分账

原complex只具名make-decision的成本命令已修：tasks各route stage_windows与expected_calls.stages同序，complex逐项make-decision/build-plan/build-code/verify-code，planning仍仅make-decision。描述窗口不是已经执行的四行；真实重做/续测允许多行，全部尝试/失败/取消/error/work/共享宿主注入/子会话原单位与开销都保留，不去重丢成本。

真实工具measure-main-agent-cost.mjs:527–570读取整个task账本最后行，不按stage过滤。只有task首笔在实际阶段结束record时附真实task-start的start-ref；后续任何stage均继承上一行until为from、不得重传start-ref或显式from/until以reset。原start_command键保为采集规则，不意味着每stage开头追加一次record。每个stage_windows.record_command按实际stage标签，是否首笔由真实ledger决定，不能从数组位置猜；起点未唯一匹配则fail-closed，缺源/边界如实留缺。

完整对照需每笔原账行from/until及回执/输出绑定pair/cohort/task/session，检查非重叠、完整来源和全部成本，不预填数值或假造事件。共同方向段即使局部可比，也不能遮掉实现/测试/审查/交付成本或签完整G1。此次仅271允许的资产修复，不执行任何record，不声称真实窗口已齐。
