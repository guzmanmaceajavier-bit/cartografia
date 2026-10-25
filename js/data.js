const CATEGORIAS = {
  delimitacion: {
    seccion: 1,
    nombre: "Delimitación y nombre del territorio",
    color: "#102D4F",
    simbolo: "◎",
    descripcion: "Nombre del territorio o comunidad, municipio y departamento, con su límite oficial o aproximado. Es el marco de toda la cartografía: no lleva marcadores."
  },
  lugares: {
    seccion: 2,
    nombre: "Lugares significativos",
    color: "#0E7490",
    simbolo: "⬢",
    descripcion: "Sitios importantes para la vida del territorio: cabecera, zona rural, vías, espacios públicos y lugares de encuentro."
  },
  afectaciones: {
    seccion: 3,
    nombre: "Afectaciones y huellas de la violencia",
    color: "#9B1C1C",
    simbolo: "✕",
    descripcion: "Lugares, acontecimientos o situaciones de violencia, desplazamiento, amenazas, desapariciones, confrontaciones o exclusión que marcaron a la comunidad."
  },
  actores: {
    seccion: 4,
    nombre: "Actores sociales, comunitarios y eclesiales",
    color: "#1D4ED8",
    simbolo: "◉",
    descripcion: "Comunidades, organizaciones sociales, iglesias, instituciones públicas, organizaciones de víctimas, líderes comunitarios, jóvenes e iniciativas de paz."
  },
  resistencia: {
    seccion: 5,
    nombre: "Experiencias de resistencia y construcción de paz",
    color: "#15803D",
    simbolo: "✊",
    descripcion: "Acciones que protegieron la vida y promovieron reconciliación: procesos comunitarios, acompañamiento a víctimas, educación para la paz, defensa de derechos, memoria e incidencia."
  },
  memoria: {
    seccion: 6,
    nombre: "Lugares y experiencias de memoria",
    color: "#6D28D9",
    simbolo: "✦",
    descripcion: "Sitios donde ocurrieron hechos importantes, monumentos, templos, espacios comunitarios y experiencias para recordar a las víctimas y comprender la historia."
  },
  esperanza: {
    seccion: 7,
    nombre: "Signos de esperanza y reconciliación",
    color: "#C9A227",
    simbolo: "☀",
    descripcion: "Personas, organizaciones, lugares y prácticas que representan posibilidades de transformación y esperanza para la comunidad."
  },
  retos: {
    seccion: 8,
    nombre: "Retos actuales para la construcción de paz",
    color: "#C2410C",
    simbolo: "▲",
    descripcion: "Situaciones que hoy dificultan la convivencia y la reconciliación, identificadas en el reconocimiento del territorio."
  }
};

const SECCION_REFLEXION = {
  nombre: "Reflexión final (espacio narrativo)",
  descripcion: "¿Cómo se ha encarnado la teología de paz en este territorio? Interpretación de las experiencias, con un reto y una oportunidad concretos. No es un marcador del mapa."
};

const ESTADOS = {
  documentado: { nombre: "Documentado", descripcion: "Hecho con fuente verificable: informe, prensa, libro o registro oficial." },
  testimonio: { nombre: "Testimonio", descripcion: "Relato oral de la comunidad, recogido con autorización; contrastar con otras fuentes." },
  pendiente: { nombre: "Pendiente", descripcion: "Información que aún debe confirmarse con observación o fuentes." }
};

const TIPOS_RELACION = {
  respuesta: { nombre: "Respuesta a", descripcion: "Acción o iniciativa que responde a esta afectación", color: "#15803D", simbolo: "↪" },
  relacionada: { nombre: "Relacionado con", descripcion: "Conexión temática o contextual", color: "#1D4ED8", simbolo: "↔" },
  causa: { nombre: "Causa de", descripcion: "Factor que originó esta situación", color: "#9B1C1C", simbolo: "→" },
  consecuencia: { nombre: "Consecuencia de", descripcion: "Resultado o efecto derivado", color: "#C2410C", simbolo: "←" },
  ubicacion: { nombre: "Ubicación de", descripcion: "Lugar donde ocurre el hecho", color: "#102D4F", simbolo: "📍" },
  parte: { nombre: "Parte de", descripcion: "Componente o componente de un todo mayor", color: "#6D28D9", simbolo: "⊂" },
  contiene: { nombre: "Contiene a", descripcion: "Incluye o abarca este elemento", color: "#6D28D9", simbolo: "⊃" },
  sucede: { nombre: "Sucede en", descripcion: "Evento que ocurre en este lugar", color: "#0E7490", simbolo: "📍" },
  involucra: { nombre: "Involucra a", descripcion: "Actor o grupo que participa", color: "#1D4ED8", simbolo: "👥" },
  documenta: { nombre: "Documenta", descripcion: "Fuente que registra este hecho", color: "#0E7490", simbolo: "📄" },
  opone: { nombre: "Se opone a", descripcion: "Resistencia o rechazo a esta situación", color: "#C2410C", simbolo: "✊" }
};

const TIPOS_FUENTE = {
  observacion: { nombre: "Observación directa", descripcion: "Registro propio a partir de la visita o observación del territorio." },
  testimonio: { nombre: "Testimonio autorizado", descripcion: "Relato oral de personas de la comunidad, recogido con consentimiento." },
  documento: { nombre: "Documento o informe", descripcion: "Informes, libros, artículos o publicaciones consultadas." },
  prensa: { nombre: "Prensa", descripcion: "Medios de comunicación escritos, radio o televisión." },
  oficial: { nombre: "Registro oficial", descripcion: "Entidades públicas, sentencias, resoluciones o registros estatales." },
  otro: { nombre: "Otra fuente", descripcion: "Cualquier otra fuente que no encaje en las anteriores." }
};

const METODOLOGIA = [
  "Reconocimiento del territorio a partir de observación directa, conversaciones con habitantes, testimonios, memoria comunitaria y fuentes disponibles.",
  "Cada registro se clasifica en una sola categoría principal (02 a 08) y se le asignan por separado: estado de verificación y tipo de fuente. Un testimonio no equivale a un registro falso ni a uno confirmado: se indica que es testimonio y si está pendiente de corroboración.",
  "Se evitan duplicados: un mismo actor puede participar en varias iniciativas sin crear fichas repetidas; los nombres, descripciones y datos se completan en una sola ficha por elemento.",
  "Criterios de verificación: «Documentado» exige fuente verificable; «Testimonio» registra relato oral autorizado; «Pendiente» marca lo que debe confirmarse.",
  "Ética de protección: no se publican nombres de víctimas, domicilios precisos ni ubicaciones sensibles de personas amenazadas sin autorización. En casos de riesgo se usan ubicaciones generalizadas y se protege la identidad."
];

const FUENTES_BASE = [
  { nombre: "Guía «Huellas del conflicto y de la violencia» (trabajo del módulo)", detalle: "Documento de la consigna: huellas del conflicto, actores del territorio y memorias y lugares significativos, con sus subtemas (despojo, barrios de la violencia, amenazas a líderes, violencias de género, pago de vacunas, entre otros).", tipo: "documento" },
  { nombre: "Límite municipal de Sahagún", detalle: "OpenStreetMap (relación administrativa de Sahagún, Córdoba), descargada vía Nominatim.", tipo: "oficial" },
  { nombre: "Módulo Teología de la Paz en Colombia", detalle: "La Experiencia de Justapaz: marco conceptual de la cartografía.", tipo: "documento" },
  { nombre: "Alerta Temprana N.º 011 de 2024", detalle: "Defensoría del Pueblo de Colombia: riesgo por la expansión territorial del Frente Javier Yepes Cantero (AGC) en Sahagún y corredores viales a Chinú, Ciénaga de Oro y San Andrés de Sotavento.", tipo: "oficial" },
  { nombre: "Verificación de hechos del conflicto", detalle: "Informes de la JEP, la Comisión de la Verdad y el Centro de Memoria Histórica (referencias regionales y nacionales por contrastar con el caso de Sahagún).", tipo: "documento" },
  { nombre: "Datos de población y desplazamiento", detalle: "DANE y Unidad de Víctimas (por contrastar con cifras municipales).", tipo: "oficial" },
  { nombre: "Prensa regional y nacional", detalle: "Artículos sobre la Ciudadela de la Convivencia, la justicia transicional y el sur de Córdoba.", tipo: "prensa" }
];

const FUENTES_PERSONALIZADAS = [
  // Se llenan dinámicamente por el usuario
];

const SIMBOLOS_CAMPO = {
  "Sin símbolo específico": "•",
  "Comercio": "🏪",
  "Extorsión / vacunas": "💸",
  "Amenazas": "⚠️",
  "Homicidios": "🕯️",
  "Desaparición": "❓",
  "Desplazamiento": "🏃",
  "Hurtos": "🔓",
  "Conflicto armado": "🛡️",
  "Finca": "🏡",
  "Ganadería": "🐄",
  "Cultivos / agricultura": "🌾",
  "Colegio": "🏫",
  "Escuela de fútbol": "⚽",
  "Iglesia": "⛪",
  "Comunidad indígena": "🪶",
  "Jóvenes": "🧑‍🤝‍🧑",
  "Hospital / salud": "🏥",
  "Bomberos": "🚒",
  "Policía": "👮",
  "Alcaldía": "🏛️",
  "ICBF / protección infantil": "🧒",
  "Arte y danza": "💃",
  "Parque / plaza": "🏞️",
  "Transporte / vías": "🚌",
  "Organización comunitaria": "🤝",
  "Memoria de las víctimas": "🕯️",
  "Resistencia y paz": "✊",
  "Esperanza / reconciliación": "☀️",
};

const CONFIGURACION_INICIAL = {
  participante: "",
  nombreTerritorio: "Municipio de Sahagún, Córdoba",
  municipio: "Sahagún",
  departamento: "Córdoba",
  mostrarNombres: true,
  descripcionTerritorio: "Municipio del departamento de Córdoba, Colombia, en la región de las Sabanas, atravesado por la Troncal del Caribe. Cabecera municipal, corregimientos y zona rural: territorio de memoria, resistencia y esperanza.",
  centro: { lat: 8.8, lng: -75.41, zoom: 11 },
  mostrarLimite: true,
  limite: typeof LIMITE_OFICIAL !== "undefined" ? LIMITE_OFICIAL : null
};

const REFLEXION_INICIAL = {
  texto: "¿Cómo se ha encarnado la teología de paz en este territorio o comunidad? Relacione lo observado con la dignidad humana, la defensa de la vida, la memoria, la reconciliación y la paz.",
  reto: "",
  oportunidad: ""
};

  // Los temas y sus ubicaciones se crean a partir de la indagación real del territorio.

const FICHAS_INICIALES = [
  {
    id: "semilla-00",
    nombre: "Municipio de Sahagún, Córdoba",
    categoria: "lugares",
    subtema: "Territorio seleccionado",
    lat: null,
    lng: null,
    precision: "sin",
    descripcion: "Territorio marco de la cartografía. Complete los registros a partir de la observación, conversaciones con habitantes, testimonios autorizados, memoria comunitaria y fuentes disponibles.",
    historia: "",
    actores: "",
    fecha: "",
    fuente: "",
    tipoFuente: "",
    estado: "pendiente",
    tipo_registro: "territorio",
    territorio_padre: "",
    evidencias: "",
    observaciones: "Este registro sirve para vincular lugares y hechos concretos con el municipio. El límite municipal se representa por separado en el mapa.",
    aporte: "",
    anonimo: false,
    visible: false,
    creado: "2026-10-23T00:00:00.000Z"
  }
];


// Registros iniciales respaldados por fuentes públicas. Se agregan mediante migración
// sin reemplazar los temas que la persona ya haya creado.
const IDEAS_VERIFICADAS_INICIALES = [
  {
    id: "fuente-alerta-011-24-sahagun",
    nombre: "Alerta Temprana 011-24: riesgo advertido para Sahagún",
    descripcion: "La Defensoría del Pueblo emitió esta alerta el 12 de abril de 2024 e incluyó a Sahagún entre los municipios advertidos. La alerta describe riesgos regionales asociados a la presencia y actuación de las AGC y llama a medidas de prevención y protección. Importante: una alerta de riesgo no demuestra que haya ocurrido un hecho específico en cada vereda o punto del mapa.",
    fecha: "2024-04-12",
    categoria: "retos",
    territorio: "Municipio de Sahagún, Córdoba",
    color: "#C2410C",
    simbolo: "▲",
    fuente: "https://alertastempranas.defensoria.gov.co/Alerta/Details/91909",
    ubicaciones: [{
      id: "ubi-alerta-011-24-sahagun",
      nombre: "Ámbito territorial advertido en la alerta",
      lugar: "Sahagún y localidades rurales enumeradas en la Alerta Temprana 011-24, Córdoba",
      descripcion: "La alerta incluye, entre otras localidades, El Viajano, Las Llanadas, San Andresito, Colombo, El Crucero, Las Bocas, Catalina, Rodania, Dividivi, Los Amarillos, Arenas del Norte, Salguerito y Salitral. La inclusión indica ámbito de riesgo advertido, no prueba un incidente particular en cada lugar. Fuente PDF: https://alertasstg.blob.core.windows.net/alertas/011-24.pdf",
      fecha: "2024-04-12",
      categoria: "retos",
      simboloCampo: "Amenazas",
      lat: null,
      lng: null,
      precision: "sin",
      creado: "2026-10-25T00:00:00.000Z"
    }],
    creado: "2026-10-25T00:00:00.000Z"
  },
  {
    id: "fuente-memoria-cnmh-sahagun-2019",
    nombre: "Memoria de las víctimas: «Me levanté contigo en la cabeza»",
    descripcion: "El Centro Nacional de Memoria Histórica documentó la construcción de un especial digital sobre los daños del Bloque Córdoba a la población civil, con perfiles biográficos de ocho víctimas elaborados en concertación con sus familias durante el segundo semestre de 2018. El lanzamiento en Sahagún fue anunciado para el 12 de septiembre de 2019. Esta fecha corresponde al evento de presentación, no a la fecha de todos los hechos recordados.",
    fecha: "2019-09-12",
    categoria: "memoria",
    territorio: "Sahagún, Córdoba",
    color: "#6D28D9",
    simbolo: "✦",
    fuente: "https://centrodememoriahistorica.gov.co/lanzamiento-de-me-levante-contigo-en-la-cabeza/",
    ubicaciones: [{
      id: "ubi-memoria-cnmh-escuela-bellas-artes",
      nombre: "Presentación del especial de memoria del CNMH",
      lugar: "Escuela de Bellas Artes, carrera 11 n.º 16–68, barrio Centro, Sahagún, Córdoba (frente a la estación de Policía)",
      descripcion: "Lugar del evento de presentación anunciado por el CNMH para el 12 de septiembre de 2019. La fuente documenta el evento en este lugar, no que allí ocurrieran los hechos de violencia descritos.",
      fecha: "2019-09-12",
      categoria: "memoria",
      simboloCampo: "Memoria de las víctimas",
      lat: null,
      lng: null,
      precision: "sin",
      creado: "2026-10-25T00:00:00.000Z"
    }],
    creado: "2026-10-25T00:00:00.000Z"
  },
  {
    id: "fuente-reparacion-victimas-sahagun-2018",
    nombre: "Jornada de reparación administrativa a víctimas",
    descripcion: "El 24 de julio de 2018, la Unidad para las Víctimas informó que 86 personas recibieron cartas de notificación de indemnización en Sahagún, por un monto total superior a $1.089 millones. La entidad indicó que la mayoría había sufrido homicidio de familiares o lesiones personales. Esta cifra corresponde a esa jornada; no es el total de víctimas del municipio.",
    fecha: "2018-07-24",
    categoria: "esperanza",
    territorio: "Sahagún, Córdoba",
    color: "#C9A227",
    simbolo: "☀",
    fuente: "https://portalhistorico.unidadvictimas.gov.co/es/reparacion/en-sahagun-cordoba-indemnizadas-86-victimas-del-conflicto-armado/43071",
    ubicaciones: [{
      id: "ubi-reparacion-victimas-sahagun-2018",
      nombre: "Jornada de notificación de indemnizaciones",
      lugar: "Municipio de Sahagún, Córdoba (la publicación no precisa la dirección del acto)",
      descripcion: "Registro territorial de una jornada documentada de reparación administrativa. Se deja sin punto en el mapa porque la fuente consultada no identifica una dirección exacta.",
      fecha: "2018-07-24",
      categoria: "esperanza",
      simboloCampo: "Esperanza / reconciliación",
      lat: null,
      lng: null,
      precision: "sin",
      creado: "2026-10-25T00:00:00.000Z"
    }],
    creado: "2026-10-25T00:00:00.000Z"
  },
  {
    id: "fuente-nuevo-mexico-sahagun-2024",
    nombre: "Acceso campesino a la tierra: finca Nuevo México",
    descripcion: "El 23 de agosto de 2024 se informó que la Sociedad de Activos Especiales entregó a la Agencia Nacional de Tierras la finca Nuevo México, de 497 hectáreas, para beneficiar a campesinos de Sahagún mediante la organización Asocamila. La ubicación rural exacta no queda confirmada en la fuente consultada, por lo que no se asignan coordenadas.",
    fecha: "2024-08-23",
    categoria: "resistencia",
    territorio: "Zona rural de Sahagún, Córdoba",
    color: "#15803D",
    simbolo: "✊",
    fuente: "https://www.wradio.com.co/2024/08/23/lujosa-finca-del-exsenador-musa-besaile-pasa-a-manos-de-campesinos-en-cordoba/",
    ubicaciones: [{
      id: "ubi-nuevo-mexico-sahagun-2024",
      nombre: "Finca Nuevo México",
      lugar: "Zona rural de Sahagún, Córdoba; punto catastral pendiente de confirmar",
      descripcion: "Predio de 497 hectáreas cuya entrega a la ANT fue reportada el 23 de agosto de 2024 para beneficiar a campesinos a través de Asocamila. No utilizar el centro urbano de Sahagún como coordenada de la finca.",
      fecha: "2024-08-23",
      categoria: "resistencia",
      simboloCampo: "Cultivos / agricultura",
      lat: null,
      lng: null,
      precision: "sin",
      creado: "2026-10-25T00:00:00.000Z"
    }],
    creado: "2026-10-25T00:00:00.000Z"
  },
  {
    id: "fuente-la-macarena-sahagun-2025",
    nombre: "Acceso a la tierra para mujeres rurales: predio La Macarena",
    descripcion: "La Agencia Nacional de Tierras informó en julio de 2025 sobre una iniciativa de acceso a la tierra que benefició a 100 mujeres campesinas de Planeta Rica y Sahagún. La publicación incluye el predio La Macarena, de 222 hectáreas, en Sahagún. Es distinto de la finca Nuevo México. La fuente consultada no ofrece coordenadas catastrales del predio.",
    fecha: "2025-07-16",
    categoria: "esperanza",
    territorio: "Sahagún, Córdoba",
    color: "#C9A227",
    simbolo: "☀",
    fuente: "https://www.ant.gov.co/prensa/noticias/de-los-terratenientes-a-las-mujeres-rurales-1162-hectareas-listas-para-sembrar-en-cordoba",
    ubicaciones: [{
      id: "ubi-la-macarena-sahagun-2025",
      nombre: "Predio La Macarena",
      lugar: "Zona rural de Sahagún, Córdoba; ubicación catastral pendiente de confirmar",
      descripcion: "Predio de 222 hectáreas citado por la ANT en su publicación sobre acceso a tierras para mujeres rurales. No se asigna coordenada exacta sin una referencia catastral o cartográfica oficial.",
      fecha: "2025-07-16",
      categoria: "esperanza",
      simboloCampo: "Esperanza / reconciliación",
      lat: null,
      lng: null,
      precision: "sin",
      creado: "2026-10-25T00:00:00.000Z"
    }],
    creado: "2026-10-25T00:00:00.000Z"
  }
];

const REFLEXION_DOCUMENTADA = {
  texto: "La cartografía de paz de Sahagún permite reconocer que la paz no consiste únicamente en que cesen los enfrentamientos: también requiere memoria, protección, justicia, reparación y condiciones dignas para reconstruir la vida comunitaria. Las fuentes públicas consultadas muestran procesos concretos: el trabajo del Centro Nacional de Memoria Histórica con familias de víctimas del Bloque Córdoba; una jornada de indemnización a víctimas registrada por la Unidad para las Víctimas en 2018; la alerta preventiva de la Defensoría del Pueblo de 2024; y procesos de acceso campesino a la tierra documentados en 2024 y 2025. Estos procesos no borran el daño ni prueban por sí solos una reconciliación completa, pero ofrecen elementos para analizar responsabilidades y posibilidades de transformación.\n\nMateo 5–7 ilumina esta lectura. «Bienaventurados los que trabajan por la paz» (Mt 5,9) llama a una práctica comprometida con la justicia y la dignidad. Amar a los enemigos (Mt 5,44) no significa negar el daño ni reemplazar la justicia por impunidad; significa resistir la deshumanización y no reproducir la venganza. La regla de tratar a los demás como queremos ser tratados (Mt 7,12) invita a escuchar a las víctimas, proteger a quienes están en riesgo y construir relaciones respetuosas.\n\nLa Declaración Universal de Derechos Humanos refuerza esta responsabilidad: el artículo 3 reconoce el derecho a la vida, la libertad y la seguridad; el artículo 5 prohíbe la tortura y los tratos crueles, inhumanos o degradantes; y el artículo 8 reconoce el derecho a un recurso efectivo ante violaciones de derechos fundamentales. Por eso, una teología de paz no puede limitarse a pedir perdón o reconciliación: debe defender la vida, acompañar la búsqueda de verdad y reparación, y contribuir a garantías de no repetición.\n\nDesde la tradición anabautista, el discipulado de Jesús se expresa en la no violencia, la vida comunitaria, la reconciliación y el compromiso con quienes sufren. En Sahagún, esto implica escuchar a las familias afectadas sin apropiarse de sus historias, respetar al pueblo Zenú, apoyar procesos campesinos documentados y exigir protección efectiva para las comunidades. La cartografía debe reconocer tanto las huellas de la violencia como la dignidad y capacidad de acción de las personas del territorio.",
  reto: "Actualizar periódicamente la cartografía contrastando las alertas de la Defensoría con fuentes posteriores; verificar cada afectación con fecha y evidencia; y evitar publicar coordenadas o testimonios que puedan exponer a víctimas, comerciantes o liderazgos comunitarios.",
  oportunidad: "Usar los procesos públicos de memoria histórica, reparación y acceso a la tierra como puntos de partida para encuentros participativos con víctimas, comunidades campesinas, pueblo Zenú, jóvenes e iglesias, con consentimiento y sin atribuir programas o resultados que no hayan sido comprobados."
};
