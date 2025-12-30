
<script setup>
import { useCombatStore } from '../stores/combat'
import { useCharacterStore } from '../stores/character'
import { useRouter } from 'vue-router'
import { onMounted, ref, watchEffect } from 'vue'

const combatStore = useCombatStore()
const characterStore = useCharacterStore()
const router = useRouter()
const logsContainer = ref(null)

onMounted(() => {
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

</script>

<template>
  <div class="combat-container" v-if="combatStore.monster && characterStore.character">
    <div class="battle-arena">
      <!-- Enemy Area -->
      <div class="fighter-card enemy" :class="{ 'attacking': !combatStore.isPlayerTurn }">
        <div class="model">{{ combatStore.monster.model }}</div>
        <div class="info">
          <h3>{{ combatStore.monster.name }} (Lv.{{ combatStore.monster.level }})</h3>
          <div class="hp-bar-container">
            <div class="hp-bar" :style="{ width: (combatStore.monster.hp / combatStore.monster.max_hp * 100) + '%' }"></div>
          </div>
          <span class="hp-text">{{ combatStore.monster.hp }} / {{ combatStore.monster.max_hp }}</span>
        </div>
      </div>

      <div class="vs">VS</div>

      <!-- Player Area -->
      <div class="fighter-card player" :class="{ 'attacking': combatStore.isPlayerTurn }">
        <div class="info">
          <h3>{{ characterStore.character.name }} (Lv.{{ characterStore.character.level }})</h3>
          <div class="hp-bar-container">
            <div class="hp-bar player-hp" :style="{ width: (characterStore.character.hp / characterStore.character.max_hp * 100) + '%' }"></div>
          </div>
          <span class="hp-text">{{ characterStore.character.hp }} / {{ characterStore.character.max_hp }}</span>
        </div>
        <div class="model">{{ characterStore.character.gender === 'male' ? '⚔️' : '🔮' }}</div>
      </div>
    </div>

    <div class="log-panel" ref="logsContainer">
      <p v-for="(log, index) in combatStore.logs" :key="index">{{ log }}</p>
    </div>

    <div class="action-panel">
      <button 
        class="btn-action attack" 
        @click="combatStore.playerAttack()" 
        :disabled="!combatStore.isPlayerTurn"
      >
        🗡️ 攻击 (Attack)
      </button>
      <button class="btn-action skill" disabled>✨ 技能 (Skill)</button>
      <button class="btn-action item" disabled>💊 物品 (Item)</button>
      <button 
        class="btn-action escape" 
        @click="combatStore.escape()" 
        :disabled="!combatStore.isPlayerTurn"
      >
        🏃 逃跑 (Run)
      </button>
    </div>
  </div>
</template>

<style scoped>
.combat-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #2c0b0e; /* Dark redish background for combat */
  color: #fff;
  font-family: 'Inter', sans-serif;
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

.fighter-card.attacking {
  transform: scale(1.05); /* Highlight active turn */
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
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
  color: #ddd;
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

.skill { background: #9b59b6; }
.item { background: #f1c40f; color: #333; }

.escape { background: #95a5a6; }
.escape:hover:not(:disabled) { background: #7f8c8d; }

</style>
