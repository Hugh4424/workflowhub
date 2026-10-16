---
name: knowledge-graph
description: 阶段开工调研、模块影响定位或收口更新图时，查询现有知识图谱并回原文；无图时建代码图，文档更新先核缓存与费用；工具或图不可用时明确降级。
---

# Knowledge Graph

图动作与来源、费用、版本和冲突处置归本方法；caller保留本阶段需求、质量裁决、授权和正式事实。输入是当前项目/worktree、阶段职责、精确涉及路径、真实问题和本次授权；更新另需旧/新内容版本、抽取prompt文件、mode及成本许可。输出是带原文来源的少数结论，或代码图/文档图分别真实的更新、无变化、未更新、歧义、无匹配、unavailable事实。

## 入口：定位与选择动作

1. 在调用者给出的项目中取realpath作为`root`，图只在该worktree的`graphify-out/`。Git项目先读branch/HEAD与实际worktree，不向main或仓库外共享可变图写入；非Git项目使用显式root。新worktree继承已提交图与语义缓存；原worktree本机解释器/路径sidecar不可直接复用执行。
2. 检查`graphify`命令与顶级`graphify --help`，从实际安装解析能`import graphify`的Python解释器。只读可解析图的nodes与links/edges、端点和必要元数据；可解析即消费，不加版本/HEAD相等门。版本较旧提示能力或新鲜度限制，检查本次所需函数/参数；缺所需能力仅该动作unavailable。`query --help`可能被当成查询，子命令语法从顶级help或安装源码读取。
3. 现图可读且问知识，直接走查询，不先detect/更新。现图没有且需要知识，走建图；现图坏JSON/端点异常，保错误与原件走降级，不覆盖坏图。明确请求更新或caller进入收口，走更新；不得因普通查询顺手触发付费抽取。

完成：root/当前分支/图真实状态和本次动作可定位；缺解释器或CLI如实unavailable，继续普通阅读，不自动安装、升级、注册API key、hook或driver。

## 查询：先找知识，再定向读源

将散文输出交调研子代理；主会话只收少数结论、真实`source_file`/位置、如何改变当次做法、未定/无信号和原执行ref。每阶段尝试找`specs/archive/`相关历史决定/失败，再回原文核实其适用条件；确无相关历史可写“本次无历史经验可挖”，不拿查询次数冒真实收益。指定历史正例的验收要求仍由caller保留。

先从当前真实任务职责、允许写集、实际consumer与问题选择可能的 source_file；在图内存中分别筛“当前契约/实现”和“独立历史决定/失败”两通道，不硬把archive排前，也不只凭source命中认相关。先只投影有界候选的完整id、label、source_file/source_location，逐个按职责语义选完整ID；意译词可辅助发现，不能把每词seed并集、序列前25或高连接数当相关排序。禁止打印整node/全label词汇。每批候选最多20—30项、每字段限制长度、整批最多8000字符；超限在工具内先筛再输出，并显式记真实裁剪/未覆盖。候选未排序时不得伪称top relevant。

入口已核验的realpath root赋给进程变量`KG_ROOT`，图路径固定为`"$KG_ROOT/graphify-out/graph.json"`，切cwd不重算。正常路径仍先 query、god-nodes 发现，再选择相关完整ID explain；以下命令必须由执行者用subprocess capture或现宿主有界采集器执行，**不能将无限stdout直接打印**。query预算不是字符硬上限；对返回体只消费最多8000字符并显式记录实际长度/截断，god JSON在工具内投影最多10个id/label/source/degree、最多4000字符，保真实exit/stderr。不能把工具截断当完整阅读或用截取序列冒相关性。

```bash
: "${KG_ROOT:?set KG_ROOT to the caller-verified realpath root}"
graphify query '职责相关且来自有界候选的真实问题词' --graph "$KG_ROOT/graphify-out/graph.json" --budget 1500
graphify god-nodes --graph "$KG_ROOT/graphify-out/graph.json" --top 10 --json
graphify explain '已按职责语义选定的完整节点ID' --graph "$KG_ROOT/graphify-out/graph.json"
```

query仅作发现；god-nodes保规定调用，但通用测试/import枢纽不自动重要，无新命题就不拓展。explain仍在工具内只输出与问题相关的节点/关系字段，整批最多8000字符；需要协作链才用path，路径端点也用已消歧完整ID。精确source/consumer筛后的跨社区关系最多20—30条，投影两端完整id/label、relation、confidence、origin source_file/source_location，再按命题独立性与职责选择；共享端点标签不等于独立知识。筛选规则和实际计数可读，不复制全图或全部候选。无新信号及时转原文，不为凑20条扩读。surprises不作入口，questions/gods按需有界取值，不整份读sidecar。

按实际问题选后续命令，不把不适用命令都硬跑：

```bash
graphify affected '真实路径或符号' --graph "$KG_ROOT/graphify-out/graph.json" --depth 2
graphify path '已消歧的完整起点ID' '已消歧的完整终点ID' --graph "$KG_ROOT/graphify-out/graph.json"
```

`path`只用于实际模块协作/依赖链问题。保真实exit/stdout/stderr：0只说明命令有结果；3按返回候选消歧后再查，不称工具失败；4明确无匹配，转原文检索，不编边。其它失败按降级处理，不把异常称无匹配。不存在目标或命令不适用写具体原因。

结论只引用`source_file`对应的真实文件；**绝不把节点id当文件路径**。label可能是意译，不当逐字引用；每条对方案有影响的结论都读origin上下文。关系来源是关系来自的文档，可以不同于端点定义文件；先读关系origin，再按需读端点来源。外部import和ArgumentParser这类source-less stub可合法存在，沿import/annotation的引用出处解释，不伪造本库定义。`Community N`是占位，不能作模块语义导航；JSON data/schema覆盖不得推定，问契约/governance直接读原文件。repo ignore与dot-directory能力分开核实，不能声称所有隐藏目录不受支持。

遇到当前图已有质量报告时消费原件限制。已知误边、关系方向/强度未定、source位置漂移或缓存不可复现时，保真实未定，回origin核命题；缓存有同条不等于原文支持，raw ID/label未见也不等于知识丢失。完成：每条使用中的结论有原文支撑，明确“具体多知道什么、改变哪条建议/内容”；与原已知或无图来源等价就标重复/补强，不编新增收益。未支撑项未被当成事实。

## 建图：代码自动，文档先算再问

图确实不存在时，先取检测总量与代码/文档份数，不读整库正文到主会话。代码用本地AST，可自动执行：

```bash
graphify extract . --code-only --no-cluster
graphify cluster-only . --no-label --no-viz
```

以上命令从认证root执行。`--code-only`使extract不派文档LLM；`--no-cluster`先分离命名，所有可能社区命名的调用**强制`--no-label`**，大图不生成HTML。使用已装版本实际支持的语法；`update`不接受`--no-label`，不要向它塞无效flag，后续命名只用上面cluster-only命令。命令前检查并移除本次调用环境中意外的`GRAPHIFY_FORCE`覆盖，不能继承force跳过保护。

代码图成功也不代表文档已建。检查代码命令后的真实图、manifest和退出，不因exit0就宣布两层齐备。检测出的文档（包括历史specs）按下一节核当前prompt缓存；仅对miss且确需抽取的精确文件估本次成本，说明数量、内容规模、固定prompt/宿主输入、dispatch/批次、输出/重试区间与不确定性，再取得真实范围许可。拒绝或未答只停该付费路径，代码图与只读查询继续，文档明确未更新。不得悄悄省掉历史文档来凑便宜。

host子代理按实际prompt抽取文档；不为此配置通用API key或调用headless默认语义后端。**禁止`--mcp`**（可能隐式全量建图）、`--force`/`GRAPHIFY_FORCE`、隐式付费label、`save-result`/`reflect`记忆回写；不启watch/global/外部数据库或导出支路。JSON扩面、忽略目录扩面另取真实选择，本动作不授予。

完成：代码与文档分别给出已建/未建/部分/失败、精确来源、实际命令/退出和成本原件；未批准文档仍未建，不制造完整图。

## 更新：比较真实版本，正常局部重放

由一个知识owner串行写当前worktree。caller给候选路径的旧/新版本与授权；先消费已有质量报告，现图贡献可能比当前cache丰富时保持现图为基底，不用全cache重建覆盖。保即将修改的graph/manifest/analysis等具名文件唯一旧原件及必要hash，理由是随后会修改；不保存目录快照，不拷整棵cache，不改原历史报告。

### 候选与成本

检测只证明磁盘相对manifest的内容变化；manifest不含完整prompt/mode身份。候选应取**内容变化集合 ∪ 当前prompt/mode缓存未命中集合**，包括内容没变但prompt改了的文档。root与文件用realpath，`prompt_file`必须是`Path`。本次使用的prompt文件由实际宿主提供并先读取；缺失或不可读则该文档动作unavailable，不用空prompt替代。mode沿真实原图，不默切deep。当前安装库可用这些入口（执行前核实际签名，不以版本号设门）：

```python
from pathlib import Path
from graphify.detect import detect_incremental
from graphify.cache import check_semantic_cache, prompt_fingerprint
root = Path(project_input).resolve()
prompt_file = Path(actual_prompt_file).resolve(strict=True)
changes = detect_incremental(root, manifest_path=str(root/'graphify-out/manifest.json'),
                             kind='semantic', cache_root=root)
nodes, edges, hyperedges, misses = check_semantic_cache(
    actual_document_paths, root=root, cache_root=root,
    mode=actual_mode, prompt_file=prompt_file)
```

`actual_document_paths`来自同root完整检测的语义候选，先按路径比较结果摘要，不输出全树清单；`actual_mode`默认`None`仅在本次原namespace确为默认时使用。内容、prompt指纹、mode分别记录；legacy无指纹cache虽可被库返回，vintage仍unknown，不能静默称最新或自动付费重抽。已有同内容/同prompt/mode缓存优先免费重放；内容未变且当前缓存hit的文档不重复抽。非法/缺失缓存保原错误；不拿一个命中推全库命中。

只向用户展示当前需要新增语义工作的精确文件/份数、可复用缓存、估算口径和未知项；获批准前不dispatch。input/output/cacheRead按主/子代理与抽取调用的可得usage分列，bytes/calls/elapsed可补但不换算成真实token。历史一次性建图成本单列，不用全库通读或文件均价作收益分母/可靠上限；缺完整usage不判净消耗不劣化。

### 代码层与文档层分别执行

纯代码更新的CLI是 `graphify update . --no-cluster`，它**不更新文档**，exit1同时可能是无工作或失败。现图有未解决的重放/保存风险时，先用库在本次隔离临时输出构造候选，不能先让CLI写真实graph再比对。提取仅本次变动代码，用`extract(paths, root=root, cache_root=temporary_root)`；零symbol文件也以真实`extracted_sources`/`ast_sources`声明此次已抽来源。只对真实删除文件传`prune_sources`，不能把仍存在的changed来源放进去。

文档按批准范围让宿主子代理产出chunk：每node/edge/hyperedge保真实originating source_file；关系置信度、引用位置、实际usage和失败要可回读。同一文档分chunk时先集齐完整贡献，逐chunk保存不能替换掉其它chunk；partial/failed来源不盖完成hash。把语义node/edge明确标`_origin='semantic'`，避免`L12`位置被误认AST。

对完整且来源已核的文档chunk，现有`save_semantic_cache(..., root=root, cache_root=root, mode=actual_mode, prompt_file=prompt_file, allowed_source_files=actual_dispatched_sources)`负责缓存键；按同来源分片时复用其`merge_existing`/`partial_source_files`实际语义，先核完整覆盖与旧版本，不能混旧内容分片。缓存保存可能先于graph写入，因此缓存hit本身不证明已入图；写图拒绝后保失败和待重放，不伪造manifest成功。

已有图用正常库合并，不手改graph/manifest/cache，不靠禁用dedup强保raw ID：

```python
from graphify.build import build_merge
candidate = build_merge(complete_chunks, graph_path=root/'graphify-out/graph.json',
                        root=root, prune_sources=actually_deleted_sources or None,
                        ast_sources=actually_extracted_code_sources or None)
```

无现图的首次宿主文档流程使用库`build([ast_chunk, semantic_chunk], root=root)`，不是忽略语义dedup的手拼图。沿现图方向；不要为凑计数切directed/undirected。对raw ID缺失逐canonical和具名关系映射判断，不能凭节点数差/label不出现删或重抽。

### 写前核贡献，保存后读回

对候选逐项比较所有**未改来源**的node属性、关系（两端/relation/origin/位置及属性）和hyperedge贡献；同节点被多来源引用时也核未改关系不会被归属替换吞掉。合法删除/去重必须有实际来源与关系保全解释。发现未改贡献丢失、缓存异常全miss、候选不可复现或保存保护拒绝，停止该写入并给原因与精确影响，不force、不把全cache重建当退路。

候选通过后由正常`cluster`/`export.to_json`保存，不传force；只有`to_json`返回True且实际图读回吻合才更新analysis与manifest。社区保持`Community N`，命名走CLI时强制`--no-label`。analysis用同一候选图的communities/cohesion/god_nodes/surprising_connections/suggest_questions正常函数计算；surprises仅随工具保留，不充当查询入口。写后核端点、来源、未改贡献和原图方向，保真实警告。

manifest沿`save_manifest`更新：代码仅`kind='ast'`；文档仅把**本次图中实际持有且旧/新内容版本已证明匹配**的成功来源传`kind='semantic'`，root为同realpath。原始检测全集才可作`scan_corpus`；未完整扫描时不传局部集冒全集；partial/failed源用正常`clear_semantic`保持待抽，不给当前磁盘hash盖已完成章。保存前后文件内容有漂移则停止盖章，回原owner重核。本次只读/未更新不得写manifest。

代码图与文档图分别汇报changed/replayed/unchanged/未更新及原因、候选内容版本/prompt身份、实际图路径/hash、命令/退出/成本原件。**退出1只有在实际差异为空、输出明确无工作且没有异常/保护拒绝时才解释为无变化**；否则是失败/unknown。exit0后仍核文档实际入图及hash，不能只读“Code graph updated”。完成：每个实际写入来源的内容版本、正常缓存与图贡献可对应；未跑/失败/未批准逐项保原样，不声称全图一致。

## Git交付与冲突

图变化作为“非源码已知改动”单列精确路径与实际文件数，不计功能写集；graphify-out之外仍按功能写集核对。仓内只跟踪`graph.json`、`manifest.json`、`.graphify_analysis.json`及`cache/semantic/`所有递归真实条目；`.gitignore`本身是治理文件另列。语义缓存可能有prompt namespace多层目录，不能只用根层`*.json`漏项。AST/stat-index、chunk、解释器/root、report、HTML、memory及未知机器状态默认忽略。知识文件先按实际allowlist逐路径stage，再读回索引；不对整目录盲目git add，不因ignored就删除未知字节。

`.gitattributes`仅声明`graphify-out/graph.json merge=graphify`，不安装hook、local/global driver。真正发生冲突时，把base/current/other三方原件放本次具名临时路径；可手动运行 `graphify merge-driver BASE CURRENT OTHER` 得到**current/other两方结构并集**候选。该工具不读取base作三方语义裁定，也不保证删除语义；同ID双改时一方属性可能胜出。先用三方原文及hash逐项裁定双改、删除与旧关系回流，再按正常局部更新生成最终图；未定保冲突，不把compose成功当可靠自动合并。

manifest逐来源核已抽取内容，不能并集出虚假新hash；semantic cache只复用同内容/同prompt/mode且同字节项，键相同异字节保冲突并查源；analysis只对已核合并graph重算，不并集两份社区。每类读回后分别给closeout真实结果。清理仅本次新建、具名且确认可再生的临时物；不批清cache或ignored目录，原历史/私有/未知/未交付字节保具名例外。

## 降级与交回

缺工具、能力不支持、坏图/输出、权限/凭据失败、缓存错位或付费未批准，写明哪一动作、实际错误/退出、哪些来源未覆盖及恢复条件；停止失败写入路径，其余原文检索/阅读和安全工作继续。无图代码构建失败也可普通阅读，不借图恢复新建阶段门。query可用不等于全图新鲜、cache完整或真实知识效果通过；图不替代测试、OCR、用户决定。

交回caller：少数有源结论及对当前产出的影响；代码/文档各自实际状态；实际成本与unknown；图变化单列；未定/错误/没验及owner、所需条件；原执行ref与本次临时物清理状态。其它阶段继续按自身材料和质量合同工作。

## 方法来源与迭代

完整来源权威：[catalog条目](../catalog.yaml#skills.knowledge-graph)；正文/小卡是非权威线索，单技能副本缺catalog时向来源维护者取登记。
本方法按当前项目spec/decision的四动作、成本与来源边界包装已装graphify CLI/库，不复制其宽触发宿主安装、全量后端、记忆回写或导出支路。函数/参数以实际安装源码与顶级help窄核，失配只报该能力不可用，不自动追升级。创建或修改方法时读取项目`skills/spec-specify/SKILL.md`的「技能写作规范（WR001）」唯一规范，保步骤/条件/权限/失败强度；不复制规范，不用方法文件存在或字面测试绿冒实际消费。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。
