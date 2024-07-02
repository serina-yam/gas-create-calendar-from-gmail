## 概要
GMailの情報を取得して予定をGoogleカレンダーに登録/削除するGAS。  
該当のGMailはカレンダー登録処理の後に既読にする。

GASの自動実行のタイミングは適宜設定。  
（私は15分おきに設定）

## 作成した背景

QQEnglishとレアジョブのオンラインレッスン予定を自動でgoogleカレンダーに登録したい！と思い作成。

## 機能

- カレンダー登録
- カレンダー削除
- メール既読


## 処理の流れ
![gas-create-gcalender-from-gmail](https://github.com/serina-yam/gas-create-calender-from-gmail/assets/64587946/aa5823cd-b17b-409f-bc1a-36cc1f39c6f6)

## 登録例

### メールフォーマット

- QQEnglish
  ```
  ＜ご予約内容＞
  ---------------------------------------------------
  日付： 2024-07-11
  時間： 22:30-23:00
  教師： XXXXXXX
  カリキュラム： カランメソッド（25分）
  ---------------------------------------------------
  ```
- Rarejob
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ■　レッスン予約完了のお知らせ
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  講師　　：XXXXXXX
  予約日時：2024/07/02(火) 12:30 - 12:55 （※24時間表記）
  ```

### Googleカレンダー
| QQEnglish | Rarejob |
| --------- | ------- |
|![QQEngllsh](https://github.com/serina-yam/gas-create-calender-from-gmail/assets/64587946/19b22017-5c14-4860-ac6e-87ee8ba59503)|![rarejob](https://github.com/serina-yam/gas-create-calender-from-gmail/assets/64587946/cedabd1b-0548-4c8a-8a4e-f909db5854f9)|

## Googleカレンダーのタグ色一覧

Google Calendar Simple APIの[Colors](https://google-calendar-simple-api.readthedocs.io/en/latest/colors.html)のページを参照。
