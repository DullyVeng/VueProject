
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRankingStore } from '../stores/ranking'

const router = useRouter()
const rankingStore = useRankingStore()

onMounted(() => {
  rankingStore.fetchLeaderboard()
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="leaderboard-container">
    <div class="panel">
      <div class="header">
        <button class="btn-back" @click="goHome">🏠 返回首页</button>
        <h1>🏆 天骄榜</h1>
      </div>

      <div class="content">
        <div v-if="rankingStore.loading" class="loading">正在读取天机...</div>
        
        <div v-else class="list">
           <div class="list-header">
             <span>排名</span>
             <span>道号</span>
             <span>境界</span>
           </div>
           
           <div 
             v-for="char in rankingStore.leaderboard" 
             :key="char.id" 
             class="rank-item"
             :class="{ top3: char.rank <= 3 }"
           >
             <div class="rank">
               <span v-if="char.rank === 1">🥇</span>
               <span v-else-if="char.rank === 2">🥈</span>
               <span v-else-if="char.rank === 3">🥉</span>
               <span v-else>{{ char.rank }}</span>
             </div>
             <div class="name">
                <span class="model">{{ char.model || '👤' }}</span>
                {{ char.name }}
             </div>
             <div class="cultivation">{{ char.cultivation }}</div>
           </div>

           <div v-if="rankingStore.leaderboard.length === 0" class="empty">
              暂无人上榜
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: #1a1f25;
  color: #fff;
  padding: 1rem;
}

.panel {
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #ddd;
  cursor: pointer;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 4fr 3fr;
  padding: 0.5rem 1rem;
  color: #888;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
}

.rank-item {
  display: grid;
  grid-template-columns: 2fr 4fr 3fr;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  margin-bottom: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.rank-item.top3 {
  background: rgba(241, 196, 15, 0.1);
  border-color: rgba(241, 196, 15, 0.2);
}

.rank {
  font-size: 1.2rem;
  font-weight: bold;
}

.name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  color: #ecf0f1;
}

.model {
  font-size: 1.2rem;
}

.cultivation {
  color: #3498db;
  font-family: 'Courier New', monospace;
}

.top3 .cultivation {
  color: #f1c40f;
}

.loading, .empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
