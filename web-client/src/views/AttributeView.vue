<template>
  <div class="attribute-view">
    <h1>属性加点</h1>
    
    <div class="attribute-container">
      <!-- 可用属性点 -->
      <div class="available-points-panel">
        <div class="points-display">
          <span class="points-label">可用属性点</span>
          <span class="points-value">{{ attributeStore.availablePoints }}</span>
        </div>
        <button @click="showResetConfirm = true" class="btn-reset">
          重置属性
        </button>
      </div>
      
      <!-- 五大属性 -->
      <div class="attributes-grid">
        <div
          v-for="(config, key) in attributeStore.ATTRIBUTE_CONFIG"
          :key="key"
          class="attribute-card"
        >
          <div class="card-header">
            <span class="attr-icon">{{ config.icon }}</span>
            <span class="attr-name">{{ config.name }}</span>
          </div>
          
          <div class="attr-current-value">
            {{ attributeStore.attributes[key] }}
          </div>
          
          <div class="attr-cost">
            消耗：{{ config.costPerPoint }} 属性点
          </div>
          
          <div class="attr-effects">
            <div class="effects-title">效果：</div>
            <ul>
              <li v-for="(effect, index) in config.effects" :key="index">
                {{ effect }}
              </li>
            </ul>
          </div>
          
          <div class="attr-actions">
            <button @click="decreaseAttribute(key)" class="btn-control" :disabled="tempAllocations[key] <= 0">
              −
            </button>
            <span class="temp-value">{{ tempAllocations[key] > 0 ? `+${tempAllocations[key]}` : '0' }}</span>
            <button @click="increaseAttribute(key)" class="btn-control" :disabled="!canIncrease(key)">
              +
            </button>
          </div>
        </div>
      </div>
      
      <!-- 衍生属性预览 -->
      <div class="derived-stats-panel">
        <h2>衍生属性预览</h2>
        <div class="derived-grid">
          <div class="derived-stat">
            <span class="stat-label">丹田容量:</span>
            <span class="stat-value">
              {{ attributeStore.derivedStats.dantianCapacity }}
              <span v-if="previewDerived.dantianCapacity !== attributeStore.derivedStats.dantianCapacity" class="stat-change">
                → {{ previewDerived.dantianCapacity }}
              </span>
            </span>
          </div>
          
          <div class="derived-stat">
            <span class="stat-label">最大行动点:</span>
            <span class="stat-value">
              {{ attributeStore.derivedStats.maxActionPoints }}
              <span v-if="previewDerived.maxActionPoints !== attributeStore.derivedStats.maxActionPoints" class="stat-change">
                → {{ previewDerived.maxActionPoints }}
              </span>
            </span>
          </div>
          
          <div class="derived-stat">
            <span class="stat-label">行动点恢复:</span>
            <span class="stat-value">{{ attributeStore.derivedStats.actionPointsRegen }}</span>
          </div>
          
          <div class="derived-stat">
            <span class="stat-label">生命加成:</span>
            <span class="stat-value">
              +{{ attributeStore.derivedStats.bonusHP }}
              <span v-if="previewDerived.bonusHP !== attributeStore.derivedStats.bonusHP" class="stat-change">
                → +{{ previewDerived.bonusHP }}
              </span>
            </span>
          </div>
          
          <div class="derived-stat">
            <span class="stat-label">防御加成:</span>
            <span class="stat-value">
              +{{ attributeStore.derivedStats.bonusDefense }}
              <span v-if="previewDerived.bonusDefense !== attributeStore.derivedStats.bonusDefense" class="stat-change">
                → +{{ previewDerived.bonusDefense }}
              </span>
            </span>
          </div>
          
          <div class="derived-stat">
            <span class="stat-label">法术威力:</span>
            <span class="stat-value">{{ (attributeStore.derivedStats.spellPowerMultiplier * 100).toFixed(0) }}%</span>
          </div>
          
          <div class="derived-stat">
            <span class="stat-label">法宝耐久:</span>
            <span class="stat-value">{{ (attributeStore.derivedStats.fabaoDurabilityBonus * 100).toFixed(0) }}%</span>
          </div>
          
          <div class="derived-stat">
            <span class="stat-label">强化成功率:</span>
            <span class="stat-value">+{{ (attributeStore.derivedStats.enhanceSuccessRateBonus * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 确认按钮 -->
      <div class="action-buttons">
        <button 
          @click="confirmAllocation" 
          class="btn-confirm"
          :disabled="totalTempAllocation === 0"
        >
          确认分配（消耗 {{ totalCost }} 属性点）
        </button>
        <button @click="clearTempAllocations" class="btn-clear" :disabled="totalTempAllocation === 0">
          清空
        </button>
      </div>
    </div>
    
    <!-- 重置确认对话框 -->
    <div v-if="showResetConfirm" class="modal-overlay" @click="showResetConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>确认重置属性？</h3>
        <p>重置属性将消耗 <strong>{{ resetCost }}</strong> 灵石</p>
        <p>你当前的灵石：<strong>{{ characterStore.character?.silver || 0 }}</strong></p>
        <div class="modal-actions">
          <button @click="confirmReset" class="btn-confirm">
            确认重置
          </button>
          <button @click="showResetConfirm = false" class="btn-cancel">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAttributeStore } from '../stores/attribute'
import { useCharacterStore } from '../stores/character'

const attributeStore = useAttributeStore()
const characterStore = useCharacterStore()

// 临时分配记录（还未提交）
const tempAllocations = ref({
  spiritPower: 0,
  divineSense: 0,
  bodyConstitution: 0,
  comprehension: 0,
  fortune: 0
})

const showResetConfirm = ref(false)

// 计算临总消耗
const totalCost = computed(() => {
  let cost = 0
  for (const [key, amount] of Object.entries(tempAllocations.value)) {
    const config = attributeStore.ATTRIBUTE_CONFIG[key]
    if (config) {
      cost += config.costPerPoint * amount
    }
  }
  return cost
})

// 总临时分配点数
const totalTempAllocation = computed(() => {
  return Object.values(tempAllocations.value).reduce((sum, val) => sum + val, 0)
})

// 预览衍生属性
const previewDerived = computed(() => {
  const baseAttrs = attributeStore.attributes
  const preview = { ...baseAttrs }
  
  // 应用临时分配
  for (const [key, amount] of Object.entries(tempAllocations.value)) {
    preview[key] = baseAttrs[key] + amount
  }
  
  // 计算衍生属性
  return {
    dantianCapacity: 25 + preview.spiritPower,
    maxActionPoints: 10 + Math.floor(preview.spiritPower / 5),
    bonusHP: preview.bodyConstitution * 10,
    bonusDefense: preview.bodyConstitution
  }
})

// 重置成本
const resetCost = computed(() => {
  const level = characterStore.character?.level || 1
  return 1000 * level
})

// 增加属性
function increaseAttribute(key) {
  const config = attributeStore.ATTRIBUTE_CONFIG[key]
  if (!config) return
  
  // 检查是否有足够的点数
  if (totalCost.value + config.costPerPoint > attributeStore.availablePoints) {
    alert('属性点不足！')
    return
  }
  
  tempAllocations.value[key]++
}

// 减少属性
function decreaseAttribute(key) {
  if (tempAllocations.value[key] > 0) {
    tempAllocations.value[key]--
  }
}

// 检查是否可以增加
function canIncrease(key) {
  const config = attributeStore.ATTRIBUTE_CONFIG[key]
  if (!config) return false
  
  return totalCost.value + config.costPerPoint <= attributeStore.availablePoints
}

// 清空临时分配
function clearTempAllocations() {
  for (const key in tempAllocations.value) {
    tempAllocations.value[key] = 0
  }
}

// 确认分配
async function confirmAllocation() {
  if (totalTempAllocation.value === 0) return
  
  // 只发送非零的分配
  const allocations = {}
  for (const [key, amount] of Object.entries(tempAllocations.value)) {
    if (amount > 0) {
      allocations[key] = amount
    }
  }
  
  const result = await attributeStore.allocateMultiple(allocations)
  
  if (result.success) {
    alert('属性分配成功！')
    clearTempAllocations()
  } else {
    alert(`分配失败：${result.reason}`)
  }
}

// 确认重置
async function confirmReset() {
  const result = await attributeStore.resetAttributes(false)
  
  if (result.success) {
    alert(`属性重置成功！消耗了${result.cost}灵石`)
    showResetConfirm.value = false
    clearTempAllocations()
  } else {
    alert(`重置失败：${result.reason}`)
  }
}
</script>

<style scoped>
.attribute-view {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.attribute-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 可用属性点面板 */
.available-points-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 16px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.points-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.points-label {
  font-size: 20px;
  font-weight: 500;
}

.points-value {
  font-size: 48px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.btn-reset {
  padding: 12px 24px;
  background: rgba(255,255,255,0.2);
  border: 2px solid white;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.btn-reset:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

/* 属性网格 */
.attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.attribute-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s;
}

.attribute-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.attr-icon {
  font-size: 36px;
}

.attr-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.attr-current-value {
  text-align: center;
  font-size: 48px;
  font-weight: bold;
  color: #4CAF50;
  margin: 20px 0;
}

.attr-cost {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.attr-effects {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.effects-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.attr-effects ul {
  margin: 0;
  padding-left: 20px;
}

.attr-effects li {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.attr-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.btn-control {
  width: 48px;
  height: 48px;
  border: 2px solid #4CAF50;
  background: white;
  color: #4CAF50;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-control:hover:not(:disabled) {
  background: #4CAF50;
  color: white;
  transform: scale(1.1);
}

.btn-control:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.temp-value {
  font-size: 24px;
  font-weight: bold;
  color: #FF9800;
  min-width: 60px;
  text-align: center;
}

/* 衍生属性面板 */
.derived-stats-panel {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.derived-stats-panel h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.derived-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.derived-stat {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.stat-label {
  font-weight: 500;
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.stat-change {
  color: #4CAF50;
  font-weight: bold;
  margin-left: 8px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn-confirm, .btn-clear, .btn-cancel {
  padding: 16px 48px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-confirm {
  background: linear-gradient(135deg, #4CAF50, #81C784);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear {
  background: #f5f5f5;
  color: #666;
}

.btn-clear:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-cancel {
  background: #f44336;
  color: white;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 16px;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.modal-content p {
  margin: 12px 0;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  justify-content: center;
}
</style>
