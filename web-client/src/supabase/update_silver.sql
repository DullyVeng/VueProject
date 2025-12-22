-- Add silver column to characters table
-- 为角色表添加白银字段
alter table public.characters 
add column if not exists silver int default 0;

comment on column public.characters.silver is '持有银两数量';
