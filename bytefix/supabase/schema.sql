-- Tabelas e políticas de acesso usadas pelas APIs do site.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null,
  user_email text not null,
  order_type text not null check (order_type in ('Produto', 'Serviço')),
  status text not null default 'Aguardando contato'
    check (status in ('Aguardando contato', 'Concluído')),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 600),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.feedbacks enable row level security;

drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and user_email = (select auth.jwt() ->> 'email')
    and status = 'Aguardando contato'
  );

drop policy if exists "Anyone can read published feedback" on public.feedbacks;
create policy "Anyone can read published feedback"
  on public.feedbacks for select to anon, authenticated
  using (true);

drop policy if exists "Customers can review their completed services" on public.feedbacks;
create policy "Customers can review their completed services"
  on public.feedbacks for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.orders as order_row
      where order_row.id = order_id
        and order_row.user_id = (select auth.uid())
        and order_row.status = 'Concluído'
        and exists (
          select 1
          from jsonb_array_elements(order_row.items) as item
          where item ->> 'tipo' = 'servico'
        )
    )
  );

revoke all on public.orders, public.feedbacks from anon, authenticated;
grant select on public.orders to authenticated;
grant insert (user_id, user_name, user_email, order_type, status, items) on public.orders to authenticated;
grant select (id, order_id, user_name, rating, comment, created_at) on public.feedbacks to anon, authenticated;
grant insert (order_id, user_id, user_name, rating, comment) on public.feedbacks to authenticated;
grant all on public.orders, public.feedbacks to service_role;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view customer avatars" on storage.objects;
create policy "Anyone can view customer avatars"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Customers can upload their own avatar" on storage.objects;
create policy "Customers can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text);

drop policy if exists "Customers can update their own avatar" on storage.objects;
create policy "Customers can update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text);
