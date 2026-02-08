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
  await fabaoStore.fetchFabaos()
  if (combatStore.isInCombat) {
    const summonedFabaos = fabaoStore.fabaos.filter(f => f.isSummoned && !f.isDamaged)
    combatStore.playerSummonedFabaos.splice(0, combatStore.playerSummonedFabaos.length, ...summonedFabaos)
  }
  if (!combatStore.isInCombat) {
    router.push('/map')
  }
})

watchEffect(() => {
  if (combatStore.logs.length && logsContainer.value) {
    setTimeout(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    }, 100)
  }
})

const phaseText = computed(() => {
  const phaseMap = {
    'enemy_summon': '🔥 敌人召唤',
    'player_summon': '⚔️ 召唤法宝',
    'prepare': '🛡️ 准备中',
    'battle': '⚡ 战斗中',
    'settlement': '🏆 结算'
  }
  return phaseMap[combatStore.combatPhase] || '战斗中'
})

function canSummon(fabao) {
  const currentAP = characterStore.character?.current_action_points || 0
  return !fabao.isDamaged && !fabao.isSummoned && currentAP >= (fabao.summonCost || 3)
}

async function handleSummon(fabao) {
  if (!canSummon(fabao)) return
  await combatStore.summonFabao(fabao.id)
}

async function handleAutoSummon() {
  const result = await combatStore.autoSummonAll()
  if (result.success) combatStore.playerConfirmSummon()
}

function formatLog(log) {
  return typeof log === 'string' ? log : log.message || log
}

function getLogClass(log) {
  return typeof log === 'object' && log.type ? `log-${log.type}` : 'log-info'
}

function calculateSkillDamage(baseValue, skillLevel) {
  if (!baseValue) return 0
  return Math.floor(baseValue * (1 + (skillLevel * 0.1)))
}

const turn = computed(() => combatStore.turn)

// 详情展开逻辑

const expandedId = ref(null)

const toggleExpand = (id) => {

  expandedId.value = expandedId.value === id ? null : id

}



// 获取当前选中的战场法宝对象

const selectedBattleFabao = computed(() => {

  if (!expandedId.value || !expandedId.value.startsWith('battle-')) return null

  const id = expandedId.value.replace('battle-', '')

  return combatStore.playerSummonedFabaos.find(f => f.id === id)

})



</script>



<template>
  <div class="combat-container" v-if="combatStore.enemy && characterStore.character">
    <div class="phase-banner" :class="`phase-${combatStore.combatPhase}`">
      {{ phaseText }} (第 {{ turn }} 回合)
    </div>

    <div class="battle-arena">
      <div class="fighter-card enemy">
        <div class="model">{{ combatStore.enemy.model }}</div>
        <div class="info">
          <h3>{{ combatStore.enemy.name }}</h3>
          <div class="hp-bar-container">
            <div class="hp-bar" :style="{ width: (Math.max(0, combatStore.enemy.hp) / combatStore.enemy.max_hp * 100) + '%' }"></div>
          </div>
          <span class="hp-text">{{ Math.max(0, combatStore.enemy.hp) }} / {{ combatStore.enemy.max_hp }}</span>
        </div>
      </div>

      <div class="vs">VS</div>

      <div class="fighter-card player">
        <div class="info">
          <h3>{{ characterStore.character.name }}</h3>
          <div class="hp-bar-container">
            <div class="hp-bar player-hp" :style="{ width: (Math.max(0, characterStore.character.hp) / characterStore.character.max_hp * 100) + '%' }"></div>
          </div>
          <span class="hp-text">{{ Math.max(0, characterStore.character.hp) }} / {{ characterStore.character.max_hp }}</span>
        </div>
        <div class="model">{{ characterStore.character.gender === 'male' ? '⚔️' : '🔮' }}</div>
      </div>
    </div>

    <div class="fabao-battlefield" v-if="combatStore.combatPhase !== 'player_summon'">
      <!-- 敌人法宝区 (占据左侧 3/7) -->
      <div class="lane enemy-lane">
        <div v-for="fabao in combatStore.enemySummonedFabaos" :key="fabao.id" class="fabao-battle-card enemy" :class="{ 'dead': fabao.hp <= 0 }">
          <span class="f-icon">{{ fabao.icon }}</span>
          <div class="f-hp-mini"><div class="fill" :style="{ width: (Math.max(0, fabao.hp) / fabao.max_hp * 100) + '%' }"></div></div>
        </div>
        <!-- 填充空位以保持 3 列结构（可选，CSS Grid 已处理） -->
      </div>
      
      <!-- 中间间隔 -->
      <div class="lane-divider">VS</div>

      <!-- 玩家法宝区 (占据右侧 3/7) -->
      <div class="lane player-lane">
        <div v-for="fabao in combatStore.playerSummonedFabaos" :key="fabao.id" 
             class="fabao-battle-card player" 
             :class="{ 'dead': fabao.hp <= 0, 'expanded': expandedId === `battle-${fabao.id}` }"
             @click="toggleExpand(`battle-${fabao.id}`)">
          <span class="f-icon">{{ fabao.icon }}</span>
          <div class="f-hp-mini"><div class="fill p" :style="{ width: (Math.max(0, fabao.hp) / fabao.max_hp * 100) + '%' }"></div></div>
        </div>
      </div>
    </div>

    <!-- 全局法宝详情弹窗 -->
    <div v-if="selectedBattleFabao" class="detail-modal-overlay" @click="expandedId = null">
      <div class="detail-modal-card" @click.stop>
        <div class="modal-header">
          <span class="modal-icon">{{ selectedBattleFabao.icon }}</span>
          <div class="modal-title">
            <h4>{{ selectedBattleFabao.name }}</h4>
            <div class="modal-stats">❤️{{ selectedBattleFabao.hp }}/{{ selectedBattleFabao.max_hp }}  ⚔️{{ selectedBattleFabao.attack }}</div>
          </div>
          <button class="modal-close" @click="expandedId = null">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">{{ selectedBattleFabao.description || '法宝描述加载中...' }}</p>
          
          <div v-if="selectedBattleFabao.spells && combatStore.combatPhase === 'prepare'" class="modal-skills">
            <p class="skill-label">选择出战技能：</p>
            <button 
              v-for="s in selectedBattleFabao.spells" 
              :key="s.id" 
              class="modal-skill-btn"
              :class="{ 'is-selected': combatStore.selectedSkills[selectedBattleFabao.id] === s.id }"
              @click="combatStore.selectFabaoSkill(selectedBattleFabao.id, s.id)"
            >
              <span class="s-icon">{{ s.icon }}</span>
              <div class="s-info">
                <div class="s-name">{{ s.name }} <span class="s-cost">({{ s.mpCost }}MP)</span></div>
                <div class="s-desc">{{ s.description }}</div>
              </div>
              <div class="s-check">{{ combatStore.selectedSkills[selectedBattleFabao.id] === s.id ? '●' : '○' }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="log-panel" ref="logsContainer">
      <p v-for="(log, index) in combatStore.logs" :key="index" :class="getLogClass(log)">{{ formatLog(log) }}</p>
    </div>

    <div v-if="combatStore.combatPhase === 'player_summon'" class="summon-panel-overlay">
      <div class="summon-panel">
        <div class="summon-header">
          <h3>🔮 召唤法宝 (AP: {{ characterStore.character.current_action_points }})</h3>
        </div>
        <div class="fabao-list">
          <div v-for="fabao in fabaoStore.dantianFabaos" :key="fabao.id" 
               class="summon-mini-card" 
               :class="{ summoned: fabao.isSummoned, disabled: !canSummon(fabao), exp: expandedId === `s-${fabao.id}` }"
               @click="toggleExpand(`s-${fabao.id}`)">
            <div class="s-card-top">
              <span class="s-icon">{{ fabao.icon }}</span>
              <div class="s-main">
                <span class="s-name">{{ fabao.name }}</span>
                <div class="s-vals">❤️{{ fabao.hp }} ⚔️{{ fabao.attack }} ⚡{{ fabao.summonCost || 3 }}</div>
              </div>
              <button class="s-btn" :disabled="!canSummon(fabao)" @click.stop="handleSummon(fabao)">
                {{ fabao.isSummoned ? '✔' : '召唤' }}
              </button>
            </div>
            <div v-if="expandedId === `s-${fabao.id}`" class="s-card-bot">
              {{ fabao.description || '暂无说明' }}
            </div>
          </div>
        </div>
        <div class="summon-actions">
          <button @click="handleAutoSummon" class="btn-a auto">⚡ 一键召唤</button>
          <button @click="combatStore.playerConfirmSummon()" class="btn-a conf">✓ 完成</button>
        </div>
      </div>
    </div>

    <div class="action-panel">
      <template v-if="combatStore.combatPhase === 'prepare'">
        <button @click="combatStore.startBattle()" class="btn-action start">⚡ 开始战斗</button>
        <button @click="combatStore.combatPhase = 'player_summon'" class="btn-action summ">🔮 召唤</button>
        <button @click="combatStore.escape()" class="btn-action esc">🏃 逃跑</button>
      </template>
      <template v-else-if="combatStore.combatPhase === 'settlement'">
        <button @click="combatStore.returnToMap()" class="btn-action start">🗺️ 返回地图</button>
      </template>
      <template v-else>
        <button class="btn-action" disabled>🗡️ 战斗中...</button>
        <button @click="combatStore.escape()" class="btn-action esc" :disabled="combatStore.combatPhase === 'battle'">🏃 逃跑</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.combat-container {
  height: 100vh; height: 100dvh;
  display: flex; flex-direction: column;
  background: #1a0505; color: #fff; overflow: hidden;
}
.phase-banner {
  padding: 6px; text-align: center; font-size: 0.8rem; font-weight: bold;
  background: linear-gradient(90deg, #4a11cb, #2575fc); flex-shrink: 0;
}
.battle-arena {
  padding: 8px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
}
.fighter-card {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  background: rgba(0,0,0,0.3); padding: 6px; border-radius: 8px; gap: 2px;
  border: 1px solid rgba(255,255,255,0.1);
}
.fighter-card.enemy { border-left: 3px solid #e74c3c; }
.fighter-card.player { border-right: 3px solid #3498db; }
.model { font-size: 1.5rem; }
.info h3 { font-size: 0.75rem; margin: 0; }
.hp-bar-container { width: 100%; height: 6px; background: #333; border-radius: 3px; overflow: hidden; }
.hp-bar { height: 100%; background: #e74c3c; transition: width 0.3s; }
.player-hp { background: #2ecc71; }
.hp-text { font-size: 0.6rem; color: #ccc; }
.vs { font-size: 0.8rem; font-weight: 900; opacity: 0.3; padding: 0 4px; }

.fabao-battlefield {
  flex: 1; display: flex; align-items: flex-start; gap: 0; padding: 10px 5px;
  background: rgba(0,0,0,0.2); overflow-y: auto; min-height: 0;
}
.lane {
  flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
}
.enemy-lane { justify-items: flex-start; }
.player-lane { justify-items: flex-end; }

.lane-divider {
  width: 30px; display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; color: rgba(255,255,255,0.2); font-weight: 900;
  flex-shrink: 0;
}

.fabao-battle-card {
  width: 42px; height: 42px; background: rgba(255,255,255,0.05);
  border-radius: 6px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; border: 1px solid rgba(255,255,255,0.1); position: relative;
}
.fabao-battle-card.player { border-color: rgba(52,152,219,0.4); }
.f-icon { font-size: 1.2rem; }
.f-hp-mini { width: 80%; height: 3px; background: #333; margin-top: 2px; }
.fill { height: 100%; background: #e74c3c; }
.fill.p { background: #2ecc71; }
.dead { opacity: 0.3; filter: grayscale(1); }

/* 全局法宝详情弹窗样式 */
.detail-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 500; padding: 20px; backdrop-filter: blur(4px);
}
.detail-modal-card {
  background: #1c2128; border: 1px solid #64ffda; border-radius: 12px;
  width: 100%; max-width: 320px; overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}
.modal-header {
  padding: 12px; display: flex; align-items: center; gap: 12px;
  background: rgba(100,255,218,0.05); border-bottom: 1px solid rgba(255,255,255,0.1);
}
.modal-icon { font-size: 2rem; }
.modal-title { flex: 1; }
.modal-title h4 { margin: 0; font-size: 1rem; color: #64ffda; }
.modal-stats { font-size: 0.7rem; color: #aaa; margin-top: 2px; }
.modal-close {
  background: none; border: none; color: #666; font-size: 1.5rem; cursor: pointer;
}
.modal-body { padding: 12px; }
.modal-desc {
  font-size: 0.75rem; color: #ccc; line-height: 1.4; margin: 0 0 12px 0;
}
.skill-label { font-size: 0.7rem; color: #64ffda; font-weight: bold; margin-bottom: 8px; }
.modal-skills { display: flex; flex-direction: column; gap: 8px; }
.modal-skill-btn {
  display: flex; align-items: center; gap: 8px; padding: 8px;
  background: rgba(255,255,255,0.03); border: 1px solid #333;
  border-radius: 8px; color: #fff; text-align: left; transition: all 0.2s;
}
.modal-skill-btn.is-selected {
  border-color: #64ffda; background: rgba(100,255,218,0.1);
}
.modal-skill-btn .s-icon { font-size: 1.2rem; }
.modal-skill-btn .s-info { flex: 1; }
.modal-skill-btn .s-name { font-size: 0.8rem; font-weight: bold; }
.modal-skill-btn .s-cost { color: #339af0; font-size: 0.7rem; font-weight: normal; }
.modal-skill-btn .s-desc { font-size: 0.65rem; color: #888; }
.modal-skill-btn .s-check { color: #64ffda; font-size: 0.8rem; }

.log-panel {
  height: 70px; flex-shrink: 0; background: rgba(0,0,0,0.5);
  margin: 4px; padding: 6px; border-radius: 4px; overflow-y: auto;
  font-family: monospace; font-size: 0.7rem; border: 1px solid rgba(255,255,255,0.05);
}
.log-panel p { margin-bottom: 2px; }
.log-damage { color: #ff6b6b; }
.log-heal { color: #51cf66; }
.log-summon { color: #339af0; }

.summon-panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 10px;
}
.summon-panel {
  background: #161b22; border: 1px solid #30363d; border-radius: 12px;
  width: 100%; max-width: 400px; max-height: 80vh; display: flex; flex-direction: column;
}
.summon-header { padding: 12px; border-bottom: 1px solid #30363d; }
.summon-header h3 { margin: 0; font-size: 1rem; color: #64ffda; }
.fabao-list { flex: 1; overflow-y: auto; padding: 10px; }
.summon-mini-card {
  background: #0d1117; border: 1px solid #30363d; border-radius: 8px;
  margin-bottom: 6px; overflow: hidden;
}
.s-card-top { display: flex; align-items: center; padding: 8px; gap: 10px; }
.s-icon { font-size: 1.5rem; }
.s-main { flex: 1; display: flex; flex-direction: column; }
.s-name { font-size: 0.85rem; font-weight: bold; }
.s-vals { font-size: 0.7rem; color: #8b949e; }
.s-btn {
  padding: 6px 12px; background: #238636; border: none; border-radius: 6px;
  color: #fff; font-size: 0.75rem; font-weight: bold;
}
.s-btn:disabled { background: #21262d; color: #484f58; }
.summoned { border-color: #238636; background: rgba(35,134,54,0.05); }
.s-card-bot { padding: 8px; font-size: 0.7rem; color: #8b949e; background: rgba(0,0,0,0.2); border-top: 1px solid #30363d; }

.summon-actions { padding: 12px; display: flex; gap: 8px; }
.btn-a { flex: 1; padding: 10px; border-radius: 6px; border: none; font-weight: bold; font-size: 0.85rem; }
.auto { background: #8957e5; color: #fff; }
.conf { background: #238636; color: #fff; }

.action-panel {
  padding: 8px; display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 8px; background: #0d1117; flex-shrink: 0;
}
.btn-action {
  padding: 10px; border-radius: 6px; border: none; font-weight: bold;
  font-size: 0.85rem; color: #fff; background: #30363d;
}
.start { background: linear-gradient(135deg, #f093fb, #f5576c); grid-column: span 2; }
.summ { background: #8957e5; }
.esc { background: #484f58; }
</style>