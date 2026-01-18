/**
 * 每日任务 Store
 * v1.2 - 支持5种任务类型
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import {
    generateDailyTasks,
    calculateAllCompleteBonus,
    DailyTaskType
} from '../data/dailyTasks'

export const useDailyStore = defineStore('daily', () => {
    const characterStore = useCharacterStore()

    // 状态
    const todayTasks = ref([])
    const allCompletedClaimed = ref(false)
    const loading = ref(false)
    const taskDate = ref(null)

    // 计算属性
    const allCompleted = computed(() => {
        return todayTasks.value.length > 0 &&
            todayTasks.value.every(t => t.current >= t.required)
    })

    const allClaimedBonus = computed(() => {
        const level = characterStore.character?.level || 1
        return calculateAllCompleteBonus(level)
    })

    const completedCount = computed(() =>
        todayTasks.value.filter(t => t.current >= t.required).length
    )

    // 获取今日日期字符串
    function getTodayString() {
        const now = new Date()
        return now.toISOString().split('T')[0]
    }

    // 加载今日任务
    async function loadTodayTasks() {
        const charId = characterStore.character?.id
        if (!charId) return

        loading.value = true
        const today = getTodayString()

        try {
            const { data, error } = await supabase
                .from('daily_task_progress')
                .select('*')
                .eq('character_id', charId)
                .eq('task_date', today)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                todayTasks.value = data.tasks || []
                allCompletedClaimed.value = data.all_completed_claimed || false
                taskDate.value = data.task_date
                console.log('[Daily] 加载今日任务:', todayTasks.value.length, '个')
            } else {
                await initializeTodayTasks()
            }
        } catch (err) {
            console.error('[Daily] 加载每日任务失败:', err)
        } finally {
            loading.value = false
        }
    }

    // 初始化今日任务
    async function initializeTodayTasks() {
        const charId = characterStore.character?.id
        const level = characterStore.character?.level || 1
        if (!charId) return

        const today = getTodayString()
        const tasks = generateDailyTasks(level)

        try {
            const { data, error } = await supabase
                .from('daily_task_progress')
                .insert({
                    character_id: charId,
                    task_date: today,
                    tasks: tasks,
                    all_completed_claimed: false
                })
                .select()
                .single()

            if (error) throw error

            todayTasks.value = data.tasks
            allCompletedClaimed.value = false
            taskDate.value = today

            console.log('[Daily] 生成今日任务:', tasks.map(t => t.name).join(', '))
        } catch (err) {
            console.error('[Daily] 初始化每日任务失败:', err)
        }
    }

    /**
     * 更新任务进度
     * @param {string} taskType - 任务类型
     * @param {string} target - 目标（怪物ID、物品ID、'any'、'boss'、'win'）
     * @param {number} amount - 增加数量
     */
    async function updateProgress(taskType, target = 'any', amount = 1) {
        console.log(`[Daily] updateProgress 调用:`, {
            taskType,
            target,
            amount,
            任务数量: todayTasks.value.length
        })

        if (todayTasks.value.length === 0) {
            console.warn('[Daily] ❌ 今日任务列表为空，无法更新进度')
            return
        }

        let hasUpdate = false

        for (const task of todayTasks.value) {
            // 已领取或已完成的任务不再更新
            if (task.claimed || task.current >= task.required) continue

            // 检查任务类型匹配
            if (task.type !== taskType) continue

            // 检查目标匹配
            let isMatch = false

            if (task.target === 'any') {
                // 任意目标都匹配
                isMatch = true
            } else if (task.target === target) {
                // 精确匹配（怪物ID、物品ID）
                isMatch = true
            } else if (taskType === DailyTaskType.KILL_BOSS && task.target === 'boss' && target === 'boss') {
                // BOSS任务匹配
                isMatch = true
            }

            if (isMatch) {
                const oldProgress = task.current
                task.current = Math.min(task.current + amount, task.required)
                hasUpdate = true
                console.log(`[Daily] ✅ 任务进度更新: ${task.name} ${oldProgress} → ${task.current}/${task.required}`)
            }
        }

        if (hasUpdate) {
            await saveTasks()
            console.log('[Daily] 任务已保存到数据库')
        } else {
            console.log('[Daily] ⚠️ 没有匹配的任务需要更新')
        }
    }

    // 保存任务到数据库
    async function saveTasks() {
        const charId = characterStore.character?.id
        if (!charId || !taskDate.value) return

        try {
            await supabase
                .from('daily_task_progress')
                .update({
                    tasks: todayTasks.value,
                    updated_at: new Date().toISOString()
                })
                .eq('character_id', charId)
                .eq('task_date', taskDate.value)
        } catch (err) {
            console.error('[Daily] 保存每日任务失败:', err)
        }
    }

    // 领取单个任务奖励
    async function claimReward(taskId) {
        const task = todayTasks.value.find(t => t.id === taskId)
        if (!task) return { success: false, message: '任务不存在' }
        if (task.current < task.required) return { success: false, message: '任务未完成' }
        if (task.claimed) return { success: false, message: '奖励已领取' }

        // 标记已领取
        task.claimed = true

        // 发放奖励
        if (task.rewards.exp) {
            await characterStore.gainExp(task.rewards.exp)
        }
        if (task.rewards.silver) {
            await characterStore.gainSilver(task.rewards.silver)
        }

        // 保存
        await saveTasks()

        console.log(`[Daily] 领取奖励: ${task.name} +${task.rewards.exp}EXP +${task.rewards.silver}灵石`)

        return {
            success: true,
            rewards: task.rewards,
            message: `获得 ${task.rewards.exp} 经验、${task.rewards.silver} 灵石`
        }
    }

    // 领取全完成奖励
    async function claimAllCompleteBonus() {
        if (!allCompleted.value) return { success: false, message: '任务未全部完成' }
        if (allCompletedClaimed.value) return { success: false, message: '奖励已领取' }

        // 检查所有任务是否都已领取
        const allClaimed = todayTasks.value.every(t => t.claimed)
        if (!allClaimed) return { success: false, message: '请先领取各任务奖励' }

        const bonus = allClaimedBonus.value

        // 发放奖励
        if (bonus.exp) {
            await characterStore.gainExp(bonus.exp)
        }
        if (bonus.silver) {
            await characterStore.gainSilver(bonus.silver)
        }

        // 标记已领取
        allCompletedClaimed.value = true

        // 保存到数据库
        const charId = characterStore.character?.id
        if (charId && taskDate.value) {
            await supabase
                .from('daily_task_progress')
                .update({
                    all_completed_claimed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('character_id', charId)
                .eq('task_date', taskDate.value)
        }

        console.log(`[Daily] 领取全完成奖励: +${bonus.exp}EXP +${bonus.silver}灵石`)

        return {
            success: true,
            rewards: bonus,
            message: `获得 ${bonus.exp} 经验、${bonus.silver} 灵石`
        }
    }

    // 检查是否需要刷新（跨天检测）
    function checkAndRefresh() {
        const today = getTodayString()
        if (taskDate.value && taskDate.value !== today) {
            console.log('[Daily] 检测到跨天，刷新任务...')
            loadTodayTasks()
        }
    }

    return {
        todayTasks,
        allCompletedClaimed,
        loading,
        allCompleted,
        allClaimedBonus,
        completedCount,
        loadTodayTasks,
        updateProgress,
        claimReward,
        claimAllCompleteBonus,
        checkAndRefresh
    }
})
