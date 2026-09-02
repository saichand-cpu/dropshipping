-- ONECLICK inventory hardening
-- Safe to run against an existing ONECLICK Supabase database.

alter table public.products
  add column if not exists stock_quantity integer not null default 0;

alter table public.products
  add constraint products_stock_quantity_nonnegative
  check (stock_quantity >= 0) not valid;

alter table public.products
  validate constraint products_stock_quantity_nonnegative;

create index if not exists products_stock_quantity_idx
  on public.products(stock_quantity);

-- Keep the legacy in_stock flag consistent with quantity.
update public.products
set in_stock = stock_quantity > 0
where in_stock is distinct from (stock_quantity > 0);
