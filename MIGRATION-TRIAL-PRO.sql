-- =====================================================================
-- Prueba gratis de Pro (20 días, SIN tarjeta, solo cuentas nuevas, una vez)
-- Ejecutar en Supabase (SQL Editor). Idempotente y auto-reparable.
--
-- La app lee/escribe public.profiles (esquema por defecto). Si esa tabla NO existe
-- en tu base (error 42P01), este script la crea con lo mínimo que la app usa, su RLS
-- y el trigger que crea un perfil por cada usuario nuevo. Si YA existe, no toca nada
-- de eso: solo agrega las columnas de la prueba.
-- =====================================================================

-- 1) Asegura que exista public.profiles (solo la crea si falta; si existe, no la toca).
do $$
begin
  if to_regclass('public.profiles') is null then
    create table public.profiles (
      id                      uuid primary key references auth.users(id) on delete cascade,
      first_name              text,
      last_name               text,
      phone                   text,
      preferred_lang          text default 'en',
      plan                    text default 'basic',
      plan_expiry             date,
      cancel_at_period_end    boolean default false,
      paddle_customer_id      text,
      paddle_subscription_id  text,
      created_at              timestamptz default now()
    );

    alter table public.profiles enable row level security;
    create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
    create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
    create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

    -- Crea un perfil automáticamente al registrarse un usuario nuevo.
    create or replace function public.handle_new_user()
    returns trigger language plpgsql security definer set search_path = public as $fn$
    begin
      insert into public.profiles (id, first_name, last_name, preferred_lang)
      values (new.id,
              coalesce(new.raw_user_meta_data->>'first_name', ''),
              coalesce(new.raw_user_meta_data->>'last_name', ''),
              coalesce(new.raw_user_meta_data->>'preferred_lang', 'en'))
      on conflict (id) do nothing;
      return new;
    end $fn$;

    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- 2) Rellena perfiles faltantes para usuarios ya existentes (seguro: solo inserta los que falten).
insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3) Columnas de control de la prueba (idempotente).
alter table public.profiles add column if not exists on_trial   boolean not null default false;
alter table public.profiles add column if not exists trial_used boolean not null default false;

-- 4) Backfill: TODAS las cuentas actuales quedan como "elegibilidad ya consumida",
--    para que la prueba solo aplique a cuentas NUEVAS creadas después de esta migración.
update public.profiles set trial_used = true where trial_used = false;

-- 5) RPC que inicia la prueba de Pro para el usuario autenticado.
--    Guarda: solo si no ha usado prueba y aún no tiene plan (cuenta nueva). Idempotente:
--    si no es elegible, no hace nada. La app la llama en el primer login.
create or replace function public.start_pro_trial()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set plan        = 'pro',
         plan_expiry = (now() + interval '20 days')::date,
         on_trial    = true,
         trial_used  = true
   where id = auth.uid()
     and trial_used = false
     and plan_expiry is null;
end;
$$;

grant execute on function public.start_pro_trial() to authenticated;

-- =====================================================================
-- NOTAS
-- ---------------------------------------------------------------------
-- • Si tu tabla de perfiles existe pero con OTRO nombre/esquema, avísame el nombre real
--   y ajusto el script — pero la app usa public.profiles, así que lo correcto es que viva ahí.
--
-- • La prueba NO cobra: no crea suscripción en Paddle. Durante 20 días el usuario tiene
--   acceso Pro completo (el gating usa plan='pro'). Al vencer, el banner de "plan vencido"
--   lo invita a suscribirse en /plans (ahí sí paga Paddle).
--
-- • "En prueba" = on_trial AND sin paddle_subscription_id AND no vencida. Cuando el usuario
--   PAGUE, tu webhook de Paddle debe fijar paddle_subscription_id (e idealmente on_trial=false)
--   en profiles → el banner de prueba desaparece solo.
--
-- • Cambio de precio de Basic ($19 → $29): se hace en el DASHBOARD de Paddle (editar el precio
--   del producto Basic, o crear uno nuevo y pasarme el price ID). La web ya muestra $29.
-- =====================================================================
