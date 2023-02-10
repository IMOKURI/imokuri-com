---
title: Kaggle Multimodal Single-Cell Integration 振り返り
slug: kaggle-multimodal-single-cell-integration
date: 2022-11-16
updated: 2022-11-24
tags:
    - Compete
    - Kaggle
    - Machine Learning
    - Deep Learning
cover_image: /blog/195366837-9048d24c-86ca-42d6-99a8-414a019a5048.png
description: "Multimodal Single-Cell Integration コンペの振り返りです。"
---

コンペで取り組んだことを中心に振り返りです。

このコンペは、Private テストデータが、学習データには存在しない将来の日付のもので、
いわゆるドメイン汎化性能が問われるコンペでした。
一方で、日付による変化の要素もあり、完全に日付の特徴を無視するのも望ましくないことが、
予想されていました。

はじめに、Adversarial training (学習データとテストデータを分類するタスク) を行ったところ、
Citeseq は 99% 分類が可能な状況で、この特徴量で学習をすると、学習データへの過学習が
懸念されると考えられました。
しかし、Adversarial training の精度を下げるために、特徴量を減らすと、著しく、Public LBのスコアも
下がる状況で、基本的には、特徴量を減らすアプローチでは厳しいのではないかと考えました。

そこで、なにか生物学的な特徴量の工夫を行うことや、モデルのバリエーションによる
汎化性能の向上を目指す方針で臨みました。

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [✨ Result](#-result)
- [🖼️ Solution](#-solution)
  - [🌱 Preprocess](#-preprocess)
  - [🤸 Pre Training](#-pre-training)
  - [🏃 Training](#-training)
  - [🎨 Base Models](#-base-models)
  - [🚀 Postprocess](#-postprocess)
- [💡 Tips](#-tips)
  - [Pearson Loss for XGBoost](#pearson-loss-for-xgboost)
- [🏷️ Links](#-links)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---


## ✨ Result

- Private: 0.769808
- Public: 0.813093



## 🖼️ Solution


### 🌱 Preprocess

- Citeseq
    - 元データ を PCA で 100次元に削減しました。
    - 一方で、重要カラムのデータを温存しました。
    - [ivis](https://bering-ivis.readthedocs.io/en/latest/index.html) の教師なし学習で 100次元の特徴量を生成しました。
    - 合わせて、ミトコンドリアのRNA細胞ごとの和を特徴量に追加しました。
    - Metadata の Cell type を特徴量に追加しました。
- Multiome
    - 列名の接頭文字が同じグループごとに PCA で およそ 各 100 次元に削減しました。
    - さらに ivis の教師なし学習で 100 次元の特徴量を生成しました。


### 🤸 Pre Training

- Adversarial training (学習データとテストデータを分類するタスク) を行い、誤判定された学習データを good validation データとします。
- Multiome の Cell type の予測を行い、特徴量に追加しました。


### 🏃 Training

- good validation データを 正ラベル とした StratifiedKFold です。
- Loss 関数に Pearson 相関係数 を使用しました。 XGBoost は後述の方法で実装しました。
- TabNet は Pre-training も行いました。 (このコンペでは、Pre-training を行ったほうが精度が良かったです)


### 🎨 Base Models

- Citeseq
    - TabNet
    - Simple MLP
    - ResNet
    - 1D CNN
    - XGBoost
- Multiome
    - 1D CNN

Citeseq はさまざまなモデルのアンサンブルでスコアがのびました。
一方、 Multiome は 1D CNN が強く、他のモデルをアンサンブルしてもスコアが伸びず、1D CNN のみ使用しました。

### 🚀 Postprocess

- 評価指標が Pearson 相関係数なので、 各推論結果(OOF結果含め)を 正規化 してからアンサンブルしました。
- Optuna でアンサンブルの重みを最適化しました。評価指標には good validation データを使用しました。
- Public Notebook x2 と チームメイト の サブミッション ともアンサンブルしました。


## 💡 Tips


### Pearson Loss for XGBoost

XGBoost は Pearson Loss Function が提供されていないので、以下のように実装しました。
ただし、この実装は学習が遅く、もう少し、改善をしたい印象を持っています。。

``` python
from functools import partial
from typing import Any, Callable

import numpy as np
import torch
import torch.nn.functional as F
import xgboost as xgb


def pearson_cc_loss(inputs, targets):
    try:
        assert inputs.shape == targets.shape
    except AssertionError:
        inputs = inputs.view(targets.shape)

    pcc = F.cosine_similarity(inputs, targets)
    return 1.0 - pcc


# https://towardsdatascience.com/jax-vs-pytorch-automatic-differentiation-for-xgboost-10222e1404ec
def torch_autodiff_grad_hess(
    loss_function: Callable[[torch.Tensor, torch.Tensor], torch.Tensor], y_true: np.ndarray, y_pred: np.ndarray
):
    """
    Perform automatic differentiation to get the
    Gradient and the Hessian of `loss_function`.
    """
    y_true = torch.tensor(y_true, dtype=torch.float, requires_grad=False)
    y_pred = torch.tensor(y_pred, dtype=torch.float, requires_grad=True)
    loss_function_sum = lambda y_pred: loss_function(y_true, y_pred).sum()

    loss_function_sum(y_pred).backward()
    grad = y_pred.grad.reshape(-1)

    # hess_matrix = torch.autograd.functional.hessian(loss_function_sum, y_pred, vectorize=True)
    # hess = torch.diagonal(hess_matrix)
    hess = np.ones(grad.shape)

    return grad, hess


custom_objective = partial(torch_autodiff_grad_hess, pearson_cc_loss)


xgb_params = dict(
    n_estimators=10000,
    early_stopping_rounds=20,
    # learning_rate=0.05,
    objective=custom_objective,  # "binary:logistic", "reg:squarederror",
    eval_metric=pearson_cc_xgb_score,  # "logloss", "rmse",
    random_state=440,
    tree_method="gpu_hist",
)  # type: dict[str, Any]

clf = xgb.XGBRegressor(**xgb_params)
```


## 🏷️ Links

- [My Solution](https://github.com/IMOKURI/kaggle-multimodal-single-cell-integration)

