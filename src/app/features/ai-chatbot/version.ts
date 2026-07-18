/**
 * Versionamiento del producto Vectis AI ChatBot.
 * SemVer: MAYOR.MENOR.PARCHE.
 *  - PARCHE: arreglos que no cambian el comportamiento esperado.
 *  - MENOR: funcionalidades nuevas compatibles hacia atrás.
 *  - MAYOR: cambios grandes que rompen compatibilidad.
 * Para publicar una versión: sube APP_VERSION y agrega una entrada AL INICIO de CHANGELOG.
 */
export const APP_VERSION = '1.1.0';

export interface ChangelogEntry {
  version: string;
  date: string;     // YYYY-MM-DD
  title: string;
  changes: string[];
}

/** Historial de versiones, de la más nueva a la más vieja. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-07-18',
    title: 'Telegram, agendado con Cal.com y novedades',
    changes: [
      'Telegram como canal de atención: el bot responde a tus clientes directamente en Telegram con la misma información del negocio.',
      'Hablar con un agente desde Telegram: el bot conecta al cliente con una persona de tu equipo (handoff) dentro del canal.',
      'Agendado automático de citas en Telegram con Cal.com: el bot consulta la disponibilidad real de tu calendario, pregunta los datos y crea la reserva por sí mismo. Solo pegas la URL pública de tu evento.',
      'Métricas por canal en el panel: "Conversaciones por canal" y "Mensajes a la IA por canal".',
      'Menú lateral con botón de hamburguesa en móvil, y mejoras de diseño responsive (incluida la sección Self-serve).',
      'Cancelación de suscripción directa desde tu cuenta: se agenda en Paddle al final del período y conservas el acceso hasta el vencimiento.',
      'Historial de versiones (esta página) y footer de versión en el producto.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-17',
    title: 'Lanzamiento inicial',
    changes: [
      'Chatbot de IA multi-tenant: cada negocio configura su propio asistente (identidad, información, reglas y FAQs).',
      'Widget web embebible con una línea de código, apariencia personalizable (colores, logo, mensaje de bienvenida, botones rápidos) y dominios autorizados.',
      'Base de conocimiento: documentos, inventario y estudio del sitio web del negocio para responder con datos reales.',
      'Panel de métricas: conversaciones, mensajes, leads, tiempo de respuesta, temas frecuentes y métricas por canal.',
      'Atención humana (handoff) por Telegram: el bot conecta al cliente con una persona del equipo cuando lo pide.',
      'Canal de Telegram: el bot responde a los clientes directamente en Telegram con la misma información del negocio.',
      'Agendado de citas: en el web abre la ventana de reservas; en Telegram el bot consulta la disponibilidad real y agenda la cita por sí mismo vía Cal.com.',
      'Optimización para buscadores e IA (SEO/GEO/AIO), accesibilidad y diseño responsive en todo el producto.',
    ],
  },
];
