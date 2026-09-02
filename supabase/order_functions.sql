-- ONECLICK secure order creation
-- Run after schema.sql and admin_security.sql.
-- Orders are created from server-side database prices, never browser prices.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_shipping_fee integer := 0;
  v_total integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_line_total integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_customer_name), '') is null then
    raise exception 'Customer name is required';
  end if;

  if nullif(trim(p_customer_email), '') is null then
    raise exception 'Customer email is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart cannot be empty';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if nullif(trim(v_item ->> 'slug'), '') is null then
      raise exception 'Every cart item needs a product slug';
    end if;

    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Invalid product quantity';
    end if;

    select * into v_product
    from public.products
    where slug = v_item ->> 'slug'
      and in_stock = true
      and stock_quantity >= v_quantity
    for update;

    if not found then
      raise exception 'Product is unavailable or out of stock: %', v_item ->> 'slug';
    end if;

    v_line_total := v_product.price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_shipping_fee := case when v_subtotal >= 1999 then 0 else 99 end;
  v_total := v_subtotal + v_shipping_fee;
  v_order_number := 'OC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    order_number, user_id, status, payment_status,
    subtotal, shipping_fee, total,
    customer_name, customer_email, customer_phone, shipping_address
  ) values (
    v_order_number, auth.uid(), 'pending', 'pending',
    v_subtotal, v_shipping_fee, v_total,
    trim(p_customer_name), lower(trim(p_customer_email)), nullif(trim(p_customer_phone), ''), coalesce(p_shipping_address, '{}'::jsonb)
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;

    select * into v_product
    from public.products
    where slug = v_item ->> 'slug'
    for update;

    v_line_total := v_product.price * v_quantity;

    insert into public.order_items (
      order_id, product_id, product_name, product_image, unit_price, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.image, v_product.price, v_quantity, v_line_total
    );

    update public.products
    set stock_quantity = stock_quantity - v_quantity,
        in_stock = (stock_quantity - v_quantity) > 0,
        updated_at = now()
    where id = v_product.id;
  end loop;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total,
    'status', 'pending',
    'payment_status', 'pending'
  );
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb, jsonb) from public;
grant execute on function public.create_order(text, text, text, jsonb, jsonb) to authenticated;
