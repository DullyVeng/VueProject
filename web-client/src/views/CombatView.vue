
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
      // 再次检查元素是否存在（防止在异步执行时元素已被移除）
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
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

// 一键召唤所有可召唤的法宝
async function handleAutoSummon() {
  const result = await combatStore.autoSummonAll()
  
  if (result.success) {
    // 成功召唤，直接确认完成并进入准备阶段
    combatStore.playerConfirmSummon()
  } else {
    // 召唤失败，显示原因
    alert(result.reason || '召唤失败')
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

// 计算技能伤害/效果（考虑等级加成）
function calculateSkillDamage(baseValue, skillLevel) {
  if (!baseValue) return 0
  const multiplier = 1 + (skillLevel * 0.1)  // 每级+10%
  return Math.floor(baseValue * multiplier)
}

// 获取技能详细提示
function getSkillTooltip(spell, skillLevel) {
  let tooltip = `${spell.name}\n\n${spell.description}\n\n`
  tooltip += `MP消耗: ${spell.mpCost}\n`
  
  if (spell.baseDamage) {
    const damage = calculateSkillDamage(spell.baseDamage, skillLevel)
    tooltip += `伤害: ${damage}`
    if (skillLevel > 0) {
      tooltip += ` (基础${spell.baseDamage} +${skillLevel}级加成)`
    }
    tooltip += '\n'
  }
  
  if (spell.effects?.heal) {
    const heal = calculateSkillDamage(spell.effects.heal, skillLevel)
    tooltip += `治疗: ${heal}`
    if (skillLevel > 0) {
      tooltip += ` (基础${spell.effects.heal} +${skillLevel}级加成)`
    }
    tooltip += '\n'
  }
  
  if (spell.effects?.defenseBonus) {
    const defenseBonus = calculateSkillDamage(spell.effects.defenseBonus, skillLevel)
    tooltip += `防御加成: +${defenseBonus}`
    if (skillLevel > 0) {
      tooltip += ` (基础${spell.effects.defenseBonus} +${skillLevel}级加成)`
    }
    if (spell.effects?.duration) {
      tooltip += ` (持续${spell.effects.duration}回合)`
    }
    tooltip += '\n'
  }
  
  return tooltip.trim()
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
            <span class="fabao-name">
              {{ fabao.name }}
              <span v-if="fabao.nourish_level > 0" class="nourish-indicator" :title="'温养等级 Lv.' + fabao.nourish_level">🌟{{ fabao.nourish_level }}</span>
            </span>
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
            <span class="fabao-name">
              {{ fabao.name }}
              <span v-if="fabao.enhance_level > 0" class="enhance-level-badge">+{{ fabao.enhance_level }}</span>
              <span v-if="fabao.nourish_level > 0" class="nourish-indicator player" :title="'温养等级 Lv.' + fabao.nourish_level">🌟{{ fabao.nourish_level }}</span>
            </span>
           
            <!-- HP条 -->
            <div class="mini-hp-bar">
              <div class="fill player" :style="{ width: (Math.max(0, fabao.hp) / fabao.max_hp * 100) + '%' }"></div>
            </div>
            <span class="hp-label">❤️ {{ Math.max(0, fabao.hp) }}/{{ fabao.max_hp }}</span>
            
            <!-- MP条 -->
            <div class="mini-mp-bar">
              <div class="fill" :style="{ width: ((fabao.mp || 0) / (fabao.max_mp || 100) * 100) + '%' }"></div>
            </div>
            <span class="mp-label">💙 {{ fabao.mp || 0 }}/{{ fabao.max_mp || 100 }}</span>
            
            <!-- 技能列表（如果有多个技能） -->
            <div v-if="fabao.spells && fabao.spells.length > 1 && combatStore.combatPhase === 'prepare'" class="skill-selector">
              <div class="skill-selector-label">选择技能：</div>
              <div class="skill-buttons">
                <button 
                  v-for="spell in fabao.spells" 
                  :key="spell.id"
                  class="skill-select-btn"
                  :class="{ 
                    'selected': combatStore.selectedSkills[fabao.id] === spell.id,
                    'last-used': combatStore.lastUsedSkills[fabao.id] === spell.id
                  }"
                  @click="combatStore.selectFabaoSkill(fabao.id, spell.id)"
                  :title="getSkillTooltip(spell, fabao.enhance_level || 0)"
                >
                  <span class="skill-btn-icon">{{ spell.icon }}</span>
                  <div class="skill-btn-details">
                    <span class="skill-btn-name">{{ spell.name }}</span>
                    <span class="skill-btn-desc">{{ spell.description }}</span>
                    <div class="skill-btn-stats">
                      <span class="skill-stat-mini mp">{{ spell.mpCost }}MP</span>
                      <span v-if="spell.baseDamage" class="skill-stat-mini dmg">伤害{{ calculateSkillDamage(spell.baseDamage, fabao.enhance_level || 0) }}</span>
                      <span v-if="spell.effects?.heal" class="skill-stat-mini heal">治疗{{ calculateSkillDamage(spell.effects.heal, fabao.enhance_level || 0) }}</span>
                      <span v-if="spell.effects?.defenseBonus" class="skill-stat-mini def">防御+{{ calculateSkillDamage(spell.effects.defenseBonus, fabao.enhance_level || 0) }}</span>
                    </div>
                  </div>
                  <span class="skill-btn-cost">{{ spell.mpCost }}MP</span>
                </button>
              </div>
            </div>
            
            <!-- 当前技能信息 -->
            <div v-else-if="fabao.spells && fabao.spells.length === 1" class="skill-info">
              <span class="skill-icon">{{ fabao.spells[0].icon }}</span>
              <div class="skill-text-info">
                <span class="skill-name">{{ fabao.spells[0].name }}</span>
                <span class="skill-description-mini">{{ fabao.spells[0].description }}</span>
              </div>
              <span class="skill-level" v-if="fabao.enhance_level > 0">Lv.{{ fabao.enhance_level }}</span>
            </div>
            <!-- 兼容旧的spell格式 -->
            <div v-else-if="fabao.spell" class="skill-info">
              <span class="skill-icon">{{ fabao.spell.icon }}</span>
              <span class="skill-name">{{ fabao.spell.name }}</span>
              <span class="skill-level" v-if="fabao.enhance_level > 0">Lv.{{ fabao.enhance_level }}</span>
            </div>
            
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
                <span v-if="fabao.enhance_level > 0" class="enhance-badge-combat" :title="'强化等级 +' + fabao.enhance_level">
                  +{{ fabao.enhance_level }}
                </span>
                <span v-if="fabao.isDamaged" class="status-badge damaged">已损毁</span>
                <span v-else-if="fabao.isSummoned" class="status-badge summoned">已召唤</span>
              </div>
              <div class="fabao-stats">
                <span>HP: {{ fabao.hp }}/{{ fabao.max_hp }}</span>
                <span>ATK: {{ fabao.attack }}</span>
                <span>召唤: {{ fabao.summonCost || 3 }}点</span>
              </div>
              <!-- 温养加成显示 -->
              <div v-if="fabao.nourish_level > 0" class="nourish-bonus-combat">
                <span class="nourish-level">🌟 温养 Lv.{{ fabao.nourish_level }}</span>
                <span class="bonus-item">⚔️+{{ Math.floor((fabao.base_attack || fabao.attack) * (fabao.nourish_level * 0.02)) }}</span>
                <span class="bonus-item">🛡️+{{ Math.floor((fabao.base_defense || fabao.defense) * (fabao.nourish_level * 0.02)) }}</span>
                <span class="bonus-item">❤️+{{ Math.floor((fabao.base_max_hp || fabao.max_hp) * (fabao.nourish_level * 0.02)) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="fabaoStore.dantianFabaos.length === 0" class="empty-state">
            暂无可召唤的法宝
          </div>
        </div>
        
        <div class="summon-actions">
          <button 
            @click="handleAutoSummon" 
            class="btn-auto-summon"
            :disabled="fabaoStore.dantianFabaos.filter(f => !f.isDamaged && !f.isSummoned).length === 0"
            title="根据行动点自动召唤所有可召唤的法宝"
          >
            ⚡ 一键召唤
          </button>
          <button 
            @click="combatStore.playerConfirmSummon()" 
            class="btn-confirm-summon"
          >
            ✓ 确认召唤完成
          </button>
        </div>
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
        
        <!-- 掉落法宝展示 -->
        <div v-if="combatStore.settlementInfo?.dropFabaos?.length > 0" class="drop-rewards">
          <h4>✨ 获得法宝:</h4>
          <div class="drop-list">
            <div v-for="fabao in combatStore.settlementInfo.dropFabaos" :key="fabao.id" class="drop-item">
               <span class="drop-icon">{{ fabao.icon }}</span>
               <span class="drop-name">{{ fabao.name }}</span>
            </div>
          </div>
        </div>

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
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 1024px) {
  .battle-arena {
    flex-direction: row;
    gap: 4rem;
    padding: 2rem;
  }
}

.fighter-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  transition: transform 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 600px) {
  .fighter-card {
    gap: 0.5rem;
    padding: 0.75rem;
  }
  .model {
    font-size: 2rem;
  }
  .info h3 {
    font-size: 1rem;
    margin: 0;
  }
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
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.2);
}

/* 法宝战场 */
.fabao-battlefield {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 768px) {
  .fabao-battlefield {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

.enemy-fabaos h4, .player-fabaos h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #64ffda;
  border-bottom: 1px solid rgba(100, 255, 218, 0.2);
  padding-bottom: 0.3rem;
}

.fabao-cards {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-height: 60px;
}

.fabao-battle-card {
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  min-width: 100px;
  flex: 1;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
  position: relative;
}

@media (max-width: 600px) {
  .fabao-battle-card {
    min-width: calc(50% - 0.5rem);
  }
}

.fabao-battle-card.enemy {
  border-color: rgba(231, 76, 60, 0.3);
}

.fabao-battle-card.player {
  border-color: rgba(52, 152, 219, 0.3);
}

.fabao-battle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.fabao-icon {
  font-size: 1.8rem;
  display: block;
  margin-bottom: 0.4rem;
}

.fabao-name {
  display: block;
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 0.4rem;
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

/* MP条样式 */
.mini-mp-bar {
  height: 4px;
  background: #444;
  border-radius: 2px;
  margin: 0.5rem 0 0.25rem 0;
  overflow: hidden;
}

.mini-mp-bar .fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.mp-label {
  font-size: 0.75rem;
  color: #aaa;
  display: block;
  margin-bottom: 0.5rem;
}

/* 技能信息样式 */
.skill-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.5rem;
  padding: 0.3rem;
  background: rgba(52, 152, 219, 0.15);
  border-radius: 4px;
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.skill-text-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.skill-description-mini {
  font-size: 0.7rem;
  color: #999;
  line-height: 1.3;
}

.skill-icon {
  font-size: 1rem;
}

.skill-name {
  font-size: 0.75rem;
  color: #64ffda;
  font-weight: bold;
  flex: 1;
}

.skill-level {
  font-size: 0.7rem;
  color: #f39c12;
  background: rgba(243, 156, 18, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

/* 强化等级徽章 */
.enhance-level-badge {
  display: inline-block;
  font-size: 0.7rem;
  color: #f39c12;
  background: rgba(243, 156, 18, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  margin-left: 0.3rem;
  font-weight: bold;
}

/* 技能选择器 */
.skill-selector {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(100, 255, 218, 0.08);
  border-radius: 6px;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.skill-selector-label {
  font-size: 0.7rem;
  color: #64ffda;
  margin-bottom: 0.4rem;
  font-weight: bold;
}

.skill-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.skill-select-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(100, 255, 218, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  font-size: 0.75rem;
}

.skill-select-btn:hover {
  background: rgba(100, 255, 218, 0.15);
  border-color: rgba(100, 255, 218, 0.6);
  transform: translateX(3px);
}

.skill-select-btn.selected {
  background: rgba(100, 255, 218, 0.25);
  border-color: #64ffda;
  box-shadow: 0 0 8px rgba(100, 255, 218, 0.4);
}

.skill-select-btn.last-used {
  border-style: dashed;
}

.skill-btn-icon {
  font-size: 1.5rem;
  min-width: 30px;
  text-align: center;
}

.skill-btn-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
}

.skill-btn-name {
  font-weight: bold;
  color: #64ffda;
  font-size: 0.85rem;
}

.skill-btn-desc {
  font-size: 0.7rem;
  color: #999;
  line-height: 1.3;
}

.skill-btn-stats {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.skill-stat-mini {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-weight: 500;
}

.skill-stat-mini.mp {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.skill-stat-mini.dmg {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.skill-stat-mini.heal {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.skill-stat-mini.def {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.skill-btn-cost {
  font-size: 0.7rem;
  color: #3498db;
  background: rgba(52, 152, 219, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  align-self: flex-start;
  display: none; /* 隐藏右侧的MP消耗，已在详情中显示 */
}

.no-fabaos {
  color: #666;
  font-style: italic;
  padding: 1rem;
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

.log-panel {
  height: 120px;
  background: rgba(0, 0, 0, 0.6);
  margin: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: monospace;
  font-size: 0.85rem;
}

@media (max-width: 600px) {
  .log-panel {
    height: 100px;
    font-size: 0.8rem;
  }
}

.log-panel p {
  margin-bottom: 0.4rem;
}

/* ... existing log colors ... */

/* 召唤面板样式 */
.summon-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 0.5rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.summon-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 1rem;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(100, 255, 218, 0.3);
  animation: scaleIn 0.2s ease-out;
}

@media (max-width: 600px) {
  .summon-panel {
    padding: 0.75rem;
  }
  .summon-header h3 {
    font-size: 1.1rem;
  }
  .fabao-summon-card .fabao-icon {
    font-size: 2rem;
    min-width: 45px;
  }
  .fabao-stats {
    font-size: 0.8rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
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
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.summon-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #64ffda;
}

.action-points {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #ccc;
}

.ap-value {
  font-weight: bold;
  font-size: 1.1rem;
  color: #64ffda;
}

.fabao-list {
  max-height: 50vh;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 1rem;
}

.fabao-summon-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
}

.fabao-summon-card:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(100, 255, 218, 0.3);
}

.fabao-summon-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.fabao-summon-card.summoned {
  background: rgba(76, 175, 80, 0.15);
  border-color: #4CAF50;
}

.fabao-summon-card .fabao-icon {
  font-size: 2rem;
  min-width: 50px;
  text-align: center;
}

.fabao-info {
  flex: 1;
}

.fabao-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.fabao-name-row .fabao-name {
  font-weight: bold;
  font-size: 1rem;
  color: #fff;
  margin: 0;
}

.status-badge {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
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
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #aaa;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
  font-size: 1rem;
}

.btn-confirm-summon {
  width: 100%;
  padding: 0.85rem;
  font-size: 1rem;
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

/* 召唤按钮组 */
.summon-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

/* 一键召唤按钮 */
.btn-auto-summon {
  flex: 1;
  padding: 0.85rem;
  font-size: 1rem;
  font-weight: bold;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-auto-summon:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(240, 147, 251, 0.4);
}

.btn-auto-summon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #999 0%, #666 100%);
}

/* 调整确认按钮在组内的样式 */
.summon-actions .btn-confirm-summon {
  flex: 1;
}


.action-panel {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
}

@media (min-width: 1024px) {
  .action-panel {
    grid-template-columns: repeat(4, 1fr);
    padding: 1.5rem 4rem;
  }
}

.btn-action {
  padding: 0.85rem;
  font-size: 0.95rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
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

/* 温养等级指示器（战场卡片） */
.nourish-indicator {
  display: inline-block;
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  border-radius: 4px;
  margin-left: 0.3rem;
  font-weight: bold;
  vertical-align: middle;
}

.nourish-indicator.player {
  background: linear-gradient(135deg, #64ffda, #4facfe);
  color: #fff;
}

/* 温养加成显示（召唤面板） */
.nourish-bonus-combat {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.nourish-bonus-combat .nourish-level {
  color: #ffd700;
  font-weight: bold;
  margin-right: 0.3rem;
}

.nourish-bonus-combat .bonus-item {
  color: #64ffda;
  font-weight: 500;
}

/* 强化等级徽章（战斗场景） */
.enhance-badge-combat {
  display: inline-block;
  padding: 2px 5px;
  margin-left: 6px;
  margin-right: 6px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 3px;
  vertical-align: middle;
  box-shadow: 0 1px 3px rgba(238, 90, 82, 0.4);
}

/* 掉落法宝展示样式 */
.drop-rewards {
  margin-top: 1rem;
  background: rgba(155, 89, 182, 0.2);
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(155, 89, 182, 0.4);
  animation: fadeIn 0.5s;
}

.drop-rewards h4 {
  margin: 0 0 0.5rem 0;
  color: #dbb3ff;
  font-size: 0.9rem;
}

.drop-list {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  justify-content: center;
}

.drop-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.drop-icon {
  font-size: 1.5rem;
}

.drop-name {
  font-size: 0.8rem;
  color: #e0dbe9;
  font-weight: bold;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

</style>
