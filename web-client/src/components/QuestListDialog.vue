<script setup>
import { computed, ref } from 'vue'
import { useQuestStore } from '../stores/quest'
import { useCharacterStore } from '../stores/character'
import { getQuestsByGiver, canAcceptQuest, getQuestById, QuestStatus } from '../data/quests'
import { getItemById } from '../data/items'

const props = defineProps({
  npc: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const questStore = useQuestStore()
const characterStore = useCharacterStore()

// 奖励弹窗状态
const showRewardDialog = ref(false)
const rewardInfo = ref(null)

// 该NPC可发布的任务（过滤已完成的任务）
const npcQuests = computed(() => {
  if (!props.npc.quests) return []
  
  return props.npc.quests.map(questId => {
    const quest = getQuestsByGiver(props.npc.id).find(q => q.id === questId)
    if (!quest) return null
    
    // 检查是否已接取（从数据库中查找）
    const playerQuest = questStore.playerQuests.find(pq => pq.quest_id === questId)
    
    // 过滤已完成的任务（FINISHED 状态）
    if (playerQuest && playerQuest.status === QuestStatus.FINISHED) {
      // 检查任务是否可重复
      if (!quest.repeatable) {
        return null // 不可重复的任务，不显示
      }
    }
    
    // 检查是否可接取
    const canAccept = !playerQuest && canAcceptQuest(
      quest,
      characterStore.character?.level || 1,
      questStore.completedQuestIds
    )
    
    // 检查未满足的条件
    const missingRequirements = []
    if (!canAccept && !playerQuest && quest.requirements) {
      // 检查等级要求
      if (quest.requirements.level && characterStore.character?.level < quest.requirements.level) {
        missingRequirements.push(`需要等级 ${quest.requirements.level}`)
      }
      // 检查前置任务
      if (quest.requirements.completedQuests && quest.requirements.completedQuests.length > 0) {
        const missingQuests = quest.requirements.completedQuests.filter(
          reqId => !questStore.completedQuestIds.includes(reqId)
        )
        if (missingQuests.length > 0) {
          missingQuests.forEach(reqId => {
            const reqQuest = getQuestById(reqId)
            if (reqQuest) {
              missingRequirements.push(`需要完成：${reqQuest.name}`)
            }
          })
        }
      }
    }
    
    return {
      ...quest,
      playerQuest: playerQuest || null, // 玩家任务进度数据
      accepted: !!playerQuest,
      canAccept,
      status: playerQuest?.status || null,
      missingRequirements // 未满足的条件列表
    }
  }).filter(q => q !== null)
})

const handleAccept = async (questId) => {
  const success = await questStore.acceptQuest(questId)
  if (success) {
    alert('任务接取成功！')
  } else {
    alert('无法接取该任务！')
  }
}

const handleComplete = async (questId) => {
  const quest = getQuestById(questId)
  const success = await questStore.completeQuest(questId)
  
  if (success) {
    // 获取奖励信息，并转换物品ID为名称
    const itemRewards = quest.rewards.items ? quest.rewards.items.map(item => {
      const itemData = getItemById(item.id)
      return {
        ...item,
        name: itemData?.name || '未知物品',
        icon: itemData?.icon || '📦'
      }
    }) : []
    
    // 显示奖励弹窗
    rewardInfo.value = {
      questName: quest.name,
      exp: quest.rewards.exp,
      silver: quest.rewards.silver,
      items: itemRewards
    }
    showRewardDialog.value = true
  } else {
    alert('任务奖励领取失败！')
  }
}

const closeRewardDialog = () => {
  showRewardDialog.value = false
  rewardInfo.value = null
}

const close = () => {
  emit('close')
}
</script>

<template>
  <div class="quest-list-overlay" @click.self="close">
    <div class="quest-list-dialog">
      <div class="quest-header">
        <h3>📜 {{ npc.name }}的任务</h3>
        <button class="btn-close-quest" @click="close">✕</button>
      </div>

      <div class="quest-content">
        <div v-if="npcQuests.length === 0" class="empty-quests">
          <p>暂无可接取的任务</p>
        </div>

        <div v-else class="quests-list">
          <div 
            v-for="quest in npcQuests" 
            :key="quest.id"
            class="quest-card"
            :class="{ accepted: quest.accepted, disabled: !quest.canAccept && !quest.accepted }">
            
            <div class="quest-title-row">
              <h4>{{ quest.name }}</h4>
              <span class="quest-type" :class="quest.type">
                {{ quest.type === 'main' ? '主线' : '支线' }}
              </span>
            </div>

            <p class="quest-desc">{{ quest.description }}</p>

            <div class="quest-objectives">
              <h5>任务目标：</h5>
              <ul>
                <li v-for="(obj, idx) in quest.objectives" :key="idx">
                  {{ obj.description }} ({{ obj.required }})
                </li>
              </ul>
            </div>

            <div class="quest-rewards">
              <h5>奖励：</h5>
              <div class="reward-items">
                <span v-if="quest.rewards.exp" class="reward-item">
                  ✨ {{ quest.rewards.exp }} 经验
                </span>
                <span v-if="quest.rewards.silver" class="reward-item">
                  💰 {{ quest.rewards.silver }} 灵石
                </span>
                <span v-if="quest.rewards.items" class="reward-item">
                  📦 {{ quest.rewards.items.length }} 件物品
                </span>
              </div>
            </div>

            <!-- 任务目标和进度 -->
            <div v-if="quest.playerQuest" class="quest-progress">
              <h5>任务进度：</h5>
              <div v-for="(obj, idx) in quest.playerQuest.objectives" :key="idx" class="objective-item">
                <span class="objective-desc">{{ obj.description }}</span>
                <span class="objective-progress" :class="{ completed: obj.current >= obj.required }">
                  {{ obj.current }} / {{ obj.required }}
                </span>
              </div>
            </div>

            <div class="quest-actions">
              <!-- 已完成，可领取 -->
              <button 
                v-if="quest.status === 'completed'"
                class="btn-complete"
                @click="handleComplete(quest.id)">
                🎁 领取奖励
              </button>
              <!-- 进行中 -->
              <button 
                v-else-if="quest.accepted && quest.status === 'active'"
                class="btn-in-progress"
                disabled>
                ⏳ 进行中
              </button>
              <!-- 已接取（旧版本兼容） -->
              <button 
                v-else-if="quest.accepted"
                class="btn-accepted"
                disabled>
                ✓ 已接取
              </button>
              <!-- 可接取 -->
              <button 
                v-else-if="quest.canAccept"
                class="btn-accept"
                @click="handleAccept(quest.id)">
                接取任务
              </button>
              <!-- 条件不足 -->
              <button 
                v-else
                class="btn-locked"
                disabled>
                🔒 条件不足
              </button>
              <!-- 显示未满足的条件 -->
              <div v-if="!quest.canAccept && !quest.accepted && quest.missingRequirements && quest.missingRequirements.length > 0" class="requirements-hint">
                <div class="hint-title">📋 接取条件：</div>
                <ul class="hint-list">
                  <li v-for="(req, idx) in quest.missingRequirements" :key="idx" class="hint-item">
                    ❌ {{ req }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 奖励弹窗 -->
    <div v-if="showRewardDialog" class="reward-overlay" @click.self="closeRewardDialog">
      <div class="reward-dialog">
        <h3>🎉 任务完成！</h3>
        <p class="reward-quest-name">{{ rewardInfo.questName }}</p>
        
        <div class="reward-content">
          <h4>获得奖励：</h4>
          <div class="reward-list">
            <div v-if="rewardInfo.exp" class="reward-item-large">
              <span class="reward-icon">✨</span>
              <span class="reward-value">{{ rewardInfo.exp }} 经验</span>
            </div>
            <div v-if="rewardInfo.silver" class="reward-item-large">
              <span class="reward-icon">💰</span>
              <span class="reward-value">{{ rewardInfo.silver }} 灵石</span>
            </div>
            <div v-if="rewardInfo.items && rewardInfo.items.length > 0" class="reward-items-grid">
              <div v-for="item in rewardInfo.items" :key="item.id" class="reward-item-large">
                <span class="reward-icon">{{ item.icon }}</span>
                <span class="reward-value">{{ item.name }} x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <button class="btn-close-reward" @click="closeRewardDialog">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quest-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3500;
  animation: fadeIn 0.2s;
}

.quest-list-dialog {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  border: 2px solid rgba(241, 196, 15, 0.4);
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.quest-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(241, 196, 15, 0.3);
}

.quest-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #f1c40f;
}

.btn-close-quest {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-quest:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: #e74c3c;
}

.quest-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.empty-quests {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.quests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quest-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.quest-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(241, 196, 15, 0.3);
}

.quest-card.accepted {
  border-color: rgba(46, 204, 113, 0.4);
  background: rgba(46, 204, 113, 0.05);
}

.quest-card.disabled {
  opacity: 0.5;
}

.quest-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.quest-title-row h4 {
  margin: 0;
  font-size: 1.2rem;
  color: #fff;
}

.quest-type {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.quest-type.main {
  background: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
  border: 1px solid rgba(241, 196, 15, 0.4);
}

.quest-type.side {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.4);
}

.quest-desc {
  color: #a0aec0;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.quest-objectives,
.quest-rewards {
  margin-bottom: 1rem;
}

.quest-objectives h5,
.quest-rewards h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #718096;
  text-transform: uppercase;
}

.quest-objectives ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #e2e8f0;
}

.quest-objectives li {
  margin-bottom: 0.3rem;
}

.reward-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.reward-item {
  padding: 0.4rem 0.8rem;
  background: rgba(100, 255, 218, 0.1);
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
  color: #64ffda;
}

.quest-actions {
  margin-top: 1rem;
}

.btn-accept,
.btn-accepted,
.btn-locked,
.btn-complete,
.btn-in-progress {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-accept {
  background: linear-gradient(45deg, #f1c40f, #f39c12);
  color: #1a202c;
}

.btn-accept:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(241, 196, 15, 0.4);
}

.btn-complete {
  background: linear-gradient(45deg, #2ecc71, #27ae60);
  color: #fff;
  animation: pulse 2s infinite;
}

.btn-complete:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.btn-in-progress {
  background: rgba(52, 152, 219, 0.2);
  border: 1px solid rgba(52, 152, 219, 0.4);
  color: #3498db;
  cursor: default;
}

.btn-accepted {
  background: rgba(46, 204, 113, 0.2);
  border: 1px solid rgba(46, 204, 113, 0.4);
  color: #2ecc71;
  cursor: default;
}

.btn-locked {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
}

/* 任务进度样式 */
.quest-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.quest-progress h5 {
  margin: 0 0 0.8rem 0;
  font-size: 0.85rem;
  color: #718096;
  text-transform: uppercase;
}

.objective-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.objective-item:last-child {
  border-bottom: none;
}

.objective-desc {
  color: #e2e8f0;
  font-size: 0.9rem;
}

.objective-progress {
  padding: 0.2rem 0.6rem;
  background: rgba(241, 196, 15, 0.2);
  border: 1px solid rgba(241, 196, 15, 0.3);
  border-radius: 12px;
  font-size: 0.85rem;
  color: #f1c40f;
  font-weight: bold;
}

.objective-progress.completed {
  background: rgba(46, 204, 113, 0.2);
  border-color: rgba(46, 204, 113, 0.3);
  color: #2ecc71;
}

/* 奖励弹窗样式 */
.reward-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  animation: fadeIn 0.3s;
}

.reward-dialog {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  border: 3px solid #f1c40f;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  animation: slideIn 0.3s, glow 2s infinite;
  box-shadow: 0 0 30px rgba(241, 196, 15, 0.5);
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 30px rgba(241, 196, 15, 0.5); }
  50% { box-shadow: 0 0 50px rgba(241, 196, 15, 0.8); }
}

.reward-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  color: #f1c40f;
  text-shadow: 0 0 20px rgba(241, 196, 15, 0.5);
}

.reward-quest-name {
  color: #64ffda;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  font-weight: bold;
}

.reward-content h4 {
  margin: 1.5rem 0 1rem 0;
  color: #a0aec0;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.reward-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.reward-item-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(241, 196, 15, 0.1);
  border: 2px solid rgba(241, 196, 15, 0.3);
  border-radius: 12px;
  transition: all 0.3s;
}

.reward-item-large:hover {
  background: rgba(241, 196, 15, 0.2);
  transform: scale(1.02);
}

.reward-icon {
  font-size: 2rem;
}

.reward-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
}

.reward-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.8rem;
}

.btn-close-reward {
  margin-top: 2rem;
  padding: 1rem 3rem;
  background: linear-gradient(45deg, #f1c40f, #f39c12);
  border: none;
  border-radius: 12px;
  color: #1a202c;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close-reward:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(241, 196, 15, 0.5);
}

/* 任务条件提示样式 */
.requirements-hint {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
}

.hint-title {
  color: #e74c3c;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.hint-list {
  margin: 0;
  padding-left: 1.2rem;
  list-style: none;
}

.hint-item {
  color: #a0aec0;
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 0.3rem;
}

.hint-item:last-child {
  margin-bottom: 0;
}
</style>
