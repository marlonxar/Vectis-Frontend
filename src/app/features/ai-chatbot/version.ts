/**
 * Versionamiento del producto Vectis AI ChatBot.
 * SemVer: MAYOR.MENOR.PARCHE.
 *  - PARCHE: arreglos que no cambian el comportamiento esperado.
 *  - MENOR: funcionalidades nuevas compatibles hacia atrás.
 *  - MAYOR: cambios grandes que rompen compatibilidad.
 * Para publicar una versión: sube APP_VERSION y agrega una entrada AL INICIO de CHANGELOG.
 */
export const APP_VERSION = '1.0.0';

export interface ChangelogEntry {
  version: string;
  date: string;     // YYYY-MM-DD
  title: string;
  changes: string[];
}

/** Historial de versiones, de la más nueva a la más vieja. */
export const CHANGELOG: ChangelogEntry[] = [
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
