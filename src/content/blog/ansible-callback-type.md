---
title: AnsibleのCallbackプラグインのCALLBACK_TYPEについて
slug: ansible-callback-type
date: 2017-07-13
updated:
tags:
  - Ansible
description: "AnsibleのCallbackプラグインを書くときのCALLBACK_TYPEについてです。"
---

AnsibleのCallbackプラグインを書くときの`CALLBACK_TYPE`についてです。

Ansible 2.0以降で、Callbackプラグインを書くときは、`CALLBACK_VERSION`と`CALLBACK_NAME`の設定が必須になっています。

それ以外で、`CALLBACK_TYPE` も設定できるのですが、どんな設定ができるのか（一覧はないものの、）慣例となっているものと整理したいと思います。

<!--more-->

## `stdout`

デフォルトの標準出力をこのCallbackプラグインで上書きします。`CALLBACK_TYPE`が`stdout`のプラグインを複数読み込もうとした場合、最初に読み込まれたものが有効になります。

[参考になるCallbackプラグイン](https://github.com/ansible/ansible/blob/devel/lib/ansible/plugins/callback/oneline.py)

## `notification`

Playbookの実行の状況や結果をどこかに通知するプラグインに使われるタイプ。

[参考になるCallbackプラグイン](https://github.com/ansible/ansible/blob/devel/lib/ansible/plugins/callback/slack.py)

## `aggregate`

Playbookの実行結果などを集計したりするプラグインに使われるタイプ。

[参考になるCallbackプラグイン](https://github.com/ansible/ansible/blob/devel/lib/ansible/plugins/callback/logstash.py)

## まとめ

`stdout`以外は、挙動に影響することはなさそうですので、ぶっちゃけ好きな名前を付けても良いのかなぁとおもいます。
