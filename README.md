<p align="center">
  <img src="docs/assets/banner.jpg" alt="WoFrame 一帧 · 从一句话，到一段知识短片" width="100%">
</p>

<p align="center">
  <b>从一句话，到一段知识短片。</b><br>
  面向短视频创作者的 Agent 工作流 · 先定赛道，再一步步问到成片
</p>

<p align="center">
  <img alt="node" src="https://img.shields.io/badge/Node-%E2%89%A522.12-2F6B4F?style=flat-square">
  <img alt="agent" src="https://img.shields.io/badge/Agent-Codex%20%7C%20Claude%20Code-1F3A5F?style=flat-square">
  <img alt="platform" src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-BE6440?style=flat-square">
  <img alt="BoHack" src="https://img.shields.io/badge/BoHack-2026.11-8C978D?style=flat-square">
</p>

---

## 这是什么

**WoFrame（一帧）** 是一个可以直接 `git clone` 的 Agent 工作流仓库。它不是网站，也不是剪辑软件：克隆到本地，用 Codex、Claude Code 等能读取 `AGENTS.md` 的 Agent 打开，Agent 就会按仓库里写好的流程，把用户从"我想做视频"带到一条能发布的成片。

它解决的是第一次做知识视频时那段真实的断层。人真正卡住的往往不是"不会剪"，而是：做哪个赛道、这集讲什么、脚本怎么写、素材从哪来、竖屏还是横屏、封面长什么样、下一集怎么不重复回答同样的问题。这些判断原本散落在经验、教程和十几个互不相通的工具里。

WoFrame 把它们收成一条可执行的流程：**先定赛道 → 按支路提问 → 出稿 → 校验 → 出片 → 沉淀系列**。每一步都落在一个可以复查的命令或文件上，而不是留在对话里。

## 三条赛道

| 赛道 | 用户是谁 | 走哪条路 |
| --- | --- | --- |
| Ⅰ 泛流量 | 追热点、账号还没定型 | 照着爆款做：参考片 / 抓近期爆款 → `video-use` 拆解 → Hypit 生成 |
| Ⅱ 不露脸垂直 | 有专业、不想出镜、要做系列 | 选题 → 文稿 → 成片（0-1-2 三步） |
| Ⅲ 露脸个人 IP | 卖的是"这个人" | Ⅱ 的全部，另加人设、出镜规格、说话方式、表现验收 |

Ⅱ 和 Ⅲ 共用同一条主干，只在"人"的部分分叉。第一集确认过的选择会沉淀成该系列的 Handbook；下次开工，Agent 先查 Handbook，只问这一集新增的问题。

## 核心功能

- **赛道定位**：第一轮只问一件事——账号靠什么活下去。给三个具体场景让用户选，拿不准时用三个问题分流，不让用户理解"赛道"这种词。
- **两条生产流程**：泛流量走"模仿爆款"的快速链路；垂直与 IP 走"选题 → 文稿 → 成片"的三步链路，成片引擎各自明确。
- **系列沉淀**：Handbook 按赛道存在 `handbooks/<赛道>/<系列名>.json`，第一集成片后自动生成，同名合并写入，不覆盖已有设定。
- **项目即配置**：一集视频就是一个 `episode.json`——画幅、分镜、字幕、配音、BGM 全在里面，可版本管理、可回滚。
- **规范出片**：`render` 无头渲染直接产出 MP4，写入 `output/<赛道>/<系列名>/EP01-标题-9x16.mp4`，文件名由命令生成。
- **质量闸门**：`check` 校验素材与时间轴；`fit` 读音频真实时长重算帧数，解决"渲染完才发现音画差半秒"。
- **封面体系**：五套风格（简·色块、科技·霓虹、电影·学术、切片·信息条、纸感·编辑），一套模板适配 16:9 / 3:4 / 4:3 / 1:1。
- **发布规格**：按平台与发布入口生成 `publishingTargets`，确定主发入口、视频画幅与封面画幅，同画幅共用导出版本。

## 技术亮点

- **仓库即产品，Agent 即前端**：`AGENTS.md` + `SKILL.md` + 一套确定性 CLI，任何支持读仓库指令的 Agent 都能接入，不需要打开任何网站。
- **可验证的命令边界**：`setup`、`check`、`fit`、`handbooks`、`save-handbook`、`render` 每一步都有输出、可复现、可回滚，不依赖"Agent 记住了"。
- **双引擎分工**：系列内容用 Remotion（版式可控、多画幅一致、逐帧可查），追热点用 Hypit（从参考片直接生成首版），产物收敛到同一套 `output/` 规范。
- **文件系统即数据库**：系列沉淀与成品都按赛道分目录，命名由命令生成；转型换赛道时旧 Handbook 留在原目录，不串味。
- **音画对齐自动化**：ffprobe 读真实时长反推帧数，替代"Agent 心算 `frames = 秒 × fps`"。
- **模板级设计系统**：封面用容器查询单位排版，同一份模板在不同画幅下重排而非缩放。
- **本地优先**：素材、项目、成品、凭据都留在本机；官方仓库里 `handbooks/` 与 `output/` 都是空的。

## 快速开始

### 1. 克隆

```bash
git clone https://github.com/Felix-dp/WoFrame.git
cd WoFrame
```

### 2. 一次装齐依赖

依赖清单只有一份 [requirements.yaml](requirements.yaml)，macOS 走 brew、Windows 走 winget，只装缺的：

```bash
node scripts/woframe.mjs setup --install
node scripts/woframe.mjs doctor
```

需要 Node.js 22.12 以上；ffmpeg 必需，Chrome 可选（首次渲染时 Remotion 也能自动下载）。

### 3. 在 Agent 里开工

在这个目录打开 Codex 或 Claude Code，直接说：

> 用 `$woframe` 做一条 60 秒不露脸视频，主题是「机会成本」

也可以只说你的定位，由 Agent 先定赛道再往下问。Agent 会先跑 `handbooks` 看有没有可复用的系列沉淀，再开始提问。

### 4. 一条片子会走过的命令

```bash
node scripts/woframe.mjs check public/work/<项目>/episode.json   # 校验素材与时间轴
node scripts/woframe.mjs fit   public/work/<项目>/episode.json --write  # 音画对不齐时重算帧数
node scripts/woframe.mjs render public/work/<项目>/episode.json --ep=01 # 出片
node scripts/woframe.mjs save-handbook public/work/<项目>/episode.json  # 第一集沉淀系列
```

产物直接落在：

```
output/
└── vertical/零基础经济学/
    ├── EP01-机会成本-9x16.mp4
    └── EP01-机会成本-3x4-cover.png
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `setup [--install]` | 检查并安装环境依赖 |
| `doctor` | 工具链自检 |
| `handbooks` / `find-handbook <系列名>` | 检索系列沉淀 |
| `save-handbook <项目.json>` | 沉淀本集确认过的设置（同名合并） |
| `apply-handbook <handbook> <项目.json>` | 把系列默认值合入新一集 |
| `check <项目.json>` | 校验素材、时间轴与画幅 |
| `fit <项目.json> [--write]` | 按音频真实时长重算每镜帧数 |
| `render <项目.json> [--ep=] [--out=]` | 无头渲染，直接写入 output |
| `deliver <文件> --track= --series= --ep= --title=` | 把外部产物（如 Hypit 成片、封面）移入 output |
| `npm run preview` | 逐镜审片（可选，不参与出片） |

## 目录结构

```
WoFrame/
├── AGENTS.md                # Agent 入口约定
├── .agents/skills/woframe/  # 工作流 Skill
├── docs/                    # 流程、画幅、封面、环境、项目介绍
├── handbooks/<赛道>/         # 系列沉淀（第一集自动生成）
├── output/<赛道>/<系列名>/   # 成片与封面
├── public/work/<项目>/       # 进行中的项目与素材
├── public/examples/         # 示例项目
├── design/covers/           # 封面模板与样品
├── preview/                 # Remotion 预览与渲染
├── scripts/                 # CLI 与依赖检查
└── requirements.yaml        # 唯一的依赖清单
```

## 文档

- [创作流程](docs/creator-workflows.md)：三条赛道、0-1-2、Handbook 与目录约定
- [视频画幅与封面](docs/publishing-formats.md)：各平台规格与选帧建议
- [封面风格](docs/cover-styles.md)：五套方向、固定槽位与锁定规则
- [环境依赖](docs/environment.md)：清单说明与首次配置
- [项目介绍](docs/project-intro.md)：完整版介绍
- [Handbooks](handbooks/README.md)：命名与生命周期

## 团队

**Next Level** · BoHack 2026.11

<p align="center">
  <img src="docs/assets/poster.jpg" alt="一帧 · 团队宣传海报" width="420">
</p>

## License

本仓库为 BoHack 2026.11 参赛作品，暂未开源。
