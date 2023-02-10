---
title: HaskellでSNMP Trapを投げる
slug: send-snmptrap-using-haskell
date: 2014-06-29
updated:
tags:
    - Haskell
    - SNMP
description: "Haskellには、SNMP Trapを送信するライブラリがないですかね。ということで、簡単なものだけ作ってみました。"
---

Haskellには、SNMP Trapを送信するライブラリがないですかね。

ということで、簡単なものだけ作ってみました。

目指したものとしては、



	
  1. 送信したいSNMP Trapを複数定義した設定ファイルを読み込む

	
  2. SNMP Trapの定義ごとにSNMP Trapのパケットを組み立てる

	
  3. SNMP Trapの定義ごとにスレッドを立てて、SNMP Trapを送信する（指定した間隔で投げ続ける）


と言った感じです。

<!--more-->

＋＋＋

**1. 送信したいSNMP Trapを複数定義した設定ファイルを読み込む**

設定ファイルは iniファイル の形式で、作成します。

ライブラリは [ConfigFile](https://hackage.haskell.org/package/ConfigFile) を使用していきます。


```haskell
readConfig :: IO ConfigParser
readConfig =
  getCurrentDirectory
  >>= getDirectoryContents
  >>= return . head . filter ("config.ini" `isSuffixOf`)
  >>= readfile emptyCP
  >>= return . either (const emptyCP) id
```


ツールの実行ディレクトリと同じフォルダにある iniファイル を読み込んで、ConfigParserを返します。

今後、必要な変数などはこのConfigParserから取得していきます。

＋＋＋

**2. SNMP Trapの定義ごとにSNMP Trapのパケットを組み立てる**

SNMP TrapはASN1という規格でエンコードされます。

このエンコードには、[asn1-encoding](http://hackage.haskell.org/package/asn1-encoding) を使っていきます。

今回は、簡単に、ということで、v1のトラップで、bind変数もstringを1つだけ、、ということでやっていきます・・・（＞＿＜；）

```haskell
makeASN1TrapMsgs :: ConfigParser -> [SectionSpec] -> [B.ByteString]
makeASN1TrapMsgs _ [] = []
makeASN1TrapMsgs cp (s:ss) = (B.concat $ BL.toChunks $ encodeASN1 DER (makeASN1TrapData cp s)) : makeASN1TrapMsgs cp ss
```

複数のSNMP Trapを定義するということで、iniファイルのセクションごとに、SNMP Trapを定義して、セクションごとにSNMP Trapのメッセージを組み立てていきます。

encodeASN1は遅延評価されますが、後の送信処理のところでは正格評価されるので、ここで変換しておきます。

```haskell
makeASN1TrapData :: ConfigParser -> SectionSpec -> [ASN1]
makeASN1TrapData cp sec | version == "1" = asn1Trap1Data cp sec
                        | otherwise = [Null]
  where version = forceEither $ get cp sec "snmp_version"
```

今回は、v1のみ対応ということで。。

設定値は、forceEitherで取っていきます。iniファイルの設定はちゃんと出来ているということで。。

```haskell
asn1Trap1Data :: ConfigParser -> SectionSpec -> [ASN1]
asn1Trap1Data cp sec = [ Start Sequence                   -- SNMP packet start
                       , IntVal 0                         -- SNMP version: version-1
                       , OctetString community            -- SNMP community
                       , Start (Container Context 4)      -- SNMP trap pdu v1 start
                       , OID enterpriseId                 -- Enterprise OID
                       , Other Application 0 agentAddress -- Agent Address
                       , IntVal genericTrap               -- Generic trap
                       , IntVal specificTrap              -- Specific trap
                       , Other Application 3 timeTicks    -- Time ticks
                       , Start Sequence                   -- Variable binding list start
                       , Start Sequence                   -- 1st variable binding start
                       , OID varbindOid                   -- Object name
                       , OctetString varbindMsg           -- Value
                       , End Sequence                     -- 1st variable binding end
                       , End Sequence                     -- Variable binding list end
                       , End (Container Context 4)        -- SNMP trap pdu v1 end
                       , End Sequence                     -- SNMP Packaet end
                       ]
  where community = C.pack $ forceEither $ get cp sec "snmp_community"
        enterpriseId = map (\s -> read s :: Integer) $ dropWhile (=="") $ splitOn "." $ forceEither $ get cp sec "enterprise_oid"
        agentAddress = B.pack $ map (\s -> read s :: Word8) $ splitOn "." $ forceEither $ get cp sec "agent_ip_address"
        genericTrap = read (forceEither $ get cp sec "generic_trap") :: Integer
        specificTrap = read (forceEither $ get cp sec "specific_trap") :: Integer
        timeTicks' = read (forceEither $ get cp sec "time_stamp") :: Integer
        timeTicks = case timeTicks' of
          0 -> B.pack [0]
          _ -> B.dropWhile (==0) $ encode timeTicks'
        varbindOid = map (\s -> read s :: Integer) $ dropWhile (=="") $ splitOn "." $ forceEither $ get cp sec "varbind_oid"
        varbindMsg = C.pack $ forceEither $ get cp sec "varbind_msg"
```

SNMP Trapのパケットを組み立てていきます。

SNMP Trapのパケットの構造は、RFCや、パケットキャプチャを参照いただくとして、その構造に合わせて、ASN1のリストを作っていきます。

ASN1は、＜データの型＞、＜データの長さ＞、＜データ本体＞の形式でエンコードされます。そのため、複数のデータをまとめる型の場合、その開始と終了を明示する必要があります。

各設定値は、ConfigParserからゴリゴリ読み込んでいきます。

＋＋＋

**3. SNMP Trapの定義ごとにスレッドを立てて、SNMP Trapを送信する**

SNMP Trapの送信は [network](http://hackage.haskell.org/package/network) を使っていきます。

また、SNMP Trapの定義ごとに別スレッドを立てていくのには、[Control.Concurrent](https://hackage.haskell.org/package/base-4.7.0.0/docs/Control-Concurrent.html) を使います。

```haskell
sendTrap :: ConfigParser -> [B.ByteString] -> [ThreadId] -> IO [ThreadId]
sendTrap _ [] ts = return ts
sendTrap cp (msg:msgs) ts = do
  thread <- forkIO $ sendTrapBy intval server msg
  sendTrap cp msgs (thread:ts)
  where intval = read (forceEither $ get cp "DEFAULT" "trap_send_interval") :: Int
        server = forceEither $ get cp "DEFAULT" "server_ip_address"
```

Control.ConcurrentのforkIOを使ってSNMP Trapの定義ごとにスレッドを起動してきます。

```haskell
sendTrapBy :: Int -> String -> B.ByteString -> IO ()
sendTrapBy intval server trap = do
  sendTrapTo server trap
  threadDelay (intval * 1000)
  sendTrapBy intval server trap
```

threadDelayを使って、SNMP Trapを定期的な間隔で送信していきます。

```haskell
sendTrapTo :: String -> B.ByteString -> IO ()
sendTrapTo server trap = withSocketsDo $ do
  addrs <- getAddrInfo Nothing (Just server) (Just "snmptrap")
  let addr = head addrs
  sock <- socket AF_INET Datagram defaultProtocol
  bind sock (SockAddrInet aNY_PORT iNADDR_ANY)
  connect sock (addrAddress addr)
  sendAll sock trap
  close sock
```

送信処理は、送信先サーバの情報を設定から取得し、UDPで接続するソケットを作成します。

送信元IPとポートは自動で割り当てにして、接続したら、組み立てたパケットを送信して、ソケットクローズです。

```haskell
waitLoadTime <- loadTime cp
when waitLoadTime $ mapM_ killThread sendTrapThreads
```

SNMP Trapの送信処理は、指定した時間経過したら終了するようにするため、

killThreadで停止していきます。

＋＋＋

SNMP Trapを送信するには、いろいろ決めないと行けないので、設定情報を作るのも結構面倒ですね。

ただ、監視の仕組みを導入するときは、性能などを確認するために、負荷ツールが必要になってくるので、どうやったら、楽になるかなぁと考えつつ、改良してみようかなと思います。

***

追記:  

ソースは[こちら](https://github.com/IMOKURI/snmptrapper)にあります。

