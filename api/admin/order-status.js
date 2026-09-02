const { createClient } = require('@supabase/supabase-js');

const allowedStatuses = new Set(['pending','paid','processing','shipped','delivered','cancelled','refunded']);

function getClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error('Supabase production environment variables are missing.');
  return {
    authClient: createClient(url, anonKey, { auth: { persistSession: false } }),
    adminClient: createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') { res.setHeader('Allow','PATCH'); return res.status(405).json({ error:'Method not allowed' }); }
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) return res.status(401).json({ error:'Missing authorization token' });
    const { authClient, adminClient } = getClients();
    const { data:{ user }, error:userError } = await authClient.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error:'Invalid or expired session' });
    const { data:profile, error:profileError } = await adminClient.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') return res.status(403).json({ error:'Admin access required' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const orderNumber = String(body.orderNumber || '').trim();
    const status = String(body.status || '').trim().toLowerCase();
    const trackingNumber = body.trackingNumber == null ? undefined : String(body.trackingNumber).trim();
    if (!orderNumber || !allowedStatuses.has(status)) return res.status(400).json({ error:'Valid orderNumber and status are required' });

    const { data:before, error:beforeError } = await adminClient.from('orders').select('id,status,payment_status').eq('order_number',orderNumber).maybeSingle();
    if (beforeError) return res.status(500).json({ error:'Could not load order' });
    if (!before) return res.status(404).json({ error:'Order not found' });

    const update = { status };
    if (trackingNumber !== undefined) update.tracking_number = trackingNumber || null;
    if (status === 'paid') update.payment_status = 'paid';
    if (status === 'refunded') update.payment_status = 'refunded';

    const { data:order, error } = await adminClient.from('orders').update(update).eq('id',before.id).select('order_number,status,payment_status,tracking_number,updated_at').single();
    if (error) { console.error('Admin order update failed:',error); return res.status(500).json({ error:'Could not update order' }); }

    let stockReleased = false;
    if (status === 'cancelled' && before.status !== 'cancelled') {
      const { data:released, error:releaseError} = await adminClient.rpc('release_order_stock',{ p_order_id: before.id });
      if (releaseError) {
        console.error('Stock release failed:',releaseError);
        return res.status(500).json({ error:'Order cancelled, but inventory restoration failed. Run inventory_functions.sql in Supabase and retry the stock release.' });
      }
      stockReleased = Boolean(released);
    }
    return res.status(200).json({ order, stockReleased });
  } catch (error) { console.error('Admin order-status error:',error); return res.status(500).json({ error:'Internal server error' }); }
};
