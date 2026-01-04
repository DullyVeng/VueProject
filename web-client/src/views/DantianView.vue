<template>
  <div class="dantian-view" @keydown="handleKeyDown" tabindex="0" ref="viewRef">
    <div class="page-header">
      <button @click="$router.push('/')" class="btn-back">
        ← 返回主界面
      </button>
      <h1>丹田管理</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="dantian-container">
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
              <span class="fabao-icon-large">{{ fabao.icon }}</span>
              <div class="fabao-info">
                <div class="fabao-name-row">
                  <span class="fabao-name">{{ fabao.name }}</span>
                  <span :class="['fabao-rarity', `rarity-${fabao.rarity}`]">
                    {{ fabao.rarityConfig?.name }}
                  </span>
                </div>
                <div class="fabao-realm">{{ fabao.realm }}</div>
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
            
            <div v-if="fabao.nourish_level > 0" class="nourish-info">
              <span class="nourish-icon">✨</span>
              温养Lv.{{ fabao.nourish_level }}
            </div>
          </div>
          
          <div v-if="filteredFabaos.length === 0" class="empty-state">
            暂无法宝
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useFabaoStore } from '../stores/fabao'
import { useCharacterStore } from '../stores/character'
import { rotateFabaoShape, countGrids, canPlaceFabao as canPlaceFabaoUtil, getFabaoOccupiedSlots } from '../utils/dantianUtils'

const fabaoStore = useFabaoStore()
const characterStore = useCharacterStore()

const GRID_SIZE = 60  // 每个格子60px
const GRID_GAP = 2    // 格子间隙2px
const GRID_PADDING = 2  // 网格padding 2px
const gridRef = ref(null)
const viewRef = ref(null)

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
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.5);
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
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
</style>
