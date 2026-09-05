# P0 深读笔记：animation-vocabulary

- 来源镜像：`/Users/Hugh/Hugh/Project/Website-skills/animation-vocabulary/SKILL.md`（174 行，单文件，全文精读）
- 许可证：MIT（frontmatter 声明）
- 定位：反向查询词表——把模糊的动效描述映射为精确术语（"popover 打开时弹一下的那个" → Pop in），只命名、不设计不构建

## ① 核心机制（一句话）

一张 12 类 91 词条的权威词表 + 6 条查询规程：按用户描述的"感觉"（而非关键词）匹配词表、逐字引用官方定义、对近似术语做消歧，让用户拿到能去提示 AI/设计师的准确名词。

## ② 完整可执行规则表

### 查询规程（6 条）

| # | 规则 | 要义 |
|---|------|------|
| Q1 | 读意图不读关键词 | 用户描述的是所见所感（"springy"、"slides off"、"draws itself in"），把感觉映射到词表 |
| Q2 | 逐字引用词表 | 词表定义是权威文本，原样使用，禁止转述改写 |
| Q3 | 近似术语消歧 | 两词竞争时（Clip-path vs Mask、Pop in vs Bounce、Shared element transition vs Layout animation）并排对比让用户能选 |
| Q4 | 无精确匹配时 | 给最近术语并明说是近似，或用词表词汇组合描述（"那是 scale-in 入场的 stagger"） |
| Q5 | 不越出词表 | 词表真没有就直说，禁止发明新词（可用表内词汇解释概念） |
| Q6 | 保持简短 | 命名问题要的是名字不是论文；先给术语，问了再展开 |

### 输出格式

- 主匹配：`**术语** — 权威定义（逐字）`
- 多候选时：最佳匹配在前，随后 1–2 个备选各附一行差异说明

### 完整词表（12 类 91 词条，逐条列出）

**1. Entrances & Exits 进出（6 条）**
| 术语 | 定义 |
|------|------|
| Fade in / Fade out | 通过改变透明度出现/消失 |
| Slide in | 从屏外（左右上下）滑入 |
| Scale in | 从小到大放大出现，常与 fade 配对 |
| Pop in | 带轻微过冲出现，像弹入就位 |
| Reveal | 内容被逐渐揭开，常通过 clip-path 或 mask 动画 |
| Enter / Exit | 元素被添加/移除时播放的动画 |

**2. Sequencing & Timing 时序编排（8 条）**
| 术语 | 定义 |
|------|------|
| Keyframes | 动画的定义点（0%/50%/100%），浏览器补间 |
| Interpolation / Tween | 生成起止值之间的全部中间帧使运动连续 |
| Stagger | 多个元素逐项小延迟依次动画，形成级联 |
| Orchestration | 刻意编排多个动画的时序使其如同一个协调动作 |
| Delay | 动画开始前的等待时间 |
| Duration | 动画耗时 |
| Fill mode | 动画开始前/结束后元素是否保持首/末帧样式（如 forwards） |
| Stepped animation | 分成离散步进的动画，如倒计时 |

**3. Movement & Transforms 位移变换（8 条）**
| 术语 | 定义 |
|------|------|
| Translate | 沿 X/Y 轴移动 |
| Scale | 放大缩小 |
| Rotate | 绕点旋转 |
| Skew | 沿 X/Y 轴倾斜剪切 |
| 3D tilt / Flip | 3D 空间旋转（rotateX/rotateY）增加纵深 |
| Perspective | 3D 效果强度——值越小纵深越夸张 |
| Transform origin | 缩放/旋转的锚点 |
| Origin-aware animation | 元素从触发器长出（popover 从按钮长出而非默认的自身中心） |

**4. Transitions Between States 状态间过渡（7 条）**
| 术语 | 定义 |
|------|------|
| Crossfade | 一个淡出另一个淡入，同一位置 |
| Continuity transition | 视觉连接前后状态保持用户方位感（如同一矩形变大变小） |
| Morph | 一个形状平滑变成另一个形状（如 Dynamic Island） |
| Shared element transition | 元素从一处移动并变换到另一处（缩略图展开成卡片） |
| Layout animation | 尺寸/位置变化时动画到新位置而非跳变 |
| Accordion / Collapse | 区块平滑展开/收起高度 |
| Direction-aware transition | 前进向一个方向滑、后退反向滑，导航有方向感 |

**5. Scroll 滚动（5 条）**
| 术语 | 定义 |
|------|------|
| Scroll reveal | 元素进入视口时淡入/滑入就位 |
| Scroll-driven animation | 进度直接绑定滚动位置的动画 |
| Parallax | 滚动时背景前景不同速移动产生纵深 |
| Page transition | 页面/路由间导航时播放的动画 |
| View transition | 浏览器在两个状态/页面间 morph，连接共享元素 |

**6. Feedback & Interaction 反馈交互（9 条）**
| 术语 | 定义 |
|------|------|
| Hover effect | 光标悬停时的视觉变化 |
| Press / Tap feedback | 点击时轻微缩小，有物理感 |
| Hold to confirm | 按住按钮时进度逐渐填满 |
| Drag | 抓取移动元素，松手常带惯性 |
| Drag to reorder | 拖动列表项重排，其余项让位 |
| Swipe to dismiss | 把元素拖出屏关闭（drawer、toast） |
| Rubber-banding | 拖过边界时的阻力与回弹（iOS 过滚手感） |
| Shake / Wiggle | 快速左右抖动，表示错误/拒绝输入 |
| Ripple | 从触点扩散的圆，确认按压 |

**7. Easing 缓动（7 条）**
| 术语 | 定义 |
|------|------|
| Easing | 动画加减速的速率 |
| Ease-out | 快起慢收；多数 UI 和响应用户动作的默认 |
| Ease-in | 慢起快收；通常避免，显拖沓 |
| Ease-in-out | 慢-快-慢；适合已在屏上从 A 到 B 的元素 |
| Linear | 匀速；UI 避免，留给 spinner/marquee |
| Cubic-bezier | 自定义缓动曲线，精确控制 |
| Asymmetric easing | 加速与减速速率不同的曲线，比对称的更有生命力 |

**8. Spring Animations 弹簧（9 条）**
| 术语 | 定义 |
|------|------|
| Spring | 物理驱动（张力/质量/阻尼）而非固定时长的运动 |
| Stiffness / Tension | 弹簧拉向目标的强度，越高越干脆 |
| Damping | 弹簧稳定下来的速度，越低越多回弹振荡 |
| Mass | 元素的"重量"感，越大越慢越钝 |
| Bounce | 过冲后稳定的弹簧，增加俏皮感 |
| Perceptual duration | 弹簧"感觉上"结束的时长（底层仍在微稳定） |
| Momentum | 携带速度的运动，尤指拖拽或打断之后 |
| Velocity | 元素运动的速度与方向；弹簧被打断时带入下一段动画 |
| Interruptible animation | 可在半途平滑改向而非必须先播完的动画 |

**9. Looping & Ambient Motion 循环环境动（7 条）**
| 术语 | 定义 |
|------|------|
| Marquee | 文本/内容连续循环滚动 |
| Loop | 重复播放的动画（定次或无限） |
| Alternate (yoyo) | 正放再倒放的循环，而非跳回起点 |
| Orbit | 元素绕另一元素连续转圈 |
| Pulse | 轻柔重复的缩放/透明度变化以吸引注意 |
| Float | 轻柔连续的上下漂移，让静态元素有悬浮感 |
| Idle animation | 元素闲置等待交互时播放的微妙动作 |

**10. Polish & Effects 润色特效（10 条）**
| 术语 | 定义 |
|------|------|
| Blur | 模糊滤镜，软化元素或掩盖小瑕疵 |
| Clip-path | 把元素裁成形状，用于 reveal、mask、前后对比滑块 |
| Mask | 用形状/渐变隐藏或显示元素局部——类似 clip-path 但边缘柔和可渐变 |
| Before / after slider | 可拖分隔条在两张叠放图之间擦拭对比 |
| Line drawing | SVG 路径自绘，如无形的笔描线 |
| Text morph | 文本变化时逐字符动画，吸引注意新值 |
| Skeleton / Shimmer | 加载时带流动光泽的占位 |
| Number ticker | 数字滚动/递增到目标值 |
| Tabular numbers | 等宽数字，数值变化不位移；ticker/计时器/计数器必备 |
| Typewriter | 文本逐字出现如打字 |

**11. Performance 性能（6 条）**
| 术语 | 定义 |
|------|------|
| Frame rate (FPS) | 每秒绘制帧数；60fps 是顺滑基线，新屏 120fps |
| Jank | 浏览器跟不上动画掉帧造成的可见卡顿 |
| Dropped frame | 错过绘制Deadline的一帧，运动中的小顿挫 |
| Compositing | 让 GPU 在独立图层上移动/淡变元素，不重做 layout/paint |
| will-change | 预告元素将动画的 CSS 提示，浏览器提前提升为独立图层 |
| Layout thrashing | 动画 width/height/top/left 等属性迫使浏览器每帧重算 layout 造成 jank |

**12. Principles to Know 原则（9 条）**
| 术语 | 定义 |
|------|------|
| Purposeful animation | 运动应服务于功能（定向/反馈/展示关系）而非纯装饰 |
| Anticipation | 主动作前的反向小蓄力，预示即将发生 |
| Follow-through | 主动作停止后部件继续运动并轻微稳定，增加重量感 |
| Squash & stretch | 运动中形变以传达重量、速度、弹性 |
| Perceived performance | 对的动画让界面感觉更快，哪怕实际没有 |
| Frequency of use | 动画被看到越频繁，就应越短越微妙 |
| Spatial consistency | 跨状态保持元素身份与位置，用户不迷路 |
| Hardware acceleration | 动画 transform/opacity 让 GPU 保持顺滑 |
| Reduced motion | 尊重 prefers-reduced-motion，减弱或移除动效 |

**统计：6+8+8+7+5+9+7+9+7+10+6+9 = 91 词条，12 类。**

## ③ 对"工程质量四维度"的支撑点

- **组件化**：中。词表把"popover 从按钮长出"这类体验命名为 Origin-aware animation / Shared element transition 等可检索术语，使组件需求描述可精确化，间接提升组件规格质量；Tabular numbers 一条直接是数据组件（ticker/计时器）的必备属性提示。
- **统一性**：强（其核心价值）。全队/全 agent 共用同一套动效名词，消除"弹一下""滑进来"各说各话；Q2（逐字引用）保证定义在流转中不失真。这是设计→代码链路的**术语对齐层**。
- **可维护性**：中。词表本身需与上游 `/vocabulary` 页保持同步（文件自述要求），是一笔持续的同步债；91 条定义冻结后作为只读资产维护成本低。
- **性能**：低-中。Performance 类 6 条（FPS/jank/dropped frame/compositing/will-change/layout thrashing）与 Principles 类的 Hardware acceleration 提供性能词汇，但它只命名不优化；真正的性能执行靠 animate 与 vercel-react-best-practices。对性能维度的贡献是"让性能问题可被准确描述"（如把"卡"精确为 jank / dropped frame / layout thrashing）。

## ④ 与 workflowhub 的精确集成点

1. **并入 animate 作为词表附录（既定结论的落点）**：animate 输出规约要求"命名目的"，词表给它 91 个标准名词；animate 的 feel-check 环节需要描述感觉时也有词可用。
2. **design-source-readiness（设计稿动效标注环节）**：评审设计稿动效标注时用标准术语记录（"此处为 Pop in + ease-out"而非"弹一下"），使动效意图在材料中无歧义传递——这是它四维度价值最高的环节。
3. **frontend-prototype-render（需求理解环节）**：用户模糊描述动效需求时先做术语归一，再进 animate 决策链；减少生成偏差。
4. **ui-parity-checklist / ui-visual-fidelity（差异描述环节）**：发现动效不一致时用术语开具差异项（"稿为 Shared element transition，实现为 Crossfade"），差异单可读性提升。
5. **frontend-component-quality**：辅助性质，不作为质量判据（它不含可执行规则，按宪法不能当证据源）。

## ⑤ 移植风险

- **许可证**：MIT（frontmatter），无单独 LICENSE 文件；并入 animate 时随附 NOTICE 即可。
- **依赖**：零。纯文本词表，无代码、无外部引用（仅注释提及 easing 概念，无链接依赖）。
- **上游漂移（唯一实质风险）**：文件自述"镜像项目 `/vocabulary` 页的精选快照，任一方变更时保持两边同步"——它是活体页面的副本。并入 animate 后成为冻结快照，须接受与上游页面漂移；建议固定上游 commit 登记，词表变更走人工评审，不自动跟新。
- **完整性风险**：Q5 禁止发明词——若并入时删节词表，后续查询落到被删词条会"假阴性"；故并入必须**全量 91 条**，不做 HIGH+ 式子集裁剪。

## ⑥ 验证或推翻之前结论

**之前结论：animation-vocabulary = 并入 animate（不独立复制，"12 类 70 词"，边际价值低、迁移难度极低）。**

**深读后判定：结论"并入 animate"验证成立；但词表规模数据需推翻修正。**

1. **推翻"12 类 70 词"**：实际逐条清点为 **12 类 91 词条**（6/8/8/7/5/9/7/9/7/10/6/9）。此前研究低估了约 30%。规划并入工作量与文档体积时按 91 条计。
2. **"并入 animate"成立且有新论据**：词表 Q2 要求"逐字引用、禁止转述"，说明定义文本是自含权威资产，不依赖宿主环境；且词表 12 类中有 3 类（Easing/Spring/Performance）与 animate 的缓动表、弹簧配置、transform/opacity 规则一一对应——并入后 animate 的每个配料都有标准名称，协同是结构性的而非凑合。
3. **"边际价值低"需上调半档**：在 design-source-readiness 的动效标注环节与 parity 差异单撰写环节，它有独立可观测价值（术语对齐层），不只是 animate 的附属；但维持"不独立成技能"的结论——它没有可执行规则，独立成技能不符合 workflowhub 技能形态。
4. 并入方式修正：必须全量并入且保持定义逐字（Q2/Q5 约束），附录形式建议为 animate 的 `VOCABULARY.md` 第三文件，并在 animate SKILL.md 的目的命名、Never-Ship 自检处引用词表术语。
