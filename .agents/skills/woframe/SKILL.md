---
name: woframe
description: 用 WoFrame 从参考短视频生成初版，或为口播出镜和不露脸系列定题、审稿、配置素材与生成 Remotion 预览。需要沿用系列 Handbook 时也使用。
---

运行 `node scripts/woframe.mjs doctor` 检查工具。三条创作路线及输入输出约定见 [创作流程](../../../docs/creator-workflows.md)。运行命令时以 WoFrame 仓库为当前目录。

- 新手从有无参考视频起步。先明确借鉴内容、结构还是风格，再按文档调用视频推荐、`video-use` 和 Hypit。向用户交付本次实际生成的视频文件，保留参考及借鉴范围。
- 口播出镜和不露脸共用「定题或审稿 → 确认文稿并准备素材 → Remotion 预览」。收到成稿时先检查，保留知识主张和原结构，只做局部优化。用户要求重排时再调整结构。文稿确认后才安排录制或上传。
- 第一集把可复用的选择写入系列 Handbook。后续集先读 Handbook，再用本集明确选择覆盖默认值。只有用户确认更新系列时才写回 Handbook。
- 预览前用 `node scripts/woframe.mjs check <项目.json>` 查缺失素材和无效时间轴。将项目与素材放进 `public/work/` 的同一个子目录，打开 Remotion 预览页。字幕、音画和错误由用户验收后，才启动另行指定的正式导出。
