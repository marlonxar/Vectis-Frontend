-- ============================================================================
-- Flujo Discovery Assistant Vectis
-- Ejecutar DESPUÉS de schema.sql.
-- Crea / actualiza un flujo ACTIVE con public_key = websites_vectis.
--
-- Formato por pregunta:
--   RADIO    = tarjetas (pocas opciones, una sola respuesta).
--   SELECT   = desplegable (muchas opciones).
--   CHECKBOX = tarjetas con varias respuestas.
-- Cualquier opción "Otro" / "Otra" muestra un campo de texto para escribir
-- una respuesta libre (funciona en RADIO, CHECKBOX y SELECT).
--
-- OJO: borra y reemplaza las preguntas actuales de 'websites_vectis'.
-- ============================================================================

insert into public.flows (public_key, name, language, status, accent_color, notification_email)
values ('websites_vectis', 'Vectis', 'es', 'ACTIVE', '#E7AB2E', 'contact@wearevectis.com')
on conflict (public_key) do update
  set name = excluded.name,
      status = 'ACTIVE',
      accent_color = excluded.accent_color,
      notification_email = excluded.notification_email;

delete from public.flow_questions
where flow_id = (select id from public.flows where public_key = 'websites_vectis');

with f as (
  select id from public.flows where public_key = 'websites_vectis'
)
insert into public.flow_questions (flow_id, type, key, label, placeholder, options, required, order_index)
select f.id, q.type, q.key, q.label, q.placeholder, q.options, q.required, q.order_index
from f, (values

  ('TEXT', 'businessName',
   '¿Cómo se llama tu empresa o proyecto?',
   'Ej: ABC Company',
   '[]'::jsonb, true, 1),

  ('TEXT', 'websiteUrl',
   '¿Ya tienes una página web actualmente?',
   'Ej: www.tuempresa.com',
   '[]'::jsonb, false, 2),

  -- muchas opciones → desplegable
  ('SELECT', 'projectType',
   '¿Qué tipo de proyecto necesitas construir?',
   'Selecciona una opción',
   '["Página web informativa","Landing page de ventas","Tienda en línea (e-commerce)","Sistema web / plataforma","Automatización / IA","Integración / API","Otro"]'::jsonb,
   true, 3),

  ('SELECT', 'websiteGoal',
   '¿Cuál es el principal objetivo de tu página?',
   'Selecciona una opción',
   '["Conseguir clientes","Vender productos","Mostrar servicios","Generar confianza en la marca","Automatizar procesos","Otro"]'::jsonb,
   true, 4),

  ('SELECT', 'sections',
   '¿Qué secciones necesitas en tu página?',
   'Selecciona una opción',
   '["Inicio","Nosotros / Empresa","Servicios","Productos","Portafolio / Proyectos","Blog","Testimonios","Preguntas frecuentes","Contacto","Tienda","Área privada","Otra"]'::jsonb,
   true, 5),

  -- pocas opciones → tarjetas
  ('RADIO', 'productsServices',
   '¿Cuántos productos o servicios necesitas mostrar?',
   null,
   '["1-5","6-15","16-50","Más de 50","No aplica"]'::jsonb,
   true, 6),

  ('TEXTAREA', 'description',
   'Cuéntanos sobre tu empresa y qué quieres lograr',
   'Describe tu idea, negocio o problema que quieres resolver...',
   '[]'::jsonb, true, 7),

  ('TEXTAREA', 'targetAudience',
   '¿A quién va dirigida la página?',
   'Ej: clientes, empresas, personas interesadas en...',
   '[]'::jsonb, false, 8),

  ('TEXTAREA', 'desiredFeatures',
   '¿Qué funcionalidades necesitas?',
   'Ej: formularios, reservas, pagos, usuarios, chat...',
   '[]'::jsonb, false, 9),

  -- muchas opciones → desplegable
  ('SELECT', 'integrations',
   '¿Qué integraciones te gustaría agregar?',
   'Selecciona una opción',
   '["WhatsApp","Calendario de reservas","Pagos en línea","CRM","Email marketing","Google Analytics","Redes sociales","APIs externas","Ninguna","Otra"]'::jsonb,
   false, 10),

  -- pocas opciones → tarjetas
  ('RADIO', 'designStyle',
   '¿Tienes alguna referencia visual o estilo que te guste?',
   null,
   '["Tengo páginas de referencia","Tengo colores y estilo definidos","Tengo una idea general","Necesito ayuda desde cero"]'::jsonb,
   true, 11),

  ('TEXTAREA', 'designExamples',
   'Comparte páginas que te gustan o referencias visuales',
   'Ej: me gusta el estilo de esta página...',
   '[]'::jsonb, false, 12),

  ('RADIO', 'resources',
   '¿Qué recursos tienes disponibles?',
   null,
   '["Tengo textos e imágenes listos","Tengo logo y colores de marca","Tengo redes sociales con información","Tengo parte del contenido","No tengo contenido todavía"]'::jsonb,
   true, 13),

  ('RADIO', 'language',
   '¿En qué idioma(s) debe estar tu página?',
   null,
   '["Español","Inglés","Español e Inglés","Otro"]'::jsonb,
   true, 14),

  ('RADIO', 'hosting',
   '¿Ya tienes dominio y hosting?',
   null,
   '["Sí, ya tengo ambos","Solo dominio","No tengo nada todavía","No sé qué necesito"]'::jsonb,
   true, 15),

  ('RADIO', 'maintenance',
   '¿Te interesa mantenimiento y soporte mensual?',
   null,
   '["Sí, quiero que administren mi página","Tal vez, quiero conocer opciones","No por ahora"]'::jsonb,
   true, 16),

  ('RADIO', 'budget',
   '¿Cuál es tu presupuesto aproximado?',
   null,
   '["< $1.000","$1.000–$3.000","$3.000–$5.000","$5.000–$10.000","> $10.000"]'::jsonb,
   true, 17),

  ('RADIO', 'timeline',
   '¿Cuándo necesitas tener el proyecto listo?',
   null,
   '["Lo antes posible","En 1 mes","1-3 meses","Más de 3 meses","No tengo fecha definida"]'::jsonb,
   true, 18),

  ('TEXT', 'name',
   '¿Cómo te llamas?',
   'Tu nombre',
   '[]'::jsonb, true, 19),

  ('EMAIL', 'email',
   '¿A qué correo te respondemos?',
   'tucorreo@empresa.com',
   '[]'::jsonb, true, 20),

  ('PHONE', 'phone',
   'Teléfono / WhatsApp',
   '+506 0000 0000',
   '[]'::jsonb, false, 21)

) as q(type, key, label, placeholder, options, required, order_index);
