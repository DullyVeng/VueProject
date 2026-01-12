// 宗门系统配置

/**
 * 宗门开启条件
 */
export const SECT_FOUNDATION_COST = {
    silver: 500  // 开启宗门需要的灵石
}

/**
 * 宗门名称验证规则
 */
export const SECT_NAME_RULES = {
    minLength: 2,       // 最小长度
    maxLength: 8,       // 最大长度
    // 正则：中文、英文字母、数字
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9]+$/,
    errorMessages: {
        empty: '宗门名称不能为空',
        tooShort: '宗门名称至少需要2个字符',
        tooLong: '宗门名称不能超过8个字符',
        invalid: '宗门名称只能包含中文、字母和数字',
        duplicate: '该宗门名称已被使用，请换一个'
    }
}

/**
 * 验证宗门名称格式
 * @param {string} name - 宗门名称
 * @returns {{valid: boolean, error?: string}}
 */
export function validateSectName(name) {
    if (!name || name.trim() === '') {
        return { valid: false, error: SECT_NAME_RULES.errorMessages.empty }
    }

    const trimmedName = name.trim()

    if (trimmedName.length < SECT_NAME_RULES.minLength) {
        return { valid: false, error: SECT_NAME_RULES.errorMessages.tooShort }
    }

    if (trimmedName.length > SECT_NAME_RULES.maxLength) {
        return { valid: false, error: SECT_NAME_RULES.errorMessages.tooLong }
    }

    if (!SECT_NAME_RULES.pattern.test(trimmedName)) {
        return { valid: false, error: SECT_NAME_RULES.errorMessages.invalid }
    }

    return { valid: true }
}

/**
 * 检查是否满足开启宗门的条件
 * @param {number} silver - 角色当前灵石
 * @returns {{canFound: boolean, missing?: string}}
 */
export function checkFoundationRequirements(silver) {
    if (silver < SECT_FOUNDATION_COST.silver) {
        return {
            canFound: false,
            missing: `灵石不足（需要${SECT_FOUNDATION_COST.silver}，当前${silver}）`
        }
    }

    return { canFound: true }
}
