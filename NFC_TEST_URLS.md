# NFCタグテスト用URL一覧

## 使い方

1. まず http://localhost:5173 でログイン
2. 下記のURLのいずれかにアクセスしてSE取得をテスト

## ローカル環境用URL（01〜30）

```
http://localhost:5173/nfc?id=01
http://localhost:5173/nfc?id=02
http://localhost:5173/nfc?id=03
http://localhost:5173/nfc?id=04
http://localhost:5173/nfc?id=05
http://localhost:5173/nfc?id=06
http://localhost:5173/nfc?id=07
http://localhost:5173/nfc?id=08
http://localhost:5173/nfc?id=09
http://localhost:5173/nfc?id=10
http://localhost:5173/nfc?id=11
http://localhost:5173/nfc?id=12
http://localhost:5173/nfc?id=13
http://localhost:5173/nfc?id=14
http://localhost:5173/nfc?id=15
http://localhost:5173/nfc?id=16
http://localhost:5173/nfc?id=17
http://localhost:5173/nfc?id=18
http://localhost:5173/nfc?id=19
http://localhost:5173/nfc?id=20
http://localhost:5173/nfc?id=21
http://localhost:5173/nfc?id=22
http://localhost:5173/nfc?id=23
http://localhost:5173/nfc?id=24
http://localhost:5173/nfc?id=25
http://localhost:5173/nfc?id=26
http://localhost:5173/nfc?id=27
http://localhost:5173/nfc?id=28
http://localhost:5173/nfc?id=29
http://localhost:5173/nfc?id=30
```

## 動作フロー

1. 上記URLにアクセス
2. ログインしていない場合 → ログイン画面にリダイレクト
3. ログイン済みの場合 → Cloud Functions (`acquireSE`) を呼び出し
4. Cloud Functionsがセッション検証、タグID検証、重複チェックを実行
5. 成功: `/acquire?success=true&se_id=01` にリダイレクト
6. 失敗: `/acquire?success=false&error=...` にリダイレクト

## エラーケース

- `error=already_acquired`: 既に取得済み（同じURLに2回アクセスした場合）
- `error=invalid_tag`: 無効なタグID（31以上など）
- `error=unauthorized`: セッションIDが無効
- `error=missing_params`: パラメータ不足

## ブックマークレット（簡単アクセス用）

ブラウザのブックマークバーに以下のリンクを追加すると便利です：

**SE-01取得**
```
javascript:(function(){window.location.href='http://localhost:5173/nfc?id=01';})()
```

**SE-02取得**
```
javascript:(function(){window.location.href='http://localhost:5173/nfc?id=02';})()
```

## 注意事項

- 各SEは1回のみ取得可能です（重複取得は不可）
- 音声ファイル（mp3またはm4a）をCloud Storageにアップロードすると、再生・ダウンロードが可能になります
- 本番環境では、`localhost:5173` を Vercel のドメインに置き換えてください
