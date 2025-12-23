<template>
  <div class="login-view">
    <div class="login-container">
      <h1 class="service-title">アカペラドン！</h1>

      <form @submit.prevent="handleSubmit" class="login-form">
        <input
          v-model="nickname"
          type="text"
          placeholder="ニックネームを入力してね！"
          class="nickname-input"
          maxlength="20"
          required
        />
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? "処理中..." : "次へ" }}
        </button>
      </form>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>

    <!-- 新規登録確認モーダル -->
    <div
      v-if="showConfirmModal"
      class="modal-overlay"
      @click="cancelRegistration"
    >
      <div class="modal" @click.stop>
        <h2>新規登録</h2>
        <p class="modal-text">
          ニックネーム「<strong>{{ nickname }}</strong
          >」で登録しますか？
        </p>
        <div class="modal-buttons">
          <button @click="confirmRegistration" class="btn-confirm">
            登録する
          </button>
          <button @click="cancelRegistration" class="btn-cancel">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const router = useRouter();
const { login, initSession } = useAuth();

const nickname = ref("");
const loading = ref(false);
const errorMessage = ref("");
const showConfirmModal = ref(false);
const isNewUser = ref(false);

// セッションを初期化（既にログイン済みの場合は自動ログイン）
initSession();

onMounted(() => {
  document.body.classList.add("no-scroll");
});

onUnmounted(() => {
  document.body.classList.remove("no-scroll");
});

const handleSubmit = async () => {
  if (!nickname.value.trim()) {
    errorMessage.value = "ニックネームを入力してください";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    // 既存のニックネームを検索
    const q = query(
      collection(db, "users"),
      where("nickname", "==", nickname.value.trim())
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // 新規ユーザー：確認モーダルを表示
      isNewUser.value = true;
      showConfirmModal.value = true;
      loading.value = false;
    } else {
      // 既存ユーザー：そのままログイン
      await performLogin();
    }
  } catch (error) {
    console.error("ユーザーチェックエラー:", error);
    errorMessage.value = "エラーが発生しました";
    loading.value = false;
  }
};

const performLogin = async () => {
  const result = await login(nickname.value.trim());

  if (result.success) {
    router.push("/collection");
  } else {
    errorMessage.value = "ログインに失敗しました";
  }

  loading.value = false;
};

const confirmRegistration = async () => {
  showConfirmModal.value = false;
  loading.value = true;
  await performLogin();
};

const cancelRegistration = () => {
  showConfirmModal.value = false;
  isNewUser.value = false;
  loading.value = false;
};
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  min-height: 100dvh;
  /* background: var(--bg-secondary); */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 500px;
  transform: translateY(-5vh);
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.service-title {
  font-size: 3rem;
  padding-bottom: 2rem;
  text-align: center;
  margin: 0;
}

/* フォーム */
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
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
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 1rem;
  text-align: center;
}

/* 確認モーダル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 2rem;
  max-width: 400px;
  width: 90%;
}

.modal h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.modal-text {
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.modal-text strong {
  color: var(--accent-color);
  font-weight: 700;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
}

.btn-confirm,
.btn-cancel {
  flex: 1;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm {
  background: var(--border-color);
  color: var(--bg-primary);
}

.btn-confirm:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.btn-cancel {
  background: var(--bg-primary);
  color: var(--border-color);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}
/* ログインボタン */
.btn-login {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
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

  .service-title {
    font-size: 2rem;
    padding-bottom: 0rem;
  }
}
</style>
