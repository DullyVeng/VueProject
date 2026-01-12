-- 法宝法力值系统
-- 为法宝实例表添加法力值字段

-- 添加法力值相关字段
ALTER TABLE public.fabao_instances
ADD COLUMN IF NOT EXISTS mp INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_mp INT DEFAULT 100;

-- 添加字段注释
COMMENT ON COLUMN public.fabao_instances.mp IS '当前法力值';
COMMENT ON COLUMN public.fabao_instances.max_mp IS '最大法力值';

-- 为所有现有法宝初始化法力值
UPDATE public.fabao_instances 
SET mp = 100, max_mp = 100 
WHERE mp IS NULL OR max_mp IS NULL;
