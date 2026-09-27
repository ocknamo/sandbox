## 14-1

2026年7月、COLDCARDのfirmwareの不具合でシードの生成が弱くなっていたことが公表されました。ハードウェアの乱数発生器を使うべきところで、弱いソフトウェアの乱数が使われる経路があり、攻撃者が対応する秘密鍵をオフラインで再現して資金を盗む被害が起きています。

<!-- more -->

より深刻だったのは旧型のMk2/Mk3ですが、修正版より前にMk4・Mk5・Qで作ったシードも対象です。修正版はMk2/Mk3が4.2.0以降、Mk4/Mk5が5.6.0以降、Qが1.5.0Q以降です。対象のシードは、修正版で新しく作ったシードへ資金を移す必要があります。

出典: https://coldcard.com/security/status
出典: https://coldcard.com/security/migrate
関連: 14-2, 14-4, 14-5, 14-6
更新: 2026-09-27
タグ: 時点依存・実装依存

## 14-2

いいえ。原因はシードを作るときの乱数の実装の不具合で、端末がインターネット越しに乗っ取られたわけではありません。攻撃者は、弱い乱数から作られ得るシードを手元で計算し、秘密鍵を再現して資金を動かしました。

出典: https://coldcard.com/security/status
関連: 14-1, 14-3
更新: 2026-09-27
タグ: 誤前提・実装依存

## 14-3

秘密鍵の安全性は、攻撃者が試さなければならない候補の数で決まるからです。乱数が弱くて実際の候補が少なければ、攻撃者は候補のシードを全部作ってみて、ブロックチェーン上で残高のあるアドレスと照らし合わせることができます。

出典: https://milksad.info/
関連: 5-32, 14-7, 14-12
タグ: 安定

## 14-4

いいえ。アップデートで直るのはこれから作るシードだけで、すでに弱い乱数で作ったシードは弱いままです。COLDCARD自身も、アップデートは既存のシードを修復しないとしています。新しく作ったシードへ資金を移してください。

出典: https://coldcard.com/security/status
出典: https://coldcard.com/security/migrate
関連: 14-1, 14-14
更新: 2026-09-27
タグ: 時点依存・実装依存

## 14-5

条件によります。COLDCARDの告知では、公平で独立した、誰にも見られず記録もしていないサイコロを50回以上振って加えていれば、少なくとも128ビット分の乱数が足されているため、この乱数の問題だけでは危険とはみなさないとしています。回数が足りない場合や条件が確かでない場合は、移行してください。

出典: https://coldcard.com/security/status
出典: https://coldcard.com/security/migrate
関連: 14-1, 5-31
更新: 2026-09-27
タグ: 時点依存・実装依存

## 14-6

強くて推測されにくいpassphraseは、攻撃者が探さなければならない範囲を広げるので、資金を使われるまでの壁にはなります。ただし、弱いシードそのものを直すものではありません。COLDCARDは、passphraseを使っている人もできるだけ早く移行するよう勧めています。短い、あるいは推測しやすいpassphraseでは十分な守りになりません。

出典: https://coldcard.com/security/status
関連: 14-1, 14-18, 5-12
更新: 2026-09-27
タグ: 時点依存・実装依存

## 14-7

いいえ。ハッシュを通すと出力はでたらめに見えますが、元の入力になかった乱雑さ（エントロピー）を新しく作ることはできません。入力の候補が少なければ、攻撃者は同じハッシュを計算して候補を全部試せます。

出典: https://milksad.info/
関連: 14-3, 14-9
タグ: 安定

## 14-8

2023年に明らかになった事件です。Libbitcoin Explorer（bx）3.xのbx seedなどで作ったシードが弱く、攻撃者がその候補を探し出して、Bitcoinを含む複数のチェーンで資産が盗まれました。名前は、弱い乱数から作られたシードの最初の単語が「milk sad」だったことに由来します。

出典: https://milksad.info/disclosure.html
関連: 14-9, 14-10
タグ: 実装依存

## 14-9

256ビットの乱数を求められても、内部では32ビットの種（時刻）から始まるMersenne Twisterで乱数を作っていました。そのため、作られ得るシードは最大でも約43億通りしかなく、実用的な時間で全部を試せる状態でした（CVE-2023-39910）。

出典: https://milksad.info/disclosure.html
関連: 14-8, 14-10, 14-12
タグ: 実装依存

## 14-10

Mersenne Twisterはシミュレーションなど向けの暗号用ではない乱数生成器で、出力から内部の状態を推測されないようには作られていません。種が32ビットなど小さい場合は、候補を全部試されてしまいます。秘密鍵の生成には、OSが提供する暗号用の乱数を使うべきです。

出典: https://docs.python.org/3/library/random.html
出典: https://milksad.info/disclosure.html
関連: 14-9, 14-11
タグ: 安定

## 14-11

2022年に公開されたTrust Walletのブラウザ拡張機能で、WebAssembly側のウォレット生成が弱い乱数（Mersenne Twister）を使っていた問題がありました（CVE-2023-31290）。2023年に公表され、影響を受けたウォレットから実際に資産が盗まれています。

出典: https://milksad.info/disclosure.html
関連: 14-10, 14-8
タグ: 実装依存

## 14-12

作った時刻は、攻撃者がかなり狭い範囲に絞り込めるからです。種が時刻だけなら、その範囲の時刻を全部試せば秘密鍵の候補が出そろってしまいます。

出典: https://milksad.info/
関連: 14-3, 14-9
タグ: 安定

## 14-13

2013年8月、AndroidのJava版SecureRandomの不具合により、Android上の一部のBitcoinウォレットが、ECDSAの署名で同じ乱数（nonce）を繰り返し使ってしまうことが分かりました。これにより、秘密鍵が漏れる危険が生じました。

出典: https://bitcoin.org/en/alert/2013-08-11-android
関連: 14-14, 14-15
タグ: 実装依存

## 14-14

弱い乱数で作られた秘密鍵や、すでに漏れた署名は、アプリを更新しても安全にはならないからです。直った版で新しく作った鍵のアドレスへ資金を移す必要がありました。

出典: https://bitcoin.org/en/alert/2013-08-11-android
関連: 14-13, 14-4
タグ: 安定

## 14-15

ECDSAの署名には、1回ごとに秘密の乱数（nonce、k）を使います。同じkで違うメッセージに2回署名すると、2つの署名の式からkを求められ、そこから秘密鍵も計算できてしまいます。

出典: https://www.secg.org/sec1-v2.pdf
関連: 14-13, 4-16
タグ: 安定

## 14-16

Secure Elementを持たない古いTrezor（Model One、Model Tなど）では、端末を物理的に手に入れた攻撃者が、専門の機材で電圧を乱すなどの手法（fault injection）を使ってメモリの中身を取り出す研究が公表されています。取り出したものが暗号化されていても、短いPINなら総当たりで破られるおそれがあります。

出典: https://trezor.io/learn/security-privacy/personal-security-standards/security-threats-to-crypto-wallets-and-how-trezor-defends-against-them
関連: 14-17, 14-18, 14-19
タグ: 実装依存

## 14-17

条件がそろえば可能だという研究はあります。ただし、盗んだだけですぐ抜き取れるわけではなく、物理的な作業と専門の機材が必要です。長いPINや強いpassphraseを使えば、追加の守りになります。

出典: https://trezor.io/learn/security-privacy/personal-security-standards/security-threats-to-crypto-wallets-and-how-trezor-defends-against-them
関連: 14-16, 14-18
タグ: 実装依存

## 14-18

はい。passphraseは端末に保存されないので、十分に強いものを使えば、シードだけを抜き取られても資金にはたどり着けません。ただし、passphraseを忘れると自分でも復元できなくなります。

出典: https://trezor.io/learn/a/passphrases-and-hidden-wallets
関連: 5-12, 5-13, 14-6
タグ: 安定

## 14-19

いいえ。Secure Elementは物理的な攻撃への耐性を大きく高めますが、実装のバグ、電力や電磁波からの情報漏れ（サイドチャネル）、流通経路での改ざん、firmware、利用者の操作ミスまで、すべてを防ぐものではありません。

出典: https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/secure-elements-in-trezor-safe-devices
関連: 14-16, 5-4
タグ: 安定

## 14-20

2023年12月、Ledgerの元社員がフィッシングに遭い、npm（JavaScriptのパッケージ配布の仕組み）の公開権限が奪われました。その権限で悪意あるConnect Kitが配布され、それを使うサイトで、EVM系のチェーンの利用者に資産を奪う署名をさせる被害が出ました。

出典: https://www.ledger.com/blog/security-incident-report
関連: 14-21, 14-23
タグ: 実装依存

## 14-21

いいえ。Ledgerの説明では、ハードウェアやコードのリポジトリ、社内の基盤が侵入されたのではなく、npmのパッケージを公開する権限が悪用された事件です。ただ、利用者が端末の画面の内容を確かめずに署名すると、端末が安全でも被害は防げません。

出典: https://www.ledger.com/blog/security-incident-report
関連: 14-20, 14-23
タグ: 誤前提

## 14-22

いいえ。2020年に漏れたのは、通販とマーケティング用の連絡先（メールアドレス、一部は氏名・住所・電話番号）です。ハードウェアウォレットの秘密鍵が漏れた事件ではありません。ただし、漏れた情報を使ったフィッシングには注意が必要です。

出典: https://www.ledger.com/addressing-the-july-2020-e-commerce-and-marketing-data-breach
関連: 14-73
タグ: 誤前提

## 14-23

正規のソフトウェアそのものではなく、その部品（依存ライブラリ）、ビルドの環境、配布サーバ、アップデートの経路などに入り込んで、利用者のところへ悪意あるコードを届ける攻撃です。

出典: https://www.ledger.com/blog/security-incident-report
関連: 14-20, 14-24, 14-38
タグ: 安定

## 14-24

2018年、Copayが使っていたnpmのライブラリevent-streamの依存先に悪意あるコードが紛れ込みました。そのコードはCopayの特定の版だけで動き、残高の大きいウォレットの秘密情報を盗み出そうとするものでした。

出典: https://github.com/bitpay/copay/issues/9346
関連: 14-23
タグ: 実装依存

## 14-25

2018年12月以降、攻撃者がElectrumのサーバを立て、つないできた利用者に「アップデートが必要」という偽のメッセージを表示させました。案内されたリンクからマルウェア入りの偽Electrumを入れた利用者が、BTCを盗まれました。

出典: https://electrum.org/
関連: 14-26, 14-70
タグ: 実装依存

## 14-26

通常はできません。サーバは利用者の秘密鍵を持っていないので、勝手に署名できないからです。ただし、どのアドレスを持っているかが知られるプライバシーの問題や、偽の情報を見せてフィッシングに誘導される危険はあります。

出典: https://electrum.readthedocs.io/
関連: 14-25
タグ: 実装依存

## 14-27

2018年に見つかったBitcoin Coreの重大な脆弱性です。1つのブロックの中で同じ出力を二重に使うトランザクションを入れると、0.14.0〜0.16.2のノードを停止させられ、さらに0.15.0〜0.16.2では、決められた発行量を超えるコインを作れてしまう可能性がありました。

出典: https://bitcoincore.org/en/2018/09/20/notice/
関連: 14-28, 14-29
タグ: 実装依存

## 14-28

はい。悪用されていれば、決められた発行スケジュールの外でコインを作れた可能性がありました。Bitcoin Coreはこれを最も深刻な「Critical」の例として挙げています。

出典: https://bitcoincore.org/en/security-advisories/
関連: 14-27, 1-5, 13-26
タグ: 実装依存

## 14-29

公開されている情報では、mainnetで悪用された形跡は確認されていません。修正は2018年9月18日の0.16.3などで公開されました。

出典: https://bitcoincore.org/en/2018/09/20/notice/
関連: 14-27
タグ: 実装依存

## 14-30

あります。CVE-2015-20111は、UPnPのためのライブラリminiupnpcのバグで、同じローカルネットワーク上から遠隔でコードを実行される可能性がありました。UPnPは既定では無効で、修正は2016年の0.12で入っています。

出典: https://bitcoincore.org/en/2024/07/03/disclose_upnp_rce/
関連: 14-33
タグ: 実装依存

## 14-31

特別に作ったブロックで、Bitcoin Coreのスクリプト検証のuse-after-free（解放済みのメモリを使ってしまう不具合）を突き、ノードを遠隔で停止させられる問題でした。ただし攻撃には、正しいProof of Workを持つブロックが必要です。修正は2025年の29.0で入り、2026年5月に公開されました。

出典: https://bitcoincore.org/en/2026/05/05/disclose-cve-2024-52911/
関連: 14-33
更新: 2026-09-27
タグ: 実装依存

## 14-32

Bitcoin Core 31.0で入った-privatebroadcast（sendrawtransactionで送る取引をTorやI2P経由でだけ流す機能）のバグです。BIP324（v2）の接続に失敗してv1でつなぎ直すとき、Torを通らずに直接つないでしまい、送り手のIPアドレスが相手に見えることがありました。

<!-- more -->

2026年6月に告知され、31.1で修正されました。影響するのは、31.0で-privatebroadcastを有効にし、sendrawtransactionで送っていた場合です。sendtoaddressなどのウォレットのRPCは影響を受けません。プライバシーの問題で、コンセンサスの障害ではありません。

出典: https://bitcoincore.org/en/2026/06/06/privatebroadcast-ip-leak/
出典: https://bitcoincore.org/en/releases/31.1/
関連: 14-33
更新: 2026-09-27
タグ: 時点依存・実装依存

## 14-33

報告を受けると深刻度を4段階で判定し、修正を先にリリースしてから公開します。Lowは修正を含むメジャー版の2週間後に、MediumとHighは影響する最後の版のサポートが終わった2週間後（修正版からおよそ1年後）に公開します。公開の2週間前に件数と深刻度を予告します。Criticalは個別に対応するとされています。

出典: https://bitcoincore.org/en/security-advisories/
関連: 14-27, 14-31
タグ: 実装依存

## 14-34

そのような脆弱性の公表は、今回確認できた一次資料では見つかりませんでした。確認できたのは、LND 0.21.0でチャネルを閉じる処理に再編成（reorg）への保護が加わり、閉鎖を確定とみなすまでに3〜6承認を待つようになったことです。脆弱性として公表されたかどうかは、LNDのセキュリティアドバイザリで確認してください。

出典: https://github.com/lightningnetwork/lnd/blob/master/docs/release-notes/release-notes-0.21.0.md
出典: https://github.com/lightningnetwork/lnd/security/advisories
関連: 14-36, 6-18, 8-25
更新: 2026-09-27
タグ: 誤前提・要一次確認・実装依存

## 14-35

はい。Core Lightningでは過去に、悪意のあるピアから送られたメッセージでノードが停止する（DoS）実装の脆弱性が何度か見つかり、修正されています。対象の版と修正版は、Core Lightningのセキュリティアドバイザリで確認できます。

出典: https://github.com/ElementsProject/lightning/security/advisories
関連: 14-36
タグ: 実装依存

## 14-36

あります。commitment transaction、HTLC、force close、罰則（penalty）の処理などを誤る重大なバグがあると、最終的にオンチェーンで受け取るべきUTXOを取り戻せなくなる可能性があります。ノードの実装は最新に保つことが大切です。

出典: https://bitcoinops.org/en/topics/channel-commitment-upgrades/
関連: 8-19, 8-25, 14-37
タグ: 実装依存

## 14-37

mempoolでのトランザクションの置き換えを繰り返して、相手のHTLCのタイムアウトの取引などを押し出し続け、相手が期限内に資金を請求する機会を奪おうとする攻撃です。2023年に公表され、各実装で緩和策が入りました。

出典: https://bitcoinops.org/en/topics/replacement-cycling/
関連: 8-19, 3-8
タグ: 実装依存

## 14-38

改造品、開封済みの端末、偽のシードの紙が同梱されたもの、偽のfirmwareが入ったものなどに当たる危険が増えます。メーカーの公式ストアか正規販売店で買い、届いたら端末の真正性のチェックを行ってください。

出典: https://trezor.io/support/logistics/order-shipping-faq/where-to-buy-a-genuine-trezor-hardware-wallet
出典: https://trezor.io/guides/trezor-devices/trezor-safe-5/authenticate-trezor-safe-5
関連: 14-39, 14-71
タグ: 安定

## 14-39

そのシードは売り手や攻撃者も知っている可能性があり、入金したあと、いつでも署名して盗めるからです。シードは必ず、自分の手元の端末で新しく作ってください。

出典: https://trezor.io/support/logistics/order-shipping-faq/where-to-buy-a-genuine-trezor-hardware-wallet
関連: 14-38, 14-71
タグ: 安定

## 14-40

「コンセンサスのルールが破られたのか」「特定のソフトウェアのバグなのか」「取引所など預かり業者の鍵やシステムが破られたのか」「利用者のパスワードやシードが盗まれたのか」を順に確かめます。「Bitcoinがハッキングされた」と報じられる事件のほとんどは、Bitcoinのプロトコルそのものではなく、取引所やウォレット、利用者の側の問題です。

出典: https://bitcoincore.org/en/security-advisories/
関連: 1-47, 1-25, 14-61
タグ: 安定

## 14-41

Mt. Gox（2014年）、Coincheck（2018年、NEM）、Zaif（2018年）、BITPoint（2019年）、Liquid/QUOINE（2021年）、DMM Bitcoin（2024年）などがあります。盗まれた資産の種類や手口は事件ごとに違います。

出典: https://www.fsa.go.jp/policy/virtual_currency02/
関連: 13-4, 14-44, 14-47, 14-50, 14-52, 14-54
タグ: 安定

## 14-42

はい。2011年6月には、乗っ取られたアカウントから大量のBTCが売られてMt. Gox上の価格が一時ほぼゼロまで急落し、利用者のデータベースも流出する事件がありました。また米司法省は、2014年の破綻につながった大規模な窃取も2011年に始まっていたと主張しています。

出典: https://www.justice.gov/usao-ndca/pr/russian-nationals-charged-hacking-one-cryptocurrency-exchange-and-illicitly-operating
関連: 14-43, 13-4
タグ: 安定

## 14-43

同じではありません。2011年6月の価格急落とデータ流出は、それ自体が別の事件です。ただし米司法省によれば、2014年の破綻の原因となった約64万7千BTCの窃取も2011年から始まっており、長い期間にわたって続いていました。

出典: https://www.justice.gov/usao-ndca/pr/russian-nationals-charged-hacking-one-cryptocurrency-exchange-and-illicitly-operating
関連: 14-42, 13-4, 13-6
タグ: 安定

## 14-44

2018年1月26日、約5億2,300万XEM（NEM）、当時の価格で約580億円相当が、インターネットにつながったウォレットから不正に送金されました。

出典: https://www.fsa.go.jp/news/30/virtual_currency/20180308-1.html
関連: 14-45, 14-46
タグ: 安定

## 14-45

いいえ。2018年1月に大量に流出したのはNEM（XEM）で、Bitcoinではありません。

出典: https://www.fsa.go.jp/news/30/virtual_currency/20180308-1.html
関連: 14-44
タグ: 誤前提

## 14-46

金融庁による立入検査と、多くの交換業者への行政処分が行われ、業界の自主規制団体も作られました。その後の資金決済法の改正（2020年施行）では、呼び名が「暗号資産」に変わり、顧客の資産は原則としてインターネットから切り離したコールドウォレットで管理することなどが求められるようになりました。

出典: https://www.fsa.go.jp/policy/virtual_currency02/
関連: 14-44, 14-59
タグ: 法域依存

## 14-47

2018年9月、Zaifのホットウォレットに不正にアクセスされ、BTC、BCH、MONAの3種類、約67億円相当が流出したと発表されました。

出典: https://www.fsa.go.jp/news/30/virtual_currency/20180925.html
関連: 14-48, 14-49
タグ: 安定

## 14-48

はい。BTCは流出した暗号資産のひとつでした。

出典: https://www.fsa.go.jp/news/30/virtual_currency/20180925.html
関連: 14-47
タグ: 安定

## 14-49

運営していたテックビューロから、2018年11月にフィスコ仮想通貨取引所（のちの株式会社Zaif）へ事業が譲渡され、運営会社が変わりました。いまの運営会社は、金融庁の暗号資産交換業者の登録一覧で確認してください。

出典: https://www.fsa.go.jp/news/30/virtual_currency/20180925.html
関連: 14-47
更新: 2026-09-27
タグ: 時点依存

## 14-50

2019年7月、BITPointのホットウォレットからBTCを含む複数の暗号資産が不正に流出し、当初は約35億円相当と発表されました。

出典: https://www.remixpoint.co.jp/
関連: 14-51
タグ: 安定

## 14-51

発表では、BTC、BCH、ETH、LTC、XRPが流出の対象でした。

出典: https://www.remixpoint.co.jp/
関連: 14-50
タグ: 安定

## 14-52

2021年8月、Liquidのウォレットの基盤が侵入され、BTCやETHなど複数の暗号資産が不正に送金されました。

出典: https://www.liquid.com/
関連: 14-53
タグ: 安定

## 14-53

はい。LiquidはQUOINE株式会社が運営していたサービスで、QUOINEは日本で仮想通貨交換業の登録を受けた事業者でした。Liquidブランドで海外向けのサービスも提供していました。

出典: https://www.fsa.go.jp/news/30/virtual_currency/20180622_01.html
関連: 14-52
タグ: 安定

## 14-54

2024年5月31日、DMM Bitcoinから4,502.9 BTC、当時約482億円相当が不正に流出しました。警察庁は米FBIなどとともに、北朝鮮を背景とするサイバー攻撃グループTraderTraitorの仕業だと特定しています。取引の署名の手続きを担う外部の委託先の従業員が、偽の採用担当者を装った攻撃者に狙われたことが発端とされています。

出典: https://www.npa.go.jp/bureau/cyber/koho/caution/caution20241224.html
関連: 14-55, 14-56, 14-57
タグ: 安定

## 14-55

4,502.9 BTCです。当時の価格で約482億円相当でした。

出典: https://www.npa.go.jp/bureau/cyber/koho/caution/caution20241224.html
関連: 14-54
タグ: 安定

## 14-56

はい。2024年12月、警察庁、米FBI、米国防省サイバー犯罪センター（DC3）が、北朝鮮を背景とするTraderTraitorを攻撃者として特定したと公表しました。

出典: https://www.npa.go.jp/bureau/cyber/koho/caution/caution20241224.html
関連: 14-54
タグ: 安定

## 14-57

大規模な流出のあと、金融庁から業務改善命令を受け、自力で事業を立て直すのは難しいと判断したためです。2024年12月に、顧客の口座と預かり資産をSBI VCトレードへ移して事業を終えると発表しました。

出典: https://www.fsa.go.jp/news/r6/sonota/20240926/20240926.html
関連: 14-58, 14-54
タグ: 安定

## 14-58

顧客の口座と預かり資産は、2025年3月にSBI VCトレードへ移されました。

出典: https://www.sbivc.co.jp/
関連: 14-57
タグ: 安定

## 14-59

いいえ。インターネットにさらされる部分は減らせますが、鍵の生成、署名の手順、内部の不正、バックアップ、機器の流通経路などのリスクは残ります。

出典: https://www.fsa.go.jp/policy/virtual_currency02/
関連: 5-19, 14-60, 14-46
タグ: 安定

## 14-60

あります。コールドウォレットは「鍵をネットワークから切り離して管理する方法」にすぎず、鍵そのものや署名の手続きが破られれば盗まれます。たとえば2025年のBybitの事件では、コールドウォレットの署名画面を偽装されて大量のETHが流出しました。

出典: https://www.npa.go.jp/bureau/cyber/koho/caution/caution20241224.html
関連: 14-59, 5-19
タグ: 安定

## 14-61

一般に、exchange hackは取引所という事業者の預かり資産やシステムが破られることを、wallet hackは特定のウォレットのソフトウェアや利用者の鍵が破られることを指します。両方にまたがる事件もあります。

出典: https://www.fsa.go.jp/policy/virtual_currency02/
関連: 14-62, 14-40
タグ: 安定

## 14-62

custodial（預かり型）では事業者が鍵を持っているので、事業者のシステムや鍵が破られることが中心で、被害の補償は事業者しだいです。self-custody（自己管理）では、利用者のシード、端末、署名する環境が破られることが中心で、自分で守るしかありません。

出典: https://bitcoin.org/en/secure-your-wallet
関連: 14-61, 1-24
タグ: 安定

## 14-63

2023年6月、多数のAtomic Walletの利用者から資産が不正に流出しました。北朝鮮系のグループの関与が指摘されていますが、原因の全体は公開されている情報からは確定していません。

出典: https://atomicwallet.io/blog
関連: 14-61
タグ: 要一次確認

## 14-64

2019年5月、Binanceのホットウォレットから7,000 BTCが盗まれました。Binanceは、攻撃者がフィッシングやマルウェアで利用者のAPIキーや2段階認証のコードなどを集めて使ったと発表し、損失は自社の緊急用の資金で補いました。

出典: https://www.binance.com/en/support/announcement/360028031711
関連: 14-75
タグ: 安定

## 14-65

2015年1月、Bitstampのホットウォレットが破られ、約19,000 BTCが盗まれました。Bitstampはサービスを数日間止めました。

出典: https://www.bitstamp.net/
関連: 14-61
タグ: 安定

## 14-66

当初は、CEOが亡くなり、コールドウォレットの鍵を知る人がいなくなったためと説明されていました。しかし、カナダのオンタリオ州証券委員会の調査は、CEOが顧客の資金を他の取引所での自分の取引などに流用し、失っていた詐欺だったとしています。

出典: https://www.osc.ca/quadrigacxreport/
関連: 14-67
タグ: 安定

## 14-67

いいえ。取引所の経営、預かり資産の管理、顧客資産の扱いの問題で、特定のハードウェアウォレットの暗号が破られた事件ではありません。

出典: https://www.osc.ca/quadrigacxreport/
関連: 14-66
タグ: 誤前提

## 14-68

コピーしたBitcoinのアドレスを、マルウェアが攻撃者のアドレスにこっそり置き換え、気付かないまま送金させる攻撃です。貼り付けたあとのアドレスを確かめること、ハードウェアウォレットの画面で送り先を確認することが有効です。

出典: https://bitcoin.org/en/secure-your-wallet
関連: 14-69
タグ: 安定

## 14-69

あります。偽のウォレットアプリや偽のアップデートでシードや秘密鍵を盗む攻撃は、何度も起きています。公式の配布元から入手し、可能なら署名を確かめてください。

出典: https://bitcoin.org/en/secure-your-wallet
関連: 14-70, 14-25
タグ: 安定

## 14-70

マルウェア入りのウォレット、シードを盗み取る画面、送り先のすり替えなどで、資金を失う可能性があります。

出典: https://electrum.org/
関連: 14-69, 14-25
タグ: 安定

## 14-71

あらかじめ用意したシードを使わせる、秘密鍵を漏らす、署名の内容や画面の表示を書き換える、偽のfirmwareを動かす、といった攻撃が考えられます。

出典: https://trezor.io/guides/trezor-devices/trezor-safe-5/authenticate-trezor-safe-5
関連: 14-38, 14-39
タグ: 安定

## 14-72

あります。正規のfirmwareのアップデートで、パソコンのウェブフォームなどにシードフレーズを入力させることは通常ありません。求められたら典型的なフィッシングと考えてください。

出典: https://trezor.io/learn/security-privacy/personal-security-standards/scams-and-phishing
関連: 14-73
タグ: 安定

## 14-73

正規のサポートがシードフレーズや秘密鍵を聞くことはありません。聞かれたら詐欺だと考えてください。

出典: https://trezor.io/learn/security-privacy/personal-security-standards/scams-and-phishing
関連: 14-72, 14-22
タグ: 安定

## 14-74

取引所がSMSで本人確認をしていれば、電話番号を乗っ取られてアカウントを奪われる可能性があります。一方で、オフラインで保管している自分のシードが、SIMの乗っ取りだけで破られることはありません。

出典: https://www.cisa.gov/news-events/news/implementing-phishing-resistant-mfa
関連: 14-75
タグ: 安定

## 14-75

あります。フィッシング、ログイン状態（セッション）の乗っ取り、APIキーの流出、マルウェア、アカウント復旧の手続きの悪用などで、2段階認証が突破されることがあります。ハードウェアのセキュリティキーのような、フィッシングに強い方式のほうが安全です。

出典: https://www.cisa.gov/news-events/news/implementing-phishing-resistant-mfa
関連: 14-74, 14-64
タグ: 安定
