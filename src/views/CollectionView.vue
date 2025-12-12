<template>
  <div class="collection-view">
    <header class="header">
      <h1>Sound Catch</h1>
      <div class="user-info">
        <span class="nickname">{{ nickname }}</span>
        <button @click="handleLogout" class="btn-logout">ログアウト</button>
      </div>
    </header>

    <div class="container">
      <!-- 統計情報 -->
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">取得済み</span>
          <span class="stat-value">{{ acquiredCount }} / {{ totalCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">達成率</span>
          <span class="stat-value">{{ completionRate }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">クイズ正解数</span>
          <span class="stat-value">{{ quizCorrectCount }}</span>
        </div>
      </div>

      <!-- SEグリッド -->
      <div v-if="loading" class="loading">読み込み中...</div>
      <div v-else class="se-grid">
        <SECard
          v-for="se in seMasterList"
          :key="se.seId"
          :se="se"
          :acquired="isSEAcquired(se.seId)"
          :coming-soon="se.comingSoon || false"
          :is-quiz-answered="answeredQuizzes.includes(se.seId)"
          @play="handlePlay"
          @download="handleDownload"
          @quiz-answered="handleQuizAnswered"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSE } from '../composables/useSE';
import SECard from '../components/SECard.vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const router = useRouter();
const route = useRoute();
const { nickname, userId, logout } = useAuth();
const { seMaster, userSEs, loading, fetchSEMaster, fetchUserSEs, isSEAcquired, playSound, downloadSound, checkAndUnlockForcedSEs } = useSE();

const seMasterList = computed(() => {
  // seIdで昇順ソート（数値として比較）
  return [...seMaster.value].sort((a, b) => {
    const idA = parseInt(a.seId) || 0;
    const idB = parseInt(b.seId) || 0;
    return idA - idB;
  }).map(se => {
    // publishedがfalseまたは未設定の場合、COMING SOONとして扱う
    const isPublished = se.published === true;
    return {
      ...se,
      comingSoon: !isPublished
    };
  });
});

// COMING SOONを除外した総数
const totalCount = computed(() => 
  seMasterList.value.filter(se => !se.comingSoon).length
);

const acquiredCount = computed(() => userSEs.value.length);
const completionRate = computed(() => 
  totalCount.value > 0 ? Math.round((acquiredCount.value / totalCount.value) * 100) : 0
);

const quizCorrectCount = ref(0);
const answeredQuizzes = ref([]);

// クイズ正解数を取得
const fetchQuizScore = async () => {
  if (!userId.value) return;
  
  try {
    const userQuizRef = collection(db, 'user_quiz_scores');
    const q = query(userQuizRef, where('userId', '==', userId.value));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      quizCorrectCount.value = userData.correctAnswers || 0;
      answeredQuizzes.value = userData.answeredQuizzes || [];
    }
  } catch (error) {
    console.error('クイズ正解数取得エラー:', error);
  }
};

const handlePlay = async (se, callbacks) => {
  const result = await playSound(
    se.seId,
    callbacks.onProgress,
    callbacks.onEnded
  );
  
  if (result.success && result.audio) {
    callbacks.onAudio(result.audio);
  }
};

const handleDownload = async (se) => {
  const result = await downloadSound(se.seId, se.name);
  if (!result.success) {
    alert('ダウンロードに失敗しました');
  }
};

const handleQuizAnswered = async (data) => {
  console.log('[handleQuizAnswered] クイズ回答を受信:', data);
  if (data.isCorrect) {
    // 正解数を再取得
    await fetchQuizScore();
    console.log('[handleQuizAnswered] 正解数を更新:', quizCorrectCount.value);
  }
};

const handleLogout = () => {
  logout();
  router.push('/login');
};

const loadData = async () => {
  console.log('=== CollectionView loadData 開始 ===');
  console.log('現在のユーザーID:', userId.value);
  console.log('現在のニックネーム:', nickname.value);
  
  await fetchSEMaster();
  console.log('SEマスター取得完了:', seMaster.value.length, '件');
  
  if (userId.value) {
    // 全員配布SEを自動取得
    const forceResult = await checkAndUnlockForcedSEs();
    if (forceResult.success && forceResult.count > 0) {
      console.log(`${forceResult.count}件のSEを自動取得しました`);
    }
    
    await fetchUserSEs(userId.value);
    console.log('ユーザーSE取得完了:', userSEs.value.length, '件');
    
    await fetchQuizScore();
    console.log('クイズ正解数:', quizCorrectCount.value);
  } else {
    console.warn('⚠️ userIdが存在しません！');
  }
  
  console.log('=== CollectionView loadData 終了 ===');
};

onMounted(async () => {
  await loadData();
});

// ルートが変更され、このコンポーネントに戻ってきたときにデータを再読み込み
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/collection' && oldPath && oldPath !== '/collection') {
    console.log('コレクション画面に戻りました。データを再読み込みします。');
    loadData();
  }
});
</script>

<style scoped>
.collection-view {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* ヘッダー */
.header {
  background: var(--bg-primary);
  border-bottom: 3px solid var(--border-color);
  padding: 2rem;
  text-align: center;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.nickname {
  font-size: 0.95rem;
  font-weight: 500;
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

/* コンテナ */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 統計情報 */
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 1.5rem;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* ローディング */
.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1rem;
  color: var(--text-secondary);
}

/* SEグリッド */
.se-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .se-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }
  
  .header {
    padding: 1.5rem 1rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
}
</style>
