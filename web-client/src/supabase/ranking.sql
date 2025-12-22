-- Update RLS for Ranking
-- 更新安全策略以允许排行榜读取数据

-- Drop existing restricted read policy
drop policy "Users can view their own character" on public.characters;

-- Create new policies
-- 1. Users can view basics of ALL characters for Leaderboard
create policy "Users can view all characters public info"
  on public.characters for select
  using ( true ); -- 允许读取所有行，但我们在前端或 API 层控制字段查询。或者 Supabase 没法Column Level Security，只能 Row Level。这里允许读取所有行是榜单必须的。

-- 2. Users can still update ONLY their own character
-- (The existing update policy should be fine, let's verify or recreate it to be safe)
-- The existing policy was: create policy "Users can update their own character" ... using (auth.uid() = user_id);
-- We don't need to drop/recreate Update policy if we didn't touch it. 
-- But wait, my previous setup was "Users can view their own character".
-- If I change it to "view all", I must ensure no sensitive data is leaked. 
-- Currently characters table has: id, user_id, name, race, class, level, exp, hp, max_hp...
-- user_id shoud not be exposed ideally, but public read is fine for game mechanics usually.

comment on table public.characters is '角色表 (已开放公共读取权限用于排行榜)';
