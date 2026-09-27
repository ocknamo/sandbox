## 15-1

SatoshiLabsが作るハードウェアウォレットです。秘密鍵を専用の端末の中だけで扱い、パソコンやスマホには渡さずに取引へ署名します。ソフトウェアをオープンソースで公開していることが特徴です。

出典: https://trezor.io/
関連: 15-2, 15-80, 5-4
タグ: 実装依存

## 15-2

世代ごとに、画面と操作方法、Secure Elementの有無、バックアップの方式が違います。Model One（2014年、ボタン操作）とModel T（2018年、タッチ画面）はSecure Elementを持ちません。Safe 3以降のSafeシリーズはSecure Elementを載せています。細かい比較は公式の比較表で確認してください。

出典: https://trezor.io/compare
関連: 15-1, 15-5, 14-16
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-3

Bitcoinに関係する機能だけを入れたfirmwareです。他の暗号資産のためのコードを省くことで、攻撃を受け得る範囲を小さくできます。

出典: https://trezor.io/learn/supported-assets/bitcoin/bitcoin-only-firmware-on-trezor
関連: 15-16
タグ: 実装依存

## 15-4

SLIP39という規格にもとづき、バックアップを複数の「share」に分け、決めた数以上のshareがそろえば復元できる方式です。たとえば5枚のうち3枚で復元、のように設定でき、1枚をなくしたり盗まれたりしても資金を失いにくくなります。Trezorは「multi-share backup」とも呼んでいます。

出典: https://trezor.io/learn/advanced/standards-proposals/what-is-shamir-backup
関連: 5-25
タグ: 実装依存

## 15-5

端末を物理的に手に入れた攻撃者から、PINなどの秘密を守る力を高めるためです。旧モデルでは物理的に中身を取り出す研究が公表されていました。Trezorは、Secure Elementとオープンソースの設計を組み合わせる方針をとっています。

出典: https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/secure-elements-in-trezor-safe-devices
関連: 14-16, 14-19, 15-2
タグ: 実装依存

## 15-6

CoinkiteのBitcoin専用のハードウェアウォレット（署名用の端末）です。PSBTで取引を受け渡し、パソコンにつながずに署名する使い方を重視しています。

出典: https://coldcard.com/docs/
関連: 15-7, 15-8, 14-1
タグ: 実装依存

## 15-7

できます。対応するモデルでは、microSDカードやQRコードで取引を受け渡し、USBでデータをやり取りせずに署名できます。ただしNFCなどの機能もあるので、どこまで切り離すかは使い方しだいです。

出典: https://coldcard.com/docs/
関連: 15-8, 5-24
タグ: 実装依存

## 15-8

どれも、主にPSBTを端末とやり取りする手段です。microSDは物理的な媒体、QRは画面とカメラ、NFCは無線、USBは有線で、攻撃を受け得る範囲と手軽さがそれぞれ違います。使える方法はモデルによります。

出典: https://coldcard.com/docs/
関連: 15-7, 5-24
タグ: 実装依存

## 15-9

Raspberry Piなどの市販の部品で自分で組み立てる、オープンソースのBitcoin署名用の端末です。ネットワークにつながず、シードを端末に保存しない（stateless）設計です。

出典: https://seedsigner.com/
関連: 15-10, 15-11, 15-12
タグ: 実装依存

## 15-10

電源を切ったあとに、シードを端末に保存しておかないという意味です。使うたびに、SeedQR（シードをQRコードにしたもの）などからシードを読み込みます。

出典: https://seedsigner.com/
関連: 15-11, 15-13
タグ: 実装依存

## 15-11

使うときにシードを読み込み、メモリの上だけで鍵を作り直します。そのうえで、QRコードで受け取ったPSBTに署名し、署名した結果をQRコードで返します。電源を切れば鍵は消えます。

出典: https://seedsigner.com/
関連: 15-10, 5-24
タグ: 実装依存

## 15-12

Raspberry Pi Zero 1.3には、Wi-FiとBluetoothの無線が載っていないからです。ネットワークから切り離した状態を保ちやすくなります。

出典: https://seedsigner.com/
関連: 15-9
タグ: 実装依存

## 15-13

資金を動かす力を持っているのは端末ではなく、シードとそのバックアップだからです。シードを安全に持っていれば、別の端末でいつでも作り直せます。

出典: https://seedsigner.com/
関連: 15-10
タグ: 安定

## 15-14

Blockstreamが作るオープンソースのハードウェアウォレットで、BitcoinとLiquidに対応しています。後継のJade Plusもあります。

出典: https://blockstream.com/jade/
関連: 15-15, 11-19
タグ: 実装依存

## 15-15

一般的なハードウェアウォレットは、秘密をSecure Elementという専用チップの中に保管します。Jadeは「blind oracle」と呼ぶ方式を使い、端末の中の鍵を、PINとBlockstreamのサーバ（自分で立てることもできます）の両方がないと解けないように暗号化します。Blockstreamはこれを「virtual secure element」と呼び、端末をオープンソースのまま、物理的な鍵の抜き取りを防げるとしています。

出典: https://blockstream.com/jade/
関連: 15-14, 14-19
タグ: 実装依存

## 15-16

Bitcoinの機能だけに絞ったBitBox02です。他の暗号資産のためのコードを入れないことで、攻撃を受け得る範囲を小さくしています。

出典: https://bitbox.swiss/bitbox02/bitcoin-only/
関連: 15-3
タグ: 実装依存

## 15-17

BitBox02のmicroSDカードのバックアップは暗号化されておらず、カードを手に入れた人はシードを取り出せます。カードそのものをシードの紙と同じように、人目に触れない場所で保管してください。

出典: https://bitbox.swiss/backup/
関連: 15-16
更新: 2026-09-27
タグ: 実装依存・要一次確認

## 15-18

Foundationが作るハードウェアウォレットです。最初のPassport（のちのPassport Core）は、Bitcoin専用で、QRコードとmicroSDでパソコンにつながずに署名することを重視していました。現在の主力のPassport Primeは、暗号化したBluetooth（QuantumLink）やNFCにも対応し、2段階認証のコードや暗号化した保管庫などの機能も持っています。

出典: https://foundation.xyz/products/passport-prime
関連: 15-19
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-19

シードを端末に保存するかどうか、Secure Elementを使うかどうか、パソコンから切り離せるか、どこまでオープンソースか、パソコンやスマホとのつなぎ方、PINとpassphraseの設計などが違います。たとえばSeedSignerはシードを保存せず、JadeはSecure Elementの代わりにblind oracleを使います。「どれが一番安全か」は、何から身を守りたいかによって変わります。

出典: https://bitcoin.org/en/secure-your-wallet
関連: 15-10, 15-15, 15-5, 5-33
タグ: 実装依存

## 15-20

パソコン向けのBitcoinウォレットです。ハードウェアウォレットとの連携、PSBT、multisig、使うUTXOを選ぶcoin control、自分のノードへの接続などを重視しています。

出典: https://sparrowwallet.com/
関連: 15-21, 15-22, 15-23
タグ: 実装依存

## 15-21

はい。Sparrowを残高の確認と取引の組み立てにだけ使い（watch-only）、署名はハードウェアウォレットだけで行う使い方ができます。

出典: https://sparrowwallet.com/docs/
関連: 5-17, 5-24, 15-20
タグ: 実装依存

## 15-22

サーバには、どのアドレスやスクリプトについて問い合わせたかと、接続元のIPアドレスが見えるので、それらを結び付けられる可能性があります。自分のノードやTorを使うと、他人のサーバに頼る部分を減らせます。

出典: https://sparrowwallet.com/docs/best-practices.html
関連: 10-20, 15-23, 15-25
タグ: 安定

## 15-23

取引やブロックを自分のノードで検証でき、ウォレットの情報を第三者のサーバに問い合わせずに済みます。

出典: https://sparrowwallet.com/docs/connect-node.html
関連: 15-22, 10-20
タグ: 安定

## 15-24

2011年から開発が続いている軽量なBitcoinウォレットです。ブロックチェーンをすべて持たず、Electrumのプロトコルに対応したサーバにつないで、必要な情報を受け取ります。

出典: https://electrum.org/
関連: 15-25, 5-29, 14-25
タグ: 実装依存

## 15-25

Electrumウォレットは、利用者の側で鍵を持ち、署名する画面です。Electrumサーバは、ブロックチェーンをアドレスごとに引けるよう索引を作り、ウォレットの問い合わせに答える裏方です。

出典: https://electrum.readthedocs.io/
関連: 15-24, 15-26, 14-26
タグ: 安定

## 15-26

どれもElectrumのプロトコルに対応したサーバの実装ですが、書かれている言語（ElectrsはRust、ElectrumXはPython、FulcrumはC++）、索引の作り方、必要なディスクやメモリ、速さの設計が違います。

出典: https://github.com/romanz/electrs
関連: 15-25
タグ: 実装依存

## 15-27

スマホ向けのオープンソースのBitcoinウォレットです。オンチェーンのウォレット、残高を見るだけのwatch-only、ハードウェアウォレットとの連携、multisigなどを提供しています。

出典: https://bluewallet.io/
関連: 15-61, 15-62
タグ: 実装依存

## 15-28

Phoenixは、チャネルや流動性の管理を自動で行う自己管理型のライトニングウォレットです。Breezはウォレットと、開発者向けのSDKを作っています。Zeusは自分のノードにつなぐアプリで、スマホの中でノードを動かすこともできます。Muunは、submarine swapでライトニングとやり取りする独自の設計です。いずれも版によって仕組みが変わります。

出典: https://phoenix.acinq.co/
関連: 15-49, 15-53, 15-55, 15-57
タグ: 実装依存

## 15-29

umbrelOSというOSの上で、Bitcoinのノード、ライトニングのノード、mempoolなどのアプリを自分で動かせる、個人向けのサーバの仕組みです。

出典: https://umbrel.com/
関連: 15-30, 15-31, 15-87
タグ: 実装依存

## 15-30

なりません。umbrelOSとBitcoin Nodeのアプリは別物で、Bitcoin Nodeのアプリを入れてブロックチェーンの同期が終わって、初めてフルノードとして動きます。

出典: https://apps.umbrel.com/app/bitcoin
関連: 15-29, 6-1
タグ: 実装依存

## 15-31

ライトニングのノードは、チャネルの開閉やブロックチェーンの監視のためにBitcoinのノードを必要とします。Umbrelでは、Lightning NodeのアプリがBitcoin Nodeのアプリにつながって動きます。

出典: https://apps.umbrel.com/category/bitcoin
関連: 15-30, 15-32
タグ: 実装依存

## 15-32

オンチェーンの資金は、シード（鍵）をバックアップしていれば、端末が壊れただけでは失いません。ライトニングの資金は、チャネルの状態も関わるので、チャネルのバックアップなど専用の手順が必要です。

出典: https://umbrel.com/
関連: 15-31, 8-25
タグ: 実装依存

## 15-33

どちらも自分でサーバを動かすための仕組みですが、OSの作り、アプリの配布と管理の方法、セキュリティの設計、管理画面が違います。

出典: https://docs.start9.com/
関連: 15-29, 15-87
タグ: 実装依存

## 15-34

Raspberry Piなどで、Bitcoinのフルノードとライトニングのノードを自分で組み立てて動かすための、オープンソースのプロジェクトです。

出典: https://docs.raspiblitz.org/
関連: 15-87
タグ: 実装依存

## 15-35

どちらもBitcoinのフルノードのソフトウェアです。KnotsはBitcoin Coreのコードをもとに、中継する取引を選ぶ設定（policy）などを増やしたものです。コンセンサスのルールは同じで、同じBitcoinのネットワークに参加します。

出典: https://bitcoinknots.org/
関連: 15-36, 9-8, 9-10
タグ: 実装依存

## 15-36

いいえ。Bitcoinのネットワークに参加するノードのソフトウェアのひとつで、別のコインではありません。

出典: https://bitcoinknots.org/
関連: 15-35, 9-8
タグ: 誤前提

## 15-37

LND（Go）、Core Lightning（C）、Eclair（Scala）は、それぞれ単独で動くライトニングのノードの実装です。LDK（Rust）は、アプリやウォレットにライトニングの機能を組み込むための部品（ライブラリ）という性格が強いものです。

出典: https://github.com/lightningnetwork/lnd
関連: 14-35, 9-18
タグ: 実装依存

## 15-38

自分で運用できる、オープンソースのBitcoinとライトニングの決済の仕組みです。お店がオンラインやレジで支払いを受けるために使います。

出典: https://docs.btcpayserver.org/
関連: 15-39
タグ: 実装依存

## 15-39

基本的にはいいえ。お店自身のウォレットやノードへ直接支払いを受ける、預からない構成が中心です。

出典: https://docs.btcpayserver.org/
関連: 15-38
タグ: 実装依存

## 15-40

できます。mempoolのプロジェクトはオープンソースで、自分のBitcoinノードと組み合わせて動かせます。Umbrelなどではアプリとして入れられます。

出典: https://github.com/mempool/mempool
関連: 15-29, 3-6
タグ: 実装依存

## 15-41

手軽に使えるBitcoinとライトニングのウォレットです。利用者が鍵を持つ自己管理型（self-custody）は全世界で、事業者が資金を預かる預かり型（custodial）は一部の地域で提供されています。どちらになるかは地域によって決まります。

出典: https://www.walletofsatoshi.com/disclosure
関連: 15-42, 15-43, 15-44
更新: 2026-09-27
タグ: 時点依存・法域依存

## 15-42

いまは「必ず預かり型」ではありません。事業者が鍵と資金を管理する預かり型と、利用者が鍵を管理する自己管理型があります。自己管理型は、LightsparkのSparkという仕組みの上に作られています。

出典: https://www.walletofsatoshi.com/disclosure
関連: 15-41, 15-43, 11-17
更新: 2026-09-27
タグ: 時点依存・法域依存

## 15-43

預かり型（従来からの形）では、Wallet of Satoshiが鍵と資金を管理し、メールでログインすれば新しい端末で残高を取り戻せます。自己管理型では、利用者が鍵と復元フレーズを管理し、Wallet of Satoshiは鍵にも資金にも触れられず、なくした鍵を戻すこともできません。

出典: https://www.walletofsatoshi.com/disclosure
関連: 15-42, 15-46
更新: 2026-09-27
タグ: 時点依存

## 15-44

自分でライトニングのチャネルを持つのではなく、SparkというBitcoinのレイヤー2に資金を置き、ライトニングやオンチェーンとのやり取りをアプリが引き受けます。Bitcoinのブロックチェーンへ出ることもでき、協力して出るのが最も安く、相手の協力なしに一方的に出ることもできます。

出典: https://www.walletofsatoshi.com/disclosure
関連: 15-45, 11-13, 11-17
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-45

Lightsparkが開発する、第三者のBitcoinのレイヤー2です。Wallet of Satoshiは、自己管理型の土台としてこれを使っています。

出典: https://www.walletofsatoshi.com/disclosure
関連: 11-13, 11-17, 15-44
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-46

普通のBIP39ウォレットに入れればそのまま使える、とは考えないほうが安全です。資金はSparkの上にあるので、Sparkに対応していないウォレットには残高が見えません。Wallet of Satoshi（またはSparkに対応したウォレット）の公式の復元手順を使ってください。

出典: https://www.walletofsatoshi.com/disclosure
関連: 15-43, 15-44
更新: 2026-09-27
タグ: 時点依存・実装依存・要一次確認

## 15-47

ありません。通常の利用者が自分でチャネルを開く必要はありません。

出典: https://www.walletofsatoshi.com/
関連: 15-44
タグ: 実装依存

## 15-48

あります。ライトニングとLNURLで受け取るだけの、お店向けのPOS（Partner App）を公式に出しています。ログインは不要で、NFCのBolt Cardにも対応しています。

出典: https://www.walletofsatoshi.com/pos
関連: 15-41
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-49

ACINQが提供する、自己管理型のライトニングウォレットです。チャネルの開設や流動性の管理を大きく自動化していて、ノードの運用を知らなくても使えます。

出典: https://phoenix.acinq.co/
関連: 15-50, 15-51, 15-52
タグ: 実装依存

## 15-50

はい。鍵は利用者が管理する自己管理型のウォレットです。

出典: https://phoenix.acinq.co/
関連: 15-49, 15-51
タグ: 実装依存

## 15-51

鍵を持つのは利用者ですが、チャネルの開設や流動性の多くはアプリが自動で管理します。ACINQがLSP（チャネルの相手）になるので、自分でノードを運用する必要はありません。

出典: https://phoenix.acinq.co/
関連: 15-49, 8-39
タグ: 実装依存

## 15-52

チャネルを閉じずにオンチェーンの資金を入れたり出したりするのに使われています。これにより、Phoenixはオンチェーンとライトニングの残高を1つの残高として扱えます。

出典: https://phoenix.acinq.co/
関連: 8-44, 15-49
タグ: 実装依存

## 15-53

ライトニングを使う自己管理型のウォレットと、開発者向けのSDKを作っているプロジェクト・企業です。

出典: https://breez.technology/
関連: 15-54
タグ: 実装依存

## 15-54

ウォレットは一般の利用者向けのアプリです。SDKは、開発者が自分のアプリにライトニングの支払い機能を組み込むための部品です。SDKにはいくつかの実装方式があり、版によって変わります。

出典: https://breez.technology/sdk/
関連: 15-53
タグ: 実装依存

## 15-55

スマホ向けのBitcoinとライトニングのウォレットで、ノードの管理アプリでもあります。自分のノードに遠隔でつなぐことも、スマホの中でライトニングのノードを動かすこともできます。

出典: https://zeusln.com/
関連: 15-56
タグ: 実装依存

## 15-56

はい。LNDやCore Lightningなど、自分のノードにつないで使うのが主な使い方のひとつです。

出典: https://zeusln.com/
関連: 15-55, 15-37
タグ: 実装依存

## 15-57

オンチェーンとライトニングを1つの残高のように扱える、自己管理型のスマホ向けウォレットです。

出典: https://muun.com/
関連: 15-58, 15-59
タグ: 実装依存

## 15-58

いいえ。Muunは、オンチェーンの資金を持ったまま、submarine swapでライトニングの支払いと交換する独自の設計です。常にチャネルを持っておく一般的なライトニングウォレットとは違います。

出典: https://blog.muun.com/
関連: 8-37, 15-57
タグ: 実装依存

## 15-59

Muunは、利用者の鍵とMuunの鍵による2-of-2のmultisigを使っていて、1つのBIP39のシードだけではウォレット全体を表せないからです。代わりに、秘密鍵とoutput descriptorを書き出した「Emergency Kit」で復元できるようにしています。

出典: https://blog.muun.com/why-not-just-a-mnemonic/
関連: 15-57, 5-26
タグ: 実装依存

## 15-61

いいえ。BlueWalletが運営していたライトニングのサーバ（lndhub.io）は2023年2月に終了が発表され、新しいライトニングウォレットの作成や入金はできなくなりました。いまは、自分や第三者のLNDHubにつなぐ形が基本です。

出典: https://bluewallet.io/sunsetting-lndhub/
関連: 15-62, 15-27
タグ: 時点依存・実装依存

## 15-62

はい。BlueWalletは、自分で立てたLNDHubへの接続に対応しています。

出典: https://bluewallet.io/docs/
関連: 15-61
タグ: 実装依存

## 15-63

エルサルバドルのBitcoin Beach Walletから発展した、Bitcoinとライトニングのウォレットです。長く預かり型でしたが、2026年6月に、利用者が12単語の復元フレーズで鍵を持つ自己管理型のアカウントも始めました。ドル建ての残高（Dollar Balance）も提供しています。使える機能は地域によって違います。

出典: https://www.blink.sv/blog/non-custodial-accounts-in-blink-wallet
関連: 15-41
更新: 2026-09-27
タグ: 時点依存・法域依存

## 15-64

BitcoinとLiquidをまとめて扱える、自己管理型のスマホ向けウォレットです。

出典: https://aquawallet.io/
関連: 15-65, 11-19
タグ: 実装依存

## 15-65

本来のBTCの受け渡しにはBitcoinのメインチェーンを使い、速くて安い送金や、資産の交換（swap）にはLiquidを使います。

出典: https://aquawallet.io/
関連: 15-64, 11-19, 11-20
タグ: 実装依存

## 15-66

Blockstreamの自己管理型のウォレットで、BitcoinとLiquidに対応しています。現在は「Blockstream App」に名前が変わっています。

出典: https://blockstream.com/app/
関連: 15-67, 15-14
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-67

はい。BitcoinとLiquidの両方を扱えます（現在の名前はBlockstream Appです）。

出典: https://blockstream.com/app/
関連: 15-66, 11-19
更新: 2026-09-27
タグ: 時点依存

## 15-68

Bitcoin専用のウォレットです。1つの鍵のウォレット、multisig、ハードウェアウォレットとの連携、家族や事業者と鍵を分け合う共同管理などを提供しています。

出典: https://nunchuk.io/
関連: 15-69, 15-70
タグ: 実装依存

## 15-69

署名する権限を、複数の独立した鍵・端末・人に分けることで、1か所が壊れたり盗まれたりしただけで資金を失わないようにできるからです。

出典: https://nunchuk.io/
関連: 4-24, 5-33
タグ: 安定

## 15-70

契約するプランによって違います。multisigと相続の計画のためのサービスを組み合わせ、決めた条件がそろったときに相続人が資金を取り戻せるようにする仕組みです。

出典: https://nunchuk.io/inheritance
関連: 5-36
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-71

Bitcoin Coreとハードウェアウォレットを組み合わせて、1つの鍵のウォレットやmultisigを管理しやすくする、パソコン向けのウォレットです。

出典: https://specter.solutions/
関連: 15-72
タグ: 実装依存

## 15-72

Bitcoin CoreのRPCを裏方として使い、残高、取引、PSBTを自分のノードを通して扱います。Electrumサーバにつなぐこともできます。

出典: https://docs.specter.solutions/
関連: 15-71, 5-24
タグ: 実装依存

## 15-73

プライバシーを重視した、パソコン向けのオープンソースのBitcoinウォレットです。Tor、coin control、CoinJoinの機能で知られています。

出典: https://wasabiwallet.io/
関連: 15-74, 15-75, 10-14
タグ: 実装依存

## 15-74

複数の参加者の入力と出力を1つのトランザクションにまとめ、どの入力とどの出力が同じ持ち主のものかを分析しにくくします。参加者は秘密鍵を手放さず、自分で署名します。

出典: https://docs.wasabiwallet.io/
関連: 10-14, 10-15
タグ: 実装依存

## 15-75

開発元のzkSNACKsが運営していた公式のcoordinatorは、2024年6月に停止しました。いまのWasabiでCoinJoinをするには、第三者が運営するcoordinatorを自分で選んで設定します。使えるcoordinatorは時期によって変わります。

出典: https://docs.wasabiwallet.io/
関連: 15-74, 15-77
更新: 2026-09-27
タグ: 時点依存・実装依存

## 15-76

プライバシーの機能を重視したAndroid向けのBitcoinウォレットで、WhirlpoolというCoinJoinなどを提供していました。

出典: https://www.justice.gov/usao-sdny/pr/founders-and-ceo-cryptocurrency-mixing-service-arrested-and-charged-money
関連: 15-77, 15-78
タグ: 安定

## 15-77

2024年4月、米当局が無許可の送金業と資金洗浄の共謀の疑いで創業者2人を起訴し、サーバとドメインを押収したためです。中央のサーバが止まり、サービスは続けられなくなりました。創業者2人は2025年に罪を認め、禁錮刑の判決を受けています。

出典: https://www.justice.gov/usao-sdny/pr/founders-and-ceo-cryptocurrency-mixing-service-arrested-and-charged-money
関連: 15-76, 15-75
タグ: 安定

## 15-78

Samourai Walletの仕組みの中で提供されていた、BitcoinのCoinJoinのプロトコルとサービスです。2024年の押収でcoordinatorが止まりました。

出典: https://www.justice.gov/usao-sdny/pr/founders-and-ceo-cryptocurrency-mixing-service-arrested-and-charged-money
関連: 15-76, 10-14
タグ: 安定

## 15-79

Secure Elementという専用のチップの中に秘密鍵を閉じ込め、Ledgerのアプリと組み合わせて取引に署名するハードウェアウォレットのシリーズです。多くの暗号資産に対応しています。

出典: https://www.ledger.com/
関連: 15-80, 14-21, 14-22
タグ: 実装依存

## 15-80

大まかには、LedgerはSecure Elementとメーカー独自のfirmware（一部は非公開）に強く頼り、Trezorはオープンソースで中身を確かめられることを重視してきました。ただし、いまのTrezor SafeシリーズもSecure Elementを載せているので、単純に二分はできません。

出典: https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/secure-elements-in-trezor-safe-devices
関連: 15-79, 15-1, 15-5
タグ: 実装依存

## 15-81

QRコードでやり取りして、パソコンやスマホにつながずに署名することを中心にしたハードウェアウォレットです。多くのソフトウェアウォレットと組み合わせて使えます。

出典: https://keyst.one/
関連: 15-19
タグ: 実装依存

## 15-83

CoinkiteのNFCのカード型のBitcoin署名用の端末です。対応するスマホのウォレットにかざして署名します。

出典: https://tapsigner.com/
関連: 15-85, 15-84
タグ: 実装依存

## 15-84

NFCのカードの中に複数の鍵の枠（スロット）があり、カードそのものを手渡すことでBitcoinを物理的に受け渡すような使い方を想定したCoinkiteの製品です。

出典: https://satscard.com/
関連: 15-83
タグ: 実装依存

## 15-85

画面やボタンを持たないカード型で、スマホのウォレットとNFCでつないで鍵を使います。送金先や金額の確認は、つないだスマホの画面で行うことになります。

出典: https://tapsigner.com/
関連: 15-83
タグ: 実装依存

## 15-86

Bitcoinのフルノード、ライトニング、Electrumサーバなどをまとめて動かしやすくする、個人向けのBitcoinサーバの仕組みです。専用の端末と、無料版・有料版のソフトウェアがあります。

出典: https://mynodebtc.com/
関連: 15-87
タグ: 実装依存

## 15-87

どれもノードを自分で動かしやすくするものですが、OS、アプリの管理、セキュリティの設計、画面、有料のサポートの有無、想定している利用者が違います。

出典: https://mynodebtc.com/
関連: 15-29, 15-33, 15-34, 15-86
タグ: 実装依存

## 15-88

主にLNDのライトニングノードを、ブラウザから管理するためのオープンソースの画面です。

出典: https://www.thunderhub.io/
関連: 15-90
タグ: 実装依存

## 15-89

LND、Core Lightning、Eclairなどのライトニングノードを管理するための、ブラウザで使う画面です。

出典: https://github.com/Ride-The-Lightning/RTL
関連: 15-90
タグ: 実装依存

## 15-90

既存のライトニングノードを管理するための画面です。つないだノードのチャネル、支払い、流動性などを操作できますが、それ自体がライトニングのノードの実装ではありません。

出典: https://github.com/Ride-The-Lightning/RTL
関連: 15-88, 15-89, 15-37
タグ: 実装依存
