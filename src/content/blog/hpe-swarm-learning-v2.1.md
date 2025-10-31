---
title: HPE Swarm Learning v2.1 までのハイライト
slug: hpe-swarm-learning-v2.1
date: 2023-10-25
updated:
tags:
  - Blockchain
  - Deep Learning
  - Federated Learning
  - HPE Swarm Learning
description: "HPE Swarm Learning v2.1 までの追加機能のハイライトです。"
---

前回の Swarm Learning の記事からだいぶ日数がたち、
アクティブに開発されている Swarm Learning には新しい機能が入ってきています。
その一部を紹介したいと思います。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [管理 GUI ツール SLM-UI](#%E7%AE%A1%E7%90%86-gui-%E3%83%84%E3%83%BC%E3%83%AB-slm-ui)
- [マージアルゴリズム 追加](#%E3%83%9E%E3%83%BC%E3%82%B8%E3%82%A2%E3%83%AB%E3%82%B4%E3%83%AA%E3%82%BA%E3%83%A0-%E8%BF%BD%E5%8A%A0)
  - [Weighted Coordinate Median](#weighted-coordinate-median)
  - [Weighted Geometric Median](#weighted-geometric-median)
  - [メリット](#%E3%83%A1%E3%83%AA%E3%83%83%E3%83%88)
- [Blockchain 永続化](#blockchain-%E6%B0%B8%E7%B6%9A%E5%8C%96)
- [Reverse Proxy アーキテクチャ](#reverse-proxy-%E3%82%A2%E3%83%BC%E3%82%AD%E3%83%86%E3%82%AF%E3%83%81%E3%83%A3)
- [APLS コンテナ化](#apls-%E3%82%B3%E3%83%B3%E3%83%86%E3%83%8A%E5%8C%96)
- [まとめ](#%E3%81%BE%E3%81%A8%E3%82%81)
- [参照](#%E5%8F%82%E7%85%A7)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 管理 GUI ツール SLM-UI

Swarm Learning をインストールや、タスクの実行、実行したタスクのモニタリングができる
Web UI が導入されました。

とくに学習中の各拠点でのメトリックの値の推移が見れるようになったり、
一括でログ収集が行えるようになったりと、ユーザー体験が向上されています。

![SLM-UI](/blog/GUID-CB6F59C9-7CD9-4EE8-BA7C-3082F07B8491-high.png)

## マージアルゴリズム 追加

Swarm Learning はデフォルトでは、加重平均によりモデルをマージします。

加重平均では、マージ対象のモデルを1つずつ集めることで、モデルサイズの2倍のメモリがあれば、
マージが行える、メモリ効率のよい手法です。

![mean](/blog/20231025231128.png)

これに、以下の2つが加わりました。

- Weighted Coordinate Median
- Weighted Geometric Median

(適切な日本語訳が分からなかったので、そのまま書いていますが、、)
なんのこっちゃ、ですよね。？

### Weighted Coordinate Median

これは、モデルパラメータごとの中央値を算出します。
外れ値に対してロバストな手法です。

モデルパラメータは多次元配列のため、直接、分位関数を適用することができないため、
変換処理を経て、中央値を算出します。
そのため、モデルマージはよりメモリと実行時間を必要とします。

![coordinate median](/blog/20231025231139.png)

### Weighted Geometric Median

これは、すべてのデータ点からの距離が最小となる値を求めます。
その方法は、確立されておらず、複数のアルゴリズムが存在しますが、
Swarm Learning では、Weiszfeld のアルゴリズムが利用されています。これは反復推定法です。

この手法は初期推定値を必要とし、アルゴリズムは次のラウンドのために新しい推定値を見つけていきます。
このプロセスはN回、または収束に達するまで繰り返されます。
Swarm Learningでは、収束を早めるために、全モデルパラメータの平均値が初期推定値として選択されています。

![geometric median](/blog/20231025231150.png)

### メリット

新しい2つのマージ手法は、以下のようなときに、加重平均より良い結果を出すようです。

- モデルが比較的複雑で、各エポックの実行に長い時間を要するシナリオ。モデルの収束が早くなる。
- データセットの強い偏りの性質がある。加重平均よりよい性能を示す。

より詳しい情報は、[こちらのホワイトペーパー](https://github.com/HewlettPackard/swarm-learning/blob/04e797dc7e2645759c446b362128a2cc0edc0bd5/docs/HPE_Merge_Methods_Whitepaper.pdf)をご参照ください。

## Blockchain 永続化

Swarm Learning はリリース当初、Blockchain のネットワークを形成するSNノードがすべて落ちると、
学習の履歴などが消える状態でした。
それが、改善され、Docker の volume を SNノードにマウントすることで、
SNノードがすべてダウンしたとしても、Blockchainに記録されたデータを維持できるようになりました。

## Reverse Proxy アーキテクチャ

Swarm Learning はコンポーネント間の通信のためにポートを開放する必要がありますが、
セキュリティを向上させるため、開放させるポートを減らすことができるようになりました。

各拠点にて、 Reverse Proxy サーバーをたて、DNSを使って、名前ベースで、トラフィックを
振り分けることで、開放するポートを減らします。
ただし、Blockchainのトラフィックだけは、この仕組みを利用することができません。

結果として、Reverse Proxyのポートと、Blockchainのポートのみを開放すれば、Swarm Learningを
利用できるようになりました。

![Reverse Proxy](/blog/GUID-8387004B-D71E-4C39-8036-4ECC81972D3F-high.png)

## APLS コンテナ化

Swarm Learningはライセンス管理に APLS (AutoPass License Server)を使用しています。
リリース当初は、このAPLSをOSにインストールして利用する必要があり、
環境によって、APLS用に、OSを準備しないといけない状態でした。

それが、APLSがコンテナで提供されることとなり、Swarm Learningを動かせる環境があれば、
その環境で、APLSも動かせるようになりました。

## まとめ

最近の Swarm Learning 目玉機能をご紹介しました。
Swarm Learning は引き続きアクティブな開発が続いていますので、今後のアップデートも乞うご期待です！

今後も Swarm Learning の記事はこちら(に追加されていく予定)です。

- [Tags - HPE Swarm Learning](/tag/HPE%20Swarm%20Learning/)

## 参照

- [GitHub - HewlettPackard/swarm-learning](https://github.com/HewlettPackard/swarm-learning)
- [MY HPE SOFTWARE CENTER](https://myenterpriselicense.hpe.com/cwp-ui/auth/login)
