<template>
  <div class="dantian-view" @keydown="handleKeyDown" tabindex="0" ref="viewRef">
    <div class="page-header">
      <button @click="handleBack" class="btn-back">
        ← 返回
      </button>
      <h1>丹田管理</h1>
      <div class="spacer"></div>
    </div>
    
    <!-- 标签切换 -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'manage' }]"
        @click="activeTab = 'manage'"
      >
        🔮 丹田管理
      </button>
      <button 
        :class="['tab', { active: activeTab === 'enhance' }]"
        @click="activeTab = 'enhance'"
      >
        ⚡ 法宝强化
      </button>
    </div>
    
    <!-- 丹田管理界面 -->
    <div v-if="activeTab === 'manage'" class="dantian-container">
      <!-- 左侧：丹田拼图区域 -->
      <div class="dantian-grid-section">
        <div class="section-header">
          <h2>丹田 ({{ dantianUsage.used }}/{{ dantianUsage.total }})</h2>
          <div class="capacity-bar">
            <div class="capacity-fill" :style="{ width: `${(dantianUsage.used / dantianUsage.total) * 100}%` }"></div>
          </div>
          <div class="hint-text">
            拖拽法宝放置或移动 | 按 R 键旋转 | 右键或拖到库存卸下
          </div>
        </div>
        
        <div class="grid-wrapper">
          <div 
            ref="gridRef"
            class="dantian-grid" 
            :style="gridStyle"
            @mousedown="handleGridMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
          >
            <!-- 绘制网格背景 -->
            <div 
              v-for="(row, y) in dantian.height" 
              :key="`row-${y}`"
              class="grid-row"
            >
              <div
                v-for="(col, x) in dantian.width"
                :key="`cell-${x}-${y}`"
                :class="['grid-cell', { 
                  occupied: isCellOccupied(x, y),
                  'preview-valid': isPreviewCell(x, y, true),
                  'preview-invalid': isPreviewCell(x, y, false)
                }]"
              >
                <span class="cell-coord">{{ x }},{{ y }}</span>
              </div>
            </div>
            
            <!-- 绘制已放置的法宝（只显示实际占用格子）-->
            <div
              v-for="fabao in placedFabaos"
              :key="`placed-${fabao.id}`"
              v-show="!pickingFabao || pickingFabao.id !== fabao.id"
            >
              <div
                v-for="(slot, idx) in getFabaoSlots(fabao)"
                :key="`slot-${idx}`"
                class="fabao-cell"
                :class="{ 'damaged': fabao.isDamaged }"
                :style="{ 
                  left: `${getCellPosition(slot.x, slot.y).left}px`, 
                  top: `${getCellPosition(slot.x, slot.y).top}px`,
                  width: `${GRID_SIZE}px`,
                  height: `${GRID_SIZE}px`,
                  background: getFabaoColor(fabao.id).background,
                  borderColor: getFabaoColor(fabao.id).border
                }"
                @mousedown="handleFabaoMouseDown($event, fabao)"
                @contextmenu.prevent.stop="handleFabaoRightClick(fabao)"
              >
                <span class="cell-icon" v-if="idx === 0">{{ fabao.icon }}</span>
                <span class="damaged-badge" v-if="idx === 0 && fabao.isDamaged">💔</span>
              </div>
            </div>
            
            <!-- 拖拽预览（显示实际格子）-->
            <div
              v-if="pickingFabao && previewPosition"
            >
              <div
                v-for="(slot, idx) in getPreviewSlots()"
                :key="`preview-slot-${idx}`"
                class="preview-cell"
                :class="{ valid: previewValid, invalid: !previewValid }"
                :style="{ 
                  left: `${getCellPosition(slot.x, slot.y).left}px`, 
                  top: `${getCellPosition(slot.x, slot.y).top}px`,
                  width: `${GRID_SIZE}px`,
                  height: `${GRID_SIZE}px`
                }"
              >
                <span class="preview-icon" v-if="idx === 0">{{ pickingFabao.icon }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：法宝库存 -->
      <div 
        class="fabao-inventory-section"
        @dragover.prevent="handleInventoryDragOver"
        @drop="handleInventoryDrop"
        :class="{ 'drop-active': pickingFabao }"
      >
        <h2>法宝库存</h2>
        
        <div class="filter-tabs">
          <button 
            v-for="filter in filters" 
            :key="filter"
            :class="['filter-tab', { active: currentFilter === filter }]"
            @click="currentFilter = filter"
          >
            {{ getFilterName(filter) }}
          </button>
        </div>
        
        <div class="fabao-list">
          <div
            v-for="fabao in filteredFabaos"
            :key="fabao.id"
            class="fabao-card"
            @mousedown="handleCardMouseDown($event, fabao)"
            :class="{ 
              damaged: fabao.isDamaged,
              inDantian: fabao.isInDantian,
              picking: pickingFabao?.id === fabao.id
            }"
          >
            <div class="card-header">
              <div class="card-icon">{{ fabao.icon }}</div>
              <div class="card-title">
                <div class="name-row">
                  <span class="fabao-name">{{ fabao.name }}</span>
                  <span class="realm-text">· {{ fabao.realm }}</span>
                  <span v-if="fabao.enhance_level > 0" class="enhance-badge" :title="'强化等级 +' + fabao.enhance_level">
                    +{{ fabao.enhance_level }}
                  </span>
                </div>
              </div>
              <!-- 稀有度徽章（右上角） -->
              <div class="rarity-badge" :class="'rarity-' + fabao.rarity" :title="fabao.rarityConfig?.label">
                {{ fabao.rarityConfig?.label }}
              </div>
            </div>
            
            <div class="card-stats">
              <div class="stat">
                <span class="stat-label">HP:</span>
                <span class="stat-value">{{ fabao.hp }}/{{ fabao.max_hp }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">ATK:</span>
                <span class="stat-value">{{ fabao.attack }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">DEF:</span>
                <span class="stat-value">{{ fabao.defense }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">点数:</span>
                <span class="stat-value">{{ fabao.summonCost }}</span>
              </div>
            </div>
            
            <div class="card-shape">
              <div class="shape-preview">
                <div 
                  v-for="(row, ry) in (fabao.current_shape || fabao.shape)" 
                  :key="`prev-row-${ry}`"
                  class="shape-row-mini"
                >
                  <div
                    v-for="(cell, rx) in row"
                    :key="`prev-cell-${rx}`"
                    :class="['shape-cell-mini', { active: cell === 1 }]"
                  ></div>
                </div>
              </div>
              <div class="shape-info">
                {{ fabao.current_grid_count || countGrids(fabao.shape) }}格
                <span v-if="fabao.enhance_level > 0">(+{{ fabao.enhance_level }})</span>
              </div>
            </div>
            
            <div class="card-status">
              <span v-if="fabao.isDamaged" class="status-tag damaged">已损毁</span>
              <span v-else-if="fabao.isInDantian" class="status-tag in-dantian">丹田中</span>
              <span v-else class="status-tag available">可放置</span>
            </div>
            
            <!-- 修复按钮 -->
            <button 
              v-if="fabao.isDamaged" 
              @mousedown.stop
              @click.stop="handleRepair(fabao)"
              class="btn-repair"
            >
              🔧 修复 ({{ fabaoStore.calculateRepairCost(fabao) }} 灵石)
            </button>
            
            <!-- 温养信息 -->
            <div v-if="fabao.nourish_level > 0" class="nourish-info">
              <div class="nourish-header">
                <span class="nourish-badge" :style="{ color: nourishLevelColor(fabao.nourish_level) }">
                  🌟 温养 Lv.{{ fabao.nourish_level }}
                </span>
              </div>
              <div v-if="fabao.nourish_start_time" class="nourish-progress-bar">
                <div 
                  class="nourish-fill" 
                  :style="{ width: nourishProgress(fabao) + '%' }"
                ></div>
              </div>
              <div v-if="fabao.nourish_start_time" class="nourish-time">
                {{ formatNourishTime(fabao) }}
              </div>
              <div class="nourish-bonus" :title="'攻击+' + getNourishBonus(fabao).attack + ' 防御+' + getNourishBonus(fabao).defense + ' 生命+' + getNourishBonus(fabao).hp">
                <span class="bonus-icon">⚔️</span>+{{ getNourishBonus(fabao).attack }}
                <span class="bonus-icon">🛡️</span>+{{ getNourishBonus(fabao).defense }}
                <span class="bonus-icon">❤️</span>+{{ getNourishBonus(fabao).hp }}
              </div>
            </div>
            
            <!-- 技能展示栏 -->
            <div v-if="(fabao.spells && Array.isArray(fabao.spells)) || fabao.spell" class="skills-section">
              <div class="skills-header">⚡ 技能列表</div>
              <div class="skills-list">
                <!-- 多技能展示 -->
                <div v-if="fabao.spells && Array.isArray(fabao.spells)" class="skill-items">
                  <div 
                    v-for="spell in fabao.spells" 
                    :key="spell.id"
                    class="skill-item"
                    :title="getSkillTooltip(spell, fabao.enhance_level || 0)"
                  >
                    <div class="skill-icon-large">{{ spell.icon }}</div>
                    <div class="skill-details">
                      <div class="skill-name">{{ spell.name }}</div>
                      <div class="skill-description">{{ spell.description }}</div>
                      <div class="skill-stats">
                        <span class="skill-stat mp-cost">💙 {{ spell.mpCost }}MP</span>
                        <span v-if="spell.baseDamage" class="skill-stat damage">⚔️ {{ calculateSkillValue(spell.baseDamage, fabao.enhance_level || 0) }}</span>
                        <span v-if="spell.effects?.heal" class="skill-stat heal">❤️ {{ calculateSkillValue(spell.effects.heal, fabao.enhance_level || 0) }}</span>
                        <span v-if="spell.effects?.defenseBonus" class="skill-stat defense">🛡️ +{{ calculateSkillValue(spell.effects.defenseBonus, fabao.enhance_level || 0) }}</span>
                        <span v-if="fabao.enhance_level > 0" class="skill-level">Lv.{{ fabao.enhance_level }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 单技能展示（向后兼容） -->
                <div v-else-if="fabao.spell" class="skill-item">
                  <div class="skill-icon-large">{{ fabao.spell.icon }}</div>
                  <div class="skill-details">
                    <div class="skill-name">{{ fabao.spell.name }}</div>
                    <div class="skill-description">{{ fabao.spell.description }}</div>
                    <div class="skill-stats">
                      <span class="skill-stat mp-cost">💙 {{ fabao.spell.mpCost }}MP</span>
                      <span v-if="fabao.spell.baseDamage" class="skill-stat damage">⚔️ {{ calculateSkillValue(fabao.spell.baseDamage, fabao.enhance_level || 0) }}</span>
                      <span v-if="fabao.enhance_level > 0" class="skill-level">Lv.{{ fabao.enhance_level }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 温养控制按钮 -->
            <div v-if="!fabao.isDamaged && fabao.isInDantian" class="nourish-controls">
              <button 
                v-if="!fabao.nourish_start_time"
                @mousedown.stop
                @click.stop="startNourish(fabao)"
                class="btn-nourish-start"
                title="开始温养法宝"
              >
                🌟 开始温养
              </button>
              <button 
                v-else
                @mousedown.stop
                @click.stop="stopNourish(fabao)"
                class="btn-nourish-stop"
                title="停止温养"
              >
                ⏸️ 停止温养
              </button>
            </div>
          </div>
          
          <div v-if="filteredFabaos.length === 0" class="empty-state">
            暂无法宝
          </div>
        </div>
      </div>
    </div>
    
    <!-- 法宝强化界面 -->
    <div v-else-if="activeTab === 'enhance'" class="enhance-container">
      <!-- 左侧：可强化法宝列表 -->
      <div class="fabao-list-panel">
        <h3>可强化法宝</h3>
        <div class="enhance-hint">
          💡 法宝需要从丹田中卸下才能强化（右键法宝选择卸下）
        </div>
        <div class="enhance-fabao-list">
          <div 
            v-for="fabao in enhanceableFabaos" 
            :key="fabao.id"
            class="enhance-fabao-item"
            :class="{ selected: selectedEnhanceFabao?.id === fabao.id }"
            @click="selectEnhanceFabao(fabao)"
          >
            <span class="fabao-icon-large">{{ fabao.icon }}</span>
            <div class="fabao-info">
              <div class="fabao-name">{{ fabao.name }}</div>
              <div class="fabao-level">Lv.{{ fabao.enhance_level }}/{{ fabao.max_enhance_level }}</div>
              <div class="fabao-grid">{{ fabao.current_grid_count }}格</div>
            </div>
          </div>
          <div v-if="enhanceableFabaos.length === 0" class="empty-state">
            暂无可强化的法宝
          </div>
        </div>
      </div>
      
      <!-- 右侧：强化详情面板 -->
      <div class="enhance-detail-panel" v-if="selectedEnhanceFabao">
        <h2>{{ selectedEnhanceFabao.name }}</h2>
        
        <!-- 当前状态 -->
        <div class="section">
          <h3>当前状态</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="label">格子数</span>
              <span class="value">{{ countGrids(selectedEnhanceFabao.shape) }}格</span>
            </div>
            <div class="stat-item">
              <span class="label">攻击力</span>
              <span class="value">{{ selectedEnhanceFabao.attack }}</span>
            </div>
            <div class="stat-item">
              <span class="label">防御力</span>
              <span class="value">{{ selectedEnhanceFabao.defense }}</span>
            </div>
            <div class="stat-item">
              <span class="label">生命值</span>
              <span class="value">{{ selectedEnhanceFabao.max_hp }}</span>
            </div>
            <div class="stat-item">
              <span class="label">强化等级</span>
              <span class="value">{{ selectedEnhanceFabao.enhance_level }}/{{ selectedEnhanceFabao.max_enhance_level }}</span>
            </div>
          </div>
        </div>
        
        <!-- 强化后预览 -->
        <div class="section">
          <h3>强化后预览</h3>
          <div class="stats-grid preview">
            <div class="stat-item">
              <span class="label">格子数</span>
              <span class="value change">{{ countGrids(selectedEnhanceFabao.shape) - 1 }}格 <span class="arrow">↓</span></span>
            </div>
            <div class="stat-item">
              <span class="label">攻击力</span>
              <span class="value change">{{ Math.floor(selectedEnhanceFabao.attack * 1.08) }} <span class="arrow">↑</span></span>
            </div>
            <div class="stat-item">
              <span class="label">防御力</span>
              <span class="value change">{{ Math.floor(selectedEnhanceFabao.defense * 1.06) }} <span class="arrow">↑</span></span>
            </div>
            <div class="stat-item">
              <span class="label">生命值</span>
              <span class="value ch ange">{{ Math.floor(selectedEnhanceFabao.max_hp * 1.1) }} <span class="arrow">↑</span></span>
            </div>
          </div>
        </div>
        
        <!-- 强化信息 -->
        <div class="section">
          <h3>强化信息</h3>
          <div class="enhance-info">
            <div class="info-row">
              <span class="label">消耗灵石：</span>
              <span class="value cost">{{ calculateEnhanceCost(selectedEnhanceFabao) }}</span>
            </div>
            <div class="info-row">
              <span class="label">成功率：</span>
              <span class="value rate">{{ (calculateSuccessRate(selectedEnhanceFabao) * 100).toFixed(1) }}%</span>
            </div>
            <div class="info-row">
              <span class="label">当前余额：</span>
              <span class="value">{{ characterStore.character.silver || 0 }} 灵石</span>
            </div>
          </div>
        </div>
        
        <!-- 强化按钮 -->
        <button 
          @click="handleEnhance"
          class="btn-enhance"
          :disabled="!canEnhance(selectedEnhanceFabao)"
        >
          🔨 强化法宝
        </button>
        
        <div v-if="!canEnhance(selectedEnhanceFabao)" class="warning-text">
          {{ getEnhanceWarning(selectedEnhanceFabao) }}
        </div>
      </div>
      
      <div v-else class="enhance-detail-panel empty">
        <div class="empty-placeholder">
          <span class="icon">⚡</span>
          <p>请从左侧选择要强化的法宝</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useFabaoStore } from '../stores/fabao'
import { useCharacterStore } from '../stores/character'
import { useExplorationStore } from '../stores/exploration'
import { supabase } from '../supabase/client'
import { rotateFabaoShape, countGrids, canPlaceFabao as canPlaceFabaoUtil, getFabaoOccupiedSlots } from '../utils/dantianUtils'

const router = useRouter()
const fabaoStore = useFabaoStore()
const characterStore = useCharacterStore()
const explorationStore = useExplorationStore()

/**
 * 统一处理返回逻辑
 * 如果当前在探索中，则返回探索界面，否则返回主页
 */
function handleBack() {
  if (explorationStore.currentMapId) {
    router.push(`/exploration/${explorationStore.currentMapId}`)
  } else {
    router.push('/')
  }
}

const GRID_SIZE = 60  // 每个格子60px
const GRID_GAP = 2    // 格子间隙2px
const GRID_PADDING = 2  // 网格padding 2px
const gridRef = ref(null)
const viewRef = ref(null)

// 标签切换状态
const activeTab = ref('manage')  // 'manage' 或 'enhance'

// 强化功能状态
const selectedEnhanceFabao = ref(null)

// 计算格子的实际位置（包含gap和padding）
function getCellPosition(x, y) {
  return {
    left: GRID_PADDING + x * (GRID_SIZE + GRID_GAP),
    top: GRID_PADDING + y * (GRID_SIZE + GRID_GAP)
  }
}

// 根据法宝ID生成独特的颜色
function getFabaoColor(fabaoId) {
  let hash = 0
  for (let i = 0; i < fabaoId.length; i++) {
    hash = fabaoId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return {
    background: `hsla(${hue}, 65%, 70%, 0.7)`,
    border: `hsl(${hue}, 65%, 50%)`
  }
}

// 拖拽状态
const pickingFabao = ref(null)  // 当前拿起的法宝
const pickingRotation = ref(0)  // 当前旋转角度
const previewPosition = ref(null)  // 预览位置 { x, y }
const previewValid = ref(false)  // 预览位置是否合法
const originalPosition = ref(null)  // 原始位置（用于失败恢复）
const originalRotation = ref(0)  // 原始旋转角度
const isOutsideGrid = ref(false)  // 鼠标是否在丹田外

// 过滤器
const currentFilter = ref('all')
const filters = ['all', 'available', 'inDantian', 'damaged']

// 丹田数据
const dantian = computed(() => ({
  width: characterStore.character?.dantian_width || 5,
  height: characterStore.character?.dantian_height || 5
}))

// 丹田网格样式
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${dantian.value.width}, ${GRID_SIZE}px)`,
  gridTemplateRows: `repeat(${dantian.value.height}, ${GRID_SIZE}px)`
}))

// 丹田使用情况
const dantianUsage = computed(() => fabaoStore.dantianOccupancy.usage)

// 已放置的法宝
const placedFabaos = computed(() => {
  const placed = fabaoStore.dantianFabaos.filter(f => f.dantian_position || f.dantianPosition)
  console.log('[placedFabaos] 丹田中的法宝:', fabaoStore.dantianFabaos.length, '个')
  console.log('[placedFabaos] 已放置的法宝:', placed.length, '个', placed.map(f => ({
    name: f.name,
    dantian_position: f.dantian_position,
    dantianPosition: f.dantianPosition
  })))
  return placed
})

// ==================== 强化功能 ====================

// 可强化的法宝列表（必须先从丹田卸下）
const enhanceableFabaos = computed(() => {
  return fabaoStore.fabaos.filter(f => 
    !f.isInDantian &&  // 必须不在丹田中
    !f.isDamaged &&    // 必须未损毁
    f.enhance_level < (f.max_enhance_level || 5) &&  // 未达上限
    (f.current_grid_count || countGrids(f.shape)) > 1  // 格子数大于1
  )
})

// 选择要强化的法宝
function selectEnhanceFabao(fabao) {
  selectedEnhanceFabao.value = fabao
}

// 计算强化消耗
function calculateEnhanceCost(fabao) {
  return Math.floor(100 * Math.pow(1.5, fabao.enhance_level || 0))
}

// 计算成功率
function calculateSuccessRate(fabao) {
  const fortune = characterStore.character.fortune || 5
  const baseRate = 1.0 - ((fabao.enhance_level || 0) * 0.05)
  const fortuneBonus = fortune * 0.005
  return Math.min(0.95, baseRate + fortuneBonus)
}

// 检查是否可以强化
function canEnhance(fabao) {
  if (!fabao) return false
  const cost = calculateEnhanceCost(fabao)
  const currentSilver = characterStore.character.silver || 0
  return currentSilver >= cost &&
         fabao.enhance_level < (fabao.max_enhance_level || 5) &&
         (fabao.current_grid_count || countGrids(fabao.shape)) > 1
}

// 获取无法强化的原因
function getEnhanceWarning(fabao) {
  if (!fabao) return ''
  const cost = calculateEnhanceCost(fabao)
  const currentSilver = characterStore.character.silver || 0
  
  if (currentSilver < cost) {
    return `灵石不足，需要 ${cost} 灵石，当前 ${currentSilver} 灵石`
  }
  if (fabao.enhance_level >= (fabao.max_enhance_level || 5)) {
    return '已达强化上限'
  }
  if ((fabao.current_grid_count || countGrids(fabao.shape)) <= 1) {
    return '格子数不足，无法继续强化'
  }
  return ''
}

// 执行强化
async function handleEnhance() {
  if (!selectedEnhanceFabao.value) return
  
  const fabao = selectedEnhanceFabao.value
  const cost = calculateEnhanceCost(fabao)
  const rate = calculateSuccessRate(fabao)
  
  const confirmed = confirm(
    `强化「${fabao.name}」\n\n` +
    `等级：Lv.${fabao.enhance_level} → Lv.${fabao.enhance_level + 1}\n` +
    `消耗：${cost} 灵石\n` +
    `成功率：${(rate * 100).toFixed(1)}%\n\n` +
    `确认强化吗？`
  )
  
  if (!confirmed) return
  
  const result = await fabaoStore.enhanceFabao(fabao.id)
  
  if (result.success) {
    alert(
      `✨ 强化成功！✨\n\n` +
      `格子数：${(fabao.current_grid_count || countGrids(fabao.shape))} → ${fabao.current_grid_count}\n` +
      `攻击力：+${Math.floor(fabao.attack * 0.08)}\n` +
      `防御力：+${Math.floor(fabao.defense * 0.06)}\n` +
      `生命值：+${Math.floor(fabao.max_hp * 0.1)}`
    )
  } else {
    alert(`💔 强化失败...\n\n${result.reason || '强化失败'}`)
  }
}

// ==================== 技能展示功能 ====================

// 计算技能数值（考虑等级加成）
function calculateSkillValue(baseValue, skillLevel) {
  if (!baseValue) return 0
  const multiplier = 1 + (skillLevel * 0.1)  // 每级+10%
  return Math.floor(baseValue * multiplier)
}

// 获取技能详细提示
function getSkillTooltip(spell, skillLevel) {
  let tooltip = `${spell.name}\n\n${spell.description}\n\n`
  tooltip += `MP消耗: ${spell.mpCost}\n`
  
  if (spell.baseDamage) {
    const damage = calculateSkillValue(spell.baseDamage, skillLevel)
    tooltip += `伤害: ${damage}`
    if (skillLevel > 0) {
      tooltip += ` (基础${spell.baseDamage} +${skillLevel}级加成)`
    }
    tooltip += '\n'
  }
  
  if (spell.effects?.heal) {
    const heal = calculateSkillValue(spell.effects.heal, skillLevel)
    tooltip += `治疗: ${heal}`
    if (skillLevel > 0) {
      tooltip += ` (基础${spell.effects.heal} +${skillLevel}级加成)`
    }
    tooltip += '\n'
  }
  
  if (spell.effects?.defenseBonus) {
    const defenseBonus = calculateSkillValue(spell.effects.defenseBonus, skillLevel)
    tooltip += `防御加成: +${defenseBonus}`
    if (skillLevel > 0) {
      tooltip += ` (基础${spell.effects.defenseBonus} +${skillLevel}级加成)`
    }
    if (spell.effects?.duration) {
      tooltip += ` (持续${spell.effects.duration}回合)`
    }
    tooltip += '\n'
  }
  
  return tooltip.trim()
}

// ==================== 温养功能 ====================

// 计算温养进度百分比（基于累积时间）
function nourishProgress(fabao) {
  // 计算总累积时间（秒）
  let totalSeconds = fabao.nourish_accumulated_seconds || 0
  
  // 如果正在温养中，加上当前这次的时间
  if (fabao.nourish_start_time) {
    const now = Date.now()
    const startTime = new Date(fabao.nourish_start_time).getTime()
    const currentElapsed = (now - startTime) / 1000  // 秒
    totalSeconds += currentElapsed
  }
  
  const currentLevel = fabao.nourish_level || 0
  
  if (currentLevel >= 10) return 100  // 已满级
  
  // 每级需要的累积时间（秒）
  const levelUpTime = [
    24 * 3600,   // 0→1级: 1天
    48 * 3600,   // 1→2级: 累计2天
    72 * 3600,   // 2→3级: 累计3天
    96 * 3600,   // 3→4级: 累计4天
    120 * 3600,  // 4→5级: 累计5天
    144 * 3600,  // 5→6级: 累计6天
    168 * 3600,  // 6→7级: 累计7天
    192 * 3600,  // 7→8级: 累计8天
    216 * 3600,  // 8→9级: 累计9天
    240 * 3600   // 9→10级: 累计10天
  ]
  
  const currentLevelThreshold = levelUpTime[currentLevel - 1] || 0
  const nextLevelThreshold = levelUpTime[currentLevel] || levelUpTime[levelUpTime.length - 1]
  
  const progressInLevel = totalSeconds - currentLevelThreshold
  const levelRange = nextLevelThreshold - currentLevelThreshold
  
  return Math.min(Math.floor((progressInLevel / levelRange) * 100), 100)
}

// 格式化剩余时间（基于累积时间）
function formatNourishTime(fabao) {
  // 计算总累积时间（秒）
  let totalSeconds = fabao.nourish_accumulated_seconds || 0
  
  // 如果正在温养中，加上当前这次的时间
  if (fabao.nourish_start_time) {
    const now = Date.now()
    const startTime = new Date(fabao.nourish_start_time).getTime()
    const currentElapsed = (now - startTime) / 1000  // 秒
    totalSeconds += currentElapsed
  }
  
  const currentLevel = fabao.nourish_level || 0
  
  if (currentLevel >= 10) return '已满级'
  
  // 每级需要的累积时间（秒）
  const levelUpTime = [
    24 * 3600,   // 0→1级: 1天
    48 * 3600,   // 1→2级: 累计2天
    72 * 3600,   // 2→3级: 累计3天
    96 * 3600,   // 3→4级: 累计4天
    120 * 3600,  // 4→5级: 累计5天
    144 * 3600,  // 5→6级: 累计6天
    168 * 3600,  // 6→7级: 累计7天
    192 * 3600,  // 7→8级: 累计8天
    216 * 3600,  // 8→9级: 累计9天
    240 * 3600   // 9→10级: 累计10天
  ]
  
  const nextLevelThreshold = levelUpTime[currentLevel] || levelUpTime[levelUpTime.length - 1]
  const remaining = nextLevelThreshold - totalSeconds
  
  if (remaining <= 0) {
    // 已经可以升级了，触发自动升级检查
    if (fabao.nourish_start_time) {
      fabaoStore.updateNourishLevel(fabao.id)
    }
    return '可升级！'
  }
  
  const remainingHours = remaining / 3600
  
  if (remainingHours < 1) {
    return `${Math.floor(remainingHours * 60)}分钟后升级`
  } else if (remainingHours < 24) {
    return `${Math.floor(remainingHours)}小时后升级`
  } else {
    const days = Math.floor(remainingHours / 24)
    const hours = Math.floor(remainingHours % 24)
    return `${days}天${hours}小时后升级`
  }
}

// 获取温养加成信息
function getNourishBonus(fabao) {
  const bonus = fabaoStore.calculateNourishBonus(fabao.id)
  return {
    attack: Math.floor(bonus.attack),
    defense: Math.floor(bonus.defense),
    hp: Math.floor(bonus.hp)
  }
}

// 温养等级颜色
function nourishLevelColor(level) {
  if (level >= 6) return '#ffd700' // 金色
  if (level >= 3) return '#a855f7' // 紫色
  return '#60a5fa' // 蓝色
}

// 开始温养
async function startNourish(fabao) {
  const result = await fabaoStore.startNourish(fabao.id)
  if (result.success) {
    alert(`✨ 开始温养法宝「${fabao.name}」`)
  } else {
    alert(`温养失败：${result.reason}`)
  }
}

// 停止温养
async function stopNourish(fabao) {
  if (!confirm(`确定停止温养「${fabao.name}」吗？`)) return
  
  const result = await fabaoStore.stopNourish(fabao.id)
  
  if (result.success) {
    const hours = Math.floor(result.accumulatedSeconds / 3600)
    const days = Math.floor(hours / 24)
    alert(
      `已停止温养「${fabao.name}」\n\n` +
      `累积温养时间：${days}天${hours % 24}小时\n` +
      `当前温养等级：Lv.${result.level}`
    )
  } else {
    alert(`停止温养失败：${result.reason}`)
  }
}

// ==================== 丹田管理功能 ====================

// 过滤后的法宝列表
const filteredFabaos = computed(() => {
  let fabaos = fabaoStore.fabaos
  
  switch (currentFilter.value) {
    case 'available':
      return fabaos.filter(f => !f.isInDantian && !f.isDamaged)
    case 'inDantian':
      return fabaos.filter(f => f.isInDantian)
    case 'damaged':
      return fabaos.filter(f => f.isDamaged)
    default:
      return fabaos
  }
})

// 获取当前形状（考虑旋转）
function getCurrentShape(fabao) {
  // 兼容 snake_case 和 camelCase
  const position = fabao.dantian_position || fabao.dantianPosition
  
  if (!position) {
    const shape = fabao.current_shape || fabao.shape
    console.log(`[getCurrentShape] 法宝${fabao.name}未放置，使用原始形状:`, JSON.stringify(shape))
    return shape
  }
  
  const rotation = position.rotation || 0
  const baseShape = fabao.current_shape || fabao.shape
  const rotatedShape = rotateFabaoShape(baseShape, rotation)
  console.log(`[getCurrentShape] 法宝${fabao.name}已放置，旋转${rotation}°:`, JSON.stringify(baseShape), '→', JSON.stringify(rotatedShape))
  return rotatedShape
}

// 获取当前旋转后的形状（用于预览）
function getCurrentRotatedShape() {
  if (!pickingFabao.value) return []
  const baseShape = pickingFabao.value.current_shape || pickingFabao.value.shape
  const rotatedShape = rotateFabaoShape(baseShape, pickingRotation.value)
  console.log(`[getCurrentRotatedShape] 法宝${pickingFabao.value.name}旋转${pickingRotation.value}°:`, JSON.stringify(baseShape), '→', JSON.stringify(rotatedShape))
  return rotatedShape
}

// 获取预览格子位置
function getPreviewSlots() {
  if (!previewPosition.value || !pickingFabao.value) return []
  
  const shape = getCurrentRotatedShape()
  const pos = previewPosition.value
  const slots = []
  
  console.log(`[getPreviewSlots] 预览位置(${pos.x},${pos.y})，形状:`, JSON.stringify(shape))
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        slots.push({
          x: pos.x + col,
          y: pos.y + row
        })
      }
    }
  }
  
  console.log(`  - 预览${slots.length}个格子:`, slots.map(s => `(${s.x},${s.y})`).join(', '))
  return slots
}

// 获取法宝占用的所有格子位置
function getFabaoSlots(fabao) {
  // 兼容 snake_case 和 camelCase
  const position = fabao.dantian_position || fabao.dantianPosition
  
  if (!position) {
    console.log(`[getFabaoSlots] 法宝${fabao.name}无位置信息，返回空数组`)
    return []
  }
  
  const shape = getCurrentShape(fabao)
  const pos = position
  const slots = []
  
  console.log(`[getFabaoSlots] 法宝${fabao.name}在位置(${pos.x},${pos.y})，形状:`, JSON.stringify(shape))
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        slots.push({
          x: pos.x + col,
          y: pos.y + row
        })
      }
    }
  }
  
  console.log(`  - 占用${slots.length}个格子:`, slots.map(s => `(${s.x},${s.y})`).join(', '))
  return slots
}

// 检查格子是否被占用（排除当前拿起的法宝）
function isCellOccupied(x, y) {
  if (!pickingFabao.value) {
    const occupancy = fabaoStore.dantianOccupancy
    const result = occupancy.occupiedSlots.some(slot => slot.x === x && slot.y === y)
    console.log(`[isCellOccupied] 未拿起法宝时检查(${x},${y}): ${result}`)
    return result
  }
  
  // 拿起法宝时，需要排除该法宝自身的占用
  console.log(`[isCellOccupied] 拿起法宝时检查(${x},${y}), 拿起的法宝ID: ${pickingFabao.value.id}`)
  
  for (const fabao of placedFabaos.value) {
    if (fabao.id === pickingFabao.value.id) {
      console.log(`  - 跳过自身法宝: ${fabao.id}`)
      continue
    }
    
    const slots = getFabaoSlots(fabao)
    console.log(`  - 检查法宝 ${fabao.id} 的 ${slots.length} 个格子`)
    
    if (slots.some(slot => slot.x === x && slot.y === y)) {
      console.log(`  - ✗ 被法宝 ${fabao.id} 占用!`)
      return true
    }
  }
  
  console.log(`  - ✓ 格子(${x},${y})未被占用`)
  return false
}

// 检查是否是预览格子
function isPreviewCell(x, y, isValid) {
  if (!previewPosition.value || !pickingFabao.value) return false
  
  const shape = getCurrentRotatedShape()
  const pos = previewPosition.value
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        if (pos.x + col === x && pos.y + row === y) {
          return isValid ? previewValid.value : !previewValid.value
        }
      }
    }
  }
  
  return false
}

// 处理法宝卡片鼠标按下
function handleCardMouseDown(event, fabao) {
  // 如果是右键，不处理
  if (event.button === 2) {
    return
  }
  if (fabao.isDamaged) {
    alert('法宝已损毁，无法拿起')
    return
  }
  
  event.preventDefault()
  
  console.log(`[拖拽开始] 从库存拿起法宝: ${fabao.name} (ID: ${fabao.id})`)
  console.log(`  - 是否在丹田: ${fabao.isInDantian}`)
  
  pickingFabao.value = fabao
  
  if (fabao.isInDantian && fabao.dantian_position) {
    originalPosition.value = { ...fabao.dantian_position }
    originalRotation.value = fabao.dantian_position.rotation || 0
    pickingRotation.value = fabao.dantian_position.rotation || 0
    console.log(`  - 原始位置: (${originalPosition.value.x}, ${originalPosition.value.y}), 旋转: ${originalRotation.value}°`)
  } else {
    originalPosition.value = null
    originalRotation.value = 0
    pickingRotation.value = 0
    console.log(`  - 首次放置，无原始位置`)
  }
  
  // 立即更新预览位置
  updatePreviewPosition(event)
}

// 处理已放置法宝的鼠标按下
function handleFabaoMouseDown(event, fabao) {
  // 如果是右键，不处理拖拽
  if (event.button === 2) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  
  console.log(`[拖拽开始] 从丹田拿起法宝: ${fabao.name} (ID: ${fabao.id})`)
  console.log(`  - 当前位置: (${fabao.dantian_position.x}, ${fabao.dantian_position.y})`)
  console.log(`  - 当前旋转: ${fabao.dantian_position.rotation || 0}°`)
  
  pickingFabao.value = fabao
  originalPosition.value = { ...fabao.dantian_position }
  originalRotation.value = fabao.dantian_position.rotation || 0
  pickingRotation.value = fabao.dantian_position.rotation || 0
  
  updatePreviewPosition(event)
}
// 处理右键点击法宝（卸下法宝）
async function handleFabaoRightClick(fabao) {
  console.log(`[右键点击] 法宝: ${fabao.name}`)
  
  if (!fabao.isInDantian) {
    console.log(`  - 法宝未在丹田中，无需卸下`)
    return
  }
  
  // 确认卸下
  if (confirm(`确定要卸下法宝「${fabao.name}」吗？`)) {
    const result = await fabaoStore.placeFabaoInDantian(
      fabao.id,
      { x: -1, y: -1 },
      0
    )
    
    if (result.success) {
      fabao.isInDantian = false
      fabao.dantian_position = null
      console.log(`  - ✓ 法宝已卸下`)
    } else {
      alert(`卸下失败：${result.reason}`)
      console.error(`  - ✗ 卸下失败: ${result.reason}`)
    }
  }
}

// 处理法宝修复
async function handleRepair(fabao) {
  console.log(`[handleRepair] 修复法宝: ${fabao.name}`)
  
  // 计算修复消耗
  const cost = fabaoStore.calculateRepairCost(fabao)
  const currentSilver = characterStore.character.silver || 0
  
  // 确认对话框
  const confirmed = confirm(
    `修复法宝「${fabao.name}」\n\n` +
    `修复消耗：${cost} 灵石\n` +
    `当前余额：${currentSilver} 灵石\n\n` +
    `确认修复吗？`
  )
  
  if (!confirmed) {
    console.log(`  - 取消修复`)
    return
  }
  
  // 执行修复
  const result = await fabaoStore.repairFabao(fabao.id)
  
  if (result.success) {
    alert(`修复成功！消耗 ${result.cost} 灵石`)
    console.log(`  - ✓ 修复成功，消耗 ${result.cost} 灵石`)
  } else {
    alert(`修复失败：${result.reason}`)
    console.error(`  - ✗ 修复失败: ${result.reason}`)
  }
}

// 处理网格鼠标按下（用于检测是否点击空白）
function handleGridMouseDown(event) {
  // 点击了空白格子，不做任何事
}

// 处理鼠标移动
function handleMouseMove(event) {
  if (!pickingFabao.value) return
  
  updatePreviewPosition(event)
}

// 更新预览位置
function updatePreviewPosition(event) {
  if (!gridRef.value) return
  
  const rect = gridRef.value.getBoundingClientRect()
  const x = Math.floor((event.clientX - rect.left) / GRID_SIZE)
  const y = Math.floor((event.clientY - rect.top) / GRID_SIZE)
  
  previewPosition.value = { x, y }
  
  console.log(`[预览更新] 位置: (${x}, ${y}), 旋转: ${pickingRotation.value}°`)
  
  // 检查位置是否合法（排除当前拿起的法宝）
  // 注意：传入原始shape和rotation，让canPlaceFabao内部去旋转
  const originalShape = pickingFabao.value.current_shape || pickingFabao.value.shape
  const dantianData = {
    width: dantian.value.width,
    height: dantian.value.height,
    occupiedSlots: []
  }
  
  console.log(`[碰撞检测] 开始检测，法宝原始形状:`, JSON.stringify(originalShape))
  
  // 收集其他法宝的占用格子
  for (const fabao of placedFabaos.value) {
    if (fabao.id === pickingFabao.value.id) {
      console.log(`  - 跳过自身法宝: ${fabao.name}`)
      continue
    }
    
    const slots = getFabaoSlots(fabao)
    console.log(`  - 收集法宝 ${fabao.name} 占用的 ${slots.length} 个格子`)
    dantianData.occupiedSlots.push(...slots)
  }
  
  console.log(`  - 总共排除 ${dantianData.occupiedSlots.length} 个已占用格子`)
  
  // 传入原始shape和rotation，让canPlaceFabao内部旋转
  previewValid.value = canPlaceFabaoUtil(dantianData, originalShape, { x, y }, pickingRotation.value)
  
  console.log(`[碰撞检测] 结果: ${previewValid.value ? '✓ 可放置' : '✗ 不可放置'}`)
}

// 处理鼠标松开
async function handleMouseUp(event) {
  if (!pickingFabao.value) return
  
  console.log(`[松开鼠标] 法宝: ${pickingFabao.value.name}`)
  console.log(`  - isOutsideGrid: ${isOutsideGrid.value}`)
  console.log(`  - previewPosition: ${previewPosition.value ? `(${previewPosition.value.x}, ${previewPosition.value.y})` : 'null'}`)
  
  // 检查是否在丹田外松开（优先检查isOutsideGrid标志）
  const shouldUnload = isOutsideGrid.value || (!gridRef.value && !previewPosition.value)
  
  if (shouldUnload) {
    // 鼠标在丹田外，卸下法宝
    console.log(`  - 在丹田外松开，执行卸下操作`)
    if (pickingFabao.value.isInDantian) {
      const result = await fabaoStore.placeFabaoInDantian(
        pickingFabao.value.id,
        { x: -1, y: -1 },
        0
      )
      if (result.success) {
        pickingFabao.value.isInDantian = false
        pickingFabao.value.dantian_position = null
        console.log(`  - ✓ 法宝已成功卸下`)
      } else {
        console.error(`  - ✗ 卸下失败: ${result.reason}`)
      }
    }
  } else {
    // 在丹田内，重新验证位置（因为可能在移动过程中previewValid没有更新）
    console.log(`  - 重新验证位置...`)
    const originalShape = pickingFabao.value.current_shape || pickingFabao.value.shape
    const dantianData = {
      width: dantian.value.width,
      height: dantian.value.height,
      occupiedSlots: []
    }
    
    // 收集其他法宝的占用格子
    for (const fabao of placedFabaos.value) {
      if (fabao.id === pickingFabao.value.id) {
        console.log(`    - 跳过自身法宝: ${fabao.name}`)
        continue
      }
      
      const slots = getFabaoSlots(fabao)
      console.log(`    - 收集法宝 ${fabao.name} 占用的 ${slots.length} 个格子`)
      dantianData.occupiedSlots.push(...slots)
    }
    
    console.log(`    - 总共排除 ${dantianData.occupiedSlots.length} 个已占用格子`)
    
    const isValid = canPlaceFabaoUtil(dantianData, originalShape, previewPosition.value, pickingRotation.value)
    
    console.log(`  - 最终验证结果: ${isValid ? '✓ 可放置' : '✗ 不可放置'}`)
    
    if (isValid) {
      // 位置合法，放置法宝
      console.log(`  - 位置合法，执行放置: (${previewPosition.value.x}, ${previewPosition.value.y}), 旋转: ${pickingRotation.value}°`)
      const result = await fabaoStore.placeFabaoInDantian(
        pickingFabao.value.id,
        previewPosition.value,
        pickingRotation.value
      )
      
      if (result.success) {
        // 更新本地状态确保同步
        pickingFabao.value.isInDantian = true
        pickingFabao.value.dantian_position = {
          x: previewPosition.value.x,
          y: previewPosition.value.y,
          rotation: pickingRotation.value
        }
        console.log(`  - ✓ 放置成功并已保存`)
      } else {
        console.error(`  - ✗ 放置失败: ${result.reason}`)
        alert(`放置失败：${result.reason}`)
        await restoreOriginalPosition()
      }
    } else {
      // 位置不合法
      console.log(`  - 位置不合法，恢复原状态`)
      alert('位置被占用或不合理，已恢复原状态')
      await restoreOriginalPosition()
    }
  }
  
  // 重置状态
  console.log(`[状态重置] 清除拖拽状态`)
  pickingFabao.value = null
  previewPosition.value = null
  originalPosition.value = null
  originalRotation.value = 0
  pickingRotation.value = 0
  isOutsideGrid.value = false  // 重置丹田外标志
}

// 处理鼠标离开丹田区域
function handleMouseLeave(event) {
  if (!pickingFabao.value) return
  
  console.log(`[鼠标离开丹田] 标记为丹田外`)
  // 标记为离开丹田区域，但保留previewPosition以便handleMouseUp判断
  isOutsideGrid.value = true
  previewPosition.value = null  // 清除预览
}

// 恢复原始位置
async function restoreOriginalPosition() {
  if (!pickingFabao.value) return
  
  if (originalPosition.value) {
    // 恢复到原位置
    await fabaoStore.placeFabaoInDantian(
      pickingFabao.value.id,
      originalPosition.value,
      originalRotation.value
    )
  } else {
    // 从丹田移除
    if (pickingFabao.value.isInDantian) {
      await fabaoStore.placeFabaoInDantian(
        pickingFabao.value.id,
        { x: -1, y: -1 },
        0
      )
      pickingFabao.value.isInDantian = false
      pickingFabao.value.dantian_position = null
    }
  }
}

// 处理键盘按键
function handleKeyDown(event) {
  if (!pickingFabao.value) return
  
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault()
    const oldRotation = pickingRotation.value
    pickingRotation.value = (pickingRotation.value + 90) % 360
    
    console.log(`[旋转] ${oldRotation}° → ${pickingRotation.value}°`)
    
    // 重新验证位置
    if (previewPosition.value) {
      const originalShape = pickingFabao.value.current_shape || pickingFabao.value.shape
      const dantianData = {
        width: dantian.value.width,
        height: dantian.value.height,
        occupiedSlots: []
      }
      
      // 收集其他法宝的占用格子
      for (const fabao of placedFabaos.value) {
        if (fabao.id === pickingFabao.value.id) continue
        
        const slots = getFabaoSlots(fabao)
        dantianData.occupiedSlots.push(...slots)
      }
      
      previewValid.value = canPlaceFabaoUtil(dantianData, originalShape, previewPosition.value, pickingRotation.value)
      console.log(`  - 旋转后验证: ${previewValid.value ? '✓ 可放置' : '✗ 不可放置'}`)
    }
  }
}

// 获取过滤器名称
function getFilterName(filter) {
  const names = {
    all: '全部',
    available: '可放置',
    inDantian: '丹田中',
    damaged: '已损毁'
  }
  return names[filter] || filter
}

// 页面加载
onMounted(async () => {
  await fabaoStore.fetchFabaos()
  
  // 聚焦到根元素以接收键盘事件
  await nextTick()
  viewRef.value?.focus()
})
</script>

<style scoped>
.dantian-view {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
  outline: none;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 20px;
}

.btn-back {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-back:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.spacer {
  flex: 1;
  min-width: 150px;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.dantian-container {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 30px;
  max-width: 1600px;
  margin: 0 auto;
}

/* 左侧：丹田区域 */
.dantian-grid-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.hint-text {
  margin-top: 10px;
  padding: 8px 12px;
  background: #e3f2fd;
  border-left: 4px solid #2196F3;
  font-size: 13px;
  color: #1565C0;
  border-radius: 4px;
}

.capacity-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #81C784);
  transition: width 0.3s;
}

.grid-wrapper {
  position: relative;
  overflow: auto;
  max-height: 600px;
  width: fit-content;
}

.dantian-grid {
  display: grid;
  gap: 2px;
  background: #ddd;
  padding: 2px;
  position: relative;
  border: 3px solid #4CAF50;
  border-radius: 8px;
  user-select: none;
}

.grid-row {
  display: contents;
}

.grid-cell {
  background: white;
  border: 1px solid #e0e0e0;
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.grid-cell.occupied {
  background: #ffebee;
}

.grid-cell.preview-valid {
  background: rgba(76, 175, 80, 0.3);
  border-color: #4CAF50;
}

.grid-cell.preview-invalid {
  background: rgba(244, 67, 54, 0.3);
  border-color: #f44336;
}

.cell-coord {
  font-size: 10px;
  color: #999;
  user-select: none;
  pointer-events: none;
}

.fabao-cell {
  position: absolute;
  background: rgba(76, 175, 80, 0.6);
  border: 1px solid #4CAF50;
  cursor: grab;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fabao-cell:hover {
  background: rgba(76, 175, 80, 0.8);
  transform: scale(1.05);
}

/* 损毁的法宝样式 */
.fabao-cell.damaged {
  opacity: 0.6;
  filter: grayscale(0.7);
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 0, 0, 0.1),
    rgba(255, 0, 0, 0.1) 10px,
    rgba(0, 0, 0, 0.2) 10px,
    rgba(0, 0, 0, 0.2) 20px
  ) !important;
  border-color: #e74c3c !important;
}

.fabao-cell.damaged:hover {
  cursor: not-allowed;
  filter: grayscale(0.7) brightness(1.1);
}

.damaged-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 1.2rem;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
  animation: pulse-damage 1.5s ease-in-out infinite;
}

@keyframes pulse-damage {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.cell-icon {
  font-size: 32px;
  pointer-events: none;
}

.preview-cell {
  position: absolute;
  border: 2px solid;
  pointer-events: none;
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

.preview-cell.valid {
  background: rgba(76, 175, 80, 0.6);
  border-color: #4CAF50;
}

.preview-cell.invalid {
  background: rgba(244, 67, 54, 0.6);
  border-color: #f44336;
}

.preview-icon {
  font-size: 32px;
  pointer-events: none;
}

.fabao-icon {
  font-size: 24px;
  pointer-events: none;
}

.fabao-name {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  margin-top: 4px;
  pointer-events: none;
}

/* 右侧：法宝库存 */
.fabao-inventory-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.fabao-inventory-section h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.filter-tab {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.filter-tab.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
  font-weight: bold;
}

.fabao-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  max-height: 700px;
  overflow-y: auto;
}

.fabao-card {
  background: #fafafa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 15px;
  cursor: grab;
  transition: all 0.3s;
  user-select: none;
}

.fabao-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
}

.fabao-card.picking {
  opacity: 0.5;
  cursor: grabbing;
}

.fabao-card.damaged {
  opacity: 0.6;
  border-color: #f44336;
  cursor: not-allowed;
}

.fabao-card.inDantian {
  border-color: #2196F3;
  background: #e3f2fd;
  cursor: grab;
}

.card-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.fabao-icon-large {
  font-size: 48px;
}

.fabao-info {
  flex: 1;
}

.fabao-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.fabao-rarity {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  color: white;
  font-weight: bold;
}

.rarity-common { background: #9E9E9E; }
.rarity-fine { background: #4CAF50; }
.rarity-rare { background: #2196F3; }
.rarity-epic { background: #9C27B0; }
.rarity-legendary { background: #FF9800; }
.rarity-mythic { background: #F44336; }

.fabao-realm {
  font-size: 12px;
  color: #666;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.card-shape {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
}

.shape-preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shape-row-mini {
  display: flex;
  gap: 2px;
}

.shape-cell-mini {
  width: 12px;
  height: 12px;
  background: #ddd;
  border-radius: 2px;
}

.shape-cell-mini.active {
  background: #4CAF50;
}

.shape-info {
  font-size: 12px;
  color: #666;
}

.card-status {
  margin-bottom: 8px;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.status-tag.damaged {
  background: #ffebee;
  color: #f44336;
}

.status-tag.in-dantian {
  background: #e3f2fd;
  color: #2196F3;
}

.status-tag.available {
  background: #e8f5e9;
  color: #4CAF50;
}

/* 修复按钮 */
.btn-repair {
  width: 100%;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(243, 156, 18, 0.3);
}

.btn-repair:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(243, 156, 18, 0.4);
}

/* 温养信息 */
.nourish-info {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.nourish-header {
  margin-bottom: 0.5rem;
}

.nourish-badge {
  font-size: 0.85rem;
  font-weight: bold;
  text-shadow: 0 0 8px currentColor;
  display: inline-block;
  animation: pulse-glow 2s ease-in-out infinite;
}

/* 强化等级徽章 */
.enhance-badge {
  display: inline-block;
  padding: 2px 6px;
  margin-left: 6px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 4px;
  vertical-align: middle;
  box-shadow: 0 2px 4px rgba(238, 90, 82, 0.3);
}

.name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fabao-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.realm-text {
  color: #888;
  font-size: 0.9rem;
  margin-left: 2px;
}

.realm-rarity {
  font-size: 0.85rem;
  color: #999;
  margin-top: 2px;
}

.card-header {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

/* 稀有度徽章（右上角） */
.rarity-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 0 8px 0 8px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 不同稀有度的颜色 */
.rarity-badge.rarity-common {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

.rarity-badge.rarity-fine {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.rarity-badge.rarity-rare {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.rarity-badge.rarity-epic {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.rarity-badge.rarity-legendary {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.rarity-badge.rarity-mythic {
  background: linear-gradient(135deg, #1abc9c, #16a085);
}

@keyframes nourish-glow {
  0%,  from { opacity: 1; }
  to { opacity: 0.5; }
}

/* ==================== 技能展示栏样式 ==================== */

.skills-section {
  margin-top: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(100, 255, 218, 0.08), rgba(52, 152, 219, 0.08));
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.skills-header {
  font-size: 0.9rem;
  font-weight: bold;
  color: #64ffda;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(100, 255, 218, 0.15);
  transition: all 0.2s;
  cursor: help;
}

.skill-item:hover {
  background: rgba(100, 255, 218, 0.12);
  border-color: rgba(100, 255, 218, 0.4);
  transform: translateX(3px);
}

.skill-icon-large {
  font-size: 2rem;
  min-width: 40px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skill-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.skill-name {
  font-size: 0.95rem;
  font-weight: bold;
  color: #64ffda;
}

.skill-description {
  font-size: 0.8rem;
  color: #999;
  line-height: 1.4;
}

.skill-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.2rem;
}

.skill-stat {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.skill-stat.mp-cost {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.skill-stat.damage {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.skill-stat.heal {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.skill-stat.defense {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  border: 1px solid rgba(243, 156, 18, 0.3);
}

.skill-level {
  font-size: 0.7rem;
  color: #f39c12;
  background: rgba(243, 156, 18, 0.2);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-weight: bold;
}

.nourish-progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.nourish-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #a855f7, #fbbf24);
  transition: width 0.5s ease-out;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
}

.nourish-time {
  font-size: 0.7rem;
  color: #a855f7;
  margin-bottom: 0.5rem;
  text-align: center;
}

.nourish-bonus {
  display: flex;
  justify-content: space-around;
  font-size: 0.75rem;
  color: #fbbf24;
  font-weight: bold;
  border-top: 1px solid rgba(251, 191, 36, 0.2);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.bonus-icon {
  margin-right: 0.25rem;
}

/* 温养控制按钮 */
.nourish-controls {
  margin-top: 0.5rem;
}

.btn-nourish-start,
.btn-nourish-stop {
  width: 100%;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-nourish-start {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(168, 85, 247, 0.3);
}

.btn-nourish-start:hover {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.5);
}

.btn-nourish-stop {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(75, 85, 99, 0.3);
}

.btn-nourish-stop:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(75, 85, 99, 0.5);
}

.btn-repair:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(243, 156, 18, 0.3);
}

.nourish-info {
  font-size: 12px;
  color: #FF9800;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nourish-icon {
  font-size: 14px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #999;
}

/* ==================== 标签切换样式 ==================== */

.tabs {
  display: flex;
  gap: 1rem;
  margin: 0 2rem 2rem 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  padding: 1rem 2rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  color: #666;
  transition: all 0.2s;
}

.tab:hover {
  color: #4CAF50;
}

.tab.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

/* ==================== 强化界面样式 ==================== */

.enhance-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  padding: 0 2rem;
  height: calc(100vh - 240px);
}

/* 法宝列表面板 */
.fabao-list-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.fabao-list-panel h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.enhance-hint {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff9e6 0%, #ffedcc 100%);
  border-left: 4px solid #f39c12;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #856404;
  line-height: 1.4;
}

.enhance-fabao-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.enhance-fabao-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9f9f9;
}

.enhance-fabao-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.enhance-fabao-item.selected {
  background: #e8f5e9;
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.enhance-fabao-item .fabao-icon-large {
  font-size: 2rem;
}

.enhance-fabao-item .fabao-info {
  flex: 1;
}

.enhance-fabao-item .fabao-name {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.enhance-fabao-item .fabao-level {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.enhance-fabao-item .fabao-grid {
  font-size: 0.85rem;
  color: #95a5a6;
}

/* 强化详情面板 */
.enhance-detail-panel {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.enhance-detail-panel h2 {
  margin: 0 0 2rem 0;
  color: #2c3e50;
  font-size: 1.8rem;
  text-align: center;
}

.enhance-detail-panel .section {
  margin-bottom: 2rem;
}

.enhance-detail-panel .section h3 {
  margin: 0 0 1rem 0;
  color: #34495e;
  font-size: 1.2rem;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 0.5rem;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-item .label {
  display: block;
  font-size: 0.85rem;
  color: #95a5a6;
  margin-bottom: 0.5rem;
}

.stat-item .value {
  display: block;
  font-size: 1.3rem;
  font-weight: bold;
  color: #2c3e50;
}

/* 预览样式 */
.stats-grid.preview .stat-item {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.stats-grid.preview .stat-item .value.change {
  color: #27ae60;
}

.stats-grid.preview .arrow {
  font-size: 1.1rem;
  margin-left: 0.25rem;
}

/* 强化信息 */
.enhance-info {
  background: #ecf0f1;
  padding: 1.5rem;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #d5dbdb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #7f8c8d;
  font-weight: 500;
}

.info-row .value {
  font-weight: bold;
  color: #2c3e50;
}

.info-row .value.cost {
  color: #f39c12;
  font-size: 1.2rem;
}

.info-row .value.rate {
  color: #27ae60;
  font-size: 1.2rem;
}

/* 强化按钮 */
.btn-enhance {
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-enhance:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
}

.btn-enhance:active:not(:disabled) {
  transform: translateY(-1px);
}

.btn-enhance:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
  transform: none;
}

/* 警告文本 */
.warning-text {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  color: #856404;
  text-align: center;
  font-weight: bold;
}

/* 空状态占位符 */
.enhance-detail-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-placeholder {
  text-align: center;
  color: #95a5a6;
}

.empty-placeholder .icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-placeholder p {
  font-size: 1.1rem;
  margin: 0;
}

</style>
