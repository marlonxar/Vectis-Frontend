// Supabase Edge Function — Paddle (Billing) webhook.
//
// Confirma pagos DEL LADO SERVIDOR y mantiene el estado de la suscripción en `public.profiles`.
// Verifica la firma (Paddle-Signature) con el signing secret del destino de notificaciones,
// mapea price → plan y actualiza el perfil. Responde 2xx rápido (<5s).
//
// Eventos:
//   transaction.completed  → fulfillment (concede acceso apenas se cobra)
//   subscription.created / .activated / .updated / .canceled → ciclo de vida (plan, estado, vencimiento, cancelación)
//
// Secrets (NO en el repo):
//   supabase secrets set PADDLE_WEBHOOK_SECRET=<signing secret del destino>
// Auto-provistos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Plan = 'basic' | 'pro' | 'business';

// price_id (sandbox) → plan. Cambia por los de producción cuando corresponda.
const PRICE_TO_PLAN: Record<string, Plan> = {
  'pri_01kx7csgs4hsgd4v314pz6ef52': 'basic',
  'pri_01kx7crwa0zzk9g5qkzp96487e': 'pro',
  'pri_01kx7cpj7676k5qbb2gqb37w8g': 'business',
};
const PLAN_RANK: Record<Plan, number> = { basic: 1, pro: 2, business: 3 };

const enc = new TextEncoder();

/** Verifica Paddle-Signature: HMAC-SHA256 de `${ts}:${rawBody}` con el signing secret. */
async function verifySignature(rawBody: string, header: string, secret: string): Promise<boolean> {
  try {
    const parts: Record<string, string> = {};
    for (const kv of header.split(';')) { const [k, v] = kv.split('='); if (k && v) parts[k.trim()] = v.trim(); }
    const ts = parts['ts']; const h1 = parts['h1'];
    if (!ts || !h1) return false;
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}:${rawBody}`));
    const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
    if (hex.length !== h1.length) return false;
    let diff = 0; for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ h1.charCodeAt(i);
    return diff === 0;
  } catch { return false; }
}

const firstItem = (data: any) => data?.items?.[0] ?? {};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const raw = await req.text();
  const secret = Deno.env.get('PADDLE_WEBHOOK_SECRET') ?? '';
  const sig = req.headers.get('Paddle-Signature') ?? '';
  if (!secret || !(await verifySignature(raw, sig, secret))) {
    return new Response('Invalid signature', { status: 401 });
  }

  let evt: any;
  try { evt = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  const type: string = evt?.event_type ?? '';
  const data = evt?.data ?? {};
  const isSub = type.startsWith('subscription.');
  const isTxn = type === 'transaction.completed';
  if (!isSub && !isTxn) return new Response('ignored', { status: 200 });

  // Identificador del usuario: custom_data.user_id que mandó el checkout.
  const userId: string | undefined = data?.custom_data?.user_id;
  if (!userId) return new Response('no user_id', { status: 200 });

  const item = firstItem(data);
  const priceId: string | undefined = item?.price?.id ?? item?.price_id;
  const productId: string | undefined = item?.price?.product_id ?? item?.product_id;
  const plan = (data?.custom_data?.plan as Plan) || (priceId ? PRICE_TO_PLAN[priceId] : undefined);
  const status: string = data?.status ?? (isTxn ? 'active' : '');
  const endsAt: string | undefined = data?.current_billing_period?.ends_at || data?.next_billed_at || data?.billing_period?.ends_at;
  const canceled = type === 'subscription.canceled' || status === 'canceled';
  const scheduledCancel = data?.scheduled_change?.action === 'cancel';
  const subId: string | undefined = isSub ? data?.id : data?.subscription_id;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  // subscription.updated → detectar upgrade/downgrade comparando con el plan guardado.
  if (type === 'subscription.updated' && plan) {
    const { data: prof } = await supabase.from('profiles').select('plan').eq('id', userId).maybeSingle();
    const prev = prof?.plan as Plan | undefined;
    if (prev && PLAN_RANK[plan] !== PLAN_RANK[prev]) {
      console.log(`sub ${subId}: ${PLAN_RANK[plan] > PLAN_RANK[prev] ? 'UPGRADE' : 'DOWNGRADE'} ${prev} → ${plan}`);
    }
  }

  const patch: Record<string, unknown> = {};
  if (plan && !canceled) patch['plan'] = plan;
  if (endsAt) patch['plan_expiry'] = endsAt;
  if (status) patch['subscription_status'] = canceled ? 'canceled' : status;
  patch['cancel_at_period_end'] = !!(canceled || scheduledCancel);
  if (subId) patch['paddle_subscription_id'] = subId;
  if (data?.customer_id) patch['paddle_customer_id'] = data.customer_id;
  if (priceId) patch['paddle_price_id'] = priceId;
  if (productId) patch['paddle_product_id'] = productId;

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) { console.error('profiles update failed', error); return new Response('db error', { status: 500 }); }

  return new Response('ok', { status: 200 });
});
