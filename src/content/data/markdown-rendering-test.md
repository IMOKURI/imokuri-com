---
title: Markdown Rendering Test
slug: markdown-rendering-test
updated: 2026-06-24
description: "Markdownのレンダリングテスト用のページです。"
---

## Contents

---

# Markdown notes

Markdown was designed by John Gruber in 2004 as a plain-text format that
converts to HTML. It has since splintered into dozens of dialects.

## Headers

# This is a Heading h1

## This is a Heading h2

### This is a Heading h3

#### This is a Heading h4

##### This is a Heading h5

###### This is a Heading h6

## Emphasis

_This text will be italic_

**This text will be bold**

_You **can** combine them_

## Lists

### Unordered

- Item 1
- Item 2
  - Item 2a
  - Item 2b
    - Item 3a
    - Item 3b

### Ordered

1. Item 1
2. Item 2
3. Item 3
   1. Item 3a
   2. Item 3b

## Links

You may be using [Markdown Live Preview](https://markdownlivepreview.com/).

## Blockquotes

> Markdown is a lightweight markup language with plain-text-formatting syntax, created in 2004 by John Gruber with Aaron Swartz.
>
> > Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

## Callouts

<!-- Callout type names are case-insensitive: 'Note', 'NOTE', and 'note' are equivalent. -->

> [!tip] This is tip callout
> This is useful for some tips.

> [!note] This is a _non-collapsible_ callout
> Some content is displayed directly!

> [!WARNING]- This is a **collapsible** callout
> Some content shown after opening!

> [!caution]
> This is caution alert callout.

## Codes

### terminal

```bash
echo "This terminal frame has no title"
```

### title

```ts title="markdown-rendering-test.ts"
import { markdownToHtml } from "satteri"

const { html } = markdownToHtml("# Hello, *world*")
```

### highlight keywords

```log /[0-9]+MiB/
# GPUメモリ Before Sleep
|    0   N/A  N/A         1979459      C   VLLM::Worker                          87496MiB |

# GPUメモリ After Sleep Level 1
|    0   N/A  N/A         1979459      C   VLLM::Worker                           2066MiB |
```

### highlight lines

```json {3-4}
{
  "error": {
    "message": "EngineCore encountered an issue. See stack trace (above) for the root cause.",
    "type": "Internal Server Error",
    "param": null,
    "code": 500
  }
}
```

### Inline code

This web site is using `markedjs/marked`.

## Tables

| 項目             | 開発主体    | GitHub Stars | 最新バージョン | デプロイ方法    |
| ---------------- | ----------- | -----------: | -------------- | --------------- |
| AIBrix           | ByteDance   |         3.8k | 0.3.0          | Manifest        |
| Production Stack | LMCache Lab |         1.4k | 0.1.5          | Helm            |
| llm-d            | Red Hat     |         1.2k | 0.0.8          | Installer (.sh) |
| Dynamo           | NVIDIA      |         4.3k | 0.3.0          | Operator        |

## Images

![Dynamo Architecture](/blog/inference-nvidia-dynamo-architecture-diagram-r2-2048x1152.png)

## X

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">主に就活・転職の方向けのサイトに、取材いただいた内容が掲載されましたー😄<br><br>データ&amp;AIスペシャリストの道を切り開く──最先端技術の追求を支えるHPEの魅力 <a href="https://t.co/huuEpMMF67">https://t.co/huuEpMMF67</a> <a href="https://x.com/talentbook_jp?ref_src=twsrc%5Etfw">@talentbook_jp</a>より</p>&mdash; Yoshio Sugiyama (@imokurity) <a href="https://x.com/imokurity/status/1827884079997747262?ref_src=twsrc%5Etfw">August 26, 2024</a></blockquote>
