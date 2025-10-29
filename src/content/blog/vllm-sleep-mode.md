---
title: vLLM Sleep Mode
slug: vllm-sleep-mode
date: 2025-07-09
updated: 2025-10-20
tags:
    - LLM
    - Deep Learning
description: "vLLMのsleep modeについて"
---

## Contents

## Overview

vLLM は、1インスタンスで1つのモデルを動かします。
そのモデルのスループットを最大化するため、GPUメモリの殆どの領域をKV Cacheとして利用します。

一方で、vLLMの起動には、torch compileや量子化、モデルロードのために、数分程度を要することがあります。
そこで、複数のモデルを「さっと」切り替えるために、vLLMは「sleep mode」を提供しています。

vLLMを起動する際に、 環境変数 `VLLM_SERVER_DEV_MODE=1` と コマンドライン引数 `--enable-sleep-mode` をつけて起動します。

> [!note]
> この環境変数によって利用可能になるエンドポイントはエンドユーザーには公開しないことが推奨されています。

## Sleep

このインスタンスをスリープモードにしたいときは、 `/sleep` エンドポイントに、スリープのレベルをあわせて、リクエストを投げます。

```bash
curl -X POST localhost:8000/sleep -d '{"level":1}'
```

スリープモードのレベルは、以下のように設定できます。

- `1`: KV CacheをGPUメモリから削除し、モデルの重みはCPUメモリにオフロードします。
- `2`: KV CacheをGPUメモリから削除し、モデルの重みも削除します。

実際に、sleepモードに入ると以下のようなログが出力されます(レベル1の場合)。
一度 sleepモードに入っていると、二度目からは、非常に高速に sleepモードに入ることがわかります。

```log /It took [0-9\.]+ seconds/
# 1回目
(EngineCore_DP0 pid=87) INFO 10-19 19:38:37 [block_pool.py:378] Successfully reset prefix cache
(Worker pid=125) INFO 10-19 19:39:19 [cumem.py:228] CuMemAllocator: sleep freed 83.04 GiB memory in total, of which 75.16 GiB is backed up in CPU and the rest 7.88 GiB is discarded directly.
(Worker pid=125) INFO 10-19 19:39:20 [gpu_worker.py:117] Sleep mode freed 83.28 GiB memory, 5.82 GiB memory is still in use.
(EngineCore_DP0 pid=87) INFO 10-19 19:39:20 [executor_base.py:189] It took 43.489556 seconds to fall asleep.

# 2回目
(APIServer pid=1) INFO 10-19 19:48:31 [api_server.py:1024] check whether the engine is sleeping
(EngineCore_DP0 pid=87) INFO 10-19 19:48:59 [block_pool.py:378] Successfully reset prefix cache
(Worker pid=125) INFO 10-19 19:49:03 [cumem.py:228] CuMemAllocator: sleep freed 83.04 GiB memory in total, of which 75.16 GiB is backed up in CPU and the rest 7.88 GiB is discarded directly.
(Worker pid=125) INFO 10-19 19:49:06 [gpu_worker.py:117] Sleep mode freed 83.04 GiB memory, 5.82 GiB memory is still in use.
(EngineCore_DP0 pid=87) INFO 10-19 19:49:06 [executor_base.py:189] It took 6.523925 seconds to fall asleep.
```

sleepモード前後のメモリ使用量の変化は以下のようになります。sleepモード中でも、GPUメモリ使用量が0にはならないことに注意してください。

```log /[0-9]+MiB/
# GPUメモリ Before Sleep
|    0   N/A  N/A         1979459      C   VLLM::Worker                          87496MiB |

# GPUメモリ After Sleep Level 1
|    0   N/A  N/A         1979459      C   VLLM::Worker                           2066MiB |

# CPUメモリ Before Sleep
               total        used        free      shared  buff/cache   available
Mem:             125          26           2           0          97          99

# CPUメモリ After Sleep Level 1
               total        used        free      shared  buff/cache   available
Mem:             125         102          11          77          90          22
```


sleepモード中に、チャットリクエストを投げてしまうと、以下のエラーが発生し、vLLMが停止してしまいます。。

```json
{
  "error": {
    "message": "EngineCore encountered an issue. See stack trace (above) for the root cause.",
    "type": "Internal Server Error",
    "param": null,
    "code": 500
  }
}
```


## Wake Up

インスタンスをアクティブにしたいときは、 `/wake_up` エンドポイントにリクエストを投げます。

```bash
curl -X POST localhost:8000/wake_up
```

実際に、wake upすると以下のようなログが出力されます。とても高速に復帰することがわかります。

```log /It took [0-9\.]+ seconds/
(APIServer pid=1) INFO 10-19 19:45:09 [api_server.py:1024] check whether the engine is sleeping
(APIServer pid=1) INFO 10-19 19:45:40 [api_server.py:1016] wake up the engine with tags: None
(EngineCore_DP0 pid=87) INFO 10-19 19:45:42 [executor_base.py:205] It took 1.544127 seconds to wake up tags {'kv_cache', 'weights'}.
```


## References

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Pro-tip for vLLM power-users: free ≈ 90 % of your GPU VRAM in seconds—no restarts required🚀<br><br>🚩 Why you’ll want this<br>• Hot-swap new checkpoints on the same card<br>• Rotate multiple LLMs on one GPU (batch jobs, micro-services, A/B tests)<br>• Stage-based pipelines that call… <a href="https://t.co/WAzdiZWL6u">pic.twitter.com/WAzdiZWL6u</a></p>&mdash; EmbeddedLLM (@EmbeddedLLM) <a href="https://twitter.com/EmbeddedLLM/status/1942556855324270610?ref_src=twsrc%5Etfw">July 8, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

