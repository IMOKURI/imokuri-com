---
title: Difyのsandboxにライブラリを追加する方法
slug: dify-add-library-to-sandbox
date: 2026-02-10
updated:
tags:
  - AI Agent
  - Dify
  - LLM
description: "Difyのsandboxにライブラリを追加する方法です。"
---

## Contents

## Overview

Difyのsandboxは、DifyのAIエージェントがコードを実行するための安全な環境です。

追加でライブラリをインストールしたい場合、sandbox起動時に[設定ファイルにライブラリ名を記載しておく](https://github.com/langgenius/dify-sandbox/blob/0.2.12/dependencies/python-requirements.txt)必要があります。

一方で、デフォルトでは、実行できるシステムコールが[ホワイトリスト形式で制限されています](https://github.com/langgenius/dify-sandbox/blob/2d0ad28fcfa7e3958311c8622d2e0c7b939feb24/FAQ.md?plain=1#L51)。

[設定ファイルに許可したいシステムコールを追加する](https://github.com/langgenius/dify-sandbox/blob/2d0ad28fcfa7e3958311c8622d2e0c7b939feb24/conf/config.yaml#L11)ことで、この制限を緩和することができます。

そこで、[以下の方法](https://github.com/langgenius/dify-sandbox/blob/0.2.12/cmd/test/syscall_dig/README.md)で、インストールしたいライブラリで利用しているシステムコールを特定し、希望するライブラリを使えるようにしたいと思います。

## Preparation

Dockerを使って、dify-sandboxのコンテナを起動します。（Difyのアプリケーションとしてではなく、単独で起動します。）

```bash
docker run --rm -it --entrypoint bash langgenius/dify-sandbox:0.2.12
```

検証に必要なパッケージをインストールします。

```bash
apt update
apt install -y golang git sudo vim auditd

pip install -U pip setuptools
```

テストコードを入手し、追加で必要なパッケージをインストールします。

```bash
cd /tmp
git clone https://github.com/langgenius/dify-sandbox
cd dify-sandbox

./install.sh
```

## Add library to test code

以下のファイルに、sandboxに追加したいライブラリをインポートするコードを追加します。

```python title="cmd/test/syscall_dig/test.py"
import numpy

# 省略
# 既存のコードは変更しません。
```

プログラムが動作するように、OSにもパッケージをインストールします。

```bash
pip install numpy
```

## Run test

以下のコマンドで、テストコードを実行します。

```bash
go run cmd/test/syscall_dig/main.go
```

すると以下のようなエラー出力が発生し、最後に必要なシステムコールの一覧が表示されます。

```
failed with signal: bad system call
failed with signal: bad system call (core dumped)
...

...
failed with signal: bad system call
Following syscalls are required: 0,1,3,5,8,9,10,11,13,14,15,16,28,35,39,60,75,105,106,125,195,202,210,217,231,233,234,251,256,257,262,268,280,281,296,300,308,321,325,334,340,342,348,350,355,356,363,378,386,408,417,418,425,434,438,445,453,465,467,471,482,483,488,490,491,492,494,497
```

もし、セキュリティの懸念がなければ、以下のコマンドで利用可能なすべてのシステムコールが出力されます。これらを許可することもできます。

> [!note]
> ドキュメント上は必要なシステムコールのみに絞ることが望ましいとされていますが、テストしてみたところ、うまくライブラリが利用できなかったため、結果として、すべてのシステムコールを許可するのがスムーズかもしれません。。

```bash
ausyscall --dump
```

## Update config file

上記のシステムコールを、sandboxの設定ファイルに追加します。
Docker composeを使ってDifyを起動している場合、 [`docker/volumes/sandbox/conf/config.yaml`](https://github.com/langgenius/dify/blob/cd03e0a9ef7f2383853ace444e3aefe4fac05cde/docker/volumes/sandbox/conf/config.yaml#L10) に設定ファイルがあります。

```yaml title="conf/config.yaml"
allowed_syscalls:
  - 0
  - 1
  ...
```

## Add library to requirements file

追加したいライブラリを、`docker/volumes/sandbox/dependencies/python-requirements.txt` に追加します。

```txt title="dependencies/python-requirements.txt"
numpy
```

## Start Dify

更新したら、Difyを起動し、コードブロックで追加したライブラリが利用できるか確認します。
