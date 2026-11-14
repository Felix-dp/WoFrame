# Handbooks

每个系列沉淀一份，按赛道分目录。Agent 开工前先在这里找，别把已经确认过的事再问一遍。

## 目录与命名

```
handbooks/<track>/<系列名>.json
```

- `track`：`traffic` / `vertical` / `persona`，一个赛道一个目录，不混放。
- 文件名就是系列名，中文直接用；空格换成 `-`，去掉 `/ \ : * ? " < > |`。文件名要能一眼看出是哪个系列，不要用 `handbook.json`、`默认.json` 这种。
- 系列名还没定时，先用本集标题命名；定了系列名再用新名字存一次，删掉旧文件。
- 同名文件已存在时**合并写入**：只更新这次带来的字段，旧设定不会丢。不用 `--force`，也不会覆盖出一份残缺的。

## 什么时候写

Ⅱ 和 Ⅲ 的第一集，用户确认整条片子之后写。写的是这一轮问出来的答案，不是单集内容。

```sh
node scripts/woframe.mjs save-handbook public/work/episode-1/episode.json
```

赛道和系列名从项目的 `preferences.track`、`preferences.series` 里取。赛道必填，系列名未填写时使用本集标题。生成的 JSON 由 Git 忽略。

## 怎么用

开工第一件事是列一遍：

```sh
node scripts/woframe.mjs handbooks
```

知道系列名时直接找：

```sh
node scripts/woframe.mjs find-handbook 零基础经济学
```

命中就把默认值合进本集项目，只问本集真正新增的东西：

```sh
node scripts/woframe.mjs apply-handbook handbooks/vertical/零基础经济学.json public/work/episode-2/episode.json
```

用户转型（比如从 Ⅲ 换到 Ⅰ）时不要跨赛道套用，重新走第 0 问；旧 Handbook 留在原目录，别删。

## 不写什么

- 单集标题、分镜、文案——这些属于项目，不属于系列
- 云服务凭据、密钥
- 泛流量每条的临时选择（封面、钩子）

## 结构

```json
{
  "version": 1,
  "updatedAt": "2026-11-14",
  "preferences": {
    "track": "vertical",
    "series": "零基础经济学",
    "audience": "零基础观众",
    "ratio": "9:16",
    "coverStyle": "cinema"
  }
}
```
