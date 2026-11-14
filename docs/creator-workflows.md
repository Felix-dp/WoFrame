# 创作流程

三个词先分清：

| 词 | 指什么 | 取值 |
| --- | --- | --- |
| 赛道 track | 账号靠什么活下去，决定走哪条流程 | `traffic` 泛流量 / `vertical` 不露脸垂直 / `persona` 露脸个人 IP |
| 形态 route | 这一集怎么拍 | `talking-head` 露脸口播 / `faceless` 不露脸 |
| 执行路径 | 这一集的内容从哪来 | 模仿爆款 / 原创 / 切片 |

赛道是账号层面的事，形态是这一集怎么拍，执行路径是这一集怎么做。先定赛道，再进对应流程。

## 目录约定

| 位置 | 放什么 |
| --- | --- |
| `handbooks/<track>/<系列名>.json` | 系列沉淀，跨集复用，按赛道分目录 |
| `output/<track>/<系列名>/EP01-标题-9x16.mp4` | 用户拍板的成品 |
| `public/work/<项目>/` | 进行中的项目和素材 |

开工第一件事是列一遍已有 Handbook：

```sh
node scripts/woframe.mjs handbooks
```

有同系列的沉淀就用 `find-handbook` 找到、`apply-handbook` 合进本集，只问本集新增的东西；没有才从头问。跨赛道不套用，用户转型要回第 0 问。

成品按赛道分目录存放，命名由命令生成，不手写文件名：

- Ⅱ/Ⅲ 用 `render` 直接写进 `output/<track>/<系列名>/`，不需要搬运。
- Ⅰ 的 Hypit 产物优先让它直接输出到 `output/traffic/<账号名>/`；只能生成在别处时，用 `deliver` 移过去（是移动，不留副本）：

```sh
node scripts/woframe.mjs deliver "./hypit-out.mp4" --track=traffic --series=泛流量 --ep=01 --title="今日热点" --ratio=9x16
```

- 封面图同样用 `deliver` 搬进同一目录，加 `--cover`。

## 第 0 问：定赛道

第一轮只确认这一件事。

如果 `handbooks` 里已经有这个系列的 `track`，先问一句「还是按 <系列名> 继续吗」，确认后直接沿用，不用重问。

不要问「你是哪个赛道」，给用户三个场景让他选最像的：

| 选项 | 给用户看的描述 | 写入 |
| --- | --- | --- |
| Ⅰ | 我想追热点，什么火做什么，账号还没定型 | `track: traffic` |
| Ⅱ | 我有专业，不想露脸，想把一个领域讲成系列 | `track: vertical` |
| Ⅲ | 我要出镜，卖的是我这个人，想慢慢立住 | `track: persona` |

用户拿不准时，用三个问题分流，不要反复追问：

1. 愿意出镜吗？不愿意 → Ⅱ；连专业积累也没有 → Ⅰ。
2. 要不要一个固定的系列名？要 → Ⅱ 或 Ⅲ；不要 → Ⅰ。
3. 观众记住的是「讲了什么」还是「谁在讲」？谁在讲 → Ⅲ。

Ⅱ 和 Ⅲ 是同一条流程（下面共用 0-1-2），差别只在要不要出镜；Ⅰ 走另一条。

## Ⅰ 泛流量：照着爆款做

不问讲稿，只问「有没有想模仿的」。

1. **有想模仿的**：问借内容、结构还是风格（可多选）。接收本地视频，或让 Agent 用已接入的平台接口解析外链为可访问素材；链接读取失败就请用户上传。参考素材和成片素材分别记账。
2. **没有想模仿的**：问领域和平台。有搜索工具时，抓该领域近期火爆视频，返回链接、发布日期、能核实的互动量和推荐理由，由用户选一条。拿不到可核实的热门数据时，标明资料性质，改看 `design/reference.html` 的本地讲法示例或 Remotion 样片。
3. **video-use**：对选定媒体做转录、时间轴和画面检查，把借鉴项整理成时间范围、内容要点、段落顺序、节奏、字幕或视觉特征。转录按上游说明配置 ElevenLabs 和 FFmpeg；分析不可用时，接受用户口述继续。
4. **Hypit 生成首版**：把参考路径、借鉴项、时间轴观察和新主题交给它，生成、构建、回看。要生成新素材时，按 Hypit 所用服务配置凭据与额度。
5. **交付**：本次实际产出的文件，以及借鉴摘要——借了什么、没借什么。成品用 `deliver` 落到 `output/traffic/<账号名>/`，账号名还没定就用 `泛流量`。

这条不做系列，不锁版式。画幅在 Hypit 出片时按主发平台定（竖屏或横屏），不走下面 Remotion 那套发布规格；封面每条按 [封面风格](cover-styles.md) 的 A 或 B 现选，随片一起交付。

Ⅰ 和 Ⅱ/Ⅲ 的成片是两条管线：Ⅰ 追速度，交给 Hypit 直接出片；Ⅱ/Ⅲ 要系列一致，用 Remotion 渲染。不要把 Ⅰ 拉回 Remotion，也不要用 Ⅱ/Ⅲ 的发布规格去套 Ⅰ。

## Ⅱ 口播出镜 · Ⅲ 不露脸：同一条 0-1-2

两条支路共用这条流程，差别只在第 1 步要不要出镜。露脸 IP 额外记住：人设、镜头前怎么说话、在哪拍，这些第一集定完就沿用，别每集重问。

### 0 选题

先收选题词。用户已有成稿时，先检测事实疑点、用词和可口播性，只做局部优化——不重写、不改结构，除非用户明确要求。

再问四件事：

- 受众是谁
- 长度和节奏（30 秒 / 1 分钟 / 更长）
- 平台与画幅（竖屏还是横屏，按 [视频画幅与封面指南](publishing-formats.md) 推荐）
- 风格偏好

### 1 文稿

出初稿，或给出局部优化差异，请用户确认。结构调整由用户选。

确认后再问三件事：

- 素材来源：提醒用户这一步可以交素材——要出镜就录好放进 `public/work/<项目>/`，照片、录屏同理。交不交、交哪些由用户决定，没交就按现有素材继续；不露脸在这里定图解或录屏
- 音频：原声还是 BGM；主声轨和 BGM 分别处理
- 视觉效果：字幕、画面风格；第一集还要定封面方向（见 [封面风格](cover-styles.md)）

### 2 成片

按 [示例](../public/examples/episode.json) 组装项目 JSON，用 `ratio` 从 `9:16`、`16:9`、`3:4`、`4:3` 和 `1:1` 选择画幅。素材路径相对项目 JSON。每个分镜包含 `frames`，可带 `caption`、`text`、`video` 或 `audio`；`bgm` 为项目级背景音乐。露脸口播每镜要有视频；不露脸可以只用文字与字幕。分镜音频和视频原声同时存在时，视频静音。时长由帧数和 FPS 决定，按实际素材时长对齐；需要逐字字幕时拆成更短的字幕区间。

先跑 `node scripts/woframe.mjs check <项目.json>`。如果 `warnings` 报音画时长对不上，跑 `fit --write` 按音频实际时长重算每镜 `frames`，再 `check` 一次：

```sh
node scripts/woframe.mjs fit "public/work/<项目>/episode.json" --write
```

需要逐镜核对时用 `npm run preview` 看字幕、音画和报错。确认后 `render` 出片：

```sh
node scripts/woframe.mjs render "public/work/<项目>/episode.json" --ep=01
```

成片直接写到 `output/<track>/<系列名>/`。**先看再定稿**：用户在当地播放验收，通过才算完成；不通过就改 JSON 再 render 一次。

### 3 交付

MP4 已经在 `output/<track>/<系列名>/`。封面用 [封面风格](cover-styles.md) 的工具出图，再用 `deliver --cover` 放进同一目录；采样帧的场合给出明确时间点。

### Ⅲ 比 Ⅱ 多问的四件

第一集在第 0 步一并问完，之后只执行不重设计：

- 人设与关系：如果观众跟朋友介绍你，会说你是什么人——老师、同行，还是过来人
- 出镜规格：在哪拍、坐着还是站着、画面里要不要露出手和桌面
- 说话方式：语速偏快还是偏慢、有没有常挂嘴边的话、看不看镜头
- 表现验收：一条最多录几遍、哪点不过就重录

## 系列：第一集确认后

Ⅱ 和 Ⅲ 才有系列。第一集验收完成后把这一轮问出来的答案落盘：

```sh
node scripts/woframe.mjs save-handbook public/work/episode-1/episode.json
```

命令按 `preferences.track` 和 `preferences.series` 自动写到 `handbooks/<track>/<系列名>.json`。系列名没定就用本集标题命名；之后定了系列名，用新名字再存一次，并删掉旧文件。

同名文件已存在时**合并写入**：只更新这次带来的字段，已有的 `audience`、`coverStyle` 等不会丢。所以第一集之后每集都可以再存一次，不需要 `--force`，也不会清空旧设定。

第二集起先找再用：

```sh
node scripts/woframe.mjs find-handbook 零基础经济学
node scripts/woframe.mjs apply-handbook handbooks/vertical/零基础经济学.json public/work/episode-2/episode.json
```

`preferences` 只存跨集设置：`track`、`series`、`platform`、`ratio`、`coverStyle`、`captionStyle`、`bgmStyle`，以及 Ⅲ 的 `hostRole`、`staging`、`speech`、`takeRule`。保存命令创建新文件并拒绝覆盖；合并命令输出 JSON，由 Agent 审阅后写入本集项目。项目字段 `ratio` 可省略，预览读 `preferences.ratio`；已有项目的 `ratio` 优先。项目和云服务凭据留在本地。

## 发布规格

只适用于 Ⅱ 和 Ⅲ。在多选平台时确认主发入口、各入口的形式和画幅，写入 `publishingTargets`，主发入口放第一项。同画幅且内容相同的版本共用一个 MP4，封面按入口检查。首版出来后按实际发布页复核裁切。

Ⅰ 不写 `publishingTargets`：画幅和封面在 Hypit 出片时定，只确认主发平台即可。