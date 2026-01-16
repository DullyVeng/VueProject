/**
 * 探索系统状态管理
 * 管理小地图探索的玩家位置、怪物状态等
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    getExplorationMap,
    isWalkable,
    isExit,
    getEncounterRate,
    selectHiddenMonster,
    TERRAIN_TYPES
} from '../data/explorationMaps'

export const useExplorationStore = defineStore('exploration', () => {
    // 状态
    const currentMapId = ref(null)
    const currentMap = ref(null)
    const playerPosition = ref({ x: 0, y: 0 })
    const previousPosition = ref({ x: 0, y: 0 }) // 用于退出取消时回退
    const playerDirection = ref('down') // up, down, left, right
    const isMoving = ref(false)
    const defeatedMonsters = ref([]) // 已击败的显性怪物ID列表
    const pendingEncounter = ref(null) // 待处理的遭遇（怪物信息）
    const showExitConfirm = ref(false) // 显示退出确认弹窗
    const isInCombat = ref(false) // 标记是否在探索中遭遇战斗（用于战斗后返回）

    // 计算属性
    const visibleMonsters = computed(() => {
        if (!currentMap.value) return []
        return currentMap.value.visibleMonsters.filter(
            m => !defeatedMonsters.value.includes(m.id)
        )
    })

    const currentEncounterRate = computed(() => {
        if (!currentMap.value) return 0
        return getEncounterRate(
            currentMap.value,
            playerPosition.value.x,
            playerPosition.value.y
        )
    })

    const encounterRatePercent = computed(() => {
        return Math.round(currentEncounterRate.value * 100)
    })

    // 进入小地图
    // forceReset: true 表示强制重置到出生点（从大地图进入），false 表示尝试恢复位置（刷新）
    const enterMap = (mapId, forceReset = false) => {
        const map = getExplorationMap(mapId)
        if (!map) {
            console.error(`探索地图 ${mapId} 不存在`)
            return false
        }

        currentMapId.value = mapId
        currentMap.value = map

        // 如果强制重置，清除状态并使用出生点
        if (forceReset) {
            playerPosition.value = { ...map.spawnPoint }
            previousPosition.value = { ...map.spawnPoint }
            playerDirection.value = 'down'
            defeatedMonsters.value = []
            clearPlayerState()  // 清除保存的状态
        } else {
            // 尝试从 localStorage 恢复位置（刷新场景）
            const savedState = loadPlayerState(mapId)
            if (savedState) {
                playerPosition.value = savedState.position
                previousPosition.value = savedState.previousPosition
                playerDirection.value = savedState.direction
                defeatedMonsters.value = savedState.defeatedMonsters || []
            } else {
                // 使用默认出生点
                playerPosition.value = { ...map.spawnPoint }
                previousPosition.value = { ...map.spawnPoint }
                playerDirection.value = 'down'
                defeatedMonsters.value = []
            }
        }

        pendingEncounter.value = null
        showExitConfirm.value = false

        return true
    }

    // 退出小地图
    const exitMap = () => {
        currentMapId.value = null
        currentMap.value = null
        playerPosition.value = { x: 0, y: 0 }
        previousPosition.value = { x: 0, y: 0 }
        playerDirection.value = 'down'
        defeatedMonsters.value = []
        pendingEncounter.value = null
        showExitConfirm.value = false
        isInCombat.value = false
    }

    // 取消退出（回退到前一格）
    const cancelExit = () => {
        playerPosition.value = { ...previousPosition.value }
        showExitConfirm.value = false
    }

    // 移动玩家
    const movePlayer = (direction) => {
        if (isMoving.value || !currentMap.value || showExitConfirm.value) {
            return { success: false }
        }

        // 计算新位置
        const dx = { left: -1, right: 1, up: 0, down: 0 }
        const dy = { left: 0, right: 0, up: -1, down: 1 }

        const newX = playerPosition.value.x + dx[direction]
        const newY = playerPosition.value.y + dy[direction]

        // 更新朝向
        playerDirection.value = direction

        // 检查是否可行走
        if (!isWalkable(currentMap.value, newX, newY)) {
            return { success: false, reason: 'blocked' }
        }

        // 保存前一位置
        previousPosition.value = { ...playerPosition.value }

        // 移动
        isMoving.value = true
        playerPosition.value = { x: newX, y: newY }

        // 检查是否到达出口
        if (isExit(currentMap.value, newX, newY)) {
            isMoving.value = false
            showExitConfirm.value = true
            return { success: true, isExit: true }
        }

        // 检查是否碰到显性怪物
        const monster = checkVisibleMonsterCollision(newX, newY)
        if (monster) {
            isMoving.value = false
            pendingEncounter.value = {
                type: 'visible',
                monster
            }
            return { success: true, encounter: pendingEncounter.value }
        }

        // 检查隐性遭遇
        const hiddenEncounter = checkHiddenEncounter()
        if (hiddenEncounter) {
            isMoving.value = false
            pendingEncounter.value = {
                type: 'hidden',
                monster: hiddenEncounter
            }
            return { success: true, encounter: pendingEncounter.value }
        }

        isMoving.value = false

        // 保存玩家状态
        savePlayerState()

        return { success: true }
    }

    // 检查显性怪物碰撞
    const checkVisibleMonsterCollision = (x, y) => {
        return visibleMonsters.value.find(m => m.x === x && m.y === y) || null
    }

    // 检查隐性遭遇
    const checkHiddenEncounter = () => {
        const rate = currentEncounterRate.value
        if (Math.random() < rate) {
            return selectHiddenMonster(currentMap.value)
        }
        return null
    }

    // 标记怪物为已击败
    const defeatMonster = (monsterId) => {
        if (!defeatedMonsters.value.includes(monsterId)) {
            defeatedMonsters.value.push(monsterId)
        }
    }

    // 清除待处理遭遇
    const clearPendingEncounter = () => {
        pendingEncounter.value = null
    }

    // 获取地形类型
    const getTerrainAt = (x, y) => {
        if (!currentMap.value) return TERRAIN_TYPES.WALL
        if (x < 0 || x >= currentMap.value.width || y < 0 || y >= currentMap.value.height) {
            return TERRAIN_TYPES.WALL
        }

        // 兼容 1D Int8Array 和 2D 数组
        if (currentMap.value.terrain.length === currentMap.value.width * currentMap.value.height) {
            return currentMap.value.terrain[y * currentMap.value.width + x]
        } else {
            return currentMap.value.terrain[y][x]
        }
    }

    // ==================== 位置持久化 ====================

    // 保存玩家状态到 localStorage
    const savePlayerState = () => {
        if (!currentMapId.value) return

        const state = {
            position: playerPosition.value,
            previousPosition: previousPosition.value,
            direction: playerDirection.value,
            defeatedMonsters: defeatedMonsters.value,
            timestamp: Date.now()
        }

        try {
            localStorage.setItem(`exploration_${currentMapId.value}`, JSON.stringify(state))
        } catch (e) {
            console.error('保存探索状态失败:', e)
        }
    }

    // 从 localStorage 加载玩家状态
    const loadPlayerState = (mapId) => {
        try {
            const saved = localStorage.getItem(`exploration_${mapId}`)
            if (!saved) return null

            const state = JSON.parse(saved)

            // 检查是否过期（24小时）
            const now = Date.now()
            if (state.timestamp && (now - state.timestamp) > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(`exploration_${mapId}`)
                return null
            }

            return state
        } catch (e) {
            console.error('加载探索状态失败:', e)
            return null
        }
    }

    // 清除保存的状态
    const clearPlayerState = () => {
        if (currentMapId.value) {
            localStorage.removeItem(`exploration_${currentMapId.value}`)
        }
    }

    return {
        // 状态
        currentMapId,
        currentMap,
        playerPosition,
        previousPosition,
        playerDirection,
        isMoving,
        defeatedMonsters,
        pendingEncounter,
        showExitConfirm,
        isInCombat,

        // 计算属性
        visibleMonsters,
        currentEncounterRate,
        encounterRatePercent,

        // 方法
        enterMap,
        exitMap,
        cancelExit,
        movePlayer,
        defeatMonster,
        clearPendingEncounter,
        getTerrainAt,
        savePlayerState,
        clearPlayerState
    }
})
