
<script setup>
import { ref } from 'vue'
import { useCharacterStore } from '../stores/character'

const characterStore = useCharacterStore()
const name = ref('')
const gender = ref('male')

const handleSubmit = async () => {
  if (!name.value.trim()) return
  await characterStore.createCharacter(name.value, gender.value)
}
</script>

<template>
  <div class="creation-container">
    <div class="glass-panel">
      <h2>创建你的角色</h2>
      <p class="subtitle">决定你的命运，冒险者</p>

      <form @submit.prevent="handleSubmit" class="creation-form">
        <div class="input-group">
          <label>角色昵称</label>
          <input 
            type="text" 
            v-model="name" 
            placeholder="Ex: Aragorn" 
            maxlength="12"
            required 
          />
        </div>

        <div class="gender-selection">
          <label>性别</label>
          <div class="gender-options">
            <div 
              class="gender-card" 
              :class="{ active: gender === 'male' }"
              @click="gender = 'male'"
            >
              <div class="icon">⚔️</div>
              <span>男</span>
            </div>
            <div 
              class="gender-card" 
              :class="{ active: gender === 'female' }"
              @click="gender = 'female'"
            >
              <div class="icon">🔮</div>
              <span>女</span>
            </div>
          </div>
        </div>

        <div v-if="characterStore.error" class="error-msg">
          {{ characterStore.error }}
        </div>

        <button type="submit" class="btn-primary" :disabled="characterStore.loading">
          {{ characterStore.loading ? 'Creating...' : '开始冒险' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.creation-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #1a1f25 0%, #000 100%);
  color: #fff;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  text-align: center;
}

h2 {
  margin-bottom: 0.5rem;
  font-size: 2rem;
  background: linear-gradient(45deg, #f1c40f, #e67e22);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #888;
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 2rem;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ddd;
}

.input-group input {
  width: 100%;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 1.1rem;
  outline: none;
}

.input-group input:focus {
  border-color: #f1c40f;
  box-shadow: 0 0 10px rgba(241, 196, 15, 0.1);
}

.gender-selection {
  margin-bottom: 2rem;
  text-align: left;
}

.gender-options {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.gender-card {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.gender-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.gender-card.active {
  background: rgba(241, 196, 15, 0.1);
  border-color: #f1c40f;
  transform: translateY(-2px);
}

.icon {
  font-size: 2rem;
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(45deg, #f1c40f, #e67e22);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.error-msg {
  color: #ff6b6b;
  margin-bottom: 1rem;
}
</style>
