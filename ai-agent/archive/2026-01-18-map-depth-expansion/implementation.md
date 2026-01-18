# 小地图深度扩展 - 实现计划

本计划旨在为修仙 RPG 小地图探索系统添加精英怪、地图 BOSS 和宝箱功能，增强游戏深度和可玩性。

---

## 背景与目标

当前小地图仅有基础的显性怪物和隐性遭遇机制。此次迭代将：
1. 升级显性怪物为精英怪（属性加成 + 前缀词条）
2. 每个地图添加固定 BOSS（特殊掉落 + 24小时刷新）
3. 添加宝箱系统（多等级 + 概率奖励）

---

## 提议的变更

### 怪物系统组件

---

#### [NEW] [eliteMonsters.js](file:///e:/Project/JavaProject/web-client/src/data/eliteMonsters.js)

定义精英怪前缀词条系统：
- `ELITE_PREFIXES`：词条配置（狂暴、坚韧、迅捷、毒性）
- `generateEliteMonster(baseMonster, level)`：基于基础怪生成精英怪
- 属性加成：生命值 x2、攻击力 x1.5、防御力 x1.3
- **奖励提升：经验 x5、灵石 x5**

---

#### [NEW] [mapBosses.js](file:///e:/Project/JavaProject/web-client/src/data/mapBosses.js)

定义地图 BOSS 配置：
- 三个地图各一个 BOSS（迷雾森林王、青石山主、洞穴魔君）
- BOSS 属性：生命值 x5、攻击力 x3
- **动态位置算法**：生成时使用 `placeOnValidGround()` 确保不在障碍物上
- 特殊掉落配置（封印法宝、建筑图纸、大量灵石）
- **击败后从地图消失**

> [!IMPORTANT]
> BOSS 击败时间需存入 Supabase 数据库，实现 24 小时刷新机制

---

#### [MODIFY] [explorationMaps.js](file:///e:/Project/JavaProject/web-client/src/data/explorationMaps.js)

- 引入精英怪生成器
- 修改 `visibleMonsters` 为精英怪类型
- 添加 `boss` 字段（BOSS 配置引用）
- 添加 `chests` 字段（宝箱位置配置）
- **新增 `placeOnValidGround(map, count)` 方法**：确保 BOSS 和宝箱放置在可行走区域

---

### 宝箱系统组件

---

#### [NEW] [chests.js](file:///e:/Project/JavaProject/web-client/src/data/chests.js)

定义宝箱配置：
- 宝箱类型：`WOODEN`（普通）、`IRON`（稀有）、`GOLDEN`（传说）
- 宝箱内容概率表（灵石、材料、法宝）
- 各地图宝箱分布配置
- **宝箱使用 `placeOnValidGround()` 放置，避免障碍物**
- **开启后从地图消失**

---

#### [MODIFY] [exploration.js](file:///e:/Project/JavaProject/web-client/src/stores/exploration.js)

- 添加 `openedChests` 状态（记录已开启宝箱，开启后从地图移除）
- 添加 `currentBoss` 状态（当前 BOSS 信息）
- 添加 `bossDefeated` 状态（BOSS 击败后从地图移除）
- 添加 `bossDirection` 计算属性（**BOSS 方向指引**）
- 添加 `saveBossDefeatTime()` 方法（**存入数据库**）
- 添加 `checkBossRespawn()` 方法（24小时刷新检查）
- 添加 `checkChestCollision(x, y)` 方法
- 添加 `openChest(chestId)` 方法

---

### UI 组件

---

#### [MODIFY] [ExplorationMapView.vue](file:///e:/Project/JavaProject/web-client/src/views/ExplorationMapView.vue)

- `drawMap()` 中添加宝箱渲染逻辑
- `drawMap()` 中添加 BOSS 渲染逻辑（大型图标 + 光环）
- `drawMonster()` 添加精英怪标识（皇冠图标）
- 新增 `drawChest(ctx, chest)` 方法
- 新增 `drawBoss(ctx, boss)` 方法
- **新增 BOSS 方向指引 UI**（边缘箭头指示 BOSS 方位）
- 碰撞检测集成宝箱和 BOSS，**开启/击败后立即从画面移除**

---

#### [SKIPPED] [ChestOpenDialog.vue]
(改为直接在 ExplorationMapView.vue 中实现内联弹窗，以获得更好的状态管理体验)

---

### 数据库变更

---

#### [NEW] 数据库表：boss_defeats

需要在 Supabase 创建新表记录 BOSS 击败时间：

```sql
CREATE TABLE boss_defeats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    map_id TEXT NOT NULL,
    defeated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, map_id)
);

COMMENT ON TABLE boss_defeats IS 'BOSS击败记录表，用于24小时刷新机制';
COMMENT ON COLUMN boss_defeats.map_id IS '地图ID，如forest/mountain/cave';
COMMENT ON COLUMN boss_defeats.defeated_at IS 'BOSS击败时间';
```

---

## 验证计划

### 手动验证

1. **精英怪验证**
   - 进入任意小地图
   - 检查显性怪物显示精英标识
   - 战斗后确认奖励为 5 倍

2. **BOSS 验证**
   - 确认 BOSS 生成在可行走区域
   - 确认画面边缘有 BOSS 方向指引
   - 击败后 BOSS 从地图消失
   - 24 小时后重进确认 BOSS 刷新

3. **宝箱验证**
   - 确认宝箱生成在可行走区域
   - 开启后宝箱消失
   - 确认奖励符合等级
