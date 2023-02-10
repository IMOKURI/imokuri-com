---
title: git pushの出力がstderrであることの弊害
slug: git-push-output-is-stderr
date: 2016-01-15
updated:
tags:
    - Git
    - GitHub
    - CI
description: "git pushなどの出力は標準エラー(stderr)であることを最近知りました。。"
---

git pushなどの出力は標準エラー(stderr)であることを最近知りました。。なぜstderrなのか、は過去[こちら](http://git.661346.n2.nabble.com/git-push-output-goes-into-stderr-td6758028.html)でも話題となったようです。端的に言うと、「プログラムの実行結果の出力ではなく、実行の過程での出力だから」といった感じかと思います。

では、それで何がまずいのかですが。

<!--more-->

CIツール(Travis CIなど)で、プログラムをビルドして、Githubにpushしたりすることがあります。その際、CIツールがpushできるようにGithubのTokenを使います。そのTokenがあると、そのTokenに許可しているアクセス(レポジトリのmasterへのpushなど)ができるわけです。CIツールのビルドのログは、公開されているものも多いので、Tokenのような情報は、見えないように暗号化したり、grepで表示から除外したりする必要があります。

CIツールがTokenを使ってpushするためには、以下のように、remoteのURLにTokenを埋め込む必要があります(XXXXXXXXのところ)。

* レポジトリのURL： `https://github.com/IMOKURI/IMOKURI.github.io.git`
* Token付きのURL： `https://XXXXXXXXXXXXXXXXXXXX@github.com/IMOKURI/IMOKURI.github.io.git`

実際に、CIツールがpushすると、その出力は、以下のようになります。

```
Counting objects: 10, done.
Delta compression using up to 16 threads.
Compressing objects: 100% (4/4), done.
Writing objects: 100% (4/4), 397 bytes | 0 bytes/s, done.
Total 4 (delta 3), reused 0 (delta 0)
To https://XXXXXXXXXXXXXXXXXXXX@github.com/IMOKURI/IMOKURI.github.io.git
   58151bd..fa3c03d  master -> master
```

見えてます。。Tokenが。。

ということで、Tokenを隠そうと、 `git push origin master | grep -v http` のように、うっかり単にgrepをしてしまうと、、除外できません。。git pushの出力はstderrなのです。。

なので、 `git push origin master 2>&1 | grep -v http` のような感じでstderrをstdoutに入れてあげましょう。。

もし、うっかりしてしまった場合は、Tokenの再発行をして、CIツールの設定を更新するのが良さそうです。
