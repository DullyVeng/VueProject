<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useCombatStore } from '../stores/combat'
import { useCharacterStore } from '../stores/character'
import { useInventoryStore } from '../stores/inventory'
import { useQuestStore } from '../stores/quest'
import { maps, areas, getMapById, getConnectedMaps, getUnlockedMaps } from '../data/maps'
import { mapPositions } from '../data/mapPositions'
import { getItemById } from '../data/items'
import { getNpcsByLocation } from '../data/npcs'
import NpcDialog from '../components/NpcDialog.vue'
import ShopDialog from '../components/ShopDialog.vue'
import QuestListDialog from '../components/QuestListDialog.vue'

const router = useRouter()
const gameStore = useGameStore()
const combatStore = useCombatStore()
const characterStore = useCharacterStore()
const questStore = useQuestStore()

const currentMap = computed(() => getMapById(gameStore.currentLocationId))
const connections = computed(() => getConnectedMaps(gameStore.currentLocationId))

// NPC系统
const currentNpcs = computed(() => getNpcsByLocation(gameStore.currentLocationId))
const selectedNpc = ref(null)
const showNpcDialog = ref(false)
const showShop = ref(false)
const showQuestList = ref(false)

const openNpcDialog = (npc) => {
    selectedNpc.value = npc
    showNpcDialog.value = true
}

const closeNpcDialog = () => {
    showNpcDialog.value = false
    selectedNpc.value = null
}

const openShop = (npc) => {
    showNpcDialog.value = false
    selectedNpc.value = npc
    showShop.value = true
}

const closeShop = () => {
    showShop.value = false
    selectedNpc.value = null
}

const openQuestList = (npc) => {
    showNpcDialog.value = false
    selectedNpc.value = npc
    showQuestList.value = true
}

const closeQuestList = () => {
    showQuestList.value = false
    selectedNpc.value = null
}

// 获取解锁的地图
const unlockedMaps = computed(() => {
    return getUnlockedMaps(
        characterStore.character?.level || 1,
        [],
        []
    )
})

const handleTravel = (mapId) => {
    const canReach = connections.value.some(m => m.id === mapId)
    if (!canReach) {
        alert('该地图无法直接到达！')
        return
    }
    gameStore.travelTo(mapId)
}

const handleExplore = () => {
    if (currentMap.value.type === 'wild' || currentMap.value.type === 'dungeon') {
        combatStore.startCombat(currentMap.value.level)
        router.push('/combat')
    }
}

// 采集系统
const { addItem } = useInventoryStore()
const gathering = ref(false)
const gatherResult = ref(null)
const showResult = ref(false)

// 采集资源掉落算法
const gatherResources = (mapResources) => {
    const gathered = []
    
    if (!mapResources || mapResources.length === 0) {
        return gathered
    }
    
    for (const resource of mapResources) {
        const roll = Math.random()
        if (roll <= resource.dropRate) {
            gathered.push({
                id: resource.id,
                name: resource.name,
                quantity: 1,
                rarity: resource.rarity
            })
        }
    }
    
    return gathered
}

// 处理采集
const handleGather = async () => {
    // 1. 检查是否有资源
    if (!currentMap.value.resources || currentMap.value.resources.length === 0) {
        alert('当前地图没有可采集的资源！')
        return
    }
    
    // 2. 检查行动点
    const currentAP = characterStore.character?.current_action_points || 0
    if (currentAP < 1) {
        alert('行动点不足！需要1点行动点进行采集。')
        return
    }
    
    // 3. 开始采集
    gathering.value = true
    
    // 模拟采集时间
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 4. 消耗行动点
    const consumed = await characterStore.consumeActionPoints(1)
    if (!consumed) {
        alert('消耗行动点失败，请重试。')
        gathering.value = false
        return
    }
    
    // 5. 随机获得资源
    const gathered = gatherResources(currentMap.value.resources)
    
    // 6. 添加到背包
    for (const item of gathered) {
        await addItem(item.id, item.quantity)
    }
    
    // 6.5. 更新采集任务进度
    gathered.forEach(item => {
        questStore.checkCollectQuest(item.id)
    })
    
    // 7. 显示结果
    gatherResult.value = {
        success: gathered.length > 0,
        items: gathered,
        apUsed: 1,
        apRemaining: characterStore.character.current_action_points,
        apMax: characterStore.character.max_action_points
    }
    showResult.value = true
    gathering.value = false
}

const closeResult = () => {
    showResult.value = false
    gatherResult.value = null
}

const goHome = () => {
    router.push('/')
}

// 获取特性图标和名称
const getFeatureIcon = (feature) => {
    const icons = {
        combat: '⚔️', resource: '🌿', npc: '💬',
        shop: '🏪', quest: '❗', rest: '🛏️', event: '✨'
    }
    return icons[feature] || '📍'
}

const getFeatureName = (feature) => {
    const names = {
        combat: '战斗', resource: '采集', npc: 'NPC',
        shop: '商店', quest: '任务', rest: '休息', event: '事件'
    }
    return names[feature] || feature
}

// 地图可视化相关
const mapWidth = 600
const mapHeight = 400
const nodeRadius = 30

// 检查地图是否解锁
const isMapUnlocked = (mapId) => {
    return unlockedMaps.value.some(m => m.id === mapId)
}

// 检查地图是否可达
const isMapReachable = (mapId) => {
    return connections.value.some(m => m.id === mapId)
}

// 绘制连接线
const getMapConnections = computed(() => {
    const lines = []
    connections.value.forEach(targetMap => {
        const currentPos = mapPositions[currentMap.value.id]
        const targetPos = mapPositions[targetMap.id]
        
        if (currentPos && targetPos) {
            lines.push({
                x1: currentPos.x,
                y1: currentPos.y,
                x2: targetPos.x,
                y2: targetPos.y,
                mapId: targetMap.id
            })
        }
    })
    return lines
})

// 获取要显示的所有地图节点（当前位置+可达+部分不可达）
const visibleMaps = computed(() => {
    const visible = new Set([currentMap.value.id])
    
    // 添加可达的地图
    connections.value.forEach(m => visible.add(m.id))
    
    // 添加可达地图的邻居（显示为迷雾）
    connections.value.forEach(conn => {
        const connMap = getMapById(conn.id)
        if (connMap) {
            connMap.connections.forEach(neighborId => {
                if (neighborId !== currentMap.value.id) {
                    visible.add(neighborId)
                }
            })
        }
    })
    
    return Array.from(visible).map(id => getMapById(id)).filter(Boolean)
})
</script>

<template>
  <div class="map-container">
    <!-- 返回按钮 -->
    <button class="btn-back-float" @click="goHome">🏠 返回首页</button>
    
    <div class="map-layout">
      <!-- 左侧：当前地图详情 -->
      <div class="left-panel">
        <h1 class="panel-title">当前位置</h1>
        
        <div class="location-card" :class="currentMap.type">
          <div class="card-header">
            <span class="map-icon-large">{{ currentMap.visual?.icon }}</span>
            <div>
              <h2>{{ currentMap.name }}</h2>
              <span class="area-badge">{{ areas[currentMap.area]?.name }}</span>
              <span class="badge" :class="currentMap.type">
                {{ currentMap.type === 'wild' ? '危险' : currentMap.type === 'dungeon' ? '副本' : '安全' }}
              </span>
            </div>
          </div>
          
          <p class="desc">{{ currentMap.description }}</p>
          
          <div class="level-info" v-if="currentMap.level">
            <span>💪 推荐等级：Lv.{{ currentMap.level[0] }}-{{ currentMap.level[1] }}</span>
          </div>

          <!-- 地图特性 -->
          <div class="features" v-if="currentMap.features?.length">
            <h4>可用活动：</h4>
            <div class="feature-tags">
              <span v-for="feature in currentMap.features" :key="feature" class="feature-tag">
                {{ getFeatureIcon(feature) }} {{ getFeatureName(feature) }}
              </span>
            </div>
          </div>

          <!-- 资源信息 -->
          <div class="resources-info" v-if="currentMap.resources?.length">
            <h4>🌿 可采集资源：</h4>
            <div class="resource-list">
              <span v-for="resource in currentMap.resources" :key="resource.id"
                class="resource-item" :class="resource.rarity">
                {{ resource.name }}
              </span>
            </div>
          </div>

          <!-- NPC列表 -->
          <div class="npcs-section" v-if="currentNpcs.length > 0">
            <h4>💬 此地NPC：</h4>
            <div class="npc-list">
              <button 
                v-for="npc in currentNpcs" 
                :key="npc.id"
                class="npc-button"
                @click="openNpcDialog(npc)">
                <span class="npc-avatar-small">{{ npc.avatar }}</span>
                <span class="npc-name-small">{{ npc.name }}</span>
              </button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions">
            <button v-if="currentMap.features?.includes('combat')" class="btn-explore" @click="handleExplore">
              ⚔️ 探索战斗
            </button>
            <button 
              v-if="currentMap.features?.includes('resource')" 
              class="btn-gather"
              :disabled="gathering || (characterStore.character?.current_action_points || 0) < 1"
              @click="handleGather">
              <span v-if="gathering">⏳ 采集中...</span>
              <span v-else>🌿 采集资源 (1AP)</span>
            </button>
            <button v-if="currentMap.features?.includes('npc')" class="btn-npc" disabled>
              💬 寻找NPC (开发中)
            </button>
          </div>

          <!-- 行动点显示 -->
          <div class="action-points" v-if="characterStore.character">
            <span class="ap-label">⚡ 行动点：</span>
            <span class="ap-value">
              {{ characterStore.character.current_action_points || 0 }} / 
              {{ characterStore.character.max_action_points || 10 }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧：世界地图可视化 -->
      <div class="right-panel">
        <h1 class="panel-title">世界地图</h1>
        
        <div class="map-canvas-wrapper">
          <svg :width="mapWidth" :height="mapHeight" class="map-svg">
            <!-- 绘制连接线 -->
            <g class="connections-layer">
              <line v-for="(line, idx) in getMapConnections" :key="`line-${idx}`"
                :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
                class="connection-line reachable"
                stroke="#64ffda" stroke-width="2" stroke-dasharray="5,5"
              />
            </g>

            <!-- 绘制地图节点 -->
            <g class="nodes-layer">
              <g v-for="map in visibleMaps" :key="map.id" 
                :class="['map-node', {
                  current: map.id === currentMap.id,
                  reachable: isMapReachable(map.id),
                  locked: !isMapUnlocked(map.id)
                }]"
                @click="isMapReachable(map.id) && handleTravel(map.id)">
                
                <!-- 节点圆圈 -->
                <circle :cx="mapPositions[map.id]?.x || 0" 
                  :cy="mapPositions[map.id]?.y || 0" 
                  :r="nodeRadius"
                  :class="[map.type, {
                    current: map.id === currentMap.id,
                    reachable: isMapReachable(map.id),
                    locked: !isMapUnlocked(map.id)
                  }]"
                />
                
                <!-- 地图图标 -->
                <text :x="mapPositions[map.id]?.x || 0" 
                  :y="(mapPositions[map.id]?.y || 0) + 5" 
                  text-anchor="middle"
                  class="map-icon-svg"
                  :class="{ locked: !isMapUnlocked(map.id) }">
                  {{ isMapUnlocked(map.id) ? (map.visual?.icon || '📍') : '❓' }}
                </text>
                
                <!-- 地图名称 -->
                <text :x="mapPositions[map.id]?.x || 0" 
                  :y="(mapPositions[map.id]?.y || 0) + nodeRadius + 15" 
                  text-anchor="middle"
                  class="map-name-svg"
                  :class="{ locked: !isMapUnlocked(map.id) }">
                  {{ isMapUnlocked(map.id) ? map.name : '未知区域' }}
                </text>
                
                <!-- 当前位置标记 -->
                <circle v-if="map.id === currentMap.id"
                  :cx="mapPositions[map.id]?.x || 0" 
                  :cy="mapPositions[map.id]?.y || 0" 
                  :r="nodeRadius + 8"
                  class="current-indicator"
                  fill="none"
                  stroke="#64ffda"
                  stroke-width="3"
                  opacity="0.8"
                />
              </g>
            </g>
          </svg>
          
          <!-- 图例 -->
          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-dot current"></span>
              <span>当前位置</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot reachable"></span>
              <span>可前往</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot locked"></span>
              <span>未探索</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 采集结果弹窗 -->
    <div v-if="showResult" class="result-modal" @click.self="closeResult">
      <div class="result-content">
        <h2>{{ gatherResult.success ? '✅ 采集成功' : '⚠️ 采集失败' }}</h2>
        
        <div v-if="gatherResult.success && gatherResult.items.length > 0" class="result-items">
          <div v-for="item in gatherResult.items" :key="item.id" class="result-item" :class="item.rarity">
            <span class="item-icon">{{ getItemById(item.id)?.icon || '📦' }}</span>
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">×{{ item.quantity }}</span>
          </div>
        </div>
        
        <div v-else class="no-items">
          <p>未能找到任何资源...</p>
          <p class="tip">💡 提示：每种资源都有一定的掉落概率</p>
        </div>
        
        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">消耗行动点：</span>
            <span class="stat-value">{{ gatherResult.apUsed }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">剩余行动点：</span>
            <span class="stat-value">{{ gatherResult.apRemaining }} / {{ gatherResult.apMax }}</span>
          </div>
        </div>
        
        <button class="btn-close" @click="closeResult">确定</button>
      </div>
    </div>

    <!-- NPC对话框 -->
    <NpcDialog 
      v-if="showNpcDialog && selectedNpc"
      :npc="selectedNpc"
      @close="closeNpcDialog"
      @openShop="openShop"
      @viewQuests="openQuestList"
    />

    <!-- 商店界面 -->
    <ShopDialog 
      v-if="showShop && selectedNpc"
      :npc="selectedNpc"
      @close="closeShop"
    />

    <!-- 任务列表 -->
    <QuestListDialog 
      v-if="showQuestList && selectedNpc"
      :npc="selectedNpc"
      @close="closeQuestList"
    />
  </div>
</template>

<style scoped>
.map-container {
  min-height: 100vh;
  background: #0f1215;
  color: #fff;
  padding: 1rem;
}

.btn-back-float {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  z-index: 1000;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.btn-back-float:hover {
  background: rgba(100, 255, 218, 0.2);
  border-color: #64ffda;
  transform: translateY(-2px);
}

.map-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 4rem;
}

.left-panel, .right-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.panel-title {
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  color: #64ffda;
  font-weight: bold;
}

/* 左侧面板样式 */
.location-card {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.05);
}

.location-card.wild {
  border-color: rgba(231, 76, 60, 0.4);
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.15);
}

.location-card.dungeon {
  border-color: rgba(155, 89, 182, 0.4);
  box-shadow: 0 4px 20px rgba(155, 89, 182, 0.15);
}

.location-card.safe {
  border-color: rgba(46, 204, 113, 0.4);
  box-shadow: 0 4px 20px rgba(46, 204, 113, 0.15);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-header > div {
  flex: 1;
}

.map-icon-large {
  font-size: 3rem;
}

.card-header h2 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.area-badge {
  display: inline-block;
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  border: 1px solid rgba(52, 152, 219, 0.3);
  margin-right: 0.5rem;
}

.badge {
  padding: 0.3rem 0.7rem;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: bold;
}

.badge.wild {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.4);
}

.badge.dungeon {
  background: rgba(155, 89, 182, 0.2);
  color: #9b59b6;
  border: 1px solid rgba(155, 89, 182, 0.4);
}

.badge.safe {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.4);
}

.desc {
  color: #a0aec0;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.level-info {
  margin: 1rem 0;
  padding: 0.5rem 0.8rem;
  background: rgba(52, 152, 219, 0.1);
  border-left: 3px solid #3498db;
  border-radius: 4px;
  font-size: 0.85rem;
}

.features, .resources-info, .npcs-info {
  margin: 1rem 0;
}

.features h4, .resources-info h4, .npcs-info h4 {
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.feature-tags, .resource-list, .npc-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.feature-tag {
  padding: 0.3rem 0.7rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  font-size: 0.75rem;
}

.resource-item {
  padding: 0.3rem 0.6rem;
  border-radius: 10px;
  font-size: 0.75rem;
  border: 1px solid;
}

.resource-item.common {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
  border-color: rgba(149, 165, 166, 0.3);
}

.resource-item.uncommon {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border-color: rgba(46, 204, 113, 0.3);
}

.resource-item.rare {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border-color: rgba(52, 152, 219, 0.3);
}

.npc-item {
  padding: 0.3rem 0.6rem;
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  border: 1px solid rgba(243, 156, 18, 0.3);
  border-radius: 10px;
  font-size: 0.75rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.5rem;
}

.btn-explore {
  padding: 0.8rem 1.2rem;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
  transition: all 0.3s;
}

.btn-explore:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.btn-gather, .btn-npc {
  padding: 0.8rem 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #666;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: not-allowed;
}

/* 右侧地图可视化样式 */
.map-canvas-wrapper {
  position: relative;
}

.map-svg {
  width: 100%;
  height: auto;
  background: radial-gradient(circle at 50% 50%, #1a202c 0%, #0f1215 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.connection-line.reachable {
  stroke: #64ffda;
  stroke-width: 2;
  opacity: 0.6;
  animation: dash 20s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

.map-node {
  cursor: pointer;
  transition: all 0.3s;
}

.map-node.reachable:hover circle {
  filter: brightness(1.3) drop-shadow(0 0 8px currentColor);
  stroke-width: 3;
}

.map-node.locked {
  cursor: default;
  opacity: 0.4;
}

.map-node circle {
  transition: all 0.3s;
}

.map-node circle.current {
  fill: #64ffda;
  stroke: #64ffda;
  stroke-width: 3;
  filter: drop-shadow(0 0 10px #64ffda);
}

.map-node circle.reachable {
  fill: rgba(100, 255, 218, 0.2);
  stroke: #64ffda;
  stroke-width: 2;
}

.map-node circle.wild {
  fill: rgba(231, 76, 60, 0.3);
  stroke: #e74c3c;
  stroke-width: 2;
}

.map-node circle.dungeon {
  fill: rgba(155, 89, 182, 0.3);
  stroke: #9b59b6;
  stroke-width: 2;
}

.map-node circle.safe {
  fill: rgba(46, 204, 113, 0.3);
  stroke: #2ecc71;
  stroke-width: 2;
}

.map-node circle.locked {
  fill: rgba(50, 50, 50, 0.5);
  stroke: #555;
  stroke-width: 2;
  filter: none;
}

.map-icon-svg {
  font-size: 20px;
  user-select: none;
  pointer-events: none;
}

.map-icon-svg.locked {
  opacity: 0.5;
}

.map-name-svg {
  font-size: 11px;
  fill: #fff;
  user-select: none;
  pointer-events: none;
}

.map-name-svg.locked {
  fill: #666;
}

.current-indicator {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    stroke-width: 3;
  }
  50% {
    opacity: 1;
    stroke-width: 4;
  }
}

.map-legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid;
}

.legend-dot.current {
  background: #64ffda;
  border-color: #64ffda;
  box-shadow: 0 0 8px #64ffda;
}

.legend-dot.reachable {
  background: rgba(100, 255, 218, 0.2);
  border-color: #64ffda;
}

.legend-dot.locked {
  background: rgba(50, 50, 50, 0.5);
  border-color: #555;
}

/* 采集按钮增强 */
.btn-gather {
  padding: 0.8rem 1.2rem;
  background: linear-gradient(45deg, #2ecc71, #27ae60);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
  transition: all 0.3s;
}

.btn-gather:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
}

.btn-gather:disabled {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
  box-shadow: none;
}

/* 行动点显示 */
.action-points {
  margin-top: 1rem;
  padding: 0.6rem 0.8rem;
  background: rgba(100, 255, 218, 0.1);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.ap-label {
  font-size: 0.85rem;
  color: #718096;
}

.ap-value {
  font-size: 1rem;
  font-weight: bold;
  color: #64ffda;
}

/* 采集结果弹窗 */
.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-content {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  border: 2px solid rgba(100, 255, 218, 0.3);
  border-radius: 16px;
  padding: 2rem;
  min-width: 400px;
  max-width: 500px;
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.result-content h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
  color: #64ffda;
}

.result-items {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s;
}

.result-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.result-item.common {
  border-color: rgba(149, 165, 166, 0.3);
}

.result-item.uncommon {
  border-color: rgba(46, 204, 113, 0.4);
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.2);
}

.result-item.rare {
  border-color: rgba(52, 152, 219, 0.4);
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.3);
}

.item-icon {
  font-size: 2rem;
}

.item-name {
  flex: 1;
  font-weight: bold;
  font-size: 1.1rem;
}

.item-quantity {
  color: #64ffda;
  font-size: 1.1rem;
  font-weight: bold;
}

.no-items {
  text-align: center;
  padding: 2rem 1rem;
  color: #718096;
}

.no-items .tip {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.result-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #718096;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #64ffda;
}

.btn-close {
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(45deg, #64ffda, #3498db);
  border: none;
  border-radius: 8px;
  color: #0f1215;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(100, 255, 218, 0.4);
}

/* NPC列表样式 */
.npcs-section {
  margin: 1rem 0;
}

.npcs-section h4 {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.npc-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.npc-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(243, 156, 18, 0.1);
  border: 1px solid rgba(243, 156, 18, 0.3);
  border-radius: 20px;
  color: #f39c12;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.npc-button:hover {
  background: rgba(243, 156, 18, 0.2);
  border-color: #f39c12;
  transform: translateY(-2px);
}

.npc-avatar-small {
  font-size: 1.2rem;
}

.npc-name-small {
  font-weight: bold;
}

@media (max-width: 1200px) {
  .map-layout {
    grid-template-columns: 1fr;
  }
  
  .result-content {
    min-width: 90%;
    max-width: 90%;
  }
}
</style>
