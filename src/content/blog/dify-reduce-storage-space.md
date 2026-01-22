---
title: Dify でストレージスペースを削減する方法
slug: dify-reduce-storage-space
date: 2026-01-22
updated:
tags:
  - AI Agent
  - LLM
description: "Difyで一時ファイルなどの不要なデータを削除してストレージスペースを削減する方法です。"
---

## Contents

## Overview

Dify のアプリケーションにアップロードしたファイルなどのデータは、時間が経つとストレージスペースを圧迫することがあります。
これらのファイルを削除して、ストレージスペースを削減する方法を紹介します。

## 手動でのデータクリーンアップ

Dify では、管理者が手動で不要なデータを削除するためのコマンドが用意されています。

### テナントIDの確認

```bash
docker exec -it docker-api-1 bash -c "echo 'from models import Tenant; db.session.query(Tenant.id, Tenant.name).all(); quit()' | flask shell"
```

### 古いログの削除

```bash
docker exec -it docker-api-1 flask clear-free-plan-tenant-expired-logs \
  --days 30 \
  --batch 100 \
  --tenant_ids <tenant id>
```

### 参照されていないファイルのレコードの削除

注意書きが表示されるので、確認の上実行しましょう。

```bash
docker exec -it docker-api-1 flask clear-orphaned-file-records
```

### レコードに載っていないファイルの削除

```bash
docker exec -it docker-api-1 flask remove-orphaned-files-on-storage
```

## ハウスキープジョブの有効化

デフォルトではハウスキープジョブは無効化されています。
有効化するには、 `.env` ファイルで有効化する必要があります。

以下は、 dify v1.11.4 での設定例です。

```ini
WORKFLOW_LOG_CLEANUP_ENABLED=true

# Celery schedule tasks configuration
ENABLE_CLEAN_EMBEDDING_CACHE_TASK=true
ENABLE_CLEAN_UNUSED_DATASETS_TASK=true
ENABLE_CLEAN_MESSAGES=true
```

実際のハウスキープの処理内容は以下にソースコードがあります

- [処理内容](https://github.com/langgenius/dify/tree/1.11.4/api/schedule)
- [処理実行スケジュール](https://github.com/langgenius/dify/blob/1.11.4/api/extensions/ext_celery.py)

## Conclusion

Dify コミュニティ版では、長期間運用すると、ストレージスペースが肥大化してきますので、定期的に不要なデータを削除していきたいと思います。
デフォルトで、有効化しておいてくれてもいいのにな、と(個人的には)思います。 😎

## References

- [Dify - Data Cleanup](https://docs.dify.ai/en/self-host/troubleshooting/storage-and-migration#data-cleanup)
- [feat: add administrative commands to free up storage space by removing unused files](https://github.com/langgenius/dify/pull/18835)
