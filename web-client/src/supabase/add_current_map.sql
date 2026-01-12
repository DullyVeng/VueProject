-- 添加地图位置字段到characters表

-- 添加current_map_id字段
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS current_map_id VARCHAR(50) DEFAULT 'town';

-- 添加注释
COMMENT ON COLUMN public.characters.current_map_id IS '玩家当前所在的地图ID';

-- 为现有角色设置默认位置
UPDATE public.characters 
SET current_map_id = 'town' 
WHERE current_map_id IS NULL;
