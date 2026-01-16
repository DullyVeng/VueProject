# 小地图探索系统 - 技术实现

**创建时间**：2026-01-15  
**状态**：已完成 ✅

---

## 文件变更清单

### 新建文件

| 文件路径 | 说明 |
|----------|------|
| `src/data/explorationMaps.js` | 小地图配置数据 |
| `src/views/ExplorationMapView.vue` | 小地图探索视图组件 |
| `src/stores/exploration.js` | 探索状态管理 (Pinia Store) |

### 修改文件

| 文件路径 | 变更说明 |
|----------|----------|
| `src/router/index.js` | 添加 `/exploration/:mapId` 路由 |
| `src/views/MapView.vue` | 修改"探索"按钮逻辑，跳转到小地图 |
| `src/data/maps.js` | 添加 `explorationMapId` 关联字段 |

---

## 核心数据结构

### 小地图配置 (`explorationMaps.js`)

```javascript
export const explorationMaps = {
  forest: {
    id: 'forest',
    name: '迷雾森林探索区',
    parentMapId: 'forest',        // 关联大地图ID
    width: 20,                    // 地图宽度（格数）
    height: 15,                   // 地图高度（格数）
    tileSize: 32,                 // 每格像素
    encounterRate: 0.15,          // 隐性遭遇率 (15%)
    
    // 地形数据 (0=空地, 1=墙壁, 2=障碍物, 9=出口)
    terrain: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // ... 更多行
    ],
    
    // 玩家出生点
    spawnPoint: { x: 10, y: 7 },
    
    // 显性怪物
    visibleMonsters: [
      { id: 'slime_1', monsterId: 'slime', x: 5, y: 3 },
      { id: 'wolf_1', monsterId: 'wolf', x: 15, y: 10 }
    ],
    
    // 隐性怪物池（遭遇时随机选择）
    hiddenMonsters: ['slime', 'wolf', 'boar']
  }
}

// 地形类型
export const TERRAIN_TYPES = {
  GROUND: 0,      // 可行走
  WALL: 1,        // 墙壁（不可通过）
  OBSTACLE: 2,    // 障碍物（不可通过）
  WATER: 3,       // 水域（不可通过）
  EXIT: 9         // 出口（触发返回大地图）
}
```

### 探索状态 Store (`stores/exploration.js`)

```javascript
export const useExplorationStore = defineStore('exploration', {
  state: () => ({
    currentMapId: null,
    playerPosition: { x: 0, y: 0 },
    playerDirection: 'down',
    visibleMonsters: [],
    defeatedMonsters: [],
    isMoving: false
  }),
  
  actions: {
    enterMap(mapId) { /* ... */ },
    movePlayer(direction) { /* ... */ },
    checkEncounter() { /* ... */ },
    exitMap() { /* ... */ }
  }
})
```

---

## 组件设计

### ExplorationMapView.vue 结构

```
┌─────────────────────────────────────────┐
│              地图标题栏                  │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │         网格地图区域             │   │
│   │    (CSS Grid 渲染)              │   │
│   │                                 │   │
│   │    👤 玩家   👹 怪物             │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [返回]                    遭遇率: 15%    │
└─────────────────────────────────────────┘
```

---

## 移动实现

### 键盘控制

```javascript
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

const handleKeyDown = (e) => {
  const keyMap = {
    'ArrowUp': 'up', 'w': 'up', 'W': 'up',
    'ArrowDown': 'down', 's': 'down', 'S': 'down',
    'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
    'ArrowRight': 'right', 'd': 'right', 'D': 'right'
  }
  
  const direction = keyMap[e.key]
  if (direction) {
    e.preventDefault()
    explorationStore.movePlayer(direction)
  }
}
```

### 碰撞检测

```javascript
const canMoveTo = (x, y) => {
  // 边界检测
  if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
    return false
  }
  
  // 地形检测
  const terrain = currentMap.terrain[y][x]
  if (terrain === TERRAIN_TYPES.WALL || terrain === TERRAIN_TYPES.OBSTACLE) {
    return false
  }
  
  return true
}
```

---

## 战斗触发

### 显性怪物碰撞

```javascript
const checkVisibleMonsterCollision = (x, y) => {
  const monster = visibleMonsters.find(m => m.x === x && m.y === y)
  if (monster && !defeatedMonsters.includes(monster.id)) {
    triggerBattle(monster.monsterId)
  }
}
```

### 隐性怪物遭遇

```javascript
const checkHiddenEncounter = () => {
  if (Math.random() < currentMap.encounterRate) {
    const randomMonster = currentMap.hiddenMonsters[
      Math.floor(Math.random() * currentMap.hiddenMonsters.length)
    ]
    triggerBattle(randomMonster)
  }
}
```

---

## 验证方式

1. **功能验证**：在浏览器中测试地图渲染、移动、战斗触发
2. **边界测试**：测试墙壁碰撞、地图边缘、出口功能
3. **概率验证**：多次移动验证隐性遭遇率的准确性

---

*最后更新：2026-01-15*
