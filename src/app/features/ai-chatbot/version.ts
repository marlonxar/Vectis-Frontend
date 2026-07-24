/**
 * Versionamiento del producto Vectis AI ChatBot.
 * SemVer: MAYOR.MENOR.PARCHE.
 *  - PARCHE: arreglos que no cambian el comportamiento esperado.
 *  - MENOR: funcionalidades nuevas compatibles hacia atrás.
 *  - MAYOR: cambios grandes que rompen compatibilidad.
 * Para publicar una versión: sube APP_VERSION y agrega una entrada AL INICIO de CHANGELOG.
 */
export const APP_VERSION = '1.12.0';

export interface ChangelogEntry {
  version: string;
  date: string;     // YYYY-MM-DD
  title: string;
  changes: string[];
}

/** Historial de versiones, de la más nueva a la más vieja. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.12.0',
    date: '2026-07-21',
    title: 'Sitio en inglés por defecto',
    changes: [
      'El sitio de Vectis ahora abre en inglés por defecto (la raíz /). El español vive en /es, y /en sigue funcionando como enlace en inglés.',
      'Se corrigió una inconsistencia: en la página de inicio el cuerpo salía en un idioma y el título/descripción en otro. Ahora cada idioma tiene su título y descripción correctos.',
      'hreflang y URLs canónicas actualizados para el nuevo esquema (inglés en /, español en /es).',
    ],
  },
  {
    version: '1.11.0',
    date: '2026-07-21',
    title: 'Sitio pre-renderizado (SEO e IA)',
    changes: [
      'El sitio de Vectis ahora se genera como HTML estático en cada compilación (prerender/SSG). Google, ChatGPT, Perplexity y demás ven el contenido completo sin ejecutar JavaScript — antes veían una página casi vacía.',
      'Cada página (español en /, inglés en /en, y las páginas legales) se entrega ya renderizada y en su idioma correcto.',
      'La página carga mostrando el contenido de inmediato, en vez de una pantalla en blanco mientras arranca la aplicación.',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-07-21',
    title: 'Nuevo copy del sitio y ajustes de la página del ChatBot',
    changes: [
      'Reescritura completa del sitio de Vectis (inicio): mensaje más claro y directo en español e inglés — hero, "Qué hacemos", "Qué construimos", nueva sección "Cómo funciona", nosotros, contacto, FAQ y pie de página.',
      'Un solo llamado a la acción en todo el sitio: "Diagnóstico gratis".',
      'Banda de resultados arreglada: ya no muestra "0+ h"; ahora son cifras fijas (15+ h, 2 semanas, 24/7, gratis).',
      'Metadatos en inglés como idioma maestro para buscadores e IA, y color de tema corregido.',
      'Página del ChatBot: línea de precio bajo el título ("Desde $19/mes. Sin código. Cancele cuando quiera."), enlace de reembolsos corregido y textos afinados.',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-07-21',
    title: 'Buscador arreglado, ayuda en cada métrica y canales que se cierran solos',
    changes: [
      'El buscador de conversaciones ahora ignora las tildes: buscar "envio" encuentra "envíos" y "garantia" encuentra "GARANTÍA". Además busca en los datos del lead (nombre, correo, teléfono y nota) y en el nombre del canal.',
      'El buscador muestra cuántas conversaciones encontró y trae un botón para limpiar la búsqueda.',
      'Cada métrica del panel tiene un icono de ayuda que explica en una línea qué significa y de dónde sale.',
      'En cada canal, la sección "Activa el canal" aparece cerrada y con el distintivo verde de "Activo" cuando el canal ya está encendido y con sus credenciales completas.',
    ],
  },
  {
    version: '1.8.1',
    date: '2026-07-21',
    title: 'Encuesta dentro del aviso y recorrido fiel al producto',
    changes: [
      'La pregunta de "¿por qué te vas?" ahora aparece dentro del mismo aviso de cancelar, y también al eliminar la cuenta. Sigue siendo opcional y nunca bloquea la acción.',
      'El recorrido de la página de inicio ahora reproduce la aplicación completa: header con tu empresa y tu usuario, menú con los cinco canales y Soporte Técnico, el panel con todas sus métricas, la bandeja de conversaciones, el canal Web con su vista previa del widget y la atención humana.',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-07-21',
    title: 'Todo el producto en español e inglés',
    changes: [
      'Canales, Handoff a humano y "Qué sabe tu bot" ahora cambian de idioma con tu preferencia de cuenta. Con esto el producto completo está disponible en español e inglés.',
      'Los "Temas trending" del panel siempre empiezan en mayúscula: se acabaron los temas en MAYÚSCULAS o en minúsculas mezclados.',
      'Nuevo recorrido del producto en la página de inicio: muestra el panel con métricas y temas, la bandeja de conversaciones, los canales y la atención humana tal como se ven de verdad.',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-07-21',
    title: 'Guía de Cal.com, secciones que se cierran solas y menos pasos manuales',
    changes: [
      'La bandeja de conversaciones ahora cambia de idioma con tu preferencia de cuenta (español e inglés), incluidas las fechas.',
      'Guía paso a paso dentro de los canales para conseguir tu API key y la URL de tu evento de Cal.com, sin salir a buscar en la documentación.',
      'El agendado con Cal.com ahora es una sola sección compartida por todos los canales: al conectarlo se cierra y queda con el distintivo verde de "Conectado".',
      'El horario de atención del handoff también se cierra una vez configurado y muestra un resumen (por ejemplo "Lun, Mar, Mié · 09:00–18:00").',
      'Se quitó el botón de "Estudiar sitio web": al guardar tu configuración estudiamos tu sitio y reindexamos el conocimiento automáticamente.',
      'Al cancelar tu suscripción te preguntamos el motivo. Es opcional, se puede omitir y nunca bloquea la cancelación.',
      'El logo de cada canal ahora aparece en línea con la palabra "Canal", no encima.',
      'En Soporte Técnico se quitó el contacto directo: el canal de atención es el ticket.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-07-21',
    title: 'Bandeja de conversaciones',
    changes: [
      'Nueva pantalla "Conversaciones": lee lo que tu bot conversó con cada cliente, en todos los canales, con el hilo completo de la charla.',
      'Buscador dentro de las conversaciones y filtro por canal (web, WhatsApp, Telegram, Instagram, Messenger).',
      'Si el bot capturó un lead en la conversación, ves ahí mismo su nombre, correo, teléfono y la nota de interés.',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-07-19',
    title: 'Conocimiento por relevancia, horario de atención y seguridad',
    changes: [
      'Base de conocimiento por relevancia (RAG): tu información se indexa en fragmentos y el bot recupera solo lo relevante a cada pregunta. Responde mejor, admite documentos y catálogos mucho más grandes, y deja de "perder" información.',
      'Nueva página "Qué sabe tu bot": mira exactamente qué información tiene indexada, agrupada por fuente (sitio web, documentos, inventario, FAQs…), búscala, y prueba una pregunta para ver qué fragmentos usaría el bot al responder.',
      'Estudio del sitio web mucho más completo: ahora entiende sitios que se renderizan en el navegador (Angular, React, Next…), descubre las páginas por el sitemap y rescata el contenido de los archivos de la aplicación. En sitios así pasa de capturar unos pocos datos a capturar el contenido completo.',
      'Horario de atención del handoff: define si estás disponible 24 h o en una ventana por días y horas, con un mensaje automático para cuando pidan un agente fuera de horario.',
      'Multi-agente en WhatsApp: varios números reciben los chats en vivo y cualquiera puede responder.',
      'Seguridad: verificamos la firma de los webhooks de Meta (WhatsApp, Messenger e Instagram) con tu App Secret, para rechazar mensajes falsos.',
      'Los canales dejan de ser una función en pruebas: ya están disponibles para todos los usuarios.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-07-18',
    title: 'Handoff a humano por WhatsApp',
    changes: [
      'Nueva opción de atención humana por WhatsApp: recibe los chats en vivo (de cualquier canal) en tu WhatsApp y responde desde ahí.',
      'Un solo destino de handoff a la vez: WhatsApp o Telegram, nunca los dos. Al activar uno, el otro se desactiva.',
      'El agente responde desde su WhatsApp y el mensaje llega al cliente en el canal por el que escribió (web, Telegram, WhatsApp, Messenger o Instagram); escribe /fin para cerrar el chat.',
      'El aviso al agente puede usar una plantilla aprobada de Meta, para que le llegue aunque hayan pasado más de 24 h desde su último mensaje.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-07-18',
    title: 'Canales de Messenger e Instagram',
    changes: [
      'Canal de Facebook Messenger: el bot responde a quienes escriben a tu página de Facebook con la información de tu negocio.',
      'Canal de Instagram: el bot contesta los mensajes directos (DM) de tu cuenta profesional de Instagram.',
      'Ambos comparten la Graph API de Meta: hablar con un agente (los chats en vivo llegan a tu Telegram) y agendado de citas con Cal.com funcionan igual que en WhatsApp y Telegram.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-07-18',
    title: 'Canal de WhatsApp',
    changes: [
      'Canal de WhatsApp (WhatsApp Cloud API de Meta): el bot responde a tus clientes en WhatsApp con la misma información de tu negocio, igual que en Telegram. Cada negocio conecta su número pegando sus credenciales de Meta.',
      'Hablar con un agente desde WhatsApp: los chats en vivo llegan a tu Telegram, desde donde le respondes al cliente.',
      'Agendado automático de citas (Cal.com) también en WhatsApp.',
      'Historial de versiones ahora público, con el header/footer del sitio para visitantes sin sesión.',
    ],
  },
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
