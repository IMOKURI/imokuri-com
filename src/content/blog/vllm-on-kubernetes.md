---
title: VLLM on Kubernetes
slug: vllm-on-kubernetes
date: 2025-06-24
updated: 2025-06-25
tags:
    - Deep Learning
    - Kubernetes
    - LLM
description: "vLLM を Kubernetes で使いたいときの選択肢について考えます。"
---

vLLM を Kubernetes で使いたいとき、production を意識して高スループットの選択肢について考えます。

私のほうで目をつけている選択肢は以下です。

- [AIBrix](https://aibrix.readthedocs.io/latest/#)
    - [Introducing AIBrix: A Scalable, Cost-Effective Control Plane for vLLM - Feb 21, 2025l](https://blog.vllm.ai/2025/02/21/aibrix-release.html)
- [vLLM Production Stack](https://docs.vllm.ai/projects/production-stack/en/latest/)
    - [High Performance and Easy Deployment of vLLM in K8S with “vLLM production-stack” - January 21, 2025](https://blog.lmcache.ai/2025-01-21-stack-release/)
- [llm-d](https://llm-d.ai/)
    - [Red Hat Launches the llm-d Community, Powering Distributed Gen AI Inference at Scale - May 20, 2025](https://llm-d.ai/blog/llm-d-press-release)
- [LeaderWorkerSet](lws.sigs.k8s.io)
- [NVIDIA Dynamo](https://docs.nvidia.com/dynamo/latest/)
    - [Introducing NVIDIA Dynamo, A Low-Latency Distributed Inference Framework for Scaling Reasoning AI Models - Mar 18, 2025](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)


それぞれいくつかの観点で比較してみます。(それぞれの情報は、執筆時点のものです。)

| 項目           | AIBrix    | Production Stack | llm-d           | LeaderWorkerSet | Dynamo   |
| ---            | ---       | ---              | ---             | ---             | ---      |
| 開発主体       | ByteDance | LMCache Lab      | Red Hat         | Kubernetes SIGs | NVIDIA   |
| GitHub Stars   | 3.8k      | 1.4k             | 1.2k            | 0.5k            | 4.3k     |
| 最新バージョン | 0.3.0     | 0.1.5            | 0.0.8           | 0.6.2           | 0.3.0    |
| デプロイ方法   | Manifest  | Helm             | Installer (.sh) | Helm            | Operator |


次は、性能に関する機能です。

| 項目                   | AIBrix | Production Stack | llm-d | LeaderWorkerSet | Dynamo |
| ---                    | ---    | ---              | ---   | ---             | ---    |
| Prefill/Decoding 分離  |        |                  |       |                 |        |
| KV Cache Offloading    |        |                  |       |                 |        |
| KV Cache Aware Routing |        |                  |       |                 |        |

(うんぬん)

次は、アーキテクチャです。

- AIBrix
  ![AIBrix Architecture](/blog/aibrix-architecture-v1.jpeg)
- vLLM Production Stack
  ![vLLM Production Stack Architecture](/blog/stack-overview-2.png)
- llm-d
  ![llm-d Architecture](/blog/llm-d-arch-simplified-d41875ab8b1fcf94a1a42df44940ceae.svg)
- LeaderWorkerSet
  ![LeaderWorkerSet Architecture](/blog/LeaderWorkerSet.png)
- Dynamo
  ![Dynamo Architecture](/blog/inference-nvidia-dynamo-architecture-diagram-r2-2048x1152.png)


どれも、まだ開発初期といったところでしょうか。ただ、kubernetes 上での高スループットの推論エンジンは実用性が高まっているので、今後も注目していきます。
