const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// .envファイルを読み込む
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const firebaseConfig = {
    apiKey: envVars.VITE_FIREBASE_API_KEY,
    authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: envVars.VITE_FIREBASE_PROJECT_ID,
    storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: envVars.VITE_FIREBASE_APP_ID
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addQuizQuestionField() {
    try {
        console.log('se_masterコレクションを取得中...');

        const querySnapshot = await getDocs(collection(db, 'se_master'));
        const total = querySnapshot.size;

        console.log(`${total}件のドキュメントが見つかりました`);

        let updated = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();

            // quizQuestionフィールドがない場合のみ追加
            if (!data.quizQuestion) {
                await updateDoc(doc(db, 'se_master', docSnapshot.id), {
                    quizQuestion: 'この曲はなんでしょう？' // デフォルトの問題文
                });

                updated++;
                console.log(`✓ ${docSnapshot.id} (seId: ${data.seId}) にquizQuestionフィールドを追加しました`);
            } else {
                console.log(`- ${docSnapshot.id} (seId: ${data.seId}) は既にquizQuestionフィールドがあります`);
            }
        }

        console.log('\n完了しました！');
        console.log(`更新: ${updated}件 / 全体: ${total}件`);

    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
}

// 実行
addQuizQuestionField();
