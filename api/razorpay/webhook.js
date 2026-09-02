const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function json(res, status, body) {
  res.status(status).json(body);
}

// Razorpay signs the exact raw request body, so body parsing must stay disabled.
async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req.body === 'string') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) return json(res, 500, { error: 'Payment webhook is not configured.' });

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || Array.isArray(signature)) return json(res, 400, { error: 'Missing webhook signature.' });

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const receivedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return json(res, 401, { error: 'Invalid webhook signature.' });
    }

    const event = JSON.parse(rawBody);
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    if (!payment?.id || !razorpayOrderId) return json(res, 200, { received: true, ignored: true });

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const update = { payment_provider: 'razorpay' };
    const isPaymentFailed = event.event === 'payment.failed';

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      update.payment_status = 'paid';
      update.status = 'processing';
    } else if (isPaymentFailed) {
      update.payment_status = 'failed';
    } else if (event.event === 'payment.refunded') {
      update.payment_status = 'refunded';
      update.status = 'refunded';
    } else {
      return json(res, 200, { received: true, ignored: true });
    }

    // orders.payment_id stores Razorpay's order_... ID; payment.order_id exposes the same value.
    const { data: updatedOrder, error } = await admin
      .from('orders')
      .update(update)
      .eq('payment_id', razorpayOrderId)
      .select('id,order_number,payment_id,payment_provider,payment_status,status')
      .maybeSingle();
    if (error) {
      console.error('Razorpay webhook DB update failed:', error);
      return json(res, 500, { error: 'Could not update order.' });
    }
    if (!updatedOrder) {
      console.warn('Razorpay webhook order not found:', razorpayOrderId);
      return json(res, 200, { received: true, ignored: true });
    }

    // create_order reserves inventory before payment so concurrent checkouts cannot oversell.
    // If Razorpay reports a failed payment, release that reservation exactly once.
    if (isPaymentFailed) {
      const { error: releaseError } = await admin.rpc('release_order_stock', { p_order_id: updatedOrder.id });
      if (releaseError) {
        console.error('Razorpay inventory release failed:', releaseError);
        return json(res, 500, { error: 'Payment recorded, but inventory release failed.' });
      }
    }

    return json(res, 200, { received: true, order: updatedOrder });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return json(res, 400, { error: 'Invalid webhook payload.' });
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
