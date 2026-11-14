# 环境依赖

依赖清单只有一份：`requirements.yaml`。检查、安装、补装都走同一个入口：

```sh
node scripts/woframe.mjs setup              # 逐项检查，输出 JSON
node scripts/woframe.mjs setup --install    # 缺什么装什么，装完自动复查
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

需要合成旁白时，可在安装 `uv` 后用 `uv tool install edge-tts` 安装在线配音工具，或使用用户已有的配音服务。把生成的音频保存到项目目录，在每镜的 `audio` 字段填相对路径，再运行 `fit --write`。已备有录音、只用视频原声或计划交付无旁白视频时可以跳过。
