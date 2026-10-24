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
  ganadería: "🐄",
  escuelas: "🏫",
  parques: "🏞️",
  iglesias: "⛪",
  jóvenes: "👥",
  fincas: "🏡",
  agrícolas: "🌾",
  salud: "🏥",
  comercio: "🏪",
  transporte: "🚌",
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
