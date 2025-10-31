---
title: Alpine Linuxでインフラ構築・検証に必要なサーバ機能を揃えておく。
slug: build-servers-by-alpine-linux
date: 2016-09-08
updated:
tags:
  - Linux
description: "デスクトップ上の仮想マシンで、ちょっと検証したいということが、よくありますよね。"
---

デスクトップ上の仮想マシンで、ちょっと検証したいということが、よくありますよね。

そんな時に、NTPサーバとか、DNSサーバとか、はたまたLDAPサーバとかが、
欲しくなったりすることもよくあります。

だからと言って、Ubuntuとか、CentOSとかでガッツリ作ってしまうと、
それで、デスクトップPCのリソースを食ってしまって、やりたかった検証が
スムーズに行かない、ってことになりがちです。（私のこと）

そこで、最近コンテナ向けに流行っている？軽量LinuxのAlpine Linuxを
使ってこれらを構築してしまいたいともいます。

そのサイズ、なんとメモリ256MB、DISK8GB！お買い得！（違

<!--more-->

Alpine Linuxのインストールについては、[こちら](http://qiita.com/syui/items/7851423ddc132b751fa3)や[こちら](http://blog.stormcat.io/entry/alpine-entry-setup)を参照いただくとして。

## NTP Server (chrony)

NTPサーバはchronyを使います。デスクトップ環境ということで、頻繁に停止起動されることを想定し、時刻同期が断続的でもよく機能するchronyを使います。（参照：[ntpd と chronyd の違い](https://access.redhat.com/documentation/ja-JP/Red_Hat_Enterprise_Linux/7/html/System_Administrators_Guide/ch-Configuring_NTP_Using_the_chrony_Suite.html#sect-differences_between_ntpd_and_chronyd)）

設定ファイル(/etc/chrony/chrony.conf)は以下の様な感じにしました。

```
server xxx.xxx.xxx.xxx
initstepslew 10 xxx.xxx.xxx.xxx
commandkey 10
keyfile /etc/chrony/chrony.keys
driftfile /var/lib/chrony/chrony.drift

allow yyy.yyy.yyy.yyy/zz
```

xxx.xxx.xxx.xxxには同期先のサーバ、yyy.yyy.yyy.yyy/zzには同期元のサーバ群がいるローカルのネットワークを指定します。

## DNS Server (unbound)

DNSサーバはunboundを使います。zone設定含め、1ファイルで完結するので、小規模環境に向いています。

設定ファイル(/etc/unbound/unbound.conf)では、以下の様な内容を設定しました。

```
server:
        local-zone: "imokuri.local." static

        local-data: "hostpc.imokuri.local. IN A 192.168.183.1"
        local-data: "gateway.imokuri.local. IN A 192.168.183.2"

        local-data-ptr: "192.168.183.1 hostpc.imokuri.local."
        local-data-ptr: "192.168.183.2 gateway.imokuri.local."

forward-zone:
        name: "."
        forward-addr: 192.168.183.2

```

serverセクションでは、ローカルの環境の名前解決の設定を、それ以外のものについては、forward-zoneに転送するように設定しています。

## LDAP Server (openldap)

ユーザ管理にopenldapを使います。小規模環境なので、バックエンドも何も考えずにbdbを使います。インストールしたパッケージは、openldap, openldap-back-bdb, openldap-clientsです。

/etc/openldap/slapd.confでは、必要なスキーマをインクルードし、databaseはbdbを使用など、設定します。

/var/lib/openldap/openldap-data/DB_CONFIGをサンプルをコピーして準備しておきます。

ここまでできたらslapdを起動し、必要な情報をLDIFファイルを作成して、流し込んでいきます。

> LDAPはまた元気なときに詳細をまとめよう。

## Forward Proxy Server (tinyproxy)

最後はProxyです。Forward Proxyといえば、Squid？ですが、小規模環境ということで、お手軽、ミニマムなtinyproxyを使います。

設定ファイル(/etc/tinyproxy/tinyproxy.conf)では、Proxyを使用しないローカルのアドレスと、それ以外を転送する上位のProxyがあれば、それを設定します。接続を許可するネットワークも設定しておきます。

```
no upstream ".imokuri.local"
no upstream "192.168.183.0/24"
upstream proxy.example.com:8080
Allow 192.168.183.0/24
```

## 終わりに

これで、何か検証のため、サーバを作るとなっても、ホスト名のドメインどうしよう、、とか迷わずに済みますね。

他に、あれば、助かるものあるかなぁ。メールサーバとかかなぁ。
