import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
    const isInitialized = ref(false)
    const currentLocationId = ref('town')

    function initialize() {
        isInitialized.value = true
    }

    function travelTo(mapId) {
        currentLocationId.value = mapId
    }

    return { isInitialized, currentLocationId, initialize, travelTo }
})
