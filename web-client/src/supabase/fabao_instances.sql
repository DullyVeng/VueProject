-- 法宝实例表
-- 用于存储玩家拥有的法宝实例数据
CREATE TABLE IF NOT EXISTS public.fabao_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES public.characters NOT NULL,
  fabao_id TEXT NOT NULL,  -- 对应静态配置的法宝ID
  
  -- 法宝品级
  realm TEXT NOT NULL DEFAULT '灵器',  -- 法宝境界（凡器/灵器/真器/法器/天器/圣器/仙器/极道帝兵）
  rarity TEXT NOT NULL DEFAULT 'common',  -- 稀有度（common/fine/rare/epic/legendary/mythic）
  
  -- 当前属性
  hp INT NOT NULL,
  max_hp INT NOT NULL,
  attack INT NOT NULL,
  defense INT NOT NULL,
  
  -- 温养数据
  nourish_level INT DEFAULT 0 CHECK (nourish_level >= 0 AND nourish_level <= 10),
  nourish_start_time TIMESTAMPTZ,  -- 开始温养的时间戳
  
  -- 强化数据
  enhance_level INT DEFAULT 0,
  max_enhance_level INT DEFAULT 5,  -- 最大可强化次数（由境界决定）
  current_shape JSONB,  -- 存储当前形状（强化后会变化）
  original_grid_count INT DEFAULT 4,  -- 初始格子数量
  current_grid_count INT DEFAULT 4,  -- 当前格子数量
  
  -- 状态
  is_damaged BOOLEAN DEFAULT FALSE,  -- 是否损毁（损毁后需修复才能召唤）
  is_in_dantian BOOLEAN DEFAULT TRUE,  -- 是否在丹田中
  is_summoned BOOLEAN DEFAULT FALSE,  -- 是否已召唤到战场
  
  -- 丹田位置
  dantian_position JSONB,  -- {x: 0, y: 0, rotation: 0}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_fabao_character ON fabao_instances(character_id);
CREATE INDEX idx_fabao_dantian ON fabao_instances(character_id, is_in_dantian) WHERE is_in_dantian = TRUE;

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_fabao_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fabao_instances_updated_at
  BEFORE UPDATE ON fabao_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_fabao_instances_updated_at();

-- RLS策略
ALTER TABLE public.fabao_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的法宝"
  ON public.fabao_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = fabao_instances.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可插入自己的法宝"
  ON public.fabao_instances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = fabao_instances.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可更新自己的法宝"
  ON public.fabao_instances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = fabao_instances.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可删除自己的法宝"
  ON public.fabao_instances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = fabao_instances.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- 注释
COMMENT ON TABLE public.fabao_instances IS '法宝实例表：存储玩家拥有的法宝数据';
COMMENT ON COLUMN public.fabao_instances.id IS '法宝实例唯一ID';
COMMENT ON COLUMN public.fabao_instances.character_id IS '所属角色ID';
COMMENT ON COLUMN public.fabao_instances.fabao_id IS '法宝配置ID（对应静态数据）';
COMMENT ON COLUMN public.fabao_instances.realm IS '法宝境界';
COMMENT ON COLUMN public.fabao_instances.rarity IS '法宝稀有度';
COMMENT ON COLUMN public.fabao_instances.nourish_level IS '温养等级（0-10）';
COMMENT ON COLUMN public.fabao_instances.enhance_level IS '当前强化等级';
COMMENT ON COLUMN public.fabao_instances.current_shape IS '当前形状（JSONB格式的二维数组）';
COMMENT ON COLUMN public.fabao_instances.is_damaged IS '是否损毁（损毁后需修复）';
COMMENT ON COLUMN public.fabao_instances.dantian_position IS '在丹田中的位置和旋转角度';
