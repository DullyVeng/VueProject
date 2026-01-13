<script setup>
import { ref, computed } from 'vue'
import { useSectStore } from '../stores/sect'
import { useCharacterStore } from '../stores/character'

const emit = defineEmits(['close', 'founded'])

const sectStore = useSectStore()
const characterStore = useCharacterStore()

const sectName = ref('')
const nameError = ref('')
const founding = ref(false)

// 当前灵石
const currentSilver = computed(() => characterStore.character?.silver || 0)

// 是否可以开启
const canFound = computed(() => {
  if (!sectName.value) return false
  if (nameError.value) return false
  return currentSilver.value >= sectStore.SECT_FOUNDATION_COST.silver
})

// 灵石是否足够
const hasEnoughSilver = computed(() => {
  return currentSilver.value >= sectStore.SECT_FOUNDATION_COST.silver
})

// 实时验证名称
let validateTimeout = null
const onNameInput = async () => {
  const name = sectName.value.trim()
  
  // 清除之前的定时器
  clearTimeout(validateTimeout)
  
  // 格式验证（即时）
  const formatCheck = sectStore.validateSectName(name)
  if (!formatCheck.valid) {
    nameError.value = formatCheck.error
    return
  }
  
  // 唯一性验证（防抖300ms）
  nameError.value = '检查中...'
  validateTimeout = setTimeout(async () => {
    const uniqueCheck = await sectStore.checkSectNameAvailability(name)
    if (!uniqueCheck.available) {
      nameError.value = uniqueCheck.error
    } else {
      nameError.value = ''
    }
  }, 300)
}

// 开启宗门
const onFoundSect = async () => {
  if (!canFound.value || founding.value) return
  
  founding.value = true
  
  try {
    const result = await sectStore.foundSect(
      characterStore.character.id,
      sectName.value,
      characterStore
    )
    
    if (result.success) {
      emit('founded', result.message)
      emit('close')
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert('开启宗门失败：' + error.message)
  } finally {
    founding.value = false
  }
}

const close = () => {
  emit('close')
}
</script>

<template>
  <div class="foundation-overlay" @click.self="close">
    <div class="foundation-dialog">
      <div class="dialog-header">
        <h2>🏛️ 开启宗门</h2>
        <button class="btn-close" @click="close">✕</button>
      </div>

      <div class="dialog-content">
        <!-- 开启说明 -->
        <div class="foundation-intro">
          <p>开启宗门后，你将拥有自己的修仙宗门，可以建造建筑、招收弟子、发展势力。</p>
        </div>

        <!-- 消耗预览 -->
        <div class="cost-section">
          <h3>开启消耗</h3>
          <div class="cost-display">
            <div class="cost-item">
              <span class="cost-icon">💰</span>
              <span class="cost-label">灵石</span>
              <span class="cost-value">{{ sectStore.SECT_FOUNDATION_COST.silver }}</span>
            </div>
          </div>
          <div class="current-silver" :class="{ insufficient: !hasEnoughSilver }">
            <span>你的灵石：</span>
            <span class="silver-amount">{{ currentSilver }}</span>
            <span v-if="!hasEnoughSilver" class="warning-text">（不足）</span>
          </div>
        </div>

        <!-- 宗门命名 -->
        <div class="naming-section">
          <h3>宗门命名</h3>
          <div class="name-input-wrapper">
            <input
              v-model="sectName"
              type="text"
              class="name-input"
              placeholder="请输入宗门名称（2-8字符）"
              maxlength="8"
              @input="onNameInput"
              :disabled="founding"
            />
            <div class="name-hint">
              <span class="hint-text">支持中文、英文、数字</span>
              <span class="char-count">{{ sectName.length }}/8</span>
            </div>
          </div>
          <div v-if="nameError" class="name-error">
            <span class="error-icon">⚠️</span>
            <span>{{ nameError }}</span>
          </div>
        </div>

        <!-- 确认按钮 -->
        <div class="action-section">
          <button
            class="btn-found"
            :disabled="!canFound || founding"
            @click="onFoundSect"
          >
            <span v-if="founding">开启中...</span>
            <span v-else>开启宗门</span>
          </button>
          <button class="btn-cancel" @click="close" :disabled="founding">
            取消
          </button>
        </div>

        <!-- 提示信息 -->
        <div class="tips-section">
          <p class="tip-item">💡 宗门名称一旦确定暂不可修改，请慎重选择</p>
          <p class="tip-item">💡 开启后将获得初始材料用于建设宗门</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.foundation-overlay {
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
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.foundation-dialog {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  border: 2px solid rgba(241, 196, 15, 0.4);
  border-radius: 20px;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: rgba(241, 196, 15, 0.1);
  border-bottom: 1px solid rgba(241, 196, 15, 0.3);
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #f1c40f;
  text-shadow: 0 2px 10px rgba(241, 196, 15, 0.3);
}

.btn-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: #e74c3c;
  transform: rotate(90deg);
}

.dialog-content {
  padding: 2rem;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(90vh - 100px);
}

.foundation-intro {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(52, 152, 219, 0.1);
  border-left: 3px solid #3498db;
  border-radius: 8px;
}

.foundation-intro p {
  margin: 0;
  color: #a0aec0;
  line-height: 1.6;
  word-wrap: break-word;
}

.cost-section,
.naming-section {
  margin-bottom: 1.5rem;
}

.cost-section h3,
.naming-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #f1c40f;
}

.cost-display {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 0.8rem;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.1rem;
}

.cost-icon {
  font-size: 2rem;
}

.cost-label {
  flex: 1;
  color: #a0aec0;
}

.cost-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #f1c40f;
}

.current-silver {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem;
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.3);
  border-radius: 8px;
  color: #2ecc71;
  font-size: 0.95rem;
}

.current-silver.insufficient {
  background: rgba(231, 76, 60, 0.1);
  border-color: rgba(231, 76, 60, 0.3);
  color: #e74c3c;
}

.silver-amount {
  font-weight: bold;
  font-size: 1.1rem;
}

.warning-text {
  color: #e74c3c;
  font-weight: bold;
}

.name-input-wrapper {
  margin-bottom: 0.5rem;
}

.name-input {
  width: 100%;
  max-width: 100%;
  padding: 1rem 1.2rem;
  font-size: 1.1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  transition: all 0.3s;
  font-family: inherit;
  box-sizing: border-box;
}

.name-input:focus {
  outline: none;
  border-color: #f1c40f;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 20px rgba(241, 196, 15, 0.2);
}

.name-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.name-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #718096;
}

.char-count {
  color: #a0aec0;
}

.name-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.8rem;
}

.error-icon {
  font-size: 1.2rem;
}

.action-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-found,
.btn-cancel {
  flex: 1;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  box-sizing: border-box;
}

.btn-found {
  background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
  color: #000;
  box-shadow: 0 4px 15px rgba(241, 196, 15, 0.3);
}

.btn-found:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(241, 196, 15, 0.5);
}

.btn-found:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tips-section {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  box-sizing: border-box;
}

.tip-item {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: #718096;
  line-height: 1.5;
}

.tip-item:first-child {
  margin-top: 0;
}

.tip-item:last-child {
  margin-bottom: 0;
}
</style>
