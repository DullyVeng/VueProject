-- 添加唯一约束，防止重复接取任务
-- 注意：这个约束只对非重复任务有效
-- 对于可重复的日常任务，需要在应用层处理

-- 首先删除可能存在的重复数据
-- 保留每个角色每个任务最早的记录
DELETE FROM public.player_quests
WHERE id NOT IN (
    SELECT DISTINCT ON (character_id, quest_id) id
    FROM public.player_quests
    ORDER BY character_id, quest_id, created_at
);

-- 添加唯一约束
ALTER TABLE public.player_quests
ADD CONSTRAINT unique_character_quest 
UNIQUE (character_id, quest_id);

-- 添加注释
COMMENT ON CONSTRAINT unique_character_quest ON public.player_quests 
IS '确保同一角色不能重复接取同一任务（可重复任务需在应用层处理）';
