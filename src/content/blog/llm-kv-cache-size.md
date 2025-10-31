---
title: LLM KV Cache Size と同時処理数
slug: llm-kv-cache-size
date: 2025-05-13
updated: 2025-07-02
tags:
  - LLM
  - Deep Learning
description: "LLM推論時のKV Cacheのサイズと同時処理数を試算する方法です。"
---

## Contents

## LLM 推論の流れ

- 入力文字列をトークンに分割し、数値化します。
- トークンをモデルに入力し、最初の出力トークンを生成します。 (Prefill Phase)
- 出力トークンをモデルに入力し、次の出力トークンを生成します。この処理を繰り返します。 (Decoding Phase)
- 出力トークンをデコードし、文字列に変換します。

## KV Cache とは

KV Cacheは、LLMの推論(Decoding Phase)時に使用されるメモリ領域で、過去のトークンのキーとバリューを保存します。
これにより、モデルは過去のトークンを再計算することなく、新しいトークンを生成できます。

## LLM 推論のベンチマーク指標

- Time to First Token (TTFT): 最初のトークンが生成されるまでの時間
- Time per Output Token (TPOT): 各トークンが生成されるまでの時間

長い入力はTTFTが長くなり、長い出力はTPOTの合計が長くなります。

## KV Cache の枯渇

LLMへの同時リクエスト数を増やしていくと、レイテンシーがガクッと落ちるポイントがあります。
これは、KV Cacheのサイズが限界に達し、処置待ちが発生するためです。

## KV Cache サイズの試算

**KV Cache サイズ(bytes) = 2 × B × bytes/param × num_hidden_layers × num_key_value_heads × head_size x context_length**

| 記号                | 意味                       |
| ------------------- | -------------------------- |
| 2                   | key と value で 2          |
| B                   | バッチサイズ               |
| bytes/param         | KV Cache のデータ型        |
| num_hidden_layers   | レイヤー数                 |
| num_key_value_heads | KV Attention Head 数       |
| head_size           | Attention Head サイズ(\*1) |
| context_length      | 入力トークン長 (\*2)       |

(*1): hidden_size // num_attention_heads  
(*2): Chunked Prefill を使う場合は、1チャンクの長さで計算します。

たとえば Qwen 2.5 32B の場合は、以下のように計算できます。

| 記号                | 値                |
| ------------------- | ----------------- |
| 2                   | 2                 |
| B                   | 1 (とする)        |
| bytes/param         | 2 (16 bit) (\*3)  |
| num_hidden_layers   | 64                |
| num_key_value_heads | 8                 |
| head_size           | 5120 // 40 = 128  |
| context_length      | 8k (とする) (\*4) |
| KV Cache サイズ     | 2GB               |

(*3): KV Cache は量子化すると精度がガクッと落ちる印象があります。  
(*4): Chunked Prefill で 8k に分けて処理するものとします。

- [Qwen2.5-32B-Instruct (config.json)](https://huggingface.co/Qwen/Qwen2.5-32B-Instruct/blob/main/config.json)

## 複数GPU使う場合の考慮

- Pipeline Parallell を使う場合は、 num_hidden_layers を GPU 数で割って計算します。
- Tensor Parallell を使う場合は、 num_attention_heads を GPU 数で割って計算します。

## 同時処理数の試算

GPUメモリは以下の用途で使われます。

1. モデルのパラメータのロード。モデルパラメータ数 x データ型 (Model Weight) / GPU数
1. PyTorch に無関係なオーバーヘッド。GPU型番やGPU数に依存するが、1~2GB程度。 (Non-Torch Memory)
1. 推論実行時の途中計算結果の保存用。モデルアーキテクチャに依存する。数GB程度。 (PyTorch Acitivation Peak Memory)
1. KV Cache。

LLM が利用可能なGPUメモリ量から 1. ~ 3. を引いて、 KV Cache サイズで割ることで、同時処理数を試算できます。

## おまけ

[私がよく使うLLMのKV Cache サイズを試算してみました。](/activity/data/llm-kv-cache-sizing)

## 参考文献

- [LLM Inference Series: 2. The two-phase process behind LLMs’ responses](https://medium.com/@plienhar/llm-inference-series-2-the-two-phase-process-behind-llms-responses-1ff1ff021cd5)
- [Benchmark and optimize endpoint deployment in Amazon SageMaker JumpStart](https://aws.amazon.com/blogs/machine-learning/benchmark-and-optimize-endpoint-deployment-in-amazon-sagemaker-jumpstart/)
- [Mastering LLM Techniques: Inference Optimization](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/)
- [LLMの効率化を支えるアルゴリズム](https://speakerdeck.com/taturabe/llmnoxiao-lu-hua-wozhi-eruarugorizumu)
- [How Much GPU Memory Do You Really Need for Efficient LLM Serving?](https://medium.com/@kimdoil1211/how-much-gpu-memory-do-you-really-need-for-efficient-llm-serving-4d26d5b8b95b)
- [LLM Inference Economics from First Principles](https://www.tensoreconomics.com/p/llm-inference-economics-from-first)
