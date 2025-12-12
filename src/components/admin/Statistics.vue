<template>
  <div class="statistics">
    <h2>統計</h2>

    <div v-if="loading" class="loading">読み込み中...</div>

    <div v-else-if="stats">
      <!-- 全体統計 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">総ユーザー数</div>
          <div class="stat-value">{{ stats.totalUsers }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">公開SE数</div>
          <div class="stat-value">{{ stats.totalSEs }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">総取得数</div>
          <div class="stat-value">{{ stats.totalAcquisitions }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均取得率</div>
          <div class="stat-value">{{ stats.averageAcquisitionRate }}%</div>
        </div>
      </div>

      <!-- SEごとの取得率 -->
      <div class="se-stats-section">
        <h3>SEごとの取得率</h3>
        <div class="se-stats-table-container">
          <table class="se-stats-table">
            <thead>
              <tr>
                <th>順位</th>
                <th>SE ID</th>
                <th>名前</th>
                <th>取得人数</th>
                <th>取得率</th>
                <th>バー</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(se, index) in stats.seStats" :key="se.seId">
                <td>{{ index + 1 }}</td>
                <td>{{ se.seId }}</td>
                <td>{{ se.name }}</td>
                <td>{{ se.acquisitionCount }} / {{ stats.totalUsers }}</td>
                <td>{{ se.acquisitionRate }}%</td>
                <td>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${se.acquisitionRate}%` }"
                    ></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 人気SE Top 5 -->
      <div class="top-ses-section">
        <h3>人気SE Top 5</h3>
        <div class="top-ses-list">
          <div 
            v-for="(se, index) in topSEs" 
            :key="se.seId" 
            class="top-se-item"
          >
            <div class="rank">{{ index + 1 }}</div>
            <div class="se-info">
              <div class="se-name">{{ se.name }} (ID: {{ se.seId }})</div>
              <div class="se-stats-text">
                {{ se.acquisitionCount }}人が取得 ({{ se.acquisitionRate }}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

const { loading, fetchStatistics } = useAdmin();

const stats = ref(null);

const topSEs = computed(() => {
  if (!stats.value || !stats.value.seStats) return [];
  return stats.value.seStats.slice(0, 5);
});

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  const result = await fetchStatistics();
  if (result.success) {
    stats.value = result.data;
  }
};
</script>

<style scoped>
.statistics {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

/* 全体統計 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 1.5rem;
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* SEごとの取得率 */
.se-stats-section {
  margin-bottom: 2rem;
}

.se-stats-table-container {
  overflow-x: auto;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
}

.se-stats-table {
  width: 100%;
  border-collapse: collapse;
}

.se-stats-table th,
.se-stats-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.se-stats-table th {
  background: var(--bg-tertiary);
  font-weight: 700;
  color: var(--text-primary);
}

.se-stats-table td {
  color: var(--text-primary);
}

.se-stats-table tr:hover {
  background: var(--bg-secondary);
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

/* 人気SE Top 5 */
.top-ses-section {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 1.5rem;
}

.top-ses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.top-se-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
}

.rank {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
  min-width: 50px;
  text-align: center;
}

.se-info {
  flex: 1;
}

.se-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.se-stats-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
</style>
