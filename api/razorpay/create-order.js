const { createClient } = require('@supabase/supabase-js');
const Razorpay = require('razorpay');

function json(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !razorpayKeyId || !razorpaySecret) {
    return json(res, 500, { error: 'Payment service is not configured.' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!accessToken) return json(res, 401, { error: 'Authentication required.' });

    const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return json(res, 401, { error: 'Invalid session.' });

    const { orderId } = req.body || {};
    if (!orderId) return json(res, 400, { error: 'Order ID is required.' });

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, user_id, total, payment_status, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return json(res, 404, { error: 'Order not found.' });
    if (order.payment_status === 'paid') return json(res, 409, { error: 'Order is already paid.' });
    if (order.status === 'cancelled') return json(res, 409, { error: 'Cancelled orders cannot be paid.' });

    const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpaySecret });
    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100),
      currency: 'INR',
      receipt: order.order_number,
      notes: { oneclick_order_id: order.id },
    });

    const { error: updateError } = await admin
      .from('orders')
      .update({ payment_provider: 'razorpay', payment_id: paymentOrder.id })
      .eq('id', order.id)
      .eq('user_id', user.id);
    if (updateError) throw updateError;

    return json(res, 200, {
      key: razorpayKeyId,
      orderId: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      oneclickOrderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    return json(res, 500, { error: 'Unable to create the payment order.' });
  }
};
