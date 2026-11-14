# WoFrame

面向短视频创作者的 Agent 工作流。支持新手参考片生成、口播出镜、不露脸视频和系列 Handbook。

## 在 Agent 里用

用有访问权限的 GitHub 账户克隆这个私有仓库，然后在该目录打开 Codex。可直接说「用 `$woframe` 做一条 30 秒不露脸视频，主题是导数」。支持读取 `AGENTS.md` 的其他 Agent 也可使用同一个入口。

```sh
node scripts/woframe.mjs doctor
node scripts/woframe.mjs check public/examples/episode.json
npm install
npm run preview
```

打开 Vite 输出的本地地址。默认载入一段带中文字幕的不露脸演示。自定义项目放在 `public/work/<项目>/`，通过 `?project=/work/<项目>/episode.json` 打开。预览和校验命令不会发起正式渲染。

`npm run studio` 启动已有工作台，提供讲稿编辑、分镜拍摄、原声和动画等交互。文稿与素材进入 Remotion 时按 [项目示例](public/examples/episode.json) 整理。完整操作及外部工具安装见 [创作流程](docs/creator-workflows.md)。
