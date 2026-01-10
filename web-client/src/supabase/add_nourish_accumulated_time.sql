-- 添加温养累积时间字段
-- 用于记录法宝温养的总累积秒数，即使停止温养后也会保留
ALTER TABLE public.fabao_instances 
ADD COLUMN IF NOT EXISTS nourish_accumulated_seconds INT DEFAULT 0;

COMMENT ON COLUMN public.fabao_instances.nourish_accumulated_seconds IS '温养累积秒数（包含之前停止的时间）';


