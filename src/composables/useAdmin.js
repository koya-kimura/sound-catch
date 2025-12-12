import { ref } from 'vue';
import { db, storage } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, orderBy } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// 管理画面用の composable
export function useAdmin() {
    const isAuthenticated = ref(false);
    const loading = ref(false);

    // セッションストレージから認証状態を復元
    const checkAuth = () => {
        const auth = sessionStorage.getItem('admin_authenticated');
        isAuthenticated.value = auth === 'true';
        return isAuthenticated.value;
    };

    // ログイン
    const login = (password) => {
        // パスワードチェック（環境変数または固定値）
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '0000';

        if (password === adminPassword) {
            sessionStorage.setItem('admin_authenticated', 'true');
            isAuthenticated.value = true;
            return { success: true };
        }

        return { success: false, error: 'パスワードが正しくありません' };
    };

    // ログアウト
    const logout = () => {
        sessionStorage.removeItem('admin_authenticated');
        isAuthenticated.value = false;
    };

    // すべてのSEを取得（seIdでソート）
    const fetchAllSEs = async () => {
        loading.value = true;
        try {
            const querySnapshot = await getDocs(collection(db, 'se_master'));
            const ses = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // seIdで昇順ソート
            ses.sort((a, b) => {
                const idA = parseInt(a.seId) || 0;
                const idB = parseInt(b.seId) || 0;
                return idA - idB;
            });

            return { success: true, data: ses };
        } catch (error) {
            console.error('SE取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // SEを更新
    const updateSE = async (seDocId, data) => {
        loading.value = true;
        try {
            await updateDoc(doc(db, 'se_master', seDocId), data);
            return { success: true };
        } catch (error) {
            console.error('SE更新エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // ファイルをStorageにアップロード
    const uploadFile = async (file, folder, filename) => {
        loading.value = true;
        try {
            const fileRef = storageRef(storage, `${folder}/${filename}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            return { success: true, url };
        } catch (error) {
            console.error('ファイルアップロードエラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // すべてのユーザーを取得
    const fetchAllUsers = async () => {
        loading.value = true;
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const users = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return { success: true, data: users };
        } catch (error) {
            console.error('ユーザー取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // ユーザーの取得SE一覧を取得
    const fetchUserSEs = async (userId) => {
        loading.value = true;
        try {
            const q = query(
                collection(db, 'user_ses'),
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            const userSEs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return { success: true, data: userSEs };
        } catch (error) {
            console.error('ユーザーSE取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // ユーザーのクイズ正解数を取得
    const fetchUserQuizScore = async (userId) => {
        loading.value = true;
        try {
            const q = query(
                collection(db, 'user_quiz_scores'),
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return { success: true, data: { correctAnswers: 0 } };
            }

            const userData = querySnapshot.docs[0].data();
            return { success: true, data: userData };
        } catch (error) {
            console.error('クイズスコア取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    // 統計データを取得
    const fetchStatistics = async () => {
        loading.value = true;
        try {
            // すべてのSEを取得
            const sesResult = await fetchAllSEs();
            if (!sesResult.success) return sesResult;

            // すべてのユーザーを取得
            const usersResult = await fetchAllUsers();
            if (!usersResult.success) return usersResult;

            // すべてのuser_sesを取得
            const userSEsSnapshot = await getDocs(collection(db, 'user_ses'));
            const userSEs = userSEsSnapshot.docs.map(doc => doc.data());

            // SEごとの取得数を計算
            const seAcquisitionCounts = {};
            userSEs.forEach(userSE => {
                const seId = userSE.seId;
                if (!seAcquisitionCounts[seId]) {
                    seAcquisitionCounts[seId] = 0;
                }
                seAcquisitionCounts[seId]++;
            });

            // SEごとの取得率を計算
            const totalUsers = usersResult.data.length;
            const seStats = sesResult.data
                .filter(se => se.published === true) // 公開済みのみ
                .map(se => {
                    const count = seAcquisitionCounts[se.seId] || 0;
                    const rate = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                    return {
                        seId: se.seId,
                        name: se.name,
                        acquisitionCount: count,
                        acquisitionRate: rate
                    };
                });

            // 平均取得率を計算
            const avgRate = seStats.length > 0
                ? Math.round(seStats.reduce((sum, se) => sum + se.acquisitionRate, 0) / seStats.length)
                : 0;

            return {
                success: true,
                data: {
                    totalUsers: totalUsers,
                    totalSEs: sesResult.data.filter(se => se.published === true).length,
                    totalAcquisitions: userSEs.length,
                    averageAcquisitionRate: avgRate,
                    seStats: seStats.sort((a, b) => b.acquisitionRate - a.acquisitionRate)
                }
            };
        } catch (error) {
            console.error('統計取得エラー:', error);
            return { success: false, error };
        } finally {
            loading.value = false;
        }
    };

    return {
        isAuthenticated,
        loading,
        checkAuth,
        login,
        logout,
        fetchAllSEs,
        updateSE,
        uploadFile,
        fetchAllUsers,
        fetchUserSEs,
        fetchUserQuizScore,
        fetchStatistics
    };
}
