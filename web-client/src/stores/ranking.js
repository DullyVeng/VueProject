
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'

export const useRankingStore = defineStore('ranking', () => {
    const leaderboard = ref([])
    const loading = ref(false)

    // Helper: Convert level to Cultivation Stage
    function getCultivationLevel(level) {
        if (level <= 10) return `炼气期 ${level}层`
        if (level <= 20) return `筑基期 ${level - 10}层`
        if (level <= 30) return `金丹期 ${level - 20}层`
        if (level <= 40) return `元婴期 ${level - 30}层`
        if (level <= 50) return `化神期 ${level - 40}层`
        if (level <= 60) return `炼虚期 ${level - 50}层`
        if (level <= 70) return `合体期 ${level - 60}层`
        if (level <= 80) return `大乘期 ${level - 70}层`
        return `渡劫期 ${level - 80}层`
    }

    async function fetchLeaderboard() {
        loading.value = true
        const { data, error } = await supabase
            .from('characters')
            .select('id, name, level, gender') // Only select public info
            .order('level', { ascending: false })
            .order('exp', { ascending: false }) // Tie-breaker
            .limit(10)

        if (error) {
            console.error('Error fetching leaderboard:', error)
        } else {
            leaderboard.value = data.map((char, index) => ({
                ...char,
                rank: index + 1,
                model: char.gender === 'male' ? '👨‍🎓' : '👩‍🎓', // Default model fallback
                cultivation: getCultivationLevel(char.level)
            }))
        }
        loading.value = false
    }

    return {
        leaderboard,
        loading,
        fetchLeaderboard
    }
})
