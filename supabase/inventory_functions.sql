-- ONECLICK inventory release helpers
-- Orders reserve stock when they are created. Release it exactly once when
-- an order is cancelled or its payment fails.

alter table public.orders
  add column if not exists stock_released_at timestamptz;

create or replace function public.release_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_released boolean;
begin
  update public.orders
  set stock_released_at = now(), updated_at = now()
  where id = p_order_id
    and stock_released_at is null
  returning true into v_released;

  if not coalesce(v_released, false) then
    return false;
  end if;

  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id
      and product_id is not null
  loop
    update public.products
    set stock_quantity = stock_quantity + v_item.quantity,
        in_stock = true,
        updated_at = now()
    where id = v_item.product_id;
  end loop;

  return true;
end;
$$;

revoke all on function public.release_order_stock(uuid) from public;
grant execute on function public.release_order_stock(uuid) to service_role;
