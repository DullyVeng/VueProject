<template>
  <div class="realm-panel">
    <!-- 当前境界显示 -->
    <div class="current-realm">
      <div class="realm-header">
        <div class="realm-badge" :class="`realm-${realmInfo?.current.key}`">
          {{ realmInfo?.current.name }}期
        </div>
        <div class="realm-level">
          {{ realmInfo?.current.level }} / {{ realmInfo?.current.maxLevel }}
        </div>
      </div>
      
      <div class="realm-description">
        {{ realmInfo?.current.description }}
      </div>

      <div class="unlocked-systems">
        <div class="label">已解锁：</div>
        <div class="systems">
          <span 
            v-for="unlock in realmInfo?.current.unlocks" 
            :key="unlock"
            class="system-tag"
          >
            {{ unlock }}
          </span>
        </div>
      </div>
    </div>

    <!-- 下一境界 -->
    <div v-if="realmInfo?.next" class="next-realm">
      <div class="section-title">下一境界</div>
      
      <div class="next-realm-info">
        <div class="realm-name">{{ realmInfo.next.name }}期</div>
        <p class="realm-desc">{{ realmInfo.next.description }}</p>
        
        <div class="unlock-preview">
          <div class="label">将解锁：</div>
          <div class="systems">
            <span 
              v-for="unlock in realmInfo.next.unlocks" 
              :key="unlock"
              class="system-tag next"
            >
              {{ unlock }}
            </span>
          </div>
        </div>

        <!-- 突破条件 -->
        <div class="requirements">
          <div class="label">突破条件：</div>
          <ul>
            <li>
              境界等级：{{ realmInfo.current.level }} / {{ realmInfo.next.requirement.fromRealmLevel }}
              <span v-if="character.realm_level >= realmInfo.next.requirement.fromRealmLevel" class="check">✓</span>
            </li>
            <li>
              角色等级：{{ character.level }} / {{ realmInfo.next.requirement.requiredLevel }}
              <span v-if="character.level >= realmInfo.next.requirement.requiredLevel" class="check">✓</span>
            </li>
            <li>
              灵石消耗：{{ realmInfo.next.requirement.silverCost }}
              <span v-if="character.silver >= realmInfo.next.requirement.silverCost" class="check">✓</span>
              <span v-else class="cross">✗</span>
            </li>
            <li v-if="realmInfo.next.requirement.requiredQuest">
              完成任务：{{ realmInfo.next.requirement.requiredQuest }}
              <span v-if="hasCompletedRealmQuest" class="check">✓</span>
              <span v-else class="cross">✗</span>
            </li>
          </ul>
        </div>

        <!-- 突破按钮 -->
        <button 
          class="advance-btn"
          :disabled="!canAdvance || advancing"
          @click="handleAdvance"
        >
          <span v-if="advancing">突破中...</span>
          <span v-else-if="canAdvance">立即突破</span>
          <span v-else>条件不足</span>
        </button>

        <!-- 失败原因 -->
        <div v-if="!canAdvance && advanceCheckResult" class="fail-reasons">
          <div v-for="(reason, idx) in advanceCheckResult.reasons" :key="idx" class="reason">
            ⚠️ {{ reason }}
          </div>
        </div>
      </div>
    </div>

    <!-- 已达最高境界 -->
    <div v-else class="max-realm">
      <p>🎉 已达当前版本最高境界</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharacterStore } from '../stores/character'
import { useQuestStore } from '../stores/quest'

const characterStore = useCharacterStore()
const questStore = useQuestStore()

const advancing = ref(false)

const character = computed(() => characterStore.character)
const realmInfo = computed(() => characterStore.getRealmInfo())

// 检查是否完成境界任务
const hasCompletedRealmQuest = computed(() => {
  if (!realmInfo.value?.next?.requirement?.requiredQuest) return true
  
  const completedIds = questStore.quests
    .filter(q => q.status === 'finished')
    .map(q => q.quest_id)
  
  return completedIds.includes(realmInfo.value.next.requirement.requiredQuest)
})

// 检查是否可突破
const advanceCheckResult = computed(() => {
  if (!realmInfo.value?.next) return null
  
  const completedIds = questStore.quests
    .filter(q => q.status === 'finished')
    .map(q => q.quest_id)
  
  return characterStore.canAdvanceRealm(realmInfo.value.next.key, completedIds)
})

const canAdvance = computed(() => {
  return advanceCheckResult.value?.canAdvance || false
})

async function handleAdvance() {
  if (!canAdvance.value || !realmInfo.value?.next) return
  
  advancing.value = true
  
  const completedIds = questStore.quests
    .filter(q => q.status === 'finished')
    .map(q => q.quest_id)
  
  const result = await characterStore.advanceRealm(realmInfo.value.next.key, completedIds)
  
  advancing.value = false
  
  if (result.success) {
    alert(`🎉 ${result.message}\n\n解锁系统：${result.unlocks.join('、')}`)
  } else {
    alert(`❌ ${result.message}\n\n${result.reasons?.join('\n') || ''}`)
  }
}

onMounted(async () => {
  if (!questStore.quests || questStore.quests.length === 0) {
    await questStore.fetchQuests()
  }
})
</script>

<style scoped>
.realm-panel {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.current-realm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.realm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.realm-badge {
  font-size: 24px;
  font-weight: bold;
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
}

.realm-level {
  font-size: 18px;
  font-weight: bold;
  background: rgba(255,255,255,0.2);
  padding: 6px 12px;
  border-radius: 15px;
}

.realm-description {
  margin: 10px 0;
  opacity: 0.9;
}

.unlocked-systems {
  margin-top: 15px;
}

.unlocked-systems .label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 5px;
}

.systems {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.system-tag {
  background: rgba(255,255,255,0.25);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.system-tag.next {
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid #667eea;
}

.next-realm {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.next-realm-info .realm-name {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8px;
}

.realm-desc {
  color: #666;
  margin-bottom: 15px;
}

.unlock-preview {
  margin-bottom: 20px;
}

.unlock-preview .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.requirements {
  margin: 20px 0;
}

.requirements .label {
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.requirements ul {
  list-style: none;
  padding: 0;
}

.requirements li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.check {
  color: #4caf50;
  font-weight: bold;
}

.cross {
  color: #f44336;
  font-weight: bold;
}

.advance-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.advance-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.advance-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.fail-reasons {
  margin-top: 15px;
  padding: 10px;
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  border-radius: 4px;
}

.reason {
  color: #e65100;
  font-size: 13px;
  margin: 5px 0;
}

.max-realm {
  text-align: center;
  padding: 40px;
  background: #f5f5f5;
  border-radius: 12px;
  color: #666;
  font-size: 18px;
}
</style>
