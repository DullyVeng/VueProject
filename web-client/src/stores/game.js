import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'

export const useGameStore = defineStore('game', () => {
    const isInitialized = ref(false)
    const currentLocationId = ref('town') // 默认起始镇
    const characterStore = useCharacterStore()

    /**
     * 初始化游戏 - 从数据库加载玩家位置
     */
    async function initialize() {
        if (!characterStore.character) {
            console.log('[Game] 等待角色数据加载...')
            return
        }

        // 从角色数据中读取当前位置
        const savedLocation = characterStore.character.current_map_id
        if (savedLocation) {
            currentLocationId.value = savedLocation
            console.log(`[Game] 加载玩家位置: ${savedLocation}`)
        } else {
            // 如果数据库没有位置，设置默认值并保存
            currentLocationId.value = 'town'
            await saveLocationToDatabase('town')
            console.log('[Game] 初始化位置为: town')
        }

        isInitialized.value = true
    }

    /**
     * 保存位置到数据库
     */
    async function saveLocationToDatabase(mapId) {
        if (!characterStore.character) return

        const { error } = await supabase
            .from('characters')
            .update({ current_map_id: mapId })
            .eq('id', characterStore.character.id)

        if (error) {
            console.error('[Game] 保存位置失败:', error)
        } else {
            // 同步更新本地角色数据
            characterStore.character.current_map_id = mapId
        }
    }

    /**
     * 移动到新地图
     */
    async function travelTo(mapId) {
        console.log(`[Game] 移动到: ${mapId}`)
        currentLocationId.value = mapId

        // 保存到数据库
        await saveLocationToDatabase(mapId)
    }

    return {
        isInitialized,
        currentLocationId,
        initialize,
        travelTo
    }
})
