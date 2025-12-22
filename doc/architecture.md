# 游戏项目架构设计文档

## 1. 项目概述

*   **项目类型**：小型网页 RPG 游戏
*   **核心架构**：
    *   **前端**：Vue.js 3 + Vite + Pinia + Vue Router
    *   **后端/数据库**：Supabase (PostgreSQL + Auth + Realtime)
    *   **扩展后端**：Java (可选，用于复杂游戏逻辑校验或服务端计算，当前阶段优先使用 Supabase Edge Functions/Database Functions)
*   **部署方式**：Web 浏览器可直接运行 (SPA)

## 2. 核心功能

### 2.1 用户系统
*   **基础功能**：用户注册、登录、登出
*   **认证支持**：Supabase Auth (Email/Password)
*   **数据存储**：用户 ID 与数据库表强关联

### 2.2 角色系统
*   **角色创建**：绑定 User ID，初始 1 级
*   **属性系统**：
    *   `HP` (生命值) = `BaseHP` + `Level` * `GrowthHP` + `EquipHP`
    *   `MP` (魔法值) = `BaseMP` + `Level` * `GrowthMP` + `EquipMP`
    *   `ATK` (攻击力) = `BaseATK` + `Level` * `GrowthATK` + `EquipATK`
    *   `DEF` (防御力) = `BaseDEF` + `Level` * `GrowthDEF` + `EquipDEF`
*   **成长机制**：
    *   升级所需经验：`NextLevelExp = Level * 100 * 1.2^Level` (示例公式)

### 2.3 背包系统
*   **物品数据**：`inventory` 表存储 `item_id` 和 `quantity`
*   **物品表 (静态配表)**：客户端或数据库存储物品元数据 (name, description, type, effect_value)
*   **操作**：使用 (消耗品)、装备 (改变角色属性)、丢弃

### 2.4 战斗系统
*   **机制**：回合制 (Turn-based)
*   **流程**：
    1.  玩家发起战斗
    2.  生成/读取怪物属性
    3.  回合循环：玩家行动 -> 结算 -> 怪物行动 -> 结算
    4.  战斗结束：判定胜负，发放奖励 (Transaction 处理)
*   **伤害公式**：`Damage = max(1, Attacker.ATK - Defender.DEF)`

### 2.5 任务系统
*   **结构**：任务 ID、前置条件、目标 (杀怪/收集 ID)、奖励
*   **状态维护**：`character_quests` 表记录进度 (progress/status)

### 2.6 地图系统
*   **实现**：Grid 或 节点式地图
*   **数据**：当前所在地 ID 存储在角色表

### 2.7 排行榜系统
*   **实现**：Supabase Realtime 订阅 `leaderboard` 视图变更，或定时查询顶级玩家

## 3. 数据库设计 (Supabase PostgreSQL)

### 3.1 核心表结构
*   **users**: Supabase auth.users 引用
*   **characters**: 角色核心数据 (user_id, name, lvl, exp, stats...)
*   **items**: 物品定义表 (id, name, type, stats_bonus) [静态数据]
*   **inventory**: 角色背包 (character_id, item_id, count)
*   **monsters**: 怪物定义表 (id, name, base_stats, drops) [静态数据]
*   **quests**: 任务定义表 [静态数据]
*   **character_quests**: 任务进度 (char_id, quest_id, current_step, status)

### 3.2 安全策略 (RLS)
*   所有表开启 RLS (Row Level Security)。
*   `characters`: 用户只能 CRUD 自己的角色。
*   `inventory`: 用户只能操作自己角色的物品。

## 4. 前端架构 (Vue.js)

### 4.1 技术选型
*   **Build Tool**: Vite
*   **Framework**: Vue 3 (Composition API)
*   **State Management**: Pinia (管理 UserSession, PlayerStats, GameStatus)
*   **Router**: Vue Router (Login -> SelectCharacter -> GameMain)
*   **UI Library**: 自定义 CSS 或 TailwindCSS (保持轻量)

### 4.2 目录结构
```
src/
├── assets/          # 静态资源 (images, styles)
├── components/      # 通用组件 (StatusCard, ItemSlot, Modal)
├── composables/     # 组合式函数 (useCombat, useInventory)
├── router/          # 路由配置
├── stores/          # Pinia 状态 (user.js, game.js)
├── views/           # 页面级组件 (LoginView, GameView, CharacterView)
├── supabase/        # Supabase 客户端初始化
├── utils/           # 工具函数 (formulas.js, constants.js)
└── App.vue
```

## 5. 初始化计划
1.  构建 Vue 项目骨架
2.  配置 Supabase JS Client
3.  搭建基础路由与 Pinia Store
