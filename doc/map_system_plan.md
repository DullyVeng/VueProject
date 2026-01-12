# 地图系统改进计划

## 现状分析

### 当前地图系统的问题 ❌

1. **地图数量少**：仅3个地图（起始镇、森林、洞穴）
2. **内容单一**：只有"探索"和"移动"两个功能
3. **无视觉呈现**：只有文字描述，缺少地图可视化
4. **无深度**：没有NPC、商店、资源点、特殊事件
5. **连接简单**：线性连接，无分支探索
6. **无成长感**：没有地图解锁、探索度等概念

---

## 设计目标 🎯

### 核心特性

1. **丰富的地图内容**：15-20个地图，多区域多主题
2. **可视化地图**：真实地图界面，节点连接可视化
3. **多样化活动**：战斗、资源采集、NPC交互、特殊事件
4. **探索系统**：地图解锁、探索度、隐藏区域
5. **沉浸感**：每个地图有独特背景、音乐（可选）、剧情

---

## 功能设计

### 1. 多层级地图结构 🗺️

#### 大世界地图（World Map）

```
修仙界
├── 凡间世界
│   ├── 起始镇
│   ├── 迷雾森林
│   ├── 青石山
│   ├── 幽暗洞穴
│   └── 古剑冢
├── 修炼区域
│   ├── 外门广场
│   ├── 藏经阁
│   ├── 炼器房
│   └── 试炼塔
├── 秘境
│   ├── 天霜秘境
│   ├── 火焰山
│   └── 蛟龙潭
└── 特殊区域
    ├── 坊市
    ├── 拍卖行
    └── 传送阵
```

#### 地图属性

```javascript
{
  id: 'map_forest',
  name: '迷雾森林',
  area: 'mortal_world',  // 所属区域
  type: 'wild',          // 类型：safe/wild/dungeon/town
  level: [1, 5],         // 推荐等级
  description: '...',
  
  // 新增属性
  unlockRequirement: {
    level: 1,            // 等级要求
    questId: null,       // 任务要求
    itemId: null         // 道具要求
  },
  
  // 地图特性
  features: [
    'combat',            // 战斗
    'resource',          // 资源采集
    'npc',              // NPC
    'shop',             // 商店
    'quest'             // 任务
  ],
  
  // 资源点
  resources: [
    { type: 'herb', name: '灵草', rarity: 'common' },
    { type: 'ore', name: '铁矿', rarity: 'common' }
  ],
  
  // NPC列表
  npcs: ['merchant_wang', 'quest_elder'],
  
  // 随机事件
  events: [
    { id: 'treasure_chest', chance: 0.1 },
    { id: 'wandering_merchant', chance: 0.05 }
  ],
  
  // 环境
  environment: {
    weather: 'foggy',
    danger: 'low',
    ambiance: 'mysterious'
  },
  
  // 视觉
  visual: {
    icon: '🌲',
    bgImage: '/assets/forest_bg.jpg',  // 可选
    color: '#2ecc71'
  }
}
```

---

### 2. 地图可视化 🎨

#### 方案A：节点连接图（推荐）

```
     [起始镇]
        |
     [森林]---[青石山]
        |         |
     [洞穴]     [古剑冢]
        |
     [秘境入口]
```

**实现**：
- 使用Canvas/SVG绘制节点
- 节点样式根据状态变化（已解锁/未解锁/当前位置）
- 点击节点显示详情
- 连线显示可达路径

#### 方案B：区域地图

使用图片背景+热点区域，点击进入

---

### 3. 地图活动系统 ⚔️

#### 3.1 战斗（combat）

现有功能，保持不变

#### 3.2 资源采集（resource）

```javascript
// 采集系统
{
  action: 'gather',
  resources: [
    {
      id: 'herb_lingcao',
      name: '灵草',
      icon: '🌿',
      rarity: 'common',
      dropRate: 0.6,
      apCost: 1
    }
  ]
}
```

**采集流程**：
1. 点击"采集资源"
2. 消耗行动点
3. 随机获得资源
4. 添加到背包

#### 3.3 NPC交互（npc）

**NPC类型**：
- 商人：出售物品
- 任务NPC：发布/完成任务
- 剧情NPC：推进故事
- 强者：切磋战斗

**交互界面**：
- 对话框
- 选项菜单
- 商店界面
- 任务接取

#### 3.4 特殊事件（event）

**随机事件示例**：
- 宝箱：随机奖励
- 流浪商人：稀有物品
- 奇遇：特殊剧情
- 伏击：强制战斗
- 仙缘：属性提升

---

### 4. 探索系统 🔍

#### 探索度

```javascript
{
  mapId: 'forest',
  explored: false,      // 是否探索过
  exploredCount: 3,     // 探索次数
  discoveries: [        // 发现的内容
    'treasure_chest_1',
    'secret_path'
  ],
  completion: 45        // 完成度 %
}
```

#### 隐藏区域

特定条件触发：
- 探索度达到100%
- 完成特定任务
- 携带特定道具

---

### 5. UI/UX设计 🎨

#### 主地图界面

```
┌────────────────────────────────────────┐
│  🏠 返回首页        世界地图            │
├────────────────────────────────────────┤
│                                        │
│   [地图可视化展示区域]                  │
│                                        │
│   ○ 起始镇 (当前)                       │
│   │                                    │
│   ○ 迷雾森林 ──── ○ 青石山              │
│   │                │                   │
│   ○ 幽暗洞穴     ○ 古剑冢               │
│                                        │
├────────────────────────────────────────┤
│ 📍 当前位置：迷雾森林                   │
│ 推荐等级：Lv.1-5 | 探索度：45%          │
│                                        │
│ [⚔️ 探索战斗] [🌿 采集资源]             │
│ [💬 寻找NPC] [🎒 查看背包]              │
└────────────────────────────────────────┘
```

#### 地图详情卡片

点击地图节点显示：
- 地图名称和描述
- 等级范围
- 可用活动列表
- NPC列表
- 资源信息
- 探索度
- 前往按钮

---

## 数据结构

### 地图配置文件

**文件**：`src/data/maps.js`

```javascript
export const areas = {
  mortal: {
    id: 'mortal_world',
    name: '凡间世界',
    maps: ['town', 'forest', 'mountain', 'cave', 'ruins']
  },
  sect: {
    id: 'sect_area',
    name: '宗门区域',
    unlockLevel: 10,
    maps: ['outer_plaza', 'library', 'forge', 'trial_tower']
  },
  secret: {
    id: 'secret_realm',
    name: '秘境',
    unlockLevel: 20,
    maps: ['frost_realm', 'flame_mountain', 'dragon_pool']
  }
}

export const maps = [
  // 凡间世界
  {
    id: 'town',
    name: '起始镇',
    area: 'mortal_world',
    // ... 详细配置
  },
  // ... 更多地图
]
```

### 数据库表

#### map_progress（地图进度）

```sql
CREATE TABLE map_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id),
  map_id VARCHAR(50) NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE,
  explored_count INTEGER DEFAULT 0,
  last_visited TIMESTAMP,
  discoveries JSONB DEFAULT '[]',
  UNIQUE(character_id, map_id)
);
```

---

## 实施阶段

### Phase 1：基础扩展（必须）

1. **扩充地图数量**：15-20个地图
2. **添加地图属性**：类型、资源、NPC
3. **改进UI**：更好的视觉效果

### Phase 2：核心功能（推荐）

4. **地图可视化**：节点连接图
5. **资源采集**：采集系统
6. **NPC系统**：基础对话和商店

### Phase 3：高级功能（可选）

7. **随机事件**：宝箱、奇遇
8. **隐藏区域**
9. **探索度系统**
10. **地图背景图**

---

## 技术实现

### 新建/修改文件

1. **[MODIFY] maps.js** - 扩充地图数据
2. **[NEW] mapEvents.js** - 随机事件配置
3. **[NEW] mapNPCs.js** - NPC配置
4. **[MODIFY] MapView.vue** - UI重构
5. **[NEW] MapVisualization.vue** - 地图可视化组件
6. **[NEW] stores/map.js** - 地图状态管理
7. **[SQL] map_progress.sql** - 数据库表

### Canvas地图绘制示例

```javascript
// MapCanvas.vue
function drawMap() {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  // 绘制连线
  connections.forEach(conn => {
    drawLine(ctx, conn.from, conn.to)
  })
  
  // 绘制节点
  maps.forEach(map => {
    drawNode(ctx, map.position, map.status)
  })
}
```

---

## 建议的地图列表

### 凡间世界（Lv.1-15）
1. 起始镇（安全区）
2. 迷雾森林（Lv.1-5）
3. 青石山（Lv.3-7）
4. 幽暗洞穴（Lv.5-10）
5. 古剑冢（Lv.8-12）
6. 妖兽谷（Lv.10-15）

### 宗门区域（Lv.10+）
7. 外门广场（安全区）
8. 藏经阁（安全区）
9. 炼器房（功能区）
10. 试炼塔（副本）

### 秘境（Lv.20+）
11. 天霜秘境（Lv.20-30）
12. 火焰山（Lv.25-35）
13. 蛟龙潭（Lv.30-40）

### 特殊区域
14. 修仙坊市（交易）
15. 天机阁（拍卖）

---

## 优先级

**P0（必须实现）**：
- 扩充地图到15个
- 改进UI展示
- 添加基础属性（等级、类型）

**P1（建议实现）**：
- 资源采集系统
- 地图可视化
- NPC系统

**P2（可选）**：
- 随机事件
- 探索度系统
- 地图背景图
