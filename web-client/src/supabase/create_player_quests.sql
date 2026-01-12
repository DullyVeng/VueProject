-- 创建玩家任务表

CREATE TABLE IF NOT EXISTS public.player_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    quest_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    objectives JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_player_quests_character 
ON public.player_quests(character_id);

CREATE INDEX IF NOT EXISTS idx_player_quests_status 
ON public.player_quests(status);

-- 添加注释
COMMENT ON TABLE public.player_quests IS '玩家任务表';
COMMENT ON COLUMN public.player_quests.quest_id IS '任务ID';
COMMENT ON COLUMN public.player_quests.status IS '任务状态: available/active/completed/finished';
COMMENT ON COLUMN public.player_quests.objectives IS '任务目标进度（JSON数组）';
