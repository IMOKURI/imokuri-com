---
title: vLLM Sleep Mode
slug: vllm-sleep-mode
date: 2025-07-09
updated:
tags:
    - LLM
    - Deep Learning
description: "vLLMのsleep modeについて"
---

vLLM は、1インスタンスで1つのモデルを動かします。
そのモデルのスループットを最大化するため、GPUメモリの殆どの領域をKV Cacheとして利用します。

一方で、vLLMの起動には、torch compileや量子化、モデルロードのために、数分程度を要することがあります。
そこで、複数のモデルを「さっと」切り替えるために、vLLMは「sleep mode」を提供しています。

vLLMを起動する際に、 `--enable-sleep-mode` をつけて起動します。

このインスタンスをスリープモードにしたいときは、 `/sleep` エンドポイントに、スリープのレベルをあわせて、リクエストを投げます。

```bash
curl -X POST localhost:8000/sleep -d '{"level":1}'
```

スリープモードのレベルは、以下のように設定できます。

- `1`: KV CacheをGPUメモリから削除し、モデルの重みはCPUメモリにオフロードします。
- `2`: KV CacheをGPUメモリから削除し、モデルの重みも削除します。

インスタンスをアクティブにしたいときは、 `/wake_up` エンドポイントにリクエストを投げます。

```bash
curl -X POST localhost:8000/wake_up
```

この記事の内容は、机上確認なので、私もどこかで実際に試してみたいと思います。。

## 参考

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Pro-tip for vLLM power-users: free ≈ 90 % of your GPU VRAM in seconds—no restarts required🚀<br><br>🚩 Why you’ll want this<br>• Hot-swap new checkpoints on the same card<br>• Rotate multiple LLMs on one GPU (batch jobs, micro-services, A/B tests)<br>• Stage-based pipelines that call… <a href="https://t.co/WAzdiZWL6u">pic.twitter.com/WAzdiZWL6u</a></p>&mdash; EmbeddedLLM (@EmbeddedLLM) <a href="https://twitter.com/EmbeddedLLM/status/1942556855324270610?ref_src=twsrc%5Etfw">July 8, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

