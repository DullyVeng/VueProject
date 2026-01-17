import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import { getFabaoById } from '../data/fabaos'
import { getRarityConfig, calculateRarityStats } from '../data/fabaoRarity'
import { getRealmConfig } from '../data/fabaoRealms'
import { useDailyStore } from './daily'
import { DailyTaskType } from '../data/dailyTasks'
import {
    canPlaceFabao as canPlaceFabaoUtil,
    getFabaoOccupiedSlots,
    countGrids,
    rotateFabaoShape,
    removeOuterGrid
} from '../utils/dantianUtils'
import { fabaoShopItems } from '../data/fabaoShop'

export const useFabaoStore = defineStore('fabao', () => {
    const fabaos = ref([])  // 玩家拥有的所有法宝实例
    const loading = ref(false)
    const error = ref(null)
    const characterStore = useCharacterStore()

    // ==================== 计算属性 ====================

    // 丹田中的法宝（包括损毁的，方便用户释放）
    const dantianFabaos = computed(() =>
        fabaos.value.filter(f => f.isInDantian && f.dantianPosition)
    )

    // 已召唤的法宝
    const summonedFabaos = computed(() =>
        fabaos.value.filter(f => f.isSummoned && !f.isDamaged)
    )

    // 损毁的法宝
    const damagedFabaos = computed(() =>
        fabaos.value.filter(f => f.isDamaged)
    )

    // 可召唤的法宝（在丹田且未损毁且未召唤）
    const availableFabaos = computed(() =>
        fabaos.value.filter(f => f.isInDantian && f.dantianPosition && !f.isDamaged && !f.isSummoned)
    )

    // 计算当前丹田占用情况
    const dantianOccupancy = computed(() => {
        if (!characterStore.character) return { occupiedSlots: [], usage: { total: 0, used: 0, available: 0 } }

        const width = characterStore.character.dantian_width || 5
        const height = characterStore.character.dantian_height || 5
        const total = width * height

        // 收集所有已放置法宝占用的格子
        const occupiedSlots = []

        for (const fabao of dantianFabaos.value) {
            if (fabao.dantian_position) {
                const shape = fabao.current_shape || fabao.shape
                const slots = getFabaoOccupiedSlots(
                    shape,
                    fabao.dantian_position,
                    fabao.dantian_position.rotation || 0
                )
                occupiedSlots.push(...slots)
            }
        }

        return {
            occupiedSlots,
            width,
            height,
            usage: {
                total,
                used: occupiedSlots.length,
                available: total - occupiedSlots.length
            }
        }
    })

    // ==================== 核心方法 ====================

    /**
     * 获取玩家的所有法宝
     */
    async function fetchFabaos() {
        if (!characterStore.character) return

        loading.value = true
        error.value = null

        try {
            const { data, error: err } = await supabase
                .from('fabao_instances')
                .select('*')
                .eq('character_id', characterStore.character.id)

            if (err) throw err

            console.log('[fetchFabaos] 从数据库加载法宝数据:', data)

            // 合并静态数据和动态数据
            fabaos.value = data.map(instance => {
                const staticData = getFabaoById(instance.fabao_id)
                const rarityConfig = getRarityConfig(instance.rarity)
                const realmConfig = getRealmConfig(instance.realm)

                // 数据库中的属性是基础属性（已包含强化等）
                const baseAttack = instance.attack
                const baseDefense = instance.defense
                const baseMaxHp = instance.max_hp
                const baseHp = instance.hp

                // 计算温养加成（每级2%）
                const nourishLevel = instance.nourish_level || 0
                const nourishMultiplier = 1 + (nourishLevel * 0.02)

                // 计算最终属性（基础 * (1 + 温养加成)）
                const finalAttack = Math.floor(baseAttack * nourishMultiplier)
                const finalDefense = Math.floor(baseDefense * nourishMultiplier)
                const finalMaxHp = Math.floor(baseMaxHp * nourishMultiplier)

                // 修正：确保当前HP不超过最大HP
                // 如果数据库中的HP异常（超过max_hp），按比例缩放到正确范围
                let finalHp
                if (baseHp > baseMaxHp) {
                    // 数据异常，重置为满血
                    finalHp = finalMaxHp
                    console.warn(`[fetchFabaos] 法宝 ${staticData.name} HP异常修正: ${baseHp}/${baseMaxHp} -> ${finalHp}/${finalMaxHp}`)
                } else {
                    // 正常情况：保持生命值百分比
                    const hpPercentage = baseMaxHp > 0 ? baseHp / baseMaxHp : 1
                    finalHp = Math.floor(finalMaxHp * hpPercentage)
                }

                // 映射数据库字段名（snake_case）到前端字段名（camelCase）
                const fabao = {
                    ...staticData,       // 静态配置
                    ...instance,         // 数据库实例数据

                    // 显式映射关键字段
                    isInDantian: instance.is_in_dantian || false,
                    isDamaged: instance.is_damaged || false,
                    isSummoned: instance.is_summoned || false,
                    dantianPosition: instance.dantian_position || null,
                    nourishLevel: nourishLevel,
                    nourishStartTime: instance.nourish_start_time,
                    enhanceLevel: instance.enhance_level || 0,
                    maxEnhanceLevel: instance.max_enhance_level || 5,
                    currentShape: instance.current_shape,
                    originalGridCount: instance.original_grid_count,
                    currentGridCount: instance.current_grid_count,

                    // 保留基础属性（不含温养加成）
                    base_attack: instance.attack,
                    base_defense: instance.defense,
                    base_max_hp: instance.max_hp,
                    base_mp: instance.mp || staticData.baseStats?.mp || 100,
                    base_max_mp: instance.max_mp || staticData.baseStats?.max_mp || 100,

                    // 最终属性（包含温养加成） - 这些是战斗中实际使用的值
                    attack: finalAttack,
                    defense: finalDefense,
                    max_hp: finalMaxHp,
                    hp: finalHp,
                    mp: instance.mp || staticData.baseStats?.mp || 100,
                    max_mp: instance.max_mp || staticData.baseStats?.max_mp || 100,

                    // 技能选择（战斗用）
                    selectedSkill: null,

                    rarityConfig,        // 稀有度配置
                    realmConfig,         // 境界配置

                    // 兼容字段（保留 snake_case 以防万一）
                    is_in_dantian: instance.is_in_dantian,
                    dantian_position: instance.dantian_position,
                    is_damaged: instance.is_damaged,
                    is_summoned: instance.is_summoned
                }

                // 打印加载的法宝信息
                if (fabao.isInDantian) {
                    console.log(`  - 法宝 ${fabao.name} 在丹田中，位置:`, fabao.dantianPosition)
                }

                // 打印温养加成信息
                if (nourishLevel > 0) {
                    console.log(`  - 法宝 ${fabao.name} 温养 Lv.${nourishLevel}，` +
                        `攻击: ${baseAttack} → ${finalAttack} (+${finalAttack - baseAttack})，` +
                        `防御: ${baseDefense} → ${finalDefense} (+${finalDefense - baseDefense})，` +
                        `生命: ${baseMaxHp} → ${finalMaxHp} (+${finalMaxHp - baseMaxHp})`)
                }

                return fabao
            })

            console.log(`[fetchFabaos] 加载完成，共 ${fabaos.value.length} 个法宝`)

            // 自动检查并更新所有正在温养的法宝等级
            const nourishingFabaos = fabaos.value.filter(f => f.nourish_start_time)
            if (nourishingFabaos.length > 0) {
                console.log(`[fetchFabaos] 检查 ${nourishingFabaos.length} 个正在温养的法宝等级...`)
                for (const fabao of nourishingFabaos) {
                    await updateNourishLevel(fabao.id)
                }
            }
        } catch (err) {
            console.error('获取法宝失败:', err)
            error.value = err.message
        } finally {
            loading.value = false
        }
    }

    /**
     * 添加新法宝
     */
    async function addFabao(fabaoId, realm = '灵器', rarity = 'common') {
        if (!characterStore.character) return

        const staticData = getFabaoById(fabaoId)
        if (!staticData) {
            console.error('法宝ID不存在:', fabaoId)
            return
        }

        const rarityConfig = getRarityConfig(rarity)
        const realmConfig = getRealmConfig(realm)
        const finalStats = calculateRarityStats(staticData.baseStats, rarity)

        try {
            const { data, error: err } = await supabase
                .from('fabao_instances')
                .insert({
                    character_id: characterStore.character.id,
                    fabao_id: fabaoId,
                    realm,
                    rarity,
                    hp: finalStats.hp,
                    max_hp: finalStats.hp,
                    attack: finalStats.attack,
                    defense: finalStats.defense,
                    max_enhance_level: realmConfig.maxEnhanceLevel,
                    current_shape: staticData.shape,
                    original_grid_count: countGrids(staticData.shape),
                    current_grid_count: countGrids(staticData.shape),
                    // 明确设置新法宝为未装备状态
                    is_in_dantian: false,
                    dantian_position: null,
                    is_damaged: false,
                    is_summoned: false
                })
                .select()
                .single()

            if (err) throw err

            // 添加到本地数组
            fabaos.value.push({
                ...staticData,
                ...data,
                rarityConfig,
                realmConfig,
                nourishBonus: { level: 0, hpBonus: 0, attackBonus: 0, defenseBonus: 0 },
                finalStats,
                // 确保本地状态也是未装备
                isInDantian: false,
                isDamaged: false,
                isSummoned: false,
                dantianPosition: null
            })

            return data
        } catch (err) {
            console.error('添加法宝失败:', err)
            error.value = err.message
        }
    }

    /**
   * 放置法宝到丹田
   */
    async function placeFabaoInDantian(fabaoId, position, rotation = 0) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) return { success: false, reason: '法宝不存在' }

        const shape = fabao.current_shape || fabao.shape

        // 特殊处理：卸下法宝（position.x === -1 && position.y === -1）
        const isUnloading = position.x === -1 && position.y === -1

        // 如果不是卸下操作，进行碰撞检测
        if (!isUnloading) {
            // 构建排除自身的丹田数据
            const dantianData = {
                width: characterStore.character?.dantian_width || 5,
                height: characterStore.character?.dantian_height || 5,
                occupiedSlots: []
            }

            // 收集其他法宝的占用格子（排除当前法宝）
            for (const f of fabaos.value) {
                if (f.id === fabaoId) continue  // 跳过自身
                if (!f.isInDantian || !f.dantian_position) continue

                const fShape = getCurrentRotatedShape(f)
                const fPos = f.dantian_position

                for (let row = 0; row < fShape.length; row++) {
                    for (let col = 0; col < fShape[row].length; col++) {
                        if (fShape[row][col] === 1) {
                            dantianData.occupiedSlots.push({
                                x: fPos.x + col,
                                y: fPos.y + row
                            })
                        }
                    }
                }
            }

            // 使用排除自身后的碰撞检测
            if (!canPlaceFabaoUtil(dantianData, shape, position, rotation)) {
                return { success: false, reason: '位置不合法或已被占用' }
            }
        }

        try {
            const { error: err } = await supabase
                .from('fabao_instances')
                .update({
                    is_in_dantian: !isUnloading,
                    dantian_position: isUnloading ? null : { x: position.x, y: position.y, rotation }
                })
                .eq('id', fabaoId)

            if (err) throw err

            // 更新本地状态
            fabao.isInDantian = !isUnloading
            fabao.dantian_position = isUnloading ? null : { x: position.x, y: position.y, rotation }

            return { success: true }
        } catch (err) {
            console.error('放置法宝失败:', err)
            return { success: false, reason: err.message }
        }

        // 辅助函数：获取旋转后的形状
        function getCurrentRotatedShape(fabao) {
            if (!fabao.dantian_position) return fabao.current_shape || fabao.shape
            const rotation = fabao.dantian_position.rotation || 0
            return rotateFabaoShape(fabao.current_shape || fabao.shape, rotation)
        }
    }

    /**
     * 召唤法宝到战场
     */
    async function summonFabao(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) return { success: false, reason: '法宝不存在' }

        if (fabao.isDamaged) return { success: false, reason: '法宝已损毁，需要修复' }
        if (fabao.isSummoned) return { success: false, reason: '法宝已召唤' }

        // 检查行动点
        const currentAP = characterStore.character.current_action_points || 0
        const summonCost = fabao.summonCost || 3

        if (currentAP < summonCost) {
            return { success: false, reason: '行动点不足' }
        }

        try {
            // 更新法宝状态
            const { error: err1 } = await supabase
                .from('fabao_instances')
                .update({ is_summoned: true })
                .eq('id', fabaoId)

            if (err1) throw err1

            // 扣除行动点
            const newAP = currentAP - summonCost
            const { error: err2 } = await supabase
                .from('characters')
                .update({ current_action_points: newAP })
                .eq('id', characterStore.character.id)

            if (err2) throw err2

            // 更新本地状态
            fabao.isSummoned = true
            characterStore.character.current_action_points = newAP

            return { success: true, fabao }
        } catch (err) {
            console.error('召唤法宝失败:', err)
            return { success: false, reason: err.message }
        }
    }

    /**
     * 法宝被击败，进入损毁状态
     */
    async function damageFabao(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) return

        try {
            const { error: err } = await supabase
                .from('fabao_instances')
                .update({
                    is_damaged: true,
                    is_summoned: false,
                    hp: 0
                })
                .eq('id', fabaoId)

            if (err) throw err

            fabao.isDamaged = true
            fabao.isSummoned = false
            fabao.hp = 0
        } catch (err) {
            console.error('法宝损毁失败:', err)
        }
    }

    /**
     * 计算法宝修复消耗
     */
    function calculateRepairCost(fabao) {
        const qualityCosts = {
            common: 10,
            rare: 30,
            epic: 100,
            legendary: 300
        }
        return qualityCosts[fabao.quality] || 50
    }

    /**
     * 修复法宝
     */
    async function repairFabao(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) return { success: false, reason: '法宝不存在' }

        if (!fabao.isDamaged) {
            return { success: false, reason: '法宝未损毁，无需修复' }
        }

        // 计算修复成本（基于品质）
        const repairCost = calculateRepairCost(fabao)
        const currentSilver = characterStore.character.silver || 0

        if (currentSilver < repairCost) {
            return {
                success: false,
                reason: `灵石不足，需要${repairCost}灵石，当前${currentSilver}灵石`,
                cost: repairCost
            }
        }

        try {
            // 修复法宝
            const { error: err1 } = await supabase
                .from('fabao_instances')
                .update({
                    is_damaged: false,
                    hp: fabao.max_hp
                })
                .eq('id', fabaoId)

            if (err1) throw err1

            // 扣除灵石
            const { error: err2 } = await supabase
                .from('characters')
                .update({ silver: currentSilver - repairCost })
                .eq('id', characterStore.character.id)

            if (err2) throw err2

            // 更新本地状态
            fabao.isDamaged = false
            fabao.is_damaged = false
            fabao.hp = fabao.max_hp
            characterStore.character.silver = currentSilver - repairCost

            return { success: true, cost: repairCost }
        } catch (err) {
            console.error('修复法宝失败:', err)
            return { success: false, reason: '修复失败，请重试' }
        }
    }

    /**
     * 出售法宝
     */
    async function sellFabao(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) return { success: false, reason: '法宝不存在' }
        if (fabao.isInDantian) return { success: false, reason: '丹田中的法宝不能出售' }

        const sellPrice = calculateSellPrice(fabao)

        try {
            const { error: err } = await supabase
                .from('fabao_instances')
                .delete()
                .eq('id', fabaoId)

            if (err) throw err

            // 获得灵石
            await characterStore.gainSilver(sellPrice)

            // 从本地数组移除
            const index = fabaos.value.findIndex(f => f.id === fabaoId)
            if (index !== -1) {
                fabaos.value.splice(index, 1)
            }

            return { success: true, price: sellPrice }
        } catch (err) {
            console.error('出售法宝失败:', err)
            return { success: false, reason: err.message }
        }
    }

    /**
     * 计算法宝出售价格
     */
    function calculateSellPrice(fabao) {
        // 如果商店里有买，按买价的40%
        const shopItem = fabaoShopItems.find(i => i.fabaoId === fabao.fabao_id)
        if (shopItem) {
            return Math.floor(shopItem.price * 0.4)
        }

        // 默认按品阶和境界计算
        const rarityWeights = { common: 1, fine: 2, rare: 4, epic: 8, legendary: 20 }
        const realmWeights = { '灵器': 100, '真器': 300, '宝器': 800, '灵宝': 2000 }

        const rarityBonus = rarityWeights[fabao.rarity] || 1
        const realmBase = realmWeights[fabao.realm] || 100

        // 加上强化等级的价值
        const enhanceValue = (fabao.enhance_level || 0) * 100

        return Math.floor(realmBase * rarityBonus * 0.5) + enhanceValue
    }

    /**
   * 强化法宝
   */
    async function enhanceFabao(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) return { success: false, reason: '法宝不存在' }

        // 检查是否可强化
        if (fabao.enhance_level >= fabao.max_enhance_level) {
            return { success: false, reason: '已达强化上限' }
        }

        if (fabao.current_grid_count <= 1) {
            return { success: false, reason: '格子数不足，无法继续强化' }
        }

        // 计算强化成本
        const costFormula = (level) => 100 * Math.pow(1.5, level)
        const cost = Math.floor(costFormula(fabao.enhance_level))

        const currentSilver = characterStore.character.silver || 0
        if (currentSilver < cost) {
            return { success: false, reason: `灵石不足，需要${cost}灵石` }
        }

        // 计算成功率（受气运影响）
        const fortune = characterStore.character.fortune || 5
        const baseRate = 1.0 - (fabao.enhance_level * 0.05)
        const fortuneBonus = fortune * 0.005
        const successRate = Math.min(0.95, baseRate + fortuneBonus)

        // 强化判定
        const isSuccess = Math.random() <= successRate

        try {
            if (isSuccess) {
                // 强化成功：随机消除最外层一格
                const currentShape = fabao.current_shape || fabao.shape
                const newShape = removeOuterGrid(currentShape)
                const newGridCount = countGrids(newShape)

                // 计算属性提升
                const statBonus = {
                    hp: 0.1,
                    attack: 0.08,
                    defense: 0.06
                }

                const newMaxHp = Math.floor(fabao.max_hp * (1 + statBonus.hp))
                const newAttack = Math.floor(fabao.attack * (1 + statBonus.attack))
                const newDefense = Math.floor(fabao.defense * (1 + statBonus.defense))

                // 更新数据库
                const { error: err } = await supabase
                    .from('fabao_instances')
                    .update({
                        enhance_level: fabao.enhance_level + 1,
                        current_shape: newShape,
                        current_grid_count: newGridCount,
                        max_hp: newMaxHp,
                        hp: newMaxHp,
                        attack: newAttack,
                        defense: newDefense
                    })
                    .eq('id', fabaoId)

                if (err) throw err

                // 扣除灵石
                await supabase
                    .from('characters')
                    .update({ silver: currentSilver - cost })
                    .eq('id', characterStore.character.id)

                // 更新本地状态
                fabao.enhance_level++
                fabao.current_shape = newShape
                fabao.current_grid_count = newGridCount
                fabao.max_hp = newMaxHp
                fabao.hp = newMaxHp
                fabao.attack = newAttack
                fabao.defense = newDefense
                characterStore.character.silver = currentSilver - cost

                // 更新每日任务进度
                const dailyStore = useDailyStore()
                await dailyStore.updateProgress(DailyTaskType.ENHANCE_FABAO, 'any', 1)

                return {
                    success: true,
                    cost,
                    newShape,
                    newStats: { hp: newMaxHp, attack: newAttack, defense: newDefense }
                }
            } else {
                // 强化失败：仍然消耗灵石
                await supabase
                    .from('characters')
                    .update({ silver: currentSilver - cost })
                    .eq('id', characterStore.character.id)

                characterStore.character.silver = currentSilver - cost

                // 更新每日任务进度（失败也计数）
                const dailyStore = useDailyStore()
                await dailyStore.updateProgress(DailyTaskType.ENHANCE_FABAO, 'any', 1)

                return { success: false, reason: '强化失败', cost }
            }
        } catch (err) {
            return { success: false, reason: err.message }
        }
    }

    /**
     * 恢复所有法宝状态（客栈休息用）
     * @param {number} percentage 恢复比例 (0.5 或 1.0)
     */
    async function restoreAllFabaos(percentage = 1.0) {
        if (!characterStore.character) return

        const updates = []

        for (const fabao of fabaos.value) {
            // 跳过已损毁的法宝
            if (fabao.isDamaged) continue

            // 跳过满状态的法宝
            const currentMp = fabao.mp || 0
            const maxMp = fabao.max_mp || 100 // 默认值

            if (fabao.hp >= fabao.max_hp && currentMp >= maxMp) continue

            let newHp = fabao.max_hp
            let newMp = maxMp

            if (percentage < 1.0) {
                // 部分恢复：增加 50% max_hp/mp，但不超过上限
                const healHp = Math.floor(fabao.max_hp * percentage)
                const healMp = Math.floor(maxMp * percentage)

                newHp = Math.min(fabao.max_hp, fabao.hp + healHp)
                newMp = Math.min(maxMp, currentMp + healMp)
            }

            updates.push({
                id: fabao.id,
                hp: newHp,
                mp: newMp
            })

            // 更新本地状态
            fabao.hp = newHp
            fabao.mp = newMp
        }

        if (updates.length > 0) {
            // 循环更新数据库
            for (const update of updates) {
                await supabase
                    .from('fabao_instances')
                    .update({ hp: update.hp, mp: update.mp })
                    .eq('id', update.id)
            }
            console.log(`[FabaoStore] 已恢复 ${updates.length} 个法宝的状态`)
        }
    }

    /**
     * 仅恢复所有法宝的MP（战斗结束用）
     */
    async function restoreAllFabaosMp() {
        if (!characterStore.character) return

        const updates = []

        for (const fabao of fabaos.value) {
            // 跳过已损毁的法宝
            if (fabao.isDamaged) continue

            // 跳过满MP的法宝
            const currentMp = fabao.mp || 0
            const maxMp = fabao.max_mp || 100

            if (currentMp >= maxMp) continue

            const newMp = maxMp

            updates.push({
                id: fabao.id,
                mp: newMp
            })

            // 更新本地状态
            fabao.mp = newMp
        }

        if (updates.length > 0) {
            // 循环更新数据库（只更新MP）
            for (const update of updates) {
                await supabase
                    .from('fabao_instances')
                    .update({ mp: update.mp })
                    .eq('id', update.id)
            }
            console.log(`[FabaoStore] 已恢复 ${updates.length} 个法宝的灵力`)
        }
    }

    // ==================== 辅助函数 ====================

    /**
     * 计算温养加成（基于累积时间）
     */
    function calculateNourishBonus(instance) {
        // 计算总累积时间（秒）
        let totalSeconds = instance.nourish_accumulated_seconds || 0

        // 如果正在温养中，加上当前这次的时间
        if (instance.nourish_start_time) {
            const now = new Date().getTime()
            const startTime = new Date(instance.nourish_start_time).getTime()
            const currentElapsed = (now - startTime) / 1000  // 秒
            totalSeconds += currentElapsed
        }

        // 温养等级（每24小时升1级，累计计算）
        const levelUpTime = [
            24 * 3600,   // 0→1级: 1天
            48 * 3600,   // 1→2级: 累计2天
            72 * 3600,   // 2→3级: 累计3天
            96 * 3600,   // 3→4级: 累计4天
            120 * 3600,  // 4→5级: 累计5天
            144 * 3600,  // 5→6级: 累计6天
            168 * 3600,  // 6→7级: 累计7天
            192 * 3600,  // 7→8级: 累计8天
            216 * 3600,  // 8→9级: 累计9天
            240 * 3600   // 9→10级: 累计10天
        ]

        let level = 0
        for (let i = 0; i < levelUpTime.length; i++) {
            if (totalSeconds >= levelUpTime[i]) {
                level = i + 1
            } else {
                break
            }
        }

        // 每级加成
        const bonusPerLevel = {
            hp: 5,       // 每级+5% 最大生命
            attack: 3,   // 每级+3% 攻击
            defense: 2   // 每级+2% 防御
        }

        return {
            level,
            totalSeconds,
            hpBonus: level * bonusPerLevel.hp,
            attackBonus: level * bonusPerLevel.attack,
            defenseBonus: level * bonusPerLevel.defense
        }
    }

    /**
     * 计算最终属性
     */
    function calculateFinalStats(instance, staticData, rarityConfig, nourishBonus) {
        const baseStats = calculateRarityStats(staticData.baseStats, instance.rarity)

        return {
            hp: Math.floor(baseStats.hp * (1 + nourishBonus.hpBonus / 100)),
            attack: Math.floor(baseStats.attack * (1 + nourishBonus.attackBonus / 100)),
            defense: Math.floor(baseStats.defense * (1 + nourishBonus.defenseBonus / 100))
        }
    }

    /**
     * 计算形状占用的格子数
     */
    function countGrids(shape) {
        let count = 0
        for (const row of shape) {
            for (const cell of row) {
                if (cell === 1) count++
            }
        }
        return count
    }

    /**
     * 计算温养加成
     */
    function calculateNourishBonus(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao || !fabao.nourish_level) {
            return { attack: 0, defense: 0, hp: 0 }
        }

        // 每级温养提供的加成百分比
        const bonusPerLevel = 0.02 // 2%每级
        const totalBonus = fabao.nourish_level * bonusPerLevel

        // 使用基础属性计算加成，避免循环计算
        return {
            attack: Math.floor((fabao.base_attack || fabao.attack) * totalBonus),
            defense: Math.floor((fabao.base_defense || fabao.defense) * totalBonus),
            hp: Math.floor((fabao.base_max_hp || fabao.max_hp) * totalBonus)
        }
    }

    /**
     * 更新温养等级（基于累积时间自动升级）
     */
    async function updateNourishLevel(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) return

        // 直接计算温养等级（使用累积时间计算，而不是调用第二个同名函数）
        let totalSeconds = fabao.nourish_accumulated_seconds || 0

        // 如果正在温养中，加上当前这次的时间
        if (fabao.nourish_start_time) {
            const now = new Date().getTime()
            const startTime = new Date(fabao.nourish_start_time).getTime()
            const currentElapsed = (now - startTime) / 1000  // 秒
            totalSeconds += currentElapsed
        }

        // 温养等级（每24小时升1级，累计计算）
        const levelUpTime = [
            24 * 3600,   // 0→1级: 1天
            48 * 3600,   // 1→2级: 累计2天
            72 * 3600,   // 2→3级: 累计3天
            96 * 3600,   // 3→4级: 累计4天
            120 * 3600,  // 4→5级: 累计5天
            144 * 3600,  // 5→6级: 累计6天
            168 * 3600,  // 6→7级: 累计7天
            192 * 3600,  // 7→8级: 累计8天
            216 * 3600,  // 8→9级: 累计9天
            240 * 3600   // 9→10级: 累计10天
        ]

        let newLevel = 0
        for (let i = 0; i < levelUpTime.length; i++) {
            if (totalSeconds >= levelUpTime[i]) {
                newLevel = i + 1
            } else {
                break
            }
        }

        // 如果等级变化了，更新数据库
        if (newLevel !== fabao.nourish_level) {
            const { error } = await supabase
                .from('fabao_instances')
                .update({ nourish_level: newLevel })
                .eq('id', fabaoId)

            if (!error) {
                fabao.nourish_level = newLevel
                fabao.nourishLevel = newLevel
                console.log(`[updateNourishLevel] 法宝 ${fabao.name} 温养等级提升至 ${newLevel}`)
            }
        }
    }

    /**
     * 开始温养法宝
     */
    async function startNourish(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao) {
            return { success: false, reason: '法宝不存在' }
        }

        if (fabao.isDamaged) {
            return { success: false, reason: '法宝已损毁，无法温养' }
        }

        if (!fabao.isInDantian) {
            return { success: false, reason: '法宝需要在丹田中才能温养' }
        }

        if (fabao.nourish_start_time) {
            return { success: false, reason: '法宝已在温养中' }
        }

        // 设置温养开始时间（不重置累积时间）
        const now = new Date().toISOString()

        const { error } = await supabase
            .from('fabao_instances')
            .update({
                nourish_start_time: now
            })
            .eq('id', fabaoId)

        if (error) {
            console.error('[startNourish] 数据库错误:', error)
            return { success: false, reason: '数据库更新失败' }
        }

        // 更新本地状态
        fabao.nourish_start_time = now
        fabao.nourishStartTime = now

        return { success: true }
    }

    /**
     * 停止温养法宝（保存累积时间）
     */
    async function stopNourish(fabaoId) {
        const fabao = fabaos.value.find(f => f.id === fabaoId)
        if (!fabao || !fabao.nourish_start_time) {
            return { success: false, reason: '法宝未在温养中' }
        }

        // 计算本次温养时长
        const now = new Date().getTime()
        const startTime = new Date(fabao.nourish_start_time).getTime()
        const elapsed = Math.floor((now - startTime) / 1000)  // 秒

        // 累加到总时间
        const accumulatedSeconds = (fabao.nourish_accumulated_seconds || 0) + elapsed

        // 直接计算温养等级（使用累积时间计算）
        const levelUpTime = [
            24 * 3600,   // 0→1级: 1天
            48 * 3600,   // 1→2级: 累计2天
            72 * 3600,   // 2→3级: 累计3天
            96 * 3600,   // 3→4级: 累计4天
            120 * 3600,  // 4→5级: 累计5天
            144 * 3600,  // 5→6级: 累计6天
            168 * 3600,  // 6→7级: 累计7天
            192 * 3600,  // 7→8级: 累计8天
            216 * 3600,  // 8→9级: 累计9天
            240 * 3600   // 9→10级: 累计10天
        ]

        let newLevel = 0
        for (let i = 0; i < levelUpTime.length; i++) {
            if (accumulatedSeconds >= levelUpTime[i]) {
                newLevel = i + 1
            } else {
                break
            }
        }

        // 更新数据库：保存累积时间、清除开始时间、更新等级
        const { error } = await supabase
            .from('fabao_instances')
            .update({
                nourish_start_time: null,
                nourish_accumulated_seconds: accumulatedSeconds,
                nourish_level: newLevel
            })
            .eq('id', fabaoId)

        if (error) {
            console.error('[stopNourish] 数据库错误:', error)
            return { success: false, reason: '数据库更新失败' }
        }

        // 更新本地状态
        fabao.nourish_start_time = null
        fabao.nourishStartTime = null
        fabao.nourish_accumulated_seconds = accumulatedSeconds
        fabao.nourish_level = newLevel
        fabao.nourishLevel = newLevel

        console.log(`[stopNourish] 法宝 ${fabao.name} 停止温养，累积 ${accumulatedSeconds} 秒，等级 ${newLevel}`)

        return { success: true, accumulatedSeconds, level: newLevel }
    }

    return {
        fabaos,
        loading,
        error,
        dantianFabaos,
        summonedFabaos,
        damagedFabaos,
        availableFabaos,
        dantianOccupancy,
        fetchFabaos,
        addFabao,
        placeFabaoInDantian,
        calculateRepairCost,
        repairFabao,
        sellFabao,
        calculateSellPrice,
        enhanceFabao,
        calculateNourishBonus,
        updateNourishLevel,
        startNourish,
        stopNourish,
        summonFabao,
        damageFabao,
        restoreAllFabaos,
        restoreAllFabaosMp
    }
})
