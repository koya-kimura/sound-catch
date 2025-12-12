import { ref } from 'vue';
import { db, storage } from '../firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, limit } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';

// SE管理用の composable
export function useSE() {
    const seMaster = ref([]);
    const userSEs = ref([]);
    const loading = ref(false);

    // SEマスターデータの取得
    const fetchSEMaster = async () => {
        loading.value = true;
        try {
            const querySnapshot = await getDocs(collection(db, 'se_master'));
            seMaster.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return { success: true, data: seMaster.value };
        } catch (error) {
            console.error('SEマスター取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // SEマスターデータからIDで特定のSEを取得
    const getSEById = async (seId) => {
        try {
            const q = query(
                collection(db, 'se_master'),
                where('seId', '==', seId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return { success: false, error: 'SE not found' };
            }

            const seDoc = querySnapshot.docs[0];
            return {
                success: true,
                se: {
                    id: seDoc.id,
                    ...seDoc.data()
                }
            };
        } catch (error) {
            console.error('SE取得エラー:', error);
            return { success: false, error };
        }
    };

    // ユーザーの所持SEを取得
    const fetchUserSEs = async (userId) => {
        loading.value = true;
        try {
            console.log('=== fetchUserSEs 開始 ===');
            console.log('検索するユーザーID:', userId);

            const q = query(
                collection(db, 'user_ses'),
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);

            console.log('取得したドキュメント数:', querySnapshot.size);

            userSEs.value = querySnapshot.docs.map(doc => {
                const data = {
                    id: doc.id,
                    ...doc.data()
                };
                console.log('取得したSE:', data);
                return data;
            });

            console.log('userSEs.value:', userSEs.value);
            console.log('=== fetchUserSEs 終了 ===');

            return { success: true, data: userSEs.value };
        } catch (error) {
            console.error('ユーザーSE取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // SEが取得済みかチェック
    const isSEAcquired = (seId) => {
        return userSEs.value.some(se => se.seId === seId);
    };

    // SE音声ファイルのURLを取得（mp3とm4aの両方に対応）
    const getSEAudioURL = async (seId) => {
        // 優先順位: mp3 → m4a
        const extensions = ['mp3', 'm4a'];

        for (const ext of extensions) {
            try {
                const fileName = `${seId}.${ext}`;
                const fileRef = storageRef(storage, `se_files/${fileName}`);
                const url = await getDownloadURL(fileRef);
                return { success: true, url, extension: ext };
            } catch (error) {
                // このファイルが存在しない場合、次の拡張子を試す
                continue;
            }
        }

        // どちらの形式も見つからなかった
        console.error(`音声ファイルが見つかりません: ${seId}`);
        return { success: false, error: 'ファイルが見つかりません' };
    };

    // SE音声の再生
    const playSound = async (seId, onProgress, onEnded) => {
        try {
            const result = await getSEAudioURL(seId);
            if (result.success) {
                const audio = new Audio(result.url);

                // 進捗更新
                audio.addEventListener('timeupdate', () => {
                    if (onProgress) {
                        onProgress({
                            currentTime: audio.currentTime,
                            duration: audio.duration,
                            progress: (audio.currentTime / audio.duration) * 100
                        });
                    }
                });

                // 再生終了時
                audio.addEventListener('ended', () => {
                    if (onEnded) {
                        onEnded();
                    }
                });

                await audio.play();
                return { success: true, audio };
            }
            return { success: false, error: 'URL取得失敗' };
        } catch (error) {
            console.error('音声再生エラー:', error);
            return { success: false, error };
        }
    };

    // SE音声のダウンロード
    const downloadSound = async (seId, seName) => {
        try {
            const result = await getSEAudioURL(seId);
            if (result.success) {
                // URLから直接ダウンロード（fetchを使わずCORSエラーを回避）
                const link = document.createElement('a');
                link.href = result.url;
                link.download = `${seName}.${result.extension}`;
                link.target = '_blank'; // 新しいタブで開く
                link.rel = 'noopener noreferrer';

                // クリックしてダウンロード
                document.body.appendChild(link);
                link.click();

                // クリーンアップ
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);

                return { success: true };
            }
            return { success: false, error: 'URL取得失敗' };
        } catch (error) {
            console.error('ダウンロードエラー:', error);
            return { success: false, error };
        }
    };

    // SE画像ファイルのURLを取得（jpg, png, webpに対応）
    const getSEImageURL = async (seId) => {
        console.log(`[getSEImageURL] seId: ${seId} の画像を取得中...`);

        // 優先順位: jpg → png → webp
        const extensions = ['jpg', 'png', 'webp'];

        for (const ext of extensions) {
            try {
                const fileName = `${seId}.${ext}`;
                const fileRef = storageRef(storage, `se_images/${fileName}`);
                const url = await getDownloadURL(fileRef);
                console.log(`[getSEImageURL] 成功: se_images/${fileName}`);
                return { success: true, url, extension: ext };
            } catch (error) {
                // このファイルが存在しない場合、次の拡張子を試す
                console.log(`[getSEImageURL] 見つからない: se_images/${seId}.${ext}`);
                continue;
            }
        }

        // どの画像も見つからなかった場合、デフォルト画像を試す
        console.log(`[getSEImageURL] ${seId} の画像が見つからない。sample.pngを試します...`);
        try {
            const defaultFileRef = storageRef(storage, 'se_images/sample.png');
            const url = await getDownloadURL(defaultFileRef);
            console.log(`[getSEImageURL] 成功: sample.png を使用`);
            return { success: true, url, extension: 'png', isDefault: true };
        } catch (error) {
            // デフォルト画像もない場合は、画像なしとして扱う
            console.error(`[getSEImageURL] sample.pngも取得できませんでした:`, error);
            console.log(`画像ファイルが見つかりません（sample.pngも含む）: ${seId}`);
            return { success: false, url: null };
        }
    };

    // クイズの正解を保存（ユーザーごとの正解数を更新）
    const saveQuizAnswer = async (userId, seId, isCorrect) => {
        try {
            if (!isCorrect) {
                return { success: true, message: '不正解' };
            }

            // ユーザーのクイズ正解数を取得または作成
            const userQuizRef = collection(db, 'user_quiz_scores');
            const q = query(userQuizRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // 新規ユーザー: ドキュメントを作成
                const docRef = await addDoc(userQuizRef, {
                    userId,
                    correctAnswers: 1,
                    answeredQuizzes: [seId],
                    updatedAt: new Date()
                });
                return { success: true, message: '正解！', correctCount: 1 };
            } else {
                // 既存ユーザー: 正解数を更新
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const answeredQuizzes = userData.answeredQuizzes || [];

                // 既に回答済みかチェック
                if (answeredQuizzes.includes(seId)) {
                    return { success: true, message: '既に回答済みです', correctCount: userData.correctAnswers };
                }

                // 正解数を更新
                const newCorrectCount = (userData.correctAnswers || 0) + 1;
                const newAnsweredQuizzes = [...answeredQuizzes, seId];

                await updateDoc(doc(db, 'user_quiz_scores', userDoc.id), {
                    correctAnswers: newCorrectCount,
                    answeredQuizzes: newAnsweredQuizzes,
                    updatedAt: new Date()
                });

                return { success: true, message: '正解！', correctCount: newCorrectCount };
            }
        } catch (error) {
            console.error('クイズ回答保存エラー:', error);
            return { success: false, error };
        }
    };

    return {
        seMaster,
        userSEs,
        loading,
        fetchSEMaster,
        fetchUserSEs,
        getSEById,
        isSEAcquired,
        getSEAudioURL,
        getSEImageURL,
        playSound,
        downloadSound,
        saveQuizAnswer
    };
}
