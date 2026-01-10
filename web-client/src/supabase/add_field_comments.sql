-- 为数据库所有字段添加完整的中文注释
-- 创建时间: 2026-01-10

-- ============================================
-- characters 表注释
-- ============================================
COMMENT ON TABLE characters IS '角色表：存储玩家角色的基本信息和属性';

COMMENT ON COLUMN characters.id IS '角色唯一标识符';
COMMENT ON COLUMN characters.user_id IS '关联的用户ID（唯一）';
COMMENT ON COLUMN characters.name IS '角色名称';
COMMENT ON COLUMN characters.gender IS '角色性别（male/female）';
COMMENT ON COLUMN characters.level IS '角色等级';
COMMENT ON COLUMN characters.exp IS '当前经验值';
COMMENT ON COLUMN characters.hp IS '当前生命值';
COMMENT ON COLUMN characters.max_hp IS '最大生命值';
COMMENT ON COLUMN characters.mp IS '当前法力值';
COMMENT ON COLUMN characters.max_mp IS '最大法力值';
COMMENT ON COLUMN characters.attack IS '攻击力';
COMMENT ON COLUMN characters.defense IS '防御力';
COMMENT ON COLUMN characters.created_at IS '角色创建时间';
-- silver, spirit_power, divine_sense 已有注释

-- ============================================
-- fabao_instances 表注释  
-- ============================================
COMMENT ON TABLE fabao_instances IS '法宝实例表：存储玩家拥有的法宝数据';

-- 已有完整注释的字段：id, character_id, fabao_id, realm, rarity, nourish_level, enhance_level, current_shape, is_damaged, dantian_position

-- 需要添加注释的字段：
COMMENT ON COLUMN fabao_instances.hp IS '法宝当前生命值';
COMMENT ON COLUMN fabao_instances.max_hp IS '法宝最大生命值';
COMMENT ON COLUMN fabao_instances.attack IS '法宝攻击力';
COMMENT ON COLUMN fabao_instances.defense IS '法宝防御力';
COMMENT ON COLUMN fabao_instances.nourish_start_time IS '开始温养的时间戳';
COMMENT ON COLUMN fabao_instances.max_enhance_level IS '该实例的最大强化等级上限';
COMMENT ON COLUMN fabao_instances.original_grid_count IS '原始占用格子数量';
COMMENT ON COLUMN fabao_instances.current_grid_count IS '当前占用格子数量（可能因强化而改变）';
COMMENT ON COLUMN fabao_instances.is_in_dantian IS '是否放置在丹田中';
COMMENT ON COLUMN fabao_instances.is_summoned IS '是否已召唤到战场';
COMMENT ON COLUMN fabao_instances.created_at IS '法宝实例创建时间';
COMMENT ON COLUMN fabao_instances.updated_at IS '法宝实例最后更新时间';
