<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCharacterStore } from '../stores/character'
import { useInventoryStore } from '../stores/inventory'
import ControlBar from '../components/game/ControlBar.vue'
import CharacterPanel from '../components/game/CharacterPanel.vue'
import InventoryPanel from '../components/game/InventoryPanel.vue'

const userStore = useUserStore()
const characterStore = useCharacterStore()
const inventoryStore = useInventoryStore()
const router = useRouter()

const showCharacter = ref(false)
const showInventory = ref(false)

onMounted(async () => {
  await userStore.initialize()
  if (userStore.user && !characterStore.character) {
      await characterStore.fetchCharacter()
  }
  // Pre-fetch inventory so it's ready
  inventoryStore.fetchInventory()
})

const toggleCharacter = () => {
    showCharacter.value = !showCharacter.value
    // Optional: Close others?
    // if (showCharacter.value) showInventory.value = false
}

const toggleInventory = () => {
    showInventory.value = !showInventory.value
}

// Handlers for other buttons
const handleMap = () => router.push('/map')
const handleDantian = () => router.push('/dantian')
const handleAttribute = () => router.push('/attribute')
const handleQuests = () => router.push('/quests')
const handleShop = () => router.push('/shop')
const handleInn = () => router.push('/inn')

</script>

<template>
  <div class="game-container">
    <!-- Layer 0: World Map Background -->
    <div id="map" class="map-layer">
       <!-- Placeholder for game canvas or map image -->
       <div class="map-placeholder">
          <h1>RPG World</h1>
          <p>当前位置: 新手村</p>
       </div>
    </div>

    <!-- Layer 1: UI Overlays -->
    <div id="ui-overlay" class="ui-layer">
        
        <!-- Panels -->
        <CharacterPanel 
            :show="showCharacter" 
            @close="showCharacter = false" 
        />
        
        <InventoryPanel 
            :show="showInventory" 
            @close="showInventory = false" 
        />

        <!-- Controls -->
        <ControlBar 
            @toggle-character="toggleCharacter"
            @toggle-inventory="toggleInventory"
            @toggle-dantian="handleDantian"
            @toggle-attribute="handleAttribute"
            @toggle-map="handleMap"
            @toggle-quests="handleQuests"
            @toggle-shop="handleShop"
            @toggle-inn="handleInn"
        />

    </div>
  </div>
</template>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.map-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: url('/assets/game/images/maps/starter_village.jpg') no-repeat center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Fallback if image missing */
.map-placeholder {
  text-align: center;
  color: rgba(255,255,255,0.2);
  user-select: none;
}
.map-placeholder h1 { font-size: 5rem; margin: 0; }

.ui-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none; /* Let clicks pass through to map if not on UI element */
}

/* Re-enable pointer events for actual UI children */
.ui-layer > * {
  pointer-events: auto;
}

</style>
