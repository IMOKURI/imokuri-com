---
title: Dify をGoogle Cloudで長く動かす
slug: dify-on-google-cloud
date: 2026-02-09
updated:
tags:
  - AI Agent
  - Dify
  - LLM
  - Cloud
  - Google Cloud
description: "DifyをGoogle Cloudにデプロイし、長く運用することを考えます。"
---

## Contents

## Overview

[Dify](https://github.com/langgenius/dify)はGitHubでコミュニティ版が公開されており、Docker Composeでデプロイすることができます。

Docker Composeでデプロイする場合、ローカルマシンやVPSなどで動かすことが多いですが、Google Cloud上で動かすことを考えたいと思います。とくにCloudの特徴であるマネージドサービスを活用して、長く安定してDifyを運用することを目指します。

また、Difyはアップグレードが盛んで、頻繁に新しいバージョンがリリースされます。Google Cloud上でDifyを運用する場合、アップグレードの手間を減らすことも重要です。そのため、できるだけコミュニティ版のDifyからソースコードの変更を行わずにデプロイすることを目指します。
そのため、コンテナのマネージドサービスは利用せず、コミュニティ版のDocker Composeを利用します。

この考えを念頭にTerraformのコードを作成しました。

[![IMOKURI/dify-on-google-cloud - GitHub](https://gh-card.dev/repos/IMOKURI/dify-on-google-cloud.svg)](https://github.com/IMOKURI/dify-on-google-cloud)

## Components

### データベース

データベースはGoogle CloudのマネージドサービスであるCloud SQLを利用します。DifyはPostgreSQLをサポートしているため、Cloud SQL for PostgreSQLを利用します。

合わせて、ベクトルデータベースとしてもCloud SQLのpgvectorを利用します。

### ファイルストレージ

Difyはアップロードされたファイルをストレージに保存します。デフォルトでは、ローカルストレージとなっていますが、ローカルストレージを利用すると、VM削除時にデータがロストしてしまいます。

選択肢としては、Google Cloud Storageのようなオブジェクトデータベースか、FilestoreのようなNFSファイルストレージを利用することになります。
Difyとしては、オブジェクトストレージをサポートしていますが、検証したところ、plugin daemonなどで、エラーが発生したり、アップグレード時に正常動作しなくなったりなどしたので、
今回はFilestoreを永続が必要なフォルダにマウントすることにしました。

### 仮想マシン

メインのDifyのコンテナ群は、VM上にDocker Composeでデプロイします。VMはGoogle Compute Engineのマネージドインスタンスグループを利用します。マネージドインスタンスグループを利用することで、VMの自動再起動が可能になります。

VMの台数についてですが、[plugin daemonは複数台での動作がサポートされていないため](https://github.com/langgenius/dify-plugin-daemon/blob/23a4662e65a2bdeb7e7731a9081e6ba545f9838a/README.md?plain=1#L77)、今回は1台構成としました。
将来的にplugin daemonが複数台での動作をサポートするようになれば、インスタンスグループの台数を増やすことを考えたいと思います。

### ロードバランサー

DifyへTSLアクセスをするため、前段にロードバランサーを配置します。Google Cloudのマネージドロードバランサーを利用します。TLS証明書は、Google Managed Certificateか、独自のTLS証明書を利用します。

## Upgrade Strategy

Difyをアップグレードする際は、まず新しいバージョンの環境変数ファイル `.env.example` を確認し、現在のバージョンとの差分を確認します。必要があれば、`startup-script.sh` 内の環境変数を更新します。

そして、`terraform.tfvars` の`dify_version`の値を変更し、`terraform apply`を実行します。

すると、既存のVMがまず削除され、新しいバージョンのDifyをデプロイするための新しいVMが作成されます。
コミュニティ版のDifyは起動時に、必要があれば、データベースのマイグレーションを自動で行うため、新旧バージョン混在することは不整合を招く可能性があります。

そのため、アップグレード時はダウンタイムが発生します。

> [!note]
> Dify のアップグレード時には、リリースノートのマイグレーションガイドを参照し、追加で必要な手順がないかよく確認をしてください。

## Project Status

ひとまず、基本的な動作確認ができたかなと思います。(まだ長く動かしたわけではない(おい))

## Conclusion

DifyをGoogle Cloud上で長く運用するための基本的な構成を検討しました。
今後もDifyのアップデートに合わせて、構成の改善や新しい機能の追加を検討していきたいと思います。
