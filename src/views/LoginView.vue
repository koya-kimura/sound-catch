<template>
  <div class="login-view">
    <div class="login-container">
      <header class="header">
        <h1>NFC Sound Collector</h1>
        <p class="subtitle">ニックネームを入力してスタート</p>
      </header>

      <div class="login-form">
        <div class="form-group">
          <label for="nickname">ニックネーム</label>
          <input
            id="nickname"
            v-model="nicknameInput"
            type="text"
            placeholder="ニックネームを入力"
            @keyup.enter="handleLogin"
            :disabled="isLoading"
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button
          @click="handleLogin"
          class="btn-login"
          :disabled="isLoading"
        >
          {{ isLoading ? '処理中...' : 'スタート' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login } = useAuth();

const nicknameInput = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!nicknameInput.value.trim()) {
    errorMessage.value = 'ニックネームを入力してください';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  const result = await login(nicknameInput.value.trim());

  if (result.success) {
    // コンソールにログイン情報を表示
    if (result.isNewUser) {
      console.log('✅ 新規ユーザー登録が完了しました！');
    } else {
      console.log('✅ おかえりなさい！既存ユーザーとしてログインしました。');
    }
    router.push('/collection');
  } else {
    errorMessage.value = 'ログインに失敗しました。もう一度お試しください。';
  }

  isLoading.value = false;
};
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 500px;
}

/* ヘッダー */
.header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--bg-primary);
  border: 3px solid var(--border-color);
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 400;
}

/* フォーム */
.login-form {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 500;
}

input[type="text"] {
  width: 100%;
  padding: 0.85rem 1rem;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="text"]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(33, 37, 41, 0.1);
}

input[type="text"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

input[type="text"]::placeholder {
  color: var(--text-secondary);
}

/* エラーメッセージ */
.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

/* ログインボタン */
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

.btn-login:hover:not(:disabled) {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .login-view {
    padding: 1rem;
  }
  
  .header {
    padding: 1.5rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .login-form {
    padding: 1.5rem;
  }
}
</style>
