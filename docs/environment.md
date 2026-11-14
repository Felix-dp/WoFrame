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
| ffprobe | 是 | 读取音频真实时长，供 `fit`/`check` 对齐 | 随 ffmpeg | 随 ffmpeg | 随 ffmpeg |
| chrome | 否 | 渲染成片与封面出图 | `brew install --cask google-chrome` | `winget install --id Google.Chrome -e` | `sudo apt install google-chrome-stable` |
| uv | 否 | 配音工具链（后续启用） | `brew install uv` | `winget install --id astral-sh.uv -e` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| edge-tts | 否 | 离线配音（后续启用） | `uv tool install edge-tts` | 同左 | 同左 |

`setup --install` 只处理当前系统对应的那一列；缺 Node 或装依赖失败会直接停下并报错，不会静默跳过。

## 首次配置顺序

1. 装 Node.js 22.12 或更高。
2. `node scripts/woframe.mjs setup --install`。
3. `node scripts/woframe.mjs doctor` 复核。

## 关于 Chrome

渲染成片需要 Chromium 内核。没装 Chrome 时，第一次 `render` 会由 Remotion 自动下载一份 Headless Shell（约 90MB），之后离线可用。封面出图同样依赖 Chromium，脚本会按三平台常见路径自动查找，也可以用 `WOFRAME_CHROME` 指定可执行文件，跳过下载。

## 可选依赖

`uv` 与 `edge-tts` 只在启用配音时用到，不装不影响选题、文稿、渲染和出片。缺了它们 `setup` 会标成 `required: false`，不会阻止流程。
