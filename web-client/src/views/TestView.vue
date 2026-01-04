<template>
  <div class="test-page">
    <h1>🧪 P0功能测试页面</h1>
    
    <!-- 加载状态 -->
    <div v-if="characterStore.loading || fabaoStore.loading || attributeStore.loading" class="loading">
      加载中...
    </div>
    
    <div v-else-if="!characterStore.character" class="error">
      请先创建角色或登录
    </div>
    
    <div v-else class="test-container">
      <!-- 角色基础信息 -->
      <section class="test-section">
        <h2>📋 角色基础信息</h2>
        <div class="info-grid">
          <div><strong>姓名:</strong> {{ characterStore.character.name }}</div>
          <div><strong>等级:</strong> {{ characterStore.character.level }}</div>
          <div><strong>境界:</strong> {{ getRealmName(characterStore.character.realm || 'lianqi') }}</div>
          <div><strong>灵石:</strong> {{ characterStore.character.silver || 0 }}</div>
        </div>
      </section>

      <!-- 五大属性测试 -->
      <section class="test-section">
        <h2>✨ 五大属性系统</h2>
        <div class="attributes-grid">
          <div v-for="(config, key) in attributeStore.ATTRIBUTE_CONFIG" :key="key" class="attribute-card">
            <div class="attr-header">
              <span class="attr-icon">{{ config.icon }}</span>
              <span class="attr-name">{{ config.name }}</span>
            </div>
            <div class="attr-value">{{ attributeStore.attributes[key] }}</div>
            <div class="attr-cost">消耗: {{ config.costPerPoint }}点</div>
            <button 
              @click="testAllocatePoint(key)" 
              :disabled="attributeStore.availablePoints < config.costPerPoint"
              class="btn-small"
            >
              +1
            </button>
          </div>
        </div>
        <div class="available-points">
          <strong>可用属性点:</strong> {{ attributeStore.availablePoints }}
        </div>
        <button @click="testResetAttributes" class="btn-reset">重置属性（测试）</button>
      </section>

      <!-- 衍生属性 -->
      <section class="test-section">
        <h2>📊 衍生属性</h2>
        <div class="derived-stats">
          <div><strong>丹田容量:</strong> {{ attributeStore.derivedStats.dantianCapacity }}</div>
          <div><strong>丹田尺寸:</strong> {{ attributeStore.derivedStats.dantianWidth }} x {{ attributeStore.derivedStats.dantianHeight }}</div>
          <div><strong>最大行动点:</strong> {{ attributeStore.derivedStats.maxActionPoints }}</div>
          <div><strong>行动点恢复:</strong> {{ attributeStore.derivedStats.actionPointsRegen }}</div>
          <div><strong>生命加成:</strong> +{{ attributeStore.derivedStats.bonusHP }}</div>
          <div><strong>防御加成:</strong> +{{ attributeStore.derivedStats.bonusDefense }}</div>
          <div><strong>法术威力:</strong> {{ (attributeStore.derivedStats.spellPowerMultiplier * 100).toFixed(0) }}%</div>
          <div><strong>法宝耐久:</strong> {{ (attributeStore.derivedStats.fabaoDurabilityBonus * 100).toFixed(0) }}%</div>
        </div>
      </section>

      <!-- 法宝系统测试 -->
      <section class="test-section">
        <h2>🗡️ 法宝系统</h2>
        
        <div class="fabao-actions">
          <button @click="testAddFabao" class="btn-primary">添加测试法宝（青莲剑）</button>
          <button @click="testAddRareFabao" class="btn-primary">添加稀有法宝（紫霄剑）</button>
        </div>

        <div v-if="fabaoStore.fabaos.length === 0" class="empty-state">
          暂无法宝，点击上方按钮添加测试法宝
        </div>

        <div v-else class="fabaos-list">
          <h3>已拥有的法宝 ({{ fabaoStore.fabaos.length }})</h3>
          <div v-for="fabao in fabaoStore.fabaos" :key="fabao.id" class="fabao-card">
            <div class="fabao-header">
              <span class="fabao-icon">{{ fabao.icon }}</span>
              <span class="fabao-name">{{ fabao.name }}</span>
              <span :class="['fabao-rarity', `rarity-${fabao.rarity}`]">
                {{ fabao.rarityConfig?.name || fabao.rarity }}
              </span>
            </div>
            <div class="fabao-stats">
              <div><strong>境界:</strong> {{ fabao.realm }}</div>
              <div><strong>生命:</strong> {{ fabao.hp }} / {{ fabao.max_hp }}</div>
              <div><strong>攻击:</strong> {{ fabao.attack }}</div>
              <div><strong>防御:</strong> {{ fabao.defense }}</div>
              <div><strong>召唤成本:</strong> {{ fabao.summonCost }}</div>
            </div>
            <div class="fabao-status">
              <span v-if="fabao.isDamaged" class="status-damaged">❌ 已损毁</span>
              <span v-else-if="fabao.isSummoned" class="status-summoned">⚔️ 已召唤</span>
              <span v-else-if="fabao.isInDantian" class="status-dantian">💎 丹田中</span>
            </div>
            <div class="fabao-nourish">
              <strong>温养等级:</strong> {{ fabao.nourishBonus?.level || 0 }} / 10
              <div v-if="fabao.nourishBonus?.level > 0" class="nourish-bonus">
                HP +{{ fabao.nourishBonus.hpBonus }}% | 
                ATK +{{ fabao.nourishBonus.attackBonus }}% | 
                DEF +{{ fabao.nourishBonus.defenseBonus }}%
              </div>
            </div>
            <div class="fabao-actions">
              <button 
                @click="testSummonFabao(fabao.id)" 
                :disabled="fabao.isDamaged || fabao.isSummoned"
                class="btn-small"
              >
                召唤
              </button>
              <button 
                @click="testDamageFabao(fabao.id)" 
                :disabled="fabao.isDamaged"
                class="btn-small btn-danger"
              >
                损毁（测试）
              </button>
              <button 
                @click="testRepairFabao(fabao.id)" 
                :disabled="!fabao.isDamaged"
                class="btn-small"
              >
                修复
              </button>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="fabao-summary">
          <div><strong>丹田中:</strong> {{ fabaoStore.dantianFabaos.length }}</div>
          <div><strong>已召唤:</strong> {{ fabaoStore.summonedFabaos.length }}</div>
          <div><strong>已损毁:</strong> {{ fabaoStore.damagedFabaos.length }}</div>
          <div><strong>可召唤:</strong> {{ fabaoStore.availableFabaos.length }}</div>
        </div>
      </section>

      <!-- 行动点测试 -->
      <section class="test-section">
        <h2>⚡ 行动点系统</h2>
        <div class="action-points">
          <div class="ap-bar">
            <div class="ap-current">{{ characterStore.character.current_action_points || 0 }}</div>
            <div class="ap-separator">/</div>
            <div class="ap-max">{{ characterStore.character.max_action_points || 10 }}</div>
          </div>
          <button @click="testRestoreAP" class="btn-small">恢复行动点</button>
        </div>
      </section>

      <!-- 测试日志 -->
      <section class="test-section">
        <h2>📝 测试日志</h2>
        <div class="test-logs">
          <div v-for="(log, index) in testLogs" :key="index" :class="['log-entry', `log-${log.type}`]">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
        <button @click="testLogs = []" class="btn-small">清空日志</button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCharacterStore } from '../stores/character'
import { useFabaoStore } from '../stores/fabao'
import { useAttributeStore } from '../stores/attribute'
import { getRealmName } from '../data/playerRealms'

const characterStore = useCharacterStore()
const fabaoStore = useFabaoStore()
const attributeStore = useAttributeStore()
const testLogs = ref([])

// 添加日志
function addLog(message, type = 'info') {
  const now = new Date()
  const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
  testLogs.value.unshift({ time, message, type })
  if (testLogs.value.length > 20) testLogs.value.pop()
}

// 测试分配属性点
async function testAllocatePoint(attributeName) {
  const config = attributeStore.ATTRIBUTE_CONFIG[attributeName]
  const result = await attributeStore.allocatePoint(attributeName, 1)
  
  if (result.success) {
    addLog(`✅ 成功分配 ${config.name} +1`, 'success')
  } else {
    addLog(`❌ 分配失败: ${result.reason}`, 'error')
  }
}

// 测试重置属性
async function testResetAttributes() {
  if (!confirm('确定要重置属性吗？这将消耗灵石。')) return
  
  const result = await attributeStore.resetAttributes(false)
  if (result.success) {
    addLog(`✅ 属性重置成功，消耗 ${result.cost} 灵石`, 'success')
  } else {
    addLog(`❌ 重置失败: ${result.reason}`, 'error')
  }
}

// 测试添加法宝
async function testAddFabao() {
  const result = await fabaoStore.addFabao('fabao_sword_qinglian', '灵器', 'common')
  if (result) {
    addLog('✅ 成功添加法宝：青莲剑', 'success')
  } else {
    addLog('❌ 添加法宝失败', 'error')
  }
}

// 测试添加稀有法宝
async function testAddRareFabao() {
  const result = await fabaoStore.addFabao('fabao_sword_zixiao', '真器', 'rare')
  if (result) {
    addLog('✅ 成功添加稀有法宝：紫霄剑', 'success')
  } else {
    addLog('❌ 添加法宝失败', 'error')
  }
}

// 测试召唤法宝
async function testSummonFabao(fabaoId) {
  const result = await fabaoStore.summonFabao(fabaoId)
  if (result.success) {
    addLog(`✅ 成功召唤法宝：${result.fabao.name}`, 'success')
  } else {
    addLog(`❌ 召唤失败: ${result.reason}`, 'error')
  }
}

// 测试损毁法宝
async function testDamageFabao(fabaoId) {
  await fabaoStore.damageFabao(fabaoId)
  addLog('⚠️ 法宝已损毁', 'warning')
}

// 测试修复法宝
async function testRepairFabao(fabaoId) {
  const result = await fabaoStore.repairFabao(fabaoId)
  if (result.success) {
    addLog(`✅ 法宝修复成功，消耗 ${result.cost} 灵石`, 'success')
  } else {
    addLog(`❌ 修复失败: ${result.reason}`, 'error')
  }
}

// 测试恢复行动点
async function testRestoreAP() {
  const char = characterStore.character;
  const maxAP = char.max_action_points || 10;
  
  characterStore.character.current_action_points = maxAP;
  // 模拟更新数据库（实际应该调用characterStore的方法）
  addLog(`✅ 行动点已恢复到 ${maxAP}`, 'success');
}

// 页面加载时初始化
onMounted(async () => {
  addLog('🚀 测试页面已加载', 'info')
  
  if (characterStore.character) {
    await fabaoStore.fetchFabaos()
    addLog('📦 法宝数据已加载', 'info')
  }
})
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  padding: 20px;
  font-family: Arial, sans-serif;
  background: #f5f5f5;
  overflow-y: auto;
  color: #333;
}

.test-container {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 32px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

h2 {
  color: #555;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.test-section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
  color: #333;
}

.derived-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
  padding: 15px;
  background: #e8f5e9;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 14px;
}

.derived-stats > div {
  padding: 8px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #4CAF50;
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.attribute-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
}

.attribute-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
}

.attr-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
}

.attr-icon {
  font-size: 24px;
}

.attr-name {
  font-weight: bold;
  font-size: 16px;
}

.attr-value {
  font-size: 32px;
  font-weight: bold;
  color: #4CAF50;
  margin: 10px 0;
}

.attr-cost {
  color: #666;
  font-size: 12px;
  margin-bottom: 10px;
}

.available-points {
  text-align: center;
  font-size: 18px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 15px;
}

.fabao-actions, .action-points {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
}

.fabaos-list {
  margin-top: 20px;
}

.fabao-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: #fafafa;
}

.fabao-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.fabao-icon {
  font-size: 32px;
}

.fabao-name {
  font-size: 20px;
  font-weight: bold;
}

.fabao-rarity {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  margin-left: auto;
}

.rarity-common { background: #9E9E9E; }
.rarity-fine { background: #4CAF50; }
.rarity-rare { background: #2196F3; }
.rarity-epic { background: #9C27B0; }
.rarity-legendary { background: #FF9800; }

.fabao-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.fabao-status {
  margin: 10px 0;
}

.status-damaged { color: #f44336; }
.status-summoned { color: #FF9800; }
.status-dantian { color: #4CAF50; }

.fabao-nourish {
  background: #e8f5e9;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.nourish-bonus {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.fabao-summary {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 20px;
}

.ap-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 24px;
  font-weight: bold;
}

.ap-current { color: #4CAF50; }
.ap-max { color: #999; }

.test-logs {
  max-height: 300px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.log-entry {
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 4px;
  display: flex;
  gap: 10px;
}

.log-time {
  color: #666;
  font-size: 12px;
  min-width: 60px;
}

.log-info { background: #e3f2fd; }
.log-success { background: #e8f5e9; color: #2e7d32; }
.log-error { background: #ffebee; color: #c62828; }
.log-warning { background: #fff3e0; color: #ef6c00; }

/* 按钮样式 */
.btn-primary, .btn-small, .btn-reset, .btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  background: #2196F3;
  color: white;
}

.btn-small:hover {
  background: #1976D2;
}

.btn-small:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-reset {
  background: #FF9800;
  color: white;
}

.btn-reset:hover {
  background: #F57C00;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}
</style>
