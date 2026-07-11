// Supabase Edge Function — Paddle Customer Portal.
//
// Devuelve la URL de una sesión autenticada del portal de Paddle para que el usuario gestione su
// suscripción (métodos de pago, facturas, cancelar). El frontend redirige a esa URL.
//
// Seguridad: requiere el JWT de Supabase del usuario (se identifica con auth.getUser). Solo genera
// el portal para SU propio customer_id (leído de su perfil). Usa la API key de Paddle (secret server).
//
// Secrets (NO en el repo):
//   supabase secrets set PADDLE_API_KEY=pdl_sdbx_apikey_...        (o pdl_apikey_... en producción)
// Auto-provistos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Deploy: supabase functions deploy paddle-portal   (con verificación de JWT — no usar --no-verify-jwt)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS });

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  // Identifica al usuario por su JWT.
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ error: 'unauthorized' }, 401);

  // Solo su propio customer_id.
  const { data: prof } = await supabase.from('profiles').select('paddle_customer_id, paddle_subscription_id').eq('id', user.id).maybeSingle();
  const customerId = prof?.paddle_customer_id;
  if (!customerId) return json({ error: 'no_customer' }, 404);

  const apiKey = Deno.env.get('PADDLE_API_KEY') ?? '';
  if (!apiKey) return json({ error: 'not_configured' }, 500);
  const base = apiKey.startsWith('pdl_sdbx_') ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

  const body = prof?.paddle_subscription_id ? { subscription_ids: [prof.paddle_subscription_id] } : {};
  const res = await fetch(`${base}/customers/${customerId}/portal-sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('paddle portal error', out); return json({ error: 'paddle_error' }, 502); }

  // URL general del portal (visión general de la cuenta).
  const url = out?.data?.urls?.general?.overview ?? out?.data?.urls?.general?.[0] ?? null;
  if (!url) return json({ error: 'no_url' }, 502);
  return json({ url }, 200);
});

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
