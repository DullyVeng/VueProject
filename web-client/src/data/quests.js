/**
 * 任务数据配置
 */

export const quests = [
    // 新手任务
    {
        id: 'quest_001',
        name: '初入修仙界',
        type: 'main',  // main/side/daily
        description: '李长老让你去迷雾森林历练，击败3只妖兽。',

        // 任务发布者
        giver: 'elder_li',

        // 接取条件
        requirements: {
            level: 1,
            completedQuests: []
        },

        // 任务目标
        objectives: [
            {
                type: 'kill_monsters',
                target: 'any',  // 任何妖兽
                current: 0,
                required: 3,
                description: '击败妖兽'
            }
        ],

        // 奖励
        rewards: {
            exp: 50,
            silver: 20,
            items: [
                { id: 'potion_hp_small', quantity: 2 }
            ]
        },

        // 后续任务
        nextQuest: 'quest_002'
    },

    {
        id: 'quest_002',
        name: '采集灵草',
        type: 'main',
        description: '张掌柜需要一些灵草，去迷雾森林采集5株灵草。',

        giver: 'merchant_zhang',

        requirements: {
            level: 1,
            completedQuests: ['quest_001']
        },

        objectives: [
            {
                type: 'collect_items',
                target: 'lingcao',
                current: 0,
                required: 5,
                description: '采集灵草'
            }
        ],

        rewards: {
            exp: 30,
            silver: 30,
            items: [
                { id: 'potion_mp_small', quantity: 1 }
            ]
        },

        nextQuest: 'quest_003'
    },

    {
        id: 'quest_003',
        name: '探索青石山',
        type: 'main',
        description: '前往青石山，探索那里的秘密。',

        giver: 'elder_li',

        requirements: {
            level: 3,
            completedQuests: ['quest_002']
        },

        objectives: [
            {
                type: 'visit_location',
                target: 'mountain',
                current: 0,
                required: 1,
                description: '前往青石山'
            }
        ],

        rewards: {
            exp: 80,
            silver: 50,
            items: [
                { id: 'sword_iron', quantity: 1 }
            ]
        },

        nextQuest: null
    },

    // 支线任务
    {
        id: 'quest_side_001',
        name: '收集妖兽内丹',
        type: 'side',
        description: '陈炼丹师需要妖兽内丹来炼制丹药。',

        giver: 'alchemist_chen',

        requirements: {
            level: 5,
            completedQuests: []
        },

        objectives: [
            {
                type: 'collect_items',
                target: 'beast_core',
                current: 0,
                required: 3,
                description: '收集妖兽内丹'
            }
        ],

        rewards: {
            exp: 100,
            silver: 80,
            items: [
                { id: 'potion_hp_small', quantity: 5 },
                { id: 'potion_mp_small', quantity: 3 }
            ]
        },

        nextQuest: null
    }
]

// 任务状态枚举
export const QuestStatus = {
    AVAILABLE: 'available',      // 可接取
    ACTIVE: 'active',            // 进行中
    COMPLETED: 'completed',      // 已完成（可交付）
    FINISHED: 'finished'         // 已交付
}

// 根据ID获取任务
export const getQuestById = (id) => quests.find(q => q.id === id)

// 获取NPC的任务列表
export const getQuestsByGiver = (giverId) => quests.filter(q => q.giver === giverId)

// 检查任务是否可接取
export const canAcceptQuest = (quest, playerLevel, completedQuestIds) => {
    if (!quest.requirements) return true

    // 检查等级
    if (quest.requirements.level && playerLevel < quest.requirements.level) {
        return false
    }

    // 检查前置任务
    if (quest.requirements.completedQuests) {
        for (const reqQuestId of quest.requirements.completedQuests) {
            if (!completedQuestIds.includes(reqQuestId)) {
                return false
            }
        }
    }

    return true
}

// 检查任务目标是否完成
export const isQuestObjectiveComplete = (objective) => {
    return objective.current >= objective.required
}

// 检查任务是否全部完成
export const isQuestComplete = (quest, playerQuest) => {
    if (!playerQuest || !playerQuest.objectives) return false

    return playerQuest.objectives.every(obj =>
        obj.current >= obj.required
    )
}
