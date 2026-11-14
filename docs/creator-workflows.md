# 创作流程

## Ⅰ 新手

1. 问有没有参考片。有则问模仿内容、结构、风格中的哪些，接收本地视频或外链。外链使用当前 Agent 已接入的平台接口解析为可访问素材。链接读取失败时请用户上传。参考素材和成片素材分别记账。
2. 无参考时问领域和平台。有搜索工具时，找该领域近期热门片，返回链接、发布日期、能核实的互动量和推荐理由，由用户选一条。没有可核实的热门数据时，标明资料性质，也可以打开工作台的 `/design/reference.html` 看本地讲法示例，或打开 Remotion 示例项目看样片。
3. 安装 [video-use](https://github.com/browser-use/video-use/blob/main/install.md) 后，按其 Skill 对选定媒体执行转录、时间轴和画面检查。把借鉴项整理为时间范围、内容要点、段落顺序、节奏、字幕或视觉特征。转录需要按上游说明配置 ElevenLabs 和 FFmpeg。分析不可用时仍可由用户提供文字描述以继续。
4. 安装 [Hypit](https://github.com/hypit-ai/hypit/blob/main/docs/quickstart.md) 的 Agent Skill，把参考路径、选择的借鉴项、时间轴观察和新主题交给它，生成、构建并回看首版。如果工作流要生成新素材，按 Hypit 所用服务配置凭据及额度。向用户返回实际产出的文件和借鉴摘要。

## Ⅱ 口播出镜 · Ⅲ 不露脸

0. 收选题词或已有文稿。少量问答确定受众、目标时长、节奏、平台、画幅及风格。有成稿则校核事实疑点、用词和可口播性，给局部修改。
1. 出初稿或局部优化差异，请用户确认。结构调整由用户选择。确认后询问素材、语音、BGM、视觉效果和字幕。口播在此时录制或上传；不露脸选择图解、录屏等。音频分别处理主声轨与 BGM。
2. 按 [示例](../public/examples/episode.json) 组装项目 JSON，画幅为 9:16 或 16:9。素材路径相对项目 JSON。每个分镜包含 `frames`，可带 `caption`、`text`、`video` 或 `audio`；`bgm` 为项目级背景音乐。口播预览要求每镜有视频，不露脸可仅用文字与字幕。分镜音频和视频原声同时存在时，视频静音。时长由帧数和 FPS 决定，Agent 应按实际素材时长对齐，并在需要逐字字幕时拆成更短的字幕区间。先通过 `check`，再用 Remotion Player 逐镜检查。只有收到导出请求才进行正式渲染或进入工作台导出流程。

## 保存系列

Handbook 是带 `preferences` 对象的 JSON，可以与系列项目一起保存。`preferences` 只存跨集设置。第一集确认后运行：

```sh
node scripts/woframe.mjs save-handbook public/work/episode-1/episode.json workspace/handbook.json
```

第二集先将 Handbook 默认值合入已有项目，并保留本集选择：

```sh
node scripts/woframe.mjs apply-handbook workspace/handbook.json public/work/episode-2/episode.json
```

保存命令会创建新的 Handbook 文件，并拒绝覆盖已有文件。合并命令输出 JSON，由 Agent 审阅后写入本集项目。项目字段 `ratio` 可省略，预览会读取 `preferences.ratio`。已有项目的 `ratio` 优先。项目和云服务凭据留在本地。
