// Supabase Edge Function — Paddle (Billing) webhook.
//
// Confirma el pago DEL LADO SERVIDOR y fija el plan del usuario (fuente de verdad).
// Verifica la firma del webhook (Paddle-Signature) con el "signing secret" del destino de
// notificaciones, mapea el price → plan y actualiza `public.profiles`.
//
// Secrets requeridos (NO en el repo):
//   supabase secrets set PADDLE_WEBHOOK_SECRET=pdl_ntfset_...   (Paddle → Notifications → tu destino)
// Auto-provistos por Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Deploy:  supabase functions deploy paddle-webhook --no-verify-jwt
// Endpoint: https://<PROJECT_REF>.functions.supabase.co/paddle-webhook  (regístralo en Paddle)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// price_id (sandbox) → plan. Cambia estos IDs por los de producción cuando corresponda.
const PRICE_TO_PLAN: Record<string, 'basic' | 'pro' | 'business'> = {
  'pri_01kx7csgs4hsgd4v314pz6ef52': 'basic',
  'pri_01kx7crwa0zzk9g5qkzp96487e': 'pro',
  'pri_01kx7cpj7676k5qbb2gqb37w8g': 'business',
};

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
    // comparación en tiempo constante
    if (hex.length !== h1.length) return false;
    let diff = 0; for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ h1.charCodeAt(i);
    return diff === 0;
  } catch { return false; }
}

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

  // Solo nos interesan los eventos de suscripción (llevan el estado recurrente + custom_data).
  if (!type.startsWith('subscription.')) return new Response('ignored', { status: 200 });

  const userId: string | undefined = data?.custom_data?.user_id;
  const priceId: string | undefined = data?.items?.[0]?.price?.id;
  const plan = (data?.custom_data?.plan as string) || (priceId ? PRICE_TO_PLAN[priceId] : undefined);
  const endsAt: string | undefined = data?.current_billing_period?.ends_at || data?.next_billed_at;
  const status: string = data?.status ?? '';
  const canceled = type === 'subscription.canceled' || status === 'canceled';
  const scheduledCancel = data?.scheduled_change?.action === 'cancel';

  if (!userId) return new Response('no user_id in custom_data', { status: 200 });

  const patch: Record<string, unknown> = { cancel_at_period_end: !!(canceled || scheduledCancel) };
  if (plan && !canceled) patch['plan'] = plan;
  if (endsAt) patch['plan_expiry'] = endsAt;
  if (data?.id) patch['paddle_subscription_id'] = data.id;
  if (data?.customer_id) patch['paddle_customer_id'] = data.customer_id;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) { console.error('profiles update failed', error); return new Response('db error', { status: 500 }); }

  return new Response('ok', { status: 200 });
});
