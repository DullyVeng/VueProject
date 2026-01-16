# 筑基期功法系统 - 需求详情

---

## 核心需求来源

基于《核心玩法设计文档》中的功法系统设计：

> **功法系统(P1)**
> 1. 功法存放识海里
> 2. 功法配置占人物的功法点数，会影响修行的速度
> 3. 功法有单独的识海栏，筑基期解锁识海栏后，识海栏只能靠加点增加
> 4. 功法派系之间可以存在羁绊增益，可以通过build功法搭配来强化自身

---

## 功能需求

### FR-001 识海系统
- 玩家达到**筑基期**后解锁识海界面
- 识海容量由**神识**属性决定：`基础容量(10格) + 神识 * 2`
- 可以将功法放入/移出识海

### FR-002 功法存储
- 功法占用识海格子（不同功法占用不同数量）
- 每个功法有基础属性加成
- 功法有派系分类（剑修、佛修、魔修、道修等）

### FR-003 功法羁绊
羁绊阈值设计（以剑修为例）：

| 数量 | 羁绊效果 |
|------|----------|
| 2本 | 攻击速度+10% |
| 4本 | 剑气溅射，伤害+30%到相邻敌人 |
| 6本 | 每次攻击额外触发剑影攻击 |

### FR-004 属性关联
- **神识**：识海容量、功法数量上限
- **悟性**：功法升级速度、羁绊属性提升率
- **气运**：功法掉落概率

---

## 数据结构设计

### 功法配置（静态数据）
```javascript
{
  id: 'yujian_jue',
  name: '御剑诀',
  description: '基础剑修功法，可驾驭飞剑',
  school: 'sword',  // 派系：sword/buddha/demon/dao
  tier: 1,          // 品阶
  slotCost: 2,      // 占用识海格子数
  attributes: {
    attack: 10,
    critRate: 0.05
  },
  requiredRealm: 'zhuji'  // 需要筑基期
}
```

### 功法实例（数据库）
```sql
CREATE TABLE gongfa_instances (
  id UUID PRIMARY KEY,
  character_id UUID REFERENCES characters,
  gongfa_id TEXT NOT NULL,
  level INT DEFAULT 1,
  exp INT DEFAULT 0,
  is_in_shihai BOOLEAN DEFAULT FALSE,
  shihai_slot INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 羁绊配置
```javascript
{
  school: 'sword',
  name: '剑心通明',
  tiers: [
    { count: 2, effect: { attackSpeed: 0.10 } },
    { count: 4, effect: { splashDamage: 0.30 } },
    { count: 6, effect: { extraAttack: true } }
  ]
}
```

---

## UI设计要点

### 识海视图
- 类似丹田格子系统，但更简化（列表形式或格子形式）
- 显示当前容量/最大容量
- 功法卡片可拖拽放入

### 功法卡片
- 显示功法名称、派系图标、品阶
- 显示占用格子数、属性加成
- 悬停显示详细信息

### 羁绊面板
- 显示当前激活的羁绊
- 显示下一级羁绊需要的功法数量
- 羁绊效果高亮显示

---

## 验收标准

1. ✅ 筑基期玩家可以进入识海界面
2. ✅ 可以将功法放入识海、从识海移除
3. ✅ 羁绊效果正确计算
4. ✅ 功法属性加成应用到角色
5. ✅ 识海容量受神识属性影响
