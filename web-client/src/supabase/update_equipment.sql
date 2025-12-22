-- Add is_equipped column to inventory table
-- 为背包表添加"是否装备"字段
alter table public.inventory 
add column if not exists is_equipped boolean default false;

comment on column public.inventory.is_equipped is '是否已穿戴/装备';
