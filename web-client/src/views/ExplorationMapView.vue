<script setup>
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

const mapReady = ref(false)
const isMovingLocally = ref(false)
const showInventory = ref(false)
const showCharacter = ref(false)
const showTasks = ref(false)
const showRewardModal = ref(false)
const rewardList = ref([])

const canvasRef = ref(null)
const containerRef = ref(null)
const isMobile = ref(false)

const TILE_SIZE = 32
const PLAYER_SIZE = 24
const MONSTER_SIZE = 20
const playerSpriteFrame = ref(0)
let animationFrameId = null

const checkMobile = () => { isMobile.value = window.innerWidth <= 768 }

onMounted(async () => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    const mapId = route.params.mapId
    if (!mapId) return router.push('/map')

    const savedMapData = localStorage.getItem(`exploration_map_data_${mapId}`)
    const success = await explorationStore.enterMap(mapId, !savedMapData)
    if (!success) return router.push('/map')

    await nextTick()
    initCanvas()
    startAnimation()
    setTimeout(() => { mapReady.value = true }, 150)
    window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('keydown', handleKeyDown)
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

watch(() => explorationStore.playerPosition, () => drawMap(), { deep: true })
watch(() => explorationStore.defeatedMonsters, () => drawMap(), { deep: true })

const initCanvas = () => {
    const canvas = canvasRef.value
    if (!canvas || !explorationStore.currentMap) return
    canvas.width = 640
    canvas.height = 480
    drawMap()
}

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

const drawMap = () => {
    const canvas = canvasRef.value
    if (!canvas || !explorationStore.currentMap) return
    const ctx = canvas.getContext('2d')
    const map = explorationStore.currentMap
    const pos = explorationStore.playerPosition
    const cameraX = Math.max(0, Math.min(pos.x * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2, map.width * TILE_SIZE - canvas.width))
    const cameraY = Math.max(0, Math.min(pos.y * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2, map.height * TILE_SIZE - canvas.height))

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(-cameraX, -cameraY)

    const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE))
    const endX = Math.min(map.width, Math.ceil((cameraX + canvas.width) / TILE_SIZE))
    const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE))
    const endY = Math.min(map.height, Math.ceil((cameraY + canvas.height) / TILE_SIZE))

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const terrain = map.terrain.length === map.width * map.height ? map.terrain[y * map.width + x] : map.terrain[y][x]
            const style = TERRAIN_STYLES[terrain] || TERRAIN_STYLES[TERRAIN_TYPES.GROUND]
            ctx.fillStyle = style.color
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            if (terrain === TERRAIN_TYPES.EXIT) {
                ctx.fillStyle = '#ffc864'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('↩', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2)
            }
        }
    }
    explorationStore.availableChests.forEach(c => drawChest(ctx, c))
    explorationStore.visibleMonsters.forEach(m => drawMonster(ctx, m))
    if (explorationStore.currentMap?.boss) {
        if (!explorationStore.bossDefeated) drawBoss(ctx, explorationStore.currentMap.boss)
        else drawBossExit(ctx, explorationStore.currentMap.boss)
    }
    drawPlayer(ctx)
    ctx.restore()
    if (explorationStore.bossDirection) drawBossDirection(ctx)
}

const drawPlayer = (ctx) => {
    const pos = explorationStore.playerPosition
    const x = pos.x * TILE_SIZE + TILE_SIZE / 2, y = pos.y * TILE_SIZE + TILE_SIZE / 2
    ctx.fillStyle = '#64ffda'; ctx.beginPath(); ctx.arc(x, y, PLAYER_SIZE / 2, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
    const dir = explorationStore.playerDirection, offset = PLAYER_SIZE / 2 - 4
    let ax = x, ay = y
    if (dir === 'up') ay -= offset; else if (dir === 'down') ay += offset; else if (dir === 'left') ax -= offset; else ax += offset
    ctx.fillStyle = '#0f1215'; ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill()
}

const drawMonster = (ctx, m) => {
    const x = m.x * TILE_SIZE + TILE_SIZE / 2, y = m.y * TILE_SIZE + TILE_SIZE / 2
    ctx.fillStyle = m.isElite ? '#f39c12' : '#e74c3c'; ctx.fillRect(x - 10, y - 10, 20, 20)
    ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText(m.level, x, y + 4)
}

const drawBoss = (ctx, b) => {
    const x = b.x * TILE_SIZE + TILE_SIZE / 2, y = b.y * TILE_SIZE + TILE_SIZE / 2
    ctx.fillStyle = 'rgba(192,57,43,0.3)'; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 20, y - 20, 40, 40)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(b.level, x, y + 5)
}

const drawBossExit = (ctx, b) => {
    const x = b.x * TILE_SIZE + TILE_SIZE / 2, y = b.y * TILE_SIZE + TILE_SIZE / 2
    ctx.fillStyle = 'rgba(241,196,15,0.3)'; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#f1c40f'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('👑', x, y - 5)
}

const drawChest = (ctx, c) => {
    const x = c.x * TILE_SIZE + TILE_SIZE / 2, y = c.y * TILE_SIZE + TILE_SIZE / 2
    ctx.fillStyle = c.type === 'golden' ? '#f39c12' : '#8b4513'; ctx.fillRect(x - 14, y - 14, 28, 28)
    ctx.fillStyle = '#fff'; ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.fillText('📦', x, y + 6)
}

const drawBossDirection = (ctx) => {
    const dir = explorationStore.bossDirection
    if (!dir || dir.distance < 10) return
    const canvas = canvasRef.value, cx = canvas.width / 2, cy = canvas.height / 2, rad = dir.angle * Math.PI / 180
    const ax = cx + Math.cos(rad) * 200, ay = cy + Math.sin(rad) * 200
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(rad); ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10); ctx.fill(); ctx.restore()
}

const movePlayer = async (direction) => {
    if (explorationStore.pendingEncounter || isMovingLocally.value) return
    isMovingLocally.value = true
    const result = await explorationStore.movePlayer(direction)
    if (result.encounter) handleEncounter(result.encounter)
    else if (result.chest && result.chest.loot?.length) {
        rewardList.value = result.chest.loot.map(i => ({ ...i, ...getItemById(i.id) }))
        showRewardModal.value = true
    }
    setTimeout(() => { isMovingLocally.value = false }, 160)
}

const handleKeyDown = (e) => {
    if (explorationStore.showExitConfirm) return
    const keyMap = { 'ArrowUp': 'up', 'w': 'up', 'W': 'up', 'ArrowDown': 'down', 's': 'down', 'S': 'down', 'ArrowLeft': 'left', 'a': 'left', 'A': 'left', 'ArrowRight': 'right', 'd': 'right', 'D': 'right' }
    if (keyMap[e.key]) { e.preventDefault(); movePlayer(keyMap[e.key]) }
    if (e.key === 'Escape') explorationStore.showExitConfirm = true
}

const handleEncounter = (e) => {
    setTimeout(() => {
        explorationStore.isInCombat = true
        combatStore.startCombat(e.monster)
        router.push('/combat')
    }, 400)
}

const confirmExit = async () => {
    await gameStore.travelTo(explorationStore.currentMap?.parentMapId || 'town')
    explorationStore.exitMap()
    router.push('/map')
}

const closeRewardModal = () => { showRewardModal.value = false; rewardList.value = [] }
</script>

<template>
    <div class="exploration-container" ref="containerRef">
        <div class="ui-controls" :class="{ 'is-mobile-ui': isMobile }">
            <button class="ui-btn" @click="showCharacter = !showCharacter"><span class="icon">👤</span><span class="label">角色</span></button>
            <button class="ui-btn" @click="showInventory = !showInventory"><span class="icon">🎒</span><span class="label">背包</span></button>
            <button class="ui-btn" @click="router.push('/dantian')"><span class="icon">✨</span><span class="label">法宝</span></button>
            <button class="ui-btn" @click="showTasks = !showTasks"><span class="icon">📋</span><span class="label">任务</span></button>
            <button class="ui-btn btn-exit" @click="explorationStore.showExitConfirm = true"><span class="icon">🚪</span><span class="label">退出</span></button>
        </div>

        <div class="map-wrapper" :class="{ 'is-ready': mapReady }">
            <canvas ref="canvasRef" class="map-canvas"></canvas>
            <div v-if="explorationStore.pendingEncounter" class="encounter-overlay">
                <div class="encounter-content">
                    <div class="encounter-icon">⚔️</div>
                    <div class="encounter-text">{{ explorationStore.pendingEncounter.type === 'boss' ? '遭遇BOSS！' : '遭遇强敌！' }}</div>
                </div>
            </div>
            <div v-if="isMobile" class="mobile-dpad">
                <button class="dpad-btn up" @click="movePlayer('up')">▲</button>
                <div class="dpad-mid"><button class="dpad-btn left" @click="movePlayer('left')">◀</button><div class="dpad-center"></div><button class="dpad-btn right" @click="movePlayer('right')">▶</button></div>
                <button class="dpad-btn down" @click="movePlayer('down')">▼</button>
            </div>
        </div>

        <div class="bottom-bar" v-if="!isMobile">
            <div class="encounter-rate">遭遇率: {{ explorationStore.encounterRatePercent }}%</div>
        </div>

        <CharacterPanel :show="showCharacter" @close="showCharacter = false" />
        <InventoryPanel :show="showInventory" @close="showInventory = false" />
        <TaskSidebar :show="showTasks" @close="showTasks = false" />

        <div v-if="explorationStore.showExitConfirm" class="exit-modal">
            <div class="exit-content">
                <h2>确认退出</h2>
                <div class="exit-buttons">
                    <button class="btn-confirm" @click="confirmExit">确定</button>
                    <button class="btn-cancel" @click="explorationStore.showExitConfirm = false">取消</button>
                </div>
            </div>
        </div>

        <div v-if="showRewardModal" class="reward-modal" @click.self="closeRewardModal">
            <div class="reward-content">
                <h2>✨ 获得奖励 ✨</h2>
                <div class="reward-list">
                    <div v-for="(item, index) in rewardList" :key="index" class="reward-item">
                        <div class="item-icon">{{ item.icon }}</div>
                        <div class="item-info"><span>{{ item.name }}</span><span>x{{ item.amount }}</span></div>
                    </div>
                </div>
                <button class="btn-claim" @click="closeRewardModal">收入囊中</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.exploration-container {
    height: 100vh; height: 100dvh; background: #0f1215; color: #fff;
    display: flex; flex-direction: column; overflow: hidden; padding: 0;
}
.map-wrapper {
    flex: 1; display: flex; justify-content: center; align-items: center;
    position: relative; overflow: hidden; opacity: 0; transition: opacity 0.3s ease;
}
.map-wrapper.is-ready { opacity: 1; }
.map-canvas {
    border: 2px solid rgba(100, 255, 218, 0.2); border-radius: 8px;
    max-width: 95%; height: auto !important; image-rendering: pixelated;
}
.ui-controls {
    position: fixed; top: 10px; left: 10px; right: 10px; display: flex;
    justify-content: center; gap: 8px; z-index: 100;
}
.is-mobile-ui { background: rgba(0,0,0,0.6); padding: 8px; border-radius: 12px; backdrop-filter: blur(10px); }
.ui-btn {
    display: flex; flex-direction: column; align-items: center; padding: 8px;
    background: none; border: none; cursor: pointer; color: #64ffda; min-width: 50px;
}
.ui-btn .icon { font-size: 1.2rem; }
.ui-btn .label { font-size: 0.6rem; }
.mobile-dpad {
    position: absolute; bottom: 30px; right: 20px; display: flex; flex-direction: column;
    align-items: center; gap: 5px; z-index: 150; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 50%;
}
.dpad-mid { display: flex; align-items: center; gap: 5px; }
.dpad-btn {
    width: 48px; height: 48px; background: rgba(255,255,255,0.1); border: 2px solid rgba(100,255,218,0.4);
    color: #64ffda; border-radius: 12px; font-size: 1.2rem; display: flex; justify-content: center; align-items: center;
}
.dpad-center { width: 48px; height: 48px; }
.encounter-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; }
.encounter-text { font-size: 1.5rem; color: #e74c3c; font-weight: bold; }
.exit-modal, .reward-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.exit-content, .reward-content { background: #1a202c; padding: 2rem; border-radius: 12px; border: 1px solid #64ffda; text-align: center; }
.exit-buttons { display: flex; gap: 1rem; margin-top: 1rem; }
.btn-confirm { background: #64ffda; color: #000; padding: 0.5rem 1.5rem; border: none; border-radius: 4px; font-weight: bold; }
.btn-cancel { background: #444; color: #fff; padding: 0.5rem 1.5rem; border: none; border-radius: 4px; }
.reward-list { margin: 1rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
.reward-item { display: flex; gap: 1rem; align-items: center; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 8px; }
.btn-claim { width: 100%; padding: 0.8rem; background: #f1c40f; border: none; border-radius: 4px; font-weight: bold; }
</style>