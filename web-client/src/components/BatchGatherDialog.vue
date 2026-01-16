<template>
  <div class="batch-gather-modal" @click.self="$emit('close')">
    <div class="batch-gather-content">
      <h2>🌿 批量采集</h2>
      
      <div class="batch-info">
        <div class="info-row">
          <span class="label">⚡ 当前行动点：</span>
          <span class="value">{{ currentAP }} / {{ maxAP }}</span>
        </div>
        <div class="info-row">
          <span class="label">💰 每次消耗：</span>
          <span class="value">1 AP</span>
        </div>
        <div class="info-row">
          <span class="label">📊 最多可采集：</span>
          <span class="value">{{ currentAP }} 次</span>
        </div>
      </div>

      <div class="times-selector">
        <label>选择采集次数：</label>
        <div class="quick-buttons">
          <button 
            v-for="times in quickOptions" 
            :key="times"
            class="quick-btn"
            :class="{ active: selectedTimes === times }"
            :disabled="times > currentAP"
            @click="selectedTimes = times">
            {{ times }}次
          </button>
          <button 
            class="quick-btn all"
            :class="{ active: selectedTimes === currentAP }"
            :disabled="currentAP === 0"
            @click="selectedTimes = currentAP">
            全部 ({{ currentAP }})
          </button>
        </div>

        <div class="custom-input">
          <input 
            v-model.number="selectedTimes" 
            type="number" 
            :min="1" 
            :max="currentAP"
            @input="validateInput"
            placeholder="输入次数">
        </div>
      </div>

      <div class="actions">
        <button class="btn-confirm" :disabled="!canGather" @click="startBatchGather">
          🌿 开始采集 ({{ selectedTimes }}次)
        </button>
        <button class="btn-cancel" @click="$emit('close')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentAP: {
    type: Number,
    required: true
  },
  maxAP: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'confirm'])

const selectedTimes = ref(10)
const quickOptions = [10, 50, 100]

const canGather = computed(() => {
  return selectedTimes.value > 0 && selectedTimes.value <= props.currentAP
})

const validateInput = () => {
  if (selectedTimes.value < 1) selectedTimes.value = 1
  if (selectedTimes.value > props.currentAP) selectedTimes.value = props.currentAP
}

const startBatchGather = () => {
  if (canGather.value) {
    emit('confirm', selectedTimes.value)
  }
}
</script>

<style scoped>
.batch-gather-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.batch-gather-content {
  background: linear-gradient(135deg, #1a2332 0%, #2d3748 100%);
  border: 2px solid rgba(100, 255, 218, 0.3);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

h2 {
  margin: 0 0 1.5rem 0;
  color: #64ffda;
  text-align: center;
  font-size: 1.5rem;
}

.batch-info {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #fff;
}

.info-row .label {
  color: #a0aec0;
}

.info-row .value {
  color: #64ffda;
  font-weight: bold;
}

.times-selector label {
  display: block;
  color: #a0aec0;
  margin-bottom: 0.8rem;
  font-size: 0.9rem;
}

.quick-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.quick-btn {
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.quick-btn:hover:not(:disabled) {
  background: rgba(100, 255, 218, 0.1);
  border-color: #64ffda;
  transform: translateY(-2px);
}

.quick-btn.active {
  background: rgba(100, 255, 218, 0.2);
  border-color: #64ffda;
  color: #64ffda;
  font-weight: bold;
}

.quick-btn.all {
  grid-column: span 4;
  background: rgba(46, 204, 113, 0.1);
  border-color: rgba(46, 204, 113, 0.3);
}

.quick-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.custom-input {
  margin-bottom: 1.5rem;
}

.custom-input input {
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  text-align: center;
}

.custom-input input:focus {
  outline: none;
  border-color: #64ffda;
  box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.1);
}

.actions {
  display: flex;
  gap: 0.8rem;
}

.btn-confirm, .btn-cancel {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-confirm {
  background: linear-gradient(45deg, #2ecc71, #27ae60);
  color: white;
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}
</style>
