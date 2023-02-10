---
title: Neovim のプラグインで Python の自動インポートをなんとかした。
slug: neovim-plugin-python-auto-import
date: 2022-05-26
updated:
tags:
    - Neovim
    - Python
description: "Telescopeを使ってPythonの自動インポートを作ってみました。"
---

Neovim で Python の自動インポートを実現するプラグインは実はあまりなかったんです。(諸説あります)

[CoC](https://github.com/neoclide/coc.nvim) を使っているものは見つかったのですが、
私は、CoCを使ってなかったんです。。

私の想いに一番近そうだったのが、[apyrori.nvim](https://github.com/tjdevries/apyrori.nvim)でした。

> When you're working on a large project, you've probably imported the thing you want to import somewhere before.
> This plugin simply looks at all the places you've imported the word under your cursor,
> picks the most likely (A.K.A. most frequent) import and adds that to the top of your file.
>
> 大きなプロジェクトで作業しているとき、インポートしたいものを以前どこかでインポートしたことがあるのではないでしょうか。
> このプラグインは、カーソルの下にある単語をインポートしたすべての場所を調べ、
> 最も可能性の高い（つまり最も頻繁にインポートした）ものを選び、それをファイルの先頭に追加するだけです。

これだ！

さっそく、インストールしてみたのですが、う、動かない。。

あ、あと、もう少し機能がほしい。。

そろそろ、Lua でプラグインを書いてみたいと思っていたんだよな。。


ということで、このプラグインを fork して、改良することにしました。


こちら [IMOKURI/apyrori.nvim](https://github.com/IMOKURI/apyrori.nvim) です。


とりあえずの目標として、以下を目指しました。

- 動く。
- 複数候補があったときは、[Telescope](https://github.com/nvim-telescope/telescope.nvim) で あいまい検索したい。
- 候補がなかったとき用に、デフォルトの インポート文 を設定しておきたい。
- デフォルトのインポート文になくても、 Telescope で入力した インポート文 をそのまま、追加したい。

これだけあれば、個人的には、実用性があります。

試行錯誤の上、上記の機能は実装できました。 パチパチ 👏

Telescope の実装は複雑で、いくつかの Extension を見ただけでは、どう実装していいか、何もわからなかったのですが、
本家のレポジトリに、丁寧に [Developers Guide](https://github.com/nvim-telescope/telescope.nvim/blob/master/developers.md) があり、
これで完全勝利しました。

このプラグインではインポート文が追加される場所は、基本的に import が書かれている場所の末尾に追記していくように、
なっているので、追記されたあとで、formatter (isort など) で並び順は修正するのが良いと思います。
なので、プラグインとして、適切な場所に追記するところまでは実装しないでいいかなと思っています。

複数行のインポート文については、現状、未対応なのですが、シンプルな形で、対応することを目指したいと思います。
シンプルな形とは、複数行のインポート文すべてを追記するのではなく、必要な部分のみの追記に留める、を考えています。

プラグインのテスト用の環境を用意するために、以下のページがとても参考になりました。 🙏

> [Neovimプラグインで不具合報告するのに便利な再現環境用minimal vimrcの作り方](https://zenn.dev/yutakatay/articles/neovim-minimal-config)

今は、手動で動作確認をしているのですが、テストの自動化が可能かも調べてみたいと思います。


さ、これで、Python のコードを書く環境が、また一段と整ったので、そろそろ、Kaggle のコンペにまた挑戦しよう。
