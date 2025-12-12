import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import CollectionView from '../views/CollectionView.vue';
import AcquireView from '../views/AcquireView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/collection',
            name: 'collection',
            component: CollectionView,
            meta: { requiresAuth: true }
        },
        {
            path: '/acquire',
            name: 'acquire',
            component: AcquireView,
            meta: { requiresAuth: true }
        },
        {
            path: '/nfc',
            name: 'nfc',
            // beforeEachガードで処理するため、ここではコンポーネントを指定しない
            component: () => import('../views/AcquireView.vue')
        },
        {
            path: '/admin',
            name: 'admin',
            component: () => import('../views/AdminView.vue')
        }
    ]
});

// ルートガード: 認証が必要なページへのアクセス制御
router.beforeEach((to, from, next) => {
    const sessionId = localStorage.getItem('nfc_session_id');
    const isAuthenticated = !!sessionId;

    // NFCタグからのアクセス処理
    if (to.path === '/nfc' && to.query.id) {
        if (!isAuthenticated) {
            // ログインしていない場合、ログイン画面にリダイレクト
            next(`/login?redirect=/nfc&id=${to.query.id}`);
            return;
        }

        // Cloud FunctionsのURLを構築
        const tagId = to.query.id;
        const functionUrl = `https://us-central1-sound-collector-e0e7e.cloudfunctions.net/acquireSE`;
        const redirectUrl = `${functionUrl}?tag_id=${tagId}&session_id=${sessionId}`;

        // Cloud Functionsにリダイレクト
        window.location.href = redirectUrl;
        return;
    }

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.path === '/login' && isAuthenticated) {
        next('/collection');
    } else {
        next();
    }
});

export default router;
