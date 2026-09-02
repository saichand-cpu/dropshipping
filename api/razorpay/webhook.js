const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Razorpay signs the exact raw request body, so body parsing must stay disabled.
module.exports.config = { api: { bodyParser: false } };

function json(res, status, body) {
  res.status(status).json(body);
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req.body === 'string') return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Payment webhook is not configured.' });
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) return json(res, 400, { error: 'Missing webhook signature.' });

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expected, 'utf8')
    );

    if (!valid) return json(res, 401, { error: 'Invalid webhook signature.' });

    const event = JSON.parse(rawBody);
    const payment = event?.payload?.payment?.entity;
    if (!payment?.id) return json(res, 200, { received: true });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const update = { payment_id: payment.id, payment_provider: 'razorpay' };

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      update.payment_status = 'paid';
      update.status = 'processing';
    } else if (event.event === 'payment.failed') {
      update.payment_status = 'failed';
    } else if (event.event === 'payment.refunded') {
      update.payment_status = 'refunded';
      update.status = 'refunded';
    } else {
      return json(res, 200, { received: true });
    }

    const { error } = await admin
      .from('orders')
      .update(update)
      .eq('payment_id', payment.id);

    if (error) {
      console.error('Razorpay webhook DB update failed:', error);
      return json(res, 500, { error: 'Could not update order.' });
    }

    return json(res, 200, { received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return json(res, 400, { error: 'Invalid webhook payload.' });
  }
};
