# C05样本B：无稿实盘驾驶舱

B是index.html、styles.css、app.js三件运行文件，加README与.gitignore。app.js是品种/三账户fixture、许可判断、命令去重、状态转换、timer和键盘交互的唯一owner；无包管理器、无安装、无构建。

## 取用与启动（消费者零npm/Next）

本目录含可写源码与静态产物；复制或检出后打开index.html，不需要原作者node_modules/.next、Downloads、PaperBuilder、根仓依赖或私有凭据。资源均相对本地路径，无CDN、外部字体和本地数据fetch。file双击具备静态结构条件，但当前隔离QA仅支持HTTP，**file双击未测**，不得用HTTP通过代签。

可在本目录使用Python3标准库临时静态服务（端口可改）：

```bash
python3 -m http.server 53102 --bind 127.0.0.1
```

http://127.0.0.1:53102/index.html?state=default&permission=allow&role=leader。详情、确认、历史与台账在同一文件内切换。

Ctrl-C停止自己启动的服务。无需build/start脚本，无服务器框架、后台交易或权限存储。

## 作者修改

直接编辑三件运行文件并刷新。Node/npm不是B作者或消费者前置条件；当前仅用node --check检查JS语法，不代表浏览器验收。

## 模拟边界与支持范围

全为合成研究数据；无真实交易后端、账户凭据、生产RBAC或持久化。刷新/重置不代表撤销服务器命令。本次静态迁移保留十态：default/loading/empty/error/cancel/boundary/permission/duplicate/partial/unknown；设计宽1440/1024/640，高900，stress=1为长文本压力。状态选择必须有真实数据面或具名反馈，不把selector字样当业务通过。旧Next浏览器结果只保历史，当前静态版本的实际命令、URL、截图和覆盖以本任务最新capture为准；独立复验与设计答复按下方实际原件回读，不由旧Next结果推断。

四步：品种卡→详情→精确确认词“单品种清仓”→同id历史/查询/读回灯/台账。4821为主账户，7204/9043为跟随账户；关系不授予权限。本地allow/close_only/deny/missing与leader/follower视角单独决定模拟许可，GC固定拒绝仍可看详情；确认框重列三账户范围。发送只生成requested保原量，自动显示同id历史与查询焦点；confirmed仅对应MOCK-PROOF可见才该账户归零，partial逐账户0/1/1，failed/unknown保原量，重复不重发。异步query由owned timer和generation隔离，跨对象GC/重置不会被NQ迟到结果污染；pagehide清timer。发出不等于生效，reset不是撤销服务器。

## 长期版本与验收限制

来源分支为task/workflowhub/workflowhub-ui-frontend-c05-prototype-design-review-20261027。实际完整实现commit、交付commit和关键源码/静态产物SHA、锁文件、命令exit/截图由C05任务库P3审后Git交付原件固定，不用初始HEAD或package 0.0.0冒版本；长期证据在workflowhub任务库workflowhub-ui-frontend-c05-prototype-design-review-20261027/quality。C07由其owner取得固定commit，在自有可写分支检出；本任务不修改C07目录。独立clean checkout静态取用和A作者重新生成是否完成，以其后续实际原件为准；本机cache结果不代独立复现。

八维审查、首次读者理解、完整辅助技术/缩放/所有控件序列与用户接受均按真实原件判断。347/034/340原失败保留；原生停止确认、对比、main/h1、B回执/取消焦点/region/账户范围修复为候选，静态迁移后须受影响复验。HTTP测试不等于真实交易、C06生产权限或C07独立验收。

## 当前静态迁移自验（不代独立验收）

静态live三宽capture280/286/287各252断言exit0：原218业务/异步义务全保，额外为顶层modal唯一性观察guard；实际GC先于settle98/93/103ms、reset79/73/74ms（按1440/1024/640顺序，原日志可回读）。十态288–290各67断言exit0；原修复observer291三宽225检查exit0，包含内层取消/Esc/关闭后exactdanger焦点、确认重列账户、直接同id回执与查询焦点、合法region。

测试使用agent-browser fresh隔离会话、auth none、Python3普通静态HTTP的上述index.html URL；423/433保存批次源hash不变与finally收回服务事实，所有owned profile清理0；原269/270空基准HTTP200/DOMready后目标断言RED，271/272/276旧失败保留并有具体修复/TCR。当前无预览服务，需按本README自行打开/启动；不能把关闭服务说成实时URL仍在线。

作者成本原件388：A安装36840KiB约35.98MiB，新空cache12068KiB约11.79MiB；不是网络下载精确字节。消费者运行文件约518KiB级，两路均零npm。297已精确清理本次自建A作者node_modules/cache及旧生成Next声明，未动根仓/foreign依赖或证据；作者重新编辑需按A锁重新安装。当前源码/静态产物真实SHA由审查冻结原件与后续实际commit绑定，clean checkout结论以其实际原件为准；006记录用户对已展示A/B设计的认可，不扩业务或全面质量。

独立验收回链：465为静态基线测试；508–512为本轮原finding语义复验，513必须与516时间界线更正并读，公开绑定515/518/520/522/524/526/528；043仅关闭A标题原finding，完整AT/200%与图轴contrast未决范围仍保留。006只认可已展示设计。P4整体核对、C07实际独立复现、真实后端/生产权限结论分别沿其原件，不用本说明冒通过。
