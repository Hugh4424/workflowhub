# C05样本A：有稿模拟记录与工作台

A保留本轮已有React作者源码，仅用于保真转换；app/main.tsx管理hash导航，components与lib是可写的来源适配/fixture，app/globals.css是单一CSS源，build.mjs生成assets/app.js（经典IIFE，内含React）与assets/styles.css。没有Next运行时。

## 取用与启动（消费者零npm/Next）

本目录含可写源码与静态产物；复制或检出后打开index.html，不需要原作者node_modules/.next、Downloads、PaperBuilder、根仓依赖或私有凭据。资源均相对本地路径，无CDN、外部字体和本地数据fetch。file双击具备静态结构条件，但当前隔离QA仅支持HTTP，**file双击未测**，不得用HTTP通过代签。

可在本目录使用Python3标准库临时静态服务（端口可改）：

```bash
python3 -m http.server 53101 --bind 127.0.0.1
```

记录：http://127.0.0.1:53101/index.html?state=default#simulation

工作台：http://127.0.0.1:53101/index.html?state=default#workbench?simId=sim-001。simId仅hash内层权威，缺失/重复/outer冲突显式拒绝，无数据记录显式不可达。

Ctrl-C停止自己启动的服务。无需build/start脚本，无服务器框架、后台交易或权限存储。

## 作者修改与重新生成

本机核验Node24.14.0、npm11.9.0。仅作者改TSX/CSS后需：

```bash
npm ci
npm run build
```

package-lock.json为真实生成lockfile v3；依赖公共registry.npmmirror.com，需要网络，无私有凭据。作者工具链React/ReactDOM19.3.1、esbuild0.21.5、PostCSS8.5.32、Tailwind及插件4.3.3，准确闭包以锁为准。新空cache安装capture264 exit0、2.623秒；首次转换265 exit0、0.559秒，入口修正266 exit0、0.263秒。作者node_modules与下载cache实际占用另留体积原件，不能把消费者零安装误写作者无成本。

## 模拟边界与支持范围

全为合成研究数据；无真实交易后端、账户凭据、生产RBAC或持久化。刷新/重置不代表撤销服务器命令。本次静态迁移保留十态：default/loading/empty/error/cancel/boundary/permission/duplicate/partial/unknown；设计宽1440/1024/640，高900，stress=1为长文本压力。状态选择必须有真实数据面或具名反馈，不把selector字样当业务通过。旧Next浏览器结果只保历史，当前静态版本的实际命令、URL、截图和覆盖以本任务最新capture为准；独立复验与设计答复按下方实际原件回读，不由旧Next结果推断。

同一记录sim-001→同id工作台；sim-004/005归档可定位；图表、指标、订单/事件/详情保留原设计输入。停止确认为原生dialog并保焦点/取消/Esc；未接入的开始/菜单禁用并说明原因，不伪造真实运行。报价图域沿原CURR_P=21432作为本地mock基准，保持曲线并将原约30000数据平移；TP/SL/报价一致，不查真实市场价。systemState.ts中/Users/quant/...仅造数显示，不访问磁盘；原外部Google字体已移除，用本地系统fallback。原源稿与目标批准token映射仍分开，不能把来源样式冒目标批准规范。

## 长期版本与验收限制

来源分支为task/workflowhub/workflowhub-ui-frontend-c05-prototype-design-review-20261027。实际完整实现commit、交付commit和关键源码/静态产物SHA、锁文件、命令exit/截图由C05任务库P3审后Git交付原件固定，不用初始HEAD或package 0.0.0冒版本；长期证据在workflowhub任务库workflowhub-ui-frontend-c05-prototype-design-review-20261027/quality。C07由其owner取得固定commit，在自有可写分支检出；本任务不修改C07目录。独立clean checkout静态取用和A作者重新生成是否完成，以其后续实际原件为准；本机cache结果不代独立复现。

八维审查、首次读者理解、完整辅助技术/缩放/所有控件序列与用户接受均按真实原件判断。347/034/340原失败保留；原生停止确认、对比、main/h1、B回执/取消焦点/region/账户范围修复为候选，静态迁移后须受影响复验。HTTP测试不等于真实交易、C06生产权限或C07独立验收。

## 当前静态迁移自验（不代独立验收）

静态records三宽capture275/279/281 exit0（17/19/19断言）；原修复observer285三宽177检查exit0。随后十态工作台error暴露Scenario位于main外，282–284原失败保留；真实反馈移入main后292作者转换exit0，294–296两逻辑页×十态×三宽各134断言exit0。默认Scenario不渲染，已过默认records/contrast/focus无行为变化，依限定范围复用而未重跑。

测试使用agent-browser fresh隔离会话、auth none、Python3普通静态HTTP的上述index.html URL；423/433保存批次源hash不变与finally收回服务事实，所有owned profile清理0；原269/270空基准HTTP200/DOMready后目标断言RED，271/272/276旧失败保留并有具体修复/TCR。当前无预览服务，需按本README自行打开/启动；不能把关闭服务说成实时URL仍在线。

作者成本原件388：A安装36840KiB约35.98MiB，新空cache12068KiB约11.79MiB；不是网络下载精确字节。消费者运行文件约518KiB级，两路均零npm。297已精确清理本次自建A作者node_modules/cache及旧生成Next声明，未动根仓/foreign依赖或证据；作者重新编辑需按A锁重新安装。当前源码/静态产物真实SHA由审查冻结原件与后续实际commit绑定，clean checkout结论以其实际原件为准；006记录用户对已展示A/B设计的认可，不扩业务或全面质量。

## 本轮原审查修复后的数据边界

运行/停止状态与仓位证据分开：停止仅进入停止中，不清零原1手，不制造平仓订单/事件或Flat；001订单、保护价与图overlay保留。六项汇总指标按选中记录SIMS.metrics读取，不再由live/replay通用模板补数；缺值为不可计算。001保留原详细订单/行情/曲线示意；004为自身confirmed_empty，005不可用，006只有SIM_DATA身份、无SIMS仓位/指标故未知；011显示自身420/55.6%等指标及真实空仓。其他记录缺逐单、账户、行情/曲线序列时明确未提供，不复制NQ001或从seed编曲线；SIMS与SIM_DATA原合约注册差异保留来源事实，不冒真实后端。

来源回核：原Downloads/UI SimWorkbench自身已有isLive驱动无仓位/overlay及global PERF选择；本轮在C05适配源修复，不修改Downloads/PaperBuilder。473窄oracle322真实目标RED→324构建→326同命令63检查GREEN；335四native确认层177检查GREEN，真实Esc/取消/Tab背景阻断/trigger返回及原mock确认结果；508–512/513并读516、043已独立定向复验语义修复；原042覆盖与source.json机器映射限制保持。当前006认可的是已展示设计，不冒整体质量或业务认可。

独立验收回链：465为静态基线测试；508–512为本轮原finding语义复验，513必须与516时间界线更正并读，公开绑定515/518/520/522/524/526/528；043仅关闭A标题原finding，完整AT/200%与图轴contrast未决范围仍保留。006只认可已展示设计。P4整体核对、C07实际独立复现、真实后端/生产权限结论分别沿其原件，不用本说明冒通过。
