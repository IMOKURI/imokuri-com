---
title: KubernetesのOperatorをAnsibleで作るときのTips
slug: kubernetes-ansible-operator-tips
date: 2019-12-06
updated: 2019-12-13
tags:
  - Ansible
  - Kubernetes
description: ""
---

この記事は、[Kubernetes3 Advent Calendar](https://qiita.com/advent-calendar/2019/kubernetes3)の6日目の記事です。

Kubernetesのoperatorがansibleでも書けるようになっていますね。
インフラエンジニアであるところの私にとっては、とても嬉しいところで、golangは手も足も出ませんが、ansibleならどんと来いって気持ちになれます。

Ansibleでoperatorを書く記事は、結構出回っていて、特に [Ansible Operator Overview](https://learn.openshift.com/ansibleop/ansible-operator-overview/)は、デモ用の環境で、実際に手を動かしながら、ansibleのoperatorを作成できるのでオススメです。

↑ のデモを一通りやった方が、実際にoperatorを作ってみよう、となったときに役立ちそうなTipsをご紹介します。(一部デモと内容重複もあります)

この記事では、↑ のデモでも使っている[operator-sdk](https://github.com/operator-framework/operator-sdk)を使っています。operator-sdkのインストールがまだの方は、[Install the Operator SDK CLI](https://github.com/operator-framework/operator-sdk/blob/master/doc/user/install-operator-sdk.md)を参考に準備をお願いします。

まずoperatorの枠を作っておきます。

```bash
$ operator-sdk new imo-operator --api-version=imo.example.com/v1alpha1 --kind=Imo --type=ansible
$ cd imo-operator
```

## Operatorのbase image

`operator-sdk new`で出来上がった枠で使っているoperatorのimageは最新のstableになっていると思います。ただ、それより新しい開発真っ只中のを指定することができます。Operatorは開発がどんどん進んでおり、新しい機能が使えますので、ぜひ最新のイメージにしましょう。

```diff
diff --git a/build/Dockerfile b/build/Dockerfile
index 47dc7fb..f916d7d 100644
--- a/build/Dockerfile
+++ b/build/Dockerfile
@@ -1,4 +1,4 @@
-FROM quay.io/operator-framework/ansible-operator:v0.12.0
+FROM quay.io/operator-framework/ansible-operator:master

 COPY watches.yaml ${HOME}/watches.yaml

```

たとえば、 `watches.yaml`からansibleの変数を渡したりするのは、この最新イメージでないとできないです。。(今のところ)

> 2019/12/13 追記: [0.13.0](https://github.com/operator-framework/operator-sdk/releases/tag/v0.13.0) がリリースされて、そのリリースに↑は含まれています。

## 定期的なreconcileを実行する

`watches.yaml` で以下のように指定すると、Resourceの変化があったときだけではなく、定期的にreconcileを実行することが可能です。

```diff
diff --git a/watches.yaml b/watches.yaml
index 872bf2f..cfee326 100644
--- a/watches.yaml
+++ b/watches.yaml
@@ -3,3 +3,4 @@
   group: imo.example.com
   kind: Imo
   role: /opt/ansible/roles/imo
+  reconcilePeriod: 30s
```

定期的なreconcileを実行するには、例えば以下のような方法があるかと思います。

1. OperatorでCronJobを作成する
2. OperatorでJobを作成(完了したら削除)する。
3. Operatorで(kubernetesのobjectを使わない)ansibleのplaybookを書く

定期的なタスクと言っても、時には実行してほしくないことや、ある程度条件を整えてから実行したいなど、よくあるかなと思います。1.のCronJobを使うケースではそういった場合の処理もすべてCronJobの中で扱えるようにしておく必要があり、マイクロサービス的な考えからするとあまり感触がよくなさそうな感じがします。

2.の場合は、Jobのデプロイ前後などで、operator側で状態の確認などの処理をしておくことができます。(この処理はansibleで書けます)

2.と3.は個人的にはどちらでも良いのかなと思っていまして、状況によりよりよい方法を使うのが良いかなと思います。

↓ のレポジトリに、2. の方法のサンプルのroleを置いておきましたので、よかったら参考になさってください。

[Kubernetes Operator built with Ansible Example](https://github.com/IMOKURI/k8s-ansible-operator-example/blob/master/roles/kuri/tasks/main.yaml)

```yaml
- debug:
    var: operations

- import_tasks: cleanup.yaml
  when: ('cleanup' in operations)
  tags:
    - cleanup

- import_tasks: deploy.yaml
  when: ('deploy' in operations)
  tags:
    - deploy
```

`cleanup.yaml` でJobの削除、`deploy.yaml` でJobの作成を行っています。

ポイントは[削除](https://github.com/IMOKURI/k8s-ansible-operator-example/blob/master/roles/kuri/tasks/cleanup.yaml)のときに、JobとPodを両方明示的に削除していることです。(どちらかだけだと、もう一方が残ってしまう)

## Resourceの状態を任意の値にする

Reconcileは定期的なサイクルや、Resourceの状態に応じて実行されますが、自分でResourceの状態をコントロールすることもできます。

Resourceの状態をセットするには ansibleの [`k8s_status`](https://github.com/fabianvf/ansible-k8s-status-module) モジュールを使って、playbookの中で以下のように実行します。

> 2019/12/13 追記: `k8s_status` モジュールは削除され、代わりに、 `operator_sdk.util.k8s_status` を使うようになっています。詳しくは [Remove k8s_status module, install from galaxy](https://github.com/operator-framework/operator-sdk/pull/2310)

```yaml
- k8s_status:
    api_version: kabocha.example.com/v1alpha1
    kind: Kabocha
    name: "{{ meta.name }}"
    namespace: "{{ meta.namespace }}"
    status:
      phase: "{{ phase }}"
```

このときに、kubernetesによる状態の管理をしてほしくない(勝手にreconcileが動いてほしくない)場合は、`watches.yaml` に `manageStatus: false` を入れておきます。

```yaml
- version: v1alpha1
  group: kabocha.example.com
  kind: Kabocha
  reconcilePeriod: 90s
  manageStatus: false
  role: /opt/ansible/roles/kabocha
  vars:
    phase:
      - setup
```

すると、CustomResourceをdescribeしたときに、以下のような表示となり、手動でセットしたstatusが表示されます。
`k8s_info`モジュールを使うとplaybookの中でもこの情報が取れるので、statusに応じた処理を書くことができます。

```yaml
Name:         example-kabocha
Namespace:    imokuri
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration:
                {"apiVersion":"kabocha.example.com/v1alpha1","kind":"Kabocha","metadata":{"annotations":{},"name":"example-kabocha","namespace":"imokuri"}...
API Version:  kabocha.example.com/v1alpha1
Kind:         Kabocha
Metadata:
  Creation Timestamp:  2019-12-03T12:55:09Z
  Finalizers:
    finalizer.kabocha.example.com
  Generation:        1
  Resource Version:  10700874
  Self Link:         /apis/kabocha.example.com/v1alpha1/namespaces/imokuri/kabochas/example-kabocha
  UID:               4d79c40b-44cf-4ee6-bf84-2fc48e0cd552
Spec:
  Dummy:  Imo, Kuri and Kabocha
Status:
  Phase:
    setup  # ここ
Events:  <none>
```

このstatusは通常は以下のように `Conditions` が入っていますが、 `manageStatus: false` を指定するとこれらが表示(管理)されなくなります。

```yaml
Status:
  Conditions:
    Ansible Result:
      Changed: 0
      Completion: 2019-12-03T12:54:32.87886
      Failures: 0
      Ok: 3
      Skipped: 0
    Last Transition Time: 2019-12-03T12:53:48Z
    Message: Awaiting next reconciliation
    Reason: Successful
    Status: True
    Type: Running
```

`k8s_status`モジュールでこの`Conditions`配下を変更することも可能ですが、いくつか条件があります。

- `Type`: 必須
- `Status`: 必須(`True`, `False`, `Unknown`のどれか)
- `Reason`: CamelCaseの1単語

などです。(詳しくは[`k8s_status`](https://github.com/fabianvf/ansible-k8s-status-module)のマニュアルを参照ください)

また`Conditions`を手動で変更すると、その後は自動でのstatusの更新は行われなくなりますので、特段の理由がない限りは、`Conditions`配下のパラメータは使用せず、`Status`直下にカスタムのパラメータを配置するのが良いと思います。

## Operatorの階層構造

Ansibleではもともとroleを分割したりすることで階層構造を作れる仕組みがあります。
この場合は、1つのCustomResourceで処理が作れることになり、Reconcileの単位もこの単位になります。

一方で、Operatorでは、CustomResourceを複数作ることで階層構造を作ることができます。
この場合は、Reconcileの単位は、CustomResourceの単位になるので、
実施させたい処理によって、より良い方を選ぶのが良いと思います。

参考までに、CustomResourceを分けた場合の例を以下にアップしてあります。

[Kubernetes Operator built with Ansible Example](https://github.com/IMOKURI/k8s-ansible-operator-example/blob/master/roles/katsudon/tasks/main.yaml)

↑ では分割したCustomResourceをまとめて起動するCustomResourceを用意しています。

この階層構造を作るときの注意として、変数で定義した値が(intで読まれてほしいときでも)stringとなってしまうことがあり、objectの作成に失敗することがあります。
その場合は、k8sモジュールのタスクで直接manifestを書くのではなく、templateファイルを作成して、それを読み込ませるようにすると、回避できます。

`tasks/main.yaml`

```yaml
---
# templateから読まないとreplicasがstring扱いとなってobjectが作成できない
- name: Deploy Imo
  k8s:
    state: "{{ state | default(omit) }}"
    definition: "{{ lookup('template', 'deploy.yaml') }}"
```

`templates/deploy.yaml`

```yaml
---
kind: Deployment
apiVersion: apps/v1
metadata:
  name: "{{ meta.name }}"
  namespace: "{{ meta.namespace }}"
spec:
  # ↓ ダブルクォートで囲まないこと
  replicas: { { size | int } }
  selector:
    matchLabels:
      app: imo
  template:
    metadata:
      labels:
        app: imo
    spec:
      containers:
        - name: imo
          image: nginx
          ports:
            - containerPort: 80
```

## Ansibleのplaybookを実行するための依存パッケージを入れたい

Operatorビルド用のDockerfile(`build/Dockerfile`)の中で以下の要領で、パッケージを追加できます。

```
USER 0
RUN yum -y install my-dependency
RUN pip3 install my-python-dependency
USER 1001
```

## まとめ

いかがでしたでしょうか。ansibleが書ける方なら、割と複雑な運用もoperatorに任せられるようになるのではないかなと思います。
ぜひインフラなみなさんもKubernetes & Operatorを使っていきましょう。(^^)

今回の検証で使用したコードは以下のレポジトリにアップしています。

[Kubernetes Operator built with Ansible Example](https://github.com/IMOKURI/k8s-ansible-operator-example)

---

参照:

- [Ansible User Guide for Operator SDK](https://github.com/operator-framework/operator-sdk/blob/master/doc/ansible/user-guide.md)
- [Ansible Developer Guide for Operator SDK](https://github.com/operator-framework/operator-sdk/blob/master/doc/ansible/dev/developer_guide.md)
- [Advanced Options for Operator SDK Ansible-based Operators](https://github.com/operator-framework/operator-sdk/blob/master/doc/ansible/dev/advanced_options.md)
