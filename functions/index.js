const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * SE取得API (Cloud Functions v2)
 * クエリパラメータ:
 *   - tag_id: NFCタグのID (例: "01", "02", ...)
 *   - session_id: ユーザーのセッションID
 */
exports.acquireSE = onRequest(async (req, res) => {
    try {
        const { tag_id, session_id } = req.query;

        // リファラーから元のアプリケーションのベースURLを取得
        const referer = req.headers.referer || req.headers.origin;
        let baseUrl = 'http://localhost:5173'; // デフォルト

        if (referer) {
            try {
                const url = new URL(referer);
                baseUrl = `${url.protocol}//${url.host}`;
            } catch (e) {
                console.log('リファラーのパースに失敗:', e);
            }
        }

        // パラメータチェック
        if (!tag_id || !session_id) {
            return res.redirect(
                `${baseUrl}/acquire?success=false&error=missing_params`
            );
        }

        // 1. セッションIDでユーザーを検証
        const usersSnapshot = await db
            .collection('users')
            .where('sessionId', '==', session_id)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            return res.redirect(
                `${baseUrl}/acquire?success=false&error=unauthorized`
            );
        }

        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;

        // 2. タグIDが有効なSEか検証
        const seMasterSnapshot = await db
            .collection('se_master')
            .where('seId', '==', tag_id)
            .limit(1)
            .get();

        if (seMasterSnapshot.empty) {
            return res.redirect(
                `${baseUrl}/acquire?success=false&error=invalid_tag`
            );
        }

        const seDoc = seMasterSnapshot.docs[0];
        const seData = seDoc.data();
        const seId = seData.seId;

        // 公開状態チェック
        // publishedがfalseまたは未設定の場合はCOMING SOON
        if (seData.published !== true) {
            return res.redirect(
                `${baseUrl}/acquire?success=false&error=coming_soon&se_id=${seId}`
            );
        }

        // 3. 重複チェック: 既に取得済みか確認
        const userSESnapshot = await db
            .collection('user_ses')
            .where('userId', '==', userId)
            .where('seId', '==', seId)
            .limit(1)
            .get();

        if (!userSESnapshot.empty) {
            return res.redirect(
                `${baseUrl}/acquire?success=false&error=already_acquired&se_id=${seId}`
            );
        }

        // 4. SE取得: user_sesコレクションに追加
        await db.collection('user_ses').add({
            userId: userId,
            seId: seId,
            acquiredAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 5. 成功リダイレクト
        return res.redirect(
            `${baseUrl}/acquire?success=true&se_id=${seId}`
        );

    } catch (error) {
        console.error('SE取得エラー:', error);

        // エラー時も元のアプリにリダイレクト
        const referer = req.headers.referer || req.headers.origin;
        let baseUrl = 'http://localhost:5173';

        if (referer) {
            try {
                const url = new URL(referer);
                baseUrl = `${url.protocol}//${url.host}`;
            } catch (e) {
                // ignore
            }
        }

        return res.redirect(
            `${baseUrl}/acquire?success=false&error=server_error`
        );
    }
});
