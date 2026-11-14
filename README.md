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

读书短片可以随旁白更换主图、逐步展开图解。真人口播可以在保留原声的同时，切换全屏和讲解小窗。做成系列后，下一集可以沿用已确认的画面风格和声音。

## 三条赛道

| 赛道 | 用户是谁 | 走哪条路 |
| --- | --- | --- |
| Ⅰ 泛流量 | 希望快速验证选题和内容形式的创作者 | 用 `video-use` 拆解参考片，再用 Hypit 生成初版 |
| Ⅱ 不露脸垂直 | 希望围绕一个主题持续创作的内容作者 | 选题 → 文稿 → 本地 AI 配音或上传自录音频 → Remotion 成片 |
| Ⅲ 露脸个人 IP | 希望亲自出镜讲解、建立个人辨识度的创作者 | 选题、文稿、录制与剪辑，加入真人口播和辅助图解 |

Ⅱ 和 Ⅲ 使用 Remotion 出片。路线Ⅲ还会根据原片和讲稿确定保留的片段、出镜方式和图解出现的时机。

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

## 创作特色

- **按讲解推进画面。** Agent 根据实际声轨安排换图、图解揭示和字幕高亮。《你当像鸟飞往你的山》随人物经历换图，《心流》用球场图逐步讲清目标、反馈与难度。纸页拼贴是可选风格，书封和主图分区排版。[Remotion 默认动效](docs/remotion-motion.md) · [纸页拼贴](docs/paper-collage.md)
- **每集可选配音来源。** 不露脸视频可用本地 Qwen3-TTS，先试听同一段稿件的不同声线，再生成正式旁白。也可以用自录音频，按需清理、分段，并与画面和字幕对齐。模型准备好后可离线合成。[配音流程](docs/creator-workflows.md#路线ⅱ配音选择)
- **一段真人口播可剪成多镜。** 从原片选取所需片段，保留原声。人物可以在全屏和头肩小窗之间切换，相邻段落衔接时可连续播放原片，小窗旁按讲述内容换图。[露脸口播模板](docs/persona-video-template.md)
- **系列下集接着做。** 首集确认后，可用 `save-handbook` 保存主画幅、视觉风格、封面样式、声线或小窗设置。续集复用这些选择，再为新主题写稿、配音和选图。[Handbook](handbooks/README.md)
- **一集可交付多种画幅。** 在本地预览页选择发布入口、画幅和清晰度，播放检查后可直接导出当前版本。CLI 可一次渲染配置中的所有画幅，相同画幅共用一个 MP4。封面有五套可重排的模板，按发布入口单独准备。[视频画幅与封面](docs/publishing-formats.md) · [封面风格](docs/cover-styles.md)

## 技术亮点

- **项目文件可以复查。** 每集用 `episode.json` 保存分镜、字幕、素材路径、配音和发布配置。Agent 按仓库中的工作流组装项目，创作者可以打开配置、预览，并用同一份文件重新渲染。
- **按实际素材校验音画。** `check --strict` 检查素材和时间轴，`fit` 通过 FFmpeg 工具读取实际时长并调整分镜帧数。Agent 对照声轨复核字幕和动效的切点。
- **双引擎分工。** 路线Ⅱ和Ⅲ由 Remotion 在本地预览和渲染，用户素材和成片默认存放在本机。路线Ⅰ用 Hypit 在线生成初版。[环境与引擎配置](docs/environment.md)

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

`render` 将 MP4 写入以下目录。另行制作的封面可通过 `deliver --cover` 归档到同一位置。

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
| `npm run preview` | 播放审片、切换发布画幅和画质、导出当前版本的 MP4 |

导出支持 `480p`、`720p`、`1080p`。可在预览页选择画质，也可以在项目 JSON 中设置 `resolution`。命令行 `--resolution` 优先，默认 1080p。项目 JSON 的 `language` 用来标记内容语言，支持 `zh-CN`、`en-US`、`ja-JP`、`ko-KR`。

### 随旁白标出重点

分镜的 `cues` 可按镜内帧号切换字幕和画面。每项填写 `frame` 和 `text`，可用 `emphasis` 高亮字幕中的一段文字，用 `screenText` 更新画面标题，用 `cards` 更新讲解卡片。设置 `"cueStyle":"steady"` 可让卡片留在固定位置，并用 `null` 预留空位。纸页拼贴支持镜内字幕，口播插图分镜支持镜内字幕和标题。参考[带旁白的示例](public/examples/baoyan/episode.json)。

## 目录结构

```
WoFrame/
├── AGENTS.md                # Agent 入口约定
├── .agents/skills/woframe/  # 工作流 Skill
├── docs/                    # 流程、画幅、封面、环境、项目介绍
├── handbooks/<赛道>/         # 已保存的系列设置
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
