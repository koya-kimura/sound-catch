<template>
  <div class="user-management">
    <h2>ユーザー管理</h2>

    <div v-if="loading" class="loading">読み込み中...</div>

    <div v-else>
      <!-- ユーザー一覧 -->
      <div class="user-table-container">
        <table class="user-table">
          <thead>
            <tr>
              <th>ニックネーム</th>
              <th>取得SE数</th>
              <th>クイズ正解数</th>
              <th>登録日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in userList" :key="user.id">
              <td>{{ user.nickname }}</td>
              <td>{{ getUserSECount(user.id) }}</td>
              <td>{{ getUserQuizScore(user.id) }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <button @click="showUserDetail(user)" class="btn-detail">
                  詳細
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ユーザー詳細モーダル -->
      <div v-if="selectedUser" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <button class="modal-close" @click="closeModal">×</button>
          
          <h3>{{ selectedUser.nickname }} の詳細</h3>
          
          <div class="detail-section">
            <h4>基本情報</h4>
            <p><strong>セッションID:</strong> {{ selectedUser.sessionId }}</p>
            <p><strong>登録日時:</strong> {{ formatDate(selectedUser.createdAt) }}</p>
          </div>

          <div class="detail-section">
            <h4>取得SE一覧 ({{ userSEs.length }}件)</h4>
            <div v-if="userSEs.length > 0" class="se-list">
              <div v-for="se in userSEs" :key="se.id" class="se-item">
                {{ se.seId }} - {{ getSEName(se.seId) }}
                <span class="se-date">{{ formatDate(se.acquiredAt) }}</span>
              </div>
            </div>
            <p v-else class="empty-message">まだSEを取得していません</p>
          </div>

          <div class="detail-section">
            <h4>クイズ回答状況</h4>
            <p><strong>正解数:</strong> {{ userQuizScore.correctAnswers || 0 }}</p>
            <p v-if="userQuizScore.answeredQuizzes">
              <strong>回答済みSE:</strong> {{ userQuizScore.answeredQuizzes.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

const { loading, fetchAllUsers, fetchUserSEs, fetchUserQuizScore, fetchAllSEs } = useAdmin();

const userList = ref([]);
const userSECounts = ref({});
const userQuizScores = ref({});
const seList = ref([]);
const selectedUser = ref(null);
const userSEs = ref([]);
const userQuizScore = ref({});

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  // ユーザー一覧を取得
  const usersResult = await fetchAllUsers();
  if (usersResult.success) {
    userList.value = usersResult.data;
    
    // 各ユーザーのSE数とクイズスコアを取得
    for (const user of userList.value) {
      const sesResult = await fetchUserSEs(user.id);
      if (sesResult.success) {
        userSECounts.value[user.id] = sesResult.data.length;
      }
      
      const quizResult = await fetchUserQuizScore(user.id);
      if (quizResult.success) {
        userQuizScores.value[user.id] = quizResult.data.correctAnswers || 0;
      }
    }
  }
  
  // SE一覧を取得（詳細表示用）
  const sesResult = await fetchAllSEs();
  if (sesResult.success) {
    seList.value = sesResult.data;
  }
};

const getUserSECount = (userId) => {
  return userSECounts.value[userId] || 0;
};

const getUserQuizScore = (userId) => {
  return userQuizScores.value[userId] || 0;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '-';
  }
  
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const showUserDetail = async (user) => {
  selectedUser.value = user;
  
  // ユーザーの取得SE一覧を取得
  const sesResult = await fetchUserSEs(user.id);
  if (sesResult.success) {
    userSEs.value = sesResult.data;
  }
  
  // ユーザーのクイズスコアを取得
  const quizResult = await fetchUserQuizScore(user.id);
  if (quizResult.success) {
    userQuizScore.value = quizResult.data;
  }
};

const closeModal = () => {
  selectedUser.value = null;
  userSEs.value = [];
  userQuizScore.value = {};
};

const getSEName = (seId) => {
  const se = seList.value.find(s => s.seId === seId);
  return se ? se.name : '不明';
};
</script>

<style scoped>
.user-management {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.user-table-container {
  overflow-x: auto;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.user-table th {
  background: var(--bg-tertiary);
  font-weight: 700;
  color: var(--text-primary);
}

.user-table td {
  color: var(--text-primary);
}

.user-table tr:hover {
  background: var(--bg-secondary);
}

.btn-detail {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--bg-primary);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-detail:hover {
  background: var(--bg-tertiary);
}

/* モーダル */
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
  padding: 2rem;
}

.modal {
  background: var(--bg-primary);
  border: 3px solid var(--border-color);
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-primary);
  line-height: 1;
}

.modal h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.detail-section p {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.se-list {
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  padding: 0.5rem;
}

.se-item {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.se-item:last-child {
  border-bottom: none;
}

.se-date {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.empty-message {
  color: var(--text-secondary);
  font-style: italic;
}
</style>
