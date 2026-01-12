// 法宝技能配置数据
// 定义所有技能的详细配置和效果

/**
 * 技能类型枚举
 */
export const SkillType = {
    ATTACK: 'attack',           // 攻击型
    DEFEND: 'defend',           // 防御型
    HEAL: 'heal',               // 治疗型
    BUFF: 'buff',               // 增益型
    DEBUFF: 'debuff'            // 减益型
}

/**
 * 技能目标类型枚举
 */
export const SkillTargetType = {
    ENEMY_SINGLE: 'enemy_single',       // 敌方单体
    ENEMY_ALL: 'enemy_all',             // 敌方全体
    ALLY_SINGLE: 'ally_single',         // 友方单体
    ALLY_ALL: 'ally_all',               // 友方全体
    SELF: 'self'                        // 自身
}

/**
 * 计算技能效果（基于技能等级）
 * @param {number} baseValue - 基础值
 * @param {number} skillLevel - 技能等级（= 法宝强化等级）
 * @param {number} bonusPerLevel - 每级加成百分比（默认10%）
 */
export function calculateSkillEffect(baseValue, skillLevel, bonusPerLevel = 0.1) {
    const multiplier = 1 + (skillLevel * bonusPerLevel)
    return Math.floor(baseValue * multiplier)
}

/**
 * 获取技能描述（包含等级信息）
 */
export function getSkillDescription(skill, skillLevel = 0) {
    const { type, baseDamage, mpCost, effects } = skill

    let desc = skill.description || ''

    // 添加等级信息
    if (skillLevel > 0) {
        desc += `\n\n当前等级: Lv.${skillLevel}`
    }

    // 添加效果数值
    if (type === SkillType.ATTACK && baseDamage > 0) {
        const damage = calculateSkillEffect(baseDamage, skillLevel)
        desc += `\n伤害: ${damage}`
    }

    if (effects?.heal > 0) {
        const heal = calculateSkillEffect(effects.heal, skillLevel)
        desc += `\n治疗: ${heal}`
    }

    if (effects?.defenseBonus > 0) {
        const defBonus = calculateSkillEffect(effects.defenseBonus, skillLevel)
        desc += `\n防御加成: +${defBonus}`
    }

    desc += `\n消耗MP: ${mpCost}`

    return desc
}

/**
 * 技能效果应用函数
 */
export const skillEffectHandlers = {
    /**
     * 攻击型技能效果
     */
    [SkillType.ATTACK]: (skill, caster, target, skillLevel = 0) => {
        const baseDamage = skill.baseDamage || 0
        const damage = calculateSkillEffect(baseDamage, skillLevel)
        const totalDamage = damage + (caster.attack || 0)
        const finalDamage = Math.max(1, Math.floor(totalDamage - (target.defense || 0) * 0.5))

        return {
            type: 'damage',
            value: finalDamage,
            message: `${caster.name}使用${skill.name}对${target.name}造成了${finalDamage}点伤害！`
        }
    },

    /**
     * 防御型技能效果
     */
    [SkillType.DEFEND]: (skill, caster, target, skillLevel = 0) => {
        const baseDefenseBonus = skill.effects?.defenseBonus || 0
        const defenseBonus = calculateSkillEffect(baseDefenseBonus, skillLevel)

        return {
            type: 'defense_buff',
            value: defenseBonus,
            duration: skill.effects?.duration || 1,
            message: `${caster.name}使用${skill.name}，为${target.name}提供${defenseBonus}点防御加成！`
        }
    },

    /**
     * 治疗型技能效果
     */
    [SkillType.HEAL]: (skill, caster, target, skillLevel = 0) => {
        const baseHeal = skill.effects?.heal || 0
        const healAmount = calculateSkillEffect(baseHeal, skillLevel)
        const actualHeal = Math.min(healAmount, (target.max_hp || target.hp) - target.hp)

        return {
            type: 'heal',
            value: actualHeal,
            message: `${caster.name}使用${skill.name}，为${target.name}恢复了${actualHeal}点生命值！`
        }
    },

    /**
     * 增益型技能效果
     */
    [SkillType.BUFF]: (skill, caster, target, skillLevel = 0) => {
        const attackBonus = skill.effects?.attackBonus || 0
        const bonus = calculateSkillEffect(attackBonus, skillLevel)

        return {
            type: 'attack_buff',
            value: bonus,
            duration: skill.effects?.duration || 1,
            message: `${caster.name}使用${skill.name}，为${target.name}提供${bonus}点攻击加成！`
        }
    },

    /**
     * 减益型技能效果
     */
    [SkillType.DEBUFF]: (skill, caster, target, skillLevel = 0) => {
        const attackReduction = skill.effects?.attackReduction || 0
        const reduction = calculateSkillEffect(attackReduction, skillLevel)

        return {
            type: 'attack_debuff',
            value: reduction,
            duration: skill.effects?.duration || 1,
            message: `${caster.name}使用${skill.name}，降低了${target.name}${reduction}点攻击力！`
        }
    }
}

/**
 * 选择技能目标
 * @param {Object} skill - 技能配置
 * @param {Array} playerUnits - 玩家单位列表
 * @param {Array} enemyUnits - 敌方单位列表
 * @param {Object} caster - 施法者
 */
export function selectSkillTarget(skill, playerUnits, enemyUnits, caster) {
    const targetType = skill.targetType || SkillTargetType.ENEMY_SINGLE

    switch (targetType) {
        case SkillTargetType.ENEMY_SINGLE:
            // 随机选择一个存活的敌人
            const aliveEnemies = enemyUnits.filter(u => u.hp > 0)
            return aliveEnemies.length > 0
                ? aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
                : null

        case SkillTargetType.ENEMY_ALL:
            return enemyUnits.filter(u => u.hp > 0)

        case SkillTargetType.ALLY_SINGLE:
            // 治疗技能优先选择生命值最低的友方
            const aliveAllies = playerUnits.filter(u => u.hp > 0 && u.hp < u.max_hp)
            if (aliveAllies.length === 0) return null
            return aliveAllies.reduce((lowest, current) =>
                (current.hp / current.max_hp) < (lowest.hp / lowest.max_hp) ? current : lowest
            )

        case SkillTargetType.ALLY_ALL:
            return playerUnits.filter(u => u.hp > 0)

        case SkillTargetType.SELF:
            return caster

        default:
            return null
    }
}

/**
 * 应用技能效果
 * @param {Object} skill - 技能配置
 * @param {Object} caster - 施法者
 * @param {Object|Array} target - 目标（单体或多体）
 * @param {number} skillLevel - 技能等级
 */
export function applySkillEffect(skill, caster, target, skillLevel = 0) {
    const handler = skillEffectHandlers[skill.type]

    if (!handler) {
        console.error(`未知的技能类型: ${skill.type}`)
        return null
    }

    // 处理多目标
    if (Array.isArray(target)) {
        return target.map(t => handler(skill, caster, t, skillLevel))
    }

    // 处理单目标
    return handler(skill, caster, target, skillLevel)
}

/**
 * 检查是否可以使用技能
 * @param {Object} fabao - 法宝实例
 * @param {Object} skill - 技能配置
 */
export function canUseSkill(fabao, skill) {
    // 检查MP是否足够
    if (fabao.mp < skill.mpCost) {
        return { canUse: false, reason: 'MP不足' }
    }

    // 检查法宝是否存活
    if (fabao.hp <= 0) {
        return { canUse: false, reason: '法宝已被击败' }
    }

    return { canUse: true }
}

export default {
    SkillType,
    SkillTargetType,
    calculateSkillEffect,
    getSkillDescription,
    selectSkillTarget,
    applySkillEffect,
    canUseSkill
}
