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
import { useGameStore } from './game'
import { useUserStore } from './user'
import { useInventoryStore } from './inventory'
import { generateChestLoot } from '../data/chests'
import { supabase } from '../supabase/client'

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

    // BOSS 和宝箱状态
    const openedChests = ref([]) // 已开启的宝箱ID列表
    const bossDefeated = ref(false) // 当前地图BOSS是否已击败

    const gameStore = useGameStore()
    const userStore = useUserStore()
    const inventoryStore = useInventoryStore()

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

    // BOSS 方向指引（计算 BOSS 相对玩家的方位）
    const bossDirection = computed(() => {
        if (!currentMap.value?.boss || bossDefeated.value) return null

        const boss = currentMap.value.boss
        const dx = boss.x - playerPosition.value.x
        const dy = boss.y - playerPosition.value.y

        // 计算角度
        const angle = Math.atan2(dy, dx) * 180 / Math.PI

        return {
            angle,
            distance: Math.sqrt(dx * dx + dy * dy),
            dx,
            dy
        }
    })

    // 可用宝箱（未开启）
    const availableChests = computed(() => {
        if (!currentMap.value?.chests) return []
        return currentMap.value.chests.filter(
            c => !openedChests.value.includes(c.id)
        )
    })

    // 进入小地图
    // forceReset: true 表示强制重置到出生点（从大地图进入），false 表示尝试恢复位置（刷新）
    const enterMap = async (mapId, forceReset = false) => {
        // 先尝试获取静态配置
        let map = getExplorationMap(mapId)

        // 如果是刷新页面（forceReset=false），尝试从 localStorage 加载地图数据
        // 这样可以保证刷新后地图结构不变
        if (!forceReset) {
            const savedMapData = loadMapData(mapId)
            if (savedMapData) {
                map = savedMapData
                console.log(`[Exploration] 已恢复地图 ${mapId} 的地形数据`)
            }
        }

        if (!map) {
            console.error(`探索地图 ${mapId} 不存在`)
            return false
        }

        currentMapId.value = mapId
        currentMap.value = map

        // 如果强制重置，清除状态并使用出生点
        if (forceReset) {
            saveMapData(mapId, map) // 如果是首次进入（forceReset=true），保存当前地图数据到 localStorage
            // 这样后续刷新页面都能加载到同一份地图
            playerPosition.value = { ...map.spawnPoint }
            previousPosition.value = { ...map.spawnPoint }
            playerDirection.value = 'down'
            defeatedMonsters.value = []
            openedChests.value = []
            clearPlayerState()  // 清除保存的状态
        } else {
            // 尝试从 localStorage 恢复位置（刷新场景）
            const savedState = loadPlayerState(mapId)
            if (savedState) {
                playerPosition.value = savedState.position
                previousPosition.value = savedState.previousPosition
                playerDirection.value = savedState.direction
                defeatedMonsters.value = savedState.defeatedMonsters || []
                openedChests.value = savedState.openedChests || []
            } else {
                // 使用默认出生点
                playerPosition.value = { ...map.spawnPoint }
                previousPosition.value = { ...map.spawnPoint }
                playerDirection.value = 'down'
                defeatedMonsters.value = []
                openedChests.value = []
            }
        }

        pendingEncounter.value = null
        showExitConfirm.value = false

        // 检查 BOSS 是否需要刷新（24小时）
        await checkBossRespawn(mapId)

        // 更新角色当前位置到数据库
        await gameStore.travelTo(mapId)

        return true
    }

    // 退出小地图
    const exitMap = () => {
        // 清空当前地图的缓存数据，确保下次进入时重新生成
        if (currentMapId.value) {
            localStorage.removeItem(`exploration_map_data_${currentMapId.value}`)
            localStorage.removeItem(`exploration_${currentMapId.value}`)
            console.log(`[Exploration] 已清空地图 ${currentMapId.value} 的缓存数据`)
        }

        currentMapId.value = null
        currentMap.value = null
        playerPosition.value = { x: 0, y: 0 }
        previousPosition.value = { x: 0, y: 0 }
        playerDirection.value = 'down'
        defeatedMonsters.value = []
        openedChests.value = []
        bossDefeated.value = false
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
    const movePlayer = async (direction) => { // Added async here
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

        // 检查是否碰到 BOSS 或 BOSS 击败后的出口
        const boss = checkBossCollision(newX, newY)
        if (boss) {
            isMoving.value = false

            // 如果 BOSS 已击败，该位置变成出口
            if (bossDefeated.value) {
                showExitConfirm.value = true
                return { success: true, isExit: true, isBossExit: true }
            }

            // BOSS 未击败，进入战斗
            pendingEncounter.value = {
                type: 'boss',
                monster: boss
            }
            return { success: true, encounter: pendingEncounter.value }
        }


        // 检查是否碰到宝箱
        const chest = checkChestCollision(newX, newY)
        if (chest) {
            isMoving.value = false
            const lootResult = await openChest(chest)
            return { success: true, chest: lootResult }
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
            console.log(`[Exploration] 怪物 ${monsterId} 已标记为击败，当前已击败: ${defeatedMonsters.value.length}个`)
            savePlayerState()  // 保存状态
        }
    }

    // 清除待处理遭遇
    const clearPendingEncounter = () => {
        pendingEncounter.value = null
    }

    // ====================  BOSS 和宝箱相关 ====================

    // 检查 BOSS 碰撞（包括击败后的出口位置）
    const checkBossCollision = (x, y) => {
        if (!currentMap.value?.boss) return null
        const boss = currentMap.value.boss
        return (boss.x === x && boss.y === y) ? boss : null
    }


    // 检查宝箱碰撞
    const checkChestCollision = (x, y) => {
        return availableChests.value.find(c => c.x === x && c.y === y) || null
    }

    // 开启宝箱
    const openChest = async (chest) => {
        if (openedChests.value.includes(chest.id)) return null

        // 生成奖励
        let loot = generateChestLoot(chest.type)

        // 确保宝箱不为空（保底奖励）
        if (!loot || loot.length === 0) {
            console.warn(`[Exploration] 宝箱 ${chest.id} (${chest.type}) 生成的奖励为空，使用保底奖励`)
            loot = [{ id: 'spiritStone', amount: 5 }]
        }

        // 将物品添加到背包
        for (const item of loot) {
            if (item.type === 'sealed_fabao') {
                // TODO: 处理法宝掉落（目前只支持普通物品）
                console.log('获得封印法宝，暂未实现自动入库:', item)
            } else {
                await inventoryStore.addItem(item.id, item.amount)
            }
        }

        // 标记为已开启
        openedChests.value.push(chest.id)

        // 保存状态
        savePlayerState()

        return { chest, loot }
    }

    // 检查 BOSS 是否需要刷新
    const checkBossRespawn = async (mapId) => {
        if (!userStore.user) {
            console.log('[Exploration] checkBossRespawn: 用户未登录')
            return
        }

        console.log(`[Exploration] 检查地图 ${mapId} 的BOSS刷新状态...`)

        try {
            const { data, error } = await supabase
                .from('boss_defeats')
                .select('defeated_at')
                .eq('user_id', userStore.user.id)
                .eq('map_id', mapId)
                .single()

            if (error && error.code !== 'PGRST116') {  // PGRST116 = 未找到
                console.error('[Exploration] BOSS刷新检查失败:', error)
                return
            }

            if (!data) {
                // 从未击败过
                console.log(`[Exploration] 地图 ${mapId} 的BOSS从未被击败`)
                bossDefeated.value = false
                return
            }

            // 检查是否已过 24 小时
            const defeatedAt = new Date(data.defeated_at)
            const now = new Date()
            const minutes = (now - defeatedAt) / (1000 * 60)



            const isDefeated = minutes < 1  // 1分钟（测试用）

            bossDefeated.value = isDefeated

            console.log(`[Exploration] 地图 ${mapId} BOSS状态:`, {
                击败时间: data.defeated_at,
                已过分钟: minutes.toFixed(2),  // 显示分钟
                是否击败: isDefeated
            })
        } catch (e) {
            console.error('[Exploration] BOSS刷新检查错误:', e)
        }
    }


    // 保存 BOSS 击败时间
    const saveBossDefeatTime = async (mapId) => {
        if (!userStore.user) {
            console.log('[Exploration] saveBossDefeatTime: 用户未登录')
            return
        }

        console.log(`[Exploration] 保存BOSS击败时间到地图: ${mapId}`)

        try {
            const { error } = await supabase
                .from('boss_defeats')
                .upsert({
                    user_id: userStore.user.id,
                    map_id: mapId,
                    defeated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,map_id'
                })

            if (error) {
                console.error('[Exploration] 保存BOSS击败时间失败:', error)
            } else {
                bossDefeated.value = true
                console.log(`[Exploration] ✅ BOSS击败时间已保存，bossDefeated设置为: true`)
                savePlayerState()
            }
        } catch (e) {
            console.error('[Exploration] 保存BOSS击败时间错误:', e)
        }
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

    // 保存地图数据
    const saveMapData = (mapId, mapData) => {
        try {
            // 需要处理 Int8Array 序列化问题
            const dataToSave = { ...mapData }

            // 如果 terrain 是 TypedArray (如 Int8Array)，转换为普通数组
            if (mapData.terrain && typeof mapData.terrain.length === 'number' && !Array.isArray(mapData.terrain)) {
                dataToSave.terrain = Array.from(mapData.terrain)
            }

            localStorage.setItem(`exploration_map_data_${mapId}`, JSON.stringify(dataToSave))
        } catch (e) {
            console.error('保存地图数据失败:', e)
        }
    }

    // 加载地图数据
    const loadMapData = (mapId) => {
        try {
            const saved = localStorage.getItem(`exploration_map_data_${mapId}`)
            if (!saved) return null

            const parsed = JSON.parse(saved)

            // 校验数据的有效性: terrain 必须是数组
            // 如果是对象 {"0":...} 说明是损坏的旧数据，必须丢弃
            if (parsed.terrain && typeof parsed.terrain === 'object' && !Array.isArray(parsed.terrain)) {
                console.warn(`[Exploration] 地图 ${mapId} 数据损坏，重新生成`)
                localStorage.removeItem(`exploration_map_data_${mapId}`)
                return null
            }

            return parsed
        } catch (e) {
            console.error('加载地图数据失败:', e)
            return null
        }
    }

    // 保存玩家状态到 localStorage
    const savePlayerState = () => {
        if (!currentMapId.value) return

        const state = {
            position: playerPosition.value,
            previousPosition: previousPosition.value,
            direction: playerDirection.value,
            defeatedMonsters: defeatedMonsters.value,
            openedChests: openedChests.value,
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
            // 注意：我们通常不清除 map_data，除非玩家显式离开副本或者通关
            // 但如果这里是 forceReset (重新进入)，我们会覆盖 map_data
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
        clearPlayerState,

        // BOSS 和宝箱
        openedChests,
        bossDefeated,
        bossDirection,
        availableChests,
        checkBossCollision,
        checkChestCollision,
        openChest,
        saveBossDefeatTime,
        checkBossRespawn
    }
})
