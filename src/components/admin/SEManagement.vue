<template>
  <div class="se-management">
    <h2>SE管理</h2>

    <div v-if="loading" class="loading">読み込み中...</div>

    <div v-else class="se-table-container">
      <table class="se-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>公開</th>
            <th>クイズ回答</th>
            <th>クイズ問題文</th>
            <th>メモ</th>
            <th>音声</th>
            <th>画像</th>
            <th>アクセスURL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="se in seList" :key="se.id">
            <td>{{ se.seId }}</td>
            <td>{{ se.name }}</td>
            <td>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="se.published"
                  @change="togglePublished(se)"
                />
                <span class="slider"></span>
              </label>
            </td>
            <td>
              <input
                v-if="editingQuiz === se.id"
                v-model="quizAnswerEdit"
                @keyup.enter="saveQuizAnswer(se)"
                @blur="cancelQuizEdit"
                class="quiz-input"
                autofocus
              />
              <span v-else @click="startQuizEdit(se)" class="quiz-value">
                {{ se.quizAnswer || '未設定' }}
              </span>
            </td>
            <td>
              <input
                v-if="editingQuizQuestion === se.id"
                v-model="quizQuestionEdit"
                @keyup.enter="saveQuizQuestion(se)"
                @blur="cancelQuizQuestionEdit"
                class="quiz-input"
                autofocus
              />
              <span v-else @click="startQuizQuestionEdit(se)" class="quiz-value">
                {{ se.quizQuestion || 'この曲はなんでしょう？' }}
              </span>
            </td>
            <td>
              <input
                v-if="editingMemo === se.id"
                v-model="memoEdit"
                @keyup.enter="saveMemo(se)"
                @blur="cancelMemoEdit"
                class="memo-input"
                autofocus
              />
              <span v-else @click="startMemoEdit(se)" class="memo-value">
                {{ se.memo || 'メモを追加' }}
              </span>
            </td>
            <td>
              <div class="media-cell">
                <audio v-if="se.audioUrl" :src="se.audioUrl" controls class="audio-preview"></audio>
                <span v-else class="no-media">未設定</span>
                <div class="file-upload">
                  <label :for="`audio-${se.id}`" class="file-label">
                    アップロード
                  </label>
                  <input
                    :id="`audio-${se.id}`"
                    type="file"
                    accept="audio/*"
                    @change="handleAudioUpload($event, se)"
                    class="file-input"
                  />
                </div>
              </div>
            </td>
            <td>
              <div class="media-cell">
                <img v-if="se.imageUrl" :src="se.imageUrl" class="image-preview" />
                <span v-else class="no-media">未設定</span>
                <div class="file-upload">
                  <label :for="`image-${se.id}`" class="file-label">
                    アップロード
                  </label>
                  <input
                    :id="`image-${se.id}`"
                    type="file"
                    accept="image/*"
                    @change="handleImageUpload($event, se)"
                    class="file-input"
                  />
                </div>
              </div>
            </td>
            <td>
              <button @click="copyUrl(se.seId)" class="btn-copy-url" :title="getAccessUrl(se.seId)">
                URLをコピー
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';
import { useSE } from '../../composables/useSE';

const { loading, fetchAllSEs, updateSE, uploadFile } = useAdmin();
const { getSEImageURL, getSEAudioURL } = useSE();

const seList = ref([]);
const editingQuiz = ref(null);
const quizAnswerEdit = ref('');
const editingQuizQuestion = ref(null);
const quizQuestionEdit = ref('');
const editingMemo = ref(null);
const memoEdit = ref('');
const saving = ref(false);
const baseUrl = 'https://sound-catch-fan.vercel.app'; // 本番環境URL

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  const result = await fetchAllSEs();
  if (result.success) {
    seList.value = result.data;
    
    // すべてのSEの画像URLと音声URLを事前に取得
    for (const se of seList.value) {
      if (se.seId) {
        // 画像URL取得
        const imageResult = await getSEImageURL(se.seId);
        if (imageResult.success && imageResult.url) {
          se.imageUrl = imageResult.url;
        }
        
        // 音声URL取得
        const audioResult = await getSEAudioURL(se.seId);
        if (audioResult.success && audioResult.url) {
          se.audioUrl = audioResult.url;
        }
      }
    }
  }
};

const togglePublished = async (se) => {
  const newValue = !se.published;
  const result = await updateSE(se.id, { published: newValue });
  
  if (result.success) {
    // データを再読み込みして確実に反映
    await loadData();
  } else {
    alert('更新に失敗しました');
  }
};

const startQuizEdit = (se) => {
  editingQuiz.value = se.id;
  quizAnswerEdit.value = se.quizAnswer || '';
};

const cancelQuizEdit = () => {
  editingQuiz.value = null;
  quizAnswerEdit.value = '';
};

const saveQuizAnswer = async (se) => {
  const result = await updateSE(se.id, { quizAnswer: quizAnswerEdit.value });
  
  if (result.success) {
    cancelQuizEdit();
    // データを再読み込みして確実に反映
    await loadData();
    console.log('クイズ回答を更新しました:', se.seId, quizAnswerEdit.value);
  } else {
    alert('更新に失敗しました');
  }
};

const startQuizQuestionEdit = (se) => {
  editingQuizQuestion.value = se.id;
  quizQuestionEdit.value = se.quizQuestion || 'この曲はなんでしょう？';
};

const cancelQuizQuestionEdit = () => {
  editingQuizQuestion.value = null;
  quizQuestionEdit.value = '';
};

const saveQuizQuestion = async (se) => {
  const result = await updateSE(se.id, { quizQuestion: quizQuestionEdit.value });
  
  if (result.success) {
    cancelQuizQuestionEdit();
    // データを再読み込みして確実に反映
    await loadData();
    console.log('クイズ問題文を更新しました:', se.seId, quizQuestionEdit.value);
  } else {
    alert('更新に失敗しました');
  }
};

const startMemoEdit = (se) => {
  editingMemo.value = se.id;
  memoEdit.value = se.memo || '';
};

const cancelMemoEdit = () => {
  editingMemo.value = null;
  memoEdit.value = '';
};

const saveMemo = async (se) => {
  const result = await updateSE(se.id, { memo: memoEdit.value });
  
  if (result.success) {
    cancelMemoEdit();
    // データを再読み込みして確実に反映
    await loadData();
    console.log('メモを更新しました:', se.seId, memoEdit.value);
  } else {
    alert('更新に失敗しました');
  }
};

const handleAudioUpload = async (event, se) => {
  const file = event.target.files[0];
  if (!file) return;
  
  saving.value = true;
  
  // ファイル拡張子を取得
  const ext = file.name.split('.').pop();
  const filename = `${se.seId}.${ext}`;
  
  // Storageにアップロード
  const uploadResult = await uploadFile(file, 'se_files', filename);
  
  if (uploadResult.success) {
    // FirestoreのaudioUrlを更新
    const updateResult = await updateSE(se.id, { audioUrl: uploadResult.url });
    
    if (updateResult.success) {
      se.audioUrl = uploadResult.url;
      alert('音声ファイルをアップロードしました');
    } else {
      alert('Firestore更新に失敗しました');
    }
  } else {
    alert('アップロードに失敗しました');
  }
  
  saving.value = false;
  event.target.value = ''; // ファイル選択をクリア
};

const handleImageUpload = async (event, se) => {
  const file = event.target.files[0];
  if (!file) return;
  
  saving.value = true;
  
  // ファイル拡張子を取得
  const ext = file.name.split('.').pop();
  const filename = `${se.seId}.${ext}`;
  
  // Storageにアップロード
  const uploadResult = await uploadFile(file, 'se_images', filename);
  
  if (uploadResult.success) {
    // FirestoreのimageFileNameを更新
    const updateResult = await updateSE(se.id, { imageFileName: filename });
    
    if (updateResult.success) {
      se.imageFileName = filename;
      // プレビュー用にURLも更新
      se.imageUrl = uploadResult.url;
      alert('画像ファイルをアップロードしました');
    } else {
      alert('Firestore更新に失敗しました');
    }
  } else {
    alert('アップロードに失敗しました');
  }
  
  saving.value = false;
  event.target.value = ''; // ファイル選択をクリア
};

const getAccessUrl = (seId) => {
  return `${baseUrl}/nfc?id=${seId}`;
};

const copyUrl = async (seId) => {
  const url = getAccessUrl(seId);
  try {
    await navigator.clipboard.writeText(url);
    alert('URLをコピーしました');
  } catch (error) {
    console.error('コピーに失敗:', error);
    alert('コピーに失敗しました');
  }
};
</script>

<style scoped>
.se-management {
  max-width: 1400px;
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

.se-table-container {
  overflow-x: auto;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
}

.se-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem; /* 小さく */
}

.se-table th,
.se-table td {
  padding: 0.5rem; /* 小さく */
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.se-table th {
  background: var(--bg-tertiary);
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.8rem; /* さらに小さく */
  white-space: nowrap;
}

.se-table td {
  color: var(--text-primary);
}

.se-table tr:hover {
  background: var(--bg-secondary);
}

/* トグルスイッチ */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px; /* 小さく */
  height: 20px; /* 小さく */
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px; /* 小さく */
  width: 14px; /* 小さく */
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
}

input:checked + .slider {
  background-color: var(--accent-color);
}

input:checked + .slider:before {
  transform: translateX(20px); /* 調整 */
}

/* クイズ入力 */
.quiz-value {
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border: 1px solid transparent;
  transition: all 0.2s;
  display: block;
  min-width: 80px;
}

.quiz-value:hover {
  border-color: var(--border-color);
  background: var(--bg-secondary);
}

.quiz-input {
  width: 100%;
  min-width: 100px;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem; /* 小さく */
  border: 2px solid var(--accent-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

/* ファイルアップロード */
.file-upload {
  position: relative;
  margin-top: 0.25rem;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 0.35rem 0.6rem; /* 小さく */
  font-size: 0.75rem; /* 小さく */
  font-weight: 700;
  background: var(--bg-primary);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.file-label:hover {
  background: var(--bg-tertiary);
}

/* メディアプレビュー */
.media-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
  min-width: 120px;
}

.audio-preview {
  max-width: 180px; /* 小さく */
  height: 28px; /* 小さく */
}

.image-preview {
  max-width: 60px; /* 小さく */
  max-height: 60px; /* 小さく */
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.no-media {
  font-size: 0.75rem; /* 小さく */
  color: var(--text-secondary);
  font-style: italic;
}

/* メモ入力 */
.memo-value {
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border: 1px solid transparent;
  transition: all 0.2s;
  color: var(--text-secondary);
  font-style: italic;
  display: block;
  min-width: 100px;
  font-size: 0.85rem;
}

.memo-value:hover {
  border-color: var(--border-color);
  background: var(--bg-secondary);
}

.memo-input {
  width: 100%;
  min-width: 150px;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem; /* 小さく */
  border: 2px solid var(--accent-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

/* URLコピーボタン */
.btn-copy-url {
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--bg-primary);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-copy-url:hover {
  background: var(--bg-tertiary);
}
</style>
