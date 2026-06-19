/**
 * Discovery Assistant — configuración del proyecto (Vectis).
 *
 * Estas credenciales son PÚBLICAS (la publishable/anon key de Supabase está pensada
 * para el navegador y queda protegida por las políticas RLS). Se quedan aquí, en NUESTRO
 * proyecto, para que el cliente que embebe el widget NO tenga que enviarlas: él solo
 * pasa el `key` del flujo. Todas las respuestas llegan a NUESTRA base de datos.
 *
 * NUNCA pongas aquí la service_role / secret key.
 *
 * SUPABASE_URL = base del proyecto (sin /rest/v1/). El widget agrega /rest/v1 solo.
 */
export const SUPABASE_URL = 'https://cqblywvdveetrhwbytmh.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_PGC-OBJQdwbQgqGmxnKtiQ_erMWjloU';
