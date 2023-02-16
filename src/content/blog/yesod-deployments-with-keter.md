---
title: KeterでYesodを動かす。
slug: yesod-deployments-with-keter
date: 2015-09-25
updated:
tags:
    - Haskell
    - Nginx
description: "KeterとNginxを使って、Yesodをdaemonとして起動してみたので、まとめです。"
---

KeterとNginxを使って、Yesodをdaemonとして起動してみたので、まとめです。

結果として、

* Yesodはsandboxにインストールする。
* 本番環境には、バイナリのみ配置する。(今回は便宜上同じ環境です・・)

な感じで動作できそうな感じになりました。

ただ、cabal hellが怖くない(？)本番環境などでは、sandboxが消えちゃった時のことを考えると(そんなこと考えるのはおかしいかもですが、、)globalな環境にインストールしちゃっても良いのかもしれません。


<!--more-->

今回の環境は、以下のとおりです。

* Fedora 22
* Haskell-Platform 2014.2
* GHC 7.8.4
* Nginx 1.8.0

stackはまだ勉強中なので、、cabalを使っています。。


## Yesodをインストールする

YesodとKeterをsandboxにインストールします。安心してインストールできるようにLTS Haskellを使いました。

```
$ mkdir yesod && cd yesod
$ cabal sandbox init

## (執筆時点の)最新のLTS HaskellはGHC 7.10向けなので、LTS2を使います。
$ wget https://www.stackage.org/lts-2/cabal.config

$ cabal update
$ cabal install yesod-bin keter
```


インストールすると、 `./cabal-sandbox/bin` 配下にyesodなどのコマンドができています。  
やり方としては、スマートではないかもしれませんが、このコマンドを(楽に)使いたいので、パスを通しておきます。

```
$ export PATH="＜ほげほげ＞/yesod/.cabal-sandbox/bin:$PATH"
$ yesod init
```


Yesodのプロジェクトのディレクトリに移動して、またもsandboxでインストールです。  
ここはcabalファイルに、細かくバージョンの制限があったので、LTS Haskellはなしでやっちゃいました。

```
$ cd <プロジェクトのディレクトリ>
$ cabal sandbox init
$ cabal install --only-dependencies
```


## Keter用にYesodのプログラムを準備する

苦悩の末に、Yesodのプロジェクトが出来上がったら、Keterの設定ファイル(config/keter.yml)を更新します。  
最低限更新が必要なのは以下かと思います。

```
user-edited: false    ## 削除

stanzas:
  - type: webapp
    hosts:
      - www.<かっこいいドメイン>.com    ## プロジェクトのドメインに変更
```


設定ファイルを更新したら、本番環境に持っていくバイナリファイルを作ります。  
バイナリファイルの実体は、Yesodのプログラムや設定ファイルをgzipで固めたものです。  
出来上がった `＜プロジェクト名＞.keter` が持っていくバイナリになります。

```
$ yesod keter
```


## Keterの起動準備

Keterの起動ディレクトリを適当な場所に作成して、起動ファイルを準備します。

```
$ mkdir keter && cd keter
$ mkdir etc incoming
```

incomingディレクトリには、先ほど作ったYesodのプロジェクトのバイナリファイルを配置しておきます。

etcディレクトリには、Keterの起動ファイル(keter.yaml)を準備します。  
この環境はsystemdなので、以下のようになりますが、それ以外の環境については巻末のリンクをご参照ください。

```
root: ＜ほげほげ＞/keter    ## 上で作ったKeterの起動ディレクトリ
nginx:
  start:
    - systemctl
    - start
    - nginx.service
  reload:
    - systemctl
    - reload
    - nginx.service
```


つづいて、Keterのsystemd用のファイル(/usr/lib/systemd/system/keter.service)を準備します。

```
[Unit]
Description=Keter Deployment Handler
After=local-fs.target network.target

[Service]
ExecStart=/＜Keterをインストールしたディレクトリ＞/keter /＜Keterの起動ディレクトリ＞/etc/keter.yaml

[Install]
WantedBy=multi-user.target
```


最後にnginxのProxyの設定(/etc/nginx/nginx.conf)を変更します。

```
http {
    server {
        server_name  www.<かっこいいドメイン>.com;    ## プロジェクトのドメインに変更
        location / {
            proxy_pass http://localhost:<Yesodのポート番号>;    ## Proxyの設定を追加
        }
    }
}
```


## Keter起動！

起動します。

```
# systemctl start keter.service
```


うまく行っていれば、設定したドメインでアクセスできるかと思います。


OS起動時に自動で起動するようにするのは、こちらです。

```
# systemctl enable keter.service
```


### 参考

[Yesod Deployments with Keter](https://pbrisbin.com/posts/yesod_deployments_with_keter/)  
[Deploying your Webapp](http://www.yesodweb.com/book/deploying-your-webapp)


