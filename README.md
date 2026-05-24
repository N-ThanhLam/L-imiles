L-imiles

8×8 ADJACENCY STRATEGY GAME

トランプカードの「隣接」と「共鳴」を駆使して戦う、1〜4人対応の盤面配置型ターン制戦略シミュレーションゲームです。

---

## 概要

本作はブラウザだけで動作するシングルファイル構成のWebアプリケーションです。
プレイヤーは手札のトランプカードを8×8のグリッド盤面に配置し、自らのネットワーク（隣接線）を構築しながら、最後まで行動可能な状態を維持することを目指します。

### 主な機能
- **ローカル / ホットシート対戦**: 1台の端末を交互に操作して最大4人までプレイ可能
- **ソロプレイ (CPU戦)**: CPU（レベル選択可能）を相手にした即席のシングルプレイ
- **オンライン対戦 (P2P)**: PeerJSを利用した、サーバーを介さないダイレクトなマルチプレイ
- **リプレイ機能**: 対戦終了後に試合の流れをJSON形式で保存可能

---

## 基本ルール

1. **勝利条件**
   - 他の全プレイヤーが行動不能（手札の配置も交換も不可能）になり、最後まで盤面に行動可能として残ったプレイヤーが勝利となります。同着の場合は、最終的な「隣接線（ネットワーク）の総数」が多いプレイヤーが勝者となります。
2. **盤面構成**
   - 8×8の合計64マスで構成されます。ゲーム開始時にランダムで12マスの「禁止マス（配置不可・隣接線通過不可）」が生成されます。
3. **隣接成立条件**
   - 自分の配置したカード間で、上下左右（斜めは無効）に隣り合うカード同士が「同じ数字」「同じスート」「数字が±1の連番」のいずれかを満たすとき、接続線（リンク）が生成されます。
4. **配置ルール**
   - **通常配置**: すでに配置されている自分のカードの隣接条件を満たす、上下左右の空きマスにのみ配置できます。
   - **妨害配置**: 相手が配置したカードと「同じ数字」のカードであれば、自分の接続に関係なくその相手カードの隣に単独で配置できます（ただし自身の隣接線は生成・延長されません）。
   - **初期配置**: 開始時は全員が隣接条件なしにスネーク順でカードを2枚ずつ配置します。
5. **手札の交換と行動不能**
   - 盤面に置けるカード（合法手）が手札に1枚でもある場合は、必ず配置しなければなりません。
   - すべてのカードが配置できない場合に限り、1ターンに1回、任意の枚数を山札の下に戻して交換できます。交換後も配置できない、または交換すらできない場合は「行動不能」となり、そのゲームから脱落します。

---

## ライセンス (License)

本ソフトウェアのソースコード、デザイン、その他一切の構成資産は、**MITライセンス**のもとで公開されています。

```text
Copyright (c) 2026 Lam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
免責事項 (Disclaimer)
サービスの無保証
本ソフトウェアは現状有姿で提供され、明示または黙示を問わず、その品質、性能、特定目的への適合性、あるいは正確性についていかなる保証も行いません。

オンライン対戦について
本アプリケーションのオンライン対戦機能は、外部サービス（PeerJSのパブリックシグナリングサーバー等）を利用したP2P接続を採用しています。シグナリングサーバーの稼働状況や接続環境、通信規制等により、オンライン機能が正常に利用できない場合がありますが、開発者はこれに対する復旧義務や責任を負いません。

データおよび通信の安全性
オンライン対戦時の合言葉の設定や通信内容に関して、暗号化等のセキュリティレベルは利用する外部ライブラリの仕様に準拠します。通信上のトラブルや情報漏えい等により生じた問題について、開発者は一切の責任を負いかねます。

損害への責任
本ソフトウェアの利用、または利用不能によって生じた直接的・間接的・付随的・結果的な損害（データの消失、端末の不具合、機会損失、その他業務上の損害を含むがこれらに限定されない）について、開発者は予見可能性の有無を問わず、一切の責任を負いません。すべて利用者の自己責任においてご使用ください。

仕様の変更
本ソフトウェアの仕様、ルール、演出、および配布形態は、予告なく変更または開発を中止する場合があります。
