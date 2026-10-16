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
  { nombre: "Guía «Huellas del conflicto y de la violencia» (trabajo del módulo)", detalle: "Documento de la consigna: huellas del conflicto, actores del territorio y memorias y lugares significativos, con sus subtemas (despojo, barrios de la violencia, amenazas a líderes, violencias de género, pago de vacunas, entre otros)." },
  { nombre: "Límite municipal de Sahagún", detalle: "OpenStreetMap (relación administrativa de Sahagún, Córdoba), descargada vía Nominatim." },
  { nombre: "Módulo Teología de la Paz en Colombia", detalle: "La Experiencia de Justapaz: marco conceptual de la cartografía." },
  { nombre: "Alerta Temprana N.º 011 de 2024", detalle: "Defensoría del Pueblo de Colombia: riesgo por la expansión territorial del Frente Javier Yepes Cantero (AGC) en Sahagún y corredores viales a Chinú, Ciénaga de Oro y San Andrés de Sotavento." },
  { nombre: "Verificación de hechos del conflicto", detalle: "Informes de la JEP, la Comisión de la Verdad y el Centro de Memoria Histórica (referencias regionales y nacionales por contrastar con el caso de Sahagún)." },
  { nombre: "Datos de población y desplazamiento", detalle: "DANE y Unidad de Víctimas (por contrastar con cifras municipales)." },
  { nombre: "Prensa regional y nacional", detalle: "Artículos sobre la Ciudadela de la Convivencia, la justicia transicional y el sur de Córdoba." }
];

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
  texto: `¿Cómo se ha encarnado la teología de paz en este territorio o comunidad?

Sugerencias para escribir su reflexión (borre estas líneas y escriba con sus propias palabras):

1. Territorio y personas: describa brevemente Sahagún como espacio de vida, trabajo, fe y convivencia, y explique por qué lo seleccionó.

2. Huellas de la violencia: reconozca cómo la violencia marcó el territorio (desplazamiento, amenazas, pérdida de seres queridos, exclusión, disputa de la tierra) desde una fe que profesa la dignidad de toda persona y la defensa de la vida.

3. Memoria como ministerio: relate cómo la comunidad recuerda a sus víctimas y qué nos enseña la memoria bíblica (Dt 6,21-23: «recuerda que fuiste esclavo») sobre el deber de no olvidar.

4. Resistencia y reconciliación: señale las experiencias de resistencia no violenta, el trabajo de las iglesias, las organizaciones de víctimas, las iniciativas juveniles y los proyectos que humanizan las relaciones. Pregúntese: ¿dónde aparece el perdón, la verdad y la reparación practicados, no solo proclamados?

5. Esperanza encarnada: destaque los signos de esperanza que encontró en el mapa (por ejemplo, experiencias de convivencia construidas sobre lugares de dolor) y vincúlelos con las bienaventuranzas: «Bienaventurados los que trabajan por la paz, porque serán llamados hijos de Dios» (Mt 5,9), palabra que da nombre y corazón a Justapaz.

6. Compromiso: concluya con un reto y una oportunidad concretos para la comunidad.`,
  reto: "Escriba aquí un reto concreto (ej.: recuperar el archivo de memoria comunitaria y el relato de los mayores antes de que se pierda).",
  oportunidad: "Escriba aquí una oportunidad concreta (ej.: convertir la Ciudadela de la Convivencia en un espacio de formación permanente en reconciliación para las juventudes de Sahagún)."
};

const FICHAS_INICIALES = [
  {
    id: "semilla-33",
    nombre: "Iglesia Cristiana Menonita en Sahagún (por completar)",
    categoria: "actores",
    subtema: "",
    precision: "sin",
    descripcion: "Ficha base para documentar la presencia y el trabajo de la Iglesia Cristiana Menonita en Sahagún. Complete con información verificada: sede o puntos de encuentro, responsables, actividades y su relación con la construcción de paz.",
    historia: "Registre aquí la historia de la llegada y el trabajo de la iglesia en el municipio, con fechas y testimonios autorizados.",
    actores: "Iglesia Cristiana Menonita, comunidad de fe local",
    fecha: "Por verificar",
    fuente: "Por verificar: observación directa, conversación con miembros de la iglesia.",
    tipoFuente: "",
    estado: "pendiente",
    evidencias: "",
    observaciones: "Ficha pendiente de completar con la indagación territorial. No ubicar en el mapa hasta confirmar la sede.",
    aporte: "",
    anonimo: false,
    visible: false,
    creado: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "semilla-34",
    nombre: "Pintando la Paz – Reconcíliate (por completar)",
    categoria: "resistencia",
    subtema: "",
    precision: "sin",
    descripcion: "Ficha base para documentar la iniciativa Pintando la Paz – Reconcíliate: qué actividades se realizaron, quiénes participaron, dónde y cuándo, y qué aporte tuvo para la convivencia y la resolución pacífica de conflictos. Distinga actividades realizadas de planeadas y use solo fotografías autorizadas.",
    historia: "Registre aquí el relato de la experiencia con fechas, lugares y testimonios autorizados.",
    actores: "Iglesia Cristiana Menonita, familias, juventudes",
    fecha: "Por verificar",
    fuente: "Por verificar: registros de la actividad, fotografías autorizadas, testimonios.",
    tipoFuente: "",
    estado: "pendiente",
    evidencias: "",
    observaciones: "Ficha pendiente de completar con la indagación territorial.",
    aporte: "",
    anonimo: false,
    visible: false,
    creado: "2026-01-01T00:00:00.000Z"
  }
];
