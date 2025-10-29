---
title: vLLM Client Options
slug: vllm-client
updated: 2025-10-27
description: "vLLMへcurlでリクエストを送る際のオプション設定をまとめました。"
---

## Contents

## Overview

vLLMをOpenAI互換APIとして使用している場合、curlでリクエストを送ることができます。以下に、私がよく使うオプション設定をまとめたいと思います。

## モデル一覧

```bash
	curl --request GET \
		--header "Content-Type: application/json" \
		--header "Authorization: Bearer no-key" \
		--url http://localhost:8000/v1/models | jq .
```

## テキストチャット

```bash
	curl --request POST \
		--header "Content-Type: application/json" \
		--header "Authorization: Bearer no-key" \
		--url http://localhost:8000/v1/chat/completions \
		--data @./prompt.json | jq .
```

ここで、 `prompt.json` は以下のような内容です。

```json
{
  "model": "Qwen/Qwen3-Next-80B-A3B-Instruct",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "東京の観光名所を教えてください。"
    }
  ]
}
```

## Speech to Text トランスクリプション

```bash
	curl --request POST \
		--header "Content-Type: multipart/form-data" \
		--header "Authorization: Bearer no-key" \
		--form "file=@./sample-sound-ja.wav" \
		--form "model=openai/whisper-large-v3" \
		--form "language=ja" \
		--url http://localhost:8000/v1/audio/transcriptions \
		| jq .
```

## Speech to Text マルチモーダル

```bash
	curl --request POST \
		--header "Content-Type: application/json" \
		--header "Authorization: Bearer no-key" \
		--url http://localhost:8000/v1/chat/completions \
		--data @./prompt.json | jq .
```

ここで、 `prompt.json` は以下のような内容です。

```json
{
  "model": "microsoft/Phi-4-multimodal-instruct-speech",
  "max_completion_tokens": 4096,
  "temperature": 0,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Transcribe the audio clip into text in Japanese."
        },
        {
          "type": "audio_url",
          "audio_url": { "url": "http://<URL>/sample-sound-ja.wav" }
        }
      ]
    }
  ]
}
```
