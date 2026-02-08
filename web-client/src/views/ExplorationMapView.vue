<script setup>
/**
 * 小地图探索视图
 * 使用 Canvas 2D 渲染网格地图，支持玩家移动和怪物遭遇
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExplorationStore } from '../stores/exploration'
import { useCombatStore } from '../stores/combat'
import { useGameStore } from '../stores/game'
import { useInventoryStore } from '../stores/inventory'
import { TERRAIN_TYPES, TERRAIN_STYLES } from '../data/explorationMaps'
import InventoryPanel from '../components/game/InventoryPanel.vue'
import CharacterPanel from '../components/game/CharacterPanel.vue'
import TaskSidebar from '../components/TaskSidebar.vue'
import { getItemById } from '../data/items'

const router = useRouter()
const route = useRoute()
const explorationStore = useExplorationStore()
const combatStore = useCombatStore()
const gameStore = useGameStore()
const inventoryStore = useInventoryStore()

// 面板显示状态
const showInventory = ref(false)
const showCharacter = ref(false)
const showDantian = ref(false)
const showTasks = ref(false)  // 任务侧边栏

// 切换背包面板时加载数据
const toggleInventory = async () => {
    showInventory.value = !showInventory.value
    // 打开背包时加载最新数据
    if (showInventory.value) {
        await inventoryStore.fetchInventory()
    }
}

// 奖励弹窗状态
const showRewardModal = ref(false)
const rewardList = ref([])

const closeRewardModal = () => {
    showRewardModal.value = false
    rewardList.value = []
}

// Canvas 引用
const canvasRef = ref(null)
const containerRef = ref(null)

const isMobile = ref(false)
const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
}

// 地图配置
const TILE_SIZE = 32
const PLAYER_SIZE = 24
const MONSTER_SIZE = 20

// 玩家动画
const playerSpriteFrame = ref(0)
let animationFrameId = null

// 初始化
onMounted(async () => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    const mapId = route.params.mapId
    if (!mapId) {
        router.push('/map')
        return
    }

    // 检查是否有保存的地图数据
    // 如果有地图数据说明之前进入过，使用保存的地图和位置
    // 如果没有地图数据说明是首次进入，生成新地图
    const savedMapData = localStorage.getItem(`exploration_map_data_${mapId}`)
    const isFirstEntry = !savedMapData  // 没有保存的地图数据表示首次进入
    
    console.log(`[ExplorationMapView] mapId=${mapId}, isFirstEntry=${isFirstEntry}`)
    
    const success = await explorationStore.enterMap(mapId, isFirstEntry)  // 首次进入时重置位置
    if (!success) {
        alert(`地图 ${mapId} 暂无探索区域`)
        router.push('/map')
        return
    }

    // 等待 DOM 更新后初始化 Canvas
    await nextTick()
    initCanvas()
    startAnimation()

    // 添加键盘监听
    window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('keydown', handleKeyDown)
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
    }
})

// 移动逻辑封装
const movePlayer = async (direction) => {
    if (explorationStore.pendingEncounter) return
    
    const result = await explorationStore.movePlayer(direction)

    // 处理遭遇
    if (result.encounter) {
        handleEncounter(result.encounter)
    } else if (result.chest) {
        // 宝箱开启成功，显示奖励弹窗
        if (result.chest.loot && result.chest.loot.length > 0) {
            rewardList.value = result.chest.loot.map(item => {
                const itemDef = getItemById(item.id)
                return {
                    ...item,
                    name: itemDef ? itemDef.name : '未知物品',
                    icon: itemDef ? itemDef.icon : '📦',
                    desc: itemDef ? itemDef.description : ''
                }
            })
            showRewardModal.value = true
        }
    }
}

// 键盘控制
const handleKeyDown = async (e) => {
    // 如果显示退出确认弹窗，只处理确认/取消
    if (explorationStore.showExitConfirm) {
        if (e.key === 'Enter' || e.key === ' ') {
            confirmExit()
        } else if (e.key === 'Escape') {
            cancelExit()
        }
        return
    }

    const keyMap = {
        'ArrowUp': 'up', 'w': 'up', 'W': 'up',
        'ArrowDown': 'down', 's': 'down', 'S': 'down',
        'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
        'ArrowRight': 'right', 'd': 'right', 'D': 'right'
    }

    const direction = keyMap[e.key]
    if (direction) {
        e.preventDefault()
        await movePlayer(direction)
    }

    // ESC 键尝试退出
    if (e.key === 'Escape') {
        e.preventDefault()
        explorationStore.showExitConfirm = true
    }
}

// 处理遭遇
const handleEncounter = (encounter) => {
    // 检查是否是 BOSS
    const isBoss = encounter.type === 'boss'
    
    console.log('[遭遇怪物]', encounter.type, encounter.monster)
    
    // 显示遭遇信息，然后进入战斗
    setTimeout(async () => {
        // 标记进入战斗（用于战斗后返回探索地图）
        explorationStore.isInCombat = true

        // 启动战斗，直接传递怪物对象
        combatStore.startCombat(encounter.monster)
        
        // 如果是 BOSS，战斗胜利后保存击败时间
        if (isBoss) {
            // 注意：实际击败逻辑需要在战斗结束后处理
            // 这里仅标记，具体实现需要在 combat store 中集成
        }

        // 跳转到战斗页面
        router.push('/combat')
    }, 500)
}

// 确认退出
const confirmExit = async () => {
    // 获取父地图ID（大地图位置）
    const parentMapId = explorationStore.currentMap?.parentMapId || 'town'
    
    // 更新角色位置到父地图
    await gameStore.travelTo(parentMapId)
    
    // 清空探索地图状态（包括 localStorage 缓存）
    explorationStore.exitMap()
    
    // 返回到大地图界面
    router.push('/map')
}

// 取消退出
const cancelExit = () => {
    explorationStore.cancelExit()
}

// 返回按钮点击
const handleBackClick = () => {
    explorationStore.showExitConfirm = true
}
</script>

<template>
    <div class="exploration-container" ref="containerRef">
        <!-- 顶部栏 -->
        <div class="top-bar">
            <h1 class="map-title-centered">{{ explorationStore.currentMap?.name || '探索中' }}</h1>
        </div>

        <!-- 地图区域 -->
        <div class="map-wrapper">
            <canvas ref="canvasRef" class="map-canvas"></canvas>

            <!-- 遭遇提示 -->
            <div v-if="explorationStore.pendingEncounter" class="encounter-overlay">
                <div class="encounter-content">
                    <div class="encounter-icon">⚔️</div>
                    <div class="encounter-text">
                        {{ 
                            explorationStore.pendingEncounter.type === 'boss' ? '遭遇BOSS！' :
                            explorationStore.pendingEncounter.type === 'visible' ? '遭遇精英怪！' : 
                            '随机遭遇！' 
                        }}
                    </div>
                    <div class="encounter-monster">
                        Lv.{{ explorationStore.pendingEncounter.monster.level }}
                    </div>
                </div>
            </div>

            <!-- 移动端虚拟方向键 (D-Pad) -->
            <div v-if="isMobile" class="mobile-dpad">
                <button class="dpad-btn up" @click="movePlayer('up')">▲</button>
                <div class="dpad-mid">
                    <button class="dpad-btn left" @click="movePlayer('left')">◀</button>
                    <div class="dpad-center"></div>
                    <button class="dpad-btn right" @click="movePlayer('right')">▶</button>
                </div>
                <button class="dpad-btn down" @click="movePlayer('down')">▼</button>
            </div>
        </div>

        <!-- 底部信息栏 -->
        <div class="bottom-bar" v-if="!isMobile">
            <div class="controls-hint">
                <span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span>
                或方向键移动
            </div>
            <div class="encounter-rate">
                <span class="rate-label">遭遇率</span>
                <span class="rate-value">{{ explorationStore.encounterRatePercent }}%</span>
            </div>
        </div>

        <!-- UI控制按钮栏 -->
        <div class="ui-controls" :class="{ 'is-mobile-ui': isMobile }">
            <button class="ui-btn" @click="showCharacter = !showCharacter" title="角色">
                <span class="icon">👤</span>
                <span class="label">角色</span>
            </button>
            <button class="ui-btn" @click="toggleInventory" title="背包">
                <span class="icon">🎒</span>
                <span class="label">背包</span>
            </button>
            <button class="ui-btn" @click="router.push('/dantian')" title="法宝管理">
                <span class="icon">✨</span>
                <span class="label">法宝</span>
            </button>
            <button class="ui-btn" @click="showTasks = !showTasks" title="任务中心">
                <span class="icon">📋</span>
                <span class="label">任务</span>
            </button>
            <button class="ui-btn btn-exit" @click="handleBackClick" title="退出地图">
                <span class="icon">🚪</span>
                <span class="label">退出</span>
            </button>
        </div>

        <!-- 角色面板 -->
        <CharacterPanel 
            :show="showCharacter" 
            @close="showCharacter = false" 
        />
        
        <!-- 背包面板 -->
        <InventoryPanel 
            :show="showInventory" 
            @close="showInventory = false" 
        />

        <!-- 任务侧边栏 -->
        <TaskSidebar 
            :show="showTasks" 
            @close="showTasks = false" 
        />

        <!-- 退出确认弹窗 -->
        <div v-if="explorationStore.showExitConfirm" class="exit-modal" @click.self="cancelExit">
            <div class="exit-content">
                <h2>确认退出</h2>
                <p>是否退出到大地图？</p>
                <div class="exit-buttons">
                    <button class="btn-confirm" @click="confirmExit">确定</button>
                    <button class="btn-cancel" @click="cancelExit">取消</button>
                </div>
            </div>
        </div>

        <!-- 奖励结算弹窗 -->
        <div v-if="showRewardModal" class="reward-modal" @click.self="closeRewardModal">
            <div class="reward-content">
                <div class="reward-header">
                    <h2>✨ 获得奖励 ✨</h2>
                </div>
                <div class="reward-list">
                    <div v-for="(item, index) in rewardList" :key="index" class="reward-item">
                        <div class="item-icon">{{ item.icon }}</div>
                        <div class="item-info">
                            <span class="item-name">{{ item.name }}</span>
                            <span class="item-amount">x{{ item.amount }}</span>
                        </div>
                    </div>
                </div>
                <button class="btn-claim" @click="closeRewardModal">收入囊中</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.exploration-container {
    min-height: 100vh;
    background: #0f1215;
    color: #fff;
    display: flex;
    flex-direction: column;
    padding: 1rem;
}

.top-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    margin-bottom: 1rem;
}

.btn-back {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.9rem;
}

.btn-back:hover {
    background: rgba(100, 255, 218, 0.2);
    border-color: #64ffda;
}

.map-title {
    font-size: 1.3rem;
    color: #64ffda;
    margin: 0;
    flex: 1;
    text-align: center;
}

.map-wrapper {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.map-canvas {
    border: 2px solid rgba(100, 255, 218, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(100, 255, 218, 0.1);
    max-width: 100%;
    height: auto !important;
    image-rendering: pixelated;
}

/* 移动端虚拟方向键 (D-Pad) 样式 */
.mobile-dpad {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    z-index: 150;
    user-select: none;
    background: rgba(0,0,0,0.3);
    padding: 10px;
    border-radius: 50%;
    backdrop-filter: blur(5px);
}

.dpad-mid {
    display: flex;
    align-items: center;
    gap: 5px;
}

.dpad-btn {
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(100, 255, 218, 0.5);
    color: #64ffda;
    border-radius: 12px;
    font-size: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
}

.dpad-btn:active {
    background: rgba(100, 255, 218, 0.3);
    transform: scale(0.9);
}

.dpad-center {
    width: 50px;
    height: 50px;
}

/* UI控制按钮 */
.ui-controls {
    position: fixed;
    left: 1rem;
    bottom: 6rem; /* 提高位置，避免遮挡底部指引 */
    display: flex;
    flex-direction: row;  /* 横向排列 */
    gap: 0.5rem;
    z-index: 100;
}

.ui-controls.is-mobile-ui {
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    justify-content: center;
    background: rgba(0,0,0,0.5);
    padding: 10px;
    border-radius: 20px;
    backdrop-filter: blur(10px);
}

.ui-controls.is-mobile-ui .ui-btn {
    min-width: 60px;
    padding: 0.5rem;
    background: rgba(255,255,255,0.05);
}

.ui-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(100, 255, 218, 0.3);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    backdrop-filter: blur(10px);
    min-width: 70px;
    -webkit-tap-highlight-color: transparent;
}

@media (max-width: 768px) {
    .exploration-container {
        padding: 0.5rem;
    }
    .top-bar {
        margin-bottom: 0.5rem;
    }
    .ui-btn .icon {
        font-size: 1.2rem;
    }
    .ui-btn .label {
        font-size: 0.65rem;
    }
}

.ui-btn:hover {
    background: rgba(100, 255, 218, 0.15);
    border-color: rgba(100, 255, 218, 0.6);
    transform: scale(1.05);
}

.ui-btn .icon {
    font-size: 1.5rem;
}

.ui-btn .label {
    font-size: 0.75rem;
    color: #64ffda;
    font-weight: 500;
}

/* 退出按钮特殊样式 */
.ui-btn.btn-exit {
    border-color: rgba(231, 76, 60, 0.5);
}

/* 奖励弹窗样式 */
.reward-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(5px);
    animation: fadeIn 0.3s ease;
}

.reward-content {
    background: linear-gradient(135deg, #1a1f25 0%, #15191f 100%);
    border: 1px solid rgba(241, 196, 15, 0.3);
    border-radius: 16px;
    padding: 2rem;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 0 50px rgba(241, 196, 15, 0.15);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.reward-header h2 {
    color: #f1c40f;
    text-align: center;
    margin: 0;
    font-size: 1.5rem;
    text-shadow: 0 0 10px rgba(241, 196, 15, 0.5);
}

.reward-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.reward-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.05);
    padding: 0.8rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s;
}

.reward-item:hover {
    transform: translateX(5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(241, 196, 15, 0.3);
}

.item-icon {
    font-size: 2rem;
    background: rgba(0, 0, 0, 0.3);
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
}

.item-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.item-name {
    color: #e0e0e0;
    font-weight: 500;
}

.item-amount {
    color: #64ffda;
    font-weight: bold;
    font-size: 1.1rem;
}

.btn-claim {
    background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
    color: #1a1f25;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
}

.btn-claim:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
    filter: brightness(1.1);
}

.btn-claim:active {
    transform: translateY(0);
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.ui-btn.btn-exit:hover {
    background: rgba(231, 76, 60, 0.15);
    border-color: rgba(231, 76, 60, 0.8);
}

.bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-top: 1rem;
}

.controls-hint {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.85rem;
    color: #a0aec0;
}

.key {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
}

.encounter-rate {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(231, 76, 60, 0.2);
    border: 1px solid rgba(231, 76, 60, 0.4);
    border-radius: 8px;
}

.rate-label {
    color: #e74c3c;
    font-size: 0.85rem;
}

.rate-value {
    color: #fff;
    font-weight: bold;
    font-size: 1.1rem;
}

/* 遭遇提示覆盖层 */
.encounter-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.3s ease;
}

.encounter-content {
    text-align: center;
    animation: scaleIn 0.3s ease;
}

.encounter-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: shake 0.5s ease;
}

.encounter-text {
    font-size: 1.8rem;
    color: #e74c3c;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.encounter-monster {
    font-size: 1.2rem;
    color: #f39c12;
}

/* 退出确认弹窗 */
.exit-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.exit-content {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(100, 255, 218, 0.3);
    text-align: center;
    min-width: 300px;
    animation: scaleIn 0.2s ease;
}

.exit-content h2 {
    color: #64ffda;
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
}

.exit-content p {
    color: #a0aec0;
    margin: 0 0 1.5rem 0;
}

.exit-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.btn-confirm,
.btn-cancel {
    padding: 0.7rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
}

.btn-confirm {
    background: #64ffda;
    color: #0f1215;
    font-weight: bold;
}

.btn-confirm:hover {
    background: #4fd1b0;
    transform: translateY(-2px);
}

.btn-cancel {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-cancel:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* 动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        transform: scale(0.8);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes shake {
    0%, 100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-5px);
    }
    75% {
        transform: translateX(5px);
    }
}
</style>
