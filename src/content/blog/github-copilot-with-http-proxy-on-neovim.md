---
title: GitHub Copilot を Neovim で HTTP Proxy 環境下でセットアップ
slug: github-copilot-with-http-proxy-on-neovim
date: 2023-05-15
updated:
tags:
  - GitHub
  - Neovim
description: "課金したぞ。"
---

GitHub Copilot を Neovim で HTTP Proxy 環境下でセットアップしました。

## プラグイン

オフィシャルのプラグインが [こちら](https://github.com/github/copilot.vim) です。
ので、こちらをインストールしつつ、 `http_proxy` を使う場合は、[グローバル変数の設定](https://github.com/github/copilot.vim/blob/1358e8e45ecedc53daf971924a0541ddf6224faf/doc/copilot.txt#L78-L83)が必要です。

```lua
    {
        "github/copilot.vim",
        event = {
            "CmdlineEnter",
            "InsertEnter",
        },
        config = function()
            if os.getenv("http_proxy") ~= nil then
                local proxy_url = os.getenv("http_proxy") --[[@as string]]
                proxy_url = string.gsub(proxy_url, "^[^:]+://", "")
                proxy_url = string.gsub(proxy_url, "/$", "")

                vim.g.copilot_proxy = proxy_url
            end
        end,
    },
```

## セットアップ

次に、認証のため、 `:Copilot setup` を叩くのですが、
私は、 [Noice](folke/noice.nvim) を使っていたのと、
リモートのコマンドラインの環境で、直接ブラウザが起動できない環境だったので、
以下のように、頑張りました・・・

- `:Copilot setup` を叩く
- Noice で一瞬表示される One Time コードをメモる
- `Enter` を叩く (ここで、可能ならブラウザが起動する。けど、今回は失敗する)
- 別途ブラウザを起動し、 `https://github.com/login/device` にアクセスする
- One Time コードを入れる
- Neovim で (必要なら `Enter` を叩くと?) ログイン成功となる

## おわりに

私は、機械学習のコードを python で書くことが多いのですが、
どのくらい Copilot が活躍してくれるのか楽しみです。

が、 Copilot をうまく使うためのプロンプトのコツをまだ知らないので、
それからかな。
