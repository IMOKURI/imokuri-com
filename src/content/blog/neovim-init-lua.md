---
title: Neovim で init.lua をコンフィグに使う
slug: neovim-init-lua
date: 2020-12-07
updated: 2021-09-20
tags:
  - Neovim
description: "Neovim で init.lua をユーザーコンフィグとして使えるようになりました。"
---

最近、Neovim で `init.lua` を `init.vim` の代わりに使えるようになりました。

[add init.lua as an alternative user config](https://github.com/neovim/neovim/pull/12235)

注意点として、 `init.vim` と `init.lua` を両方同時に使うことはできません。
(`Conflicting configs: "init.lua" "init.vim"` というメッセージが表示され、どちらも読み込まれません。)

すでに、 `init.lua` でコンフィグを書かれているレポジトリも GitHub にありますので、
チャレンジしてみたい方は参考にできます。(私)

- https://github.com/glepnir/nvim
- https://github.com/numToStr/dotfiles/blob/master/neovim/.config/nvim/init.lua

今日のネタはこれだけです。すみません。

---

Neovimの設定をluaで書いてみようと思ったら、以下がとても参考になります。
~~私は書くネタがなくなりました。~~

- [NeovimとLua](https://zenn.dev/hituzi_no_sippo/articles/871c06cdbc45b53181e3)
- [Getting started using Lua in Neovim(日本語)](https://github.com/willelz/nvim-lua-guide-ja/blob/master/README.ja.md)

---

2021/9/20

私もついに、 `init.lua` への移行が完了しました！めでたい！パチパチ

https://github.com/IMOKURI/dotfiles/blob/master/config/nvim/init.lua
