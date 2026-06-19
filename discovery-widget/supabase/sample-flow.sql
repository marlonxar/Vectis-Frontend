-- ============================================================================
-- Flujo de ejemplo para el Discovery Assistant.
-- Ejecutar DESPUÉS de schema.sql. Crea un flujo ACTIVE con public_key = da_vectis.
-- ============================================================================

insert into public.flows (public_key, name, language, status, accent_color, notification_email)
values (
  'da_vectis',
  'Vectis',
  'es',
  'ACTIVE',
  '#E7AB2E',
  'contact@wearevectis.com'
)
on conflict (public_key) do nothing;

with f as (select id from public.flows where public_key = 'da_vectis')
insert into public.flow_questions (flow_id, type, key, label, placeholder, options, required, order_index)
select f.id, q.type, q.key, q.label, q.placeholder, q.options, q.required, q.order_index
from f, (values
  ('TEXT',     'businessName', '¿Cómo se llama tu empresa o proyecto?', 'Ej: ABC Company', '[]'::jsonb, true, 1),
  ('RADIO',    'projectType',  '¿Qué necesitas construir?',            null,
     '["Sitio web","Aplicación web","App móvil","Automatización / IA","Integración / API","Otro"]'::jsonb, true, 2),
  ('SELECT',   'budget',       '¿Cuál es tu presupuesto aproximado?',  'Selecciona un rango',
     '["< $1.000","$1.000–$3.000","$3.000–$5.000","$5.000–$10.000","> $10.000"]'::jsonb, true, 3),
  ('TEXTAREA', 'description',  'Cuéntanos brevemente qué quieres lograr', 'Describe tu idea o problema…', '[]'::jsonb, false, 4),
  ('TEXT',     'name',         '¿Cómo te llamas?',                     'Tu nombre', '[]'::jsonb, true, 5),
  ('EMAIL',    'email',        '¿A qué correo te respondemos?',        'tucorreo@empresa.com', '[]'::jsonb, true, 6),
  ('PHONE',    'phone',        'Teléfono / WhatsApp (opcional)',       '+506 0000 0000', '[]'::jsonb, false, 7)
) as q(type, key, label, placeholder, options, required, order_index);
