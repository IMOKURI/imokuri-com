---
title: Dify 1.14.0 での model_type の変更
slug: dify-model-type-change
date: 2026-07-06
updated:
tags:
  - Dify
description: "マイグレーションのときに発生したバグのお話です。"
---

## Contents

## Overview

Dify 1.14.0 へのアップグレード後、設定済みのモデルの認証情報が確認できなくなる・削除できなくなるという問題が発生しました。
原因はデータベースの `model_type` カラムの値の変更と、それに対応するマイグレーションスクリプトの漏れでした。

## model_type の変更

[PR #34300](https://github.com/langgenius/dify/pull/34300) により、Dify 1.14.0 では `model_type` カラムが `String` 型から `EnumText` 型に変更されました。
これに合わせて、格納する値も以下のように変更されました。

| 旧値              | 新値             |
| ----------------- | ---------------- |
| `text-generation` | `llm`            |
| `embeddings`      | `text-embedding` |
| `reranking`       | `rerank`         |

しかし、既存のデータベースに格納されている旧値を新値に変換するマイグレーションスクリプトが漏れていました。
([PR #36520](https://github.com/langgenius/dify/pull/36520) で後から追加されました。)

## 発生した問題

以前のバージョンから 1.14.0 以降にアップグレードした場合、データベースには旧値 (`text-generation`, `embeddings`, `reranking`) が残ったままになります。
アプリケーション側は新値 (`llm`, `text-embedding`, `rerank`) を期待しているため、値の不一致が生じ、以下のような問題が発生しました。
([Issue #36129](https://github.com/langgenius/dify/issues/36129))

- モデルの認証情報が「credentials unavailable」となり確認・編集できない
- モデルを削除しようとしても「Action succeed」と表示されるが実際には削除されない

なお、既存の設定でのモデル呼び出し自体は正常に動作していたため、問題に気づきにくいケースもありました。

## 対処方法

マイグレーションスクリプトが追加された Dify バージョンにアップグレードするまでの暫定対処として、データベースのテーブルを手動で更新する必要があります。
([Issue #36129 コメント](https://github.com/langgenius/dify/issues/36129#issuecomment-4474982238))

以下の SQL を PostgreSQL データベースに対して実行します。

```sql
UPDATE provider_models SET model_type = 'rerank' WHERE model_type = 'reranking';
UPDATE provider_models SET model_type = 'text-embedding' WHERE model_type = 'embeddings';
UPDATE provider_models SET model_type = 'llm' WHERE model_type = 'text-generation';

UPDATE provider_model_credentials SET model_type = 'rerank' WHERE model_type = 'reranking';
UPDATE provider_model_credentials SET model_type = 'text-embedding' WHERE model_type = 'embeddings';
UPDATE provider_model_credentials SET model_type = 'llm' WHERE model_type = 'text-generation';

UPDATE tenant_default_models SET model_type = 'rerank' WHERE model_type = 'reranking';
UPDATE tenant_default_models SET model_type = 'text-embedding' WHERE model_type = 'embeddings';
UPDATE tenant_default_models SET model_type = 'llm' WHERE model_type = 'text-generation';

UPDATE provider_model_settings SET model_type = 'rerank' WHERE model_type = 'reranking';
UPDATE provider_model_settings SET model_type = 'text-embedding' WHERE model_type = 'embeddings';
UPDATE provider_model_settings SET model_type = 'llm' WHERE model_type = 'text-generation';

UPDATE load_balancing_model_configs SET model_type = 'rerank' WHERE model_type = 'reranking';
UPDATE load_balancing_model_configs SET model_type = 'text-embedding' WHERE model_type = 'embeddings';
UPDATE load_balancing_model_configs SET model_type = 'llm' WHERE model_type = 'text-generation';
```

なお、`tenant_default_models` の更新時にユニーク制約違反が発生する場合があります。
その場合は、重複している旧値のレコードを先に削除してから、上記の UPDATE を実行してください。

```sql
-- 例: 特定のテナントで重複が発生している場合
DELETE FROM tenant_default_models
WHERE tenant_id = '<tenant_id>' AND model_type IN ('text-generation', 'embeddings', 'reranking');
```

### provider_model_settings の重複レコードへの対処

上記のワークアラウンドを適用する前に、UI からモデルの有効化・無効化を切り替えていた場合、追加の問題が発生することがあります。

有効化・無効化の切り替え操作を行うと、`provider_model_settings` テーブルに新値 (`llm` など) を持つレコードが新規作成されます。
一方、旧値 (`text-generation` など) を持つレコードはそのまま残るため、同一モデルのレコードが 2 行存在する状態になります。
この状態でワークアラウンドの UPDATE を実行すると、旧値レコードが新値に更新されて 2 行とも同じキーを持つことになり、その後の有効化・無効化の切り替えが正常に動作しなくなります。

まず、重複しているレコードがないか確認します。

```sql
SELECT tenant_id, provider_name, model_name, model_type, COUNT(*)
FROM provider_model_settings
GROUP BY tenant_id, provider_name, model_name, model_type
HAVING COUNT(*) > 1;
```

重複レコードが存在する場合は、古い方のレコード (旧値を持つレコード) を削除してから、上記のワークアラウンドの UPDATE を実行してください。

```sql
-- 旧値を持つ重複レコードを削除する
DELETE FROM provider_model_settings
WHERE model_type IN ('text-generation', 'embeddings', 'reranking')
  AND (tenant_id, provider_name, model_name, model_type) IN (
    SELECT tenant_id, provider_name, model_name,
           CASE model_type
             WHEN 'text-generation' THEN 'llm'
             WHEN 'embeddings'      THEN 'text-embedding'
             WHEN 'reranking'       THEN 'rerank'
           END
    FROM provider_model_settings
    WHERE model_type IN ('llm', 'text-embedding', 'rerank')
  );
```

SQL の実行前にはバックアップを取ることを強くお勧めします。
