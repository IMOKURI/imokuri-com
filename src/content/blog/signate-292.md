---
title: SIGNATE Beginner限定コンペ 銀行の顧客ターゲティング
slug: signate-292
date: 2020-09-01
updated:
tags:
  - Compete
  - Machine Learning
  - Deep Learning
description: "SIGNATEのBeginner限定コンペでチャレンジしたことのまとめです。"
---

2020/8月にSIGNATEでBeginner限定コンペ「銀行の顧客ターゲティング」が開催されました。

このコンペでIntermediateへの昇格ラインを超えるためにトライしてみたことをまとめてみたいと思います。

私の結果としては、昇格ラインが 0.86 のときに始めて、 0.856 あたりで頑張ってた最中、
昇格ラインが 0.85 に引き下げられたことで、昇格を果たすという、
達成感が行方不明、状態だったのですが、ひとまず昇格できたので良しとしたいと思います。

昇格後もスコアアップを目指して継続し、結果として、 0.8623 で 2位となることができました。
初めて、本気で参加したコンペだったので、かなり嬉しい結果となりました。

以下では、今回うまく行ったものに、 🎉 を、今回うまく行かなかったものに、 💦 をつけていきます。
なぜうまく行ったのか、なぜうまく行かなかったのかはあまり掘り下げられていないので、
今後、考えていきたいです。

## 特徴量抽出

所感としてはもう少し、いい特徴量があったんじゃないかな、と感じていますが、
見つけることができませんでした。

- 🎉お試しで作ったモデルでFeature Importanceを見たところ、MonthとDayが割と高い位置にあったため、
  それらを結合して、1年のうちの何日目か、というパラメータを追加しました。
  データ内に、 2/30 や 6/31 など、実在しない日付があったのですが、翌月の日付と解釈しました。
- 💦featuretoolsを使って、四則演算をいくつかやってみた(全てはやってない)のですが、あまり効果が
  ありませんでした。もともと列同士の演算で、実用的な意味が見いだせていなかったので、スコアが上がる
  可能性も低いのではと思っており、ちょっと試して、打ち切りました。
- 💦poutcomeの列のデータ中に `unknown` の値が多くありました。この列は、`success`か`failure`の目的変数への
  寄与度が高そうだったので、はじめに、poutcomeを推論して、推論結果を含めて、目的変数を推論する
  アプローチを行ってみましたが、スコアはアップできませんでした。poutcomeの推論結果がイケてなかったと予想してます。
- 🎉このコンペの元データとなった [こちら](https://archive.ics.uci.edu/ml/datasets/bank+marketing)と今回のコンペの
  データを比べたところ、 pdays と balance の分布が大きく異なっており、特に今回のコンペのデータは
  目的変数に対して、まったく相関がないように見えました。そこで、この2つの変数は学習から除外しました。
- 💦target encodingもいくつかやってみましたが、スコアアップには繋がりませんでした。

## モデル

モデルは初手LightGBMではじめました。頭打ちが見えてきたところで、
ニューラルネットワークを取り入れました。最終盤でDeepTablesの存在を知り、
DeepTablesでベストスコアが出せた状況です。

Deep LearningはLightGBMに比べ、学習時間が長く、どう進めていくかが難しかったです。
（内容にも多く依存するところですが、体感では、LightGBMは長くても1時間以内。Deep Learningは10時間程度かかることも）

### LightGBM

テーブルデータと言えば、今はLightGBMが良さそうなので、目をつむって、まずはLighGBMを試すことにしました。
(最初始めたときはBenchmarkのコード見てませんでした。。)

- カーネルは2種類用意しました。
  - 特徴量の効果を確認するために速度重視で、ハイパーパラメータチューニングなし、交差検証なしのもの
  - スコアアップを目指すハイパーパラメータチューニングあり、交差検証ありのもの
- 🎉交差検証は StratifiedKFold を使いました。厳密な KFold との違いは確認していませんが、目的変数の
  割合から、 StratifiedKFold を選びました。
- 🎉ハイパーパラメータは、learning rate だけ `0.01` に固定して、残りを optuna integration でチューニングしました。
- learning rate を固定したのは、[こちら](https://alphaimpact.jp/downloads/pydata20190927.pdf) を参考にしました。

しかし、LighGBM だけでは、 0.857 くらいで頭打ちになりました。

### Neural Network

カテゴリ変数をNeural Networkで学習する方法を調べていたところEntity Embeddingという手法を見つけたので、
これで行いました。

- ハイパーパラメータは、Entity Embeddingの次元を変数として、Optuna でチューニングしました。
- チューニングポイントが多く、（学習にも時間がかかるので、）どこをチューニングするのがよいのか、調べきれませんでした。

スコアは 0.852 くらいで、モデルにもっと良いアルゴリズムがあるのではないかなと思っていた矢先に、

### DeepTables

フォーラムでDeepTablesが紹介されていて、私もちょうどニューラルネットワークでできないかトライしていた
ところだったので、利用させていただきました。(直前にニューラルネットワークでやっていたので、スムーズに
取り込むことができた、とも言えるかもしれません)

- 🎉netsは xDeepFM が良さそうでした。
- 🎉ハイパーパラメータは、embeddingのアウトプットの次元と、compressed interaction networkのパラメータをチューニングしました。(Optunaで)

これで 0.86 を突破できました。

### Random Forest

- 💦LightGBMとアンサンブルの相性がよいという情報を入手し、Random Forestでもモデルを作成しましたが、
  結果的には、LightGBMだけのアンサンブルとさほど性能は変わりませんでした。

## 疑似ラベル (Pseudo Labeling)

- 一度、目的変数を推論し、その結果を含めて、再度モデルを学習してみました。
  LightGBMでは、少しスコアアップしましたが、Deep Learningでは、スコアは上がりませんでした。

## アンサンブル (Ensemble)

### Random Seed Average

- 🎉Random Seedの値を変えたモデルを複数作って、その推論結果の平均を出しました。
  この効果はどのモデルでも絶大でした。

## 反省

- 今回、作成したコードやモデルをちゃんとバージョン管理しなかったことは反省です。
  こういう開発の仕方をしているとそのうち困りそうなので、次の参加するコンペからは
  ちゃんとバージョン管理したいと思います。 git & dvc

## 所感

- もう少し有効な特徴量が見つけられなかったかなと思いますが、思いつきませんでした。。
- テーブルデータに対して、Neural Networkを構築するときにどうするとよいのか、
  どういうネットワークがよいのか勉強したいです。 xDeepFMもその一つ。？
- Optunaをどう使ったらよいかがわかってきた気がします。例えば、チューニング過程で
  作成されたモデルをあとで取り出す方法、など。

## コード

[こちら](https://github.com/IMOKURI/signate-292) にコンペの過程でできたものを
何も整理せず、そのまま置いてあります。
支離滅裂なコードがあっても、ご容赦ください。

## 参照

- [【随時更新】Kaggleテーブルデータコンペできっと役立つTipsまとめ](https://naotaka1128.hatenadiary.jp/entry/kaggle-compe-tips)
- [Kaggle Ensembling Guide + 実装例](https://higepon.hatenablog.com/entry/2019/02/20/191900)
- [Kaggle TalkingData Fraud Detection コンペの解法まとめ(応用編)](https://www.rco.recruit.co.jp/career/engineer/blog/kaggle_talkingdata_advanced/)
- [有名ライブラリと比較した LightGBM の現在](https://alphaimpact.jp/downloads/pydata20190927.pdf)
- [Entity Embeddings を使ってタイタニック号生存者を予測する深層学習モデルを作る](https://qiita.com/kznovo/items/caa389dfd178174ad93a)
- [Python: Optuna の LightGBMTunerCV から学習済みモデルを取り出す](https://blog.amedama.jp/entry/optuna-lightgbm-tunercv)
- [xDeepFM: Combining Explicit and Implicit Feature Interactions for Recommender Systems(KDD2018)](https://www.slideshare.net/DeepLearningJP2016/dlxdeepfm-combining-explicit-and-implicit-feature-interactions-for-recommender-systemskdd2018)
