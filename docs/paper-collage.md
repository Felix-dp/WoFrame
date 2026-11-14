# 纸页拼贴

这是供读书札记、人物小传和书摘选择的片内风格。暖白纸纹、墨色宋体和少量陶橙构成纸页，书封与书目保留在左栏，右栏主图随叙述接替，两栏留出间距。竖屏在双栏上方排正文，横屏把正文放在左侧。中文优先用宋体，英文书名和页码用衬线体。

## 从素材到成片

1. 用出版社、图书馆或正规书店核对书名、版次和封面。优先用原书封，按实际比例保留书脊和书名；如果图片有多余边框，裁掉外侧留白。
2. 按旁白找不同的主图。讲地点用实景，讲人物用可核实身份的照片，讲作品可用和段落有关的插画。人像可抠成透明 PNG 或 WebP，保留发丝、脸和肩部。把图片放进本集目录，记录原始链接、使用条件、署名和裁切方式。示意图、后来的校园照片和历史绘图按实际性质标注。
3. 正文一镜一层意思，手动用换行定稿，优先两到三条短行。只有版本和出处可核对时才作为书摘；转述或自写感想标识为「阅读札记」。橙色引号是视觉元素；单行说明可写阅读背景、出处或阅读札记标识。
4. 先用原声或确认过的本地合成声线生成逐段旁白。把每段音频放到同一个项目目录并填写 `audio`，用 `fit --write` 按实测时长对齐。换声时核对段首段尾空白和响度，保留句内停顿。跑 `check --strict` 后导出，带声音检查换图、文字重影、图片边缘和署名。封面可从停留帧选取。

## 案例《你当像鸟飞往你的山》

这支约 23 秒的竖屏样片用四段普通话旁白讲塔拉的求学和写作。制作时把书名、纸面和书封作为同一作品的视觉参照，每到下一段，主图短叠化，旧正文先退开，再揭示新正文。

| 最终版时间 | 旁白内容 | 主图及选图理由 |
| --- | --- | --- |
| 0:00.00 | 在爱达荷州的山里长大 | 东南部地区山景，先交代故事发生的环境 |
| 0:06.13 | 十七岁第一次走进大学教室 | 杨百翰大学校园实景，给叙述一个具体地点 |
| 0:12.17 | 到剑桥三一学院攻读历史学博士 | 三一学院大庭院旧绘，体现地点和求学阶段的变化 |
| 0:17.07 | 在回忆录里重新讲述自己的人生 | 塔拉的真实肖像与书封同框，回到讲述者和作品 |

最终版用 Qwen3-TTS 的 Serena 本地配音。三处换图随实际音轨重排。图片及署名可在原始页面核对。[中文版书封](https://item.xhsd.com/items/110000100408273) · [爱达荷州山景](https://commons.wikimedia.org/wiki/File:Pioneer_Historic_Byway_-_Mountains_and_Lakes_from_Grace_to_Preston_-_NARA_-_7721117.jpg) · [杨百翰大学校园](https://commons.wikimedia.org/wiki/File:Brigham_Young_University_Campus_-_BYU_-_Provo_-_Utah_in_Autumn.jpg) · [三一学院旧绘](https://commons.wikimedia.org/wiki/File:The-Great-Court%2C-Trinity-College.jpg) · [塔拉肖像](https://commons.wikimedia.org/wiki/File:Tara_Westover_receives_the_National_Humanities_Medal_on_March_21,_2023,_in_the_East_Room_of_the_White_House_-_P20230321ES-0780_%28cropped%29.jpg)

## 分镜配置

在普通 `route: "faceless"` 项目里加入如下分镜。先按旁白的意思分段，每段配一张对应的主图。用 `collage.portrait` 展示透明人像，用 `collage.illustration` 展示地点、物件或作品插图，每镜二选一。旁白用同级 `audio`，添加后跑 `fit --write`。同一本书可沿用书目信息，主图随旁白叠化接替。想硬切可加 `"motion": {"transition": "cut"}`。

```json
{
  "frames": 210,
  "text": "离开熟悉的世界，\n才发现自己也可以\n换一种方式看它。",
  "collage": {
    "eyebrow": "阅读札记",
    "book": "你当像鸟飞往你的山",
    "author": "塔拉·韦斯特弗 著",
    "originalTitle": "Educated: A Memoir",
    "cover": "cover.jpg",
    "portrait": "portrait.png",
    "note": "塔拉从爱达荷州的山中走进课堂，也开始重新理解自己的过去。",
    "credit": "书封 · 南海出版公司 ｜ 摄影 · Erin Scott",
    "folio": "READING / 01"
  }
}
```

填写 `text`（1–3 行，每行最多 16 字，建议每行 8–12 字），`collage.book`、`author`、`cover` 和一张主图。图片支持 PNG、WebP、JPEG，透明人像用 PNG 或 WebP。用 `originalTitle`、`note`、`credit` 补充信息，`eyebrow` 和 `folio` 可替换栏目和页码。含「实景」或「历史绘图」的说明写在 `note`。需要在不同机器得到一致字形时，在渲染机器安装同一款 Noto Serif SC。
