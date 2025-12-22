<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useCombatStore } from '../stores/combat'
import { maps, getMapById } from '../data/maps'

const router = useRouter()
const gameStore = useGameStore()
const combatStore = useCombatStore()

const currentMap = computed(() => getMapById(gameStore.currentLocationId))
const connections = computed(() => {
  return currentMap.value.connections.map(id => getMapById(id))
})

const handleTravel = (mapId) => {
  gameStore.travelTo(mapId)
}

const handleExplore = () => {
  if (currentMap.value.type === 'wild') {
    // Determine level range based on map config or static map
    combatStore.startCombat(currentMap.value.levelRange || [1, 3])
    router.push('/combat')
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="map-container">
    <div class="map-panel">
      <div class="header">
        <button class="btn-back" @click="goHome">🏠 返回首页</button>
        <h1>世界地图</h1>
      </div>

      <div class="current-location">
        <div class="location-card" :class="currentMap.type">
          <h2>📍 {{ currentMap.name }}</h2>
          <p class="desc">{{ currentMap.description }}</p>
          <span class="badge" v-if="currentMap.type === 'wild'">危险区域</span>
          <span class="badge safe" v-else>安全区</span>
          
          <button 
            v-if="currentMap.type === 'wild'" 
            class="btn-explore" 
            @click="handleExplore"
          >
            🔍 探索 (Explore)
          </button>
        </div>
      </div>

      <div class="connections">
        <h3>前往周边区域:</h3>
        <div class="grid">
          <button 
            v-for="map in connections" 
            :key="map.id"
            class="travel-btn"
            @click="handleTravel(map.id)"
          >
            <span class="map-name">{{ map.name }}</span>
            <span class="map-type">{{ map.type === 'wild' ? '⚔️' : '🛡️' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f1215;
  color: #fff;
  padding: 1rem;
}

.map-panel {
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #a0aec0;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.2);
}

.location-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.5s ease;
}

.location-card.wild {
  border-color: rgba(231, 76, 60, 0.3);
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.1);
}

.location-card.safe {
  border-color: rgba(46, 204, 113, 0.3);
  box-shadow: 0 0 20px rgba(46, 204, 113, 0.1);
}

.location-card h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.desc {
  color: #a0aec0;
  line-height: 1.6;
}

.badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.badge.safe {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border-color: rgba(46, 204, 113, 0.3);
}

.connections h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #718096;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.travel-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.travel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.map-name {
  font-weight: bold;
}

.map-type {
  font-size: 1.2rem;
}

.btn-explore {
  margin-top: 1rem;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
  transition: all 0.3s;
}

.btn-explore:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}
</style>
