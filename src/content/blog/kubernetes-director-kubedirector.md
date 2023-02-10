---
title: Kubernetes Director (KubeDirector) を使ってみた。
slug: kubernetes-director-kubedirector
date: 2019-12-16
updated:
tags:
    - Kubernetes
description: "Kubernetes上でStatefulなアプリケーションを管理するためのカスタムコントローラであるKubeDirectorをご紹介します。"
---

この記事はKubernetes Advent Calendarの穴埋め記事です。

[Kubernetes Director (KubeDirector)](https://github.com/bluek8s/kubedirector)をご存知でしょうか。

Statefulなアプリケーションを管理するためのカスタムコントローラです。

アプリケーション固有のオペレーターと違い、KubeDirectorにはアプリケーション固有のロジックはなく、アプリケーションの情報はカスタムリソースの設定として定義していきます。

## [KubeDirectorインストール](https://github.com/bluek8s/kubedirector/blob/v0.3.0/doc/quickstart.md#deploying-kubedirector)

KubeDirectorはGKEやEKS、Local Kubernetesなどで使用できます。今回はLocal Kubernetesでやってみます。

```bash
$ git clone https://github.com/bluek8s/kubedirector.git
$ cd kubedirector/
$ git checkout v0.3.0
$ make deploy
```

デプロイが完了すると、以下のCustomResourceDefinitionが作成されます。

- `KubeDirectorApp`: KubeDirectorからデプロイ可能なアプリケーションを定義します
- `KubeDirectorCluster`: KubeDirectorAppによって定義されたアプリケーションのインスタンスを定義します
- `KubeDirectorConfig`: KubeDirectorの設定を定義します

また、サンプルのアプリケーションとして、以下のアプリケーションがKubeDirectorAppのカスタムリソースとして追加されます。

- `cassandra311`: Cassandra 3.11 on centos 7.x
- `cdh5142cm`: CDH 5.14.2 with YARN support. Includes Pig, Hive, and Hue.
- `centos7x`: CentOS 7x utility with no preinstalled apps
- `spark221e2`: Spark 2.2.1 with Jupyter
- `tensorflowgpu-jupyter`: TensorFlow GPU with jupyter notebook
- `tensorflowjupyter`: TensorFlow1.9 CPU with centos7x

## [KubeDirector設定](https://github.com/bluek8s/kubedirector/blob/v0.3.0/doc/quickstart.md#configuring-kubedirector)

早速アプリケーションをデプロイしたいところですが、その前KubeDirectorをしておきたいと思います。
設定は、KubeDirectorConfigのカスタムリソースで、`kd-global-config`の名前で作成すると反映させることができます。
設定可能な値は[こちら](https://github.com/bluek8s/kubedirector/wiki/0.3.0-Type-Definitions-for-KubeDirectorConfig)で確認できます。
[サンプル](https://github.com/bluek8s/kubedirector/blob/v0.3.0/deploy/example_configs/cr-config-onprem.yaml)。
デフォルトのStorageClassやServiceType、Systemdのサポートなどが設定できます。

## [アプリケーションデプロイ](https://github.com/bluek8s/kubedirector/blob/v0.3.0/doc/virtual-clusters.md#deploying-virtual-clusters)

[こちら](https://github.com/bluek8s/kubedirector/blob/v0.3.0/deploy/example_clusters/cr-cluster-spark221e2-stor.yaml)のサンプルにある永続ストレージを使用するSparkのアプリケーションをデプロイしてみたいと思います。

```bash
$ kubectl apply -f cr-cluster-spark221e2-stor.yaml
```

すると、↑ のyamlファイルに書かれた以下のオブジェクトが作成されます。

- Sparkのcontroller 1podが入ったStatefulSet (40Giの永続ストレージ付き)
- Sparkのworkerノード 2podが入ったStatefulSet
- Jupyterノード 1podが入ったStatefulSet (40Giの永続ストレージ付き)

## [アプリケーションの作成](https://github.com/bluek8s/kubedirector/wiki/App-Definition-Authoring-for-KubeDirector)

[こちら](https://github.com/bluek8s/kubedirector/tree/v0.3.0/deploy/example_catalog)にあるサンプルをベースに変更していくのがスムーズかと思います。

ポイントは以下の3点です。

- アプリケーションのメタデータはKubeDirectorAppのカスタムリソースで定義可能です
- [コンテナイメージ](https://github.com/bluek8s/kubedirector/wiki/App-Definition-Authoring-for-KubeDirector#container-images)にアプリケーションのベースを入れておきます
- コンテナ起動時に[セットアップスクリプト](https://github.com/bluek8s/kubedirector/wiki/App-Definition-Authoring-for-KubeDirector#setup-package)が流せます

## まとめ

KubeDirectorを使用すると既存のStatefulなアプリケーションを容易にコンテナ環境に移すことができます。

ぜひ使ってみてください。(^^)
