
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '../stores/inventory'
import { useCharacterStore } from '../stores/character'

const router = useRouter()
const inventoryStore = useInventoryStore()
const characterStore = useCharacterStore()

const selectedItem = ref(null)
const showModal = ref(false)

onMounted(() => {
  inventoryStore.fetchInventory()
})

const goHome = () => {
  router.push('/')
}

const openModal = (item) => {
  selectedItem.value = item
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
}

const handleUse = async () => {
  if (selectedItem.value) {
    await inventoryStore.useItem(selectedItem.value)
    if (selectedItem.value.quantity <= 0) {
      closeModal()
    }
  }
}

const handleEquip = async () => {
  if (selectedItem.value) {
    await inventoryStore.equipItem(selectedItem.value)
    closeModal()
  }
}

const handleUnequip = async (item) => {
    // Allows unequip from avatar click too
    const target = item || selectedItem.value
    if (target) {
        await inventoryStore.unequipItem(target)
        if (showModal.value) closeModal()
    }
}

// Helper to find equipped item by slot
const getEquippedItem = (slot) => {
  return inventoryStore.inventory.find(i => i.is_equipped && i.slot === slot)
}

const getRing = (index) => {
  const rings = inventoryStore.inventory.filter(i => i.is_equipped && i.slot === 'ring')
  return rings[index]
}
</script>

<template>
  <div class="inventory-container">
    <div class="panel">
      <div class="header">
        <button class="btn-back" @click="goHome">🏠 返回首页</button>
        <h1>🎒 乾坤袋</h1>
      </div>

      <div class="content">
        <!-- Left: Character Equipment -->
        <div class="character-panel">
          <div class="character-bg">
            <!-- Avatar Placeholder -->
            <div class="mannequin">
               <div class="head">👤</div>
               <div class="body"></div>
               <div class="arms"></div>
               <div class="legs"></div>
            </div>

            <!-- Slots -->
            
            <!-- Head (Top Center) -->
            <div class="slot head-slot" @click="getEquippedItem('head') && openModal(getEquippedItem('head'))">
               <div v-if="getEquippedItem('head')" class="equipped-icon">{{ getEquippedItem('head').icon }}</div>
               <div v-else class="placeholder">🧢</div>
               <span class="slot-label">头饰</span>
            </div>

            <!-- Necklace (Below Head) -->
            <div class="slot necklace-slot" @click="getEquippedItem('necklace') && openModal(getEquippedItem('necklace'))">
               <div v-if="getEquippedItem('necklace')" class="equipped-icon">{{ getEquippedItem('necklace').icon }}</div>
               <div v-else class="placeholder">📿</div>
               <span class="slot-label">项链</span>
            </div>

            <!-- Fabao (Floating Top Right) -->
            <div class="slot fabao-slot" @click="getEquippedItem('fabao') && openModal(getEquippedItem('fabao'))">
               <div v-if="getEquippedItem('fabao')" class="equipped-icon">{{ getEquippedItem('fabao').icon }}</div>
               <div v-else class="placeholder">☯️</div>
               <span class="slot-label">本命</span>
            </div>

            <!-- Weapon (Left Hand - Perspective Right) -->
            <div class="slot weapon-slot" @click="getEquippedItem('weapon') && openModal(getEquippedItem('weapon'))">
               <div v-if="getEquippedItem('weapon')" class="equipped-icon">{{ getEquippedItem('weapon').icon }}</div>
               <div v-else class="placeholder">🗡️</div>
               <span class="slot-label">法宝</span>
            </div>

            <!-- Armor (Center Body) -->
            <div class="slot armor-slot" @click="getEquippedItem('armor') && openModal(getEquippedItem('armor'))">
               <div v-if="getEquippedItem('armor')" class="equipped-icon">{{ getEquippedItem('armor').icon }}</div>
               <div v-else class="placeholder">👕</div>
                <span class="slot-label">法衣</span>
            </div>

            <!-- Offhand (Right Hand - Perspective Left) -->
            <div class="slot offhand-slot" @click="getEquippedItem('offhand') && openModal(getEquippedItem('offhand'))">
               <div v-if="getEquippedItem('offhand')" class="equipped-icon">{{ getEquippedItem('offhand').icon }}</div>
               <div v-else class="placeholder">🛡️</div>
               <span class="slot-label">副手</span>
            </div>

            <!-- Ring L (Left Hand Finger) -->
            <div class="slot ring-l" @click="getRing(0) && openModal(getRing(0))">
               <div v-if="getRing(0)" class="equipped-icon">{{ getRing(0).icon }}</div>
               <div v-else class="placeholder">💍</div>
               <span class="slot-label">左戒</span>
            </div>
            
            <!-- Ring R (Right Hand Finger) -->
            <div class="slot ring-r" @click="getRing(1) && openModal(getRing(1))">
               <div v-if="getRing(1)" class="equipped-icon">{{ getRing(1).icon }}</div>
               <div v-else class="placeholder">💍</div>
               <span class="slot-label">右戒</span>
            </div>

             <!-- Feet (Bottom) -->
            <div class="slot feet-slot" @click="getEquippedItem('feet') && openModal(getEquippedItem('feet'))">
               <div v-if="getEquippedItem('feet')" class="equipped-icon">{{ getEquippedItem('feet').icon }}</div>
               <div v-else class="placeholder">👢</div>
                <span class="slot-label">鞋履</span>
            </div>
            
            <div class="character-name">{{ characterStore.character?.name }}</div>
          </div>
        </div>

        <!-- Right: Inventory Grid -->
        <div class="bag-panel">
           <div v-if="inventoryStore.loading" class="loading">Loading...</div>
           <div v-else-if="inventoryStore.inventory.length === 0" class="empty">
             <p>空空如也...</p>
           </div>
           
           <div v-else class="grid">
             <div 
               v-for="item in inventoryStore.inventory.filter(i => i.quantity > 0)" 
               :key="item.id" 
               class="item-slot"
               :class="{ 'is-equipped': item.is_equipped }"
               @click="openModal(item)"
               :title="item.name || item.item_id"
             >
                <div class="item-icon">{{ item.icon || '❓' }}</div>
                <div class="item-qty" v-if="item.quantity > 1">{{ item.quantity }}</div>
                <div class="equipped-marker" v-if="item.is_equipped">E</div>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showModal && selectedItem" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <button class="btn-close" @click="closeModal">×</button>
        <div class="modal-header">
           <div class="modal-icon">{{ selectedItem.icon }}</div>
           <h2>{{ selectedItem.name }}</h2>
        </div>
        
        <div class="modal-body">
           <p class="description">{{ selectedItem.description }}</p>
           
           <div class="stats" v-if="selectedItem.stats">
              <div v-if="selectedItem.stats.attack">⚔️ 攻击力: +{{ selectedItem.stats.attack }}</div>
              <div v-if="selectedItem.stats.defense">🛡️ 防御力: +{{ selectedItem.stats.defense }}</div>
           </div>

           <div class="info">
              <span class="badge">{{ selectedItem.type === 'equipment' ? '装备' : '消耗品' }}</span>
              <span class="price">价值: {{ selectedItem.price }} 两</span>
           </div>
        </div>

        <div class="modal-actions">
           <button v-if="selectedItem.type === 'consumable'" class="btn-primary" @click="handleUse">使用</button>
           
           <template v-if="selectedItem.type === 'equipment'">
              <button 
                v-if="!selectedItem.is_equipped" 
                class="btn-primary" 
                @click="handleEquip"
              >
                装备
              </button>
              <button 
                v-else 
                class="btn-danger" 
                @click="handleUnequip(selectedItem)"
              >
                卸下
              </button>
           </template>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.inventory-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1f25;
  color: #fff;
  padding: 1rem;
}

.panel {
  width: 100%;
  max-width: 900px;
  background: rgba(30, 35, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 80vh;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: max-width 0.3s;
}

@media (min-width: 1024px) {
  .panel {
    max-width: 1400px;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #ddd;
  cursor: pointer;
}

.content {
  flex: 1;
  display: grid;
  grid-template-columns: 350px 1fr;
  overflow: hidden;
}

/* Left: Character Panel */
.character-panel {
  background: rgba(0,0,0,0.3);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.character-bg {
  position: relative;
  width: 300px;
  height: 500px;
}

.mannequin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.3;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mannequin .head { font-size: 5rem; }
.mannequin .body { 
  width: 4px; 
  height: 200px; 
  background: #fff; 
  margin-top: -10px;
}
.mannequin .arms {
  width: 200px;
  height: 4px;
  background: #fff;
  position: absolute;
  top: 100px;
}
.mannequin .legs {
   /* Simplified stick legs */
}

.character-name {
    position: absolute;
    bottom: 20px;
    width: 100%;
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: #f1c40f;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.slot {
  position: absolute;
  width: 60px;
  height: 60px;
  background: rgba(0,0,0,0.5);
  border: 2px solid #444;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.slot:hover {
  border-color: #f1c40f;
  box-shadow: 0 0 10px rgba(241, 196, 15, 0.2);
}

/* Slot Positions (Assuming 300x500 container, Center X=150) */

.head-slot {
  top: 30px;
  left: 120px;
}

.necklace-slot {
  top: 100px;
  left: 120px;
}

.fabao-slot {
  top: 40px;
  right: 20px;
}

.weapon-slot {
  top: 200px;
  left: 30px; 
}

.armor-slot {
  top: 200px;
  left: 120px; 
}

.offhand-slot {
  top: 200px;
  right: 30px;
}

.ring-l {
  top: 280px;
  left: 30px;
}

.ring-r {
  top: 280px;
  right: 30px;
}

.feet-slot {
  bottom: 80px;
  left: 120px;
}


.slot-label {
    position: absolute;
    bottom: -18px;
    font-size: 0.7rem;
    color: #aaa;
    width: 80px;
    text-align: center;
    background: rgba(0,0,0,0.5);
    border-radius: 4px;
    padding: 1px 0;
}

.equipped-icon { font-size: 2rem; }
.placeholder { font-size: 2rem; opacity: 0.3; }


/* Right: Bag Grid */
.bag-panel {
  padding: 1.5rem;
  overflow-y: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 10px;
}

.item-slot {
  width: 100%;
  aspect-ratio: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all 0.1s;
}

.item-slot:hover {
  background: rgba(255,255,255,0.1);
  border-color: #aaa;
}

.item-slot.is-equipped {
  border-color: #f1c40f;
  background: rgba(241, 196, 15, 0.1);
  box-shadow: inset 0 0 10px rgba(241, 196, 15, 0.2);
}

.item-icon { font-size: 2rem; }

.item-qty {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 2px #000;
}

.equipped-marker {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 0.6rem;
  background: #f1c40f;
  color: #000;
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: bold;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal {
  background: #2c3e50;
  width: 90%;
  max-width: 400px;
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  border: 1px solid #444;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  animation: popIn 0.2s ease-out;
}

@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.btn-close {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-icon { font-size: 4rem; margin-bottom: 0.5rem; }
.modal-header h2 { color: #f1c40f; margin: 0; }

.modal-body {
  margin-bottom: 2rem;
}

.description { color: #ccc; font-style: italic; margin-bottom: 1rem; }

.stats {
  background: rgba(0,0,0,0.2);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.stats div { color: #3498db; margin-bottom: 0.2rem; }

.info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #888;
}

.badge {
  background: #444;
  padding: 2px 8px;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-actions button {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary { background: #27ae60; color: white; }
.btn-primary:hover { background: #2ecc71; }

.btn-danger { background: #e74c3c; color: white; }
.btn-danger:hover { background: #c0392b; }

</style>
