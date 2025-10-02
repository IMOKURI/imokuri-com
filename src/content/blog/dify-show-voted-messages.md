---
title: Dify で いいね がついたメッセージを確認する方法
slug: dify-show-voted-messages
date: 2025-10-02
updated:
tags:
    - AI Agent
    - LLM
description: "Difyで「いいね」や「よくないね」がついたメッセージを確認する方法です。"
---

Dify ではチャットアプリの応答に対して、いいね👍 やよくないね👎 をつけることができます。

最近リリースされた、v1.8.1 ではよくないね に対して、メッセージを入れられるようになっています。

ただ、これらのフィードバックをWeb UIから確認する方法は、現時点(v1.9.1リリース時点)では、まだありません。
(Issueはあがっているので、近い将来実装される可能性も高いです。)

ただ、それを待てなかったので、確認方法を確認しました。

ここでは、Difyのコミュニティ版を docker compose で起動した環境(v1.9.1)で確認しています。


### postgres のコンテナにアクセス

```bash
docker exec -it docker-db-1 psql -U postgres -d dify
```


### アプリケーションのIDを確認

```sql
select id,name from apps;
                  id                  |     name
--------------------------------------+---------------
 5253591a-41e6-4d41-8e0a-44ef81209e90 | demo workflow
 daa22851-5382-40d2-85e6-058928f4674f | demo chat
(2 rows)
```


### フィードバックがついた会話IDを確認

```sql
select app_id,conversation_id,rating,content from message_feedbacks;
                app_id                |           conversation_id            | rating  |   content
--------------------------------------+--------------------------------------+---------+--------------
 daa22851-5382-40d2-85e6-058928f4674f | 555c718e-afd8-48e5-9c00-7f16e3fea4eb | like    |
 daa22851-5382-40d2-85e6-058928f4674f | 7ce98c8b-5fae-47df-a85d-040664320934 | dislike | もっと簡単に
(2 rows)
```


### 会話の内容を確認

```sql
select query,answer from messages where app_id = 'daa22851-5382-40d2-85e6-058928f4674f' and conversation_id = '555c718e-afd8-48e5-9c00-7f16e3fea4eb';
             query              |                 answer
--------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 F1の見どころを教えてください。 | <think>                                                                                                                                                                                                                                                                                            +
                                | The user asks in Japanese: "F1の見どころを教えてください。" Means "Tell me the highlights of F1." Provide information about Formula 1 highlights: races, drivers, strategies, technology, fan experience, schedule, etc. Should respond in Japanese. No policy issues. Provide thorough answer.    +
                                | </think>## F1（フォーミュラ 1）の見どころまとめ                                                                                                                                                                                                                                                    +
                                |                                                                                                                                                                                                                                                                                                    +
                                | ### 1. 圧倒的なスピードとテクノロジー                                                                                                                                                                                                                                                              +
                                | - **最高時速 350 km/h 超**                                                                                                                                                                                                                                                                         +
                                |   現代のF1マシンは、空力・エンジン・ハイブリッドシステムが高度に融合した最先端のレースマシンです。特に直線での加速感は、他のモータースポーツと比べても圧倒的です。                                                                                                                                 +
                                | - **空力革命**                                                                                                                                                                                                                                                                                     +
                                |   ディフューザーやウィング、フロント・リアステアリングプレートなど、空力要素がレース展開を左右します。コーナーでのダウンフォースと直線でのドラッグのバランスが見どころです。                                                                                                                       +
                                |                                                                                                                                                                                                                                                                                                    +

(中略)

(1 row)

```
