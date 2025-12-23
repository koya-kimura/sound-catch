<template>
  <div class="acquire-view">
    <div class="result-container">
      <div v-if="success" class="result-card success">
        <h2>SE取得成功</h2>
        <!-- 画像表示 -->
        <div v-if="imageUrl" class="se-image-container">
          <img :src="imageUrl" :alt="seName" class="se-image" />
        </div>
        <p v-else class="se-name">{{ seName }}</p>
        <button @click="goToCollection" class="btn-primary">
          コレクションを見る
        </button>
      </div>

      <div v-else class="result-card error">
        <h2>取得できませんでした</h2>
        <p class="error-text">{{ errorMessage }}</p>
        <button @click="goToCollection" class="btn-secondary">
          コレクションに戻る
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSE } from "../composables/useSE";

const route = useRoute();
const router = useRouter();
const { getSEById, getSEImageURL } = useSE();

const success = ref(false);
const seName = ref("");
const imageUrl = ref(null);
const errorMessage = ref("");

onMounted(async () => {
  // URLクエリパラメータから結果を取得
  const successParam = route.query.success;
  const seIdParam = route.query.se_id;
  const errorParam = route.query.error;

  console.log("Query params:", {
    success: successParam,
    se_id: seIdParam,
    error: errorParam,
    all: route.query,
  });

  if (successParam === "true") {
    success.value = true;

    if (seIdParam) {
      console.log("[AcquireView] seIdParam:", seIdParam);

      // FirestoreからSE情報を取得
      const seResult = await getSEById(seIdParam);
      console.log("[AcquireView] getSEById result:", seResult);

      if (seResult.success && seResult.se) {
        seName.value = seResult.se.name || `SE-${seIdParam}`;
        console.log("[AcquireView] seName:", seName.value);

        // 画像を取得
        console.log("[AcquireView] 画像を取得中...");
        const imageResult = await getSEImageURL(seIdParam);
        console.log("[AcquireView] getSEImageURL result:", imageResult);

        if (imageResult.success && imageResult.url) {
          imageUrl.value = imageResult.url;
          console.log("[AcquireView] 画像URL設定成功:", imageUrl.value);
        } else {
          // 画像が見つからない場合はsample.pngをフォールバック
          console.log("[AcquireView] 画像が見つからない、sample.pngを試します");
          const fallbackResult = await getSEImageURL("sample");
          console.log("[AcquireView] sample.png result:", fallbackResult);

          if (fallbackResult.success && fallbackResult.url) {
            imageUrl.value = fallbackResult.url;
            console.log("[AcquireView] sample.png設定成功:", imageUrl.value);
          } else {
            console.log("[AcquireView] sample.pngも取得できませんでした");
          }
        }
      } else {
        console.log("[AcquireView] SE情報の取得に失敗");
        seName.value = `SE-${seIdParam}`;
      }
    } else {
      console.log("[AcquireView] seIdParamが空です");
      seName.value = "不明なSE";
    }
  } else {
    success.value = false;

    if (errorParam === "coming_soon") {
      errorMessage.value = "このSEはまだ準備中です（COMING SOON）";
    } else if (errorParam === "already_acquired") {
      errorMessage.value = "このSEは既に取得済みです";
    } else if (errorParam === "invalid_tag") {
      errorMessage.value = `無効なタグIDです (tag_id: ${
        route.query.tag_id || "なし"
      })`;
    } else if (errorParam === "unauthorized") {
      errorMessage.value = "ログインが必要です";
    } else if (errorParam === "missing_params") {
      errorMessage.value = `パラメータが不足しています (tag_id: ${
        route.query.tag_id || "なし"
      }, session_id: ${route.query.session_id ? "有" : "なし"})`;
    } else {
      errorMessage.value = `取得に失敗しました (エラー: ${
        errorParam || "不明"
      })`;
    }
  }
});

const goToCollection = () => {
  router.push("/collection");
};
</script>

<style scoped>
.acquire-view {
  min-height: 100vh;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.result-container {
  width: 100%;
  max-width: 500px;
}

.result-card {
  background: var(--bg-primary);
  border: 3px solid var(--border-color);
  padding: 3rem 2rem;
  text-align: center;
}

/* 見出し */
.result-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

/* SE名 */
.se-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--success-color);
  margin-bottom: 2rem;
}

/* SE画像コンテナ */
.se-image-container {
  width: 100%;
  max-width: 300px;
  margin: 0 auto 2rem;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.se-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border: 2px solid var(--border-color);
}

/* エラーテキスト */
.error-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* ボタン */
.btn-primary,
.btn-secondary {
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: "Zen Kaku Gothic New", sans-serif;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--border-color);
  color: var(--bg-primary);
}

.btn-primary:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .acquire-view {
    padding: 1rem;
  }

  .result-card {
    padding: 2rem 1.5rem;
  }

  .icon {
    font-size: 3rem;
  }

  .result-card h2 {
    font-size: 1.25rem;
  }
}
</style>
