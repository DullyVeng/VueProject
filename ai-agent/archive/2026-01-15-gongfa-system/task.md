# 筑基期功法系统 - 开发任务

**项目状态**：进行中  
**当前阶段**：境界系统完善（阶段0扩展）  
**最后更新**：2026-01-15

---

## 完成进度总览

- ✅ 阶段0：境界晋升系统（已完成）
- ⬜ 阶段1：数据层设计
- ⬜ 阶段2：Store层实现
- ⬜ 阶段3：UI实现
- ⬜ 阶段4：系统集成

---

## ✅ 阶段0：境界晋升系统（已完成）

### 0.1 境界突破逻辑 ✅
- [x] `data/realmRequirements.js` - 境界突破条件配置
- [x] `stores/character.js` - advanceRealm() 方法
- [x] 突破条件检查（等级、境界等级、灵石）
- [x] 突破成功处理（更新数据库）

### 0.2 境界任务 ✅
- [x] `data/quests.js` - 添加筑基突破任务
- [x] 新增任务类型 `realm`（境界任务）
- [x] 任务奖励：首个功法（御剑诀）

### 0.3 境界UI ✅
- [x] 境界面板组件（RealmPanel.vue）
- [x] CharacterPanel添加境界信息显示
- [x] 经验值进度条显示
- [ ] 识海入口未解锁提示（待UI集成时实现）

### 0.4 等级晋升系统 ✅（新增）
- [x] 境界层数改为1-9层（原10层）
- [x] 经验槽限制机制（满了无法升级）
- [x] 经验溢出舍弃处理
- [x] 境界层数手动突破（advanceRealmLevel）
- [x] 灵石消耗设计（层数+1 × 100）
- [x] 经验公式优化（level × 50）
- [x] UI：CharacterPanel境界层数突破按钮

### 0.5 Bug修复 ✅
- [x] 法宝HP溢出问题（fabao.js异常检测）
- [x] 任务重复领取问题（数据库唯一约束+双重检查）
- [x] canAcceptQuest参数修正（character对象）

---

## ⬜ 阶段1：数据层设计

### 1.1 静态配置文件
- [ ] `data/gongfas.js` - 功法基础配置
- [ ] `data/gongfaSchools.js` - 功法派系定义
- [ ] `data/gongfaBonds.js` - 功法羁绊配置

### 1.2 数据库设计
- [ ] `supabase/gongfa_instances.sql` - 功法实例表
- [ ] `supabase/shihai_extension.sql` - 识海字段扩展
- [ ] MCP执行SQL脚本

---

## ⬜ 阶段2：Store层实现

### 2.1 核心Store
- [ ] `stores/gongfa.js` - 功法store主文件
  - [ ] fetchGongfas() - 获取玩家功法
  - [ ] addGongfa() - 添加功法
  - [ ] placeGongfaInShihai() - 放置到识海
  - [ ] removeFromShihai() - 从识海移除
  - [ ] calculateBonds() - 计算羁绊效果

### 2.2 属性集成
- [ ] `stores/attribute.js` - 添加识海容量计算
- [ ] 神识属性影响识海容量

---

## ⬜ 阶段3：UI实现

### 3.1 主视图
- [ ] `views/ShihaiView.vue` - 识海主界面
  - [ ] 识海格子/列表系统
  - [ ] 功法放置/移除
  - [ ] 容量显示

### 3.2 组件
- [ ] `components/GongfaCard.vue` - 功法卡片
- [ ] `components/GongfaDetail.vue` - 功法详情弹窗
- [ ] `components/BondPanel.vue` - 羁绊面板

### 3.3 导航集成
- [ ] 路由配置
- [ ] 导航菜单添加入口
- [ ] 境界检查（筑基期才显示/点击提示）

---

## ⬜ 阶段4：系统集成

### 4.1 战斗集成
- [ ] 羁绊效果应用到战斗计算
- [ ] 功法属性加成

### 4.2 测试验证
- [ ] 境界突破测试
- [ ] 功法装备测试
- [ ] 羁绊计算测试
- [ ] UI交互测试

---

## 📝 本次会话完成内容（2026-01-15）

### 新机制开发
1. **境界层数系统重构**
   - 每个境界1-9层（原10层）
   - 每10级对应1层（10级=1层，20级=2层...90级=9层）
   - 经验槽满后必须手动突破才能继续升级
   - 筑基突破需要：炼气9层 + 100级 + 经验槽满

2. **境界层数突破机制**
   - 新增`advanceRealmLevel()`方法
   - 灵石消耗：(层数+1) × 100（递增制）
   - 突破效果：等级+1，层数+1，经验清空
   - 兼容高等级玩家（32级炼气1层可直接突破）

3. **经验系统优化**
   - 公式从`level × 100`改为`level × 50`
   - 经验槽满后阻止升级（溢出舍弃）
   - 控制台提示需要突破

### Bug修复
1. **法宝HP溢出** - 添加异常检测和修正
2. **任务重复领取** - 数据库唯一约束 + 双重检查
3. **任务参数错误** - canAcceptQuest传入完整character对象

### 文件修改清单
- ✅ `data/playerRealms.js` - maxLevel改为9
- ✅ `data/realmRequirements.js` - 筑基条件改为100级
- ✅ `stores/character.js` - gainExp重构 + advanceRealmLevel
- ✅ `stores/fabao.js` - HP异常检测
- ✅ `stores/quest.js` - 数据库重复检查 + canAcceptQuest修正
- ✅ `components/game/CharacterPanel.vue` - 境界层数UI
- ✅ `components/QuestListDialog.vue` - onMounted加载任务
- ✅ `supabase/add_quest_unique_constraint.sql` - 任务唯一约束

---

## 下一步计划

**阶段1：功法数据层设计**

1. 创建 `data/gongfas.js` - 定义5-10个初始功法
2. 创建 `data/gongfaSchools.js` - 定义功法派系（剑修、道修、佛修）
3. 创建 `data/gongfaBonds.js` - 定义剑修羁绊配置
4. 编写 `supabase/gongfa_instances.sql` 数据库表
5. 编写 `supabase/shihai_extension.sql` 角色表扩展

---

## 已知问题

无

---

## 技术债务

1. CharacterPanel经验值显示使用简化计算（level × 50），后续可能需要调整
2. 境界层数显示硬编码"炼气"，需要动态获取境界名称

---

## 备注

- ✅ 开发服务器运行正常（http://localhost:5173）
- ✅ 境界层数突破UI已集成到CharacterPanel
- 📁 临时文件：`REALM_LEVEL_UI_TODO.md`（可删除）
