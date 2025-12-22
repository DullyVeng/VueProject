-- Create Character Quests Table
-- 用户任务表：存储角色接取的任务及其进度
create table if not exists public.character_quests (
  id uuid default gen_random_uuid() primary key,
  character_id uuid references public.characters not null,
  quest_id text not null, -- 对应 JS 中的任务静态 ID
  progress int default 0, -- 当前进度 (如杀怪数量)
  status text default 'active' check (status in ('active', 'completed', 'finished')), -- active: 进行中, completed: 达成条件待领奖, finished: 已领奖结束
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.character_quests enable row level security;

-- Policies
create policy "Users can view their own quests"
  on public.character_quests for select
  using (
    exists (
      select 1 from public.characters
      where characters.id = character_quests.character_id
      and characters.user_id = auth.uid()
    )
  );

create policy "Users can insert their own quests"
  on public.character_quests for insert
  with check (
    exists (
      select 1 from public.characters
      where characters.id = character_quests.character_id
      and characters.user_id = auth.uid()
    )
  );

create policy "Users can update their own quests"
  on public.character_quests for update
  using (
    exists (
      select 1 from public.characters
      where characters.id = character_quests.character_id
      and characters.user_id = auth.uid()
    )
  );

-- Comments
comment on table public.character_quests is '角色任务表：追踪任务进度';
comment on column public.character_quests.quest_id is '静态任务 ID';
comment on column public.character_quests.progress is '当前进度数值';
comment on column public.character_quests.status is '任务状态 (active/completed/finished)';
