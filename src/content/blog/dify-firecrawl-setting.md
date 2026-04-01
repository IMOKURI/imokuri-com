---
title: Difyのデータソースfirecrawl設定のバグの対処
slug: dify-firecrawl-setting
date: 2026-04-01
updated:
tags:
  - Dify
  - Firecrawl
description: "Difyのデータソースfirecrawlの設定ができないことの対処"
---

## Contents

## Overview

Dify v1.13.3 でデータソース firecrawl を利用するとき、接続設定の画面が、なぜか Settings 画面の後ろに行ってしまい、設定できないバグ？の対処です。

![dify firecrawl setting bug](/blog/dify-firecrawl-setting-bug.gif)

設定画面は、おそらく以下のようになっているので、

![dify firecrawl setting](/blog/dify-firecrawl-setting.png)

- `[TAB]` を 2回押して、Base URL を入力
- そこから `[TAB]` を 1回押して、API Key を入力
- そこから `[TAB]` を 3回押して、 `[ENTER]` を押すと、設定ができます。

## Conclusion

Difyのレポジトリのissueには報告されていなさそうでしたが、些細なことなので、ワークアラウンドで対応してしまおうかな、、と。
