<script setup>
import { onMounted, ref } from 'vue'
import { useInventoryStore } from '../../stores/inventory'
import ItemDetailModal from './ItemDetailModal.vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const inventoryStore = useInventoryStore()
const selectedItem = ref(null)
const showModal = ref(false)

onMounted(() => {
  // We can fetch here or let parent control it.
  // inventoryStore.fetchInventory() 
})

const openModal = (item) => {
  selectedItem.value = item
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
}

const handleUse = async (item) => {
  await inventoryStore.useItem(item)
  if (item.quantity <= 0) {
    closeModal()
  }
}

const handleEquip = async (item) => {
  await inventoryStore.equipItem(item)
  closeModal()
}

const handleUnequip = async (item) => {
  await inventoryStore.unequipItem(item)
  closeModal() // Close modal after unequip
}

</script>

<template>
  <div class="inventory-panel" :class="{ 'is-visible': show }">
    <div class="panel-header">
      <h2>🎒 乾坤袋</h2>
      <button class="btn-close-panel" @click="$emit('close')">×</button>
    </div>

    <div class="panel-content">
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

    <ItemDetailModal 
      :show="showModal"
      :item="selectedItem"
      @close="closeModal"
      @use="handleUse"
      @equip="handleEquip"
      @unequip="handleUnequip"
    />
  </div>
</template>

<style scoped>
.inventory-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px; /* Base width */
  height: 100%;
  background: rgba(30, 35, 40, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -5px 0 30px rgba(0,0,0,0.5);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  z-index: 100; /* Below modal, above map */
  backdrop-filter: blur(10px);
}

.inventory-panel.is-visible {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #f1c40f;
}

.btn-close-panel {
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
  line-height: 1;
}

.btn-close-panel:hover {
  color: #fff;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
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

@media (max-width: 600px) {
  .inventory-panel {
    width: 100%;
    border-left: none;
  }
  
  .panel-header {
    padding: 0.8rem 1rem;
  }
  
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 8px;
  }

  .item-icon { font-size: 1.5rem; }
}
</style>
