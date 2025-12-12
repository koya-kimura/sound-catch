const admin = require('firebase-admin');

// サービスアカウントキーを読み込み
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * すべてのse_masterドキュメントにpublishedフィールドを追加
 * デフォルト値: false（非公開）
 */
async function addPublishedField() {
    try {
        console.log('se_masterコレクションを取得中...');
        const snapshot = await db.collection('se_master').get();

        if (snapshot.empty) {
            console.log('se_masterコレクションにドキュメントが見つかりませんでした。');
            return;
        }

        console.log(`${snapshot.size}件のドキュメントが見つかりました。`);
        console.log('publishedフィールドを追加中...\n');

        let updateCount = 0;
        let skipCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();

            // 既にpublishedフィールドが存在する場合はスキップ
            if (data.hasOwnProperty('published')) {
                console.log(`⏩ ${doc.id} (seId: ${data.seId}) - 既にpublishedフィールドが存在します`);
                skipCount++;
                continue;
            }

            // publishedフィールドを追加（デフォルト: false）
            await doc.ref.update({
                published: false
            });

            console.log(`✅ ${doc.id} (seId: ${data.seId}) - published: false を追加しました`);
            updateCount++;
        }

        console.log('\n=== 完了 ===');
        console.log(`更新: ${updateCount}件`);
        console.log(`スキップ: ${skipCount}件`);
        console.log('合計: ' + snapshot.size + '件');

    } catch (error) {
        console.error('エラーが発生しました:', error);
    } finally {
        // Firebase Admin SDKを終了
        await admin.app().delete();
    }
}

// スクリプト実行
addPublishedField();
