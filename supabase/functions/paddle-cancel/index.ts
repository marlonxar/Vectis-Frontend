// Supabase Edge Function: paddle-cancel
// Cancela la suscripción del usuario en Paddle AL FINAL DEL PERÍODO (frena el próximo cobro,
// pero conserva el acceso hasta la fecha de vencimiento). Gemela de `paddle-portal`.
//
// Deploy (con verificación de JWT, para saber quién cancela):
//   supabase functions deploy paddle-cancel
//
// Secretos (ya los usa paddle-portal; son compartidos por el proyecto):
//   PADDLE_API_KEY  → API key secreta de Paddle (la misma de paddle-portal).
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY → los inyecta Supabase automáticamente.
//
// El cliente lo invoca con supabase-js: sb.functions.invoke('paddle-cancel').
// Responde { ok: true } si la cancelación quedó agendada.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY');
    if (!PADDLE_API_KEY) return json({ error: 'paddle_not_configured' }, 500);

    // 1) Usuario autenticado (JWT del header Authorization).
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'unauthorized' }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401);
    const uid = userData.user.id;

    // 2) Suscripción de Paddle del usuario (la guardó el webhook en profiles).
    const { data: prof, error: profErr } = await admin
      .from('profiles').select('paddle_subscription_id').eq('id', uid).single();
    if (profErr || !prof?.paddle_subscription_id) return json({ error: 'no_subscription' }, 400);
    const subId = prof.paddle_subscription_id as string;

    // 3) Cancela en Paddle al final del período (no revoca el acceso inmediato).
    const base = /sandbox|sdbx|_test_/i.test(PADDLE_API_KEY) ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';
    const res = await fetch(`${base}/subscriptions/${subId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PADDLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ effective_from: 'next_billing_period' }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return json({ error: 'paddle_error', status: res.status, detail: detail.slice(0, 400) }, 502);
    }

    // 4) Refleja el estado localmente (el webhook subscription.updated lo confirmará también).
    //    Solo cancel_at_period_end: el acceso sigue hasta plan_expiry.
    await admin.from('profiles').update({ cancel_at_period_end: true }).eq('id', uid);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
