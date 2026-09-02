const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!token || !supabaseUrl || !anonKey || !serviceRoleKey || !keyId || !keySecret) {
    return json(res, 500, { error: 'Refund service is not configured.' });
  }

  try {
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) return json(res, 401, { error: 'Unauthorized.' });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (profile?.role !== 'admin') return json(res, 403, { error: 'Admin access required.' });

    const { orderNumber, amount, reason } = req.body || {};
    if (!orderNumber) return json(res, 400, { error: 'Order number is required.' });

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('order_number, total, payment_id, payment_provider, payment_status, status')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return json(res, 404, { error: 'Order not found.' });
    if (order.payment_provider !== 'razorpay' || !order.payment_id) {
      return json(res, 400, { error: 'This order does not have a Razorpay payment.' });
    }
    if (order.payment_status !== 'paid') {
      return json(res, 400, { error: 'Only paid orders can be refunded.' });
    }

    const refundAmount = amount == null || amount === '' ? Number(order.total) : Number(amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return json(res, 400, { error: 'Refund amount must be greater than zero.' });
    }
    if (refundAmount > Number(order.total)) {
      return json(res, 400, { error: 'Refund amount cannot exceed the order total.' });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const receipt = `refund-${order.order_number}-${crypto.randomUUID()}`;
    const refund = await razorpay.payments.refund(order.payment_id, {
      amount: Math.round(refundAmount * 100),
      receipt,
      notes: { order_number: String(order.order_number), reason: String(reason || 'Admin refund') },
    });

    const isFullRefund = refundAmount >= Number(order.total);
    const nextStatus = isFullRefund ? 'refunded' : order.status;
    const nextPaymentStatus = isFullRefund ? 'refunded' : 'paid';

    const { error: updateError } = await admin
      .from('orders')
      .update({ payment_status: nextPaymentStatus, status: nextStatus })
      .eq('order_number', order.order_number);

    if (updateError) throw updateError;

    return json(res, 200, {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        paymentId: refund.payment_id,
      },
      order: { orderNumber: order.order_number, paymentStatus: nextPaymentStatus, status: nextStatus },
    });
  } catch (error) {
    console.error('Admin refund error:', error);
    return json(res, 400, { error: error?.error?.description || error?.message || 'Refund failed.' });
  }
}
