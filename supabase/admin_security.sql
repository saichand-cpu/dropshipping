-- ONECLICK admin security layer
-- Run after schema.sql in the Supabase SQL Editor.
-- This keeps admin authorization in the database instead of trusting the browser.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admins can manage the catalogue and order operations.
create policy "admins manage products"
  on public.products
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins read all orders"
  on public.orders
  for select
  using (public.is_admin());

create policy "admins update orders"
  on public.orders
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins read all order items"
  on public.order_items
  for select
  using (public.is_admin());

create policy "admins manage coupons"
  on public.coupons
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage reviews"
  on public.reviews
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins read profiles"
  on public.profiles
  for select
  using (public.is_admin() or auth.uid() = id);

-- Customers must never be able to promote themselves to admin.
create or replace function public.prevent_customer_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only an administrator can change account roles';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_customer_role_change on public.profiles;
create trigger prevent_customer_role_change
before update on public.profiles
for each row execute function public.prevent_customer_role_change();

-- The profile trigger above protects role changes even if a customer has
-- permission to update their own profile fields.
