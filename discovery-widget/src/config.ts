/**
 * Discovery Assistant — configuración del proyecto (Vectis).
 *
 * Estas credenciales son PÚBLICAS (la anon key de Supabase está pensada para el
 * navegador y queda protegida por las políticas RLS). Se quedan aquí, en NUESTRO
 * proyecto, para que el cliente que embebe el widget NO tenga que enviarlas: él solo
 * pasa el `key` del flujo. Todas las respuestas llegan a NUESTRA base de datos.
 *
 * Rellena estos dos valores con los de tu proyecto Supabase
 * (Project Settings → API) y reconstruye con `npm run build`.
 */
export const SUPABASE_URL = 'https://YOURPROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_PUBLIC_ANON_KEY';
