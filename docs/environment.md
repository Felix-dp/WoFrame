# 环境依赖

依赖清单只有一份：`requirements.yaml`。检查、安装、补装都走同一个入口：

```sh
node scripts/woframe.mjs setup              # 逐项检查，输出 JSON
node scripts/woframe.mjs setup --install    # 安装基础依赖，装完自动复查
node scripts/woframe.mjs setup --track=vertical --install  # 同时准备本地配音（Apple Silicon 或 Windows x64）
```

Agent 在开始提问之前先跑一次；缺必需依赖就先补，再进流程。

## 清单内容

| id | 必需 | 用途 | macOS | Windows | Linux |
| --- | --- | --- | --- | --- | --- |
| node | 是 | 运行环境，>= 22.12 | nodejs.org | winget install OpenJS.NodeJS.LTS | 发行版包管理器 |
| npm | 是 | 仓库依赖（package.json） | `npm install` | 同左 | 同左 |
| ffmpeg | 是 | 视频编码、成片处理 | `brew install ffmpeg` | `winget install --id Gyan.FFmpeg -e` | `sudo apt install ffmpeg` |
| ffprobe | 是 | 读取音视频真实时长，供 `fit`/`check` 对齐 | 随 ffmpeg | 随 ffmpeg | 随 ffmpeg |
| chrome | 否 | 渲染成片与封面出图 | `brew install --cask google-chrome` | `winget install --id Google.Chrome -e` | `sudo apt install google-chrome-stable` |
| uv | 否 | 安装可选的配音工具 | `brew install uv` | `winget install --id astral-sh.uv -e` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| edge-tts | 否 | 不露脸视频的可选在线配音工具 | `uv tool install edge-tts` | 同左 | 同左 |

`setup --install` 只处理当前系统对应的那一列；缺 Node 或装依赖失败会直接停下并报错，不会静默跳过。

## 首次配置顺序

1. 装 Node.js 22.12 或更高。
2. `node scripts/woframe.mjs setup --install`。
3. `node scripts/woframe.mjs doctor` 复核。

## 关于 Chrome

渲染成片需要 Chromium 内核。没装 Chrome 时，第一次 `render` 会由 Remotion 自动下载 Headless Shell，之后离线可用。用封面模板出图时，请安装本机 Chrome 或用 `WOFRAME_CHROME` 指定可执行文件。直接交付现有图或标记封面选帧时间点时无需另装 Chrome。

## 泛流量工具配置

确定走泛流量后，先装 [Hypit](https://github.com/hypit-ai/hypit) 的 Agent Skill 和 CLI。已有可用安装可直接复用。

```sh
npx skills add hypit-ai/hypit -g
npm install --global @hypit/hypit
```

在实际执行 Hypit 的项目目录创建（或选择已有的）Runtime Profile，配置用户选定的服务和凭据，再检查：

```sh
hypit runtime init
hypit doctor
```

使用默认模板中的 HypiHub 时，可用 `hypit auth login hypihub.default` 登录。使用已有 Profile 时，按 Hypit 文档检查对应的 Endpoint 和本次生成所需能力。根目录就是 Hypit 项目时，可以用 `node scripts/woframe.mjs doctor --track=traffic` 检查 CLI、Profile 和服务配置。若另建 Hypit 子项目，在该项目内运行 `hypit doctor`。

参考视频可由已装的 `video-use` 分析，也可用 Hypit 的 `transcribe` 和 `media` 命令取得转录与画面。做自动转录前确认所选服务可用。转录不可用时，可用用户提供的文字或口述分析参考。

## 可选依赖

### 合成旁白

在 Apple Silicon Mac 或 Windows x64 上运行 `node scripts/woframe.mjs setup --track=vertical --install`。安装器根据 Node.js 的系统和架构选择运行库和权重：

| 系统 | 运行库 | 首次模型下载 |
| --- | --- | --- |
| Apple Silicon Mac（ARM64 Node.js） | MLX，8-bit 权重 | 约 2 GB |
| Windows x64（x64 Node.js） | PyTorch CPU，官方 0.6B CustomVoice 权重 | 约 2.5 GB |

两者还需要 Python 依赖的磁盘空间。Windows 版走 CPU，不要求独立显卡或 CUDA，生成速度随机器而异。首次联网下载，无需账号；安装完成可离线配音。再次运行会复用本机缓存。只装基础依赖时，使用 `setup --install`。用 `setup --track=vertical` 查看 `narration.backend` 和 `narration.ready`。Windows 如果刚装好 uv 但当前终端尚未识别，请重开 PowerShell 后再运行安装。

第二条路线由客户逐集选择本地 TTS 或自录旁白。选自录时，客户提交本集讲稿的整段录音或分段录音，Agent 保留原件，按需清理和分段，再填入各镜的 `audio`。录音仅用于本集剪辑，缺段由客户补录。选本地 TTS 时，在 `public/work/<项目>/episode.json` 用 `route: "faceless"` 和 `preferences.track: "vertical"`，再给需要朗读的每镜填 `narrationText`。它是确认过的口播文稿，可以与画面标题和字幕不同。例如，一个分镜可以写成：

```json
{"frames": 120, "text": "周末只剩两个小时", "narrationText": "周末只剩两个小时。你会去兼职，还是把拖了一周的项目做完？"}
```

```bash
PROJECT="public/work/<项目>/episode.json"
node scripts/woframe.mjs voices --language=zh-CN
node scripts/woframe.mjs narrate "$PROJECT" --voice=qwen-vivian,qwen-serena,qwen-uncle-fu --sample
node scripts/woframe.mjs narrate "$PROJECT" --voice="$VOICE_ID" # VOICE_ID 填已确认的声线 ID
node scripts/woframe.mjs check "$PROJECT" --strict
```

`--sample` 只生成第一段旁白开头的最多 140 个字符，打印本地试听文件路径。用逗号分隔多个声线 ID，可以批量试听同一段文稿。选定声线后，`narrate` 逐镜生成音频、更新 `audio` 并按声音时长调整 `frames`。更换 `--voice` 会重新生成已有的 AI 旁白，保留用户提供的录音及旧音频文件。先配音，再按实际发声时间添加 `cues`；已经标好 `cues` 的分镜需要重新对齐才能换声。系列确认后可以通过 `save-handbook` 记住声线，续集用 `apply-handbook` 后可省略 `--voice`。

- **Qwen3-TTS** 是这两个平台的默认配音模型。普通话使用手动选择或已保存的系列声线，英文、日语和韩语可按语言使用默认声线。模型准备好后可离线使用，9 条预设共用同一份模型。 [Qwen3-TTS 官方声线表](https://github.com/QwenLM/Qwen3-TTS#custom-voice-generate)
- **Edge 在线语音** 可手动选择，适用于未支持本地 Qwen 的系统。需 `uv` 和网络，会把朗读文本提交给在线服务。 [Edge TTS 工具说明](https://github.com/rany2/edge-tts)
- 如果已录好旁白或使用其他配音服务，将文件放在项目目录，再给每镜填写 `audio`，用 `fit --write` 对齐即可。


| 项目语言 | 本地 Qwen 声线 ID |
| --- | --- |
| 中文 `zh-CN` | `qwen-vivian`、`qwen-serena`、`qwen-uncle-fu`、`qwen-dylan`（北京口音）、`qwen-eric`（成都口音） |
| 英文 `en-US` | `qwen-ryan`（默认）、`qwen-aiden` |
| 日语 `ja-JP` | `qwen-ono-anna`（默认） |
| 韩语 `ko-KR` | `qwen-sohee`（默认） |
