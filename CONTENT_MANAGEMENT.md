# Sound Catch - コンテンツ管理ガイド

このドキュメントでは、Sound Catchアプリにコンテンツ（SE、クイズ、画像など）を追加・設定する方法を説明します。

---

## 📋 目次

1. [準備：Firebaseコンソールへのアクセス](#準備firebaseコンソールへのアクセス)
2. [SE（効果音）の追加](#se効果音の追加)
3. [クイズの答えの設定](#クイズの答えの設定)
4. [画像の設定](#画像の設定)
5. [音声ファイルの設定](#音声ファイルの設定)
6. [トラブルシューティング](#トラブルシューティング)

---

## 準備：Firebaseコンソールへのアクセス

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「sound-collector-e0e7e」を選択
3. 左側のメニューから必要なサービスを選択

---

## SE（効果音）の追加

### 手順

1. **Firebaseコンソールで「Firestore Database」を選択**

2. **`se_master` コレクションを開く**

3. **「ドキュメントを追加」をクリック**

4. **以下のフィールドを入力：**

   | フィールド名 | 型 | 説明 | 例 |
   |------------|------|------|-----|
   | `seId` | string | SE識別ID（NFCタグのIDと一致） | `"01"`, `"02"`, `"03"` |
   | `name` | string | SEの表示名 | `"ドラム"`, `"ギター"`, `"ベース"` |
   | `quizAnswer` | string | クイズの正解 | `"せいかい"` |
   | `audioUrl` | string | 音声ファイルのURL（後で設定） | `"gs://bucket/se_files/01.mp3"` |
   | `imageFileName` | string | 画像ファイル名 | `"01.png"`, `"02.jpg"` |

5. **「保存」をクリック**

### 例：SE "01" を追加する場合

```
ドキュメントID: （自動生成）
seId: "01"
name: "ドラム"
quizAnswer: "せいかい"
audioUrl: ""  // 後で音声ファイルをアップロード後に設定
imageFileName: "01.png"
```

> [!IMPORTANT]
> - `seId` はNFCタグのIDと完全に一致する必要があります
> - 各SEは一意の`seId`を持つ必要があります（重複禁止）

---

## クイズの答えの設定

### 現在の仕様

クイズの答えは**各SEごと**に設定できます。

### 答えの変更方法

1. **Firestore Database → `se_master` コレクションを開く**

2. **編集したいSEのドキュメントをクリック**

3. **`quizAnswer` フィールドを編集**
   - 現在のコード: すべてのSEで `"せいかい"` が正解として設定されています
   - 任意の文字列に変更可能（例: `"ドラム"`, `"ギター"` など）

4. **「更新」をクリック**

### カスタマイズしたい場合

SEごとに異なる答えにしたい場合：

1. 各SEの`quizAnswer`フィールドを設定
2. `src/components/SECard.vue` の194行目を修正：

```javascript
// 現在（すべて「せいかい」が正解）
const isCorrect = quizAnswer.value === 'せいかい';

// 各SEごとの答えにする場合
const isCorrect = quizAnswer.value === props.se.quizAnswer;
```

> [!TIP]
> 大文字小文字を区別せずに判定したい場合：
> ```javascript
> const isCorrect = quizAnswer.value.toLowerCase() === props.se.quizAnswer.toLowerCase();
> ```

---

## 画像の設定

### 準備

各SEに対応する画像ファイルを用意してください：
- **ファイル形式**: PNG, JPG, WEBP など
- **推奨サイズ**: 正方形（例: 512x512px, 1024x1024px）
- **ファイル名**: `se_master`の`imageFileName`と一致させる

### アップロード手順

1. **Firebaseコンソールで「Storage」を選択**

2. **`se_images/` フォルダを開く**
   - フォルダが存在しない場合は作成してください

3. **「ファイルをアップロード」をクリック**

4. **画像ファイルを選択してアップロード**
   ```
   se_images/01.png
   se_images/02.jpg
   se_images/03.png
   ...
   ```

5. **Firestoreの`se_master`コレクションで対応するSEの`imageFileName`を確認**
   - ファイル名が一致していることを確認

### sample.png（フォールバック画像）

未取得のSEや画像が見つからない場合に表示される画像：

1. `se_images/sample.png` をアップロード
2. このファイルは必ず設置してください
3. 推奨: シルエットや「？」などの汎用的な画像

> [!WARNING]
> 画像ファイル名の拡張子（.png, .jpg など）が`imageFileName`と完全に一致していることを確認してください。大文字小文字も区別されます。

---

## 音声ファイルの設定

### 準備

各SEに対応する音声ファイルを用意してください：
- **ファイル形式**: MP3, WAV, OGG など（MP3推奨）
- **ファイル名**: SEのIDに対応（例: `01.mp3`, `02.mp3`）

### アップロード手順

1. **Firebaseコンソールで「Storage」を選択**

2. **`se_files/` フォルダを開く**
   - フォルダが存在しない場合は作成してください

3. **「ファイルをアップロード」をクリック**

4. **音声ファイルを選択してアップロード**
   ```
   se_files/01.mp3
   se_files/02.mp3
   se_files/03.mp3
   ...
   ```

5. **アップロード後、各ファイルのURLを取得**
   - ファイルをクリック → 「トークンを作成」→ URLをコピー

6. **Firestoreの`se_master`コレクションに戻る**

7. **対応するSEの`audioUrl`フィールドに、Storage URLをペースト**
   ```
   例: https://firebasestorage.googleapis.com/v0/b/...
   ```

> [!TIP]
> 代わりに、gsパス形式でも設定可能です：
> ```
> gs://sound-collector-e0e7e.appspot.com/se_files/01.mp3
> ```

---

## NFCタグの紐付け

### NFCタグのURL設定

各NFCタグに以下の形式のURLを書き込みます：

```
https://あなたのドメイン/nfc?id=01
```

- `id=01` の部分は、Firestoreの`se_master`の`seId`と一致させてください
- 例:
  - タグ1: `https://sound-catch-fan.vercel.app/nfc?id=01`
  - タグ2: `https://sound-catch-fan.vercel.app/nfc?id=02`
  - タグ3: `https://sound-catch-fan.vercel.app/nfc?id=03`

### テスト方法

NFCタグに書き込む前に、ブラウザでURLをテストできます：

```
http://localhost:5173/nfc?id=01
```

ログイン後、正しくSEが取得できるか確認してください。

詳細は [`NFC_TEST_URLS.md`](file:///Users/kimurakoya/Documents/develop/web/sound-catch/NFC_TEST_URLS.md) を参照してください。

---

## データ構造の全体像

### Firestore コレクション

```
📁 Firestore Database
├── 📂 se_master (SEマスターデータ)
│   ├── 📄 ドキュメント1
│   │   ├── seId: "01"
│   │   ├── name: "ドラム"
│   │   ├── quizAnswer: "せいかい"
│   │   ├── audioUrl: "https://..."
│   │   └── imageFileName: "01.png"
│   └── ...
├── 📂 users (ユーザー情報)
├── 📂 user_ses (ユーザーが取得したSE)
└── 📂 user_quiz_scores (クイズ正解数)
```

### Firebase Storage

```
📁 Storage
├── 📂 se_files (音声ファイル)
│   ├── 01.mp3
│   ├── 02.mp3
│   └── ...
└── 📂 se_images (画像ファイル)
    ├── 01.png
    ├── 02.jpg
    ├── sample.png (フォールバック画像)
    └── ...
```

---

## トラブルシューティング

### 画像が表示されない

1. **Storage の `se_images/` フォルダにファイルがあるか確認**
2. **ファイル名が `se_master.imageFileName` と完全に一致しているか確認**
3. **Storage のアクセス権限を確認**（`storage.rules` で読み取り許可が設定されているか）
4. **ブラウザのコンソールでエラーを確認**

### 音声が再生されない

1. **Storage の `se_files/` フォルダにファイルがあるか確認**
2. **`se_master.audioUrl` が正しく設定されているか確認**
3. **音声ファイルの形式がブラウザでサポートされているか確認**（MP3推奨）

### NFCタグをスキャンしてもSEが取得できない

1. **`se_master` に該当する `seId` のドキュメントが存在するか確認**
2. **NFCタグのURLが正しいか確認**（`/nfc?id=XX` の形式）
3. **ログインしているか確認**（ログインしていないとSE取得できません）
4. **既に取得済みでないか確認**（同じSEは1回しか取得できません）

### クイズが機能しない

1. **`se_master.quizAnswer` が設定されているか確認**
2. **入力した答えが完全に一致しているか確認**（大文字小文字も区別されます）
3. **ブラウザのコンソールでエラーを確認**

---

## まとめ

Sound Catchにコンテンツを追加する基本的な流れ：

1. ✅ **Firestoreで`se_master`にSEを追加**（seId, name, quizAnswer, imageFileName）
2. ✅ **Storageに画像をアップロード**（`se_images/`フォルダ）
3. ✅ **Storageに音声をアップロード**（`se_files/`フォルダ）
4. ✅ **Firestoreで`audioUrl`を更新**
5. ✅ **NFCタグにURLを書き込む**（`/nfc?id=XX`）

ご不明な点があれば、お気軽にお問い合わせください！
