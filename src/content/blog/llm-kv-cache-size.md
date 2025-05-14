---
title: LLM KV Cache Size と同時処理数
slug: llm-kv-cache-size
date: 2025-05-13
updated: 2025-05-14
tags:
    - LLM
    - Deep Learning
description: "LLM推論時のKV Cacheのサイズと同時処理数を試算する方法です。"
---


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
- Inter Token Latency (ITL): 各トークンが生成されるまでの時間

長い入力はTTFTが長くなり、長い出力はITLの合計が長くなります。


## KV Cache の枯渇

LLMへの同時リクエスト数を増やしていくと、レイテンシーがガクッと落ちるポイントがあります。
これは、KV Cacheのサイズが限界に達し、KV Cacheの再計算が発生するためです。


## KV Cache サイズの試算

**KV<sub>size</sub>(bytes) = 2 × B × bytes/param × n<sub>layers</sub> × n<sub>kv_attention_heads</sub> × d<sub>attention_heads</sub> x context_length**

| 記号                           | 意味                  |
|--------------------------------|-----------------------|
| 2                              | key と value で 2     |
| B                              | バッチサイズ          |
| bytes/param                    | KV Cache のデータ型   |
| n<sub>layers</sub>             | レイヤー数            |
| n<sub>kv_attention_heads</sub> | KV Attention Head 数  |
| d<sub>attention_heads</sub>    | Attention Head サイズ |
| context_length                 | 入力トークン長        |


たとえば Qwen 2.5 32B の場合は、以下のように計算できます。

| 記号                           | 値               | 備考                                                 |
|--------------------------------|------------------|------------------------------------------------------|
| 2                              | 2                |                                                      |
| B                              | 1 (とする)       |                                                      |
| bytes/param                    | 2 (16 bit)       | KV Cache は量子化すると精度がガクッと落ちる          |
| n<sub>layers</sub>             | 64               | num_hidden_layers                                    |
| n<sub>kv_attention_heads</sub> | 8                | num_key_value_heads                                  |
| d<sub>attention_heads</sub>    | 5120 // 40 = 128 | hidden_size // num_attention_heads                   |
| context_length                 | 32k (とする)     | モデルは 128k をサポートしているがメモリ量削減のため |
| 合計                           | 8000MB (7.8GB)   |                                                      |


- [Qwen2.5 Technical Report](https://arxiv.org/pdf/2412.15115)
- [Qwen2.5-32B-Instruct (config.json)](https://huggingface.co/Qwen/Qwen2.5-32B-Instruct/blob/main/config.json)


## PyTorch Acitivation Peak Memory

推論実行時に前のレイヤーの出力を保存するために、GPUメモリを使用します。

**pytorch_activation_peak_memory = context_length * (batch_size=1) * (18 * hidden_size + 4 * intermediate_size)**

計算式の根拠は、「[How Much GPU Memory Do You Really Need for Efficient LLM Serving?](https://medium.com/@kimdoil1211/how-much-gpu-memory-do-you-really-need-for-efficient-llm-serving-4d26d5b8b95b)」を参照ください。


たとえば Qwen 2.5 32B の場合は、以下のように計算できます。

| 記号              | 値           | 途中計算     |
|-------------------|--------------|--------------|
| hidden_size       | 5120         | x 18 = 92160 |
| intermediate_size | 27648        | x 4 = 110592 |
| context_length    | 32k (とする) |              |
| 合計              | 6GB          |              |


## 同時処理数の試算

GPUメモリは以下の用途で使われます。

1. モデルのパラメータのロード。モデルパラメータ数 x データ型 (Model Weight)
1. PyTorch に無関係なオーバーヘッド。GPU型番やGPU数に依存するが、1GB程度。 (Non-Torch Memory)
1. 推論実行時の前のレイヤーの出力の保存用。16bitで保存。 (PyTorch Acitivation Peak Memory)
1. KV Cache。

LLM が利用可能なGPUメモリ量から 1. ~ 3. を引いて、 KV Cache サイズで割ることで、同時処理数を試算できます。

例えば、H100 96GB の場合は、以下のように計算できます。

1. 利用上限を 90% とします。
   - 96GB x 0.9 = 86.4GB
1. 必要な領域を減算します。
    - 86.4GB - 32GB (Model Weight) - 1GB (Non-Torch Memory) - 6GB (PyTorch Acitivation Peak Memory) = 47.4GB
1. KV Cache サイズで割ります。
    - 47.4GB / 7.8GB = 6.1

したがって、同時処理数は 6 となります。


## 参考文献

- [LLM Inference Series: 2. The two-phase process behind LLMs’ responses](https://medium.com/@plienhar/llm-inference-series-2-the-two-phase-process-behind-llms-responses-1ff1ff021cd5)
- [Benchmark and optimize endpoint deployment in Amazon SageMaker JumpStart](https://aws.amazon.com/blogs/machine-learning/benchmark-and-optimize-endpoint-deployment-in-amazon-sagemaker-jumpstart/)
- [Mastering LLM Techniques: Inference Optimization](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/)
- [LLMの効率化を支えるアルゴリズム](https://speakerdeck.com/taturabe/llmnoxiao-lu-hua-wozhi-eruarugorizumu)
