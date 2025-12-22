-- Create Characters Table
create table if not exists public.characters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  gender text check (gender in ('male', 'female')),
  level int default 1,
  exp int default 0,
  hp int default 100,
  max_hp int default 100,
  mp int default 50,
  max_mp int default 50,
  attack int default 10,
  defense int default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one character per user for now
  constraint unique_user_character unique (user_id)
);

-- Enable RLS
alter table public.characters enable row level security;

-- Policies
create policy "Users can insert their own character"
  on public.characters for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own character"
  on public.characters for select
  using (auth.uid() = user_id);

create policy "Users can update their own character"
  on public.characters for update
  using (auth.uid() = user_id);
