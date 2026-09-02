const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

function json(res, status, body) { return res.status(status).json(body); }

async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!token || !url || !anon || !service || !keyId || !keySecret) return json(res, 500, { error: 'Refund service is not configured.' });
  try {
    const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized.' });
    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== 'admin') return json(res, 403, { error: 'Admin access required.' });
    const { orderNumber, amount, reason } = req.body || {};
    if (!orderNumber) return json(res, 400, { error: 'Order number is required.' });
    const { data: order, error } = await db.from('orders').select('order_number,total,payment_id,payment_provider,payment_status,status').eq('order_number', orderNumber).maybeSingle();
    if (error) throw error;
    if (!order) return json(res, 404, { error: 'Order not found.' });
    if (order.payment_provider !== 'razorpay' || !order.payment_id) return json(res, 400, { error: 'This order does not have a Razorpay payment.' });
    if (order.payment_status !== 'paid') return json(res, 400, { error: 'Only paid orders can be refunded.' });
    const refundAmount = amount === undefined || amount === null || amount === '' ? Number(order.total) : Number(amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > Number(order.total)) return json(res, 400, { error: 'Invalid refund amount.' });
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const refund = await razorpay.payments.refund(order.payment_id, { amount: Math.round(refundAmount * 100), receipt: `refund-${order.order_number}-${Date.now()}`, notes: { order_number: String(order.order_number), reason: String(reason || 'Admin refund') } });
    const full = refundAmount >= Number(order.total);
    const { error: updateError } = await db.from('orders').update({ payment_status: full ? 'refunded' : 'paid', status: full ? 'refunded' : order.status }).eq('order_number', order.order_number);
    if (updateError) throw updateError;
    return json(res, 200, { success: true, refund: { id: refund.id, amount: refund.amount / 100, status: refund.status, paymentId: refund.payment_id } });
  } catch (e) {
    console.error('Admin refund error:', e);
    return json(res, 400, { error: e?.error?.description || e?.message || 'Refund failed.' });
  }
}
module.exports = handler;
