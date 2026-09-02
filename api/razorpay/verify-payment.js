const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function json(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !razorpaySecret) {
    return json(res, 500, { error: 'Payment verification is not configured.' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!accessToken) return json(res, 401, { error: 'Authentication required.' });

    const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return json(res, 401, { error: 'Invalid session.' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, oneclick_order_id } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !oneclick_order_id) {
      return json(res, 400, { error: 'Incomplete payment verification data.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(String(razorpay_signature), 'utf8')
    );
    if (!signaturesMatch) return json(res, 400, { error: 'Invalid payment signature.' });

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, user_id, payment_id, payment_status')
      .eq('id', oneclick_order_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return json(res, 404, { error: 'Order not found.' });
    if (order.payment_id !== razorpay_order_id) return json(res, 400, { error: 'Payment does not match the order.' });

    const { error: updateError } = await admin
      .from('orders')
      .update({ payment_status: 'paid', status: 'processing', payment_provider: 'razorpay', payment_id: razorpay_payment_id })
      .eq('id', order.id)
      .eq('user_id', user.id);
    if (updateError) throw updateError;

    return json(res, 200, { verified: true, orderNumber: order.order_number });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return json(res, 500, { error: 'Unable to verify the payment.' });
  }
};
