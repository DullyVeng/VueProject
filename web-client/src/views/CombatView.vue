
<script setup>
import { useCombatStore } from '../stores/combat'
import { useCharacterStore } from '../stores/character'
import { useFabaoStore } from '../stores/fabao'
import { useRouter } from 'vue-router'
import { onMounted, ref, watchEffect, computed } from 'vue'

const combatStore = useCombatStore()
const characterStore = useCharacterStore()
const fabaoStore = useFabaoStore()
const router = useRouter()
const logsContainer = ref(null)

onMounted(async () => {
  // 加载法宝数据（确保刷新后数据可用）
  await fabaoStore.fetchFabaos()
  console.log('[CombatView] 法宝数据加载完成:', fabaoStore.fabaos.length, '个法宝')
  
  // 如果在战斗中，同步已召唤的法宝到战斗快照数组
  if (combatStore.isInCombat) {
    const summonedFabaos = fabaoStore.fabaos.filter(f => f.isSummoned && !f.isDamaged)
    combatStore.playerSummonedFabaos.splice(0, combatStore.playerSummonedFabaos.length, ...summonedFabaos)
    console.log('[CombatView] 同步已召唤法宝:', summonedFabaos.length, '个')
  }
  
  // 检查是否在战斗中，否则跳转到地图
  if (!combatStore.isInCombat) {
    router.push('/map')
  }
})

// Auto scroll logs
watchEffect(() => {
  if (combatStore.logs.length && logsContainer.value) {
    setTimeout(() => {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }, 100)
  }
})

// 战斗阶段文本
const phaseText = computed(() => {
  const phaseMap = {
    '​enemy_summon': '🔥 敌人召唤阶段',
    'player_summon': '⚔️ 你的回合 - 召唤法宝',
    'prepare': '🛡️ 战斗准备中...',
    'battle': '⚡ 战斗进行中！',
    'settlement': '🏆 战斗结算'
  }
  return phaseMap[combatStore.combatPhase] || '战斗中'
})

// 法宝召唤逻辑
function canSummon(fabao) {
  const currentAP = characterStore.character?.current_action_points || 0
  return !fabao.isDamaged && 
         !fabao.isSummoned && 
         currentAP >= (fabao.summonCost || 3)
}

async function handleSummon(fabao) {
  if (!canSummon(fabao)) {
    if (fabao.isDamaged) {
      alert('法宝已损毁，需要修复后才能召唤')
    } else if (fabao.isSummoned) {
      alert('法宝已经召唤了')
    } else {
      alert('行动点不足')
    }
    return
  }
  
  const result = await combatStore.summonFabao(fabao.id)
  if (!result.success) {
    alert(`召唤失败：${result.reason}`)
  }
}

// 格式化日志消息
function formatLog(log) {
  if (typeof log === 'string') return log
  return log.message || log
}

// 获取日志样式类
function getLogClass(log) {
  if (typeof log === 'object' && log.type) {
    return `log-${log.type}`
  }
  return 'log-info'
}

// 当前回合数（用于显示文本）
const turn = computed(() => combatStore.turn)

</script>

<template>
  <div class="combat-container" v-if="combatStore.enemy && characterStore.character">
    <!-- 战斗阶段横幅 -->
    <div class="phase-banner" :class="`phase-${combatStore.combatPhase}`">
      {{ phaseText }}
    </div>

    <div class="battle-arena">
      <!-- Enemy Area -->
      <div class="fighter-card enemy">
        <div class="model">{{ combatStore.enemy.model }}</div>
        <div class="info">
          <h3>{{ combatStore.enemy.name }} (Lv.{{ combatStore.enemy.level }})</h3>
          <div class="hp-bar-container">
            <div class="hp-bar" :style="{ width: (Math.max(0, combatStore.enemy.hp) / combatStore.enemy.max_hp * 100) + '%' }"></div>
          </div>
          <span class="hp-text">{{ Math.max(0, combatStore.enemy.hp) }} / {{ combatStore.enemy.max_hp }}</span>
        </div>
      </div>

      <div class="vs">VS</div>

      <!-- Player Area -->
      <div class="fighter-card player">
        <div class="info">
          <h3>{{ characterStore.character.name }} (Lv.{{ characterStore.character.level }})</h3>
          <div class="hp-bar-container">
            <div class="hp-bar player-hp" :style="{ width: (Math.max(0, characterStore.character.hp) / characterStore.character.max_hp * 100) + '%' }"></div>
          </div>
          <span class="hp-text">{{ Math.max(0, characterStore.character.hp) }} / {{ characterStore.character.max_hp }}</span>
        </div>
        <div class="model">{{ characterStore.character.gender === 'male' ? '⚔️' : '🔮' }}</div>
      </div>
    </div>

    <!-- 法宝战场 -->
    <div class="fabao-battlefield" v-if="combatStore.combatPhase !== 'player_summon'">
      <!-- 敌人法宝 -->
      <div class="enemy-fabaos">
        <h4>🔥 敌方法宝</h4>
        <div class="fabao-cards">
          <div v-for="fabao in combatStore.enemySummonedFabaos" 
               :key="fabao.id" 
               class="fabao-battle-card enemy"
               :class="{ 'dead': fabao.hp <= 0 }">
            <span class="fabao-icon">{{ fabao.icon }}</span>
            <span class="fabao-name">{{ fabao.name }}</span>
            <div class="mini-hp-bar">
              <div class="fill" :style="{ width: (Math.max(0, fabao.hp) / fabao.max_hp * 100) + '%' }"></div>
            </div>
            <span class="hp-label">{{ Math.max(0, fabao.hp) }}/{{ fabao.max_hp }}</span>
            <span v-if="fabao.hp <= 0" class="death-mark">💀</span>
          </div>
          <div v-if="combatStore.enemySummonedFabaos.length === 0" class="no-fabaos">
            暂无法宝
          </div>
        </div>
      </div>
      
      <!-- 玩家法宝 -->
      <div class="player-fabaos">
        <h4>⚔️ 我方法宝</h4>
        <div class="fabao-cards">
          <div v-for="fabao in combatStore.playerSummonedFabaos" 
               :key="fabao.id" 
               class="fabao-battle-card player"
               :class="{ 'dead': fabao.hp <= 0 }">
            <span class="fabao-icon">{{ fabao.icon }}</span>
            <span class="fabao-name">{{ fabao.name }}</span>
            <div class="mini-hp-bar">
              <div class="fill player" :style="{ width: (Math.max(0, fabao.hp) / fabao.max_hp * 100) + '%' }"></div>
            </div>
            <span class="hp-label">{{ Math.max(0, fabao.hp) }}/{{ fabao.max_hp }}</span>
            <span v-if="fabao.hp <= 0" class="death-mark">💀</span>
          </div>
          <div v-if="combatStore.playerSummonedFabaos.length === 0" class="no-fabaos">
            暂无法宝
          </div>
        </div>
      </div>
    </div>

    <div class="log-panel" ref="logsContainer">
      <p v-for="(log, index) in combatStore.logs" 
         :key="index"
         :class="getLogClass(log)">
        {{ formatLog(log) }}
      </p>
    </div>

    <!-- 法宝召唤面板 -->
    <div v-if="combatStore.combatPhase === 'player_summon'" class="summon-panel-overlay">
      <div class="summon-panel">
        <div class="summon-header">
          <h3>🔮 召唤法宝</h3>
          <div class="action-points">
            <span>行动点: </span>
            <span class="ap-value">{{ characterStore.character.current_action_points }} / {{ characterStore.character.max_action_points }}</span>
          </div>
        </div>
        
        <div class="fabao-list">
          <div 
            v-for="fabao in fabaoStore.dantianFabaos"
            :key="fabao.id"
            class="fabao-summon-card"
            :class="{ 
              'disabled': !canSummon(fabao),
              'summoned': fabao.isSummoned 
            }"
            @click="handleSummon(fabao)"
          >
            <div class="fabao-icon">{{ fabao.icon }}</div>
            <div class="fabao-info">
              <div class="fabao-name-row">
                <span class="fabao-name">{{ fabao.name }}</span>
                <span v-if="fabao.isDamaged" class="status-badge damaged">已损毁</span>
                <span v-else-if="fabao.isSummoned" class="status-badge summoned">已召唤</span>
              </div>
              <div class="fabao-stats">
                <span>HP: {{ fabao.hp }}/{{ fabao.max_hp }}</span>
                <span>ATK: {{ fabao.attack }}</span>
                <span>召唤: {{ fabao.summonCost || 3 }}点</span>
              </div>
            </div>
          </div>
          
          <div v-if="fabaoStore.dantianFabaos.length === 0" class="empty-state">
            暂无可召唤的法宝
          </div>
        </div>
        
        <button 
          @click="combatStore.playerConfirmSummon()" 
          class="btn-confirm-summon"
        >
          ✓ 确认召唤完成
        </button>
      </div>
    </div>

    <!-- 操作面板 - 包含战斗按钮和控制按钮 -->
    <div class="action-panel">
      <!-- 准备阶段 - 开始/继续战斗按钮 -->
      <template v-if="combatStore.combatPhase === 'prepare'">
        <button @click="combatStore.startBattle()" class="btn-action start-battle">
          ⚡ {{ turn > 1 ? '继续战斗' : '开始战斗' }}
        </button>
        <div class="phase-info-inline">
          <span>我方: {{ combatStore.playerSummonedFabaos.length }}</span>
          <span>敌方: {{ combatStore.enemySummonedFabaos.length }}</span>
        </div>
        <button 
          @click="combatStore.combatPhase = 'player_summon'" 
          class="btn-action summon"
        >
          🔮 召唤法宝
        </button>
        <button class="btn-action item" disabled>💊 物品</button>
        <button 
          class="btn-action escape" 
          @click="combatStore.escape()"
        >
          🏃 逃跑
        </button>
      </template>

      <!-- 战斗结算阶段 - 简洁的返回按钮 -->
      <template v-else-if="combatStore.combatPhase === 'settlement'">
        <button @click="combatStore.returnToMap()" class="btn-action return-map">
          🗺️ 返回地图
        </button>
        <div class="settlement-hint">
          查看上方战斗日志了解战斗详情
        </div>
      </template>

      <!-- 战斗进行中 - 普通操作按钮 -->
      <template v-else-if="combatStore.combatPhase !== 'player_summon'">
        <button class="btn-action attack" disabled>
          🗡️ 战斗中...
        </button>
        <button class="btn-action skill" disabled>✨ 技能</button>
        <button class="btn-action item" disabled>💊 物品</button>
        <button 
          class="btn-action escape" 
          @click="combatStore.escape()" 
          :disabled="combatStore.combatPhase === 'battle'"
        >
          🏃 逃跑
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.combat-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #2c0b0e;
  color: #fff;
  font-family: 'Inter', sans-serif;
}

/* 战斗阶段横幅 */
.phase-banner {
  padding: 1rem;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.battle-arena {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
}

@media (min-width: 1024px) {
  .battle-arena {
    flex-direction: row;
    gap: 4rem;
  }
}

.fighter-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 1.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  transition: transform 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.fighter-card.enemy {
  flex-direction: row;
  border-left: 5px solid #e74c3c;
}

.fighter-card.player {
  flex-direction: row-reverse;
  text-align: right;
  border-right: 5px solid #3498db;
}

.model {
  font-size: 3rem;
}

.info {
  flex: 1;
}

.hp-bar-container {
  height: 12px;
  background: #444;
  border-radius: 6px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.hp-bar {
  height: 100%;
  background: #e74c3c;
  transition: width 0.5s ease;
}

.hp-bar.player-hp {
  background: #2ecc71;
}

.hp-text {
  font-size: 0.9rem;
  color: #ccc;
}

.vs {
  font-weight: 900;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.2);
}

/* 法宝战场 */
.fabao-battlefield {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.enemy-fabaos h4, .player-fabaos h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #fff;
}

.fabao-cards {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  min-height: 80px;
}

.fabao-battle-card {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  min-width: 110px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.fabao-battle-card.enemy {
  border-color: rgba(231, 76, 60, 0.5);
}

.fabao-battle-card.player {
  border-color: rgba(52, 152, 219, 0.5);
}

.fabao-battle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.fabao-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.fabao-name {
  display: block;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #fff;
}

.mini-hp-bar {
  height: 4px;
  background: #444;
  border-radius: 2px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.mini-hp-bar .fill {
  height: 100%;
  background: #e74c3c;
  transition: width 0.3s ease;
}

.mini-hp-bar .fill.player {
  background: #2ecc71;
}

.hp-label {
  font-size: 0.75rem;
  color: #aaa;
}

/* 死亡法宝样式 */
.fabao-battle-card.dead {
  opacity: 0.5;
  filter: grayscale(100%);
}

.fabao-battle-card.dead .fabao-name {
  text-decoration: line-through;
  color: #aaa;
}

.death-mark {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 2rem;
  opacity: 0.8;
  pointer-events: none;
}

.no-fabaos {
  color: #666;
  font-style: italic;
  padding: 1rem;
}

.log-panel {
  height: 150px;
  background: rgba(0, 0, 0, 0.6);
  margin: 0 1rem;
  padding: 1rem;
  border-radius: 8px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: monospace;
  font-size: 0.9rem;
}

.log-panel p {
  margin-bottom: 0.5rem;
}

/* 日志类型颜色 */
.log-special { 
  color: #f1c40f; 
  font-weight: bold; 
}
.log-damage { 
  color: #e74c3c; 
}
.log-heal { 
  color: #2ecc71; 
}
.log-summon { 
  color: #3498db; 
}
.log-info { 
  color: #ddd; 
}

/* 召唤面板样式 */
.summon-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.summon-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 2rem;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(100, 255, 218, 0.3);
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.summon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.summon-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #64ffda;
}

.action-points {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #ccc;
}

.ap-value {
  font-weight: bold;
  font-size: 1.2rem;
  color: #64ffda;
}

.fabao-list {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 1.5rem;
}

.fabao-summon-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.fabao-summon-card:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
  border-color: rgba(100, 255, 218, 0.5);
}

.fabao-summon-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.fabao-summon-card.summoned {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
}

.fabao-summon-card .fabao-icon {
  font-size: 2.5rem;
  min-width: 60px;
  text-align: center;
}

.fabao-info {
  flex: 1;
}

.fabao-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.fabao-name-row .fabao-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: #fff;
  margin: 0;
}

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.status-badge.damaged {
  background: #e74c3c;
  color: #fff;
}

.status-badge.summoned {
  background: #4CAF50;
  color: #fff;
}

.fabao-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #aaa;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
  font-size: 1.1rem;
}

.btn-confirm-summon {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-confirm-summon:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.action-panel {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.3);
}

@media (min-width: 1024px) {
  .action-panel {
    grid-template-columns: repeat(4, 1fr);
    padding: 2rem 4rem;
  }
}

.btn-action {
  padding: 1rem;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.attack { background: #e74c3c; }
.attack:hover:not(:disabled) { background: #c0392b; }

.summon { background: #9b59b6; }
.summon:hover:not(:disabled) { background: #8e44ad; }

.skill { background: #3498db; }
.item { background: #f1c40f; color: #333; }

.escape { background: #95a5a6; }
.escape:hover:not(:disabled) { background: #7f8c8d; }

/* 准备阶段内联信息 */
.phase-info-inline {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  background: rgba(100, 255, 218, 0.15);
  border-radius: 8px;
  font-size: 0.9rem;
}

.phase-info-inline span {
  color: #64ffda;
  font-weight: bold;
}

/* 结算提示 */
.settlement-hint {
  grid-column: span 3;
  text-align: center;
  padding: 1rem;
  color: #aaa;
  font-size: 0.9rem;
  font-style: italic;
}

/* 特殊按钮样式 */
.btn-action.start-battle {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  font-size: 1.2rem;
  font-weight: bold;
}

.btn-action.start-battle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(245, 87, 108, 0.5);
}

.btn-action.return-map {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  font-size: 1.2rem;
  font-weight: bold;
}

.btn-action.return-map:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 242, 254, 0.5);
}

</style>
