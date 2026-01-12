<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSectStore, BUILDING_STATUS } from '../stores/sect'
import { getBuildingConfig, getRegularBuildingsList, getSpecialBuildingsList } from '../data/sectBuildings'
import { getPlotTypeConfig } from '../data/sectPlots'

const router = useRouter()
const sectStore = useSectStore()

// 选中的地块
const selectedPlotId = ref(null)
// 显示建筑选择面板
const showBuildPanel = ref(false)
// 当前选中地块的类型
const selectedPlotType = ref(null)

// 格式化时间
const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${mins}分`
}

// 格式化材料显示
const formatMaterials = (materials) => {
    const names = {
        wood: '木材', stone: '石料', iron: '铁矿',
        jade: '玉璧', formationFlag: '阵旗', spiritStone: '灵石'
    }
    return Object.entries(materials)
        .map(([k, v]) => `${names[k] || k}×${v}`)
        .join(', ')
}

// 获取可建造的建筑列表
const getAvailableBuildings = (plotType) => {
    const regular = getRegularBuildingsList().filter(b => {
        return b.plotType === plotType && b.unlockLevel <= sectStore.sectLevel
    })
    const special = getSpecialBuildingsList().filter(b => {
        return (b.plotType === plotType || b.plotType === 'any') && 
               sectStore.isBlueprintUnlocked(b.blueprintId)
    })
    return [...regular, ...special]
}

// 点击地块
const selectPlot = (plot) => {
    selectedPlotId.value = plot.id
    selectedPlotType.value = plot.type
    
    // 如果地块没有建筑，显示建造面板
    if (!sectStore.buildings[plot.id]) {
        showBuildPanel.value = true
    } else {
        showBuildPanel.value = false
    }
}

// 开始建造
const startBuild = (buildingId) => {
    if (!selectedPlotId.value) return
    const result = sectStore.startBuildBuilding(selectedPlotId.value, buildingId)
    if (result.success) {
        showBuildPanel.value = false
        alert(`开始建造，预计需要 ${formatTime(result.buildTime)}`)
    } else {
        alert(result.reason)
    }
}

// 取消建造
const cancelBuild = (plotId) => {
    if (confirm('确定取消建造？材料不会返还！')) {
        const result = sectStore.cancelBuilding(plotId)
        alert(result.message || result.reason)
    }
}

// 拆除建筑
const demolish = (plotId) => {
    if (confirm('确定拆除该建筑？材料不会返还！')) {
        const result = sectStore.demolishBuilding(plotId)
        alert(result.message || result.reason)
    }
}

// 收集产出
const collect = (plotId) => {
    const result = sectStore.collectProduction(plotId)
    if (result.success) {
        alert(`收获了 ${result.production.amount} 个产出`)
        // 实际项目应该将产出添加到背包
    } else {
        alert(result.reason)
    }
}

// 恢复暂停的建筑
const resume = (plotId) => {
    const result = sectStore.resumeBuilding(plotId)
    alert(result.message || result.reason)
}

// 升级建筑
const upgrade = (plotId) => {
    const result = sectStore.upgradeBuilding(plotId)
    if (result.success) {
        alert(`升级成功！当前等级: ${result.newLevel}`)
    } else {
        alert(result.reason)
    }
}

// 升级宗门
const upgradeSect = () => {
    const result = sectStore.upgradeSect()
    if (result.success) {
        alert(`宗门升级成功！当前等级: ${result.newLevelName}`)
    } else {
        alert(`升级失败: ${result.missing?.join(', ')}`)
    }
}

// 定时刷新建造进度
const buildingProgress = ref({})
const updateProgress = () => {
    for (const [plotId, building] of Object.entries(sectStore.buildings)) {
        if (building.status === BUILDING_STATUS.BUILDING) {
            const progress = sectStore.checkBuildProgress(plotId)
            buildingProgress.value[plotId] = progress
        }
    }
}

onMounted(() => {
    updateProgress()
    setInterval(updateProgress, 1000)
})

const goBack = () => router.push('/')
</script>

<template>
  <div class="sect-container">
    <!-- 顶部导航 -->
    <header class="sect-header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h1>{{ sectStore.sectName }}</h1>
      <div class="sect-level">
        <span class="level-badge">{{ sectStore.currentLevelConfig?.name || '草创' }}</span>
        <span class="level-text">Lv.{{ sectStore.sectLevel }}</span>
      </div>
    </header>

    <div class="sect-content">
      <!-- 左侧：宗门信息面板 -->
      <aside class="info-panel">
        <div class="panel-section">
          <h3>📊 宗门信息</h3>
          <div class="info-item">
            <span>等级</span>
            <span>{{ sectStore.currentLevelConfig?.name }} ({{ sectStore.sectLevel }}/7)</span>
          </div>
          <div class="info-item">
            <span>地块</span>
            <span>{{ sectStore.builtBuildingsCount }}/{{ sectStore.availablePlots.length }}</span>
          </div>
          <button 
            class="btn-upgrade" 
            @click="upgradeSect"
            :disabled="!sectStore.upgradeCheck.canUpgrade"
          >
            升级宗门
          </button>
          <div v-if="!sectStore.upgradeCheck.canUpgrade" class="upgrade-hint">
            需要: {{ sectStore.upgradeCheck.missing?.join(', ') }}
          </div>
        </div>

        <div class="panel-section">
          <h3>📦 材料仓库 ({{ sectStore.totalMaterials }}/{{ sectStore.warehouseCapacity }})</h3>
          <div class="material-grid">
            <div class="material-item">
              <span class="icon">🪵</span>
              <span>{{ sectStore.materials.wood }}</span>
            </div>
            <div class="material-item">
              <span class="icon">🪨</span>
              <span>{{ sectStore.materials.stone }}</span>
            </div>
            <div class="material-item">
              <span class="icon">⛏️</span>
              <span>{{ sectStore.materials.iron }}</span>
            </div>
            <div class="material-item">
              <span class="icon">💠</span>
              <span>{{ sectStore.materials.jade }}</span>
            </div>
            <div class="material-item">
              <span class="icon">🚩</span>
              <span>{{ sectStore.materials.formationFlag }}</span>
            </div>
            <div class="material-item">
              <span class="icon">💎</span>
              <span>{{ sectStore.materials.spiritStone }}</span>
            </div>
          </div>
        </div>

        <!-- 暂停的建筑警告 -->
        <div v-if="sectStore.suspendedBuildings.length > 0" class="panel-section warning">
          <h3>⚠️ 暂停的建筑</h3>
          <div v-for="b in sectStore.suspendedBuildings" :key="b.plotId" class="suspended-item">
            <span>{{ getBuildingConfig(b.buildingId)?.name }}</span>
            <button class="btn-small" @click="resume(b.plotId)">恢复</button>
          </div>
        </div>
      </aside>

      <!-- 中间：地块网格 -->
      <main class="plot-grid">
        <div
          v-for="plot in sectStore.availablePlots"
          :key="plot.id"
          class="plot-cell"
          :class="{
            selected: selectedPlotId === plot.id,
            'has-building': !!sectStore.buildings[plot.id],
            building: sectStore.buildings[plot.id]?.status === BUILDING_STATUS.BUILDING,
            suspended: sectStore.buildings[plot.id]?.status === BUILDING_STATUS.SUSPENDED
          }"
          @click="selectPlot(plot)"
        >
          <div class="plot-type-icon">{{ getPlotTypeConfig(plot.type)?.icon }}</div>
          
          <template v-if="sectStore.buildings[plot.id]">
            <div class="building-icon">{{ getBuildingConfig(sectStore.buildings[plot.id].buildingId)?.icon }}</div>
            <div class="building-name">{{ getBuildingConfig(sectStore.buildings[plot.id].buildingId)?.name }}</div>
            <div class="building-level">Lv.{{ sectStore.buildings[plot.id].level }}</div>
            
            <!-- 建造中进度条 -->
            <div v-if="sectStore.buildings[plot.id].status === BUILDING_STATUS.BUILDING" class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (buildingProgress[plot.id]?.progress || 0) * 100 + '%' }"
              ></div>
              <span class="progress-text">
                {{ formatTime(buildingProgress[plot.id]?.remainingSeconds || 0) }}
              </span>
            </div>
            
            <!-- 状态标签 -->
            <div v-if="sectStore.buildings[plot.id].status === BUILDING_STATUS.SUSPENDED" class="status-badge suspended">
              已暂停
            </div>
          </template>
          
          <template v-else>
            <div class="empty-plot">空地</div>
            <div class="plot-type-name">{{ getPlotTypeConfig(plot.type)?.name }}</div>
          </template>
        </div>
      </main>

      <!-- 右侧：操作面板 -->
      <aside class="action-panel">
        <template v-if="selectedPlotId && sectStore.buildings[selectedPlotId]">
          <div class="panel-section">
            <h3>🏗️ 建筑详情</h3>
            <div class="building-detail">
              <div class="detail-icon">{{ getBuildingConfig(sectStore.buildings[selectedPlotId].buildingId)?.icon }}</div>
              <div class="detail-name">{{ getBuildingConfig(sectStore.buildings[selectedPlotId].buildingId)?.name }}</div>
              <div class="detail-level">等级 {{ sectStore.buildings[selectedPlotId].level }}</div>
              <div class="detail-desc">{{ getBuildingConfig(sectStore.buildings[selectedPlotId].buildingId)?.description }}</div>
            </div>
            
            <!-- 维护费用 -->
            <div class="maintenance-info">
              <span>每日维护: </span>
              <span>{{ formatMaterials(getBuildingConfig(sectStore.buildings[selectedPlotId].buildingId)?.maintenanceCost || {}) }}</span>
            </div>
            
            <div class="action-buttons">
              <!-- 建造中：取消 -->
              <template v-if="sectStore.buildings[selectedPlotId].status === BUILDING_STATUS.BUILDING">
                <button class="btn-danger" @click="cancelBuild(selectedPlotId)">取消建造</button>
              </template>
              
              <!-- 已暂停：恢复 -->
              <template v-else-if="sectStore.buildings[selectedPlotId].status === BUILDING_STATUS.SUSPENDED">
                <button class="btn-primary" @click="resume(selectedPlotId)">恢复运行</button>
              </template>
              
              <!-- 正常运行：收集/升级/拆除 -->
              <template v-else>
                <button 
                  v-if="getBuildingConfig(sectStore.buildings[selectedPlotId].buildingId)?.production"
                  class="btn-success" 
                  @click="collect(selectedPlotId)"
                >
                  收集产出
                </button>
                <button class="btn-primary" @click="upgrade(selectedPlotId)">升级</button>
                <button class="btn-danger" @click="demolish(selectedPlotId)">拆除</button>
              </template>
            </div>
          </div>
        </template>
        
        <!-- 建造面板 -->
        <template v-else-if="showBuildPanel && selectedPlotType">
          <div class="panel-section">
            <h3>🔨 选择建筑</h3>
            <div class="build-list">
              <div
                v-for="building in getAvailableBuildings(selectedPlotType)"
                :key="building.id"
                class="build-option"
                @click="startBuild(building.id)"
              >
                <span class="build-icon">{{ building.icon }}</span>
                <div class="build-info">
                  <div class="build-name">{{ building.name }}</div>
                  <div class="build-cost">{{ formatMaterials(building.buildCost) }}</div>
                  <div class="build-time">建造时间: {{ formatTime(building.buildTime) }}</div>
                </div>
              </div>
              <div v-if="getAvailableBuildings(selectedPlotType).length === 0" class="no-buildings">
                暂无可建造的建筑
              </div>
            </div>
          </div>
        </template>
        
        <template v-else>
          <div class="panel-section empty-hint">
            <p>👆 点击地块查看详情或建造建筑</p>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.sect-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* Header */
.sect-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sect-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #f1c40f;
}

.btn-back {
  padding: 8px 16px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: rgba(255,255,255,0.2);
}

.sect-level {
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-badge {
  padding: 5px 15px;
  background: linear-gradient(135deg, #f1c40f, #e67e22);
  border-radius: 20px;
  font-weight: bold;
  color: #000;
}

/* Content Layout */
.sect-content {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

/* Info Panel */
.info-panel, .action-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.panel-section {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 15px;
}

.panel-section h3 {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: #f1c40f;
}

.panel-section.warning {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.85rem;
}

/* Material Grid */
.material-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.material-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  font-size: 0.8rem;
}

.material-item .icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

/* Buttons */
.btn-upgrade {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: linear-gradient(135deg, #f1c40f, #e67e22);
  border: none;
  border-radius: 8px;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upgrade:disabled {
  background: #444;
  color: #888;
  cursor: not-allowed;
}

.upgrade-hint {
  font-size: 0.75rem;
  color: #e74c3c;
  margin-top: 8px;
  text-align: center;
}

/* Plot Grid */
.plot-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 10px;
  overflow-y: auto;
}

.plot-cell {
  aspect-ratio: 1;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.plot-cell:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.3);
  transform: translateY(-3px);
}

.plot-cell.selected {
  border-color: #f1c40f;
  box-shadow: 0 0 20px rgba(241, 196, 15, 0.3);
}

.plot-cell.has-building {
  background: rgba(46, 204, 113, 0.1);
  border-color: rgba(46, 204, 113, 0.3);
}

.plot-cell.building {
  background: rgba(241, 196, 15, 0.1);
  border-color: rgba(241, 196, 15, 0.3);
}

.plot-cell.suspended {
  background: rgba(231, 76, 60, 0.1);
  border-color: rgba(231, 76, 60, 0.3);
}

.plot-type-icon {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 1rem;
  opacity: 0.5;
}

.building-icon {
  font-size: 2.5rem;
  margin-bottom: 5px;
}

.building-name {
  font-size: 0.85rem;
  font-weight: bold;
}

.building-level {
  font-size: 0.75rem;
  color: #f1c40f;
}

.empty-plot {
  font-size: 1rem;
  color: rgba(255,255,255,0.3);
}

.plot-type-name {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.2);
}

/* Progress Bar */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: rgba(0,0,0,0.5);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f1c40f, #e67e22);
  transition: width 1s linear;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #fff;
}

.status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: bold;
}

.status-badge.suspended {
  background: #e74c3c;
}

/* Action Panel */
.building-detail {
  text-align: center;
  padding: 15px 0;
}

.detail-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.detail-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #f1c40f;
}

.detail-level {
  font-size: 0.85rem;
  color: #2ecc71;
  margin-bottom: 10px;
}

.detail-desc {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
}

.maintenance-info {
  font-size: 0.8rem;
  padding: 10px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  margin: 10px 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 15px;
}

.action-buttons button {
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn-success {
  background: #2ecc71;
  color: #fff;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
}

.btn-small {
  padding: 5px 10px;
  background: #2ecc71;
  border: none;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
  font-size: 0.75rem;
}

/* Build List */
.build-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.build-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.build-option:hover {
  background: rgba(255,255,255,0.1);
  border-color: #f1c40f;
}

.build-icon {
  font-size: 2rem;
}

.build-info {
  flex: 1;
}

.build-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.build-cost, .build-time {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.6);
}

.no-buildings {
  text-align: center;
  color: rgba(255,255,255,0.4);
  padding: 20px;
}

.empty-hint {
  text-align: center;
  color: rgba(255,255,255,0.4);
}

.suspended-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.85rem;
}
</style>
