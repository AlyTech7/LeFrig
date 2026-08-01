export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { type: 'note'; title?: string; text: string };

export type LegalDocument = {
  id: string;
  title: string;
  titleAr?: string;
  summary: string;
  blocks: LegalBlock[];
};

export const LEGAL_META = {
  lastUpdated: '4 de julio de 2026',
  lastUpdatedIso: '2026-07-04',
  contactEmail: 'hola@lefrig.app',
  dpoEmail: 'privacidad@lefrig.app',
  platformName: 'Lefrig',
  platformTagline: 'El bazar del Sáhara',
} as const;

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'aviso-legal',
    title: 'Aviso legal',
    titleAr: 'إشعار قانوني',
    summary: 'Identidad del titular, objeto del sitio y condiciones generales de acceso.',
    blocks: [
      {
        type: 'p',
        text: 'En cumplimiento de la normativa aplicable en materia de servicios de la sociedad de la información, se informa a los usuarios de los datos identificativos del titular de la plataforma Lefrig.',
      },
      { type: 'h3', text: '1. Titular del servicio' },
      {
        type: 'p',
        text: 'Denominación: Lefrig — plataforma digital del Sáhara Occidental. Contacto general: hola@lefrig.app. Asuntos de privacidad: privacidad@lefrig.app.',
      },
      { type: 'h3', text: '2. Objeto' },
      {
        type: 'p',
        text: 'Lefrig es una superapp comunitaria que conecta campamentos, Tindouf, la diáspora y vecinos saharauis mediante mercado, tiendas, servicios, transporte, empleo, vouchers, libreta de confianza, mensajería y foro comunitario. La plataforma facilita visibilidad y contacto; no actúa como intermediario comercial obligatorio ni como entidad de pago.',
      },
      { type: 'h3', text: '3. Acceso y uso' },
      {
        type: 'p',
        text: 'El acceso a Lefrig implica la aceptación de los presentes textos legales. El usuario se compromete a hacer un uso diligente, lícito y conforme a la dignidad del Sáhara Occidental.',
      },
      { type: 'h3', text: '4. Propiedad intelectual del sitio' },
      {
        type: 'p',
        text: 'El diseño, código, marca Lefrig, logotipo (rosa de los vientos), textos institucionales y elementos gráficos son propiedad del titular o de sus licenciantes. Queda prohibida su reproducción sin autorización, salvo cita con fines informativos.',
      },
      { type: 'h3', text: '5. Enlaces externos' },
      {
        type: 'p',
        text: 'Lefrig puede contener enlaces a sitios de terceros (WhatsApp, mapas, proveedores de autenticación). No nos responsabilizamos del contenido ni de las políticas de privacidad de esos sitios.',
      },
      { type: 'h3', text: '6. Legislación aplicable' },
      {
        type: 'p',
        text: 'Salvo norma imperativa en contrario, estos textos se interpretan conforme a la legislación aplicable al titular del servicio y a los principios de protección de datos reconocidos internacionalmente (incluido el RGPD cuando resulte de aplicación).',
      },
    ],
  },
  {
    id: 'terminos',
    title: 'Términos y condiciones',
    titleAr: 'الشروط والأحكام',
    summary: 'Reglas de uso de la cuenta, publicaciones, comercio entre usuarios y responsabilidades.',
    blocks: [
      {
        type: 'p',
        text: 'Al registrarte, iniciar sesión o usar cualquier función de Lefrig, aceptas estos Términos y Condiciones de Uso («Términos»). Si no estás de acuerdo, no utilices la plataforma.',
      },
      { type: 'h3', text: '1. Definiciones' },
      {
        type: 'ul',
        items: [
          '«Plataforma»: aplicación web, API, apps móviles y servicios asociados de Lefrig.',
          '«Usuario»: persona que accede o se registra en Lefrig.',
          '«Contenido»: anuncios, fotos, mensajes, tiendas, rutas de transporte, publicaciones comunitarias y cualquier dato que el usuario publique.',
          '«Transacción»: acuerdo de compraventa, servicio, transporte o fiado celebrado directamente entre usuarios, fuera o con apoyo de las herramientas de Lefrig.',
        ],
      },
      { type: 'h3', text: '2. Elegibilidad y cuenta' },
      {
        type: 'ol',
        items: [
          'Debes tener capacidad legal para contratar según tu jurisdicción. Si eres menor, necesitas autorización de tu tutor legal.',
          'Debes proporcionar datos veraces en el registro (nombre, correo, teléfono cuando se solicite).',
          'Eres responsable de la confidencialidad de tus credenciales y de toda actividad en tu cuenta.',
          'Debes notificarnos de inmediato cualquier uso no autorizado en hola@lefrig.app.',
          'Lefrig puede verificar identidad, campamento o reputación mediante badges, libreta o procesos comunitarios.',
        ],
      },
      { type: 'h3', text: '3. Naturaleza del servicio' },
      {
        type: 'p',
        text: 'Lefrig es infraestructura comunitaria: un tablón digital, directorio y canal de mensajería. No somos vendedores, transportistas, empleadores ni entidad financiera. No garantizamos la calidad, legalidad, entrega ni pago de las transacciones entre usuarios.',
      },
      { type: 'h3', text: '4. Contenido del usuario' },
      {
        type: 'p',
        text: 'Conservas la titularidad de tu contenido. Al publicar en Lefrig, nos concedes una licencia no exclusiva, mundial, gratuita y sublicenciable para alojar, reproducir, adaptar (p. ej. redimensionar imágenes), indexar en buscador interno y mostrar tu contenido en la plataforma y materiales de promoción comunitaria de Lefrig.',
      },
      {
        type: 'p',
        text: 'Declaras que tienes derecho a publicar el contenido y que no infringe derechos de terceros ni leyes aplicables.',
      },
      { type: 'h3', text: '5. Conducta prohibida' },
      {
        type: 'ul',
        items: [
          'Fraude, estafa, suplantación de identidad o publicaciones engañosas.',
          'Contenido de odio, violencia, acoso, discriminación o explotación.',
          'Venta de productos o servicios ilegales, armas, sustancias prohibidas o contenido para adultos no permitido.',
          'Spam, scraping masivo, ingeniería inversa o intentos de comprometer la seguridad.',
          'Manipulación de reputación, reseñas falsas o abuso del sistema de disputas/vouchers.',
          'Uso de la plataforma para lavado de dinero o financiación ilícita.',
          'Recopilar datos personales de otros usuarios sin base legal y consentimiento.',
        ],
      },
      { type: 'h3', text: '6. Mercado, tiendas y servicios' },
      {
        type: 'ul',
        items: [
          'Los precios, condiciones, garantías y métodos de pago los acuerdan directamente comprador y vendedor o cliente y profesional.',
          'Las fotos deben representar el producto o servicio real. Está prohibido usar imágenes engañosas.',
          'Lefrig puede retirar anuncios duplicados, fraudulentos o que violen estos Términos sin previo aviso en casos urgentes.',
          'La verificación de tiendas o badges de confianza no implica aval comercial de Lefrig sobre cada operación.',
        ],
      },
      { type: 'h3', text: '7. Transporte y empleo' },
      {
        type: 'p',
        text: 'Las rutas de transporte y ofertas de empleo son responsabilidad exclusiva de quien las publica. Lefrig no verifica licencias de conducir, seguros, permisos de trabajo ni condiciones laborales. Los usuarios deben cumplir la normativa de tráfico y laboral aplicable en su país.',
      },
      { type: 'h3', text: '8. Mensajería y comunidad' },
      {
        type: 'p',
        text: 'Los mensajes privados y publicaciones comunitarias deben respetar la privacidad ajena y las normas de convivencia. Podemos revisar contenido reportado o cuando exista obligación legal. No garantizamos lectura instantánea ni disponibilidad 24/7 del servicio de chat.',
      },
      { type: 'h3', text: '9. Suspensión y terminación' },
      {
        type: 'p',
        text: 'Podemos suspender o cerrar cuentas que incumplan estos Términos, generen riesgo para la comunidad o lo exija la ley. Puedes solicitar la eliminación de tu cuenta en cualquier momento escribiendo a hola@lefrig.app. Algunos datos pueden conservarse por obligación legal o resolución de disputas.',
      },
      { type: 'h3', text: '10. Limitación de responsabilidad' },
      {
        type: 'p',
        text: 'En la máxima medida permitida por la ley, Lefrig no será responsable de daños indirectos, lucro cesante, pérdida de datos o conflictos entre usuarios derivados de transacciones, transporte, fiado o vouchers. El servicio se presta «tal cual» y «según disponibilidad», especialmente en zonas con conectividad limitada.',
      },
      { type: 'h3', text: '11. Modificaciones' },
      {
        type: 'p',
        text: 'Podemos actualizar estos Términos. Publicaremos la fecha de revisión en esta página. El uso continuado tras cambios relevantes implica aceptación. Para cambios sustanciales, procuraremos avisar por correo o notificación in-app.',
      },
      { type: 'h3', text: '12. Contacto y reclamaciones' },
      {
        type: 'p',
        text: 'Para dudas, reclamaciones o reportes: hola@lefrig.app. Indica tu nombre de usuario, capturas si aplica y descripción detallada. Responderemos en un plazo razonable.',
      },
    ],
  },
  {
    id: 'privacidad',
    title: 'Política de privacidad',
    titleAr: 'سياسة الخصوصية',
    summary: 'Qué datos recogemos, por qué, durante cuánto tiempo y cuáles son tus derechos.',
    blocks: [
      {
        type: 'p',
        text: 'Lefrig respeta tu privacidad. Esta Política describe cómo tratamos datos personales cuando usas la plataforma, conforme a principios de minimización, transparencia y control del usuario.',
      },
      { type: 'h3', text: '1. Responsable del tratamiento' },
      {
        type: 'p',
        text: 'Responsable: titular de la plataforma Lefrig. Contacto privacidad: privacidad@lefrig.app. Contacto general: hola@lefrig.app.',
      },
      { type: 'h3', text: '2. Datos que recogemos' },
      {
        type: 'table',
        caption: 'Categorías de datos personales',
        headers: ['Categoría', 'Ejemplos', 'Origen'],
        rows: [
          ['Identificación y cuenta', 'Nombre, correo, teléfono, foto, ID Clerk', 'Registro / Clerk'],
          ['Perfil comunitario', 'Campamento, idioma, badges, reputación', 'Usuario / plataforma'],
          ['Contenido publicado', 'Anuncios, tiendas, servicios, rutas, empleo, posts', 'Usuario'],
          ['Comunicaciones', 'Mensajes, notificaciones, disputas', 'Uso del servicio'],
          ['Transaccional comunitario', 'Pedidos, libreta, vouchers, favoritos', 'Uso del servicio'],
          ['Técnicos', 'IP, dispositivo, logs, cookies', 'Automático'],
          ['Ubicación', 'Solo si la facilitas (mapa, transporte, campamentos)', 'Usuario / permiso'],
        ],
      },
      { type: 'h3', text: '3. Finalidades y base legal' },
      {
        type: 'ul',
        items: [
          'Prestar el servicio (cuenta, publicar, chatear, buscar): ejecución del contrato / interés legítimo.',
          'Autenticación y seguridad (Clerk, prevención de fraude): interés legítimo / obligación legal.',
          'Búsqueda interna (Meilisearch): interés legítimo en indexar contenido público que publicas.',
          'Comunicaciones operativas (avisos, disputas): ejecución del contrato.',
          'Mejora del producto y estadísticas agregadas: interés legítimo, preferiblemente anonimizadas.',
          'Cumplimiento legal y reclamaciones: obligación legal.',
        ],
      },
      { type: 'h3', text: '4. Destinatarios y encargados' },
      {
        type: 'p',
        text: 'Compartimos datos solo cuando es necesario para operar Lefrig, con proveedores que actúan como encargados del tratamiento bajo contrato:',
      },
      {
        type: 'ul',
        items: [
          'Clerk — autenticación y gestión de sesión.',
          'DigitalOcean u otros proveedores cloud — alojamiento de base de datos y API.',
          'Proveedores de almacenamiento de imágenes (S3-compatible) — fotos de anuncios y tiendas.',
          'Meilisearch — índice de búsqueda del mercado (contenido publicado).',
          'Redis — caché y limitación de intentos (p. ej. OTP), cuando esté activo.',
        ],
      },
      {
        type: 'p',
        text: 'No vendemos ni alquilamos datos personales a terceros con fines publicitarios.',
      },
      { type: 'h3', text: '5. Transferencias internacionales' },
      {
        type: 'p',
        text: 'Algunos proveedores pueden procesar datos fuera de tu país (p. ej. UE, EE. UU.). Cuando aplique, utilizamos cláusulas contractuales tipo, decisiones de adecuación u otras garantías reconocidas.',
      },
      { type: 'h3', text: '6. Plazo de conservación' },
      {
        type: 'ul',
        items: [
          'Cuenta activa: mientras mantengas el registro.',
          'Contenido publicado: hasta que lo elimines o cierre la cuenta, salvo copias de seguridad temporales.',
          'Mensajes: según configuración del servicio y necesidades de mediación.',
          'Logs de seguridad: habitualmente hasta 12 meses.',
          'Obligaciones legales: el tiempo exigido por la normativa aplicable.',
        ],
      },
      { type: 'h3', text: '7. Tus derechos' },
      {
        type: 'p',
        text: 'Según tu jurisdicción, puedes ejercer: acceso, rectificación, supresión, limitación, oposición, portabilidad y retirada del consentimiento cuando el tratamiento se base en él.',
      },
      {
        type: 'p',
        text: 'Solicitudes: privacidad@lefrig.app. Responderemos en el plazo legal aplicable (p. ej. 30 días bajo RGPD). Puedes reclamar ante la autoridad de protección de datos de tu país.',
      },
      { type: 'h3', text: '8. Menores' },
      {
        type: 'p',
        text: 'Lefrig no está dirigida a menores de 16 años sin supervisión parental. Si detectamos registro de un menor sin consentimiento parental verificable, podemos eliminar la cuenta.',
      },
      { type: 'h3', text: '9. Seguridad' },
      {
        type: 'p',
        text: 'Aplicamos medidas técnicas y organizativas: cifrado en tránsito (HTTPS/TLS), contraseñas de base de datos gestionadas, control de acceso, copias de seguridad en infraestructura gestionada. Ningún sistema es 100 % seguro; te recomendamos contraseñas fuertes y no compartir códigos OTP.',
      },
      { type: 'h3', text: '10. Decisiones automatizadas' },
      {
        type: 'p',
        text: 'No adoptamos decisiones con efectos jurídicos significativos basadas únicamente en tratamiento automatizado. La reputación y badges pueden basarse en reglas transparentes y reportes comunitarios, revisables mediante soporte.',
      },
      { type: 'h3', text: '11. Cambios en esta política' },
      {
        type: 'p',
        text: 'Actualizaremos esta página con la nueva fecha. Los cambios relevantes se comunicarán por medios razonables.',
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Política de cookies',
    titleAr: 'سياسة ملفات تعريف الارتباط',
    summary: 'Qué cookies usamos, para qué sirven y cómo gestionarlas.',
    blocks: [
      {
        type: 'p',
        text: 'Las cookies y tecnologías similares (localStorage, sessionStorage) nos ayudan a mantener tu sesión, recordar preferencias y medir el uso agregado del sitio.',
      },
      { type: 'h3', text: '1. ¿Qué es una cookie?' },
      {
        type: 'p',
        text: 'Pequeño archivo que el navegador almacena en tu dispositivo. Puede ser propia (Lefrig) o de terceros (p. ej. Clerk).',
      },
      { type: 'h3', text: '2. Tipos que utilizamos' },
      {
        type: 'table',
        headers: ['Tipo', 'Finalidad', 'Duración orientativa', 'Obligatoria'],
        rows: [
          ['Esenciales / sesión', 'Login, seguridad CSRF, preferencias de idioma', 'Sesión – 12 meses', 'Sí'],
          ['Clerk (__session, etc.)', 'Autenticación de usuario', 'Según Clerk', 'Sí para cuenta'],
          ['Funcionales', 'Recordar filtros, borrador de formulario', 'Sesión – 30 días', 'No'],
          ['Analíticas agregadas', 'Estadísticas de uso sin publicidad', 'Hasta 24 meses', 'No'],
        ],
      },
      { type: 'h3', text: '3. Cookies de terceros' },
      {
        type: 'ul',
        items: [
          'Clerk (clerk.com) — autenticación. Consulta su política de privacidad.',
          'Posibles CDN o fuentes (Google Fonts) — rendimiento tipográfico.',
        ],
      },
      { type: 'h3', text: '4. Cómo gestionarlas' },
      {
        type: 'ol',
        items: [
          'Desde la configuración de tu navegador: bloquear, eliminar o avisar antes de aceptar.',
          'Modo privado: limita persistencia de cookies.',
          'Desactivar cookies esenciales puede impedir iniciar sesión o usar funciones protegidas.',
        ],
      },
      { type: 'h3', text: '5. Actualizaciones' },
      {
        type: 'p',
        text: 'Revisaremos esta tabla cuando incorporemos nuevas herramientas analíticas o de marketing. La fecha de revisión figura al inicio de la página legal.',
      },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos y transacciones',
    titleAr: 'المدفوعات والمعاملات',
    summary: 'Efectivo como método principal del piloto y rol de Lefrig en las operaciones entre usuarios.',
    blocks: [
      {
        type: 'note',
        title: 'Principio fundamental',
        text: 'Lefrig no procesa pagos con tarjeta bancaria ni custodia dinero de usuarios. Las transacciones económicas ocurren directamente entre personas, bajo su propio acuerdo.',
      },
      { type: 'h3', text: '1. Efectivo (نقداً)' },
      {
        type: 'p',
        text: 'El pago en efectivo es el método principal en campamentos y entornos con banca limitada. Lefrig facilita contacto, acuerdo de precio y confirmación con PIN bilateral; la entrega del dinero es presencial o según acordéis fuera de la app.',
      },
      { type: 'h3', text: '2. Fiado, vouchers y diáspora' },
      {
        type: 'p',
        text: 'Fiado/libreta, vouchers ONG y pedidos diáspora con transferencia manual no están disponibles en el piloto actual. Si se reactivan en el futuro, se actualizará esta sección.',
      },
      { type: 'h3', text: '3. Disputas' },
      {
        type: 'ul',
        items: [
          'Ante un conflicto, intentad resolverlo directamente por chat.',
          'Podéis abrir una disputa en Lefrig para mediación comunitaria documentada.',
          'Lefrig no devuelve dinero ni impone sanciones económicas vinculantes; puede aplicar medidas de cuenta (avisos, suspensión).',
          'Para fraudes graves, contactad también con autoridades locales competentes.',
        ],
      },
      { type: 'h3', text: '4. Precios y comisiones' },
      {
        type: 'p',
        text: 'Publicar anuncios, tiendas y servicios en Lefrig no implica comisión sobre ventas entre usuarios salvo que se indique expresamente en un plan futuro. Cualquier tarifa de plataforma se comunicará con antelación.',
      },
      { type: 'h3', text: '5. Impuestos y facturación' },
      {
        type: 'p',
        text: 'Vendedores y profesionales son responsables de declarar ingresos e IVA/impuestos según su país. Lefrig no emite facturas en nombre de usuarios por transacciones P2P.',
      },
    ],
  },
  {
    id: 'comunidad',
    title: 'Normas de la comunidad',
    titleAr: 'قواعد المجتمع',
    summary: 'Convivencia, respeto cultural y uso responsable del espacio comunitario.',
    blocks: [
      {
        type: 'p',
        text: 'Lefrig existe para servir al pueblo saharaui con dignidad, confianza y utilidad práctica. Estas normas complementan los Términos y aplican a mercado, chat, foro y necesidades urgentes.',
      },
      { type: 'h3', text: '1. Respeto y dignidad' },
      {
        type: 'ul',
        items: [
          'Trata a cada persona con respeto, con independencia de campamento, género, edad o situación en la diáspora.',
          'Está prohibido el acoso, insultos, amenazas o contenido que humille a la comunidad.',
          'Respeta la identidad saharaui, la lengua hassanía/árabe y la diversidad de experiencias.',
        ],
      },
      { type: 'h3', text: '2. Comercio honesto' },
      {
        type: 'ul',
        items: [
          'Describe con exactitud lo que vendes o ofreces.',
          'No publiques el mismo artículo en múltiples categorías de forma abusiva.',
          'Responde en un plazo razonable a mensajes de compradores interesados.',
          'Si ya no está disponible, marca o retira el anuncio.',
        ],
      },
      { type: 'h3', text: '3. Seguridad' },
      {
        type: 'ul',
        items: [
          'Quedadas en lugares públicos y conocidos cuando sea posible.',
          'No compartas contraseñas, códigos OTP ni datos bancarios completos por chat.',
          'Reporta comportamiento sospechoso desde soporte o disputas.',
          'Las publicaciones de necesidades urgentes deben ser veraces; el abuso resta credibilidad a quien realmente necesita ayuda.',
        ],
      },
      { type: 'h3', text: '4. Contenido sensible' },
      {
        type: 'p',
        text: 'Fotos de personas requieren su consentimiento. No publiques documentos de identidad completos visibles. Contenido médico o legal sensibles debe tratarse con prudencia y solo cuando sea estrictamente necesario.',
      },
      { type: 'h3', text: '5. Consecuencias' },
      {
        type: 'p',
        text: 'Incumplimientos leves: aviso. Reincidencia o fraude: retirada de contenido, pérdida de badges, suspensión temporal o permanente. Decisiones graves pueden consultarse con referentes comunitarios cuando el proceso lo permita.',
      },
    ],
  },
  {
    id: 'propiedad',
    title: 'Propiedad intelectual',
    titleAr: 'الملكية الفكرية',
    summary: 'Derechos sobre marcas, contenido de usuarios y reclamaciones DMCA-style.',
    blocks: [
      { type: 'h3', text: '1. Marca Lefrig' },
      {
        type: 'p',
        text: '«Lefrig», el logotipo de la rosa de los vientos y elementos distintivos no pueden usarse sin autorización para sugerir patrocinio o afiliación oficial.',
      },
      { type: 'h3', text: '2. Contenido de terceros' },
      {
        type: 'p',
        text: 'Si crees que un anuncio o imagen infringe tu copyright o marca, escribe a hola@lefrig.app con: identificación de la obra, URL en Lefrig, tus datos de contacto y declaración de buena fe. Retiraremos contenido manifestamente infractor mientras evaluamos.',
      },
      { type: 'h3', text: '3. Contra-notificación' },
      {
        type: 'p',
        text: 'Si tu contenido fue retirado por error, puedes enviar contra-notificación explicando la autorización que tienes para usar el material.',
      },
    ],
  },
  {
    id: 'accesibilidad',
    title: 'Accesibilidad y disponibilidad',
    titleAr: 'إمكانية الوصول',
    summary: 'Compromiso con uso en conectividad limitada y mejora continua.',
    blocks: [
      {
        type: 'p',
        text: 'Lefrig se diseña pensando en campamentos con conectividad intermitente: interfaces ligeras, acciones claras y sincronización cuando vuelva la red.',
      },
      {
        type: 'ul',
        items: [
          'Procuramos contraste legible y navegación por teclado en la web.',
          'Algunas funciones (subida de fotos, chat en tiempo real) requieren conexión activa.',
          'Informa de barreras de acceso en hola@lefrig.app para priorizar mejoras.',
        ],
      },
    ],
  },
];

export const LEGAL_QUICK_LINKS = LEGAL_DOCUMENTS.map((d) => ({
  id: d.id,
  title: d.title,
  href: `#${d.id}`,
}));
