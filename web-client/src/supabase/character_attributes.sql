-- 角色属性扩展
-- 为现有的characters表添加P0加点系统所需的字段

-- 添加五大属性字段
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS spirit_power INT DEFAULT 10,  -- 灵力
ADD COLUMN IF NOT EXISTS divine_sense INT DEFAULT 10,  -- 神识
ADD COLUMN IF NOT EXISTS body_constitution INT DEFAULT 10,  -- 体魄
ADD COLUMN IF NOT EXISTS comprehension INT DEFAULT 5,  -- 悟性
ADD COLUMN IF NOT EXISTS fortune INT DEFAULT 5;  -- 气运

-- 添加属性点相关字段
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS available_attribute_points INT DEFAULT 0;  -- 可用属性点

-- 添加丹田相关字段
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS dantian_width INT DEFAULT 5,  -- 丹田宽度
ADD COLUMN IF NOT EXISTS dantian_height INT DEFAULT 5;  -- 丹田高度

-- 添加货币字段
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS silver INT DEFAULT 1000;  -- 灵石（银两）

-- 添加境界字段（为P1功能预留）
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS realm TEXT DEFAULT 'lianqi',  -- 境界（炼气/筑基/金丹等）
ADD COLUMN IF NOT EXISTS realm_level INT DEFAULT 1;  -- 境界等级

-- 添加行动点字段（战斗系统使用）
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS current_action_points INT DEFAULT 10,  -- 当前行动点
ADD COLUMN IF NOT EXISTS max_action_points INT DEFAULT 10;  -- 最大行动点

-- 添加约束
ALTER TABLE public.characters 
ADD CONSTRAINT check_spirit_power CHECK (spirit_power >= 0),
ADD CONSTRAINT check_divine_sense CHECK (divine_sense >= 0),
ADD CONSTRAINT check_body_constitution CHECK (body_constitution >= 0),
ADD CONSTRAINT check_comprehension CHECK (comprehension >= 0),
ADD CONSTRAINT check_fortune CHECK (fortune >= 0),
ADD CONSTRAINT check_available_points CHECK (available_attribute_points >= 0),
ADD CONSTRAINT check_dantian_size CHECK (dantian_width > 0 AND dantian_height > 0),
ADD CONSTRAINT check_silver CHECK (silver >= 0);

-- 为现有角色初始化新字段（数据迁移）
UPDATE public.characters
SET 
  spirit_power = COALESCE(spirit_power, 10),
  divine_sense = COALESCE(divine_sense, 10),
  body_constitution = COALESCE(body_constitution, 10),
  comprehension = COALESCE(comprehension, 5),
  fortune = COALESCE(fortune, 5),
  available_attribute_points = COALESCE(available_attribute_points, level * 3),  -- 补发历史属性点
  dantian_width = COALESCE(dantian_width, 5),
  dantian_height = COALESCE(dantian_height, 5),
  silver = COALESCE(silver, 1000),
  realm = COALESCE(realm, 'lianqi'),
  realm_level = COALESCE(realm_level, 1),
  current_action_points = COALESCE(current_action_points, 10),
  max_action_points = COALESCE(max_action_points, 10)
WHERE spirit_power IS NULL OR divine_sense IS NULL;

-- 创建视图：计算衍生属性
CREATE OR REPLACE VIEW character_derived_stats AS
SELECT 
  id,
  user_id,
  name,
  level,
  
  -- 五大属性
  spirit_power,
  divine_sense,
  body_constitution,
  comprehension,
  fortune,
  
  -- 衍生属性计算
  (25 + spirit_power) AS dantian_capacity,  -- 丹田容量
  (10 + FLOOR(spirit_power / 5)) AS calculated_max_action_points,  -- 行动点上限
  (3 + level * 0.5 + spirit_power * 0.1) AS action_points_regen,  -- 行动点恢复速度
  (max_hp + body_constitution * 10) AS total_hp,  -- 总生命值（含体魄加成）
  (defense + body_constitution) AS total_defense,  -- 总防御（含体魄加成）
  (1.0 + spirit_power * 0.02) AS spell_power_multiplier,  -- 法术威力倍率
  (1.0 + body_constitution * 0.05) AS fabao_durability_bonus,  -- 法宝耐久度加成
  
  -- 原始字段
  hp,
  max_hp,
  mp,
  max_mp,
  attack,
  defense,
  exp,
  silver,
  available_attribute_points,
  dantian_width,
  dantian_height,
  realm,
  realm_level
FROM public.characters;

-- 注释
COMMENT ON COLUMN public.characters.spirit_power IS '灵力：影响丹田容量、行动点、法术威力';
COMMENT ON COLUMN public.characters.divine_sense IS '神识：影响识海容量、功法数量上限';
COMMENT ON COLUMN public.characters.body_constitution IS '体魄：影响生命值、防御力、法宝耐久';
COMMENT ON COLUMN public.characters.comprehension IS '悟性：影响功法升级速度、羁绊效果';
COMMENT ON COLUMN public.characters.fortune IS '气运：影响强化成功率、掉落品质';
COMMENT ON COLUMN public.characters.available_attribute_points IS '可用属性点';
COMMENT ON COLUMN public.characters.dantian_width IS '丹田宽度（格子）';
COMMENT ON COLUMN public.characters.dantian_height IS '丹田高度（格子）';
COMMENT ON COLUMN public.characters.silver IS '灵石货币';
COMMENT ON COLUMN public.characters.realm IS '修炼境界';
COMMENT ON COLUMN public.characters.current_action_points IS '当前行动点';
COMMENT ON COLUMN public.characters.max_action_points IS '最大行动点';
