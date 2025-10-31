---
title: Neovimでvirtualenvを使うときのpython_host_progの設定
slug: neovim-python-virtualenv
date: 2017-07-03
updated:
tags:
  - Neovim
  - Python
description: "neovimでpythonのvirtualenvを使うときのpython_host_progの設定についてです。"
---

neovimでpythonのvirtualenvを使うときの`python_host_prog`の設定についてです。

neovimで補完などを有効化する場合、pythonのneovimパッケージをインストールしていると思いますが、デフォルトでvirtualenvを作ると、そのneovimパッケージが入っていません。

そこで、neovimパッケージをvirtualenvにインストールして、`python_host_prog`にvirtualenvのpythonを指定するのが一般的かと思います。[参考](https://github.com/zchee/deoplete-jedi/wiki/Setting-up-Python-for-Neovim)

しかし、この方法だと、pythonの仮想環境を作る度に、neovimパッケージをインストールする手間が発生してしまいます。

そこで、virtualenvを作成したときのデフォルトのパッケージにneovimなどを追加するようにし、`python_host_prog`には、現在のvirtualenvのpythonが指定されるようにしたいと思います。

<!--more-->

## virtualenv作成時のデフォルトのパッケージ追加

まず、追加したいパッケージをあるディレクトリにインストールします。この時、python2用とpython3用の両方を準備しておくのが良いと思います。

```bash
# python2用のディレクトリ作成
mkdir -p ~/.virtualenvs/deps

# python3用のディレクトリ作成
mkdir -p ~/.virtualenvs/deps3

# デフォルトでvirtualenvに追加したいパッケージをインストール(python2)
pip2 install -U --target ~/.virtualenvs/deps <インストールしたいパッケージ(neovim jedi flake8など)>

# デフォルトでvirtualenvに追加したいパッケージをインストール(python3)
pip3 install -U --target ~/.virtualenvs/deps3 <インストールしたいパッケージ(neovim jedi flake8など)>
```

次に、virtualenv作成時に、これらのパッケージも参照するように設定します。以下のように `~/.virtualenv/postmkvirtualenv` を編集します。

```bash
# find directory
SITEDIR=$(virtualenvwrapper_get_site_packages_dir)
PYVER=$(virtualenvwrapper_get_python_version)

# create new .pth file with our path depending of python version
if [[ $PYVER == 3* ]];
then
    echo "$HOME/.virtualenvs/deps3/" > "$SITEDIR/extra.pth";
else
    echo "$HOME/.virtualenvs/deps/" > "$SITEDIR/extra.pth";
fi
```

これでvirtualenv作成時に、上記でインストールしたパッケージも読み込まれます。

## neovimの`python_host_prog`の設定

続いて、neovimで、virtualenvが有効な場合は、virtualenvのpythonを参照するように指定します。

```vim
let g:python_host_prog = '/usr/bin/python2'
let g:python3_host_prog = '/usr/bin/python3'

if exists("$VIRTUAL_ENV")
  if !empty(glob("$VIRTUAL_ENV/bin/python3"))
    let g:python3_host_prog = substitute(system("which python"), '\n', '', 'g')
  else
    let g:python_host_prog = substitute(system("which python"), '\n', '', 'g')
  endif
endif
```

---

[参照](http://www.pygopar.com/how-to-add-default-packages-to-a-virtualenv/)
