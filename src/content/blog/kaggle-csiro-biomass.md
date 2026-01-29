---
title: Kaggle CSIRO - Image2Biomass Prediction 振り返り
slug: kaggle-csiro-biomass
date: 2026-01-29
updated:
tags:
  - Competition
  - Kaggle
  - Deep Learning
cover_image: /blog/509957569-48dc3e6a-71ce-40b0-8d06-2a5a099344f4.png
description: "CSIRO - Image2Biomass Prediction コンペの振り返りです。"
---

## Contents

## Overview

久しぶり(3年ぶり?)にKaggleコンペに参加しました。

https://www.kaggle.com/competitions/csiro-biomass

ソリューションの概要をまとめたいと思います。

### Task & Target

このコンペは、牧草地の画像からバイオマス(草の量)を予測するタスクでした。
評価項目は以下の5つがあり、その重み付けR2スコアで評価されました。

- Dry green vegetation (excluding clover): 乾燥した緑色植物（クローバーを除く）
- Dry dead material: 乾燥した枯死物
- Dry clover biomass: 乾燥したクローバーのバイオマス
- Green dry matter (GDM): 緑色乾物質
- Total dry biomass: 総乾燥バイオマス

評価項目には以下の関係があることが、ホストからも[アナウンスされ](https://www.kaggle.com/competitions/csiro-biomass/discussion/613699#3311854)ていましたが、
同時に、5つのターゲットをそれぞれ予測すほうが精度が良い可能性があることも示唆されていました。

```
Dry_Total_g = Dry_Green_g + Dry_Clover_g + Dry_Dead_g,
GDM_g = Dry_Total_g - Dry_Dead_g
```

私の印象では、特に、 Dry_Dead_g と Dry_Clover_g の予測が難しいように思えました。

### Data

学習データは、画像300枚ほどと少なく、画像からは、違和感のあるラベルがついているものもあり、学習が難航しました。
たとえば、牧草が見た目よりかなり長くバイオマスの値が大きいものや、牧草の影に隠れたところに実は枯死物が多くあるものなどです。

ホストによりミスラベルであることが[確認された](https://www.kaggle.com/competitions/csiro-biomass/discussion/631335#3339189)画像もあり、この画像は学習から除外しました。

## Result

- Private LB: 0.54
- Public LB: 0.64
- Local CV: 0.667

## Solution

### Preprocess

画像は、 1000x2000 ピクセスの長方形で、学習済み画像認識モデルを使うには不適切な状態でした。
牧草の育成状況の判定であることから、画像をリサイズして、模様がボケてしまうことは望ましくないように思いました。
そこで、私は、縦に画像を2枚並べ、 2000x2000 ピクセルの画像として、学習を行いました。

画像の明るさにはばらつきがあったため、 CLAHE (Contrast Limited Adaptive Histogram Equalization) を用いて、コントラストを調整しました。

また、画像の中に赤いライトのようなものが移っているものがあったため、その部分は黒塗りにしました。
合わせて、オレンジ色で日付がプリントされているものもあり、ここも黒塗りにしました。
この黒塗りが目立たないように、 Random Erasing を用いて、いくつかの画像にも黒塗りを追加しました。

### Training

#### Cross Validation

ホストからは、以下のようなデータがあることが示されていました。

- 学習データと同じロケーションのテストデータがあること
- 学習データと異なる日程でのテストデータがあること

そこで、日程でグループ化し、ロケーションは Stratified な分割を行いました。

さらに、私の方では、学習データの植物の種類が判断に寄与すると考え、植物を大きく3種類にわけて、 Stratified な分割をしました。

#### Base Models

いろいろなモデルを試しましたが、有効なスコアが得られたのは、 `tf_efficientnet_b4.ns_jft_in1k` のみでした。

#### Loss Function

- 最終的なスコアが重み付けされた値なので、重み付けした損失関数で学習を行いました。
- 一方で、重みが大きいターゲットはその他の値の和であることを踏まえ、重みを均等にした損失関数でも学習を行いました。

### Validation

学習が不安定なので、ベストモデルだけではなく、ベスト３のチェックポイントを利用してアンサンブルを行いました。

### Inference

左右反転を推論するTTAを行いました。

### Ensemble

異なる重み付けの損失関数で学習したモデルでアンサンブルを行いました。

| Model                          | Loss Weighting | Local CV | Public LB | Private LB |
| ------------------------------ | -------------- | -------- | --------- | ---------- |
| tf_efficientnet_b4.ns_jft_in1k | Weighted       | 0.642    | 0.63      | 0.54       |
| tf_efficientnet_b4.ns_jft_in1k | Unweighted     | 0.654    | 0.63      | 0.53       |

### Conclusion

久しぶりに参加したコンペは楽しかったです。

以前はがむしゃらに色々なことを試していましたが、今回は、あまり無茶なコードを書くとあとで大変そうだな、
という(コンペに取り組むうえでは)よくない邪念が働いてしまい、あまり色々なことが試せなかったのが反省点です。

`tf_efficientnet_b4.ns_jft_in1k` 以外のモデルでの精度が、今ひとつ向上しなかったのが残念でした。
2000x2000 という大きな画像での推論は適当ではなかったかもしれません。

## Links

- [Solution Source Code](https://github.com/IMOKURI/kaggle-csiro-biomass/tree/main)
