<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'use', 'equip', 'unequip'])

const handleClose = () => {
  emit('close')
}

const handleUse = () => {
  emit('use', props.item)
}

const handleEquip = () => {
  emit('equip', props.item)
}

const handleUnequip = () => {
  emit('unequip', props.item)
}
</script>

<template>
  <div v-if="show && item" class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <button class="btn-close" @click="handleClose">×</button>
      <div class="modal-header">
         <div class="modal-icon">{{ item.icon }}</div>
         <h2>{{ item.name }}</h2>
      </div>
      
      <div class="modal-body">
         <p class="description">{{ item.description }}</p>
         
         <div class="stats" v-if="item.stats">
            <div v-if="item.stats.attack">⚔️ 攻击力: +{{ item.stats.attack }}</div>
            <div v-if="item.stats.defense">🛡️ 防御力: +{{ item.stats.defense }}</div>
         </div>

         <div class="info">
            <span class="badge">{{ item.type === 'equipment' ? '装备' : '消耗品' }}</span>
            <span class="price">价值: {{ item.price }} 两</span>
         </div>
      </div>

      <div class="modal-actions">
         <button v-if="item.type === 'consumable'" class="btn-primary" @click="handleUse">使用</button>
         
         <template v-if="item.type === 'equipment'">
            <button 
              v-if="!item.is_equipped" 
              class="btn-primary" 
              @click="handleEquip"
            >
              装备
            </button>
            <button 
              v-else 
              class="btn-danger" 
              @click="handleUnequip"
            >
              卸下
            </button>
         </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
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
