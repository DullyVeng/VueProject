-- 宗门数据表结构
-- 创建宗门主表和建筑表，用于存储宗门状态和建筑信息

-- ========== 宗门主表 ==========
CREATE TABLE IF NOT EXISTS public.sects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES public.characters(id) NOT NULL,
  sect_name TEXT NOT NULL DEFAULT '无名宗',
  sect_level_id TEXT NOT NULL DEFAULT 'chuangcao',
  sect_level INT NOT NULL DEFAULT 1,
  last_maintenance_check BIGINT NOT NULL DEFAULT 0,
  warehouse_level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 材料数据（使用JSONB存储）
  materials JSONB NOT NULL DEFAULT '{
    "wood": 100,
    "stone": 50,
    "iron": 20,
    "jade": 0,
    "formationFlag": 0,
    "spiritStone": 50
  }'::JSONB,
  
  -- 已解锁图纸（数组）
  unlocked_blueprints TEXT[] NOT NULL DEFAULT '{}',
  
  -- 确保每个角色只有一个宗门
  CONSTRAINT unique_character_sect UNIQUE (character_id)
);

-- 表注释
COMMENT ON TABLE public.sects IS '宗门主表：存储宗门基本信息、等级和材料数据';
COMMENT ON COLUMN public.sects.id IS '宗门唯一标识符';
COMMENT ON COLUMN public.sects.character_id IS '关联的角色ID';
COMMENT ON COLUMN public.sects.sect_name IS '宗门名称';
COMMENT ON COLUMN public.sects.sect_level_id IS '宗门等级ID（如：chuangcao）';
COMMENT ON COLUMN public.sects.sect_level IS '宗门数值等级（1-12）';
COMMENT ON COLUMN public.sects.last_maintenance_check IS '上次维护检查时间戳（毫秒）';
COMMENT ON COLUMN public.sects.warehouse_level IS '仓库等级（1-5）';
COMMENT ON COLUMN public.sects.materials IS '材料仓库数据（JSONB格式）';
COMMENT ON COLUMN public.sects.unlocked_blueprints IS '已解锁的建筑图纸ID列表';

-- ========== 宗门建筑表 ==========
CREATE TABLE IF NOT EXISTS public.sect_buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sect_id UUID REFERENCES public.sects(id) ON DELETE CASCADE NOT NULL,
  plot_id TEXT NOT NULL,
  building_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  build_start_time BIGINT,
  build_end_time BIGINT,
  last_collect_time BIGINT,
  last_maintenance_time BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 确保每个地块只有一个建筑
  CONSTRAINT unique_sect_plot UNIQUE (sect_id, plot_id),
  
  -- 状态约束
  CONSTRAINT valid_building_status CHECK (status IN ('building', 'active', 'suspended'))
);

-- 表注释
COMMENT ON TABLE public.sect_buildings IS '宗门建筑表：存储宗门内建筑实例数据';
COMMENT ON COLUMN public.sect_buildings.id IS '建筑实例唯一标识符';
COMMENT ON COLUMN public.sect_buildings.sect_id IS '所属宗门ID';
COMMENT ON COLUMN public.sect_buildings.plot_id IS '地块ID';
COMMENT ON COLUMN public.sect_buildings.building_id IS '建筑配置ID';
COMMENT ON COLUMN public.sect_buildings.level IS '建筑等级';
COMMENT ON COLUMN public.sect_buildings.status IS '建筑状态（building/active/suspended）';
COMMENT ON COLUMN public.sect_buildings.build_start_time IS '开始建造时间戳（毫秒）';
COMMENT ON COLUMN public.sect_buildings.build_end_time IS '完成建造时间戳（毫秒）';
COMMENT ON COLUMN public.sect_buildings.last_collect_time IS '上次收集产出时间戳（毫秒）';
COMMENT ON COLUMN public.sect_buildings.last_maintenance_time IS '上次维护时间戳（毫秒）';

-- ========== 行级安全策略 ==========
-- 启用行级安全
ALTER TABLE public.sects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sect_buildings ENABLE ROW LEVEL SECURITY;

-- 宗门表策略（通过characters表关联user_id）
CREATE POLICY "Users can insert their own sect"
  ON public.sects FOR INSERT
  WITH CHECK (
    character_id IN (
      SELECT id FROM public.characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own sect"
  ON public.sects FOR SELECT
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sect"
  ON public.sects FOR UPDATE
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE user_id = auth.uid()
    )
  );

-- 建筑表策略（通过sects和characters表关联）
CREATE POLICY "Users can manage their sect buildings"
  ON public.sect_buildings FOR ALL
  USING (
    sect_id IN (
      SELECT s.id FROM public.sects s
      JOIN public.characters c ON s.character_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- ========== 索引优化 ==========
-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_sects_character_id ON public.sects(character_id);
CREATE INDEX IF NOT EXISTS idx_sect_buildings_sect_id ON public.sect_buildings(sect_id);
CREATE INDEX IF NOT EXISTS idx_sect_buildings_status ON public.sect_buildings(status);
