import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getRandomMonster } from '../data/monsters'
import { useCharacterStore } from './character'
import { useFabaoStore } from './fabao'
import { useInventoryStore } from './inventory'
import { useQuestStore } from './quest'
import { useAttributeStore } from './attribute'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase/client'
import {
    applySkillEffect,
    selectSkillTarget,
    canUseSkill,
    calculateSkillEffect
} from '../data/fabaoSkills'

export const useCombatStore = defineStore('combat', () => {
    const characterStore = useCharacterStore()
    const fabaoStore = useFabaoStore()
    const inventoryStore = useInventoryStore()
    const questStore = useQuestStore()
    const attributeStore = useAttributeStore()
    const router = useRouter()

    // ==================== 战斗状态 ====================

    const isInCombat = ref(false)
    const combatPhase = ref('idle')  // idle, enemy_summon, player_summon, prepare, battle, settlement
    const turn = ref(1)
    const logs = ref([])

    // 敌方状态
    const enemy = ref(null)
    const enemySummonedFabaos = ref([])  // 敌人召唤的法宝

    // 玩家状态 - 改为独立维护，不依赖 fabaoStore 的 computed
    const playerSummonedFabaos = ref([])  // 玩家召唤的法宝（战斗中的快照）

    // 战斗行动队列
    const actionQueue = ref([])

    // 结算信息
    const settlementInfo = ref(null)

    // 技能选择状态（记录每个法宝选择的技能）
    const selectedSkills = ref({})  // { fabaoId: skillId }

    // 技能使用记录（上一回合使用的技能，用于智能记忆）
    const lastUsedSkills = ref({})  // { fabaoId: skillId }

    // ==================== 辅助方法 ====================

    function addLog(message, type = 'info') {
        logs.value.push({
            turn: turn.value,
            message,
            type,  // info, damage, heal, summon, special
            timestamp: Date.now()
        })
    }

    function clearLogs() {
        logs.value = []
    }

    // ==================== 战斗流程 ====================

    /**
     * 开始战斗
     */
    async function startCombat(levelRange) {
        const enemyData = getRandomMonster(levelRange)

        // 克隆敌人数据
        enemy.value = {
            ...enemyData,
            hp: enemyData.max_hp,
            currentAction: null
        }

        isInCombat.value = true
        turn.value = 1
        combatPhase.value = 'enemy_summon'
        clearLogs()
        enemySummonedFabaos.value = []
        playerSummonedFabaos.value = []  // 清空玩家法宝列表

        // 初始化行动点到满值
        const maxAP = characterStore.character.max_action_points || 10
        characterStore.character.current_action_points = maxAP

        addLog(`遭遇了 ${enemy.value.name} (Lv.${enemy.value.level})!`, 'special')
        addLog(`敌人类型: ${getEnemyTypeText(enemy.value.type)}`, 'info')

        // 立即进入敌人召唤阶段
        enemySummonPhase()
    }

    /**
     * 阶段1：敌人召唤阶段
     */
    function enemySummonPhase() {
        combatPhase.value = 'enemy_summon'
        addLog('--- 敌人召唤阶段 ---', 'special')

        // 敌人根据等级召唤法宝（简化版本，实际可以更复杂）
        const enemyLevel = enemy.value.level
        const summonCount = Math.floor(enemyLevel / 3) + 1  // 等级越高召唤越多

        for (let i = 0; i < summonCount; i++) {
            const enemyFabao = generateEnemyFabao(enemyLevel, i)
            enemySummonedFabaos.value.push(enemyFabao)
            addLog(`${enemy.value.name}召唤了${enemyFabao.name}！`, 'summon')
        }

        // 第一回合进入玩家召唤阶段，后续回合直接进入准备阶段
        if (turn.value === 1) {
            combatPhase.value = 'player_summon'
            addLog('--- 你的召唤阶段 ---', 'special')
            addLog('请选择要召唤的法宝（可用法宝在UI中操作）', 'info')
        } else {
            combatPhase.value = 'prepare'
            addLog('敌人召唤完成，可选择召唤法宝或直接开始战斗', 'info')
        }
    }

    /**
     * 召唤法宝（战斗中）
     */
    async function summonFabao(fabaoId) {
        // 调用 fabaoStore 的召唤逻辑
        const result = await fabaoStore.summonFabao(fabaoId)

        if (result.success) {
            // 将法宝添加到战斗快照数组
            const fabao = fabaoStore.fabaos.find(f => f.id === fabaoId)
            if (fabao && !playerSummonedFabaos.value.find(f => f.id === fabaoId)) {
                playerSummonedFabaos.value.push(fabao)
            }
        }

        return result
    }

    /**
     * 玩家确认召唤完成，进入战斗准备阶段
     */
    function playerConfirmSummon() {
        if (playerSummonedFabaos.value.length === 0) {
            addLog('警告：未召唤任何法宝，你将独自面对敌人！', 'special')
        }

        combatPhase.value = 'prepare'
        addLog('--- 战斗准备阶段 ---', 'special')
        addLog('准备就绪，点击"开始战斗"按钮！', 'info')
    }

    /**
     * 玩家手动开始战斗
     */
    function startBattle() {
        addLog('=== 战斗开始！===', 'special')
        battleTriggerPhase()
    }

    /**
     * 为法宝选择技能
     */
    function selectFabaoSkill(fabaoId, skillId) {
        selectedSkills.value[fabaoId] = skillId
        console.log(`[选择技能] 法宝 ${fabaoId} 选择了技能 ${skillId}`)
    }

    /**
     * 获取法宝当前选中的技能
     */
    function getSelectedSkill(fabaoId) {
        // 优先返回当前选择的技能
        if (selectedSkills.value[fabaoId]) {
            return selectedSkills.value[fabaoId]
        }

        // 如果没有选择，使用上次使用的技能
        if (lastUsedSkills.value[fabaoId]) {
            selectedSkills.value[fabaoId] = lastUsedSkills.value[fabaoId]
            return lastUsedSkills.value[fabaoId]
        }

        // 都没有则返回null（法宝使用默认技能）
        return null
    }

    /**
     * 记录技能使用（用于下回合智能记忆）
     */
    function recordSkillUsage(fabaoId, skillId) {
        lastUsedSkills.value[fabaoId] = skillId
    }

    /**
     * 阶段3 & 4：战斗触发阶段（同时施放技能）
     */
    function battleTriggerPhase() {
        combatPhase.value = 'battle'
        addLog('--- 战斗开始！---', 'special')

        // 构建行动队列
        actionQueue.value = []

        // 玩家本体行动
        actionQueue.value.push({
            actor: 'player',
            target: null,
            type: 'attack'
        })

        // 玩家法宝行动（只有存活的法宝）
        playerSummonedFabaos.value.filter(f => f.hp > 0).forEach(fabao => {
            actionQueue.value.push({
                actor: 'player_fabao',
                fabaoId: fabao.id,
                fabao: fabao,
                target: null,
                type: 'attack'
            })
        })

        // 敌人本体行动
        actionQueue.value.push({
            actor: 'enemy',
            target: null,
            type: 'attack'
        })

        // 敌人法宝行动（只有存活的法宝）
        enemySummonedFabaos.value.filter(f => f.hp > 0).forEach((fabao, index) => {
            actionQueue.value.push({
                actor: 'enemy_fabao',
                fabaoIndex: index,
                fabao: fabao,
                target: null,
                type: 'attack'
            })
        })

        // 执行所有行动
        executeActions()
    }

    /**
     * 执行所有战斗行动
     */
    async function executeActions() {
        for (const action of actionQueue.value) {
            await executeAction(action)
            await new Promise(resolve => setTimeout(resolve, 800))

            // 检查战斗是否结束
            if (checkCombatEnd()) {
                return
            }
        }

        // 回合结束，进入下一回合
        turn.value++
        addLog(`=== 第${turn.value}回合 ===`, 'special')

        // 恢复行动点（示例）
        const regen = attributeStore.derivedStats.actionPointsRegen || 3
        const newAP = Math.min(
            (characterStore.character.current_action_points || 0) + regen,
            characterStore.character.max_action_points || 10
        )
        characterStore.character.current_action_points = newAP
        addLog(`你恢复了${regen}点行动点`, 'heal')

        // 回合结束：为所有存活的法宝恢复MP（10%最大MP）
        for (const fabao of playerSummonedFabaos.value.filter(f => f.hp > 0)) {
            const mpRegen = Math.floor((fabao.max_mp || 100) * 0.1)
            fabao.mp = Math.min((fabao.mp || 0) + mpRegen, fabao.max_mp || 100)

            // 更新数据库
            await supabase
                .from('fabao_instances')
                .update({ mp: fabao.mp })
                .eq('id', fabao.id)

            if (mpRegen > 0) {
                addLog(`${fabao.name}恢复了${mpRegen}点MP`, 'heal')
            }
        }

        // 进入准备阶段，玩家可以选择召唤法宝或直接开始战斗
        combatPhase.value = 'prepare'
        addLog('回合结束，可以继续召唤法宝或开始战斗', 'info')
    }

    /**
     * 执行单个行动
     */
    async function executeAction(action) {
        switch (action.actor) {
            case 'player':
                await playerAttackAction()
                break
            case 'player_fabao':
                await playerFabaoAttackAction(action.fabao)
                break
            case 'enemy':
                await enemyAttackAction()
                break
            case 'enemy_fabao':
                await enemyFabaoAttackAction(action.fabao)
                break
        }
    }

    /**
     * 玩家本体攻击
     */
    async function playerAttackAction() {
        // 选择目标：优先攻击敌人法宝，如果没有则攻击本体
        let target = null
        let targetType = 'enemy'

        // 只选择存活的敌人法宝
        const aliveFabaos = enemySummonedFabaos.value.filter(f => f.hp > 0)
        if (aliveFabaos.length > 0) {
            // 随机选择一个存活的敌人法宝
            const index = Math.floor(Math.random() * aliveFabaos.length)
            target = aliveFabaos[index]
            targetType = 'enemy_fabao'
        } else {
            target = enemy.value
        }

        const damage = calculateDamage(characterStore.character.attack, target.defense || 0)
        target.hp -= damage

        if (targetType === 'enemy_fabao') {
            addLog(`你攻击了${target.name}，造成${damage}点伤害！`, 'damage')
            if (target.hp <= 0) {
                addLog(`${target.name}被击败了！`, 'special')
                // 不再移除死亡法宝，保持显示
            }
        } else {
            addLog(`你攻击了${enemy.value.name}，造成${damage}点伤害！`, 'damage')
        }
    }

    /**
     * 玩家法宝攻击（使用技能系统）
     */
    async function playerFabaoAttackAction(fabao) {
        // 获取当前选中的技能
        const selectedSkillId = selectedSkills.value[fabao.id]
        let skill = null

        // 如果法宝有多个技能，使用选中的技能
        if (fabao.spells && Array.isArray(fabao.spells)) {
            if (selectedSkillId) {
                skill = fabao.spells.find(s => s.id === selectedSkillId)
            }
            // 如果没有选中，使用第一个技能
            if (!skill) {
                skill = fabao.spells[0]
            }
        }
        // 兼容旧的单技能格式
        else if (fabao.spell) {
            skill = fabao.spell
        }

        if (!skill) {
            addLog(`${fabao.name}没有可用技能！`, 'info')
            return
        }

        // 检查MP是否足够
        const mpCheck = canUseSkill(fabao, skill)
        if (!mpCheck.canUse) {
            addLog(`${fabao.name}无法释放${skill.name}：${mpCheck.reason}`, 'info')
            return
        }

        // 记录技能使用（用于下回合智能记忆）
        recordSkillUsage(fabao.id, skill.id)

        // 扣除MP
        fabao.mp -= skill.mpCost

        // 更新数据库中的MP值
        await supabase
            .from('fabao_instances')
            .update({ mp: fabao.mp })
            .eq('id', fabao.id)

        // 计算技能等级（= 强化等级）
        const skillLevel = fabao.enhance_level || fabao.enhanceLevel || 0

        // 选择目标
        const playerUnits = [characterStore.character, ...playerSummonedFabaos.value.filter(f => f.hp > 0)]
        const enemyUnits = [enemy.value, ...enemySummonedFabaos.value.filter(f => f.hp > 0)]
        const target = selectSkillTarget(skill, playerUnits, enemyUnits, fabao)

        if (!target) {
            addLog(`${fabao.name}的${skill.name}没有找到目标！`, 'info')
            return
        }

        // 应用技能效果
        const effectResult = applySkillEffect(skill, fabao, target, skillLevel)

        if (!effectResult) {
            addLog(`${fabao.name}的技能效果应用失败！`, 'info')
            return
        }

        // 处理效果结果
        if (Array.isArray(effectResult)) {
            // 多目标技能 - target也是数组
            if (Array.isArray(target)) {
                // 确保effectResult和target长度一致
                for (let i = 0; i < effectResult.length && i < target.length; i++) {
                    applyEffectToTarget(effectResult[i], target[i])
                    addLog(effectResult[i].message, effectResult[i].type === 'heal' ? 'heal' : 'damage')
                }
            } else {
                // 如果target不是数组但effectResult是，这是异常情况
                console.error('[战斗系统] 多目标技能的target应该是数组')
            }
        } else {
            // 单目标技能
            applyEffectToTarget(effectResult, target)
            addLog(effectResult.message, effectResult.type === 'heal' ? 'heal' : 'damage')
        }

        // 添加MP消耗日志
        addLog(`${fabao.name}消耗了${skill.mpCost}点MP（剩余${fabao.mp}/${fabao.max_mp}）`, 'info')
    }

    /**
     * 应用效果到目标
     */
    function applyEffectToTarget(effectResult, target) {
        switch (effectResult.type) {
            case 'damage':
                target.hp = Math.max(0, target.hp - effectResult.value)
                if (target.hp <= 0) {
                    addLog(`${target.name}被击败了！`, 'special')
                }
                break

            case 'heal':
                target.hp = Math.min(target.max_hp, target.hp + effectResult.value)
                break

            case 'defense_buff':
                // 临时防御加成（简化处理，直接加到defense上）
                target.tempDefense = (target.tempDefense || 0) + effectResult.value
                target.defense = (target.baseDefense || target.defense) + target.tempDefense
                break

            case 'attack_buff':
                target.tempAttack = (target.tempAttack || 0) + effectResult.value
                target.attack = (target.baseAttack || target.attack) + target.tempAttack
                break
        }
    }

    /**
     * 敌人攻击（根据攻击倾向选择目标）
     */
    async function enemyAttackAction() {
        const preference = enemy.value.attackPreference || { fabao: 0.5, player: 0.5 }

        let target = null
        let targetType = 'player'

        // 根据攻击倾向决定目标
        const roll = Math.random()

        // 只选择存活的玩家法宝
        const aliveFabaos = playerSummonedFabaos.value.filter(f => f.hp > 0)
        if (roll < preference.fabao && aliveFabaos.length > 0) {
            // 攻击玩家法宝
            const index = Math.floor(Math.random() * aliveFabaos.length)
            target = aliveFabaos[index]
            targetType = 'player_fabao'
        } else {
            // 攻击玩家本体
            target = characterStore.character
        }

        const damage = calculateDamage(enemy.value.attack, target.defense || characterStore.character.defense)
        target.hp -= damage

        if (targetType === 'player_fabao') {
            addLog(`${enemy.value.name}攻击了${target.name}，造成${damage}点伤害！`, 'damage')
            if (target.hp <= 0) {
                addLog(`${target.name}被击败，进入损毁状态！`, 'special')
                await fabaoStore.damageFabao(target.id)
            }
        } else {
            addLog(`${enemy.value.name}攻击了你，造成${damage}点伤害！`, 'damage')
            // 更新玩家HP到数据库
            await supabase
                .from('characters')
                .update({ hp: target.hp })
                .eq('id', characterStore.character.id)
        }
    }

    /**
     * 敌人法宝攻击
     */
    async function enemyFabaoAttackAction(fabao) {
        // 简化：敌人法宝随机攻击玩家或玩家法宝
        let target = null
        let targetType = 'player'

        // 只选择存活的玩家法宝
        const aliveFabaos = playerSummonedFabaos.value.filter(f => f.hp > 0)
        if (aliveFabaos.length > 0 && Math.random() < 0.6) {
            const index = Math.floor(Math.random() * aliveFabaos.length)
            target = aliveFabaos[index]
            targetType = 'player_fabao'
        } else {
            target = characterStore.character
        }

        const damage = calculateDamage(fabao.attack, target.defense || characterStore.character.defense)
        target.hp -= damage

        if (targetType === 'player_fabao') {
            addLog(`${fabao.name}攻击了${target.name}，造成${damage}点伤害！`, 'damage')
            if (target.hp <= 0) {
                addLog(`${target.name}被击败，进入损毁状态！`, 'special')
                await fabaoStore.damageFabao(target.id)
            }
        } else {
            addLog(`${fabao.name}攻击了你，造成${damage}点伤害！`, 'damage')
            await supabase
                .from('characters')
                .update({ hp: target.hp })
                .eq('id', characterStore.character.id)
        }
    }

    /**
     * 计算伤害
     */
    function calculateDamage(attack, defense) {
        return Math.max(1, Math.floor(attack - defense * 0.5))
    }

    /**
     * 检查战斗是否结束
     */
    function checkCombatEnd() {
        // 检查玩家是否失败
        if (characterStore.character.hp <= 0) {
            endCombat(false)
            return true
        }

        // 检查敌人是否失败
        if (enemy.value.hp <= 0) {
            endCombat(true)
            return true
        }

        return false
    }

    /**
     * 逃跑
     */
    async function escape() {
        addLog('你尝试逃跑...', 'info')

        const escapeChance = 0.5  // 50%逃跑成功率

        if (Math.random() < escapeChance) {
            addLog('逃跑成功！', 'special')
            isInCombat.value = false
            combatPhase.value = 'idle'

            // 取消所有已召唤法宝的召唤状态
            for (const fabao of playerSummonedFabaos.value) {
                await supabase
                    .from('fabao_instances')
                    .update({ is_summoned: false })
                    .eq('id', fabao.id)
                fabao.isSummoned = false
            }

            router.push('/map')
        } else {
            addLog('逃跑失败！', 'info')
            // 敌人获得一次攻击机会
            await enemyAttackAction()
            combatPhase.value = 'battle'
        }
    }

    /**
     * 同步法宝数据到数据库（HP、MP、召唤状态）
     * @param {Array} fabaos - 需要同步的法宝列表
     * @param {Object} options - 同步选项
     */
    async function syncFabaosToDatabase(fabaos, options = {}) {
        const {
            restoreMP = false,  // 是否恢复MP到满值
            unsummon = false,   // 是否取消召唤状态
            maxRetries = 3      // 最大重试次数
        } = options

        console.log(`[数据库同步] 开始同步${fabaos.length}个法宝，选项:`, options)

        const results = {
            success: [],
            failed: []
        }

        for (const fabao of fabaos) {
            let retries = 0
            let synced = false

            while (retries < maxRetries && !synced) {
                try {
                    const updateData = {
                        hp: fabao.hp,
                        mp: restoreMP ? (fabao.max_mp || 100) : fabao.mp
                    }

                    if (unsummon) {
                        updateData.is_summoned = false
                    }

                    const { error } = await supabase
                        .from('fabao_instances')
                        .update(updateData)
                        .eq('id', fabao.id)

                    if (error) throw error

                    // 更新本地状态
                    fabao.mp = updateData.mp
                    if (unsummon) {
                        fabao.isSummoned = false
                        fabao.is_summoned = false
                    }

                    results.success.push(fabao.name)
                    synced = true
                    console.log(`[数据库同步] ✓ ${fabao.name} - HP:${fabao.hp}/${fabao.max_hp} MP:${fabao.mp}/${fabao.max_mp}`)

                } catch (error) {
                    retries++
                    console.error(`[数据库同步] ✗ ${fabao.name} 同步失败 (尝试${retries}/${maxRetries}):`, error)

                    if (retries >= maxRetries) {
                        results.failed.push({
                            name: fabao.name,
                            error: error.message
                        })
                    } else {
                        // 等待一段时间后重试
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
                    }
                }
            }
        }

        // 记录同步结果
        if (results.success.length > 0) {
            console.log(`[数据库同步] 成功同步${results.success.length}个法宝:`, results.success.join(', '))
        }
        if (results.failed.length > 0) {
            console.error(`[数据库同步] ${results.failed.length}个法宝同步失败:`, results.failed)
            addLog('部分法宝数据同步失败，请检查网络连接', 'info')
        }

        return results
    }

    /**
     * 结束战斗
     */
    async function endCombat(isWin) {
        isInCombat.value = false
        combatPhase.value = 'settlement'

        if (isWin) {
            addLog('=== 战斗胜利！===', 'special')

            const expReward = enemy.value.expReward
            const silverReward = enemy.value.silverReward

            addLog(`获得${expReward}点经验值`, 'info')
            addLog(`获得${silverReward}灵石`, 'info')

            // 物品掉落（50%概率）
            if (Math.random() > 0.5) {
                const dropItemId = Math.random() > 0.5 ? 'potion_hp_small' : 'potion_mp_small'
                await inventoryStore.addItem(dropItemId, 1)
                addLog('怪物掉落了物品！', 'special')
            }

            // 更新击杀任务进度
            questStore.checkKillQuests()

            // 更新角色数据
            const newExp = characterStore.character.exp + expReward
            const newSilver = (characterStore.character.silver || 0) + silverReward

            let newLevel = characterStore.character.level
            const reqExp = newLevel * 100

            let updateData = {
                exp: newExp,
                silver: newSilver
            }

            // 升级判断
            if (newExp >= reqExp) {
                newLevel++
                updateData.level = newLevel
                updateData.max_hp = characterStore.character.max_hp + 10
                updateData.max_mp = characterStore.character.max_mp + 5
                updateData.attack = characterStore.character.attack + 2
                updateData.defense = characterStore.character.defense + 1
                updateData.hp = updateData.max_hp

                // 升级奖励属性点
                const bonusPoints = await attributeStore.addPointsOnLevelUp(newLevel)
                addLog(`升级了！等级提升至${newLevel}！获得${bonusPoints}属性点！`, 'special')
            }

            await supabase
                .from('characters')
                .update(updateData)
                .eq('id', characterStore.character.id)

            Object.assign(characterStore.character, updateData)

            // 同步所有法宝数据（HP、MP恢复到满值、取消召唤状态）
            await syncFabaosToDatabase(playerSummonedFabaos.value, {
                restoreMP: true,
                unsummon: true
            })

            // 重新加载法宝数据以确保状态同步
            await fabaoStore.fetchFabaos()

            combatPhase.value = 'settlement'

            // 存储结算信息用于UI显示
            settlementInfo.value = {
                isWin: true,
                expReward,
                silverReward,
                levelUp: updateData.level ? true : false,
                newLevel: updateData.level || characterStore.character.level
            }

            addLog(`战斗胜利！获得 ${expReward} 经验、${silverReward} 灵石。`, 'special')
        } else {
            addLog('你被打败了...', 'special')

            // 复活惩罚：HP恢复到1
            characterStore.character.hp = 1

            await supabase
                .from('characters')
                .update({ hp: 1 })
                .eq('id', characterStore.character.id)

            // 同步所有法宝数据（HP、MP恢复到满值、取消召唤状态）
            await syncFabaosToDatabase(playerSummonedFabaos.value, {
                restoreMP: true,
                unsummon: true
            })

            // 重新加载法宝数据以确保状态同步
            await fabaoStore.fetchFabaos()

            combatPhase.value = 'settlement'

            // 存储结算信息
            settlementInfo.value = {
                isWin: false
            }

            addLog('胜败乃兵家常事，继续修炼吧！', 'info')
        }
    }

    /**
     * 返回地图
     */
    async function returnToMap() {
        // 恢复行动点到满值
        const maxAP = characterStore.character.max_action_points || 10
        characterStore.character.current_action_points = maxAP

        await supabase
            .from('characters')
            .update({ current_action_points: maxAP })
            .eq('id', characterStore.character.id)

        isInCombat.value = false
        router.push('/map')
    }

    // ==================== 辅助函数 ====================

    /**
     * 生成敌人法宝
     */
    function generateEnemyFabao(enemyLevel, index) {
        const types = ['sword', 'shield', 'fire', 'water']
        const type = types[index % types.length]

        return {
            id: `enemy_fabao_${index}`,
            name: `${getEnemyFabaoName(type)}`,
            type,
            hp: 50 + enemyLevel * 10,
            max_hp: 50 + enemyLevel * 10,
            attack: 10 + enemyLevel * 2,
            defense: 5 + enemyLevel,
            icon: getEnemyFabaoIcon(type)
        }
    }

    function getEnemyFabaoName(type) {
        const names = {
            sword: '妖剑',
            shield: '魔盾',
            fire: '炎魔',
            water: '水灵'
        }
        return names[type] || '妖器'
    }

    function getEnemyFabaoIcon(type) {
        const icons = {
            sword: '⚔️',
            shield: '🛡️',
            fire: '🔥',
            water: '💧'
        }
        return icons[type] || '✨'
    }

    function getEnemyTypeText(type) {
        const texts = {
            beast: '妖兽（倾向攻击法宝）',
            human: '人类（倾向攻击本体）',
            demon: '魔修（均衡攻击）',
            undead: '不死（偏向攻击本体）'
        }
        return texts[type] || '未知'
    }

    return {
        // 状态
        isInCombat,
        combatPhase,
        turn,
        logs,
        enemy,
        enemySummonedFabaos,
        playerSummonedFabaos,
        settlementInfo,
        selectedSkills,
        lastUsedSkills,

        // 方法
        startCombat,
        summonFabao,
        playerConfirmSummon,
        startBattle,
        returnToMap,
        escape,
        endCombat,
        selectFabaoSkill,
        getSelectedSkill
    }
})
