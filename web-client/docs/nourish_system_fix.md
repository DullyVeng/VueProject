# 温养系统修复说明

## 修复的问题

### 问题 1：温养等级不会自动升级
**现象**：温养时间已经过了好几天，但数据库中的 `nourish_level` 仍然是 1 级

**原因**：
- `calculateNourishBonus` 函数虽然会计算应该的等级，但只是用于计算加成
- 没有机制将计算出的等级更新回数据库

**解决方案**：
- 添加了 `updateNourishLevel` 函数，用于自动检查并更新温养等级
- 当 `formatNourishTime` 检测到可以升级时，会自动触发等级更新
- 停止温养时也会自动更新等级到最新状态

### 问题 2：停止温养后重新开始，时间重置
**现象**：停止温养后再次开始，倒计时从 24 小时重新开始，之前的温养时间丢失

**原因**：
- 只使用 `nourish_start_time` 字段记录开始时间
- 停止温养时直接将该字段设为 null，没有保存已累积的时间

**解决方案**：
- 添加数据库字段 `nourish_accumulated_seconds`（累积秒数）
- 温养系统改为基于累积时间计算等级和进度
- 停止温养时会保存已累积的时间
- 重新开始温养时，基于累积时间继续计算

## 修改的文件

### 1. 数据库迁移
**文件**: `src/supabase/add_nourish_accumulated_time.sql`
- 添加 `nourish_accumulated_seconds` 字段，用于保存累积的温养时间

### 2. Store 层修改
**文件**: `src/stores/fabao.js`

#### 修改的函数：
- **`calculateNourishBonus`**：改为基于累积时间计算等级和加成
- **`startNourish`**：不再重置时间，只是记录新的开始时间
- **`stopNourish`**（新增）：保存累积时间并更新等级

#### 新增的函数：
- **`updateNourishLevel`**：自动检查并更新温养等级到数据库

### 3. View 层修改
**文件**: `src/views/DantianView.vue`

#### 修改的函数：
- **`nourishProgress`**：改为基于累积时间计算进度百分比
- **`formatNourishTime`**：改为基于累积时间计算剩余时间，并在可升级时触发自动升级
- **`stopNourish`**：改为调用 store 方法，显示累积时间和等级信息

## 温养等级计算逻辑

### 等级所需累积时间
- 1 级：累计 1 天（24 小时）
- 2 级：累计 2 天（48 小时）
- 3 级：累计 3 天（72 小时）
- ...
- 10 级：累计 10 天（240 小时）

### 示例
假设一个法宝的温养过程如下：
1. 第 1 次温养 20 小时后停止 → 累积 20 小时，等级 0
2. 第 2 次温养 10 小时后停止 → 累积 30 小时，等级 1（达到 24 小时）
3. 第 3 次温养 30 小时后停止 → 累积 60 小时，等级 2（达到 48 小时）

可以看到，温养时间是累积的，不会因为停止而丢失。

## 数据库迁移步骤

1. 运行 SQL 脚本添加新字段：
```sql
ALTER TABLE public.fabao_instances 
ADD COLUMN IF NOT EXISTS nourish_accumulated_seconds INT DEFAULT 0;
```

2. 如果需要保留现有温养数据，可以运行以下脚本将现有的温养时间转换为累积时间：
```sql
UPDATE public.fabao_instances 
SET nourish_accumulated_seconds = EXTRACT(EPOCH FROM (NOW() - nourish_start_time))::INT
WHERE nourish_start_time IS NOT NULL;
```

## 测试建议

1. **测试累积时间**：
   - 开始温养 → 等待一段时间 → 停止温养
   - 再次开始温养 → 确认时间是累积的

2. **测试自动升级**：
   - 修改数据库中的 `nourish_accumulated_seconds` 为 `24 * 3600`（1天）
   - 刷新页面，确认等级自动变为 1

3. **测试进度显示**：
   - 确认进度条正确显示当前等级的进度
   - 确认剩余时间正确显示到下一级的时间

## 注意事项

- 温养等级最高为 10 级
- 每级的加成为：生命 +5%，攻击 +3%，防御 +2%
- 法宝必须在丹田中且未损毁才能开始温养
- 停止温养会保存进度，可以随时重新开始
