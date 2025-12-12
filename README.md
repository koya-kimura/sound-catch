# Sound Catch

イベント参加者がNFCタグをスキャンしてSE（効果音）を収集できるWebアプリケーション

## 技術スタック

- **フロントエンド**: Vue.js 3 + Vite
- **バックエンド**: Firebase (Cloud Functions, Firestore, Storage)
- **デプロイ**: Vercel (フロントエンド)

## プロジェクト構成

```
sound-catch/
├── src/
│   ├── components/       # Vueコンポーネント
│   ├── views/           # ページビュー
│   ├── composables/     # Vue Composition API
│   ├── router/          # Vue Router設定
│   ├── firebase.js      # Firebase初期化
│   └── main.js          # エントリーポイント
├── functions/           # Cloud Functions
├── scripts/             # データ投入スクリプト
└── public/              # 静的ファイル
```

## ドキュメント

- **[コンテンツ管理ガイド](CONTENT_MANAGEMENT.md)** - SE、クイズ、画像、音声ファイルの設定方法
- **[セットアップガイド](SETUP.md)** - Firebase初期設定の詳細手順
- **[NFCテストURL](NFC_TEST_URLS.md)** - NFCタグのテスト方法

## セットアップ

### 1. 依存関係のインストール

```bash
# フロントエンド
npm install

# Cloud Functions
cd functions
npm install
cd ..
```

### 2. Firebase設定

1. Firebase Consoleで新しいプロジェクトを作成
2. Firestore、Storage、Functionsを有効化
3. Firebase設定情報を `src/firebase.js` に追加
4. サービスアカウントキーを `scripts/serviceAccountKey.json` に配置

### 3. SEマスターデータの投入

```bash
cd scripts
node seed-se-master.js
```

### 4. SE音声ファイルのアップロード

Cloud Storageの `se_files/` フォルダに以下のファイルをアップロード:
- `01.mp3`, `02.mp3`, ..., `30.mp3`

## 開発

### ローカル開発サーバー

```bash
# フロントエンド
npm run dev

# Firebaseエミュレータ（別ターミナル）
firebase emulators:start
```

アクセス: `http://localhost:5173`

### NFCタグテスト用URL

ローカル環境:
```
http://localhost:5173/nfc?id=01
```

本番環境:
```
https://[your-vercel-domain]/nfc?id=01
```

## デプロイ

### フロントエンド（Vercel）

```bash
npm run build
vercel --prod
```

### Cloud Functions

```bash
firebase deploy --only functions
```

### Firestore Rules & Storage Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 機能

- ✅ ニックネーム入力によるログイン
- ✅ NFCタグスキャンでSE取得
- ✅ SEコレクション一覧表示
- ✅ SE音声再生
- ✅ SE音声ダウンロード
- ✅ 取得済み/未取得の視覚的区別
- ✅ 達成率の表示

## ライセンス

MIT
