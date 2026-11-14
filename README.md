# WoFrame

面向短视频创作者的 Agent 工作流。Agent 先问用户的定位——泛流量、不露脸垂直、露脸个人 IP——再按对应支路往下走：泛流量照着爆款做，垂直和 IP 走选题、文稿、成片三步，最后出片并沉淀系列。

系列沉淀放在 `handbooks/<赛道>/<系列名>.json`，成品放在 `output/<赛道>/<系列名>/`；Agent 开工先查 Handbook，再问本集新增的问题。目录约定见 [Handbooks](handbooks/README.md)。

## 在 Agent 里用

用有访问权限的 GitHub 账户克隆这个私有仓库，然后在该目录打开 Codex。可直接说「用 `$woframe` 做一条 30 秒不露脸视频，主题是导数」，也可以只说你的定位，由 Agent 先定赛道再往下问。支持读取 `AGENTS.md` 的其他 Agent 也可使用同一个入口。

```sh
node scripts/woframe.mjs setup --install
node scripts/woframe.mjs doctor
node scripts/woframe.mjs handbooks
node scripts/woframe.mjs check public/examples/episode.json
node scripts/woframe.mjs fit public/work/<项目>/episode.json --write
node scripts/woframe.mjs render public/examples/episode.json --ep=01
```

依赖清单只有一份：`requirements.yaml`，macOS 与 Windows 的安装命令都在里面，`setup --install` 会按系统补齐。详见 [环境依赖](docs/environment.md)。

## 项目、素材与出片

项目放在 `public/work/<项目>/`，素材和项目 JSON 放在同一目录，路径相对 JSON。`check` 通过后用 `render` 出片，直接写到 `output/<赛道>/<系列名>/EP01-标题-9x16.mp4`；要换位置加 `--out=`。

素材由用户决定交不交、交哪些。Agent 在第 1 步提醒一次：要出镜就录好放进项目目录，要照片、录屏同理；没交就按现有素材继续。

在项目 JSON 中用 `ratio` 选择画幅。`9:16` 为 `1080×1920`，`16:9` 为 `1920×1080`，`3:4` 为 `1080×1440`，`4:3` 为 `1440×1080`，`1:1` 为 `1080×1080`。

开拍或生成前，按主发平台和内容形式确认视频画幅及封面规格。平台推荐、选帧和封面交付方式见 [视频画幅与封面指南](docs/publishing-formats.md)，系列第一集先按 [封面风格](docs/cover-styles.md) 定版式并写进 Handbook。

`render` 首次运行会下载 Remotion 用的 Chrome Headless Shell；已有本机 Chrome 时可以用 `WOFRAME_CHROME` 指定，跳过下载。

## 辅助工具

`npm run preview` 只用于逐镜审片：打开 Vite 输出的地址，通过 `?project=/work/<项目>/episode.json` 载入同一份项目配置，看字幕、音画和发布规格。它不是出片的必经步骤，成品一律由 `render` 生成。

`npm run studio` 是早期的工作台原型，保留但不属于 Agent 流程。完整流程与外部工具安装见 [创作流程](docs/creator-workflows.md)。