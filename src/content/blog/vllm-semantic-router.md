---
title: vLLM Semantic Router
slug: vllm-semantic-router
date: 2026-01-13
updated:
tags:
    - LLM
    - Deep Learning
cover_image: /blog/iris-0.png
description: "vLLMのSemantic Routerがはじまりました"
---

## Contents

## Overview

先日 vLLM の Semantic Router の v0.1 が公開されました。公式ブログでは、Production Ready として紹介されています。

[vLLM Semantic Router v0.1 Iris: The First Major Release](https://blog.vllm.ai/2026/01/05/vllm-sr-iris.html)

Semantic Router は、LLM を活用したルーティング技術であり、ユーザーのリクエストを意味的に理解し、最適なモデルやエージェントに振り分けることを目指したソリューションです。

```
User Query → Signal Extraction → Decision Engine → Best Model → Response
```

v0.1 では、以下などのシグナルをユーザーのクエリから抽出し、適切なモデル、エージェントにルーティングします。

- Keyword
- Embedding
- Domain
- Fact Check
- User Feedback

[https://vllm-semantic-router.com/docs/v0.1/overview/semantic-router-overview](https://vllm-semantic-router.com/docs/v0.1/overview/semantic-router-overview)

これらのシグナルを抽出するモデルとして以下などのモデルが[公開されています](https://huggingface.co/llm-semantic-router)。

1. Classification Models
    - Domain/Intent Classifier
    - PII Detector
    - Jailbreak Detector
    - Feedback Detector
2. Embedding Models
    - Embedding Pro (High Quality)
    - Embedding Flash (Balanced)
    - Embedding Light (Fast)
3. Hallucination Detection Models
    - Halugate Sentinel: 事実検証が必要なクエリを判定する二値分類（創作文章やコードは事実確認不要）
    - Halugate Detector: 提供された文脈で裏付けられない応答内のトークンを特定するトークンレベル検出
    - Halugate Explainer: フラグが立てられた各スパンが問題となる理由を説明するNLIベースの分類（矛盾 vs 中立）

[What is MoM Model Family?](https://vllm-semantic-router.com/docs/v0.1/overview/mom-model-family)

## Conclusion

最近では用途に応じたLLMなどのモデルを使い分けることがより良いアウトプットにつながると考えられ、それを自動化する技術としてSemantic Routerの技術は注目されてると思います。

Dynamo などの分散型LLM推論エンジンとの組み合わせも想定されており、大規模環境での利用が期待されます。

一方で、シグナル検出の設定やモデルは、基本的に英語での利用が想定されているように見られ、日本語での能力は、要確認と思います。今後、マルチリンガルに対応したモデルが出てくることを期待したいです。
