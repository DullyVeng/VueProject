<script setup>
import { ref, onMounted } from 'vue'
import { useDailyStore } from '../stores/daily'
import { useQuestStore } from '../stores/quest'
import { useCharacterStore } from '../stores/character'
import { getQuestById } from '../data/quests'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const dailyStore = useDailyStore()
const questStore = useQuestStore()
const characterStore = useCharacterStore()

// Tab 状态
const activeTab = ref('daily') // 'daily' | 'quest' | 'history'

onMounted(() => {
  dailyStore.loadTodayTasks()
  questStore.fetchQuests()
})

// 切换Tab
function switchTab(tab) {
  activeTab.value = tab
}

// 获取任务详情（合并配置数据）
function getQuestDetails(quest) {
  const config = getQuestById(quest.quest_id)
  return {
    ...config,
    ...quest,
    name: config?.name || quest.name || '未知任务',
    description: config?.description || quest.description || '',
    type: config?.type || quest.type || 'side'
  }
}

// 每日任务相关
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

function getProgressPercent(task) {
  return Math.min(100, (task.current / task.required) * 100)
}

async function handleClaimReward(taskId) {
  const result = await dailyStore.claimReward(taskId)
  if (result.success) {
    console.log('领取成功:', result.message)
  }
}

async function handleClaimAllBonus() {
  const result = await dailyStore.claimAllCompleteBonus()
  if (result.success) {
    console.log('全完成奖励领取成功:', result.message)
  }
}

// 剧情任务相关
async function acceptQuest(questId) {
  await questStore.acceptQuest(questId)
}

async function completeQuest(questId) {
  await questStore.completeQuest(questId)
}

function getQuestRewards(quest) {
  let rewards = []
  if (quest.rewards?.exp) rewards.push(`${quest.rewards.exp} 经验`)
  if (quest.rewards?.silver) rewards.push(`${quest.rewards.silver} 灵石`)
  if (quest.rewards?.items) {
    quest.rewards.items.forEach(item => {
      rewards.push(`${item.name} x${item.count}`)
    })
  }
  return rewards.join(', ')
}
</script>

<template>
  <div v-if="show" class="task-sidebar-overlay" @click="$emit('close')"></div>
  
  <div class="task-sidebar" :class="{ show }">
    <!-- 顶部标题栏 -->
    <div class="sidebar-header">
      <h2>📋 任务中心</h2>
      <button class="btn-close" @click="$emit('close')">×</button>
    </div>

    <!-- Tab切换 -->
    <div class="tab-bar">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'daily' }"
        @click="switchTab('daily')"
      >
        每日任务
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'quest' }"
        @click="switchTab('quest')"
      >
        剧情任务
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'history' }"
        @click="switchTab('history')"
      >
        历史记录
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="sidebar-content">
      <!-- 每日任务Tab -->
      <div v-if="activeTab === 'daily'" class="tab-content">
        <div v-if="dailyStore.loading" class="loading">加载中...</div>
        
        <div v-else class="task-list">
          <!-- 任务列表 -->
          <div
            v-for="task in dailyStore.todayTasks"
            :key="task.id"
            class="task-card"
            :class="{ completed: task.current >= task.required, claimed: task.claimed }"
          >
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
              <span class="reward">🌟 {{ task.rewards.exp }}</span>
              <span class="reward">💰 {{ task.rewards.silver }}</span>
            </div>

            <!-- 领取按钮 -->
            <button
              v-if="task.current >= task.required && !task.claimed"
              class="btn-claim"
              @click="handleClaimReward(task.id)"
            >
              领取奖励
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
              <span class="reward">🌟 {{ dailyStore.allClaimedBonus.exp }}</span>
              <span class="reward">💰 {{ dailyStore.allClaimedBonus.silver }}</span>
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

      <!-- 剧情任务Tab -->
      <div v-if="activeTab === 'quest'" class="tab-content">
        <!-- 进行中任务 -->
        <div v-if="questStore.activeQuests && questStore.activeQuests.length > 0" class="quest-section">
          <h3 class="section-title">进行中</h3>
          <div
            v-for="quest in questStore.activeQuests"
            :key="quest.id"
            class="quest-card active"
          >
            <div class="quest-header">
              <span class="quest-name">{{ getQuestDetails(quest).name }}</span>
              <span class="quest-type">{{ getQuestDetails(quest).type === 'main' ? '主线' : getQuestDetails(quest).type === 'side' ? '支线' : '境界' }}</span>
            </div>
            <p class="quest-desc">{{ getQuestDetails(quest).description }}</p>
            
            <!-- 目标进度 -->
            <div v-for="(obj, index) in quest.objectives" :key="index" class="objective">
              <span>{{ obj.description }}</span>
              <span class="objective-progress">{{ obj.current || 0 }} / {{ obj.required }}</span>
            </div>

            <div class="quest-rewards">奖励：{{ getQuestRewards(getQuestDetails(quest)) }}</div>
            
            <button 
              v-if="quest.status === 'completed'"
              class="btn-complete"
              @click="completeQuest(quest.quest_id)"
            >
              完成任务
            </button>
          </div>
        </div>

        <!-- 可接取任务 -->
        <div v-if="questStore.availableQuests && questStore.availableQuests.length > 0" class="quest-section">
          <h3 class="section-title">可接取任务</h3>
          <div
            v-for="quest in questStore.availableQuests"
            :key="quest.id"
            class="quest-card available"
          >
            <div class="quest-header">
              <span class="quest-name">{{ quest.name }}</span>
              <span class="quest-type">{{ quest.type === 'main' ? '主线' : quest.type === 'side' ? '支线' : '境界' }}</span>
            </div>
            <p class="quest-desc">{{ quest.description }}</p>
            <div class="quest-rewards">奖励：{{ getQuestRewards(quest) }}</div>
            <button class="btn-accept" @click="acceptQuest(quest.id)">接取任务</button>
          </div>
        </div>

        <div v-if="(!questStore.availableQuests || questStore.availableQuests.length === 0) && (!questStore.activeQuests || questStore.activeQuests.length === 0)" class="empty-state">
          <p>暂无可接取的任务</p>
        </div>
      </div>

      <!-- 历史任务Tab -->
      <div v-if="activeTab === 'history'" class="tab-content">
        <div v-if="questStore.historyQuests && questStore.historyQuests.length > 0" class="quest-section">
          <h3 class="section-title">已完成任务</h3>
          <div
            v-for="quest in questStore.historyQuests"
            :key="quest.id"
            class="quest-card completed"
          >
            <div class="quest-header">
              <span class="quest-name">{{ getQuestDetails(quest).name }}</span>
              <span class="quest-type">{{ getQuestDetails(quest).type === 'main' ? '主线' : getQuestDetails(quest).type === 'side' ? '支线' : '境界' }}</span>
            </div>
            <p class="quest-desc">{{ getQuestDetails(quest).description }}</p>
            <div class="completed-mark">✓ 已完成</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>还没有完成任何任务</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 遮罩层 */
.task-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.task-sidebar-overlay.show {
  opacity: 1;
  pointer-events: auto;
}

/* 侧边栏 */
.task-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  height: 100vh;
  background: rgba(20, 25, 30, 0.98);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 999;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.task-sidebar.show {
  transform: translateX(0);
}

/* 顶部标题 */
.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #f1c40f;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #fff;
}

/* Tab栏 */
.tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  color: #888;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: #f1c40f;
  border-bottom-color: #f1c40f;
}

/* 内容区域 */
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #888;
}

/* 任务列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.task-card.completed {
  border-color: rgba(46, 204, 113, 0.5);
  background: rgba(46, 204, 113, 0.1);
}

.task-card.claimed {
  opacity: 0.6;
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

/* 全完成奖励 */
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

/* 剧情任务样式 */
.quest-section {
  margin-bottom: 1.5rem;
}

.section-title {
  color: #f1c40f;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(241, 196, 15, 0.3);
}

.quest-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.quest-card.available {
  border-left: 3px solid #3498db;
}

.quest-card.active {
  border-left: 3px solid #f39c12;
}

.quest-card.completed {
  border-left: 3px solid #2ecc71;
  opacity: 0.7;
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.quest-name {
  font-weight: bold;
  color: #fff;
}

.quest-type {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #f1c40f;
}

.quest-desc {
  font-size: 0.85rem;
  color: #bbb;
  margin: 0.5rem 0;
}

.objective {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #aaa;
  margin: 0.3rem 0;
}

.objective-progress {
  color: #f1c40f;
  font-weight: bold;
}

.quest-rewards {
  font-size: 0.8rem;
  color: #2ecc71;
  margin: 0.5rem 0;
}

.btn-accept,
.btn-complete {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.btn-accept {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-complete {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.btn-accept:hover,
.btn-complete:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.completed-mark {
  text-align: center;
  color: #2ecc71;
  font-weight: bold;
  margin-top: 0.5rem;
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
