# NFCサウンドコレクター セットアップガイド

このガイドでは、NFCサウンドコレクターの初期セットアップ手順を説明します。

## 前提条件

- Node.js (v20以上)
- npm
- Firebaseアカウント
- Vercelアカウント（デプロイ用）

## 1. Firebaseプロジェクトのセットアップ

### 1.1 Firebase Consoleでプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `nfc-sound-collector`）
4. Google アナリティクスは任意
5. プロジェクトを作成

### 1.2 必要なサービスを有効化

#### Firestore Database

1. Firebaseコンソールで「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. 本番モードで開始（後でルールを設定）
4. ロケーションを選択（例: `asia-northeast1`）

#### Storage

1. Firebaseコンソールで「Storage」を選択
2. 「始める」をクリック
3. セキュリティルールのデフォルト設定のまま続行
4. ロケーションを選択

#### Cloud Functions

1. Firebaseコンソールで「Functions」を選択
2. 「始める」をクリック
3. Blaze（従量課金）プランにアップグレード

### 1.3 Firebase設定情報の取得

1. Firebaseコンソールでプロジェクト設定（歯車アイコン）を開く
2. 「全般」タブを選択
3. 「マイアプリ」で「Webアプリに Firebase を追加」を選択
4. アプリのニックネームを入力（例: `web-app`）
5. 表示された設定情報をコピー

### 1.4 環境変数の設定

`src/firebase.js` を開き、設定情報を貼り付けます：

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 1.5 サービスアカウントキーの取得

1. Firebaseコンソールでプロジェクト設定を開く
2. 「サービスアカウント」タブを選択
3. 「新しい秘密鍵の生成」をクリック
4. ダウンロードしたJSONファイルを `scripts/serviceAccountKey.json` として保存

## 2. SEマスターデータの投入

```bash
cd scripts
npm install firebase-admin
node seed-se-master.js
```

これで30種類のSEデータがFirestoreに登録されます。

## 3. SE音声ファイルのアップロード

### 3.1 音声ファイルの準備

`01.mp3`, `02.mp3`, ..., `30.mp3` の30個のMP3ファイルを準備します。

### 3.2 Firebase Storageにアップロード

1. Firebase Consoleで「Storage」を開く
2. `se_files` フォルダを作成
3. 30個の音声ファイルをアップロード

または、Firebase CLIを使用:

```bash
# Firebase CLIでログイン
firebase login

# Storageにファイルをアップロード
firebase storage:upload ./path/to/01.mp3 se_files/01.mp3
firebase storage:upload ./path/to/02.mp3 se_files/02.mp3
# ... (30個すべて)
```

## 4. Firestore Rules & Storage Rulesのデプロイ

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 5. Cloud Functionsのデプロイ

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

デプロイ後、Functions URLが表示されます。例:
```
https://us-central1-your-project-id.cloudfunctions.net/acquireSE
```

## 6. ローカル開発環境の起動

### 6.1 フロントエンドの起動

```bash
npm run dev
```

アクセス: `http://localhost:5173`

### 6.2 Firebaseエミュレータの起動（オプション）

```bash
firebase emulators:start
```

エミュレータを使用する場合は、`src/firebase.js` でエミュレータに接続する設定を追加:

```javascript
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { connectFunctionsEmulator } from 'firebase/functions';

// 開発環境でエミュレータに接続
if (location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

## 7. NFCタグの準備

30個のNFCタグに以下のURL形式を書き込みます：

**ローカル環境（テスト用）:**
```
http://localhost:5173/nfc?id=01
http://localhost:5173/nfc?id=02
...
http://localhost:5173/nfc?id=30
```

**本番環境（デプロイ後）:**
```
https://your-vercel-domain.vercel.app/nfc?id=01
https://your-vercel-domain.vercel.app/nfc?id=02
...
https://your-vercel-domain.vercel.app/nfc?id=30
```

## 8. Vercelへのデプロイ

### 8.1 Vercelプロジェクトの作成

```bash
npm install -g vercel
vercel login
```

### 8.2 デプロイ

```bash
npm run build
vercel --prod
```

デプロイ後、Vercelから提供されるURLでアプリにアクセスできます。

## 9. 動作確認

1. ログイン画面でニックネームを入力
2. コレクション画面が表示されることを確認
3. NFCタグをスキャン（または手動でURLにアクセス）
4. SE取得成功画面が表示されることを確認
5. コレクション画面でSEが取得済みになっていることを確認
6. SE再生・ダウンロードが機能することを確認

## トラブルシューティング

### Firestore接続エラー

- Firebase設定情報が正しいか確認
- Firestoreルールが正しくデプロイされているか確認

### Cloud Functions実行エラー

- Functions URLが正しいか確認
- Functionsログでエラー内容を確認: `firebase functions:log`

### SE音声が再生されない

- Storage内にファイルが正しくアップロードされているか確認
- Storageルールが公開読み取りを許可しているか確認
- ブラウザのコンソールでエラーを確認

## 次のステップ

- イベント本番前に少人数でのテスト運用
- NFCタグの配置場所の決定
- 参加者向けの使い方説明資料の作成
