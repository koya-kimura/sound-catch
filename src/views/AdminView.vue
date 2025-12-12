<template>
  <div class="admin-view">
    <!-- パスワード認証画面 -->
    <div v-if="!isAuthenticated" class="auth-screen">
      <div class="auth-container">
        <h1>Sound Catch</h1>
        <h2>管理画面</h2>
        <form @submit.prevent="handleLogin">
          <input
            type="password"
            v-model="password"
            placeholder="パスワードを入力"
            class="password-input"
            autofocus
          />
          <button type="submit" class="btn-login">ログイン</button>
        </form>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- 管理画面本体 -->
    <div v-else class="admin-dashboard">
      <!-- ヘッダー -->
      <header class="header">
        <h1>Sound Catch - 管理画面</h1>
        <button @click="handleLogout" class="btn-logout">ログアウト</button>
      </header>

      <!-- タブ -->
      <div class="tabs">
        <button
          @click="currentTab = 'se'"
          :class="{ active: currentTab === 'se' }"
          class="tab-btn"
        >
          SE管理
        </button>
        <button
          @click="currentTab = 'users'"
          :class="{ active: currentTab === 'users' }"
          class="tab-btn"
        >
          ユーザー管理
        </button>
        <button
          @click="currentTab = 'stats'"
          :class="{ active: currentTab === 'stats' }"
          class="tab-btn"
        >
          統計
        </button>
      </div>

      <!-- タブコンテンツ -->
      <div class="tab-content">
        <SEManagement v-if="currentTab === 'se'" />
        <UserManagement v-if="currentTab === 'users'" />
        <Statistics v-if="currentTab === 'stats'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdmin } from '../composables/useAdmin';
import SEManagement from '../components/admin/SEManagement.vue';
import UserManagement from '../components/admin/UserManagement.vue';
import Statistics from '../components/admin/Statistics.vue';

const router = useRouter();
const { isAuthenticated, checkAuth, login, logout } = useAdmin();

const password = ref('');
const errorMessage = ref('');
const currentTab = ref('se');

onMounted(() => {
  // 認証状態をチェック
  checkAuth();
});

const handleLogin = () => {
  const result = login(password.value);
  if (!result.success) {
    errorMessage.value = result.error;
  } else {
    errorMessage.value = '';
    password.value = '';
  }
};

const handleLogout = () => {
  logout();
  router.push('/');
};
</script>

<style scoped>
.admin-view {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 認証画面 */
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-container {
  background: var(--bg-primary);
  border: 3px solid var(--border-color);
  padding: 3rem 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.auth-container h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.auth-container h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.password-input {
  width: 100%;
  padding: 0.85rem;
  font-size: 0.95rem;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  margin-bottom: 1rem;
}

.password-input:focus {
  border-color: var(--accent-color);
}

.btn-login {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  background: var(--border-color);
  color: var(--bg-primary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-login:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.error-message {
  margin-top: 1rem;
  color: #ff4444;
  font-size: 0.9rem;
}

/* 管理画面本体 */
.admin-dashboard {
  min-height: 100vh;
}

.header {
  background: var(--bg-primary);
  border-bottom: 3px solid var(--border-color);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-logout {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  background: var(--bg-primary);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: var(--bg-tertiary);
}

/* タブ */
.tabs {
  background: var(--bg-primary);
  border-bottom: 2px solid var(--border-color);
  display: flex;
  gap: 0;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: none;
  border-right: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background: var(--bg-tertiary);
}

.tab-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-bottom: 3px solid var(--accent-color);
}

/* タブコンテンツ */
.tab-content {
  padding: 2rem;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .tabs {
    flex-direction: column;
  }

  .tab-btn {
    border-right: none;
    border-bottom: 2px solid var(--border-color);
  }

  .tab-btn:last-child {
    border-bottom: none;
  }

  .tab-content {
    padding: 1rem;
  }
}
</style>
