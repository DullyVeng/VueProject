# 程序化地图生成系统 - 实现计划

实现基于随机漫步/挖掘者算法的程序化地图生成，替代当前的静态平铺方案，提供更好的可玩性和性能。

---

## User Review Required

> [!IMPORTANT]
> **核心算法选择**：推荐使用**挖掘者算法（Digger Algorithm）**
> - 相比随机漫步更可控
> - 更容易保证40%通路占比
> - 生成的地图结构更合理（房间+走廊）

> [!NOTE]
> **性能优化目标**：
> - 地图生成时间 < 100ms（200x150）
> - 渲染帧率 > 60 FPS
> - 内存占用减少 75%（Int8Array）

---

## Proposed Changes

### 工具层

#### [NEW] [mapGenerator.js](file:///c:/Users/MVGZ0052/Project/JavaProject/web-client/src/utils/mapGenerator.js)

创建地图生成器类：

**核心功能**：
- `DiggerMapGenerator` 类：挖掘者算法实现
- `generateMap(width, height, options)` 方法
- 连通性检测（洪水填充算法）
- 自动放置出口和出生点

**数据结构**：
```javascript
{
  terrain: Int8Array,        // 一维数组存储地形
  width: number,
  height: number,
  spawnPoint: {x, y},        // 自动计算的出生点
  exitPoints: [{x, y}],      // 边缘出口列表
  walkableTiles: number,     // 可通行格子数量
  walkableRatio: number      // 通行占比（> 0.4）
}
```

**算法要点**：
1. 初始化全为墙（1）
2. 从中心挖掘房间和走廊
3. 使用洪水填充确保100%连通
4. 如果不满足40%占比，重新生成
5. 在边缘放置出口（保证在通路上）

---

### 数据层

#### [MODIFY] [explorationMaps.js](file:///c:/Users/MVGZ0052/Project/JavaProject/web-client/src/data/explorationMaps.js)

**修改点**：

1. **动态生成地形**：
```javascript
import { DiggerMapGenerator } from '../utils/mapGenerator'

const generator = new DiggerMapGenerator()
const generatedMap = generator.generateMap(200, 150, {
  minWalkableRatio: 0.4,
  roomCount: 10,
  roomSizeRange: [5, 15]
})

export const explorationMaps = {
  forest: {
    ...generatedMap,
    // 静态配置保留
    encounterRate: 0.15,
    visibleMonsters: [...],
    hiddenMonsters: [...]
  }
}
```

2. **地形访问适配**：
```javascript
// 新增：一维数组访问辅助函数
export const getTerrainAt = (map, x, y) => {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
    return TERRAIN_TYPES.WALL
  }
  return map.terrain[y * map.width + x]
}
```

---

### 渲染层

#### [MODIFY] [ExplorationMapView.vue](file:///c:/Users/MVGZ0052/Project/JavaProject/web-client/src/views/ExplorationMapView.vue)

**性能优化**：

1. **视口裁剪渲染**（第141行）：
```javascript
// 当前：渲染所有30000格
for (let y = 0; y < map.height; y++) {
  for (let x = 0; x < map.width; x++)

// 优化：只渲染可见区域（约300格）
const startX = Math.max(0, Math.floor(clampedCameraX / TILE_SIZE))
const endX = Math.min(map.width, Math.ceil((clampedCameraX + canvas.width) / TILE_SIZE))
const startY = Math.max(0, Math.floor(clampedCameraY / TILE_SIZE))
const endY = Math.min(map.height, Math.ceil((clampedCameraY + canvas.height) / TILE_SIZE))

for (let y = startY; y < endY; y++) {
  for (let x = startX; x < endX; x++)
```

2. **地形访问适配**（第143-146行）：
```javascript
// 移除模运算平铺逻辑
// const terrainY = y % map.terrain.length
// const terrainX = x % map.terrain[0].length

// 使用一维数组直接访问
const terrain = map.terrain[y * map.width + x]
```

---

### 状态管理

#### [MODIFY] [exploration.js](file:///c:/Users/MVGZ0052/Project/JavaProject/web-client/src/stores/exploration.js)

**修改点**：

1. **适配新数据结构**（第189行 `getTerrainAt`）：
```javascript
const getTerrainAt = (x, y) => {
  if (!currentMap.value) return TERRAIN_TYPES.WALL
  if (x < 0 || x >= currentMap.value.width || y < 0 || y >= currentMap.value.height) {
    return TERRAIN_TYPES.WALL
  }
  return currentMap.value.terrain[y * currentMap.value.width + x]
}
```

2. **适配碰撞检测**（`isWalkable` 等工具函数）

---

## Verification Plan

### 自动化测试

**单元测试**（mapGenerator.js）：
```javascript
describe('DiggerMapGenerator', () => {
  test('生成的地图满足40%通路占比', () => {
    const map = generator.generateMap(200, 150)
    expect(map.walkableRatio).toBeGreaterThanOrEqual(0.4)
  })
  
  test('地图100%连通', () => {
    const map = generator.generateMap(200, 150)
    expect(isFullyConnected(map)).toBe(true)
  })
  
  test('出生点在通路上', () => {
    const map = generator.generateMap(200, 150)
    const spawnTerrain = map.terrain[map.spawnPoint.y * 200 + map.spawnPoint.x]
    expect(spawnTerrain).toBe(TERRAIN_TYPES.GROUND)
  })
})
```

### 手动验证

1. **地图生成验证**
   - 进入小地图，观察地形是否合理
   - 多次刷新，验证每次生成不同地图
   - 检查通路占比（控制台输出）

2. **性能验证**
   - 打开浏览器性能面板
   - 验证渲染帧率 > 60 FPS
   - 验证生成时间 < 100ms

3. **功能验证**
   - 移动到所有区域验证连通性
   - 找到出口位置验证可达性
   - 遭遇怪物验证游戏逻辑不受影响

---

*最后更新：2026-01-15*
