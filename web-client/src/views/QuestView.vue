<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestStore } from '../stores/quest'
import { getQuestById } from '../data/quests'
import { getItemById } from '../data/items'

const router = useRouter()
const questStore = useQuestStore()
const activeTab = ref('active') // active, available, history

onMounted(() => {
  questStore.fetchQuests()
})

// 合并任务配置和进度数据
const mergedActiveQuests = computed(() => {
  return questStore.activeQuests.map(pq => {
    const config = getQuestById(pq.quest_id)
    
    // 转换奖励物品信息
    const rewards = config?.rewards || {}
    const itemRewards = rewards.items ? rewards.items.map(item => {
      const itemData = getItemById(item.id)
      return {
        ...item,
        name: itemData?.name || '未知物品',
        icon: itemData?.icon || '📦'
      }
    }) : []
    
    return {
      ...pq,
      name: config?.name || '未知任务',
      description: config?.description || '',
      rewards: {
        ...rewards,
        items: itemRewards
      },
      objectives: pq.objectives // 保留进度数据
    }
  })
})

const mergedHistoryQuests = computed(() => {
  return questStore.historyQuests.map(pq => {
    const config = getQuestById(pq.quest_id)
    return {
      ...pq,
      name: config?.name || '未知任务',
      description: config?.description || ''
    }
  })
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="quest-container">
    <div class="panel">
      <div class="header">
        <button class="btn-back" @click="goHome">🏠 返回首页</button>
        <h1>任务日志</h1>
      </div>

      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'active' }" 
          @click="activeTab = 'active'"
        >
          进行中 ({{ questStore.activeQuests.length }})
        </button>
        <button 
          :class="{ active: activeTab === 'available' }" 
          @click="activeTab = 'available'"
        >
          可接取 ({{ questStore.availableQuests.length }})
        </button>
        <button 
          :class="{ active: activeTab === 'history' }" 
          @click="activeTab = 'history'"
        >
          历史
        </button>
      </div>

      <div class="content">
        <div v-if="questStore.loading" class="loading">Loading...</div>

        <!-- Active Quests -->
        <div v-else-if="activeTab === 'active'" class="tab-pane">
           <div v-if="mergedActiveQuests.length === 0" class="empty">暂无进行中的任务</div>
           <div v-for="quest in mergedActiveQuests" :key="quest.id" class="quest-card">
              <div class="quest-header">
                <h3>{{ quest.name }}</h3>
                <span class="status-badge" :class="quest.status">
                  {{ quest.status === 'completed' ? '可领取' : '进行中' }}
                </span>
              </div>
              <p class="desc">{{ quest.description }}</p>
              
              <!-- 任务目标 -->
              <div v-for="(obj, idx) in quest.objectives" :key="idx" class="objective">
                 <span>目标 {{ idx + 1 }}: {{ obj.description }}</span>
                 <span class="progress">{{ obj.current }} / {{ obj.required }}</span>
              </div>
              <div v-for="(obj, idx) in quest.objectives" :key="'bar-' + idx" class="progress-bar">
                 <div class="fill" :style="{ width: Math.min(100, (obj.current / obj.required * 100)) + '%' }"></div>
              </div>

              <div class="rewards">
                <span v-if="quest.rewards.exp">奖励: {{ quest.rewards.exp }} EXP</span>
                <span v-if="quest.rewards.silver">, {{ quest.rewards.silver }} 灵石</span>
                <span v-if="quest.rewards.items">
                  <span v-for="item in quest.rewards.items" :key="item.id">, {{ item.name }} x{{ item.quantity }}</span>
                </span>
              </div>

              <button 
                v-if="quest.status === 'completed'" 
                class="btn-claim"
                @click="questStore.completeQuest(quest.quest_id)"
              >
                🎁 领取奖励
              </button>
           </div>
        </div>

        <!-- Available Quests -->
        <div v-else-if="activeTab === 'available'" class="tab-pane">
           <div v-if="questStore.availableQuests.length === 0" class="empty">暂无可接任务</div>
           <div v-for="quest in questStore.availableQuests" :key="quest.id" class="quest-card available">
              <h3>{{ quest.title }}</h3>
              <p class="desc">{{ quest.description }}</p>
              <div class="rewards">
                奖励: {{ quest.reward.exp }} EXP
              </div>
              <button class="btn-accept" @click="questStore.acceptQuest(quest.id)">📜 接受任务</button>
           </div>
        </div>

        <!-- History -->
        <div v-else class="tab-pane">
           <div v-if="mergedHistoryQuests.length === 0" class="empty">暂无已完成任务</div>
           <div v-for="quest in mergedHistoryQuests" :key="quest.id" class="quest-card finished">
              <h3>{{ quest.name }}</h3>
              <p class="desc">{{ quest.description }}</p>
              <span class="status-badge finished">已完成</span>
           </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.quest-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: #1a1f25;
  color: #fff;
  padding: 1rem;
}

.panel {
  width: 100%;
  max-width: 700px;
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
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #ddd;
  cursor: pointer;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.tabs button {
  background: none;
  border: none;
  color: #888;
  font-size: 1rem;
  padding: 0.5rem;
  cursor: pointer;
  font-weight: bold;
}

.tabs button.active {
  color: #f1c40f;
  border-bottom: 2px solid #f1c40f;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quest-card {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.quest-card.available {
  border-left: 4px solid #3498db;
}

.quest-card.finished {
  opacity: 0.6;
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-badge {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  background: #555;
}

.status-badge.completed { background: #2ecc71; color: #fff; }
.status-badge.finished { background: #7f8c8d; }

.objective {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #ddd;
}

.progress-bar {
  height: 6px;
  background: #444;
  border-radius: 3px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: #f1c40f;
}

.rewards {
  font-size: 0.8rem;
  color: #bbb;
  margin: 0.5rem 0;
}

.btn-accept {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.8rem;
  background: #3498db;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.btn-claim {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.8rem;
  background: #2ecc71;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.empty {
  text-align: center;
  color: #666;
  padding: 2rem;
}
</style>
