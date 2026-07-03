/**
 * Configuración pública de Supabase para el frontend (Vectis).
 * La "publishable key" es pública por diseño: su seguridad depende de las
 * políticas RLS de la base de datos, NO de ocultar esta llave.
 * NUNCA pongas aquí la "secret key" (esa va solo en el worker).
 */
export const SUPABASE_CONFIG = {
  url: 'https://cqblywvdveetrhwbytmh.supabase.co',
  publishableKey: 'sb_publishable_PGC-OBJQdwbQgqGmxnKtiQ_erMWjloU',
};
