import { ref } from 'vue';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// ローカルストレージのキー
const SESSION_KEY = 'nfc_session_id';
const USER_ID_KEY = 'nfc_user_id';
const NICKNAME_KEY = 'nfc_nickname';

// グローバル状態（すべてのコンポーネント間で共有）
const sessionId = ref(null);
const userId = ref(null);
const nickname = ref(null);
const isAuthenticated = ref(false);

// セッション管理用の composable
export function useAuth() {
    // セッションの初期化
    const initSession = () => {
        const storedSessionId = localStorage.getItem(SESSION_KEY);
        const storedUserId = localStorage.getItem(USER_ID_KEY);
        const storedNickname = localStorage.getItem(NICKNAME_KEY);

        console.log('=== セッション初期化 ===');
        console.log('LocalStorageから取得:', {
            sessionId: storedSessionId,
            userId: storedUserId,
            nickname: storedNickname
        });

        if (storedSessionId && storedUserId && storedNickname) {
            sessionId.value = storedSessionId;
            userId.value = storedUserId;
            nickname.value = storedNickname;
            isAuthenticated.value = true;

            console.log('✅ セッション復元成功');
        } else {
            console.log('❌ セッション情報が不完全');
        }
    };

    // ログイン処理
    const login = async (userNickname) => {
        try {
            console.log('=== ログイン処理開始 ===');
            console.log('ニックネーム:', userNickname);

            // 1. 既存のニックネームを検索
            const q = query(
                collection(db, 'users'),
                where('nickname', '==', userNickname)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // 既存ユーザーが見つかった場合、そのユーザーでログイン
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const existingUserId = userDoc.id;
                const existingSessionId = userData.sessionId;

                // ローカルストレージに保存
                localStorage.setItem(SESSION_KEY, existingSessionId);
                localStorage.setItem(USER_ID_KEY, existingUserId);
                localStorage.setItem(NICKNAME_KEY, userNickname);

                // 状態を更新
                sessionId.value = existingSessionId;
                userId.value = existingUserId;
                nickname.value = userNickname;
                isAuthenticated.value = true;

                console.log('✅ 既存ユーザーでログイン:', existingUserId);
                return { success: true, isNewUser: false };
            }

            // 2. 新規ユーザーの場合、登録する
            const newSessionId = uuidv4();

            // Firestoreにユーザーを作成
            const userRef = await addDoc(collection(db, 'users'), {
                nickname: userNickname,
                sessionId: newSessionId,
                createdAt: new Date()
            });

            // ローカルストレージに保存
            localStorage.setItem(SESSION_KEY, newSessionId);
            localStorage.setItem(USER_ID_KEY, userRef.id);
            localStorage.setItem(NICKNAME_KEY, userNickname);

            // 状態を更新
            sessionId.value = newSessionId;
            userId.value = userRef.id;
            nickname.value = userNickname;
            isAuthenticated.value = true;

            console.log('✅ 新規ユーザーを登録:', userRef.id);
            return { success: true, isNewUser: true };
        } catch (error) {
            console.error('❌ ログインエラー:', error);
            return { success: false, error };
        }
    };

    // ログアウト処理
    const logout = () => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(NICKNAME_KEY);

        sessionId.value = null;
        userId.value = null;
        nickname.value = null;
        isAuthenticated.value = false;

        console.log('✅ ログアウト完了');
    };

    // セッションIDでユーザーを検証
    const verifySession = async (sid) => {
        try {
            const q = query(
                collection(db, 'users'),
                where('sessionId', '==', sid)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                return {
                    valid: true,
                    userId: userDoc.id,
                    userData: userDoc.data()
                };
            }

            return { valid: false };
        } catch (error) {
            console.error('セッション検証エラー:', error);
            return { valid: false, error };
        }
    };

    return {
        sessionId,
        userId,
        nickname,
        isAuthenticated,
        initSession,
        login,
        logout,
        verifySession
    };
}
