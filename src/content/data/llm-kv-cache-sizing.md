---
title: LLM KV Cache Sizing
slug: llm-kv-cache-sizing
updated: 2025-07-02
description: "私がよく使うモデルのKV Cacheのサイズを試算しました。"
---

## Contents

## Overview

[この記事](/blog/2025/05/llm-kv-cache-size/)に従って、LLMのKV Cacheのサイズを試算しました。
あくまで机上の計算なので、実際のサイズとは異なる場合があります。


### google/gemma-3-12b-it

| 記号                | 値               |
|---------------------|------------------|
| 2                   | 2                |
| B                   | 1 (とする)       |
| bytes/param         | 2 (16 bit)       |
| num_hidden_layers   | 48               |
| num_key_value_heads | 8                |
| head_size           | 3840 // 16 = 240 |
| context_length      | 8k (とする)      |
| KV Cache サイズ     | 2.8GB            |

[google/gemma-3-12b-it (config.json)](https://huggingface.co/google/gemma-3-12b-it/blob/main/config.json)


### google/gemma-3-27b-it

| 記号                | 値               |
|---------------------|------------------|
| 2                   | 2                |
| B                   | 1 (とする)       |
| bytes/param         | 2 (16 bit)       |
| num_hidden_layers   | 62               |
| num_key_value_heads | 16               |
| head_size           | 5376 // 32 = 168 |
| context_length      | 8k (とする)      |
| KV Cache サイズ     | 5.1GB            |

[google/gemma-3-27b-it (config.json)](https://huggingface.co/google/gemma-3-27b-it/blob/main/config.json)


### Qwen/Qwen3-32B

| 記号                | 値              |
|---------------------|-----------------|
| 2                   | 2               |
| B                   | 1 (とする)      |
| bytes/param         | 2 (16 bit)      |
| num_hidden_layers   | 64              |
| num_key_value_heads | 8               |
| head_size           | 5120 // 64 = 80 |
| context_length      | 8k (とする)     |
| KV Cache サイズ     | 1.25GB          |

[Qwen/Qwen3-32B (config.json)](https://huggingface.co/Qwen/Qwen3-32B/blob/main/config.json)
