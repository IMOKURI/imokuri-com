---
title: Haskellでニューラルネットワーク
slug: neural-network-in-haskell
date: 2015-07-15
updated:
tags:
    - Haskell
    - Neural Network
    - Machine Learning
description: "HaskellのニューラルネットワークのライブラリのLambdaNetを使って、ニューラルネットワークを構築してみたいと思います。"
---

Haskellの[ニューラルネットワーク](https://ja.wikipedia.org/wiki/ニューラルネットワーク)のライブラリの[LambdaNet](https://hackage.haskell.org/package/LambdaNet)を使って、ニューラルネットワークを構築してみたいと思います。

題材は、ニューラルネットワークの例としてよく使用されるXORをシュミレーションしてみたいと思います。

<!--more-->

| Input | Output |
|-------|--------|
| (0,0) | 0      |
| (0,1) | 1      |
| (1,0) | 1      |
| (1,1) | 0      |


---

まずは、層（レイヤー）の数と素子（ニューロン）の数を決めます。

1つ目の層が入力層、最後の層が出力層となり、  
入力層のニューロンの数は、入力のデータの数、  
出力層のニューロンの数は出力のデータの数とします。

それ以外のレイヤーが隠れ層です。  
隠れ層の数と、それぞれの層が持つニューロンの数をいくつにすれば良いかは、  
いろいろな手法が考えられているようですが、この記事では割愛します。。

今回は、入力層のデータの数が2つ、出力層のデータの数が1つです。
隠れ層は、よくあるXORの例にならい、隠れ層1つ（ニューロン2つ）としたいとおもいます。


続いて、各層のニューロンをどのように接続するかを考えます。
一般的には各ニューロンを接続する・しないのマップで表現されることが考えられそうですが、
LambdaNetのライブラリでは、現状、すべてのニューロンを接続することしかできません。

活性化関数には、sigmoid、tanh、ReLUが用意されています。  
今回はsigmoidを使ってみます。

重みとバイアスの初期値はランダムですが、一様なもの（uniforms）と、  
正規分布に従うもの（normals）が用意されています。  
今回はnormalsを使ってみます。

ここまでの情報で、初期値を持ったニューラルネットワークができます。  
ソースはこちらです。


```haskell
  g <- newStdGen
  let l   = LayerDefinition sigmoidNeuron 2 connectFully
      l'  = LayerDefinition sigmoidNeuron 2 connectFully
      l'' = LayerDefinition sigmoidNeuron 1 connectFully

  let n = createNetwork normals g [l, l', l'']
```


---

次に、誤差逆伝播法（バックプロパゲーション）を使った教師あり学習を作っていきます。

LambdaNetでは、誤差関数（コスト関数）として、二乗誤差関数のみが提供されています。  

学習係数は、用途に合わせて調整します。

ニューラルネットワークの更新の方法は、毎回の学習のたびにネットワークを更新するオンライン（online）と、  
n回学習ごとに更新するミニバッチ（minibatch n）が用意されています。

学習用のデータとしては、XORのインプットとアウトプットの4パターンを使用します。

準備した学習用のデータで1万回学習するソースがこちらです。

```haskell
  let t = BackpropTrainer 3 quadraticCost quadraticCost'

  let dat = [(fromList [0, 1], fromList [1]),
             (fromList [1, 1], fromList [0]),
             (fromList [1, 0], fromList [1]),
             (fromList [0, 0], fromList [0])]

  let n' = trainNTimes n t online dat 10000
```


---

最後に、学習したネットワークをテストしてみます。

うまくいけば、XORの結果が得られていると思います。  
（今回のソースの条件だと、最初の乱数の状況によってはあまりよい結果にならない場合もありそうです・・）


良いケース

```
| ==> XOR predictions:
| (0,0): fromList [5.9859958e-3]
| (1,0): fromList [0.9938293]
| (0,1): fromList [0.9938205]
| (1,1): fromList [7.5507853e-3]
```


悪いケース・・・

```
| ==> XOR predictions:
| (0,0): fromList [5.984603e-3]
| (1,0): fromList [0.99414057]
| (0,1): fromList [0.4489829]
| (1,1): fromList [0.44912618]
```


この形を基本に様々なケースに拡張してみたいと思います。


---

今回作成したコードは[こちら](https://github.com/IMOKURI/nn-sample)です。  
LambdaNetの[こちら](https://github.com/jbarrow/LambdaNet/blob/master/examples/XOR.hs)のコードを参考にしています。
