<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  npc: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'openShop', 'viewQuests'])

const currentDialogueId = ref('greeting')

const currentDialogue = computed(() => {
  return props.npc.dialogues[currentDialogueId.value]
})

const handleOption = (option) => {
  if (option.action === 'close') {
    emit('close')
  } else if (option.action === 'open_shop') {
    emit('openShop', props.npc)
  } else if (option.action === 'view_quests') {
    emit('viewQuests', props.npc)
  } else if (option.next) {
    currentDialogueId.value = option.next
  }
}

const close = () => {
  emit('close')
}
</script>

<template>
  <div class="npc-dialog-overlay" @click.self="close">
    <div class="npc-dialog">
      <div class="npc-header">
        <span class="npc-avatar">{{ npc.avatar }}</span>
        <div class="npc-info">
          <h3>{{ npc.name }}</h3>
          <p class="npc-desc">{{ npc.description }}</p>
        </div>
        <button class="btn-close-npc" @click="close">✕</button>
      </div>
      
      <div class="dialogue-content">
        <p>{{ currentDialogue.text }}</p>
      </div>
      
      <div class="dialogue-options">
        <button 
          v-for="(option, idx) in currentDialogue.options" 
          :key="idx"
          class="dialogue-option"
          @click="handleOption(option)">
          {{ option.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.npc-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.npc-dialog {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  border: 2px solid rgba(100, 255, 218, 0.3);
  border-radius: 16px;
  padding: 0;
  min-width: 500px;
  max-width: 600px;
  animation: slideIn 0.3s;
  overflow: hidden;
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.npc-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(100, 255, 218, 0.2);
  position: relative;
}

.npc-avatar {
  font-size: 3rem;
}

.npc-info {
  flex: 1;
}

.npc-info h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1.3rem;
  color: #64ffda;
}

.npc-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #a0aec0;
}

.btn-close-npc {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-npc:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: #e74c3c;
}

.dialogue-content {
  padding: 2rem;
  min-height: 100px;
}

.dialogue-content p {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.8;
  color: #e2e8f0;
}

.dialogue-options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
}

.dialogue-option {
  padding: 0.9rem 1.2rem;
  background: rgba(100, 255, 218, 0.1);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 8px;
  color: #64ffda;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.dialogue-option:hover {
  background: rgba(100, 255, 218, 0.2);
  border-color: #64ffda;
  transform: translateX(4px);
}
</style>
