---
title: KubernetesをDual Stackで動かす
slug: kubernetes-dual-stack
date: 2020-01-27
updated:
tags:
    - IPv6
    - Kubernetes
description: "KubernetesをIPv4, IPv6の共存環境で動かしてみます。"
---

KubernetesのIPv4, IPv6共存(いわゆるDual Stack)は、1.16でalphaバージョン(デフォルト無効)としてリリースされており、
1.18でbeta(デフォルト有効)となる見込みです。

また、CNIのCalicoが3.11からDual Stackに対応しています。

そこで、今回はこの構成でDual Stackを構築してみます。

手順、設定の詳細は、巻末の参照ドキュメントも参照ください。

## 構成

- masterノード1台、workerノード2台
- IPv4, IPv6のIPアドレスが各ノードにアサインされている
- IPv4, IPv6で名前解決ができる

### SWバージョン

- CentOS 7.7.1908
- Docker 19.03.5
- Kubernetes 1.17.2
- Calico 3.11

## Docker 設定

[Dockerをインストールし、設定していきます。](https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/#docker)

`/etc/docker/daemon.json` を修正する際、IPv6に対応する設定を入れておく必要があります。

```json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2",
  "ipv6": true,
  "fixed-cidr-v6": "fd00:1::/64"
}
```

`fixed-cidr-v6` はkubernetes上では使用されないので、書かなくても大丈夫かもしれません。(ちゃんと確認してない、おい)

## Kubernetes デプロイ

kubeadmでデプロイしていきます。kubeadmは[こちら](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#kubeadm-kubelet-kubectl%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)に沿ってインストールしておきます。
`systemctl enable --now kubelet` を実行しているところがありますが、この時点では kubelet はまだ起動できないので、 `systemctl enable kubelet` がよいです。

`kubeadm init` の引数に、`--config <config file>` を指定し、クラスターをデプロイします。
ネットワークが不安定な環境の場合、 `kubeadm init` の実行前に `kubeadm config images pull` を実行しておくと、予めデプロイに必要なイメージをpullできます。
`kubeadm init` の実行後は、 `network plugin is not ready: cni config uninitialized` でnodeは `NotReady` となるので、次のCalicoのインストールを継続してきます。

以下がコンフィグファイルのサンプルです。ポイントは、

- `ClusterConfiguration` の `featureGates` で `IPv6DualStack` を有効化する
- `ClusterConfiguration` の `networking.podSubnet` でIPv4、IPv6双方のサブネットを記載する
- `ClusterConfiguration` の `networking.serviceSubnet` でIPv4、IPv6双方のサブネットを記載する
- `KubeProxyConfiguration` を `ipvs` モードで起動する (kube-proxyをipvsモードで動かすための準備は[こちら](https://github.com/kubernetes/kubernetes/tree/master/pkg/proxy/ipvs#run-kube-proxy-in-ipvs-mode))

```yaml
apiVersion: kubeadm.k8s.io/v1beta2
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: <master node ipv4 address>
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: <master node hostname>
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta2
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
featureGates:
  IPv6DualStack: true
imageRepository: k8s.gcr.io
kind: ClusterConfiguration
kubernetesVersion: v1.17.2
networking:
  dnsDomain: cluster.local
  podSubnet: "10.244.0.0/16,fd00:2::/48"
  serviceSubnet: "10.96.0.0/16,fd00:3::/112"
scheduler: {}
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: ipvs
```

[こちら](https://kubernetes.io/docs/concepts/services-networking/dual-stack/#enable-ipv4-ipv6-dual-stack)に書かれている設定の仕方とわりと違うような気がしたのがもやっとポイントでした。
↑のコンフィグは[こちら](https://github.com/kubernetes/kubernetes/issues/86773#issuecomment-570527959)から拝借しています。

## Calico インストール

[Calicoのマニュフェストをダウンロードし、IPv6に対応するよう修正し、クラスターに適用します](https://docs.projectcalico.org/v3.11/networking/dual-stack)

- ConfigMapの `calico-config` の `ipam` で、IPv4, IPv6を有効化する

```yaml
          "ipam": {
              "type": "calico-ipam",
              "assign_ipv4": "true",
              "assign_ipv6": "true"
          },
```

- DaemonSetの `calico-node` のコンテナの環境変数で以下のように設定する

```yaml
            # Auto-detect the BGP IP address.
            - name: IP
              value: "autodetect"
            - name: IP6
              value: "autodetect"

            # The default IPv4 pool to create on startup if none exists. Pod IPs will be
            # chosen from this range. Changing this value after installation will have
            # no effect. This should fall within `--cluster-cidr`.
            - name: CALICO_IPV4POOL_CIDR
              value: "10.244.0.0/16"
            - name: CALICO_IPV6POOL_CIDR
              value: "fd00:2::/48"

            # Enable IPv6 on Kubernetes.
            - name: FELIX_IPV6SUPPORT
              value: "true"
```

## 動作確認

[Validate IPv4/IPv6 dual-stack](https://kubernetes.io/docs/tasks/network/validate-dual-stack/) に沿って確認をしていくと、
`.status.addresses` だけ、IPv4のアドレスしか付きませんでした。

最終的に、起動したクラスターで、nginxのアプリケーションを起動した様子です。
(officialのnginxのイメージはIPv6をListenしていなかったので、[Listenするイメージ](https://hub.docker.com/repository/docker/imokuri123/nginx-ipv6)を準備しました。。)

```
[root@k8s-master01 ~]# kubectl get all
NAME                           READY   STATUS    RESTARTS   AGE
pod/my-nginx-94c87cdcd-88hzq   1/1     Running   0          60m
pod/my-nginx-94c87cdcd-c6np8   1/1     Running   0          60m
pod/my-nginx-94c87cdcd-xlqfd   1/1     Running   0          60m

NAME                              TYPE           CLUSTER-IP     EXTERNAL-IP       PORT(S)        AGE
service/kubernetes                ClusterIP      10.96.0.1      <none>            443/TCP        149m
service/my-nginx-svc-ipv4         ClusterIP      10.96.48.15    192.168.200.145   80/TCP         60m
service/my-nginx-svc-ipv6         ClusterIP      fd00:3::5068   2000:db1::120     80/TCP         60m
service/my-nginx-svc-ipv6-local   LoadBalancer   fd00:3::1ff3   2000:db1::121     80:32405/TCP   58m

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/my-nginx   3/3     3            3           60m

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/my-nginx-94c87cdcd   3         3         3       60m
```

`service/my-nginx-svc-ipv4`, `service/my-nginx-svc-ipv6` は `ExternalIP` でIPを割り当てています。
`service/my-nginx-svc-ipv6-local` は [MetalLB](https://metallb.universe.tf/configuration/#layer-2-configuration) を使っています。
MetalLBで `.spec.isFamily` によって IPv4 か IPv6 かを割り当ててほしかったのですが、それはできなそうでした。

ノード上で `ipvsadm -ln` を実行すると、ipvsモードでのルーティングの状況が確認できます。(ipvsadmコマンドはパッケージマネージャでインストールしておいてください)

デフォルトでは、外部からのアクセスはNATされますが、 Service を作成する際、 `externalTrafficPolicy: Local` を指定したりなどすると、
外部のIPを維持できます。

## その他

- 既存のIPv4 Onlyのクラスターを設定変更して、Dual Stack対応にするのは現状できないようです。(できるようにするためのエンハンスメントリクエストが[出ているようです](https://github.com/kubernetes/kubeadm/issues/1698))
    - [やれないことはないけど、サポートはされないのかな・・・](https://github.com/kubernetes/kubeadm/issues/1464#issuecomment-518021984)
- IPv6 Only/Dual Stack 環境のサポートは 1.18 で alpha(デフォルト無効) から beta(デフォルト有効) となる見込みです。
    - [IPv6 support added](https://github.com/kubernetes/enhancements/issues/508#issuecomment-574126795)
    - [Add IPv4/IPv6 dual-stack support](https://github.com/kubernetes/enhancements/issues/563#issuecomment-570321655)

## 参照

- [CRIのインストール](https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/)
- [IPv6 with Docker](https://docs.docker.com/v17.09/engine/userguide/networking/default_network/ipv6/)
- [kubeadmのインストール](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)
- [kubeadmを使用したシングルマスタークラスターの作成](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)
- [Run kube-proxy in IPVS mode](https://github.com/kubernetes/kubernetes/tree/master/pkg/proxy/ipvs#run-kube-proxy-in-ipvs-mode)
- [IPVSプロキシーモード](https://kubernetes.io/ja/docs/concepts/services-networking/service/#proxy-mode-ipvs)
- [Enable dual stack](https://docs.projectcalico.org/v3.11/networking/dual-stack)
- [IPv4/IPv6 dual-stack](https://kubernetes.io/docs/concepts/services-networking/dual-stack/)
- [Validate IPv4/IPv6 dual-stack](https://kubernetes.io/docs/tasks/network/validate-dual-stack/)
- [IPVS-Based In-Cluster Load Balancing Deep Dive](https://kubernetes.io/blog/2018/07/09/ipvs-based-in-cluster-load-balancing-deep-dive/)
- [RFE: kubeadm operator](https://github.com/kubernetes/kubeadm/issues/1698)
- [MetalLB](https://metallb.universe.tf/)
- [IPv6 support added](https://github.com/kubernetes/enhancements/issues/508#issuecomment-574126795)
- [Add IPv4/IPv6 dual-stack support](https://github.com/kubernetes/enhancements/issues/563#issuecomment-570321655)
