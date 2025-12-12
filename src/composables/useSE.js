import { ref } from 'vue';
import { db, storage } from '../firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { useAuth } from './useAuth';

// SE管理用の composable
export function useSE() {
    const seMaster = ref([]);
    const userSEs = ref([]);
    const loading = ref(false);
    const loadingMaster = ref(false);
    const loadingUserSEs = ref(false);

    // SE情報を取得（リアルタイム監視）
    let unsubscribeSEMaster = null;

    const fetchSEMaster = () => {
        loadingMaster.value = true;

        // 既存のリスナーがあれば解除
        if (unsubscribeSEMaster) {
            unsubscribeSEMaster();
        }

        // リアルタイム監視を開始
        unsubscribeSEMaster = onSnapshot(
            collection(db, 'se_master'),
            (querySnapshot) => {
                seMaster.value = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                loadingMaster.value = false;
            },
            (error) => {
                console.error('SEマスター取得エラー:', error);
                loadingMaster.value = false;
            }
        );
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
            const q = query(
                collection(db, 'user_ses'),
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);

            userSEs.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, data: userSEs.value };
        } catch (error) {
            console.error('ユーザーSE取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // SEが取得済みかチェック（forceUnlock=trueの場合も取得済みとして扱う）
    const isSEAcquired = (seId) => {
        // 実際に取得済みかチェック
        const actuallyAcquired = userSEs.value.some(se => se.seId === seId);
        if (actuallyAcquired) return true;

        // forceUnlock=trueの場合も取得済みとして扱う
        const forcedSE = seMaster.value.find(se => se.seId === seId && se.forceUnlock === true);
        return !!forcedSE;
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
            const extensions = ['mp3', 'm4a'];
            let audioUrl = null;

            for (const ext of extensions) {
                try {
                    const audioRef = storageRef(storage, `se_audio/${seId}.${ext}`);
                    audioUrl = await getDownloadURL(audioRef);
                    break;
                } catch (error) {
                    continue;
                }
            }

            if (!audioUrl) {
                return { success: false, error: '音声ファイルが見つかりません' };
            }

            const audio = new Audio(audioUrl);

            // requestAnimationFrameを使用してスムーズな更新
            let animationFrameId = null;
            const updateProgress = () => {
                if (audio.currentTime > 0 && !audio.paused) {
                    const progress = (audio.currentTime / audio.duration) * 100;
                    if (onProgress) {
                        onProgress({
                            progress,
                            currentTime: audio.currentTime,
                            duration: audio.duration
                        });
                    }
                    animationFrameId = requestAnimationFrame(updateProgress);
                }
            };

            audio.addEventListener('play', () => {
                updateProgress();
            });

            audio.addEventListener('ended', () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                if (onEnded) onEnded();
            });

            audio.addEventListener('pause', () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            });

            await audio.play();

            return { success: true, audio };
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

    // SE画像ファイルのURLを取得（jpg, pngに対応）
    const getSEImageURL = async (seId) => {
        const extensions = ['jpg', 'png'];

        for (const ext of extensions) {
            try {
                const fileName = `${seId}.${ext}`;
                const fileRef = storageRef(storage, `se_images/${fileName}`);
                const url = await getDownloadURL(fileRef);
                return { success: true, url, extension: ext };
            } catch (error) {
                // 404エラーはコンソールに出力しない（正常な動作）
                continue;
            }
        }

        // どの画像も見つからなかった場合、デフォルト画像を試す（sample.png）
        try {
            const defaultFileRef = storageRef(storage, 'se_images/sample.png');
            const url = await getDownloadURL(defaultFileRef);
            return { success: true, url, extension: 'png', isDefault: true };
        } catch (error) {
            // sample.pngもない場合、画像なしとして扱う（エラーではない）
            return { success: false, error: '画像が見つかりません' };
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

    // クリーンアップ関数
    const cleanup = () => {
        if (unsubscribeSEMaster) {
            unsubscribeSEMaster();
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
        saveQuizAnswer,
        cleanup
    };
}
