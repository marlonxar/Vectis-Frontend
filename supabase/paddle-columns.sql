-- Columnas para enlazar el perfil con la suscripción de Paddle.
-- Ejecutar en Supabase (SQL Editor). Idempotente.
alter table public.profiles add column if not exists paddle_customer_id     text;
alter table public.profiles add column if not exists paddle_subscription_id text;
alter table public.profiles add column if not exists subscription_status    text;   -- active, trialing, past_due, paused, canceled
alter table public.profiles add column if not exists paddle_price_id         text;
alter table public.profiles add column if not exists paddle_product_id       text;

-- (profiles ya tiene: plan, plan_expiry, cancel_at_period_end)
