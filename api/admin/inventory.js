const { createClient } = require('@supabase/supabase-js');

function json(res, status, body) {
  return res.status(status).json(body);
}

async function getAdmin(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !anon || !service) throw new Error('Inventory service is not configured.');
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return { forbidden: true };
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (profile?.role !== 'admin') return { forbidden: true };
  return { db };
}

module.exports = async function handler(req, res) {
  if (!['GET', 'PATCH'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
  try {
    const result = await getAdmin(req);
    if (result.forbidden) return json(res, 403, { error: 'Admin access required.' });
    const db = result.db;

    if (req.method === 'GET') {
      const { data, error } = await db
        .from('products')
        .select('id,slug,name,price,in_stock,stock_quantity,updated_at')
        .order('name', { ascending: true });
      if (error) throw error;
      return json(res, 200, { products: data || [] });
    }

    const { id, stockQuantity } = req.body || {};
    const quantity = Number(stockQuantity);
    if (!id) return json(res, 400, { error: 'Product ID is required.' });
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1000000) {
      return json(res, 400, { error: 'Stock quantity must be a whole number between 0 and 1,000,000.' });
    }

    const { data, error } = await db
      .from('products')
      .update({ stock_quantity: quantity, in_stock: quantity > 0, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,slug,name,price,in_stock,stock_quantity,updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return json(res, 404, { error: 'Product not found.' });
    return json(res, 200, { product: data });
  } catch (error) {
    console.error('Admin inventory error:', error);
    return json(res, 400, { error: error?.message || 'Inventory request failed.' });
  }
};
