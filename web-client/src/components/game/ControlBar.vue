<script setup>
const emit = defineEmits(['toggle-character', 'toggle-inventory', 'toggle-map', 'toggle-quests', 'toggle-shop', 'toggle-inn'])

</script>

<template>
  <div class="control-bar">
    <button class="btn-control" @click="$emit('toggle-character')" title="人物 (C)">
       <span class="icon">👤</span>
    </button>
    <button class="btn-control" @click="$emit('toggle-inventory')" title="背包 (B)">
       <span class="icon">🎒</span>
    </button>
    <button class="btn-control" @click="$emit('toggle-quests')" title="任务 (Q)">
       <span class="icon">📜</span>
    </button>
    <button class="btn-control" @click="$emit('toggle-map')" title="世界地图 (M)">
       <span class="icon">🌍</span>
    </button>
    <div class="divider"></div>
    <button class="btn-control" @click="$emit('toggle-shop')" title="百草阁">
       <span class="icon">💊</span>
    </button>
    <button class="btn-control" @click="$emit('toggle-inn')" title="客栈">
       <span class="icon">🏨</span>
    </button>
  </div>
</template>

<style scoped>
.control-bar {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  background: rgba(20, 20, 20, 0.8);
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
  z-index: 50;
  transition: opacity 0.3s;
}

.btn-control {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  transition: all 0.2s;
}

.btn-control:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-5px);
  border-color: #f1c40f;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.btn-control:active {
  transform: translateY(0);
}

.divider {
  width: 1px;
  background: rgba(255,255,255,0.2);
  margin: 0 5px;
}
</style>
