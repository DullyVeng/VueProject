<script setup>
import { computed, ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { useInventoryStore } from '../../stores/inventory'
import ItemDetailModal from './ItemDetailModal.vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const characterStore = useCharacterStore()
const inventoryStore = useInventoryStore()

const selectedItem = ref(null)
const showModal = ref(false)

const hpBarStyle = computed(() => {
    if (!characterStore.character) return {}
    const hp = Number(characterStore.character.hp) || 0
    const maxHp = Number(characterStore.character.max_hp) || 1
    const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
    return { width: `${percent}%` }
})

const mpBarStyle = computed(() => {
    if (!characterStore.character) return {}
    const mp = Number(characterStore.character.mp) || 0
    const maxMp = Number(characterStore.character.max_mp) || 1
    const percent = Math.max(0, Math.min(100, (mp / maxMp) * 100))
    return { width: `${percent}%` }
})

// Helper to find equipped item by slot
const getEquippedItem = (slot) => {
  return inventoryStore.inventory.find(i => i.is_equipped && i.slot === slot)
}

const getRing = (index) => {
  const rings = inventoryStore.inventory.filter(i => i.is_equipped && i.slot === 'ring')
  return rings[index]
}

const openModal = (item) => {
  selectedItem.value = item
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
}

const handleUnequip = async (item) => {
  await inventoryStore.unequipItem(item)
  closeModal()
}
</script>

<template>
  <div class="character-wrapper" :class="{ 'is-visible': show }">
    <!-- HP/MP Bars (Floating above) -->
    <div class="bars-container" v-if="characterStore.character">
       <div class="bar-row hp">
          <div class="bar-fill" :style="hpBarStyle"></div>
          <span class="bar-text">HP: {{ characterStore.character.hp }} / {{ characterStore.character.max_hp }}</span>
       </div>
       <div class="bar-row mp">
          <div class="bar-fill" :style="mpBarStyle"></div>
          <span class="bar-text">MP: {{ characterStore.character.mp }} / {{ characterStore.character.max_mp }}</span>
       </div>
    </div>

    <!-- Main Panel -->
    <div class="character-panel">
       <div class="panel-header">
         <div class="level-badge">Lv.{{ characterStore.character?.level }}</div>
         <h2>{{ characterStore.character?.name }}</h2>
         <button class="btn-close-panel" @click="$emit('close')">×</button>
       </div>

       <div class="panel-body">
          <!-- Mannequin / Equipment Slots -->
          <div class="equipment-area">
             <div class="mannequin-bg">
                <div class="head-circle"></div>
                <div class="body-line"></div>
             </div>

             <!-- Top Slots -->
             <div class="slot head-slot" @click="getEquippedItem('head') && openModal(getEquippedItem('head'))">
                <div v-if="getEquippedItem('head')" class="equipped-icon">{{ getEquippedItem('head').icon }}</div>
                <div v-else class="placeholder">🧢</div>
                <span class="slot-label">头饰</span>
             </div>
             
             <div class="slot necklace-slot" @click="getEquippedItem('necklace') && openModal(getEquippedItem('necklace'))">
                <div v-if="getEquippedItem('necklace')" class="equipped-icon">{{ getEquippedItem('necklace').icon }}</div>
                <div v-else class="placeholder">📿</div>
                <span class="slot-label">项链</span>
             </div>

             <div class="slot fabao-slot" @click="getEquippedItem('fabao') && openModal(getEquippedItem('fabao'))">
                <div v-if="getEquippedItem('fabao')" class="equipped-icon">{{ getEquippedItem('fabao').icon }}</div>
                <div v-else class="placeholder">☯️</div>
                <span class="slot-label">本命</span>
             </div>

             <!-- Middle Slots -->
             <div class="slot weapon-slot" @click="getEquippedItem('weapon') && openModal(getEquippedItem('weapon'))">
                <div v-if="getEquippedItem('weapon')" class="equipped-icon">{{ getEquippedItem('weapon').icon }}</div>
                <div v-else class="placeholder">🗡️</div>
                <span class="slot-label">法宝</span>
             </div>

             <div class="slot armor-slot" @click="getEquippedItem('armor') && openModal(getEquippedItem('armor'))">
                <div v-if="getEquippedItem('armor')" class="equipped-icon">{{ getEquippedItem('armor').icon }}</div>
                <div v-else class="placeholder">👕</div>
                <span class="slot-label">法衣</span>
             </div>

             <div class="slot offhand-slot" @click="getEquippedItem('offhand') && openModal(getEquippedItem('offhand'))">
                <div v-if="getEquippedItem('offhand')" class="equipped-icon">{{ getEquippedItem('offhand').icon }}</div>
                <div v-else class="placeholder">🛡️</div>
                <span class="slot-label">副手</span>
             </div>

             <!-- Bottom Slots -->
             <div class="slot ring-l" @click="getRing(0) && openModal(getRing(0))">
                <div v-if="getRing(0)" class="equipped-icon">{{ getRing(0).icon }}</div>
                <div v-else class="placeholder">💍</div>
                <span class="slot-label">左戒</span>
             </div>

             <div class="slot ring-r" @click="getRing(1) && openModal(getRing(1))">
                <div v-if="getRing(1)" class="equipped-icon">{{ getRing(1).icon }}</div>
                <div v-else class="placeholder">💍</div>
                <span class="slot-label">右戒</span>
             </div>

             <div class="slot feet-slot" @click="getEquippedItem('feet') && openModal(getEquippedItem('feet'))">
                <div v-if="getEquippedItem('feet')" class="equipped-icon">{{ getEquippedItem('feet').icon }}</div>
                <div v-else class="placeholder">👢</div>
                <span class="slot-label">鞋履</span>
             </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-area" v-if="characterStore.character">
             <div class="stat-row">
                <span class="label">攻击 (ATK)</span>
                <span class="value">{{ characterStore.character.attack }}</span>
             </div>
             <div class="stat-row">
                <span class="label">防御 (DEF)</span>
                <span class="value">{{ characterStore.character.defense }}</span>
             </div>
             <div class="stat-row">
                <span class="label">经验 (EXP)</span>
                <span class="value">{{ characterStore.character.exp }}</span>
             </div>
             <div class="stat-row">
                <span class="label">白银</span>
                <span class="value silver">{{ characterStore.character.silver }} 两</span>
             </div>
          </div>
       </div>
    </div>

    <ItemDetailModal 
      :show="showModal"
      :item="selectedItem"
      @close="closeModal"
      @unequip="handleUnequip"
    />
  </div>
</template>

<style scoped>
.character-wrapper {
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translate(-150%, -50%); /* Start off-screen left */
  /* transform: translate(0, -50%) when visible */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 100;
}

.character-wrapper.is-visible {
  transform: translate(0, -50%);
}

/* HP/MP Bars */
.bars-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 320px; /* Match panel width roughly */
}

.bar-row {
  height: 20px;
  background: rgba(0,0,0,0.6);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
}

.bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.hp .bar-fill { background: linear-gradient(90deg, #c0392b, #e74c3c); }
.mp .bar-fill { background: linear-gradient(90deg, #2980b9, #3498db); }

.bar-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px #000;
}

/* Panel */
.character-panel {
  width: 340px;
  background: rgba(30, 35, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 10px 10px 30px rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
}

.level-badge {
  background: #e67e22;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  margin-right: 10px;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #fff;
}

.btn-close-panel {
  position: absolute;
  right: 0;
  top: -5px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
}

/* Equipment Area */
.equipment-area {
  position: relative;
  height: 400px;
  margin-bottom: 1rem;
}

.mannequin-bg {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.2;
}
.head-circle { width: 60px; height: 60px; border: 2px solid #fff; border-radius: 50%; margin: 0 auto; }
.body-line { width: 4px; height: 150px; background: #fff; margin: 0 auto; }

.slot {
  position: absolute;
  width: 50px;
  height: 50px;
  background: rgba(0,0,0,0.5);
  border: 1px solid #444;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.slot:hover { border-color: #f1c40f; box-shadow: 0 0 10px rgba(241, 196, 15, 0.2); }

.equipped-icon { font-size: 1.5rem; }
.placeholder { font-size: 1.5rem; opacity: 0.3; }

.slot-label {
  position: absolute;
  bottom: -16px;
  font-size: 0.7rem;
  color: #aaa;
  width: 60px;
  text-align: center;
  left: 50%;
  transform: translateX(-50%);
  text-shadow: 0 1px 2px #000;
}

/* Slot Positions relative to 340px width container (~310px inner content) & 400px height */
/* Center X approx 155px */
.head-slot { top: 0; left: 145px; }
.necklace-slot { top: 70px; left: 145px; }
.fabao-slot { top: 20px; right: 20px; }

.weapon-slot { top: 150px; left: 40px; }
.armor-slot { top: 150px; left: 145px; }
.offhand-slot { top: 150px; right: 40px; }

.ring-l { top: 220px; left: 40px; }
.ring-r { top: 220px; right: 40px; }

.feet-slot { bottom: 50px; left: 145px; }


/* Stats */
.stats-area {
  background: rgba(0,0,0,0.2);
  padding: 1rem;
  border-radius: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.stat-row:last-child { margin-bottom: 0; }

.label { color: #aaa; }
.value { color: #fff; font-weight: bold; }
.silver { color: #f1c40f; }

@media (max-width: 600px) {
  .character-wrapper {
    left: 10px;
    top: 60px;
    transform: translateX(-150%);
  }
  .character-wrapper.is-visible {
    transform: translateX(0);
  }
}
</style>
