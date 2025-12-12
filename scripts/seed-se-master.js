import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// サービスアカウントキーを読み込み
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 30種類のSEマスターデータを投入
async function seedSEMaster() {
    const batch = db.batch();

    for (let i = 1; i <= 30; i++) {
        const seId = String(i).padStart(2, '0'); // "01", "02", ... "30"
        const seRef = db.collection('se_master').doc();

        batch.set(seRef, {
            seId: seId,
            name: `SE-${seId}`,
            fileName: `${seId}.mp3`,
            storageUrl: `se_files/${seId}.mp3`
        });
    }

    await batch.commit();
    console.log('✅ SEマスターデータ30件を投入しました');
}

seedSEMaster()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ エラー:', error);
        process.exit(1);
    });
