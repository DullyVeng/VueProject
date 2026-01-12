// 宗门Store数据库同步使用示例
// 本文件展示如何在Vue组件中使用宗门数据库同步功能

import { useSectStore } from '@/stores/sect'

// ========== 示例1：初始化宗门（新玩家） ==========
async function initializeNewSect(characterId) {
    const sectStore = useSectStore()

    const result = await sectStore.initializeSect(characterId)

    if (result.success) {
        console.log('宗门初始化成功')
    } else {
        console.error('初始化失败:', result.message)
    }
}

// ========== 示例2：加载现有宗门数据 ==========
async function loadExistingSect(characterId) {
    const sectStore = useSectStore()

    const result = await sectStore.loadFromDatabase(characterId)

    if (result.success) {
        console.log('宗门数据加载成功:', result.data)
        // 现在可以访问 sectStore 中的所有数据
        console.log('宗门名称:', sectStore.sectName)
        console.log('材料:', sectStore.materials)
        console.log('建筑:', sectStore.buildings)
    } else {
        if (result.message === '未找到宗门数据，需要初始化') {
            // 首次登录，需要初始化
            await initializeNewSect(characterId)
        } else {
            console.error('加载失败:', result.message)
        }
    }
}

// ========== 示例3：保存宗门数据 ==========
async function saveSectData() {
    const sectStore = useSectStore()

    const result = await sectStore.saveToDatabase()

    if (result.success) {
        console.log('宗门数据保存成功')
    } else {
        console.error('保存失败:', result.message)
    }
}

// ========== 示例4：完整的宗门管理流程 ==========
async function manageSect(characterId) {
    const sectStore = useSectStore()

    // 1. 尝试加载现有数据
    const loadResult = await sectStore.loadFromDatabase(characterId)

    if (!loadResult.success) {
        // 2. 如果没有数据，初始化新宗门
        const initResult = await sectStore.initializeSect(characterId)
        if (!initResult.success) {
            console.error('初始化宗门失败:', initResult.message)
            return
        }
    }

    // 3. 执行宗门操作（示例：建造建筑）
    const buildResult = sectStore.startBuildBuilding('plot-1', 'gathering-wood')
    if (buildResult.success) {
        console.log('开始建造，需要时间:', buildResult.buildTime, '秒')

        // 4. 保存更改到数据库
        const saveResult = await sectStore.saveToDatabase()
        if (saveResult.success) {
            console.log('建筑数据已同步到数据库')
        }
    }
}

// ========== 示例5：自动保存机制 ==========
// 在Vue组件中使用watch监听关键数据变化，自动保存

import { watch } from 'vue'

export function setupAutoSave() {
    const sectStore = useSectStore()

    // 监听宗门等级变化
    watch(() => sectStore.sectLevel, async (newLevel, oldLevel) => {
        if (oldLevel !== null && newLevel !== oldLevel) {
            console.log('宗门升级，自动保存...')
            await sectStore.saveToDatabase()
        }
    })

    // 监听建筑数量变化
    watch(() => Object.keys(sectStore.buildings).length, async (newCount, oldCount) => {
        if (oldCount !== null && newCount !== oldCount) {
            console.log('建筑数量变化，自动保存...')
            await sectStore.saveToDatabase()
        }
    })

    // 监听材料大量变化（批量操作后）
    let saveTimeout = null
    watch(() => sectStore.materials, () => {
        // 防抖：300ms内的多次变化只保存一次
        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(async () => {
            console.log('材料变化，自动保存...')
            await sectStore.saveToDatabase()
        }, 300)
    }, { deep: true })
}

// ========== 示例6：组件生命周期集成 ==========
// 在Vue组件的setup函数中使用

import { onMounted, onUnmounted } from 'vue'

export function useSectManagement(characterId) {
    const sectStore = useSectStore()

    onMounted(async () => {
        // 组件挂载时加载宗门数据
        await loadExistingSect(characterId)

        // 设置自动保存
        setupAutoSave()
    })

    onUnmounted(async () => {
        // 组件卸载前保存数据
        if (!sectStore.isSyncing) {
            await sectStore.saveToDatabase()
        }
    })

    return sectStore
}

// ========== 示例7：错误处理 ==========
async function saveWithRetry(maxRetries = 3) {
    const sectStore = useSectStore()

    for (let i = 0; i < maxRetries; i++) {
        const result = await sectStore.saveToDatabase()

        if (result.success) {
            return true
        }

        console.warn(`保存失败（第${i + 1}次尝试），错误:`, result.message)

        if (i < maxRetries - 1) {
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
    }

    console.error('保存失败，已达到最大重试次数')
    return false
}

// ========== 示例8：同步状态指示器 ==========
// 在Vue模板中显示同步状态

/*
<template>
  <div class="sect-sync-indicator">
    <span v-if="sectStore.isSyncing">正在同步...</span>
    <span v-else-if="sectStore.lastSyncTime">
      上次同步: {{ formatTime(sectStore.lastSyncTime) }}
    </span>
    <button @click="manualSync" :disabled="sectStore.isSyncing">
      手动同步
    </button>
  </div>
</template>

<script setup>
import { useSectStore } from '@/stores/sect'

const sectStore = useSectStore()

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN')
}

async function manualSync() {
  await sectStore.saveToDatabase()
}
</script>
*/
