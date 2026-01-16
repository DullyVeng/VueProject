<script setup>
import { onMounted, computed } from 'vue'
import { useDailyStore } from '../stores/daily'
import { useCharacterStore } from '../stores/character'

const dailyStore = useDailyStore()
const characterStore = useCharacterStore()

onMounted(() => {
  // 加载每日任务
  dailyStore.loadTodayTasks()
})

// 领取任务奖励
async function handleClaimReward(taskId) {
  const result = await dailyStore.claimReward(taskId)
  if (result.success) {
    console.log('领取成功:', result.message)
  } else {
    console.warn('领取失败:', result.message)
  }
}

// 领取全完成奖励
async function handleClaimAllBonus() {
  const result = await dailyStore.claimAllCompleteBonus()
  if (result.success) {
    console.log('全完成奖励领取成功:', result.message)
  } else {
    console.warn('领取失败:', result.message)
  }
}

// 获取任务图标
function getTaskIcon(taskType) {
  const icons = {
    'kill_monsters': '⚔️',
    'complete_battles': '🛡️',
    'enhance_fabao': '🔨',
    'collect_items': '🌿',
    'kill_boss': '👹'
  }
  return icons[taskType] || '📋'
}

// 计算进度百分比
function getProgressPercent(task) {
  return Math.min(100, (task.current / task.required) * 100)
}
</script>

<template>
  <div class="daily-task-panel">
    <div class="panel-header">
      <h3>📋 每日任务</h3>
      <span class="task-count">{{ dailyStore.completedCount }} / {{ dailyStore.todayTasks.length }}</span>
    </div>

    <div v-if="dailyStore.loading" class="loading">加载中...</div>

    <div v-else class="task-list">
      <!-- 任务列表 -->
      <div
        v-for="task in dailyStore.todayTasks"
        :key="task.id"
        class="task-item"
        :class="{ completed: task.current >= task.required, claimed: task.claimed }"
      >
        <div class="task-info">
          <div class="task-header">
            <span class="task-icon">{{ getTaskIcon(task.type) }}</span>
            <span class="task-name">{{ task.name }}</span>
          </div>
          <p class="task-desc">{{ task.description }}</p>
          
          <!-- 进度条 -->
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getProgressPercent(task) + '%' }"></div>
            <span class="progress-text">{{ task.current }} / {{ task.required }}</span>
          </div>

          <!-- 奖励信息 -->
          <div class="task-rewards">
            <span class="reward">🌟 {{ task.rewards.exp }} 经验</span>
            <span class="reward">💰 {{ task.rewards.silver }} 灵石</span>
          </div>
        </div>

        <!-- 领取按钮 -->
        <button
          v-if="task.current >= task.required && !task.claimed"
          class="btn-claim"
          @click="handleClaimReward(task.id)"
        >
          领取
        </button>
        <span v-if="task.claimed" class="claimed-badge">✓ 已领取</span>
      </div>

      <!-- 全完成奖励 -->
      <div 
        v-if="dailyStore.todayTasks.length > 0"
        class="all-complete-bonus"
        :class="{ 
          available: dailyStore.allCompleted && !dailyStore.allCompletedClaimed,
          claimed: dailyStore.allCompletedClaimed
        }"
      >
        <div class="bonus-header">
          <span class="bonus-icon">🎁</span>
          <span class="bonus-title">全部完成奖励</span>
        </div>
        <div class="bonus-rewards">
          <span class="reward">🌟 {{ dailyStore.allClaimedBonus.exp }} 经验</span>
          <span class="reward">💰 {{ dailyStore.allClaimedBonus.silver }} 灵石</span>
        </div>
        <button
          v-if="dailyStore.allCompleted && !dailyStore.allCompletedClaimed"
          class="btn-claim-all"
          @click="handleClaimAllBonus"
        >
          领取全部奖励
        </button>
        <span v-if="dailyStore.allCompletedClaimed" class="claimed-badge">✓ 已领取</span>
        <span v-if="!dailyStore.allCompleted" class="incomplete-text">完成全部任务后可领取</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.daily-task-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  color: #fff;
  max-width: 400px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #f1c40f;
}

.task-count {
  font-size: 0.9rem;
  color: #bbb;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.task-item.completed {
  border-color: rgba(46, 204, 113, 0.5);
  background: rgba(46, 204, 113, 0.1);
}

.task-item.claimed {
  opacity: 0.6;
}

.task-info {
  flex: 1;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.task-icon {
  font-size: 1.25rem;
}

.task-name {
  font-weight: bold;
  color: #fff;
}

.task-desc {
  font-size: 0.85rem;
  color: #bbb;
  margin: 0.25rem 0;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f1c40f, #f39c12);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.task-rewards {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.reward {
  font-size: 0.75rem;
  color: #ddd;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.btn-claim {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.5rem;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-claim:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
}

.claimed-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(46, 204, 113, 0.2);
  border: 1px solid rgba(46, 204, 113, 0.5);
  border-radius: 4px;
  color: #2ecc71;
  font-size: 0.75rem;
  font-weight: bold;
}

/* 全完成奖励样式 */
.all-complete-bonus {
  background: rgba(241, 196, 15, 0.1);
  border: 2px solid rgba(241, 196, 15, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.all-complete-bonus.available {
  border-color: rgba(241, 196, 15, 0.8);
  background: rgba(241, 196, 15, 0.2);
  animation: pulse 2s infinite;
}

.all-complete-bonus.claimed {
  opacity: 0.6;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.bonus-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.bonus-icon {
  font-size: 1.5rem;
}

.bonus-title {
  font-weight: bold;
  color: #f1c40f;
}

.bonus-rewards {
  display: flex;
  gap: 0.75rem;
  margin: 0.5rem 0;
}

.btn-claim-all {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  border: none;
  border-radius: 6px;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.btn-claim-all:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(241, 196, 15, 0.4);
}

.incomplete-text {
  display: block;
  text-align: center;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.5rem;
}
</style>
