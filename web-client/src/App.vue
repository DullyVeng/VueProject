<script setup>
import { RouterView } from 'vue-router'
import { onMounted, watch } from 'vue'
import { useCharacterStore } from './stores/character'
import { useGameStore } from './stores/game'

const characterStore = useCharacterStore()
const gameStore = useGameStore()

// 在应用启动时加载角色数据
onMounted(async () => {
  console.log('[App] 应用启动，开始加载角色数据...')
  await characterStore.fetchCharacter()
})

// 监听角色数据加载完成后，初始化游戏状态
watch(
  () => characterStore.character,
  async (newCharacter) => {
    if (newCharacter && !gameStore.isInitialized) {
      console.log('[App] 角色数据已加载，开始初始化游戏...')
      await gameStore.initialize()
    }
  },
  { immediate: true }
)
</script>

<template>
  <header>
    <nav>
      <!-- Navigation items -->
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
</style>
