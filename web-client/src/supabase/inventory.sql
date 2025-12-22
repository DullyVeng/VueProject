-- Create Inventory Table
-- 创建背包表：用于存储玩家拥有的物品及其数量
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key, -- 主键 ID
  character_id uuid references public.characters not null, -- 关联的角色 ID
  item_id text not null, -- 物品 ID (对应前端静态配置的 ID)
  quantity int default 1 check (quantity >= 0), -- 物品数量 (必须大于等于0)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null, -- 创建时间
  
  -- Ensure unique item entry per character
  -- 约束：每个角色每种物品只能有一条记录
  constraint unique_character_item unique (character_id, item_id)
);

-- Enable RLS
-- 启用行级安全策略
alter table public.inventory enable row level security;

-- Policies
-- 策略：用户只能查看属于自己角色的物品
create policy "Users can view their own inventory"
  on public.inventory for select
  using (
    exists (
      select 1 from public.characters
      where characters.id = inventory.character_id
      and characters.user_id = auth.uid()
    )
  );

-- 策略：用户只能更新属于自己角色的物品
create policy "Users can update their own inventory"
  on public.inventory for update
  using (
    exists (
      select 1 from public.characters
      where characters.id = inventory.character_id
      and characters.user_id = auth.uid()
    )
  );

-- 策略：用户只能向自己角色的背包插入物品
create policy "Users can insert into their own inventory"
  on public.inventory for insert
  with check (
    exists (
      select 1 from public.characters
      where characters.id = inventory.character_id
      and characters.user_id = auth.uid()
    )
  );

-- Comments
comment on table public.inventory is '背包表：存储玩家角色拥有的物品信息';
comment on column public.inventory.id is '唯一记录 ID';
comment on column public.inventory.character_id is '所属角色 ID';
comment on column public.inventory.item_id is '物品代码 (如 potion_hp_small)';
comment on column public.inventory.quantity is '持有数量';
