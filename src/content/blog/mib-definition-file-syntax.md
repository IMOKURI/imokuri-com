---
title: MIB定義ファイルの構成
slug: mib-definition-file-syntax
date: 2012-11-18
updated:
tags:
    - SNMP
    - MIB
description: "MIB定義ファイルのフォーマットについてまとめです。ここでは、SNMPv2をベースにしています。"
---

新しい機器を導入するとき、MIB定義ファイルを監視用サーバにロードするかと思います。

そのMIB定義ファイルのフォーマットについてまとめです。ここでは、SNMPv2をベースにしています。

今回は「IPV6-MIB」をロードすることを例に、おさらいしていきます。

<!--more-->

まず、MIB定義ファイルの中では、



	
- 各行の「--」から行末まではコメント
- 定義の開始は「<定義するMIBの名前> DEFINITIONS ::= BEGIN」
- 定義の終わりは「END」
- 1つのMIB定義ファイルに定義できるMIB(BEGIN～END)は1セット
複数の場合はファイルを分割


次にIPV6-MIBでは、IMPORTS句(～セミコロン(;)まで)があり、いくつかの外部宣言された定義(カンマ区切り)とそれらがどのMIB定義ファイルに定義されているか(FROM SNMPv2-SMIとか)、が書かれています。

これらのMIB定義ファイルがIPV6-MIBをロードする前にロードしておく必要があるものになります。

次にipv6MIBが定義されています。SMI-V2ではIMPORTS句のあと、MODULE-IDENTITY句の宣言が必要になります。この宣言の名前(ここではipv6MIB)は以下のルールがあります。

	
- 小文字の英字で始まる
- 英数字のみ可
- 記号不可
- 一意である


このMODULE-IDENTITY句の中では以下の属性が、以下の順番で必須の記載内容になります。各属性の値はダブルクオーテーションで囲う必要があります。

	
- LAST-UPDATED
- ORGANIZATION
- CONTACT-INFO
- DESCRIPTION


また、以下の属性のセットを任意で追加していくことができます。

	
- REVISION
- DESCRIPTION


最後の「::= { mib-2 55 }」は、ipv6MIBの識別子が、「mib-2 55」であることを表します。

mib-2は「.1.3.6.1.2.1」ですので(SNMPv2-SMIより)、ipv6MIBは「.1.3.6.1.2.1.55」となります。

続いて、ipv6MIBObjectsが定義されています。ipv6MIBObjectsの識別子が「ipv6MIB 1」、すなわち「.1.3.6.1.2.1.55.1」であることを表します。

次はipv6Forwardingです。OBJECT-TYPE句を使用して、オブジェクトを定義しています。OBJECT-TYPE句では、以下の属性が、以下の順で必須となります。

	
- SYNTAX
- MAX-ACCESS
- STATUS
- DESCRIPTION


まず、SYNTAXは、オブジェクトのデータ構造を表し、ここではINTEGER{ forwarding(1), notForwarding(2) }となっており、整数の列挙型を表しています。取りうる値はforwarding(値としては1)もしくはnotForwarding(値としては2)となります。

オブジェクトのデータ構造は多数あるため、また機会があれば、まとめてみようと思います。

MAX-ACCESSでは、オブジェクトのアクセス権を表し、以下の値を指定できます。

	
- not-accessible
- accessible-for-notify
- read-only
- read-write
- read-create


STATUSはオブジェクトの状態を表します。以下の値を指定できます。

	
- current
- obsolete
- deprecated


DESCRIPTIONはダブルクオーテーションで囲みます。

最後に識別子として「ipv6MIBObjects 1」が定義されています。

OBJECT-TYPE句について、同様の定義が続きますので、説明していないことを中心に続けます。

ipv6DefaultHopLimitでは、値が与えられなかった時のデフォルト値がDEFVALの属性で与えられています。

ipv6IfTableはテーブル型のオブジェクトとして定義されています(SYNTAX    SEQUENCE OF Ipv6IfEntry)。テーブルを構成するのはIpv6IfEntryの型を持つメンバー(ここでは、インターフェース)になります。

Ipv6IfEntryの型をもつメンバー(ここでは、インターフェース)にどんな情報が含まれるかは、少し後に定義されています(Ipv6IfEntry ::= SEQUENCE { ～ })。 このメンバーの定義の名前(Ipv6IfEntry)は英字の大文字で始まることに注意します。

一つ前に、ipv6IfEntryが定義されています。この中にINDEXという属性があります。ipv6IfEntryのデータ構造は前述の通り、幾つかの情報が含まれているため、その内のどれを使って、ipv6IfEntryを識別するか、をINDEX属性で定義します。

ipv6IfEffectiveMtuではUNITS属性が使われています。これはデータ構造の単位になります。

ipv6IfStatsEntryにAUGMENTS属性があります。これは、AUGMENTS属性で指定された値(ここでは、ipv6IfEntry)のINDEX属性の値をipv6IfStatsEntryのINDEX属性として使用することを意味します。

ここまで、OBJECT-TYPE句についてでした。

だいぶ最後の方まできまして、ipv6IfStateChangeがNOTIFICATION-TYPE句で定義されています。NOTIFICATION-TYPE句は、SNMP通知(trap)についての定義になります。STATUS属性とDESCRIPTION属性は必須になります。

OBJECTS属性は必須ではありませんが、OBJECTS属性で設定した値をSNMP通知に含めることができます。

ipv6ComplianceがMODULE-COMPLIANCE句で定義されています。MODULE-COMPLIANCE句は、MIBモジュールを利用するときに最低限必要になる内容を定義しています。以下の属性が必須となります。

	
- STATUS
- DESCRIPTION
- MODULE


実際に、MODULE属性の中で、対象となるグループ(MANDATORY-GROUPS)と最低限要求される内容(OBJECT配下)について定義されます。MANDATORY-GROUPSの値となっているグループは、後続にOBJECT-GROUP句とNOTIFICATION-GROUP句でそれぞれ定義されます。

IPV6-MIBを例に、ひと通り、MIB定義ファイルの構成をおさらいしました。

MIB定義ファイルはロードしようとした時に、何かエラーになった。。ということがありがちなので、困ったらまた振り返ろうと思います。

参考：

- [RFC2578](http://tools.ietf.org/html/rfc2578)
- [RFC2580](http://tools.ietf.org/html/rfc2580)
