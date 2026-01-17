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
import { TERRAIN_TYPES, TERRAIN_STYLES } from '../data/explorationMaps'
import InventoryPanel from '../components/game/InventoryPanel.vue'
import CharacterPanel from '../components/game/CharacterPanel.vue'

const router = useRouter()
const route = useRoute()
const explorationStore = useExplorationStore()
const combatStore = useCombatStore()
const gameStore = useGameStore()

// 面板显示状态
const showInventory = ref(false)
const showCharacter = ref(false)
const showDantian = ref(false)

// Canvas 引用
const canvasRef = ref(null)
const containerRef = ref(null)

// 地图配置
const TILE_SIZE = 32
const PLAYER_SIZE = 24
const MONSTER_SIZE = 20

// 玩家动画
const playerSpriteFrame = ref(0)
let animationFrameId = null

// 初始化
onMounted(async () => {
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
    window.removeEventListener('keydown', handleKeyDown)
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
    }
})

// 监听玩家位置变化重绘
watch(
    () => explorationStore.playerPosition,
    () => {
        drawMap()
    },
    { deep: true }
)

// 监听怪物击败变化重绘
watch(
    () => explorationStore.defeatedMonsters,
    () => {
        drawMap()
    },
    { deep: true }
)

// 初始化 Canvas
const initCanvas = () => {
    const canvas = canvasRef.value
    if (!canvas || !explorationStore.currentMap) return

    // 使用固定的视口大小（可见区域）
    const VIEWPORT_WIDTH = 640  // 20 格 * 32px
    const VIEWPORT_HEIGHT = 480 // 15 格 * 32px
    
    canvas.width = VIEWPORT_WIDTH
    canvas.height = VIEWPORT_HEIGHT

    drawMap()
}

// 开始动画循环
const startAnimation = () => {
    let lastTime = 0
    const animate = (time) => {
        if (time - lastTime > 300) {
            playerSpriteFrame.value = (playerSpriteFrame.value + 1) % 2
            lastTime = time
        }
        drawMap()
        animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)
}

// 绘制地图
const drawMap = () => {
    const canvas = canvasRef.value
    if (!canvas || !explorationStore.currentMap) return

    const ctx = canvas.getContext('2d')
    const map = explorationStore.currentMap
    const pos = explorationStore.playerPosition

    // 计算摄像机偏移，使玩家始终处于屏幕中心
    const cameraX = pos.x * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2
    const cameraY = pos.y * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2

    // 限制摄像机范围，防止显示地图边界外的内容
    const maxCameraX = map.width * TILE_SIZE - canvas.width
    const maxCameraY = map.height * TILE_SIZE - canvas.height
    const clampedCameraX = Math.max(0, Math.min(cameraX, maxCameraX))
    const clampedCameraY = Math.max(0, Math.min(cameraY, maxCameraY))

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 保存当前状态
    ctx.save()

    // 应用摄像机偏移
    ctx.translate(-clampedCameraX, -clampedCameraY)

    // 绘制地形
    // 绘制地形
    // 视口裁剪优化：只渲染当前屏幕可见范围内的格子
    // 计算可见区域的起始和结束索引（加减 1 是为了防止边缘闪烁）
    const startX = Math.max(0, Math.floor(clampedCameraX / TILE_SIZE))
    const endX = Math.min(map.width, Math.ceil((clampedCameraX + canvas.width) / TILE_SIZE))
    const startY = Math.max(0, Math.floor(clampedCameraY / TILE_SIZE))
    const endY = Math.min(map.height, Math.ceil((clampedCameraY + canvas.height) / TILE_SIZE))

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            // 访问地形数据 (兼容 1D Int8Array 和 2D 数组)
            let terrain
            if (map.terrain.length === map.width * map.height) {
                 // 1D 数组
                 terrain = map.terrain[y * map.width + x]
            } else {
                 // 2D 数组 (旧兼容)
                 terrain = map.terrain[y][x]
            }
            
            const style = TERRAIN_STYLES[terrain] || TERRAIN_STYLES[TERRAIN_TYPES.GROUND]

            ctx.fillStyle = style.color
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)

            // 绘制网格线
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)

            // 出口特殊标记
            if (terrain === TERRAIN_TYPES.EXIT) {
                ctx.fillStyle = 'rgba(255, 200, 100, 0.3)'
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                
                // 绘制出口箭头指示
                ctx.fillStyle = '#ffc864'
                ctx.font = '20px Arial'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('↩', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2)
            }
        }
    }

    // 绘制显性怪物
    explorationStore.visibleMonsters.forEach(monster => {
        drawMonster(ctx, monster)
    })

    // 绘制玩家
    drawPlayer(ctx)

    // 恢复状态
    ctx.restore()
}

// 绘制玩家
const drawPlayer = (ctx) => {
    const pos = explorationStore.playerPosition
    const x = pos.x * TILE_SIZE + TILE_SIZE / 2
    const y = pos.y * TILE_SIZE + TILE_SIZE / 2

    // 玩家身体（圆形）
    ctx.fillStyle = '#64ffda'
    ctx.beginPath()
    ctx.arc(x, y, PLAYER_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

    // 玩家边框
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 方向指示
    const dir = explorationStore.playerDirection
    const arrowOffset = PLAYER_SIZE / 2 - 4
    let arrowX = x, arrowY = y
    if (dir === 'up') arrowY -= arrowOffset
    else if (dir === 'down') arrowY += arrowOffset
    else if (dir === 'left') arrowX -= arrowOffset
    else if (dir === 'right') arrowX += arrowOffset

    ctx.fillStyle = '#0f1215'
    ctx.beginPath()
    ctx.arc(arrowX, arrowY, 4, 0, Math.PI * 2)
    ctx.fill()
}

// 绘制怪物
const drawMonster = (ctx, monster) => {
    const x = monster.x * TILE_SIZE + TILE_SIZE / 2
    const y = monster.y * TILE_SIZE + TILE_SIZE / 2

    // 怪物身体（红色方形）
    ctx.fillStyle = '#e74c3c'
    ctx.fillRect(
        x - MONSTER_SIZE / 2,
        y - MONSTER_SIZE / 2,
        MONSTER_SIZE,
        MONSTER_SIZE
    )

    // 怪物边框
    ctx.strokeStyle = '#c0392b'
    ctx.lineWidth = 2
    ctx.strokeRect(
        x - MONSTER_SIZE / 2,
        y - MONSTER_SIZE / 2,
        MONSTER_SIZE,
        MONSTER_SIZE
    )

    // 等级标识
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${monster.level}`, x, y)
}

// 键盘控制
const handleKeyDown = (e) => {
    // 如果显示退出确认弹窗，只处理确认/取消
    if (explorationStore.showExitConfirm) {
        if (e.key === 'Enter' || e.key === ' ') {
            confirmExit()
        } else if (e.key === 'Escape') {
            cancelExit()
        }
        return
    }

    // 如果有待处理的遭遇，跳过移动
    if (explorationStore.pendingEncounter) {
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
        const result = explorationStore.movePlayer(direction)

        // 处理遭遇
        if (result.encounter) {
            handleEncounter(result.encounter)
        }
    }

    // ESC 键尝试退出
    if (e.key === 'Escape') {
        e.preventDefault()
        explorationStore.showExitConfirm = true
    }
}

// 处理遭遇
const handleEncounter = (encounter) => {
    // 显示遭遇信息，然后进入战斗
    setTimeout(() => {
        const monsterLevel = encounter.monster.level || 1
        
        // combat.js 的 startCombat 需要 levelRange 数组参数
        // 将单个等级转换为等级范围 [level, level]
        const levelRange = [monsterLevel, monsterLevel]

        // 标记进入战斗（用于战斗后返回探索地图）
        explorationStore.isInCombat = true

        // 启动战斗
        combatStore.startCombat(levelRange)

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
                        {{ explorationStore.pendingEncounter.type === 'visible' ? '遭遇怪物！' : '随机遭遇！' }}
                    </div>
                    <div class="encounter-monster">
                        Lv.{{ explorationStore.pendingEncounter.monster.level }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部信息栏 -->
        <div class="bottom-bar">
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
        <div class="ui-controls">
            <button class="ui-btn" @click="showCharacter = !showCharacter" title="角色">
                <span class="icon">👤</span>
                <span class="label">角色</span>
            </button>
            <button class="ui-btn" @click="showInventory = !showInventory" title="背包">
                <span class="icon">🎒</span>
                <span class="label">背包</span>
            </button>
            <button class="ui-btn" @click="router.push('/dantian')" title="法宝">
                <span class="icon">✨</span>
                <span class="label">法宝</span>
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
}

/* UI控制按钮 */
.ui-controls {
    position: fixed;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 100;
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
