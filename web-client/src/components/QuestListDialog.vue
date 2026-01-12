<script setup>
import { computed } from 'vue'
import { useQuestStore } from '../stores/quest'
import { useCharacterStore } from '../stores/character'
import { getQuestsByGiver, canAcceptQuest } from '../data/quests'

const props = defineProps({
  npc: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const questStore = useQuestStore()
const characterStore = useCharacterStore()

// 该NPC可发布的任务
const npcQuests = computed(() => {
  if (!props.npc.quests) return []
  
  return props.npc.quests.map(questId => {
    const quest = getQuestsByGiver(props.npc.id).find(q => q.id === questId)
    if (!quest) return null
    
    // 检查是否已接取
    const accepted = questStore.playerQuests.find(pq => pq.quest_id === questId)
    
    // 检查是否可接取
    const canAccept = !accepted && canAcceptQuest(
      quest,
      characterStore.character?.level || 1,
      questStore.completedQuestIds
    )
    
    return {
      ...quest,
      accepted: !!accepted,
      canAccept
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

            <div class="quest-actions">
              <button 
                v-if="quest.accepted"
                class="btn-accepted"
                disabled>
                ✓ 已接取
              </button>
              <button 
                v-else-if="quest.canAccept"
                class="btn-accept"
                @click="handleAccept(quest.id)">
                接取任务
              </button>
              <button 
                v-else
                class="btn-locked"
                disabled>
                🔒 条件不足
              </button>
            </div>
          </div>
        </div>
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
.btn-locked {
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
</style>
