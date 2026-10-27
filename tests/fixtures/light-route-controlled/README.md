# 四级受控任务

本目录只交执行资产，当前没有运行四路、创建仓库或remote。由 verify-code 执行者与用户在场时按运行手册执行；本次只做 build-code。所有输入为 synthetic 合成文本，禁止真实用户数据、交易数据、登录态或凭据。

## 未来执行时准备独立合成环境

每路和每pair的baseline/candidate都单独准备以下环境。WH_TOOL只指可读工具代码位置，不是Git交付目标；SYNTH_ROOT由未来执行者创建的唯一空目录，不能指定N8/main/已有业务仓。VARIANT、RUN_ID、SYNTH_TASK取本次具名真实值，不复用历史task。先实读task-bootstrap参数；它将为独立repo创建同级linked worktree与任务分支，不能传真实N8的workspace-root。

以下是**尚未执行**的命令模板，先核当前授权与变量，不直接整段代跑：

```sh
WH_TOOL=/Users/Hugh/Hugh/Project/workflowhub-n8-four-level-route-20261019
# SYNTH_ROOT为本次新建空目录；VARIANT为route及baseline/candidate的唯一组合。
SYNTH_REPO="$SYNTH_ROOT/$VARIANT/repo"
LOCAL_REMOTE="$SYNTH_ROOT/$VARIANT/origin.git"
mkdir -p "$SYNTH_ROOT/$VARIANT"
git init --initial-branch=main "$SYNTH_REPO"
printf '["B","A","B"]\n' > "$SYNTH_REPO/labels.json"
cat > "$SYNTH_REPO/check.mjs" <<'CHECK'
import { readFileSync } from 'node:fs';
import { deepStrictEqual } from 'node:assert';
deepStrictEqual(JSON.parse(readFileSync('result.json', 'utf8')), ['A', 'B']);
CHECK
git -C "$SYNTH_REPO" add -- labels.json check.mjs
git -C "$SYNTH_REPO" commit -m 'test: seed synthetic label input and oracle'
git init --bare "$LOCAL_REMOTE"
git -C "$SYNTH_REPO" remote add origin "$LOCAL_REMOTE"
git -C "$SYNTH_REPO" push -u origin main
node "$WH_TOOL/tools/cli/task-bootstrap.mjs" --project=workflowhub --task="$SYNTH_TASK" --target-repo="$SYNTH_REPO"
```

开始前读取真实root身份，bootstrap后读取返回task_path/workspace/cohort及真实Git身份：

```sh
realpath "$SYNTH_REPO"
realpath "$RETURNED_WORKSPACE"
git -C "$SYNTH_REPO" rev-parse --show-toplevel
git -C "$RETURNED_WORKSPACE" rev-parse --path-format=absolute --git-common-dir
git -C "$RETURNED_WORKSPACE" branch --show-current
git -C "$RETURNED_WORKSPACE" remote get-url --all origin
```

预检逐一比较真实target/workspace realpath、common-dir、branch所属仓库/映射、remote URL及canonical source。与N8或业务main任一共用、alias无法消歧、未知或无法证明owned范围均STOP；不能靠不同task名、变量名、目录前缀或分支名证明隔离。受保护身份及逐route静态负控模板见runbook；模板未执行，每次须重新读取。独立repo的main本身合法，但不能共用N8的common-dir或远端；本地file URL/path别名用realpath，https/ssh统一到同一主机owner/repo比较，未知重定向不猜独立。

## 代表性任务、同范围配对与范围

tasks数组四个goal仅演示路线，不是可归因的同范围组。真正paired样本在tasks.json的comparison：相同原需求、labels输入、成功oracle、环境/命令/预算及baseline/candidate来源。按真实入口风险和用户选择执行，不能为了四路样本强行选small；不合法的pair记incomplete/inconclusive。check.mjs是实现结果的独立oracle，先缺result.json为目标RED；不为绿改check。planning只产生方向与八字段卡，不运行实现oracle、不产spec/Phase/代码，后继写PRD未授权不启动。

本地bare只证明local_git的fetch/push/merge行为，不能声称真PR通过。真PR必须有已获授权的专用可弃远端与目标身份；缺条件记PR incomplete/unavailable，保本地Git子面，不能stub冒闭环。本次没有创建远端或使用凭据。

## 清理

记录本次实际创建路径、Git身份和task原件；先保测试、审查、用户选择及失败，再按原stage-close最终范围确认，只处理本次具名owned合成repo/worktree/bare及任务分支。N8/main、历史task、其他任务和原始证据保留。不得git clean、整树删除或rm -rf变量清理；未获授权记待处理owner，不报已清理。

流程及31/54逐项来源见 docs/research/n8-four-level-acceptance-runbook.md；tasks.json仅是受控输入与预期调用，不是执行记录或第二进度账本。
