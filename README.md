<p align="center">
  <img src="docs/assets/banner.jpg" alt="WoFrame 一帧 · 从一句话，到一段知识短片" width="100%">
</p>

<p align="center">
  <b>从一句话，到一段知识短片。</b><br>
  面向知识短视频创作者的 Agent 工作流，覆盖选题、写稿、配音和成片
</p>

<p align="center">
  <img alt="node" src="https://img.shields.io/badge/Node-%E2%89%A522.12-2F6B4F?style=flat-square">
  <img alt="agent" src="https://img.shields.io/badge/Agent-Codex%20%7C%20Claude%20Code-1F3A5F?style=flat-square">
  <img alt="platform" src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-BE6440?style=flat-square">
  <img alt="BoHack" src="https://img.shields.io/badge/BoHack-2026.11-8C978D?style=flat-square">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-2F6B4F?style=flat-square"></a>
</p>

---

## 这是什么

**WoFrame（一帧）** 是一套面向知识短视频创作者的 Agent 工作流。把仓库克隆到本地，用 Codex、Claude Code 等支持读取 `AGENTS.md` 的工具打开，就可以从一个选题开始，逐步确定脚本、素材、配音和发布画幅。

每集的分镜、字幕和音频记录在项目文件里，方便预览和修改。做系列时，已确认的风格、声线和发布规格可以保存到 Handbook，下一集直接沿用。

## 三条赛道

| 赛道 | 用户是谁 | 走哪条路 |
| --- | --- | --- |
| Ⅰ 泛流量 | 希望快速验证选题和内容形式的创作者 | 用 `video-use` 拆解参考片，再用 Hypit 生成初版 |
| Ⅱ 不露脸垂直 | 希望围绕一个主题持续创作的内容作者 | 选题 → 文稿 → 本地 AI 配音或上传自录音频 → Remotion 成片 |
| Ⅲ 露脸个人 IP | 希望亲自出镜讲解、建立个人辨识度的创作者 | 选题、文稿、录制与剪辑，加入真人口播和辅助图解 |

Ⅱ 和 Ⅲ 都从选题和文稿开始。路线Ⅲ还会确定出镜方式、录制要求和口播剪辑。第一集确认过的选择会沉淀成该系列的 Handbook；下次开工，Agent 先查 Handbook，只问这一集新增的问题。

## Demo 展示

### Ⅱ 不露脸垂直 · 读书短片示例

以下是两支 Remotion 成片的关键帧，统一使用「阅读札记」页脚。两集都采用纸页拼贴和本地 Qwen3-TTS Serena 配音，第二集通过 Handbook 复用了第一集的栏目设置。

| EP01《你当像鸟飞往你的山》· 36 秒 | EP02《心流：投入感从哪里来》· 40 秒 |
| --- | --- |
| <img src="docs/assets/demos/route-2-educated-idaho.jpg" width="160" alt="第一集成片画面，左侧为书封，右侧为爱达荷州山景"> <img src="docs/assets/demos/route-2-educated-author.jpg" width="160" alt="第一集成片画面，主图切换为作者塔拉·韦斯特弗的肖像"> | <img src="docs/assets/demos/route-2-flow-goal.jpg" width="160" alt="第二集成片画面，球场图标出十次发球六次进区的目标"> <img src="docs/assets/demos/route-2-flow-challenge.jpg" width="160" alt="第二集成片画面，球场图用逐层缩小的目标区表示提高难度"> |
| 旁白讲到不同的成长阶段时，主图随之换成山景、校园、三一学院旧绘和作者肖像。 | 旁白讲目标、反馈和难度时，球场图依次显示目标区、实际落点和缩小后的目标区。 |

### Ⅲ 露脸个人 IP

**《BoHack 天津站：最后一天早上做什么》** · 13 秒

<img src="docs/assets/demos/route-3-bohack-promo.jpg" width="840" alt="路线三宣传图，米白画面显示项目提交时间、提交示意和日新轨迹，右下小窗为虚构博主">

WoFrame 将现场录制剪成日程速览，去掉明显的看稿停顿，保留讲述者原声。开场用真人全屏引入，讲到项目提交和早餐安排时，讲述者缩到圆形小窗，图解随口播切换，最后回到全屏收尾。参见[露脸口播模板](docs/persona-video-template.md)。

*上图为宣传用画面，小窗使用 AI 生成的虚构博主。*

[路演截图、讲解要点与素材来源](docs/demo-showcase.md)

## 核心功能

- **制作路线**。根据内容主题、更新计划和是否愿意出镜，选择适合的制作流程。
- - **系列沉淀**：Handbook 按赛道存在 `handbooks/<赛道>/<系列名>.json`，第一集成片后自动生成，同名合并写入，不覆盖已有设定。
- **项目即配置**：一集视频就是一个 `episode.json`——画幅、分镜、字幕、配音、BGM 全在里面，可版本管理、可回滚。
- **规范出片**：`render` 按发布计划将各画幅 MP4 写入 `output/<赛道>/<系列名>/`，文件名由命令生成。
- **默认动效**：Remotion 视频按讲稿和实际声轨安排换图、图解揭示和转场。文字镜提供入场与衔接，支持卡片、步骤、数字和口播小窗。见 [Remotion 默认动效](docs/remotion-motion.md)。
- **质量闸门**：`check` 校验素材与时间轴；`fit` 按独立旁白或口播原片时长重算帧数。
- **封面体系**：五套风格（简·色块、科技·霓虹、电影·学术、切片·信息条、纸感·编辑），模板支持 16:9 / 9:16 / 3:4 / 4:3 / 1:1。
- **发布规格**：按平台与发布入口生成 `publishingTargets`，确定主发入口、视频画幅与封面画幅，同画幅共用导出版本。

## 技术亮点

- **仓库即产品，Agent 即前端**：`AGENTS.md` + `SKILL.md` + 一套确定性 CLI，任何支持读仓库指令的 Agent 都能接入，不需要打开任何网站。
- **可验证的命令边界**：`setup`、`check`、`fit`、`handbooks`、`save-handbook`、`render` 每一步都有输出、可复现、可回滚，不依赖"Agent 记住了"。
- **双引擎分工**：系列内容用 Remotion（版式可控、多画幅一致、逐帧可查），追热点用 Hypit（从参考片直接生成首版），产物收敛到同一套 `output/` 规范。
- **系列与成品按目录归档**。CLI 按路线和系列命名成品，原有 Handbook 可随时查阅。
- **音画对齐自动化**：ffprobe 读真实时长反推帧数，替代"Agent 心算 `frames = 秒 × fps`"。
- **模板级设计系统**：封面用容器查询单位排版，同一份模板在不同画幅下重排而非缩放。
- **本地优先**。Remotion 的项目、用户素材和成品存放在本地。路线Ⅰ使用 Hypit 的在线生成服务。

## 快速开始

### 1. 克隆

```bash
git clone https://github.com/Felix-dp/WoFrame.git
cd WoFrame
```

### 2. 安装基础依赖

依赖清单只有一份 [requirements.yaml](requirements.yaml)，macOS 走 brew、Windows 走 winget，只装缺的：

```bash
node scripts/woframe.mjs setup --install
node scripts/woframe.mjs doctor
```

Apple Silicon Mac 和 Windows x64 上需要本地 AI 旁白时，运行 `node scripts/woframe.mjs setup --track=vertical --install`。WoFrame 按系统下载 Qwen3-TTS 权重和 Python 依赖，之后可离线使用 9 条预设声线。见[系统与下载说明](docs/environment.md#合成旁白)。

需要 Node.js 22.12 以上及 FFmpeg。Remotion 首次渲染可下载 Headless Shell，使用封面模板另需本机 Chrome。走泛流量赛道时还需 [配置 Hypit 和参考分析工具](docs/environment.md#泛流量工具配置)。

### 3. 在 Agent 里开工

在这个目录打开 Codex 或 Claude Code，直接说：

> 用 `$woframe` 做一条 60 秒不露脸视频，主题是「机会成本」

也可以只说你的定位，由 Agent 先定赛道再往下问。Agent 会先跑 `handbooks` 看有没有可复用的系列沉淀，再开始提问。

### 4. 一条片子会走过的命令

```bash
PROJECT="public/work/<项目>/episode.json"

node scripts/woframe.mjs check "$PROJECT" --strict    # 校验素材与时间轴
node scripts/woframe.mjs fit   "$PROJECT" --write     # 音画对不齐时重算帧数
node scripts/woframe.mjs render "$PROJECT" --ep=01    # 出片
node scripts/woframe.mjs save-handbook "$PROJECT"     # 第一集沉淀系列
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
| `voices [--language=]` | 查看 AI 配音声线 |
| `narrate <项目.json> [--voice=] [--sample]` | 为不露脸垂直项目试听或生成[旁白](docs/environment.md#合成旁白) |
| `check <项目.json>` | 校验素材、时间轴与画幅 |
| `fit <项目.json> [--write]` | 按独立旁白或口播原片时长重算分镜帧数 |
| `render <项目.json> [--ep=] [--ratio=] [--resolution=] [--out=]` | 渲染所有发布画幅，或指定一个画幅。单画幅可指定输出文件 |
| `deliver <文件> --track= --series= --ep= --title=` | 把外部产物（如 Hypit 成片、封面）移入 output |
| `npm run preview` | 逐镜审片（可选，不参与出片） |

导出支持 `480p`、`720p`、`1080p`。可在预览页选择画质，也可以在项目 JSON 中设置 `resolution`。命令行 `--resolution` 优先，默认 1080p。项目 JSON 的 `language` 用来标记内容语言，支持 `zh-CN`、`en-US`、`ja-JP`、`ko-KR`。

### 随旁白标出重点

分镜的 `cues` 可按镜内帧号切换字幕和画面。每项填写 `frame` 和 `text`，可用 `emphasis` 高亮字幕中的一段文字，用 `screenText` 更新画面标题，用 `cards` 更新讲解卡片。设置 `"cueStyle":"steady"` 可让卡片留在固定位置，并用 `null` 预留空位。纸页拼贴支持镜内字幕，口播插图分镜支持镜内字幕和标题。参考[带旁白的示例](public/examples/baoyan/episode.json)。

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

- [纸页拼贴](docs/paper-collage.md)：可选片内风格，含《你当像鸟飞往你的山》的配音与换图案例
- [露脸口播模板](docs/persona-video-template.md)
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

WoFrame 的原创代码和工作流模板采用 [MIT 许可证](LICENSE)，允许使用、修改、分发和商用。分发代码或其主要部分时，请保留原版权声明和 MIT 许可文本。

Remotion 等第三方依赖适用各自的许可。运行或分发使用 Remotion 的项目时，请查阅 [Remotion 许可条款](https://github.com/remotion-dev/remotion/blob/v4.0.543/LICENSE.md)。仓库中的项目品牌、宣传海报和演示图片仅供展示，另有标注的素材以其标注为准。
