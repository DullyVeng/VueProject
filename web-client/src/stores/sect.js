// 宗门状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SECT_LEVELS, getSectLevelByNumber, getNextSectLevel, checkUpgradeRequirements } from '../data/sectLevels'
import { getAvailablePlots, canBuildOnPlot } from '../data/sectPlots'
import { getBuildingConfig, canBuild, getUpgradeCost, REGULAR_BUILDINGS, SPECIAL_BUILDINGS } from '../data/sectBuildings'
import { SECT_FOUNDATION_COST, validateSectName as validateName, SECT_NAME_RULES } from '../data/sectConfig'
import { supabase } from '../supabase/client'

// 建筑状态枚举
export const BUILDING_STATUS = {
    BUILDING: 'building',    // 建造中
    ACTIVE: 'active',        // 正常运行
    SUSPENDED: 'suspended'   // 暂停（维护不足）
}

export const useSectStore = defineStore('sect', () => {
    // ========== 状态 ==========

    // 宗门基本信息
    const sectName = ref('无名宗')
    const sectLevelId = ref('chuangcao')
    const sectLevel = ref(1)

    // 上次维护检查时间
    const lastMaintenanceCheck = ref(Date.now())

    // 数据库同步相关
    const sectId = ref(null)           // 数据库中的宗门ID
    const characterId = ref(null)      // 关联的角色ID
    const isSyncing = ref(false)       // 同步状态标识
    const lastSyncTime = ref(null)     // 最后同步时间
    const isFounded = ref(false)       // 宗门是否已开启

    // 宗门材料仓库
    const materials = ref({
        wood: 100,
        stone: 50,
        iron: 20,
        jade: 0,
        formationFlag: 0,
        spiritStone: 50
    })

    // 仓库等级
    const warehouseLevel = ref(1)
    const warehouseCapacity = computed(() => {
        const capacities = { 1: 500, 2: 1000, 3: 2000, 4: 5000, 5: 10000 }
        return capacities[warehouseLevel.value] || 500
    })

    // 已解锁的建筑图纸
    const unlockedBlueprints = ref([])

    // 已建造的建筑
    // { plotId: { buildingId, level, status, buildStartTime, lastCollectTime, lastMaintenanceTime } }
    const buildings = ref({})

    // 弟子列表
    const disciples = ref([])

    // ========== 计算属性 ==========

    const currentLevelConfig = computed(() => getSectLevelByNumber(sectLevel.value))
    const nextLevelConfig = computed(() => getNextSectLevel(sectLevelId.value))
    const availablePlots = computed(() => getAvailablePlots(sectLevel.value))
    const builtBuildingsCount = computed(() => Object.keys(buildings.value).length)
    const discipleCount = computed(() => disciples.value.length)

    const disciplesByRealm = computed(() => {
        const counts = {}
        disciples.value.forEach(d => {
            counts[d.realm] = (counts[d.realm] || 0) + 1
        })
        return counts
    })

    const upgradeCheck = computed(() => {
        return checkUpgradeRequirements(
            nextLevelConfig.value,
            materials.value,
            discipleCount.value,
            disciplesByRealm.value
        )
    })

    const totalMaterials = computed(() => {
        return Object.values(materials.value).reduce((sum, val) => sum + val, 0)
    })

    const isWarehouseFull = computed(() => totalMaterials.value >= warehouseCapacity.value)

    // 建造中的建筑数量
    const buildingInProgressCount = computed(() => {
        return Object.values(buildings.value).filter(b => b.status === BUILDING_STATUS.BUILDING).length
    })

    // 暂停的建筑列表
    const suspendedBuildings = computed(() => {
        return Object.entries(buildings.value)
            .filter(([_, b]) => b.status === BUILDING_STATUS.SUSPENDED)
            .map(([plotId, b]) => ({ plotId, ...b }))
    })

    // ========== 方法 ==========

    function setSectName(name) {
        sectName.value = name
    }

    function addMaterial(materialType, amount) {
        if (!materials.value.hasOwnProperty(materialType)) {
            console.warn(`未知材料类型: ${materialType}`)
            return false
        }

        const currentTotal = totalMaterials.value
        const newTotal = currentTotal + amount

        if (newTotal > warehouseCapacity.value) {
            const canAdd = warehouseCapacity.value - currentTotal
            if (canAdd > 0) {
                materials.value[materialType] += canAdd
                return canAdd
            }
            return 0
        }

        materials.value[materialType] += amount
        return amount
    }

    function consumeMaterial(materialType, amount) {
        if (!materials.value.hasOwnProperty(materialType)) {
            return false
        }
        if (materials.value[materialType] < amount) {
            return false
        }
        materials.value[materialType] -= amount
        return true
    }

    function consumeMaterials(costObj) {
        for (const [material, amount] of Object.entries(costObj)) {
            if (!materials.value.hasOwnProperty(material) || materials.value[material] < amount) {
                return { success: false, missing: material }
            }
        }
        for (const [material, amount] of Object.entries(costObj)) {
            materials.value[material] -= amount
        }
        return { success: true }
    }

    // 检查是否有足够材料（不扣除）
    function hasMaterials(costObj) {
        for (const [material, amount] of Object.entries(costObj)) {
            if (!materials.value.hasOwnProperty(material) || materials.value[material] < amount) {
                return { enough: false, missing: material }
            }
        }
        return { enough: true }
    }

    function unlockBlueprint(blueprintId) {
        if (!unlockedBlueprints.value.includes(blueprintId)) {
            unlockedBlueprints.value.push(blueprintId)
            return true
        }
        return false
    }

    function isBlueprintUnlocked(blueprintId) {
        return unlockedBlueprints.value.includes(blueprintId)
    }

    // 开始建造建筑（进入建造中状态）
    function startBuildBuilding(plotId, buildingId) {
        if (buildings.value[plotId]) {
            return { success: false, reason: '该地块已有建筑' }
        }

        const buildingConfig = getBuildingConfig(buildingId)
        if (!buildingConfig) {
            return { success: false, reason: '建筑不存在' }
        }

        const buildCheck = canBuild(buildingId, sectLevel.value, unlockedBlueprints.value)
        if (!buildCheck.canBuild) {
            return { success: false, reason: buildCheck.reason }
        }

        const costResult = consumeMaterials(buildingConfig.buildCost)
        if (!costResult.success) {
            return { success: false, reason: `材料不足: ${costResult.missing}` }
        }

        const now = Date.now()
        buildings.value[plotId] = {
            buildingId,
            level: 1,
            status: BUILDING_STATUS.BUILDING,
            buildStartTime: now,
            buildEndTime: now + (buildingConfig.buildTime * 1000),
            lastCollectTime: null,
            lastMaintenanceTime: null
        }

        return {
            success: true,
            buildTime: buildingConfig.buildTime,
            buildEndTime: now + (buildingConfig.buildTime * 1000)
        }
    }

    // 检查建造进度
    function checkBuildProgress(plotId) {
        const building = buildings.value[plotId]
        if (!building) return null

        if (building.status !== BUILDING_STATUS.BUILDING) {
            return { completed: true, status: building.status }
        }

        const now = Date.now()
        const remaining = building.buildEndTime - now

        if (remaining <= 0) {
            // 建造完成，激活建筑
            building.status = BUILDING_STATUS.ACTIVE
            building.lastCollectTime = now
            building.lastMaintenanceTime = now
            return { completed: true, status: BUILDING_STATUS.ACTIVE }
        }

        return {
            completed: false,
            remainingSeconds: Math.ceil(remaining / 1000),
            progress: 1 - (remaining / (building.buildEndTime - building.buildStartTime))
        }
    }

    // 取消建造（不返还材料）
    function cancelBuilding(plotId) {
        const building = buildings.value[plotId]
        if (!building) {
            return { success: false, reason: '该地块没有建筑' }
        }

        if (building.status !== BUILDING_STATUS.BUILDING) {
            return { success: false, reason: '只能取消建造中的建筑' }
        }

        delete buildings.value[plotId]
        return { success: true, message: '已取消建造，材料不返还' }
    }

    // 拆除建筑（不返还材料）
    function demolishBuilding(plotId) {
        const building = buildings.value[plotId]
        if (!building) {
            return { success: false, reason: '该地块没有建筑' }
        }

        // 建造中的建筑使用取消功能
        if (building.status === BUILDING_STATUS.BUILDING) {
            return { success: false, reason: '建造中的建筑请使用取消功能' }
        }

        const buildingConfig = getBuildingConfig(building.buildingId)
        delete buildings.value[plotId]
        return { success: true, message: `已拆除${buildingConfig.name}，材料不返还` }
    }

    // 执行每日维护检查
    function performMaintenanceCheck() {
        const now = Date.now()
        const oneDayMs = 24 * 60 * 60 * 1000

        // 检查是否需要进行维护（每天一次）
        if (now - lastMaintenanceCheck.value < oneDayMs) {
            return { checked: false, reason: '今日已检查' }
        }

        const results = []

        for (const [plotId, building] of Object.entries(buildings.value)) {
            // 跳过建造中的建筑
            if (building.status === BUILDING_STATUS.BUILDING) continue

            const config = getBuildingConfig(building.buildingId)
            if (!config.maintenanceCost) continue

            const hasEnough = hasMaterials(config.maintenanceCost)

            if (hasEnough.enough) {
                // 扣除维护费用
                consumeMaterials(config.maintenanceCost)
                building.lastMaintenanceTime = now
                results.push({ plotId, name: config.name, success: true })
            } else {
                // 材料不足，暂停建筑
                building.status = BUILDING_STATUS.SUSPENDED
                results.push({
                    plotId,
                    name: config.name,
                    success: false,
                    missing: hasEnough.missing
                })
            }
        }

        lastMaintenanceCheck.value = now
        return { checked: true, results }
    }

    // 恢复暂停的建筑（手动支付维护费用）
    function resumeBuilding(plotId) {
        const building = buildings.value[plotId]
        if (!building) {
            return { success: false, reason: '该地块没有建筑' }
        }

        if (building.status !== BUILDING_STATUS.SUSPENDED) {
            return { success: false, reason: '该建筑未处于暂停状态' }
        }

        const config = getBuildingConfig(building.buildingId)
        if (!config.maintenanceCost) {
            building.status = BUILDING_STATUS.ACTIVE
            return { success: true }
        }

        const costResult = consumeMaterials(config.maintenanceCost)
        if (!costResult.success) {
            return { success: false, reason: `维护材料不足: ${costResult.missing}` }
        }

        building.status = BUILDING_STATUS.ACTIVE
        building.lastMaintenanceTime = Date.now()

        return { success: true, message: `${config.name}已恢复运行` }
    }

    // 升级建筑
    function upgradeBuilding(plotId) {
        const building = buildings.value[plotId]
        if (!building) {
            return { success: false, reason: '该地块没有建筑' }
        }

        if (building.status !== BUILDING_STATUS.ACTIVE) {
            return { success: false, reason: '只能升级正常运行的建筑' }
        }

        const buildingConfig = getBuildingConfig(building.buildingId)
        if (building.level >= buildingConfig.maxLevel) {
            return { success: false, reason: '已达最高等级' }
        }

        const upgradeCost = getUpgradeCost(building.buildingId, building.level)
        const costResult = consumeMaterials(upgradeCost)
        if (!costResult.success) {
            return { success: false, reason: `材料不足: ${costResult.missing}` }
        }

        building.level += 1
        return { success: true, newLevel: building.level }
    }

    // 升级宗门
    function upgradeSect() {
        if (!upgradeCheck.value.canUpgrade) {
            return { success: false, missing: upgradeCheck.value.missing }
        }

        const nextLevel = nextLevelConfig.value

        if (nextLevel.requirements.materials) {
            const costResult = consumeMaterials(nextLevel.requirements.materials)
            if (!costResult.success) {
                return { success: false, reason: `材料不足: ${costResult.missing}` }
            }
        }

        sectLevelId.value = nextLevel.id
        sectLevel.value = nextLevel.level

        return { success: true, newLevel: sectLevel.value, newLevelName: nextLevel.name }
    }

    // 升级仓库
    function upgradeWarehouse() {
        if (warehouseLevel.value >= 5) {
            return { success: false, reason: '仓库已达最高等级' }
        }

        const costs = {
            2: { wood: 100, stone: 100 },
            3: { wood: 300, stone: 300 },
            4: { jade: 50 },
            5: { jade: 100 }
        }

        const nextLevel = warehouseLevel.value + 1
        const cost = costs[nextLevel]

        const costResult = consumeMaterials(cost)
        if (!costResult.success) {
            return { success: false, reason: `材料不足: ${costResult.missing}` }
        }

        warehouseLevel.value = nextLevel
        return { success: true, newLevel: warehouseLevel.value }
    }

    // 收集建筑产出
    function collectProduction(plotId) {
        const building = buildings.value[plotId]
        if (!building) {
            return { success: false, reason: '该地块没有建筑' }
        }

        if (building.status !== BUILDING_STATUS.ACTIVE) {
            return { success: false, reason: '建筑未运行，无法收集产出' }
        }

        const buildingConfig = getBuildingConfig(building.buildingId)
        if (!buildingConfig.production) {
            return { success: false, reason: '该建筑没有产出' }
        }

        const now = Date.now()
        const elapsed = now - building.lastCollectTime
        const interval = buildingConfig.production.baseInterval * 1000 *
            Math.pow(1 - (buildingConfig.upgradeEffects?.intervalReduction || 0), building.level - 1)

        if (elapsed < interval) {
            const remaining = Math.ceil((interval - elapsed) / 1000)
            return { success: false, reason: `距离下次产出还有 ${remaining} 秒` }
        }

        const baseAmount = buildingConfig.production.baseAmount
        const levelBonus = (buildingConfig.upgradeEffects?.amountIncrease || 0) * (building.level - 1)
        const amount = baseAmount + levelBonus

        building.lastCollectTime = now

        return {
            success: true,
            production: {
                type: buildingConfig.production.type,
                items: buildingConfig.production.items,
                amount
            }
        }
    }

    // 获取建筑信息
    function getBuildingInfo(plotId) {
        const building = buildings.value[plotId]
        if (!building) return null

        const config = getBuildingConfig(building.buildingId)
        const info = {
            ...building,
            config,
            upgradeCost: building.level < config.maxLevel ? getUpgradeCost(building.buildingId, building.level) : null
        }

        // 如果建造中，添加进度信息
        if (building.status === BUILDING_STATUS.BUILDING) {
            const progress = checkBuildProgress(plotId)
            info.buildProgress = progress
        }

        return info
    }

    // 获取建筑维护费用
    function getMaintenanceCost(plotId) {
        const building = buildings.value[plotId]
        if (!building) return null

        const config = getBuildingConfig(building.buildingId)
        return config.maintenanceCost || null
    }

    function addDisciple(disciple) {
        disciples.value.push(disciple)
    }

    // ========== 宗门开启方法 ==========

    /**
     * 验证宗门名称格式
     * @param {string} name - 宗门名称
     * @returns {{valid: boolean, error?: string}}
     */
    function validateSectName(name) {
        return validateName(name)
    }

    /**
     * 检查宗门名称是否已被使用（数据库唯一性）
     * @param {string} name - 宗门名称
     * @returns {Promise<{available: boolean, error?: string}>}
     */
    async function checkSectNameAvailability(name) {
        try {
            const { data, error } = await supabase
                .from('sects')
                .select('sect_name')
                .eq('sect_name', name.trim())
                .eq('is_founded', true)
                .maybeSingle()

            if (error) {
                console.error('检查宗门名称失败:', error)
                return { available: false, error: '检查宗门名称失败' }
            }

            if (data) {
                return { available: false, error: SECT_NAME_RULES.errorMessages.duplicate }
            }

            return { available: true }
        } catch (error) {
            console.error('检查宗门名称异常:', error)
            return { available: false, error: error.message }
        }
    }

    /**
     * 开启宗门（首次创建宗门）
     * @param {string} charId - 角色ID
     * @param {string} newSectName - 宗门名称
     * @param {object} characterStore - 角色Store实例
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async function foundSect(charId, newSectName, characterStore) {
        if (isSyncing.value) {
            return { success: false, message: '正在同步中，请稍候' }
        }

        // 1. 验证宗门名称格式
        const nameValidation = validateSectName(newSectName)
        if (!nameValidation.valid) {
            return { success: false, message: nameValidation.error }
        }

        // 2. 检查名称唯一性
        const availability = await checkSectNameAvailability(newSectName)
        if (!availability.available) {
            return { success: false, message: availability.error }
        }

        try {
            isSyncing.value = true

            if (!characterStore.character) {
                return { success: false, message: '未找到角色数据' }
            }

            // 3. 检查灵石是否足够
            const currentSilver = characterStore.character.silver || 0
            if (currentSilver < SECT_FOUNDATION_COST.silver) {
                return {
                    success: false,
                    message: `灵石不足（需要${SECT_FOUNDATION_COST.silver}，当前${currentSilver}）`
                }
            }

            // 4. 扣除灵石
            const newSilver = currentSilver - SECT_FOUNDATION_COST.silver
            const { error: silverError } = await supabase
                .from('characters')
                .update({ silver: newSilver })
                .eq('id', charId)

            if (silverError) throw silverError

            // 5. 创建宗门记录
            characterId.value = charId
            resetSect()
            characterId.value = charId
            sectName.value = newSectName.trim()
            isFounded.value = true

            const sectData = {
                character_id: charId,
                sect_name: newSectName.trim(),
                sect_level_id: sectLevelId.value,
                sect_level: sectLevel.value,
                last_maintenance_check: lastMaintenanceCheck.value,
                warehouse_level: warehouseLevel.value,
                materials: materials.value,
                unlocked_blueprints: unlockedBlueprints.value,
                is_founded: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            const { data: newSect, error: insertError } = await supabase
                .from('sects')
                .insert(sectData)
                .select()
                .single()

            if (insertError) {
                // 回滚：退还灵石
                await supabase
                    .from('characters')
                    .update({ silver: currentSilver })
                    .eq('id', charId)
                throw insertError
            }

            sectId.value = newSect.id

            // 6. 更新本地角色灵石
            characterStore.character.silver = newSilver

            lastSyncTime.value = Date.now()
            return {
                success: true,
                message: `宗门"${newSectName.trim()}"创建成功！消耗${SECT_FOUNDATION_COST.silver}灵石`
            }
        } catch (error) {
            console.error('开启宗门失败:', error)
            return { success: false, message: error.message }
        } finally {
            isSyncing.value = false
        }
    }

    function resetSect() {
        sectName.value = '无名宗'
        sectLevelId.value = 'chuangcao'
        sectLevel.value = 1
        materials.value = { wood: 100, stone: 50, iron: 20, jade: 0, formationFlag: 0, spiritStone: 50 }
        warehouseLevel.value = 1
        unlockedBlueprints.value = []
        buildings.value = {}
        disciples.value = []
        lastMaintenanceCheck.value = Date.now()
        sectId.value = null
        characterId.value = null
        lastSyncTime.value = null
        isFounded.value = false
    }

    // ========== 数据库同步方法 ==========

    /**
     * 从数据库加载宗门数据
     * @param {string} charId - 角色ID
     * @returns {Promise<{success: boolean, message?: string, data?: object}>}
     */
    async function loadFromDatabase(charId) {
        if (isSyncing.value) {
            return { success: false, message: '正在同步中，请稍候' }
        }

        try {
            isSyncing.value = true
            characterId.value = charId

            // 查询宗门数据
            const { data: sectData, error: sectError } = await supabase
                .from('sects')
                .select('*')
                .eq('character_id', charId)
                .maybeSingle()

            if (sectError) throw sectError

            // 如果没有宗门数据，返回需要初始化
            if (!sectData) {
                return { success: false, message: '未找到宗门数据，需要初始化' }
            }

            // 加载宗门基本数据
            sectId.value = sectData.id
            sectName.value = sectData.sect_name
            sectLevelId.value = sectData.sect_level_id
            sectLevel.value = sectData.sect_level
            lastMaintenanceCheck.value = sectData.last_maintenance_check
            warehouseLevel.value = sectData.warehouse_level
            materials.value = sectData.materials
            unlockedBlueprints.value = sectData.unlocked_blueprints || []
            isFounded.value = sectData.is_founded || false

            // 如果宗门未开启，只加载基本信息，不加载建筑等
            if (!sectData.is_founded) {
                lastSyncTime.value = Date.now()
                return {
                    success: true,
                    message: '宗门未开启',
                    founded: false,
                    data: sectData
                }
            }

            // 加载建筑数据
            const { data: buildingsData, error: buildingsError } = await supabase
                .from('sect_buildings')
                .select('*')
                .eq('sect_id', sectData.id)

            if (buildingsError) throw buildingsError

            // 转换建筑数据为Store格式
            buildings.value = {}
            if (buildingsData) {
                buildingsData.forEach(building => {
                    buildings.value[building.plot_id] = {
                        buildingId: building.building_id,
                        level: building.level,
                        status: building.status,
                        buildStartTime: building.build_start_time,
                        buildEndTime: building.build_end_time,
                        lastCollectTime: building.last_collect_time,
                        lastMaintenanceTime: building.last_maintenance_time
                    }
                })
            }

            lastSyncTime.value = Date.now()
            return {
                success: true,
                message: '宗门数据加载成功',
                founded: true,
                data: sectData
            }
        } catch (error) {
            console.error('加载宗门数据失败:', error)
            return { success: false, message: error.message }
        } finally {
            isSyncing.value = false
        }
    }

    /**
     * 保存当前宗门数据到数据库
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async function saveToDatabase() {
        if (isSyncing.value) {
            return { success: false, message: '正在同步中，请稍候' }
        }

        if (!characterId.value) {
            return { success: false, message: '未设置角色ID，无法保存' }
        }

        try {
            isSyncing.value = true

            // 准备宗门数据
            const sectData = {
                character_id: characterId.value,
                sect_name: sectName.value,
                sect_level_id: sectLevelId.value,
                sect_level: sectLevel.value,
                last_maintenance_check: lastMaintenanceCheck.value,
                warehouse_level: warehouseLevel.value,
                materials: materials.value,
                unlocked_blueprints: unlockedBlueprints.value,
                is_founded: isFounded.value,
                updated_at: new Date().toISOString()
            }

            let currentSectId = sectId.value

            // 更新或插入宗门数据
            if (currentSectId) {
                // 更新现有宗门
                const { error: updateError } = await supabase
                    .from('sects')
                    .update(sectData)
                    .eq('id', currentSectId)

                if (updateError) throw updateError
            } else {
                // 创建新宗门
                const { data: newSect, error: insertError } = await supabase
                    .from('sects')
                    .insert(sectData)
                    .select()
                    .single()

                if (insertError) throw insertError
                sectId.value = newSect.id
                currentSectId = newSect.id
            }

            // 同步建筑数据
            await syncBuildings(currentSectId)

            lastSyncTime.value = Date.now()
            return { success: true, message: '宗门数据保存成功' }
        } catch (error) {
            console.error('保存宗门数据失败:', error)
            return { success: false, message: error.message }
        } finally {
            isSyncing.value = false
        }
    }

    /**
     * 同步建筑数据到数据库
     * @param {string} currentSectId - 宗门ID
     * @returns {Promise<void>}
     */
    async function syncBuildings(currentSectId) {
        // 获取数据库中的现有建筑
        const { data: existingBuildings, error: fetchError } = await supabase
            .from('sect_buildings')
            .select('id, plot_id')
            .eq('sect_id', currentSectId)

        if (fetchError) throw fetchError

        const existingPlotIds = new Set(existingBuildings?.map(b => b.plot_id) || [])
        const currentPlotIds = new Set(Object.keys(buildings.value))

        // 删除不再存在的建筑
        const plotsToDelete = [...existingPlotIds].filter(plotId => !currentPlotIds.has(plotId))
        if (plotsToDelete.length > 0) {
            const buildingIdsToDelete = existingBuildings
                .filter(b => plotsToDelete.includes(b.plot_id))
                .map(b => b.id)

            const { error: deleteError } = await supabase
                .from('sect_buildings')
                .delete()
                .in('id', buildingIdsToDelete)

            if (deleteError) throw deleteError
        }

        // 更新或插入建筑
        for (const [plotId, building] of Object.entries(buildings.value)) {
            const buildingData = {
                sect_id: currentSectId,
                plot_id: plotId,
                building_id: building.buildingId,
                level: building.level,
                status: building.status,
                build_start_time: building.buildStartTime,
                build_end_time: building.buildEndTime,
                last_collect_time: building.lastCollectTime,
                last_maintenance_time: building.lastMaintenanceTime,
                updated_at: new Date().toISOString()
            }

            if (existingPlotIds.has(plotId)) {
                // 更新现有建筑
                const { error: updateError } = await supabase
                    .from('sect_buildings')
                    .update(buildingData)
                    .eq('sect_id', currentSectId)
                    .eq('plot_id', plotId)

                if (updateError) throw updateError
            } else {
                // 插入新建筑
                const { error: insertError } = await supabase
                    .from('sect_buildings')
                    .insert(buildingData)

                if (insertError) throw insertError
            }
        }
    }

    /**
     * 初始化新宗门（创建默认数据）
     * @param {string} charId - 角色ID
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async function initializeSect(charId) {
        if (isSyncing.value) {
            return { success: false, message: '正在同步中，请稍候' }
        }

        try {
            isSyncing.value = true
            characterId.value = charId

            // 重置为默认值
            resetSect()
            characterId.value = charId

            // 保存到数据库
            const result = await saveToDatabase()
            if (result.success) {
                return { success: true, message: '宗门初始化成功' }
            } else {
                return result
            }
        } catch (error) {
            console.error('初始化宗门失败:', error)
            return { success: false, message: error.message }
        } finally {
            isSyncing.value = false
        }
    }

    return {
        // 状态
        sectName,
        sectLevelId,
        sectLevel,
        materials,
        warehouseLevel,
        warehouseCapacity,
        unlockedBlueprints,
        buildings,
        disciples,
        lastMaintenanceCheck,
        sectId,
        characterId,
        isSyncing,
        lastSyncTime,
        isFounded,

        // 计算属性
        currentLevelConfig,
        nextLevelConfig,
        availablePlots,
        builtBuildingsCount,
        discipleCount,
        disciplesByRealm,
        upgradeCheck,
        totalMaterials,
        isWarehouseFull,
        buildingInProgressCount,
        suspendedBuildings,

        // 方法
        setSectName,
        addMaterial,
        consumeMaterial,
        consumeMaterials,
        hasMaterials,
        unlockBlueprint,
        isBlueprintUnlocked,
        startBuildBuilding,
        checkBuildProgress,
        cancelBuilding,
        demolishBuilding,
        performMaintenanceCheck,
        resumeBuilding,
        upgradeBuilding,
        upgradeSect,
        upgradeWarehouse,
        collectProduction,
        getBuildingInfo,
        getMaintenanceCost,
        addDisciple,
        resetSect,
        loadFromDatabase,
        saveToDatabase,
        syncBuildings,
        initializeSect,
        foundSect,
        validateSectName,
        checkSectNameAvailability,

        // 常量
        BUILDING_STATUS,
        SECT_FOUNDATION_COST
    }
}, {
    persist: true
})
