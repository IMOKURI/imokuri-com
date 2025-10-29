---
title: vLLM Options
slug: vllm-options
updated: 2025-10-23
description: "私がよく使うvLLMのオプション設定をまとめました。"
---

## Contents

## Overview

vLLMは高性能なLLM推論エンジンで、多くのオプションを提供しています。以下に、私がよく使うオプション設定をまとめたいと思います。

vLLMのマニュアルは[こちら](https://docs.vllm.ai/en/stable/cli/serve.html)にあるので、詳細はそちらも参照してください。

私はMakefileをタスクランナーとして使用しているため、以下の例ではMakefileの形式で記載していますが、ご了承ください。


## 基本的なオプション

私はvLLMをdockerで起動しており、以下のコマンドがベースになります。

```make title="Makefile"
VLLM_IMAGE_NAME = vllm/vllm-openai
VLLM_IMAGE_TAG = v0.11.0

up-vllm: ## Start vllm.
	docker run -d --name vllm -p 8000:8000 \
		--restart always \
		--shm-size=16g \
		--gpus '"device=0"' \
		-v $(XDG_CACHE_HOME):/root/.cache \
		-e HUGGING_FACE_HUB_TOKEN \
		-e VLLM_DO_NOT_TRACK=1 \
		$(VLLM_IMAGE_NAME):$(VLLM_IMAGE_TAG) \
		--model RedHatAI/gemma-3-27b-it-FP8-dynamic \
		--served-model-name google/gemma-3-27b-it \
		--gpu-memory-utilization 0.9 \
		--disable-uvicorn-access-log \
		--host 0.0.0.0 --port 8000
```


## Distribution

```make
		--tensor-parallel-size 2 \
```


## Quantization

```make
		--quantization fp8 \
```

## Request Size, Rate

```make
		--max-model-len 32768 \
		--max-num-batched-tokens 4096 \
		--max-num-seqs 64 \
```


## Performance Tuning

```make
		--async-scheduling \
```


## Function Calling


```make
		--enable-auto-tool-choice \
		--tool-call-parser pythonic \
		--chat-template <path to chat template file> \
```


## Multimodal

```make
		--trust-remote-code \
		--limit-mm-per-prompt.audio 3 \
```


## LoRA

```make
		--enable-lora \
		--max-lora-rank 320 \
		--max-loras 1 \
		--lora-modules <path to lora module> \
```


## Offline Mode

```make
		-e HF_HUB_OFFLINE=1 \
		-e TRANSFORMERS_OFFLINE=1 \
```


## Developer Mode

```make
		-e VLLM_SERVER_DEV_MODE=1 \
```

### Sleep Option

```make
		--enable-sleep-mode \
```
