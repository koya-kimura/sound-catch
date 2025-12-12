<template>
  <div class="se-card" :class="{ acquired: acquired && !comingSoon, 'coming-soon': comingSoon }">
    <div class="se-controls">
      <!-- 画像兼再生ボタン -->
      <button @click="handlePlay" class="btn-play-image" :disabled="!acquired || comingSoon">
        <img 
          v-if="imageUrl" 
          :src="imageUrl" 
          :alt="se.name"
          class="play-image"
          :class="{ playing: isPlaying, locked: !acquired }"
        />
        <div v-else class="play-placeholder">
          <span>{{ se.name }}</span>
        </div>
        
        <!-- COMING SOONオーバーレイ -->
        <div v-if="comingSoon" class="coming-soon-overlay">
          <span class="coming-soon-text">COMING SOON</span>
        </div>
        
        <!-- 未取得オーバーレイ -->
        <div v-else-if="!acquired" class="locked-overlay">
          <span class="locked-text">未取得</span>
        </div>
        
        <!-- 再生中のオーバーレイ -->
        <div v-if="isPlaying && acquired" class="play-overlay">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="time-display">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>
        </div>
      </button>
      
      <!-- ダウンロードボタン -->
      <button @click="handleDownload" class="btn-download" :disabled="!acquired || comingSoon">
        ダウンロード
      </button>

      <!-- クイズボタン -->
      <button @click="handleQuiz" class="btn-quiz" :disabled="!acquired || comingSoon">
        クイズ
      </button>
    </div>

    <!-- クイズモーダル -->
    <div v-if="showQuizModal" class="quiz-modal-overlay" @click="closeQuizModal">
      <div class="quiz-modal" @click.stop>
        <!-- 閉じるボタン -->
        <button class="quiz-close-btn" @click="closeQuizModal">×</button>
        
        <h3>この曲はなんでしょう？</h3>
        <input 
          v-model="quizAnswer" 
          type="text" 
          placeholder="回答を入力してください"
          class="quiz-input"
          @keyup.enter="submitQuiz"
          :disabled="isQuizSubmitting || !!quizResult"
        />
        
        <!-- 結果表示 -->
        <div v-if="quizResult" class="quiz-result">
          {{ quizResult }}
        </div>
        
        <div class="quiz-buttons">
          <button 
            @click="submitQuiz" 
            class="btn-submit"
            :disabled="isQuizSubmitting || !!quizResult || !quizAnswer.trim()"
          >
            {{ isQuizSubmitting ? '送信中...' : '回答する' }}
          </button>
          <button 
            @click="closeQuizModal" 
            class="btn-cancel"
            :disabled="isQuizSubmitting"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSE } from '../composables/useSE';
import { useAuth } from '../composables/useAuth';

const props = defineProps({
  se: {
    type: Object,
    required: true
  },
  acquired: {
    type: Boolean,
    default: false
  },
  comingSoon: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['play', 'download', 'quiz-answered']);

const { getSEImageURL, saveQuizAnswer } = useSE();
const { userId } = useAuth();

const isPlaying = ref(false);
const currentAudio = ref(null);
const progress = ref(0);
const currentTime = ref(0);
const duration = ref(0);
const imageUrl = ref(null);
const showQuizModal = ref(false);
const quizAnswer = ref('');
const quizResult = ref('');
const isQuizSubmitting = ref(false);

// 画像URLを取得
const loadImage = async () => {
  // 未取得の場合は直接sample.pngを読み込む
  if (!props.acquired) {
    const result = await getSEImageURL('sample');
    if (result.success && result.url) {
      imageUrl.value = result.url;
    }
    return;
  }
  
  // 取得済みの場合は通常通り画像を読み込む
  const result = await getSEImageURL(props.se.seId);
  if (result.success && result.url) {
    imageUrl.value = result.url;
  }
};

const handlePlay = async () => {
  // 再生中の場合、停止して最初から再生
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value.currentTime = 0;
    currentAudio.value = null;
  }

  isPlaying.value = true;
  progress.value = 0;
  currentTime.value = 0;
  duration.value = 0;

  // 親コンポーネントから返されるresultを受け取る
  // emitは値を返さないので、別の方法で処理
  emit('play', props.se, {
    onProgress: (info) => {
      progress.value = info.progress;
      currentTime.value = info.currentTime;
      duration.value = info.duration;
    },
    onEnded: () => {
      isPlaying.value = false;
      progress.value = 0;
    },
    onAudio: (audio) => {
      currentAudio.value = audio;
    }
  });
};

const handleDownload = () => {
  emit('download', props.se);
};

const handleQuiz = () => {
  showQuizModal.value = true;
  quizAnswer.value = '';
  quizResult.value = '';
};

const closeQuizModal = () => {
  showQuizModal.value = false;
  quizAnswer.value = '';
  quizResult.value = '';
};

const submitQuiz = async () => {
  if (isQuizSubmitting.value) return;
  
  console.log('[submitQuiz] 開始');
  console.log('[submitQuiz] userId:', userId.value);
  console.log('[submitQuiz] seId:', props.se.seId);
  console.log('[submitQuiz] answer:', quizAnswer.value);
  
  isQuizSubmitting.value = true;
  
  try {
    // 正解判定（全て「せいかい」が正解）
    const isCorrect = quizAnswer.value === 'せいかい';
    console.log('[submitQuiz] isCorrect:', isCorrect);
    
    // 正解をFirestoreに保存
    const result = await saveQuizAnswer(userId.value, props.se.seId, isCorrect);
    console.log('[submitQuiz] saveQuizAnswer result:', result);
    
    if (result.success) {
      if (isCorrect) {
        quizResult.value = `${result.message} 正解数: ${result.correctCount}`;
        // 正解時に親コンポーネントに通知
        emit('quiz-answered', { isCorrect: true, correctCount: result.correctCount });
      } else {
        quizResult.value = result.message;
      }
    } else {
      quizResult.value = 'エラーが発生しました';
      console.error('[submitQuiz] エラー:', result.error);
    }
  } catch (error) {
    console.error('[submitQuiz] 予期しないエラー:', error);
    quizResult.value = 'エラーが発生しました';
  }
  
  isQuizSubmitting.value = false;
};

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

onMounted(() => {
  loadImage();
});
</script>

<style scoped>
.se-card {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 1.5rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.se-card.acquired:hover {
  border-color: var(--accent-color);
}

.se-card:not(.acquired) {
  opacity: 0.5;
  background: var(--bg-secondary);
}

.se-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

/* 画像兼再生ボタン */
.btn-play-image {
  width: 100%;
  padding: 0;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: var(--bg-secondary);
}

.btn-play-image:hover:not(:disabled) {
  opacity: 0.95;
}

.btn-play-image:disabled {
  cursor: not-allowed;
}

.play-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.2s ease;
}

.play-image.playing {
  filter: brightness(0.5);
}

.play-image.locked {
  filter: grayscale(100%) brightness(0.7);
}

.play-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
}

/* 未取得オーバーレイ */
.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.locked-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* COMING SOONオーバーレイ */
.coming-soon-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
}

.coming-soon-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.05em;
}

/* COMING SOON状態のカード */
.se-card.coming-soon {
  opacity: 0.6;
  background: var(--bg-secondary);
}

.se-card.coming-soon:hover {
  border-color: var(--border-color);
}

/* 再生中のオーバーレイ */
.play-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

/* 進捗バー（オーバーレイ内） */
.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--bg-primary);
  transition: width 0.1s linear;
}

/* 時間表示（オーバーレイ内） */
.time-display {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  font-family: monospace;
  font-weight: 400;
}

/* ダウンロードボタン */
.btn-download {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  background: var(--bg-primary);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
}

.btn-download:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-download:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: var(--text-secondary);
}

/* クイズボタン */
.btn-quiz {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  background: var(--bg-primary);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
}

.btn-quiz:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-quiz:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: var(--text-secondary);
}

/* 未取得表示（削除） */

/* クイズモーダル */
.quiz-modal-overlay {
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

.quiz-modal {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.quiz-close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  transition: opacity 0.2s ease;
}

.quiz-close-btn:hover {
  opacity: 0.7;
}

.quiz-modal h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}

.quiz-input {
  width: 100%;
  padding: 0.85rem;
  font-size: 0.95rem;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

.quiz-input:focus {
  border-color: var(--accent-color);
}

.quiz-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quiz-result {
  padding: 1rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
}

.quiz-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-submit,
.btn-cancel {
  flex: 1;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit {
  background: var(--border-color);
  color: var(--bg-primary);
}

.btn-submit:hover:not(:disabled) {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-primary);
  color: var(--border-color);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
