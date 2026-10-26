(function () {
  "use strict";

  const CLAVE = "cartografia_paz_sahagun_v1";
  const VERSION = 4;

  let estado = null;
  let mapa = null;
  let capasBase = {};
  let capaBaseActual = null;
  let capaEtiquetas = null;
  let erroresBase = {};
  let capaLimite = null;
  let capaMarcadores = null;
  let capaZonas = null;
  let marcadores = {};
  let modoUbicar = false;
  let fichaSeleccionada = null;
  let seccionActual = "mapa";
  let chipLugares = "todas";
  let soloVerificados = false;
  let paginaIdeas = 1;
  const ubicacionesExpandidas = new Set();
  const IDEAS_POR_PAGINA = 4;
  const UBICACIONES_INICIALES = 4;

  // Herramientas de dibujo
  let dibujoTool = null;
  let colorActivo = "#C9A227";
  let dibujoTmp = null;
  let clicZona = false;
  let zonaLayers = {};
  let capaVerticesEdicion = null;
  let zonaEditandoVertices = null;
  let moveZona = null;
  let nubeTimer = null;
  let claveEditorNube = "";

const PALETA = ["#C9A227", "#102D4F", "#15803D", "#9B1C1C", "#6D28D9", "#1D4ED8", "#C2410C", "#5D6B7E"];

  // La persistencia en la nube se gestiona mediante guardarNube() y cargarNube(),
  // usando la función propia /api/estado. Nunca se guardan credenciales de base de datos
  // en el navegador: las variables sensibles deben permanecer en el entorno del servidor.

// ==================== HISTORIAL DE CAMBIOS ==================== //

function registrarCambio(accion, entidad, id, detalles) {
  if (!estado.historial) estado.historial = [];
  
  estado.historial.unshift({
    id: "hist-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    fecha: new Date().toISOString(),
    usuario: "participante",
    accion: accion, // "crear", "editar", "eliminar", "importar", "exportar"
    entidad: entidad, // "ficha", "idea", "ubicacion", "territorio", "convencion"
    idEntidad: id,
    detalles: detalles || {}
  });
  
  // Mantener solo últimos 500 cambios
  if (estado.historial.length > 500) {
    estado.historial = estado.historial.slice(0, 500);
  }
}

function pintarHistorial() {
  const cont = $("#historialLista");
  if (!cont) return;
  
  const historial = estado.historial || [];
  if (!historial.length) {
    cont.innerHTML = "<p class='vacio'>No hay cambios registrados aún.</p>";
    return;
  }
  
  cont.innerHTML = historial.slice(0, 100).map((h) => `
    <div class="historial-item" style="padding: 8px; border-bottom: 1px solid var(--borde);">
      <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;">
        <strong>${escapar(h.usuario)}</strong>
        <span style="color:var(--tinta-suave);font-size:0.7rem;">${new Date(h.fecha).toLocaleString()}</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <span class="etiqueta etiqueta--${h.accion}">${escapar(h.accion)}</span>
        <span class="etiqueta" style="background:${CATEGORIAS[h.entidad]?.color || "#5D6B7E"}">${escapar(h.entidad)}</span>
        <span style="color:var(--tinta-suave);font-size:0.75rem;">${escapar(h.idEntidad)}</span>
      </div>
      <div style="font-size:0.75rem;color:var(--tinta-suave);margin-top:4px;">
        ${escapar(JSON.stringify(h.detalles)).slice(0, 200)}${JSON.stringify(h.detalles).length > 200 ? "…" : ""}
      </div>
    </div>
  `).join("");
}

function abrirModalHistorial() {
  pintarHistorial();
  abrirModal("modalHistorial");
}

// La cartografía se puede consultar y editar sin inicio de sesión.

const CATEGORIAS_BASE = clonar(CATEGORIAS);

  const SIMBOLOS = ["◎", "◉", "○", "●", "✕", "✖", "✚", "▲", "■", "◆", "♦", "★", "✦", "☀", "✊", "➤", "◈", "⬟", "⬢", "♥", "📍", "🏛️", "🏘️", "🏠", "🏡", "🏫", "🎓", "⛪", "🕌", "🏥", "🚒", "👮", "🛡️", "⚠️", "💸", "🔫", "🕯️", "❓", "🏃", "🔓", "🌾", "🐄", "⚽", "🪶", "🧑‍🤝‍🧑", "🤝", "💃", "🏞️", "🚌", "☀️", "🕊️", "🌱", "❤️", "📖", "✝️", "👥", "🧒", "🗣️", "💧", "🌳", "🚩", "🧭", "📌"];

  const NOMBRES_SIMBOLOS = {"◎":"territorio delimitación ubicación","◉":"actores comunidad","✕":"violencia afectación","▲":"retos alertas","✦":"memoria","☀":"esperanza","✊":"resistencia paz","📍":"ubicación punto","🏛️":"alcaldía institución","🏘️":"barrio comunidad","🏠":"vivienda","🏡":"finca","🏫":"colegio escuela","🎓":"educación","⛪":"iglesia templo","🕌":"templo","🏥":"hospital salud","🚒":"bomberos","👮":"policía","🛡️":"protección conflicto","⚠️":"amenaza riesgo","💸":"extorsión vacunas","🔫":"violencia armada","🕯️":"memoria víctimas","❓":"desaparición","🏃":"desplazamiento","🔓":"hurto robo","🌾":"cultivos agricultura","🐄":"ganadería","⚽":"fútbol deporte","🪶":"comunidad indígena","🧑‍🤝‍🧑":"jóvenes personas","🤝":"organización comunitaria","💃":"arte danza","🏞️":"parque plaza","🚌":"transporte vías","☀️":"esperanza reconciliación","🕊️":"paz","🌱":"vida renovación","❤️":"cuidado","📖":"documento testimonio","✝️":"iglesia fe","👥":"actores comunidad","🧒":"infancia protección","🗣️":"diálogo","💧":"agua","🌳":"naturaleza territorio","🚩":"alerta","🧭":"orientación","📌":"punto de interés"};

  const BASES = [
    {
      id: "calles",
      nombre: "Calles",
      descripcion: "Nombres de vías y lugares",
      thumb: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/9/243/148",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      opts: { maxZoom: 19, attribution: "Imágenes: Esri, HERE, Garmin, OpenStreetMap" },
      respaldo: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        opts: { maxZoom: 19, subdomains: "abcd", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' }
      }
    },
    {
      id: "satelite",
      nombre: "Satélite",
      descripcion: "Casas y terrenos vistos desde arriba",
      thumb: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/9/243/148",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      opts: { maxZoom: 19, attribution: "Imágenes: Esri, Maxar, Earthstar Geographics" }
    },
    {
      id: "hibrido",
      nombre: "Híbrido",
      descripcion: "Satélite con vías y nombres",
      thumb: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/9/243/148",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      opts: { maxZoom: 19, attribution: "Imágenes: Esri, Maxar, Earthstar Geographics" },
      overlays: [
        {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
          opts: { maxZoom: 19, attribution: "Vías: Esri" }
        },
        {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          opts: { maxZoom: 19, attribution: "Etiquetas: Esri" }
        }
      ]
    },
    {
      id: "terreno",
      nombre: "Terreno",
      descripcion: "Relieve del territorio",
      thumb: "https://a.tile.opentopomap.org/9/148/243.png",
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      opts: { maxZoom: 17, subdomains: "abc", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>' },
      respaldo: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
        opts: { maxZoom: 19, attribution: "Terreno: Esri, USGS, NOAA" }
      }
    }
  ];

  const VISTAS_ANTERIORES = { mapa: "calles", relieve: "terreno", claro: "calles", humanitario: "calles" };

  const URL_ETIQUETAS = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function nuevoId() {
    return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapar(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizar(txt) {
    return String(txt || "").trim().toLowerCase();
  }

  function migrar(datos) {
    datos.version = VERSION;
    datos.zonas = Array.isArray(datos.zonas) ? datos.zonas : [];

    datos.ideas = Array.isArray(datos.ideas) ? datos.ideas : [];
    if (!datos.reflexion || typeof datos.reflexion !== "object") datos.reflexion = clonar(REFLEXION_INICIAL);
    const idsIdeasExistentes = new Set(datos.ideas.map((idea) => idea && idea.id).filter(Boolean));
    (typeof IDEAS_VERIFICADAS_INICIALES !== "undefined" ? IDEAS_VERIFICADAS_INICIALES : []).forEach((idea) => {
      if (idea && idea.id && !idsIdeasExistentes.has(idea.id)) {
        datos.ideas.push(clonar(idea));
        idsIdeasExistentes.add(idea.id);
      }
    });
    const reflexionTexto = String(datos.reflexion.texto || "");
    if (typeof REFLEXION_DOCUMENTADA !== "undefined" &&
        (!reflexionTexto.trim() || reflexionTexto === REFLEXION_INICIAL.texto ||
         reflexionTexto.includes("Sugerencias para escribir su reflexión"))) {
      datos.reflexion.texto = REFLEXION_DOCUMENTADA.texto;
    }
    if (typeof REFLEXION_DOCUMENTADA !== "undefined") {
      if (!String(datos.reflexion.reto || "").trim() || String(datos.reflexion.reto).startsWith("Escriba aquí")) datos.reflexion.reto = REFLEXION_DOCUMENTADA.reto;
      if (!String(datos.reflexion.oportunidad || "").trim() || String(datos.reflexion.oportunidad).startsWith("Escriba aquí")) datos.reflexion.oportunidad = REFLEXION_DOCUMENTADA.oportunidad;
    }
    const ideaPorNombre = (fragmento) => datos.ideas.find((idea) => normalizar(idea.nombre).includes(normalizar(fragmento)));
    const descripcionesIniciales = [
      ["huellas de la violencia", "Este tema conserva observaciones iniciales sobre posibles afectaciones en el comercio y el centro urbano. Las afirmaciones concretas sobre extorsión y hurtos requieren fecha, fuente y corroboración independiente; no deben presentarse como hechos confirmados hasta verificarlas."],
      ["lugares significativos", "Reúne lugares urbanos, rurales, culturales y territoriales considerados significativos en el trabajo inicial. Cada afirmación histórica requiere una fuente específica. Los territorios de otros municipios son contexto regional, no ubicaciones dentro de Sahagún."],
      ["actores sociales", "Mapa de actores institucionales, comunitarios y eclesiales. La presencia de una institución no prueba que haya desarrollado una acción específica de paz; documentar actividad, fecha y fuente antes de afirmarlo."],
      ["arte y danza folclorica", "Línea de investigación sobre cultura, deporte y educación como posibles experiencias de resistencia. Las afirmaciones de que una actividad previene el reclutamiento requieren documentación o testimonios autorizados. Los lugares de otros municipios son contexto regional."],
      ["signos de esperanza", "Reúne lugares propuestos como signos de esperanza. Las afirmaciones sobre programas de reconciliación o resultados concretos requieren fuentes locales; no atribuirlos a una escuela o entidad sin evidencia."]
    ];
    descripcionesIniciales.forEach(([nombre, descripcion]) => {
      const idea = ideaPorNombre(nombre);
      if (idea && !String(idea.descripcion || "").trim()) idea.descripcion = descripcion;
    });
    datos.ideas.forEach((idea) => (idea.ubicaciones || []).forEach((ubi) => {
      const nombre = normalizar(ubi.nombre), lugar = normalizar(ubi.lugar), descripcion = String(ubi.descripcion || "");
      if (nombre.includes("calle del comercio")) {
        ubi.precision = "aproximada"; ubi.fecha = ""; ubi.simboloCampo = ubi.simboloCampo || "Extorsión / vacunas";
        if (!descripcion.startsWith("PENDIENTE DE CORROBORACIÓN")) ubi.descripcion = "PENDIENTE DE CORROBORACIÓN: el archivo inicial registra una observación sobre posibles cobros extorsivos, pero esta revisión no confirmó fecha, hecho ni responsables con una fuente pública. No presentarlo como hecho probado. Nota original: " + descripcion;
      } else if (nombre.includes("centro") && (lugar.includes("banco") || lugar.includes("sahagún")) && !descripcion.startsWith("PENDIENTE DE CORROBORACIÓN") && /rob|hurt/i.test(descripcion)) {
        ubi.precision = "aproximada"; ubi.fecha = ""; ubi.simboloCampo = ubi.simboloCampo || "Hurtos";
        ubi.descripcion = "PENDIENTE DE CORROBORACIÓN: el archivo inicial registra posibles hurtos en el sector bancario, pero no se confirmó fecha ni reporte concreto. No presentarlo como hecho probado. Nota original: " + descripcion;
      } else if (nombre.includes("finca nuevo méxico")) {
        ubi.lat = null; ubi.lng = null; ubi.precision = "sin"; ubi.fecha = "2024-08-23"; ubi.simboloCampo = "Cultivos / agricultura";
        ubi.lugar = "Finca Nuevo México, zona rural de Sahagún, Córdoba; punto catastral pendiente de confirmar";
        ubi.descripcion = "El 23 de agosto de 2024 se informó que la SAE entregó a la ANT la finca de 497 hectáreas para beneficiar a campesinos mediante Asocamila. La fuente consultada no confirma coordenadas catastrales; no usar el centro urbano como punto de la finca. Fuente: https://www.wradio.com.co/2024/08/23/lujosa-finca-del-exsenador-musa-besaile-pasa-a-manos-de-campesinos-en-cordoba/";
      } else if (nombre.includes("bajo grande")) {
        ubi.precision = "aproximada"; ubi.fecha = "";
        ubi.descripcion = "PENDIENTE DE VERIFICACIÓN: el archivo inicial menciona despojo y desplazamiento entre 1997 y 2005, pero esa cronología y los hechos concretos requieren una fuente específica para Bajo Grande. Mantener como línea de investigación hasta documentarlo.";
      } else if (nombre.includes("parroquia san juan bautista")) {
        ubi.descripcion = "Templo católico y lugar de referencia religiosa en el centro de Sahagún. Las afirmaciones específicas sobre refugio durante el conflicto o custodia de testimonios requieren documentación parroquial, fuentes históricas o testimonios autorizados.";
      } else if (nombre.includes("icbf")) {
        ubi.lat = null; ubi.lng = null; ubi.precision = "sin"; ubi.lugar = "Sahagún, Córdoba; sede específica pendiente de verificar";
        ubi.descripcion = "Actor institucional de protección de la niñez y las familias. Esta ficha no confirma una actividad local específica de construcción de paz; añadir sede, fecha y fuente si se documenta una intervención concreta.";
      } else if (nombre.includes("mesa municipal de víctimas")) {
        ubi.lat = null; ubi.lng = null; ubi.precision = "sin"; ubi.lugar = "Sahagún, Córdoba; lugar de reunión no verificado";
        ubi.descripcion = "El archivo inicial menciona la Mesa Municipal de Víctimas y colectivos de mujeres. Confirmar denominación vigente y acciones concretas con fuentes municipales o con las organizaciones antes de presentarlas como verificadas.";
      } else if (nombre.includes("policia nacional") && /Encuentros Comunitarios|Víctima/.test(descripcion)) {
        ubi.descripcion = "La Policía Nacional es un actor institucional presente en el municipio. Las actividades concretas de encuentros comunitarios, atención a víctimas o prevención mencionadas en el registro inicial requieren una fuente local.";
      } else if (nombre.includes("hospital") && /refugio|Misión Médica/.test(descripcion)) {
        ubi.descripcion = "El hospital es un actor de atención sanitaria. Las afirmaciones específicas del registro inicial sobre refugio durante el conflicto o programas de atención psicosocial requieren fuentes institucionales que las confirmen.";
      } else if (nombre.includes("cuerpo de bomberos") && /conflicto|zonas vulnerables/.test(descripcion)) {
        ubi.descripcion = "Actor institucional de respuesta a emergencias. Esta ficha no documenta una operación concreta relacionada con el conflicto o la construcción de paz; registrar fecha y fuente si se identifica una actuación específica.";
      } else if ((nombre.includes("escuelas de fútbol") || nombre.includes("sede deportiva efusa")) && /reclutamiento|barrera de protección/.test(descripcion)) {
        ubi.descripcion = "La ficha propone esta escuela deportiva como posible entorno protector. No se confirmó una evaluación o fuente específica que permita afirmar que haya prevenido el reclutamiento en este lugar. Documentar programa, periodo y fuente local antes de afirmar ese efecto.";
      } else if (nombre.includes("esc salitral") || nombre === "colomboy" || nombre === "las llanadas") {
        if (descripcion.length > 100 && !descripcion.startsWith("Interpretación propuesta")) ubi.descripcion = "Interpretación propuesta en el registro inicial, pendiente de corroboración con la comunidad y fuentes escolares. Las afirmaciones sobre zonas de paz, reconciliación o programas pedagógicos no están confirmadas por la Alerta Temprana 011-24. Nota original: " + descripcion;
      }
      if (nombre.includes("plaza maría varilla")) ubi.lugar = "Plaza María Varilla, San Pelayo, Córdoba (contexto regional; fuera de Sahagún)";
      if (nombre.includes("plaza cultural del sinú")) ubi.lugar = "Plaza Cultural del Sinú / Avenida Primera, Montería, Córdoba (contexto regional; fuera de Sahagún)";
      if (nombre.includes("cordobés fútbol club")) ubi.lugar = "Academia Cordobés Fútbol Club, Montería, Córdoba (contexto regional; fuera de Sahagún)";
      if (nombre.includes("santa teresa")) ubi.lugar = "Cancha Santa Teresa, Cereté, Córdoba (contexto regional; fuera de Sahagún)";
      if (nombre.includes("santa cruz de lorica")) ubi.lugar = "Santa Cruz de Lorica, Córdoba (contexto regional; fuera de Sahagún)";
      if (nombre.includes("cátedra de la paz") || lugar.includes("tierralta")) {
        if (!String(ubi.lugar || "").toLowerCase().includes("fuera de sahagún")) ubi.lugar = String(ubi.lugar || "Tierralta, Córdoba") + " (contexto regional; fuera de Sahagún)";
      }
      if (nombre.includes("centro de conciliación de la defensoría")) ubi.lugar = "Centro de Conciliación de la Defensoría del Pueblo, Montelíbano, Córdoba (contexto regional; fuera de Sahagún)";
      if (nombre.includes("casa de la cultura")) ubi.lugar = "Casa de la Cultura / Centro de Escucha, Tierralta, Córdoba (contexto regional; fuera de Sahagún)";
      if (nombre.includes("territorio ancestral zenú")) {
        ubi.precision = "aproximada";
        if (!String(ubi.lugar || "").toLowerCase().includes("fuera de sahagún")) ubi.lugar = String(ubi.lugar || "Territorio Zenú, Córdoba") + " (contexto regional; fuera de Sahagún)";
        if (/reclutar|refugios|resistencia espiritual/.test(descripcion)) ubi.descripcion = "Territorio relacionado con el pueblo Zenú. Las afirmaciones específicas sobre reclutamiento, protección cultural o hechos del conflicto requieren fuentes específicas y diálogo respetuoso con las autoridades Zenú; no se presentan como hechos confirmados.";
      }
    }));
    // Clasificación V2: repara registros ya guardados con la migración anterior.
    // La versión nueva fuerza la categoría correcta una vez incluso si V1 ya se ejecutó.
    if (!datos.meta || typeof datos.meta !== "object") datos.meta = {};
    if (!datos.meta.clasificacionOchoCategoriasV2) {
      const clasificacionesV2 = {
        "fuente-alerta-011-24-sahagun": { categoria: "retos", color: "#C2410C", simbolo: "▲", simboloCampo: "Amenazas" },
        "fuente-reparacion-victimas-sahagun-2018": { categoria: "resistencia", color: "#15803D", simbolo: "✊", simboloCampo: "Resistencia y paz" },
        "fuente-nuevo-mexico-sahagun-2024": { categoria: "resistencia", color: "#15803D", simbolo: "✊", simboloCampo: "Cultivos / agricultura" },
        "fuente-la-macarena-sahagun-2025": { categoria: "resistencia", color: "#15803D", simbolo: "✊", simboloCampo: "Cultivos / agricultura" }
      };
      datos.ideas.forEach((idea) => {
        if (!idea) return;
        const clasificacion = clasificacionesV2[idea.id];
        if (clasificacion) {
          idea.categoria = clasificacion.categoria;
          idea.color = clasificacion.color;
          idea.simbolo = clasificacion.simbolo;
          (idea.ubicaciones || []).forEach((ubi) => {
            ubi.categoria = clasificacion.categoria;
            ubi.simboloCampo = clasificacion.simboloCampo;
          });
        }
        if (idea.id === "idea-mvmxm3pmzq98e" &&
            normalizar(idea.nombre).includes("arte y danza folclorica")) {
          const tituloOriginal = idea.nombre;
          idea.nombre = "Experiencias de resistencia y construcción de paz";
          idea.categoria = "resistencia";
          idea.color = "#15803D";
          idea.simbolo = "✊";
          const resumenOriginal = "Reúne las experiencias registradas de arte y danza folclórica (porro y fandango), escuelas de fútbol como posibles entornos protectores, Cátedra de la Paz e instituciones educativas agropecuarias.";
          idea.descripcion = String(idea.descripcion || "").trim();
          if (!idea.descripcion) idea.descripcion = resumenOriginal + "\n\nTítulo original conservado: " + tituloOriginal;
          else if (!idea.descripcion.includes(tituloOriginal)) idea.descripcion += "\n\nTítulo original conservado: " + tituloOriginal;
          (idea.ubicaciones || []).forEach((ubi) => { ubi.categoria = "resistencia"; });
        }
      });
      datos.meta.clasificacionOchoCategoriasV2 = true;
    }
    // Integrar las fuentes documentadas en sus categorías existentes, sin crear temas
    // independientes en "Temas y ubicaciones". La fuente inicial sirve como respaldo
    // si una ejecución anterior ya retiró la idea pero no llegó a guardar la ficha.
    datos.fichas = Array.isArray(datos.fichas) ? datos.fichas : [];
    const idsFuentesIntegradas = [
      "fuente-alerta-011-24-sahagun",
      "fuente-reparacion-victimas-sahagun-2018",
      "fuente-nuevo-mexico-sahagun-2024",
      "fuente-la-macarena-sahagun-2025"
    ];
    const subtemasFuentes = {
      "fuente-alerta-011-24-sahagun": "Prevención y protección frente a riesgos advertidos",
      "fuente-reparacion-victimas-sahagun-2018": "Reparación administrativa a víctimas",
      "fuente-nuevo-mexico-sahagun-2024": "Acceso campesino a la tierra",
      "fuente-la-macarena-sahagun-2025": "Acceso a la tierra para mujeres rurales"
    };
    idsFuentesIntegradas.forEach((idFuente) => {
      const idea = datos.ideas.find((idea) => idea && idea.id === idFuente) ||
        (typeof IDEAS_VERIFICADAS_INICIALES !== "undefined"
          ? IDEAS_VERIFICADAS_INICIALES.find((idea) => idea && idea.id === idFuente)
          : null);
      if (!idea) return;
      const idFicha = "ficha-integrada-" + idFuente;
      const ubicacion = Array.isArray(idea.ubicaciones) ? idea.ubicaciones[0] : null;
      let ficha = datos.fichas.find((f) => f.id === idFicha);
      if (!ficha) {
        ficha = normalizarFicha({
          id: idFicha,
          nombre: idea.nombre || "Registro documentado",
          categoria: idea.categoria || "lugares",
          subtema: subtemasFuentes[idFuente] || "",
          lat: null,
          lng: null,
          precision: "sin",
          descripcion: idea.descripcion || "",
          historia: ubicacion
            ? [ubicacion.nombre, ubicacion.lugar, ubicacion.descripcion].filter(Boolean).join("\\n\\n")
            : "",
          actores: "",
          fecha: idea.fecha || (ubicacion && ubicacion.fecha) || "",
          fuente: idea.fuente || "",
          tipoFuente: idFuente === "fuente-nuevo-mexico-sahagun-2024" ? "prensa" : "oficial",
          estado: "documentado",
          tipo_registro: "registro",
          territorio_padre: "",
          evidencias: "",
          observaciones: "Registro integrado en la categoría correspondiente para evitar una tarjeta de tema duplicada. La fuente no aporta coordenadas exactas; por eso no se marca un punto en el mapa.",
          aporte: "",
          anonimo: false,
          visible: true,
          creado: idea.creado || new Date().toISOString(),
          relacionados: []
        });
        datos.fichas.push(ficha);
      } else {
        // Garantizar que la ficha existente aparezca en la categoría correcta.
        ficha.categoria = idea.categoria || ficha.categoria || "lugares";
        if (!ficha.subtema) ficha.subtema = subtemasFuentes[idFuente] || "";
      }
    });
    datos.ideas = datos.ideas.filter((idea) => !idea || !idsFuentesIntegradas.includes(idea.id) || idea.id === "fuente-alerta-011-24-sahagun");
    if (!datos.config || typeof datos.config !== "object") datos.config = {};
    if (datos.config.participante === undefined) datos.config.participante = CONFIGURACION_INICIAL.participante || "";
    if (datos.config.municipio === undefined) datos.config.municipio = CONFIGURACION_INICIAL.municipio || "";
    if (datos.config.departamento === undefined) datos.config.departamento = CONFIGURACION_INICIAL.departamento || "";
    if (!Array.isArray(datos.fichas)) datos.fichas = [];

    // Retirar solo fichas de ejemplo que seguían intactas de la plantilla anterior.
    datos.fichas = datos.fichas.filter((f) => !(
      (f.id === "semilla-33" &&
        f.nombre === "Iglesia Cristiana Menonita en Sahagún (por completar)" &&
        String(f.descripcion || "").startsWith("Ficha base para documentar la presencia")) ||
      (f.id === "semilla-34" &&
        f.nombre === "Pintando la Paz – Reconcíliate (por completar)" &&
        String(f.descripcion || "").startsWith("Ficha base para documentar la iniciativa"))
    ));
    const territorioSemilla = datos.fichas.find((f) =>
      f.id === "semilla-00" &&
      f.nombre === "Sahagún, Córdoba" &&
      String(f.descripcion || "").startsWith("Territorio principal de la cartografía: municipio de Sahagún")
    );
    if (territorioSemilla) {
      territorioSemilla.nombre = "Municipio de Sahagún, Córdoba";
      territorioSemilla.lat = null;
      territorioSemilla.lng = null;
      territorioSemilla.precision = "sin";
      territorioSemilla.estado = "pendiente";
      territorioSemilla.visible = false;
      territorioSemilla.descripcion = "Territorio marco de la cartografía. Complete los registros a partir de la observación, conversaciones con habitantes, testimonios autorizados, memoria comunitaria y fuentes disponibles.";
      territorioSemilla.historia = "";
      territorioSemilla.actores = "";
      territorioSemilla.fecha = "";
      territorioSemilla.fuente = "";
      territorioSemilla.tipoFuente = "";
      territorioSemilla.observaciones = "Este registro sirve para vincular lugares y hechos concretos con el municipio. El límite municipal se representa por separado en el mapa.";
    }

    if (!datos.leyenda || typeof datos.leyenda !== "object") datos.leyenda = {};
    if (!Array.isArray(datos.leyenda.ocultas)) datos.leyenda.ocultas = [];
    if (!Array.isArray(datos.leyenda.custom)) datos.leyenda.custom = [];
    if (!datos.leyenda.cats || typeof datos.leyenda.cats !== "object") datos.leyenda.cats = {};
    const mapaCat = { lugar: "lugares", territorio: "lugares", conflicto: "afectaciones", actor: "actores", reto: "retos" };
    datos.fichas.forEach((f) => {
      if (mapaCat[f.categoria]) f.categoria = mapaCat[f.categoria];
      if (!CATEGORIAS[f.categoria]) f.categoria = "lugares";
      normalizarFicha(f);
    });
    const ids = datos.fichas.map((x) => x.id);
    datos.fichas.forEach((f) => { f.relacionados = (f.relacionados || []).filter((rid) => ids.indexOf(rid) !== -1); });
    return datos;
  }

  function normalizarFicha(f) {
    if (f.tipoFuente === undefined) f.tipoFuente = "";
    if (f.evidencias === undefined) f.evidencias = "";
    if (f.observaciones === undefined) f.observaciones = "";
    if (f.aporte === undefined) f.aporte = "";
    if (!Array.isArray(f.relacionados)) f.relacionados = [];
    if (f.precision === undefined) f.precision = "exacta";
    if (f.visible === undefined) f.visible = true;
    if (f.anonimo === undefined) f.anonimo = false;
    if (f.subtema === undefined) f.subtema = "";
    if (f.simboloCampo === undefined) f.simboloCampo = "";
    if (f.tipo_registro === undefined) f.tipo_registro = "registro";
    if (f.territorio_padre === undefined) f.territorio_padre = "";
    if (f.ubicaciones === undefined) f.ubicaciones = [];
    if (!ESTADOS[f.estado]) f.estado = "pendiente";
    return f;
  }

  function cargar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return null;
      const datos = JSON.parse(crudo);
      if (!datos || !Array.isArray(datos.fichas)) return null;
      return migrar(datos);
    } catch (e) {
      return null;
    }
  }

  function pintarEstadoNube(texto) {
    const n = $("#estadoNube");
    if (n) n.textContent = texto;
  }

  async function fetchEstadoNube(opciones) {
    const ejecutar = () => {
      const headers = Object.assign({}, opciones.headers || {});
      if (claveEditorNube) headers["x-editor-password"] = claveEditorNube;
      return fetch("api/estado", Object.assign({}, opciones, { headers }));
    };
    let respuesta = await ejecutar();
    if (respuesta.status === 401) {
      const clave = window.prompt("La nube está protegida. Introduce la contraseña de edición configurada en Vercel (EDITOR_PASSWORD).");
      if (!clave) return respuesta;
      claveEditorNube = clave;
      respuesta = await ejecutar();
      if (respuesta.status === 401) {
        claveEditorNube = "";
        window.alert("La contraseña de edición no es correcta. Puedes seguir trabajando con los datos guardados en este navegador.");
      }
    }
    return respuesta;
  }

  async function cargarNube() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 7000);
      const r = await fetchEstadoNube({ signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return null;
      const j = await r.json();
      if (!j || !j.ok || !j.estado) return null;
      return migrar(j.estado);
    } catch (e) {
      return null;
    }
  }

  async function guardarNube() {
    nubeTimer = null;
    if (!estado) return false;
    pintarEstadoNube("☁ Guardando cambios para compartir con el profesor…");
    try {
      const r = await fetchEstadoNube({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estado)
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j && j.ok) {
        pintarEstadoNube("☁ Nube al día ✓ · El profesor verá estos cambios al actualizar su vista.");
        return true;
      }
      const detalle = (j && j.error) || ("Error HTTP " + r.status);
      if (r.status === 503 && /EDITOR_PASSWORD/i.test(detalle)) {
        pintarEstadoNube("⚠ No compartido: falta configurar EDITOR_PASSWORD en Vercel.");
      } else if (r.status === 401) {
        pintarEstadoNube("⚠ No compartido: contraseña de edición no válida o cancelada.");
      } else {
        pintarEstadoNube("⚠ No compartido: " + detalle);
      }
      return false;
    } catch (e) {
      pintarEstadoNube("⚠ No compartido: no se pudo conectar con la nube. Los cambios siguen guardados en este navegador.");
      return false;
    }
  }

  function guardarYCompartirAhora() {
    if (nubeTimer) {
      clearTimeout(nubeTimer);
      nubeTimer = null;
    }
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (e) {
      pintarEstadoNube("⚠ No compartido: el navegador no permitió guardar los cambios localmente.");
      return;
    }
    guardarNube();
  }

  function programarNube() {
    if (nubeTimer) clearTimeout(nubeTimer);
    nubeTimer = setTimeout(guardarNube, 900);
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      pintarEstadoGuardado();
      programarNube();
      return true;
    } catch (e) {
      toast("No fue posible guardar en este navegador. Exporte un respaldo.", "error");
      return false;
    }
  }

  function restaurarSemilla() {
    estado = {
      version: VERSION,
      config: clonar(CONFIGURACION_INICIAL),
      reflexion: clonar(REFLEXION_INICIAL),
      fichas: clonar(FICHAS_INICIALES).map((f) => normalizarFicha(f)),
      ideas: [],
      zonas: [],
      leyenda: { ocultas: [], cats: {}, custom: [] }
    };
    guardar();
  }

  function pintarEstadoGuardado() {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, "0") + ":" + ahora.getMinutes().toString().padStart(2, "0");
    const props = estado.config && estado.config.limite && estado.config.limite.properties;
    let origen = "límite aproximado/apagado";
    if (props && props.oficial) origen = "límite oficial cargado";
    else if (props && estado.config.mostrarLimite) origen = "límite mostrado";
    $("#estadoGuardado").innerHTML =
      "✔ Guardado automático en este navegador<br>" +
      estado.fichas.length + " registros · " + (estado.zonas ? estado.zonas.length : 0) + " figuras dibujadas<br>" +
      "<span class='menu__nota'>Última actualización " + hora + " · " + escapar(origen) + "</span>";
  }

  function toast(mensaje, tipo) {
    const caja = $("#toasts");
    const nodo = document.createElement("div");
    nodo.className = "toast toast--" + (tipo || "ok");
    nodo.textContent = mensaje;
    caja.appendChild(nodo);
    setTimeout(() => nodo.remove(), 3600);
  }

  /* ==================== CONVENCIONES (LEYENDA) ==================== */

  function leyendaActual() {
    if (!estado.leyenda) estado.leyenda = { ocultas: [], cats: {}, custom: [] };
    if (!Array.isArray(estado.leyenda.ocultas)) estado.leyenda.ocultas = [];
    if (!Array.isArray(estado.leyenda.custom)) estado.leyenda.custom = [];
    if (!estado.leyenda.cats || typeof estado.leyenda.cats !== "object") estado.leyenda.cats = {};
    return estado.leyenda;
  }

  function convOculta(clave) {
    return leyendaActual().ocultas.indexOf(clave) !== -1;
  }

  function numeroCoordenada(valor) {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
    if (typeof valor !== "string" || !valor.trim()) return null;
    // Acepta coordenadas guardadas como texto, tanto con punto como con coma decimal.
    const numero = Number(valor.trim().replace(",", "."));
    return Number.isFinite(numero) ? numero : null;
  }

  function coordenadasValidas(lat, lng) {
    return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  function catOculta(claveCat) {
    const o = leyendaActual().cats[claveCat];
    return !!(o && o.oculta);
  }

  function aplicarLeyenda() {
    const L = leyendaActual();
    Object.keys(CATEGORIAS).forEach((k) => {
      const base = CATEGORIAS_BASE[k];
      if (!base) return;
      CATEGORIAS[k].nombre = base.nombre;
      CATEGORIAS[k].color = base.color;
      CATEGORIAS[k].simbolo = base.simbolo;
      CATEGORIAS[k].descripcion = base.descripcion;
      const o = L.cats[k];
      if (o) {
        if (o.nombre) CATEGORIAS[k].nombre = o.nombre;
        if (o.color) CATEGORIAS[k].color = o.color;
        if (o.simbolo) CATEGORIAS[k].simbolo = o.simbolo;
      }
    });
  }

  function opcionesSimbolo(actual) {
    const lista = SIMBOLOS.slice();
    if (actual && lista.indexOf(actual) === -1) lista.unshift(actual);
    return lista.map((s) => "<option value='" + escapar(s) + "'" + (s === actual ? " selected" : "") + ">" + escapar(s) + "</option>").join("");
  }

  function pintarPaletaSimbolos() {
    const cont = $("#simbolosPaleta");
    if (!cont) return;
    cont.innerHTML = SIMBOLOS.map((s) => "<button type='button' class='simbolos-paleta__btn' data-sim='" + escapar(s) + "' data-busqueda-simbolo='" + escapar((s + " " + (NOMBRES_SIMBOLOS[s] || "")).toLocaleLowerCase("es")) + "' title='Usar este símbolo'>" + escapar(s) + "</button>").join("");
  }

  function pintarPaletaColores() {
    const cont = $("#coloresPaleta");
    if (!cont) return;
    cont.innerHTML = PALETA.map((c) =>
      "<button type='button' class='colores-paleta__btn' data-color-nuevo='" + c + "' style='background:" + c + "' title='Usar este color'></button>"
    ).join("");
  }

  function abrirGestionLeyenda() {
    pintarGestionLeyenda();
    pintarPaletaSimbolos();
    pintarPaletaColores();
    abrirModal("modalLeyenda");
  }

  function pintarGestionLeyenda() {
    const L = leyendaActual();
    $("#leyendaCategorias").innerHTML = Object.keys(CATEGORIAS).map((k) => {
      const c = CATEGORIAS[k];
      const o = L.cats[k] || {};
      return (
        "<div class='gestion__fila' data-cat='" + k + "'>" +
        "<span class='gestion__preview' style='background:" + c.color + "'>" + escapar(c.simbolo) + "</span>" +
        "<label class='gestion__campo gestion__campo--ancho'>Nombre<input type='text' data-campo='nombre' value='" + escapar(c.nombre) + "'></label>" +
        "<label class='gestion__campo'>Símbolo<input type='text' data-campo='simbolo' maxlength='8' list='catalogoSimbolos' value='" + escapar(c.simbolo) + "' aria-label='Símbolo de " + escapar(c.nombre) + "'></label>" +
        "<label class='gestion__campo'>Color<input type='color' data-campo='color' value='" + c.color + "'></label>" +
        "<label class='gestion__check'><input type='checkbox' data-campo='oculta'" + (o.oculta ? " checked" : "") + "> Oculta en la leyenda</label>" +
        "</div>"
      );
    }).join("");

    $("#leyendaBase").innerHTML = [
      { k: "lim-oficial", n: "Límite oficial del municipio (línea azul continua)" },
      { k: "lim-aprox", n: "Límite aproximado de respaldo (línea roja discontinua)" }
    ].map((b) =>
      "<div class='gestion__fila'>" +
      "<span class='gestion__preview gestion__preview--linea" + (b.k === "lim-aprox" ? " convenciones__linea--dis" : "") + "'></span>" +
      "<span class='gestion__texto'>" + b.n + "</span>" +
      "<label class='gestion__check'><input type='checkbox' data-base-check='" + b.k + "'" + (convOculta(b.k) ? "" : " checked") + "> Mostrar en la leyenda</label>" +
      "</div>"
    ).join("");

    pintarCustomLeyenda();
    const vistaPrevia = (e) => {
      const row = e.target.closest(".gestion__fila");
      if (!row) return;
      if (e.target.type === "color") row.querySelector(".gestion__preview").style.background = e.target.value;
      if (e.target.dataset.campo === "simbolo") {
        row.querySelector(".gestion__preview").textContent = e.target.value || "■";
        if (row.dataset.cat && e.type === "change") {
          const k = row.dataset.cat;
          const L = leyendaActual();
          const base = CATEGORIAS_BASE[k];
          const actual = L.cats[k] || {};
          actual.simbolo = e.target.value.trim() || base.simbolo;
          L.cats[k] = actual;
          aplicarLeyenda();
          guardar();
          pintarMapa();
          pintarMenuConvenciones();
          if ($("#modalConvencionesCompleto") && !$("#modalConvencionesCompleto").hidden) abrirConvencionesCompletas();
        }
      }
    };
    $$("#leyendaCategorias .gestion__fila, #leyendaCustom .gestion__fila").forEach((row) => {
      row.addEventListener("input", vistaPrevia);
      row.addEventListener("change", vistaPrevia);
    });
  }

  function pintarCustomLeyenda() {
    const L = leyendaActual();
    $("#leyendaCustom").innerHTML = L.custom.length
      ? L.custom.map((c) =>
          "<div class='gestion__fila' data-custom='" + c.id + "'>" +
          "<span class='gestion__preview' style='background:" + (c.color || "#5D6B7E") + "'>" + escapar(c.simbolo || "■") + "</span>" +
          "<label class='gestion__campo gestion__campo--ancho'>Nombre<input type='text' data-campo='nombre' value='" + escapar(c.nombre) + "'></label>" +
          "<label class='gestion__campo'>Símbolo<select data-campo='simbolo'>" + opcionesSimbolo(c.simbolo || "■") + "</select></label>" +
          "<label class='gestion__campo'>Color<input type='color' data-campo='color' value='" + (c.color || "#15803D") + "'></label>" +
          "<label class='gestion__campo gestion__campo--ancho'>Nota<input type='text' data-campo='nota' value='" + escapar(c.nota || "") + "'></label>" +
          "<button type='button' class='btn btn--mini btn--peligro' data-custom-eliminar='" + c.id + "'>Eliminar</button>" +
          "</div>"
        ).join("")
      : "<p class='vacio'>No hay convenciones personalizadas. Agregue una abajo: aparecerá en la leyenda del menú, en «Fuentes y metodología» y en el informe impreso.</p>";
  }

  function agregarConvencion() {
    const nombre = $("#convNombre").value.trim();
    if (!nombre) { toast("Escriba el nombre de la convención.", "error"); return; }
    const L = leyendaActual();
    L.custom.push({
      id: nuevoId(),
      nombre: nombre,
      simbolo: $("#convSimbolo").value.trim() || "■",
      color: $("#convColor").value || "#15803D",
      nota: $("#convNota").value.trim()
    });
    guardar();
    $("#convNombre").value = "";
    $("#convSimbolo").value = "";
    $("#convNota").value = "";
    pintarCustomLeyenda();
    toast("Convención agregada.");
  }

  function alternarOcultaCat(k) {
    if (!CATEGORIAS[k]) return;
    const L = leyendaActual();
    const o = L.cats[k] || {};
    o.oculta = !catOculta(k);
    if (!o.oculta && !o.nombre && !o.color && !o.simbolo) delete L.cats[k];
    else L.cats[k] = o;
    aplicarLeyenda();
    guardar();
    pintarMapa();
    repintarSeccion();
    toast(o.oculta ? "Sección oculta en el mapa." : "Sección visible en el mapa.");
  }

  function eliminarConvencion(id) {
    const L = leyendaActual();
    const c = L.custom.find((x) => x.id === id);
    if (!c) return;
    if (!confirm("¿Eliminar la convención «" + c.nombre + "» de la leyenda?")) return;
    L.custom = L.custom.filter((x) => x.id !== id);
    guardar();
    pintarCustomLeyenda();
    toast("Convención eliminada.");
  }

  function guardarLeyenda() {
    const L = leyendaActual();
    $$("#leyendaCategorias .gestion__fila").forEach((row) => {
      const k = row.dataset.cat;
      const get = (campo) => row.querySelector("[data-campo='" + campo + "']");
      const base = CATEGORIAS_BASE[k];
      const actual = {
        nombre: get("nombre").value.trim() || base.nombre,
        simbolo: get("simbolo").value.trim() || base.simbolo,
        color: get("color").value || base.color,
        oculta: get("oculta").checked
      };
      if (actual.nombre === base.nombre && actual.color === base.color && actual.simbolo === base.simbolo && !actual.oculta) delete L.cats[k];
      else L.cats[k] = actual;
    });
    ["lim-oficial", "lim-aprox"].forEach((clave) => {
      const chk = document.querySelector("[data-base-check='" + clave + "']");
      const oculto = !!chk && !chk.checked;
      const i = L.ocultas.indexOf(clave);
      if (oculto && i === -1) L.ocultas.push(clave);
      if (!oculto && i !== -1) L.ocultas.splice(i, 1);
    });
    $$("#leyendaCustom .gestion__fila").forEach((row) => {
      const c = L.custom.find((x) => x.id === row.dataset.custom);
      if (!c) return;
      const get = (campo) => row.querySelector("[data-campo='" + campo + "']");
      c.nombre = get("nombre").value.trim() || c.nombre;
      c.simbolo = get("simbolo").value.trim() || "■";
      c.color = get("color").value || c.color;
      c.nota = get("nota").value.trim();
    });
    aplicarLeyenda();
    guardar();
    pintarMapa();
    repintar();
    cerrarModal("modalLeyenda");
    toast("Convenciones actualizadas.");
  }

  /* ==================== MAPA ==================== */

  function initMapa() {
    mapa = L.map("mapa", { zoomControl: true, worldCopyJump: true })
      .setView([estado.config.centro.lat, estado.config.centro.lng], estado.config.centro.zoom);
    if (mapa.attributionControl) mapa.attributionControl.setPrefix(false);

    erroresBase = {};
    capasBase = {};
    BASES.forEach((b) => { capasBase[b.id] = crearCapas(b, false); });

    let vistaGuardada = (estado.config && estado.config.vistaBase) || "calles";
    if (VISTAS_ANTERIORES[vistaGuardada]) vistaGuardada = VISTAS_ANTERIORES[vistaGuardada];
    const defGuardada = BASES.find((b) => b.id === vistaGuardada) || BASES[0];
    capaBaseActual = capasBase[defGuardada.id];
    capaBaseActual.forEach((c) => c.addTo(mapa));
    if (estado.config) estado.config.vistaBase = defGuardada.id;
    aplicarEtiquetas();

    capaLimite = L.geoJSON();
    capaMarcadores = L.layerGroup().addTo(mapa);
    capaZonas = L.layerGroup().addTo(mapa);
    capaVerticesEdicion = L.layerGroup().addTo(mapa);
    dibujarLimite();
    pintarZonas();

    L.control.scale({ imperial: false }).addTo(mapa);
    crearSelectorVistas();

    setTimeout(() => mapa.invalidateSize(), 250);
    window.addEventListener("resize", () => mapa.invalidateSize());
    if (window.matchMedia) {
      window.matchMedia("print").addListener(() => setTimeout(() => mapa.invalidateSize(), 100));
    }

    mapa.on("click", (ev) => {
      if (clicZona) { clicZona = false; return; }
      if (modoUbicar) {
        $("#fichaLat").value = ev.latlng.lat.toFixed(5);
        $("#fichaLng").value = ev.latlng.lng.toFixed(5);
        finalizarModoUbicar();
        abrirModal("modalFicha");
        toast("Ubicación fijada en el formulario.");
        return;
      }
      if (dibujoTool === "marca") crearMarca(ev.latlng);
      else if (dibujoTool === "estrella") crearEstrella(ev.latlng);
      else if (dibujoTool === "texto") crearTexto(ev.latlng);
      else if (dibujoTool === "poligono" || dibujoTool === "linea" || dibujoTool === "flecha") agregarVertice(ev.latlng);
    });

    mapa.on("dblclick", (ev) => {
      if (dibujoTool === "poligono") {
        L.DomEvent.stop(ev);
        terminarPoligono();
      } else if (dibujoTool === "linea" || dibujoTool === "flecha") {
        L.DomEvent.stop(ev);
        terminarLinea(dibujoTool);
      }
    });

    mapa.on("mousedown", (ev) => {
      if (dibujoTool === "rectangulo" || dibujoTool === "circulo") iniciarArrastre(ev.latlng);
    });
    mapa.on("mousemove", (ev) => {
      if (dibujoTmp && (dibujoTmp.tipo === "rectangulo" || dibujoTmp.tipo === "circulo") && dibujoTmp.activo) moverArrastre(ev.latlng);
      else if (dibujoTmp && (dibujoTmp.tipo === "poligono" || dibujoTmp.tipo === "linea" || dibujoTmp.tipo === "flecha") && dibujoTmp.pts.length) fantasmaPoligono(ev.latlng);
    });
    mapa.on("mouseup", (ev) => {
      if (dibujoTmp && (dibujoTmp.tipo === "rectangulo" || dibujoTmp.tipo === "circulo") && dibujoTmp.activo) terminarArrastre(ev.latlng);
    });
  }

  function capaBaseDe(id) {
    const grupo = capasBase[id];
    return grupo && grupo[0];
  }

  function crearCapa(def, usarRespaldo) {
    const fuente = usarRespaldo && def.respaldo ? def.respaldo : def;
    const capa = L.tileLayer(fuente.url, fuente.opts || {});
    capa.on("tileerror", () => {
      erroresBase[def.id] = (erroresBase[def.id] || 0) + 1;
      if (erroresBase[def.id] >= 4 && capaBaseDe(def.id) === capa) {
        if (def.respaldo && !capa.__respaldo) respaldoCapa(def);
        else if (!def.respaldo && !capa.__aviso) {
          capa.__aviso = true;
          toast("El mapa base «" + def.nombre + "» no responde. Verifique su conexión.", "error");
        }
      }
    });
    return capa;
  }

  function crearCapas(def, usarRespaldo) {
    const grupo = [crearCapa(def, usarRespaldo)];
    const overs = def.overlays || (def.overlay ? [def.overlay] : []);
    overs.forEach((o) => grupo.push(L.tileLayer(o.url, o.opts || {})));
    return grupo;
  }

  function respaldoCapa(def) {
    const grupo = capasBase[def.id] || [];
    const actual = (capaBaseActual || [])[0];
    const eraActual = grupo[0] === actual;
    grupo.forEach((c) => { if (mapa && mapa.hasLayer(c)) mapa.removeLayer(c); });
    const nuevo = crearCapas(def, true);
    nuevo[0].__respaldo = true;
    capasBase[def.id] = nuevo;
    if (eraActual) {
      capaBaseActual = nuevo;
      nuevo.forEach((c) => c.addTo(mapa));
      toast("El mapa base «" + def.nombre + "» no responde; se cargó un mapa de respaldo automático.");
    }
  }

  function aplicarEtiquetas() {
    if (!mapa) return;
    if (capaEtiquetas) { mapa.removeLayer(capaEtiquetas); capaEtiquetas = null; }
    const activo = !!(estado.config && estado.config.etiquetas) && vistaActualId() === "satelite";
    if (activo) {
      capaEtiquetas = L.tileLayer(URL_ETIQUETAS, { maxZoom: 19, attribution: "Etiquetas: Esri" });
      capaEtiquetas.addTo(mapa);
      if (capaEtiquetas.bringToFront) capaEtiquetas.bringToFront();
    }
    const chk = $("#chkEtiquetas");
    if (chk) chk.checked = activo;
  }

  function aplicarNombres() {
    const el = $("#mapa");
    if (!el) return;
    const mostrar = !estado.config || estado.config.mostrarNombres !== false;
    el.classList.toggle("sin-nombres", !mostrar);
    const chk = $("#chkNombres");
    if (chk) chk.checked = mostrar;
  }

  function pintarTipoMapa() {
    const id = vistaActualId();
    const def = BASES.find((b) => b.id === id) || BASES[0];
    const nombre = $("#tipoMapaNombre");
    if (nombre) nombre.textContent = def.nombre;
    $$("#tipoMapaPanel .tipo-mapa__item").forEach((it) => it.classList.toggle("tipo-mapa__item--activo", it.dataset.tipo === id));
    const et = $("#tipoEtiquetas");
    if (et) et.hidden = id !== "satelite";
  }

  function crearSelectorVistas() {
    const barra = document.querySelector("#mapaControles");
    const zona = document.querySelector(".mapa-zona");
    const viejo = document.querySelector(".tipo-mapa");
    if (viejo) viejo.remove();

    const cont = document.createElement("div");
    cont.className = "tipo-mapa";
    cont.innerHTML =
      "<div class='tipo-mapa__panel' id='tipoMapaPanel' hidden>" +
      "<div class='tipo-mapa__sec'>Tipo de mapa</div>" +
      BASES.map((b) =>
        "<button type='button' class='tipo-mapa__item' data-tipo='" + b.id + "' title='" + escapar(b.descripcion || b.nombre) + "'>" +
        "<img class='tipo-mapa__thumb' src='" + b.thumb + "' alt='' loading='lazy'>" +
        "<span class='tipo-mapa__texto'><span class='tipo-mapa__nombre'>" + b.nombre + "</span><span class='tipo-mapa__desc'>" + escapar(b.descripcion || "") + "</span></span>" +
        "<span class='tipo-mapa__check'>✓</span></button>"
      ).join("") +
      "<label class='tipo-mapa__etiquetas' id='tipoEtiquetas' hidden><input type='checkbox' id='chkEtiquetas'> Etiquetas</label>" +
      "<label class='tipo-mapa__etiquetas' id='tipoNombres' title='Mostrar los nombres de los lugares sobre el mapa'><input type='checkbox' id='chkNombres' checked> Nombres</label>" +
      "<div class='tipo-mapa__nota'>Activa o desactiva categorías para elegir qué registros aparecen en el mapa.</div>" +
      "<div class='tipo-mapa__sec'>Categorías visibles</div>" +
      "<div class='filtros-categorias-mapa' id='filtrosCategoriasMapa'>" + Object.keys(CATEGORIAS).filter((k) => k !== "delimitacion").sort((a,b) => CATEGORIAS[a].seccion-CATEGORIAS[b].seccion).map((k) => "<label class='tipo-mapa__etiquetas'><input type='checkbox' data-filtro-categoria='" + escapar(k) + "' " + (catOculta(k) ? "" : "checked") + "> <span style='color:" + escapar(CATEGORIAS[k].color) + "'>" + escapar(CATEGORIAS[k].simbolo) + "</span> " + escapar(CATEGORIAS[k].seccion + ". " + CATEGORIAS[k].nombre) + "</label>").join("") + "</div>" +
      "</div>" +
      "<button type='button' class='tipo-mapa__btn' id='tipoMapaBtn' title='Cambiar la vista cartográfica' aria-haspopup='true' aria-expanded='false'>" +
      "<span class='tipo-mapa__icono' aria-hidden='true'>▦</span><span class='tipo-mapa__etiqueta'>Mapa base</span><span class='tipo-mapa__separador' aria-hidden='true'></span><span id='tipoMapaNombre'></span><span class='tipo-mapa__caret' aria-hidden='true'>⌄</span>" +
      "</button>";
    if (barra) barra.appendChild(cont);
    else zona.appendChild(cont);

    const panel = cont.querySelector("#tipoMapaPanel");
    const btn = cont.querySelector("#tipoMapaBtn");

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
      btn.classList.toggle("tipo-mapa__btn--abierto", !panel.hidden);
      if (!panel.hidden) pintarTipoMapa();
    });

    panel.addEventListener("click", (e) => {
      const item = e.target.closest("[data-tipo]");
      if (!item) return;
      cambiarVistaBase(item.dataset.tipo);
      pintarTipoMapa();
    });

    cont.querySelectorAll("[data-filtro-categoria]").forEach((chk) => chk.addEventListener("change", (e) => {
      const k = e.target.dataset.filtroCategoria;
      const L = leyendaActual();
      const o = L.cats[k] || {};
      if (e.target.checked) {
        if (!o.nombre && !o.color && !o.simbolo) delete L.cats[k];
        else { o.oculta = false; L.cats[k] = o; }
      } else {
        o.oculta = true;
        L.cats[k] = o;
      }
      aplicarLeyenda();
      guardar();
      pintarMapa();
      repintarSeccion();
    }));

    cont.querySelector("#chkEtiquetas").addEventListener("change", (e) => {
      estado.config.etiquetas = e.target.checked;
      guardar();
      aplicarEtiquetas();
    });

    cont.querySelector("#chkNombres").addEventListener("change", (e) => {
      if (!estado.config) estado.config = {};
      estado.config.mostrarNombres = e.target.checked;
      guardar();
      aplicarNombres();
    });

    // Historial de cambios (sin cuentas ni inicio de sesión).
    const btnHistorial = $("#btnHistorial");
    if (btnHistorial) btnHistorial.addEventListener("click", abrirModalHistorial);

    document.addEventListener("click", (e) => {
      if (panel.hidden) return;
      if (cont.contains(e.target)) return;
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      btn.classList.remove("tipo-mapa__btn--abierto");
    });

    pintarTipoMapa();
  }

  function vistaActualId() {
    const actual = (capaBaseActual || [])[0];
    for (const k in capasBase) {
      if ((capasBase[k] || [])[0] === actual) return k;
    }
    return "calles";
  }

  function cambiarVistaBase(id) {
    const nuevo = capasBase[id];
    if (!nuevo || (capaBaseActual || [])[0] === nuevo[0]) return;
    (capaBaseActual || []).forEach((c) => mapa.removeLayer(c));
    nuevo.forEach((c) => c.addTo(mapa));
    capaBaseActual = nuevo;
    if (estado.config) {
      estado.config.vistaBase = id;
      guardar();
    }
    aplicarEtiquetas();
    pintarTipoMapa();
  }

  function dibujarLimite() {
    capaLimite.clearLayers();
    const cfg = estado.config;
    if (!cfg.mostrarLimite || !cfg.limite || !cfg.limite.geometry) return;
    try {
      L.geoJSON(cfg.limite, {
        style: {
          color: cfg.limite.properties && cfg.limite.properties.oficial ? "#0d47a1" : "#9B1C1C",
          weight: 3,
          opacity: 0.95,
          dashArray: cfg.limite.properties && cfg.limite.properties.oficial ? null : "8 6",
          fillColor: "#C9A227",
          fillOpacity: 0.05
        }
      }).addTo(capaLimite);
    } catch (e) {
      toast("No se pudo dibujar el límite: revise el GeoJSON.", "error");
    }
  }

  /* ==================== DIBUJO Y RELLENO EN COLOR ==================== */

  function estiloZona(color) {
    return {
      color: color,
      weight: 3,
      fillColor: color,
      fillOpacity: 0.35
    };
  }

  function pintarZonas() {
    if (!capaZonas) return;
    capaZonas.clearLayers();
    zonaLayers = {};
    (estado.zonas || []).forEach((z) => {
      const capas = [];
      if (z.tipo === "poligono") capas.push(L.polygon(z.coords, estiloZona(z.color)));
      else if (z.tipo === "rectangulo") capas.push(L.polygon(rectAPoligono(z.coords), estiloZona(z.color)));
      else if (z.tipo === "circulo") capas.push(L.circle(z.centro, z.radio, estiloZona(z.color)));
      else if (z.tipo === "marca") capas.push(L.circleMarker(z.coords, { radius: 9, color: "#fff", weight: 2, fillColor: z.color, fillOpacity: 1 }));
      else if (z.tipo === "linea") capas.push(L.polyline(z.coords, { color: z.color, weight: 4, opacity: 0.9 }));
      else if (z.tipo === "flecha") {
        capas.push(L.polyline(z.coords, { color: z.color, weight: 4, opacity: 0.9 }));
        const fin = z.coords[z.coords.length - 1];
        const ant = z.coords[z.coords.length - 2];
        capas.push(L.marker(fin, { icon: iconoFlecha(z.color, anguloFlecha(ant, fin)), interactive: true }));
      }
      else if (z.tipo === "estrella") capas.push(L.marker(z.coords, { icon: iconoEstrella(z.color) }));
      else if (z.tipo === "texto") capas.push(L.marker(z.coords, { icon: iconoTexto(z.texto, z.color) }));
      if (!capas.length) return;
      capas.forEach((layer) => {
        layer.on("click", (ev) => clicEnZona(z, ev));
        layer.on("mousedown", (ev) => { if (dibujoTool === "mover") iniciarMoverZona(z, ev); });
        layer.addTo(capaZonas);
      });
      zonaLayers[z.id] = capas;
    });
  }

  function anguloFlecha(a, b) {
    if (!a || !b) return 0;
    const dLat = b[0] - a[0];
    const dLng = (b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180);
    return Math.atan2(dLng, dLat) * 180 / Math.PI - 90;
  }

  function iconoFlecha(color, grados) {
    return L.divIcon({
      className: "",
      html: "<span class='zona-flecha' style='color:" + color + ";transform:rotate(" + grados + "deg)'>➤</span>",
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  function iconoEstrella(color) {
    return L.divIcon({
      className: "",
      html: "<span class='zona-estrella' style='color:" + color + "'>★</span>",
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  function iconoTexto(texto, color) {
    return L.divIcon({
      className: "",
      html: "<span class='zona-texto' style='border-color:" + color + "'>" + escapar(texto || "Etiqueta") + "</span>"
    });
  }

  function rectAPoligono(coords) {
    const [[lat1, lng1], [lat2, lng2]] = coords;
    return [[lat1, lng1], [lat1, lng2], [lat2, lng2], [lat2, lng1]];
  }

  function clicEnZona(z, ev) {
    clicZona = true;
    setTimeout(() => { clicZona = false; }, 250);
    if (dibujoTool === "rellenar") {
      z.color = colorActivo;
      guardar();
      pintarZonas();
      toast("Figura rellenada con el color elegido.");
    } else if (dibujoTool === "eliminar") {
      if (!confirm("¿Eliminar esta figura dibujada?")) return;
      if (zonaEditandoVertices === z.id) terminarEdicionVertices();
      estado.zonas = estado.zonas.filter((x) => x.id !== z.id);
      guardar();
      pintarZonas();
      toast("Figura eliminada.");
    } else if (ev && ev.latlng) {
      abrirPopupZona(z, ev.latlng);
    } else {
      toast("Elija «Rellenar» para pintar esta figura, «Eliminar» para borrarla o toque la figura para ver sus opciones.");
    }
  }

  function abrirPopupZona(z, latlng) {
    const nombreTipo = { poligono: "Polígono", rectangulo: "Rectángulo", circulo: "Círculo", marca: "Marca", linea: "Línea o ruta", flecha: "Flecha de flujo", estrella: "Hito", texto: "Etiqueta" }[z.tipo] || "Figura";
    let html =
      "<div class='zona-popup'>" +
      "<p class='zona-popup__titulo'>" + nombreTipo + " · opciones</p>";
    if (z.tipo === "texto") {
      html += "<label class='zona-popup__texto'>Texto de la etiqueta<input type='text' id='zonaTextoInput' value='" + escapar(z.texto || "") + "' maxlength='80'></label>" +
        "<button type='button' class='btn btn--mini' data-zona-texto='" + z.id + "'>Guardar texto</button>";
    }
    if (["poligono", "linea", "flecha"].includes(z.tipo)) {
      html += "<button type='button' class='btn btn--mini' data-zona-editar-puntos='" + z.id + "'>✥ Editar vértices</button>" +
        "<p class='zona-popup__nota'>Mueva los puntos blancos para ajustar el contorno o recorrido.</p>";
    }
    html +=
      "<div class='zona-popup__colores'>" +
      PALETA.map((c) =>
        "<button type='button' class='zona-popup__color" + (c === z.color ? " zona-popup__color--activo" : "") +
        "' data-zona-color='" + c + "' data-zona-id='" + z.id + "' style='background:" + c + "' title='Pintar de " + c + "'></button>"
      ).join("") +
      "</div>" +
      "<p class='zona-popup__nota'>Elija un color para cambiar el relleno de la figura.</p>" +
      "<button type='button' class='btn btn--mini btn--peligro' data-zona-eliminar='" + z.id + "'>🗑 Eliminar figura</button>" +
      "</div>";
    const popup = L.popup({ closeButton: true, className: "zona-popup-caja", maxWidth: 240 })
      .setLatLng(latlng)
      .setContent(html);
    // Vincular antes de abrir: la acción no depende del clic delegado del documento.
    popup.once("add", () => {
      const elemento = popup.getElement();
      const botonEliminar = elemento && elemento.querySelector("[data-zona-eliminar]");
      if (botonEliminar) botonEliminar.addEventListener("click", (evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        L.DomEvent.stop(evento);
        eliminarZona(z.id);
      });
    });
    popup.openOn(mapa);
  }

  function editarVerticesZona(id) {
    const z = (estado.zonas || []).find((x) => x.id === id);
    if (!z || !["poligono", "linea", "flecha"].includes(z.tipo) || !Array.isArray(z.coords)) return;
    if (!capaVerticesEdicion) capaVerticesEdicion = L.layerGroup().addTo(mapa);
    capaVerticesEdicion.clearLayers();
    zonaEditandoVertices = id;
    const btnTerminar = $("#btnTerminarEdicionVertices");
    if (btnTerminar) btnTerminar.hidden = false;
    if (mapa) mapa.closePopup();
    z.coords.forEach((punto, indice) => {
      const handle = L.marker(punto, {
        draggable: true,
        keyboard: true,
        title: "Vértice " + (indice + 1) + " — arrastre para ajustar",
        icon: L.divIcon({
          className: "vertice-edicion-icono",
          html: "<span style='display:block;width:14px;height:14px;border:3px solid #102D4F;border-radius:50%;background:#fff;box-shadow:0 1px 5px #0008'></span>",
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      });
      handle.on("dragend", () => {
        const actual = (estado.zonas || []).find((x) => x.id === id);
        if (!actual || !actual.coords || !actual.coords[indice]) return;
        const ll = handle.getLatLng();
        actual.coords[indice] = [ll.lat, ll.lng];
        guardar();
        pintarZonas();
        toast("Vértice " + (indice + 1) + " actualizado.");
      });
      handle.on("contextmenu", (ev) => {
        if (ev.originalEvent) {
          L.DomEvent.stopPropagation(ev.originalEvent);
          L.DomEvent.preventDefault(ev.originalEvent);
        }
        const actual = (estado.zonas || []).find((x) => x.id === id);
        if (!actual || !Array.isArray(actual.coords)) return;
        const minimo = actual.tipo === "poligono" ? 3 : 2;
        if (actual.coords.length <= minimo) {
          toast("Esta figura necesita al menos " + minimo + " vértices.", "error");
          return;
        }
        if (!confirm("¿Eliminar el vértice " + (indice + 1) + " de esta figura?")) return;
        actual.coords.splice(indice, 1);
        guardar();
        pintarZonas();
        editarVerticesZona(id);
        toast("Vértice eliminado. Clic derecho sobre otro punto para quitarlo.");
      });
      handle.addTo(capaVerticesEdicion);
    });
    toast("Arrastre los puntos blancos para ajustar vértices. En computador, haga clic derecho sobre un punto para eliminar ese vértice; pulse «Terminar edición» para ocultarlos.");
  }

  function terminarEdicionVertices() {
    if (capaVerticesEdicion) capaVerticesEdicion.clearLayers();
    zonaEditandoVertices = null;
    const btnTerminar = $("#btnTerminarEdicionVertices");
    if (btnTerminar) btnTerminar.hidden = true;
    toast("Edición de vértices terminada.");
  }

  function recolorearZona(id, color) {
    const z = (estado.zonas || []).find((x) => x.id === id);
    if (!z) return;
    z.color = color;
    guardar();
    pintarZonas();
    if (mapa) mapa.closePopup();
    toast("Figura pintada con el color elegido.");
  }

  function guardarTextoZona(id) {
    const z = (estado.zonas || []).find((x) => x.id === id);
    if (!z) return;
    const inp = document.querySelector("#zonaTextoInput");
    const texto = inp ? inp.value.trim() : "";
    if (!texto) { toast("Escriba el texto de la etiqueta.", "error"); return; }
    z.texto = texto;
    guardar();
    pintarZonas();
    if (mapa) mapa.closePopup();
    toast("Etiqueta actualizada.");
  }

  function iniciarMoverZona(z, ev) {
    if (moveZona || !ev || !ev.latlng) return;
    moveZona = {
      id: z.id,
      tipo: z.tipo,
      inicio: [ev.latlng.lat, ev.latlng.lng],
      orig: JSON.parse(JSON.stringify({ coords: z.coords, centro: z.centro }))
    };
    if (mapa.dragging) mapa.dragging.disable();
    mapa.on("mousemove", moverZonaTmp);
    mapa.once("mouseup", terminarMoverZona);
  }

  function moverZonaTmp(ev) {
    if (!moveZona) return;
    const dLat = ev.latlng.lat - moveZona.inicio[0];
    const dLng = ev.latlng.lng - moveZona.inicio[1];
    if (Math.abs(dLat) < 1e-9 && Math.abs(dLng) < 1e-9) return;
    const capas = zonaLayers[moveZona.id] || [];
    if (!capas.length) return;
    const mover = (pt) => [pt[0] + dLat, pt[1] + dLng];
    const o = moveZona.orig;
    if (moveZona.tipo === "rectangulo") capas[0].setLatLngs(rectAPoligono([mover(o.coords[0]), mover(o.coords[1])]));
    else if (moveZona.tipo === "circulo") capas[0].setLatLng(mover(o.centro));
    else if (moveZona.tipo === "marca" || moveZona.tipo === "estrella" || moveZona.tipo === "texto") capas[0].setLatLng(mover(o.coords));
    else {
      const pts = o.coords.map(mover);
      capas[0].setLatLngs(pts);
      if (moveZona.tipo === "flecha" && capas[1]) capas[1].setLatLng(pts[pts.length - 1]);
    }
  }

  function terminarMoverZona(ev) {
    if (mapa) {
      mapa.off("mousemove", moverZonaTmp);
      if (mapa.dragging) mapa.dragging.enable();
    }
    if (!moveZona) return;
    const dLat = ev && ev.latlng ? ev.latlng.lat - moveZona.inicio[0] : 0;
    const dLng = ev && ev.latlng ? ev.latlng.lng - moveZona.inicio[1] : 0;
    const movida = Math.abs(dLat) > 1e-7 || Math.abs(dLng) > 1e-7;
    const id = moveZona.id;
    const tipo = moveZona.tipo;
    const o = moveZona.orig;
    moveZona = null;
    if (!movida) return;
    const z = (estado.zonas || []).find((x) => x.id === id);
    if (!z) { pintarZonas(); return; }
    const mover = (pt) => [pt[0] + dLat, pt[1] + dLng];
    if (tipo === "rectangulo") z.coords = [mover(o.coords[0]), mover(o.coords[1])];
    else if (tipo === "circulo") z.centro = mover(o.centro);
    else if (tipo === "marca" || tipo === "estrella" || tipo === "texto") z.coords = mover(o.coords);
    else z.coords = o.coords.map(mover);
    guardar();
    pintarZonas();
    toast("Figura movida.");
  }

  function eliminarZona(id) {
    const z = (estado.zonas || []).find((x) => x.id === id);
    if (!z) return;
    if (!confirm("¿Eliminar esta figura dibujada?")) return;
    if (zonaEditandoVertices === id) terminarEdicionVertices();
    estado.zonas = estado.zonas.filter((x) => x.id !== id);
    guardar();
    if (mapa) mapa.closePopup();
    pintarZonas();
    toast("Figura eliminada.");
  }

  function ajustarVistaTodasUbicaciones() {
    if (!mapa) return;
    const puntos = Object.values(marcadores)
      .filter((marcador) => marcador && typeof marcador.getLatLng === "function")
      .map((marcador) => marcador.getLatLng());
    if (!puntos.length) {
      toast("No hay ubicaciones con coordenadas válidas para mostrar. Revise latitud, longitud y precisión.", "error");
      return;
    }
    if (puntos.length === 1) mapa.setView(puntos[0], Math.max(mapa.getZoom(), 13));
    else mapa.fitBounds(L.latLngBounds(puntos), { padding: [36, 36], maxZoom: 14 });
    toast("Vista ajustada a las " + puntos.length + " ubicaciones con coordenadas guardadas.");
  }

  function enfocarDepartamentoCordoba() {
    if (!mapa) return;
    // Extensión geográfica aproximada del departamento de Córdoba, Colombia.
    // El usuario dibuja después el contorno que necesita; esto no afirma ser un límite oficial.
    mapa.fitBounds([[7.05, -76.65], [9.95, -74.55]], { padding: [24, 24], maxZoom: 8 });
    toast("Vista general de Córdoba. Seleccione Polígono y marque el contorno con clics; doble clic para cerrar.");
  }

  function mostrarBarraDibujo(mostrar) {
    const barra = $("#barraDibujo");
    const toggle = $("#btnDibujoToggle");
    if (barra) barra.hidden = !mostrar;
    if (toggle) toggle.hidden = !!mostrar;
    if (mostrar && mapa) setTimeout(() => mapa.invalidateSize(), 60);
  }

  function setHerramienta(tool) {
    // Los puntos blancos son controles temporales de edición, no figuras del mapa.
    // Ocultarlos al cambiar de herramienta evita que intercepten los clics de borrado.
    if (zonaEditandoVertices && tool !== null) terminarEdicionVertices();
    if (tool === "limpiar") {
      if (!estado.zonas || !estado.zonas.length) {
        terminarEdicionVertices();
        toast("No hay figuras dibujadas.");
        return;
      }
      if (!confirm("¿Borrar todas las figuras dibujadas (" + estado.zonas.length + ")?")) return;
      terminarEdicionVertices();
      if (mapa) mapa.closePopup();
      estado.zonas = [];
      guardar();
      pintarZonas();
      toast("Figuras borradas, incluidos los puntos de edición.");
      return;
    }
    if (tool === "cerrar") {
      setHerramienta(null);
      mostrarBarraDibujo(false);
      return;
    }
    // Al pulsar de nuevo la herramienta o cambiar a otra, guardar el trazo en curso
    // en vez de quitarlo del mapa como si fuera un borrador.
    if (dibujoTmp && (dibujoTmp.tipo === "linea" || dibujoTmp.tipo === "flecha")) {
      const tipoPendiente = dibujoTmp.tipo;
      if (dibujoTmp.pts && dibujoTmp.pts.length >= 2) {
        terminarLinea(tipoPendiente);
        toast("Trazo guardado en el mapa. Puedes seguir dibujando.");
      } else {
        toast("Marca al menos dos puntos para guardar la línea; pulsa Esc si quieres cancelarla.", "error");
      }
      return;
    }
    if (dibujoTmp && dibujoTmp.tipo === "poligono") {
      if (dibujoTmp.pts && dibujoTmp.pts.length >= 3) {
        terminarPoligono();
        toast("Polígono guardado en el mapa. Puedes seguir dibujando.");
      } else {
        toast("Marca al menos tres vértices para guardar el polígono; pulsa Esc si quieres cancelarlo.", "error");
      }
      return;
    }
    cancelarDibujoTmp();
    dibujoTool = dibujoTool === tool ? null : tool;
    $$("#barraDibujo [data-dibujo]").forEach((b) => {
      b.classList.toggle("barra-dibujo__btn--activo", b.dataset.dibujo === dibujoTool);
    });
    document.body.classList.toggle("dibujando", !!dibujoTool && ["poligono", "rectangulo", "circulo", "marca", "linea", "flecha", "estrella", "texto", "mover"].indexOf(dibujoTool) !== -1);
    if (mapa) {
      if (dibujoTool === "poligono" || dibujoTool === "linea" || dibujoTool === "flecha") mapa.doubleClickZoom.disable();
      else mapa.doubleClickZoom.enable();
    }
    const ayudas = {
      poligono: "Clic por vértice · doble clic para cerrar · Esc cancela",
      rectangulo: "Arrastre en el mapa · Esc cancela",
      circulo: "Arrastre desde el centro · Esc cancela",
      linea: "Ruta o camino: clic por vértice · doble clic para terminar · Esc cancela",
      flecha: "Flujo o desplazamiento: clic por vértice · doble clic para terminar · Esc cancela",
      marca: "Clic en el mapa para colocar la marca",
      estrella: "Clic en el mapa para marcar el hito",
      texto: "Clic en el mapa para colocar la etiqueta",
      mover: "Arrastre una figura para moverla · clic para ver sus opciones",
      rellenar: "Elija un color y toque una figura para pintarla",
      eliminar: "Toque una figura para eliminarla"
    };
    $("#dibujoAyuda").textContent = dibujoTool ? (ayudas[dibujoTool] || "") : "";
  }

  function pintarPaleta() {
    const cont = $("#paletaColores");
    cont.innerHTML = PALETA.map((c) =>
      "<button type='button' class='barra-dibujo__color" + (c === colorActivo ? " barra-dibujo__color--activo" : "") +
      "' data-color='" + c + "' style='background:" + c + "' title='Color " + c + "'></button>"
    ).join("");
  }

  function agregarVertice(latlng) {
    if (!dibujoTmp || dibujoTmp.tipo !== dibujoTool) {
      dibujoTmp = { tipo: dibujoTool, pts: [], layer: null, fantasma: null, activo: true };
    }
    dibujoTmp.pts.push([latlng.lat, latlng.lng]);
    refrescarPoligonoTmp();
  }

  function refrescarPoligonoTmp() {
    if (!dibujoTmp) return;
    if (dibujoTmp.layer) mapa.removeLayer(dibujoTmp.layer);
    if (dibujoTmp.fantasma) mapa.removeLayer(dibujoTmp.fantasma);
    dibujoTmp.layer = L.polyline(dibujoTmp.pts, { color: colorActivo, weight: 2, dashArray: "6 5" }).addTo(mapa);
    if (dibujoTmp.punta) mapa.removeLayer(dibujoTmp.punta);
    const ult = dibujoTmp.pts[dibujoTmp.pts.length - 1];
    if (ult) {
      dibujoTmp.punta = L.circleMarker(ult, { radius: 5, color: "#fff", weight: 2, fillColor: colorActivo, fillOpacity: 1 }).addTo(mapa);
    }
  }

  function fantasmaPoligono(latlng) {
    if (!dibujoTmp || !dibujoTmp.pts.length) return;
    if (dibujoTmp.tipo !== "poligono" && dibujoTmp.tipo !== "linea" && dibujoTmp.tipo !== "flecha") return;
    if (dibujoTmp.fantasma) mapa.removeLayer(dibujoTmp.fantasma);
    const ult = dibujoTmp.pts[dibujoTmp.pts.length - 1];
    dibujoTmp.fantasma = L.polyline([ult, [latlng.lat, latlng.lng]], { color: colorActivo, weight: 2, opacity: 0.55, dashArray: "3 6" }).addTo(mapa);
  }

  function terminarPoligono() {
    if (!dibujoTmp || dibujoTmp.tipo !== "poligono") return;
    let pts = dibujoTmp.pts.slice();
    if (pts.length >= 2) {
      const a = pts[pts.length - 1], b = pts[pts.length - 2];
      if (Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7) pts.pop();
    }
    limpiarDibujoTmp();
    if (pts.length < 3) { toast("El polígono necesita al menos 3 vértices.", "error"); return; }
    crearZona({ tipo: "poligono", coords: pts });
    const cLat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cLng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    abrirFichaNueva(cLat, cLng, "lugares");
    setHerramienta("poligono");
    dibujoTool = null;
    $$("#barraDibujo [data-dibujo]").forEach((b) => b.classList.remove("barra-dibujo__btn--activo"));
    document.body.classList.remove("dibujando");
    if (mapa) mapa.doubleClickZoom.enable();
    $("#dibujoAyuda").textContent = "";
  }

  function terminarLinea(tipo) {
    if (!dibujoTmp || dibujoTmp.tipo !== tipo) return;
    let pts = dibujoTmp.pts.slice();
    if (pts.length >= 2) {
      const a = pts[pts.length - 1], b = pts[pts.length - 2];
      if (Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7) pts.pop();
    }
    limpiarDibujoTmp();
    if (pts.length < 2) { toast("La línea necesita al menos 2 puntos.", "error"); return; }
    crearZona({ tipo: tipo, coords: pts });
    const cLat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cLng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    abrirFichaNueva(cLat, cLng, "lugares");
    setHerramienta(tipo);
    dibujoTool = null;
    $$("#barraDibujo [data-dibujo]").forEach((b) => b.classList.remove("barra-dibujo__btn--activo"));
    document.body.classList.remove("dibujando");
    if (mapa) mapa.doubleClickZoom.enable();
    $("#dibujoAyuda").textContent = "";
  }

  function iniciarArrastre(latlng) {
    dibujoTmp = { tipo: dibujoTool, centro: [latlng.lat, latlng.lng], layer: null, activo: true };
    if (mapa.dragging) mapa.dragging.disable();
    if (dibujoTmp.tipo === "rectangulo") {
      dibujoTmp.layer = L.polygon([[latlng.lat, latlng.lng], [latlng.lat, latlng.lng], [latlng.lat, latlng.lng], [latlng.lat, latlng.lng]], estiloZona(colorActivo)).addTo(mapa);
    } else {
      dibujoTmp.layer = L.circle([latlng.lat, latlng.lng], 1, estiloZona(colorActivo)).addTo(mapa);
    }
  }

  function moverArrastre(latlng) {
    if (!dibujoTmp) return;
    const c = dibujoTmp.centro;
    if (dibujoTmp.tipo === "rectangulo") {
      dibujoTmp.layer.setLatLngs([[c[0], c[1]], [c[0], latlng.lng], [latlng.lat, latlng.lng], [latlng.lat, c[1]]]);
    } else {
      const metros = mapa.distance(c, [latlng.lat, latlng.lng]);
      dibujoTmp.layer.setRadius(Math.max(metros, 5));
    }
  }

  function terminarArrastre(latlng) {
    if (!dibujoTmp) return;
    const tmp = dibujoTmp;
    const c = tmp.centro;
    if (mapa.dragging) mapa.dragging.enable();
    dibujoTmp = null;
    if (tmp.layer) mapa.removeLayer(tmp.layer);

    if (tmp.tipo === "rectangulo") {
      const d = Math.abs(c[0] - latlng.lat) + Math.abs(c[1] - latlng.lng);
      if (d < 1e-5) { toast("Arrastre para dibujar el rectángulo.", "error"); return; }
      crearZona({ tipo: "rectangulo", coords: [[c[0], c[1]], [latlng.lat, latlng.lng]] });
      abrirFichaNueva((c[0] + latlng.lat) / 2, (c[1] + latlng.lng) / 2, "lugares");
    } else {
      const metros = mapa.distance(c, [latlng.lat, latlng.lng]);
      if (metros < 10) { toast("Arrastre desde el centro para crear el círculo.", "error"); return; }
      crearZona({ tipo: "circulo", centro: c, radio: metros });
      abrirFichaNueva(c[0], c[1], "lugares");
    }
    setHerramienta(tmp.tipo);
    dibujoTool = null;
    $$("#barraDibujo [data-dibujo]").forEach((b) => b.classList.remove("barra-dibujo__btn--activo"));
    document.body.classList.remove("dibujando");
    $("#dibujoAyuda").textContent = "";
  }

  function crearMarca(latlng) {
    crearZona({ tipo: "marca", coords: [latlng.lat, latlng.lng] });
  }

  function crearEstrella(latlng) {
    crearZona({ tipo: "estrella", coords: [latlng.lat, latlng.lng] });
  }

  function crearTexto(latlng) {
    const z = { tipo: "texto", coords: [latlng.lat, latlng.lng], texto: "Nueva etiqueta" };
    crearZona(z);
    abrirPopupZona(z, latlng);
  }

  function crearZona(datos) {
    estado.zonas = estado.zonas || [];
    datos.id = "z" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    datos.color = colorActivo;
    estado.zonas.push(datos);
    guardar();
    pintarZonas();
    toast("Figura guardada. Use «Rellenar» para cambiarle el color.");
  }

  function limpiarDibujoTmp() {
    if (!dibujoTmp) return;
    ["layer", "fantasma", "punta"].forEach((k) => {
      if (dibujoTmp[k] && mapa.hasLayer(dibujoTmp[k])) mapa.removeLayer(dibujoTmp[k]);
    });
    dibujoTmp = null;
  }

  function cancelarDibujoTmp() {
    if (mapa && mapa.dragging && !mapa.dragging.enabled()) mapa.dragging.enable();
    limpiarDibujoTmp();
  }

  /* ==================== FICHAS Y FILTROS ==================== */

  function iconoDe(ficha) {
    const cat = CATEGORIAS[ficha.categoria] || CATEGORIAS.lugares;
    const activo = fichaSeleccionada === ficha.id;
    // Priorizar el símbolo del componente para que cada categoría se reconozca a simple vista.
    const simbolo = cat.simbolo || "•";
    const sombra = activo
      ? "box-shadow:0 0 0 4px rgba(16,45,79,.35),0 2px 7px rgba(0,0,0,.4);"
      : "box-shadow:0 2px 7px rgba(0,0,0,.35);";
    return L.divIcon({
      className: "marcador marcador-componente" + (activo ? " marcador--activo" : ""),
      html: "<span class='marcador__nodo' role='img' aria-label='" + escapar(cat.nombre) + "' title='" + escapar(cat.nombre) + "' style='display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:3px solid #fff;border-radius:50%;background:" + cat.color + ";color:#fff;font-size:20px;font-weight:800;line-height:1;" + sombra + "text-shadow:0 1px 2px #0008'>" + escapar(simbolo) + "</span>",
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }

  function textoBusqueda(f) {
    return [f.nombre, f.descripcion, f.historia, f.actores, f.fuente, f.fecha, f.observaciones, f.subtema, f.aporte].join(" ").toLowerCase();
  }

  function fichasBuscadas() {
    const q = normalizar($("#busqueda").value);
    return estado.fichas.filter((f) => {
      if (!CATEGORIAS[f.categoria]) return false;
      if (!q) return true;
      return textoBusqueda(f).indexOf(q) !== -1;
    });
  }

  function fichasVisibles() {
    return fichasBuscadas().filter((f) => !!CATEGORIAS[f.categoria] && (!soloVerificados || f.estado === "documentado"));
  }

  function ordenarPorSeccion(lista) {
    return lista.slice().sort((a, b) => {
      const sa = (CATEGORIAS[a.categoria] || {}).seccion || 99;
      const sb = (CATEGORIAS[b.categoria] || {}).seccion || 99;
      return sa !== sb ? sa - sb : a.nombre.localeCompare(b.nombre);
    });
  }

  function categoriasConMarcador() {
    return Object.keys(CATEGORIAS).filter((k) => k !== "delimitacion");
  }

  function pintarSelects() {
    $("#fichaCategoria").innerHTML = categoriasConMarcador()
      .map((k) => "<option value='" + k + "'>" + CATEGORIAS[k].seccion + ". " + escapar(CATEGORIAS[k].nombre) + "</option>")
      .join("");
    const opcionesComponentes = Object.keys(CATEGORIAS)
      .sort((a, b) => CATEGORIAS[a].seccion - CATEGORIAS[b].seccion)
      .map((k) => "<option value='" + k + "'>" + CATEGORIAS[k].seccion + ". " + escapar(CATEGORIAS[k].nombre) + "</option>")
      .join("");
    $("#ideaCategoria").innerHTML = opcionesComponentes;
    $("#ubiCategoria").innerHTML = opcionesComponentes;
    const opcionesSimbolos = Object.entries(SIMBOLOS_CAMPO)
      .map(([nombre, simbolo]) => "<option value='" + escapar(nombre) + "'>" + simbolo + " " + escapar(nombre) + "</option>")
      .join("");
    ["#ubiSimboloCampo", "#ideaUbiSimbolo"].forEach((selector) => {
      const campo = $(selector);
      if (campo) campo.innerHTML = opcionesSimbolos;
    });
    $("#fichaTipoFuente").innerHTML = "<option value=''>Sin especificar</option>" +
      Object.keys(TIPOS_FUENTE)
        .map((k) => "<option value='" + k + "'>" + escapar(TIPOS_FUENTE[k].nombre) + "</option>")
        .join("");
    pintarTipoRegistroSelect();
  }

  function pintarTipoRegistroSelect() {
    const tp = $("#fichaTipoRegistro");
    const tdp = $("#fichaTerritorioPadre");
    if (!tp || !tdp) return;
    const territorios = estado.fichas.filter((f) => f.tipo_registro === "territorio");
    tdp.innerHTML = "<option value=''>Sin territorio padre (independiente)</option>" +
      territorios.map((t) => "<option value='" + t.id + "'>" + escapar(t.nombre) + "</option>").join("");
  }

  function pintarMapa() {
    capaMarcadores.clearLayers();
    marcadores = {};

    // El mapa conserva todas las ubicaciones guardadas; la búsqueda y el filtro
    // de verificación afectan la lista, no hacen desaparecer puntos del mapa.
    (estado.fichas || []).forEach((f) => {
      if (!CATEGORIAS[f.categoria] || catOculta(f.categoria)) return;
      if (f.visible === false || f.precision === "sin") return;
      const lat = numeroCoordenada(f.lat);
      const lng = numeroCoordenada(f.lng);
      if (!coordenadasValidas(lat, lng)) return;
      const m = L.marker([lat, lng], { icon: iconoDe(f) });
      m.on("click", () => seleccionarFicha(f.id, false));
      m.addTo(capaMarcadores);
      const padre = estado.fichas.find((t) => t.id === f.territorio_padre);
      const etiqueta = padre ? f.nombre + " · " + padre.nombre : f.nombre;
      m.bindTooltip(escapar(etiqueta), { permanent: true, direction: "top", offset: [0, -18], className: "etiqueta-nombre", opacity: 1 });
      marcadores[f.id] = m;
    });

    // Las ubicaciones de cada narrativa también se muestran en el mapa.
    (estado.ideas || []).forEach((idea) => {
      (idea.ubicaciones || []).forEach((u, indiceUbicacion) => {
        if (u.categoria && catOculta(u.categoria)) return;
        if (u.precision === "sin") return;
        const lat = numeroCoordenada(u.lat);
        const lng = numeroCoordenada(u.lng);
        if (!coordenadasValidas(lat, lng)) return;
        const cat = CATEGORIAS[u.categoria] || { color: idea.color || "#9B1C1C", simbolo: idea.simbolo || "•", nombre: "Sin clasificar" };
        // El símbolo principal identifica el componente cartográfico; el color coincide con la leyenda.
        // El símbolo del tipo de lugar se conserva en la ficha emergente, sin reemplazar el componente.
        const simboloComponente = cat.simbolo || "•";
        const icono = L.divIcon({
          className: "marcador-narrativa marcador-componente",
          html: "<span role='img' aria-label='" + escapar(cat.nombre || "Componente cartográfico") + "' title='" + escapar(cat.nombre || "Componente cartográfico") + "' style='display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:3px solid #fff;border-radius:50%;background:" + cat.color + ";color:#fff;font-size:20px;font-weight:800;line-height:1;box-shadow:0 2px 7px #0006;text-shadow:0 1px 2px #0008'>" + escapar(simboloComponente) + "</span>",
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        const m = L.marker([lat, lng], { icon: icono, ubiId: u.id });
        m.addTo(capaMarcadores);
        m.bindTooltip(escapar(u.nombre), { permanent: true, direction: "top", offset: [0, -16], className: "etiqueta-nombre", opacity: 1 });
        m.bindPopup("<strong>" + escapar(u.nombre) + "</strong><br><span>" + escapar(idea.nombre) + "</span>" +
          "<p><strong>Componente:</strong> " + escapar(CATEGORIAS[u.categoria]?.nombre || u.categoria || "Sin clasificar") + "</p>" +
          ((u.lugar || idea.territorio) ? "<p><strong>Zona:</strong> " + escapar(u.lugar || idea.territorio) + "</p>" : "") +
          (u.descripcion ? "<p>" + escapar(u.descripcion) + "</p>" : ""));
        // Clave única por tema y posición: evita que IDs repetidos oculten puntos
        // del ajuste de vista general aunque los marcadores sí estén dibujados.
        marcadores["ubi:" + idea.id + ":" + (u.id || indiceUbicacion)] = m;


      });
    });
    aplicarNombres();
  }

  function etiquetasDe(f) {
    let html = "<span class='etiqueta etiqueta--" + f.estado + "'>" + escapar((ESTADOS[f.estado] || {}).nombre || f.estado) + "</span>";
    if (f.tipoFuente && TIPOS_FUENTE[f.tipoFuente]) html += " <span class='etiqueta etiqueta--tipo'>" + escapar(TIPOS_FUENTE[f.tipoFuente].nombre) + "</span>";
    if (f.visible === false) html += " <span class='etiqueta etiqueta--oculta'>fuera del mapa</span>";
    if (f.anonimo) html += " <span class='etiqueta etiqueta--anonima'>identidad protegida</span>";
    return html;
  }

  function fichaCardHTML(f) {
    const cat = CATEGORIAS[f.categoria];
    return (
      "<article class='ficha' data-id='" + f.id + "'>" +
      "<header class='ficha__cabecera'>" +
      "<span class='ficha__punto' style='background:" + cat.color + "'>" + cat.simbolo + "</span>" +
      "<div><h3>" + escapar(f.nombre) + "</h3>" +
      "<p class='ficha__cat' style='color:" + cat.color + "'>" + cat.seccion + ". " + escapar(cat.nombre) + "</p>" +
      (f.subtema ? "<p class='ficha__sub'>" + escapar(f.subtema) + "</p>" : "") +
      "</div>" +
      "</header>" +
      "<p class='ficha__desc'>" + escapar(f.descripcion) + "</p>" +
      (f.fuente ? "<p class='ficha__meta'><strong>Fuente:</strong> " + escapar(f.fuente) + "</p>" : "") +
      (f.fecha ? "<p class='ficha__meta'><strong>Fecha:</strong> " + escapar(f.fecha) + "</p>" : "") +
      "<p class='ficha__estado'>" + etiquetasDe(f) + "</p>" +
      "<div class='ficha__acciones'>" +
      "<button type='button' class='btn btn--mini' data-completa='" + f.id + "'>Ver ficha completa</button>" +
      "<button type='button' class='btn btn--mini' data-ver='" + f.id + "'>Ver en mapa</button>" +
      "<button type='button' class='btn btn--mini' data-editar='" + f.id + "'>Editar</button>" +
      "<button type='button' class='btn btn--mini btn--peligro' data-eliminar='" + f.id + "'>Eliminar</button>" +
      "</div></article>"
    );
  }

  /* ==================== PANEL DERECHO: INFORMACIÓN Y DETALLE ==================== */

  function estadoReflexionOk() {
    const r = estado.reflexion || {};
    const relleno = (t) => t && t.trim() && t !== REFLEXION_INICIAL.texto && t !== REFLEXION_INICIAL.reto && t !== REFLEXION_INICIAL.oportunidad;
    return { texto: relleno(r.texto), reto: relleno(r.reto), oportunidad: relleno(r.oportunidad) };
  }

  function pintarInfo() {
    const cont = $("#infoGeneral");
    if (!cont) return;
    fichaSeleccionada = null;
    $("#infoDetalle").hidden = true;
    $("#infoDetalle").innerHTML = "";
    $("#panelInfoTitulo").textContent = "Información";

    cont.innerHTML =
      "<p class='lectura__titulo'>" + escapar(estado.config.nombreTerritorio || "Territorio") + "</p>" +
      "<p class='vacio'>Haga clic en un marcador o use «Ver en mapa» desde cualquier sección para consultar aquí la ficha completa.</p>" +
      "<div class='lectura__acciones'>" +
      "<button type='button' class='btn btn--primario btn--bloque' data-accion='nueva'>＋ Agregar registro</button>" +
      "<button type='button' class='btn btn--bloque' data-seccion-ir='lugares'>📇 Ver catálogo (" + estado.fichas.length + ")</button>" +
      "</div>";
    cont.hidden = false;
  }

  function detalleHTML(f, conVolver) {
    const cat = CATEGORIAS[f.categoria];
    const est = ESTADOS[f.estado] || { nombre: f.estado };
    let html = "<div class='detalle'>";
    if (conVolver !== false) html += "<button type='button' class='btn btn--mini detalle__volver' data-volver-info>← Volver</button>";
    html += "<span class='popup__categoria' style='color:" + cat.color + "'>" + cat.simbolo + " " + cat.seccion + ". " + escapar(cat.nombre) + "</span>";
    html += "<h2 class='detalle__titulo'>" + escapar(f.nombre) + "</h2>";
    const sinMapa = f.visible === false || f.precision === "sin" || typeof f.lat !== "number";
    html += "<p class='detalle__ubicacion'>📍 " + (sinMapa ? "Sin ubicación en el mapa" : f.lat.toFixed(5) + ", " + f.lng.toFixed(5) + " (" + escapar(f.precision || "exacta") + ")") + "</p>";
    if (f.subtema) html += "<p class='detalle__ficha-dato'><strong>Subtema:</strong> " + escapar(f.subtema) + "</p>";
    html += "<p class='detalle__desc'>" + escapar(f.descripcion) + "</p>";
    if (f.historia) html += "<p class='detalle__ficha-dato'><strong>Historia o relato:</strong> " + escapar(f.historia) + "</p>";
    if (f.actores) html += "<p class='detalle__ficha-dato'><strong>👥 Actores:</strong> " + escapar(f.actores) + "</p>";
    if (f.fecha) html += "<p class='detalle__ficha-dato'><strong>📅 Fecha o periodo:</strong> " + escapar(f.fecha) + "</p>";
    if (f.fuente) html += "<p class='detalle__ficha-dato'><strong>📖 Fuente:</strong> " + escapar(f.fuente) + "</p>";
    if (f.tipoFuente && TIPOS_FUENTE[f.tipoFuente]) html += "<p class='detalle__ficha-dato'><strong>Tipo de fuente:</strong> " + escapar(TIPOS_FUENTE[f.tipoFuente].nombre) + " — " + escapar(TIPOS_FUENTE[f.tipoFuente].descripcion) + "</p>";
    if (f.evidencias) html += "<p class='detalle__ficha-dato'><strong>📎 Evidencias:</strong> " + escapar(f.evidencias) + "</p>";
    if (f.observaciones) html += "<p class='detalle__ficha-dato'><strong>🗒️ Observaciones:</strong> " + escapar(f.observaciones) + "</p>";
    if (f.aporte) html += "<p class='detalle__ficha-dato'><strong>🕊️ Aporte a la lectura de paz:</strong> " + escapar(f.aporte) + "</p>";
    const rel = (f.relacionados || []).map((r) => ({ ...estado.fichas.find((x) => x.id === r.id), tipo: r.tipo || "relacionada" })).filter(Boolean);
    if (rel.length) {
      html += "<p class='detalle__ficha-dato'><strong>🔗 Relacionado con:</strong></p><div class='relacionados-lista'>" +
        rel.map((r) => {
          const tipo = TIPOS_RELACION[r.tipo] || TIPOS_RELACION.relacionada;
          return "<div class='relacion-detalle'><span class='rel-tipo-badge' style='background:" + tipo.color + ";color:#fff;padding:2px 6px;border-radius:4px;font-size:0.65rem;'>" + tipo.simbolo + " " + tipo.nombre + "</span> " +
            "<button type='button' class='btn btn--mini' data-ver='" + r.id + "' title='Ver ficha'>" + escapar(r.nombre) + "</button>" +
            "</div>";
        }).join("") + "</div>";
    }
    html += "<p class='detalle__ficha-dato'><strong>Estado de verificación:</strong> " + escapar(est.nombre) + " — " + escapar((ESTADOS[f.estado] || {}).descripcion || "") + "</p>";
    if (f.creado) html += "<p class='detalle__ficha-dato'><strong>Fecha de registro:</strong> " + escapar(String(f.creado).slice(0, 10)) + "</p>";
    html += "<p class='ficha__estado'>" + etiquetasDe(f) + "</p>";
    html += "<div class='popup__acciones'>" +
      (sinMapa ? "" : "<button type='button' class='btn btn--mini' data-streetview='" + f.id + "'>📷 Ver cómo es (Street View)</button>") +
      "<button type='button' class='btn btn--mini' data-ver='" + f.id + "'>Centrar en el mapa</button>" +
      "<button type='button' class='btn btn--mini' data-editar='" + f.id + "'>Editar</button>" +
      "<button type='button' class='btn btn--mini btn--peligro' data-eliminar='" + f.id + "'>Eliminar</button>" +
      "</div></div>";
    return html;
  }

  function seleccionarFicha(id, centrar) {
    const f = estado.fichas.find((x) => x.id === id);
    if (!f) return;
    fichaSeleccionada = id;
    if (seccionActual !== "mapa") navegar("mapa");
    $("#infoGeneral").hidden = true;
    $("#infoDetalle").innerHTML = detalleHTML(f, true);
    $("#infoDetalle").hidden = false;
    $("#panelInfoTitulo").textContent = "Ficha seleccionada";
    pintarMapa();
    const lat = numeroCoordenada(f.lat);
    const lng = numeroCoordenada(f.lng);
    if (centrar !== false && coordenadasValidas(lat, lng) && f.visible !== false && f.precision !== "sin") {
      mapa.setView([lat, lng], Math.max(mapa.getZoom(), 14));
    }
    if (window.matchMedia("(max-width: 900px)").matches) cambiarVista("info");
  }

  function abrirStreetView(id) {
    const f = estado.fichas.find((x) => x.id === id);
    if (!f || typeof f.lat !== "number" || f.precision === "sin") {
      toast("Este registro no tiene coordenadas para la vista callejera.", "error");
      return;
    }
    const url = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + f.lat + "," + f.lng;
    window.open(url, "_blank", "noopener");
  }

  function abrirFichaCompleta(id) {
    const f = estado.fichas.find((x) => x.id === id);
    if (!f) return;
    $("#tituloVerFicha").textContent = f.nombre;
    $("#verFichaCuerpo").innerHTML = detalleHTML(f, false);
    $("#verFichaPie").innerHTML =
      "<button type='button' class='btn' data-cerrar='modalVerFicha'>Cerrar</button>" +
      "<button type='button' class='btn' data-ver='" + f.id + "'>Ver en mapa</button>" +
      "<button type='button' class='btn btn--primario' data-editar='" + f.id + "'>Editar registro</button>";
    abrirModal("modalVerFicha");
  }

  /* ==================== SECCIONES ==================== */

  function navegar(seccion) {
    seccionActual = seccion;
    document.body.dataset.seccion = seccion;
    const btnNueva = $("#btnNueva");
    if (btnNueva) {
      const esTemas = seccion === "ideas";
      btnNueva.textContent = esTemas ? "＋ Nuevo tema" : "＋ Agregar registro";
      btnNueva.setAttribute("aria-label", esTemas ? "Crear un tema de cartografía" : "Agregar un registro territorial");
      btnNueva.title = esTemas ? "Crear un tema y vincularle varias ubicaciones" : "Agregar un registro a la cartografía";
    }
    $$(".principal__btn").forEach((b) => b.classList.toggle("principal__btn--activo", b.dataset.seccion === seccion));
    $$(".vista").forEach((v) => {
      const activa = v.dataset.vistaSeccion === seccion;
      v.classList.toggle("vista--activa", activa);
      v.hidden = !activa;
    });
    if (seccion === "lugares") pintarLugares();
    else if (seccion === "ideas") pintarIdeas();
    else if (seccion === "memoria") pintarGruposSeccion("#memoriaSecciones", ["afectaciones", "memoria"]);
    else if (seccion === "actores") pintarGruposSeccion("#actoresSecciones", ["actores", "resistencia", "esperanza"]);
    else if (seccion === "reflexion") pintarReflexion();
    else if (seccion === "mapa" && mapa) setTimeout(() => mapa.invalidateSize(), 120);
  }

  function pintarLugares() {
    const cont = $("#lugaresChips");
    const base = fichasVisibles();
    const chips = [{ k: "todas", n: "Todos", c: null }].concat(
      categoriasConMarcador().map((k) => ({ k: k, n: CATEGORIAS[k].seccion + ". " + CATEGORIAS[k].nombre, c: CATEGORIAS[k].color, s: CATEGORIAS[k].simbolo }))
    );
    let html = "<div class='chips__fila'>" + chips.map((c) => {
      const n = c.k === "todas" ? base.length : base.filter((f) => f.categoria === c.k).length;
      return "<button type='button' class='chip" + (chipLugares === c.k ? " chip--activo" : "") + "' data-chip='" + c.k + "'>" +
        (c.s ? "<span style='color:" + (chipLugares === c.k ? "#fff" : c.c) + "'>" + c.s + "</span> " : "") +
        escapar(c.n) + " <span class='chip__n'>" + n + "</span></button>";
    }).join("") + "</div>";
    html += "<div class='chips__fila'><button type='button' class='chip" + (soloVerificados ? " chip--activo" : "") + "' data-verif title='Mostrar únicamente los registros documentados (mapa, listas e informe)'>✓ Solo verificados</button></div>";
    cont.innerHTML = html;

    const ordenadas = ordenarPorSeccion(chipLugares === "todas" ? base : base.filter((f) => f.categoria === chipLugares));
    const clavesTemas = chipLugares === "todas"
      ? Object.keys(CATEGORIAS).filter((k) => CATEGORIAS[k] && CATEGORIAS[k].seccion)
      : [chipLugares];
    $("#lugaresLista").innerHTML =
      (ordenadas.length
        ? ordenadas.map(fichaCardHTML).join("")
        : "<p class='vacio'>No hay registros con estos criterios. Quite la búsqueda, elija otro filtro o agregue un registro nuevo con el botón «＋ Agregar registro».</p>") +
      resumenTemasHTML(clavesTemas, chipLugares === "todas");

  }

  function cortar(txt, n) {
    const t = String(txt || "").trim();
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
  }

  function tarjetaTira(o) {
    return "<article class='tira-tarjeta' style='--tira-color:" + o.color + "'>" +
      "<header class='tira-tarjeta__cabecera'><span class='tira-tarjeta__num' style='background:" + o.color + ";" + (o.textoColor ? "color:" + o.textoColor + ";" : "") + "'>" + escapar(o.num) + "</span>" +
      "<h3>" + escapar(o.nombre) + "</h3></header>" +
      "<ul>" + o.items.map((t) => "<li>" + escapar(t) + "</li>").join("") + "</ul>" +
      "<button type='button' class='tira-tarjeta__ver' data-tira='" + o.destino + "'" + (o.chip ? " data-tira-chip='" + o.chip + "'" : "") + ">Ver" + (o.total ? " (" + o.total + ")" : "") + " →</button>" +
      "</article>";
  }

  function pintarTiraLectura() {
    const cont = $("#tiraLecturaRejilla");
    if (!cont) return;
    const base = fichasVisibles();
    const cfg = estado.config || {};
    let html = "";
    const limTxt = !cfg.mostrarLimite ? "Sin límite visible" :
      (cfg.limite && cfg.limite.properties && cfg.limite.properties.oficial ? "Límite oficial ✓" : "Límite aproximado");
    html += tarjetaTira({
      num: "01", nombre: "Delimitación y nombre", color: "#102D4F", simbolo: "◎",
      items: [cfg.nombreTerritorio || "Territorio", [cfg.municipio, cfg.departamento].filter(Boolean).join(", "), limTxt].filter(Boolean),
      destino: "territorio"
    });
    const destinoSec = { lugares: ["lugares", "lugares"], afectaciones: ["memoria"], actores: ["actores"], resistencia: ["actores"], memoria: ["memoria"], esperanza: ["actores"], retos: ["lugares", "retos"] };
    categoriasConMarcador().forEach((k) => {
      const cat = CATEGORIAS[k];
      const fichas = ordenarPorSeccion(base.filter((f) => f.categoria === k));
      const items = fichas.slice(0, 4).map((f) => f.nombre);
      if (fichas.length > 4) items.push("＋" + (fichas.length - 4) + " más");
      const d = destinoSec[k] || ["lugares"];
      html += tarjetaTira({
        num: String(cat.seccion).padStart(2, "0"), nombre: cat.nombre, color: cat.color, simbolo: cat.simbolo,
        items: items.length ? items : ["Sin registros aún"],
        destino: d[0], chip: d[1], total: fichas.length
      });
    });
    const r = estado.reflexion || {};
    const itemsR = [];
    if (r.reto && r.reto.trim() && r.reto !== REFLEXION_INICIAL.reto) itemsR.push("Reto: " + cortar(r.reto, 64));
    if (r.oportunidad && r.oportunidad.trim() && r.oportunidad !== REFLEXION_INICIAL.oportunidad) itemsR.push("Oportunidad: " + cortar(r.oportunidad, 64));
    html += tarjetaTira({
      num: "✍", nombre: "Reflexión final", color: "#C9A227", simbolo: "☀", textoColor: "#1A1405",
      items: itemsR.length ? itemsR : ["Aún sin escribir"],
      destino: "reflexion"
    });
    cont.innerHTML = html;
  }

  function alternarTira(forzar) {
    const sec = $("#tiraLectura");
    const btn = $("#btnTiraLectura");
    if (!sec || !btn) return;
    const plegar = forzar === undefined ? !sec.classList.contains("plegada") : !!forzar;
    sec.classList.toggle("plegada", plegar);
    btn.setAttribute("aria-expanded", String(!plegar));
  }

  function resumenTemasHTML(claves, todasLasUbicaciones) {
    const ideas = Array.isArray(estado.ideas) ? estado.ideas : [];
    const relacionadas = ideas.map((idea) => {
      const ubicaciones = Array.isArray(idea.ubicaciones) ? idea.ubicaciones : [];
      const temaCoincide = claves.includes(idea.categoria || "afectaciones");
      const ubicacionesCoinciden = ubicaciones.filter((u) => claves.includes(u.categoria || idea.categoria || "afectaciones"));
      if (!temaCoincide && !ubicacionesCoinciden.length) return null;
      const mostradas = todasLasUbicaciones || temaCoincide ? ubicaciones : ubicacionesCoinciden;
      return { idea, ubicaciones: mostradas };
    }).filter(Boolean);
    if (!relacionadas.length) {
      return "<div class='grupo-temas-vinculados'><h3>Temas y ubicaciones vinculados</h3><p class='vacio'>Todavía no hay temas de «Temas y ubicaciones» asociados a estos componentes.</p><button type='button' class='btn btn--mini' data-seccion-ir='ideas'>Ir a Temas y ubicaciones →</button></div>";
    }
    return "<div class='grupo-temas-vinculados'><h3>Temas y ubicaciones vinculados</h3><p>Estos temas se muestran desde el menú «Temas y ubicaciones»; no son copias de las fichas.</p>" +
      relacionadas.map(({ idea, ubicaciones }) =>
        "<article class='grupo-tema-vinculado'><strong>" + escapar(idea.nombre || "Tema sin nombre") + "</strong>" +
        (idea.descripcion ? "<p>" + escapar(idea.descripcion) + "</p>" : "") +
        "<small>" + ubicaciones.length + " ubicación" + (ubicaciones.length === 1 ? "" : "es") + "</small>" +
        (ubicaciones.length ? "<ul>" + ubicaciones.map((u) => "<li><strong>" + escapar(u.nombre || "Ubicación sin nombre") + "</strong>" + (u.lugar ? " · " + escapar(u.lugar) : "") + (u.descripcion ? "<p>" + escapar(u.descripcion) + "</p>" : "") + (typeof u.lat === "number" && typeof u.lng === "number" ? "<small>Coordenadas: " + u.lat.toFixed(5) + ", " + u.lng.toFixed(5) + "</small>" : "<small>Sin coordenadas guardadas</small>") + "</li>").join("") + "</ul>" : "<p class='vacio'>Este tema aún no tiene ubicaciones agregadas.</p>") +
        "<button type='button' class='btn btn--mini' data-abrir-tema='" + escapar(idea.id) + "'>Abrir tema →</button></article>"
      ).join("") + "<button type='button' class='btn btn--mini' data-seccion-ir='ideas'>Gestionar temas y ubicaciones →</button></div>";
  }

  function pintarGruposSeccion(contSel, claves) {
    const cont = $(contSel);
    if (!cont) return;
    const base = fichasVisibles();
    let html = "";
    let total = 0;
    claves.forEach((k) => {
      const cat = CATEGORIAS[k];
      if (!cat) return;
      const fichas = ordenarPorSeccion(base.filter((f) => f.categoria === k));
      total += fichas.length;
      html +=
        "<section class='grupo-seccion'>" +
        "<header class='grupo-seccion__cabecera'>" +
        "<span class='grupo-seccion__num' style='background:" + cat.color + "'>" + cat.seccion + "</span>" +
        "<div><h2>" + escapar(cat.nombre) + "</h2><p>" + escapar(cat.descripcion) + "</p></div>" +
        "<span class='grupo-seccion__n'>" + fichas.length + " registro" + (fichas.length === 1 ? "" : "s") + "</span>" +
        "</header>" +
        (fichas.length ? fichas.map(fichaCardHTML).join("") : "<p class='vacio'>Sin fichas de registro en esta sección aún. Puede agregarlas con «＋ Agregar registro».</p>") +
        resumenTemasHTML([k], false) +
        "</section>";
    });
    cont.innerHTML = total === 0 && !normalizar($("#busqueda").value) && !(estado.ideas || []).length
      ? "<p class='vacio'>Esta sección aún no tiene registros ni temas vinculados. Use «＋ Agregar registro» o «Temas y ubicaciones» para empezar.</p>"
      : html;
  }

  function pintarReflexion() {
    const ok = estadoReflexionOk();
    const marca = (v) => v ? "<span class='menu__ok'>✓</span>" : "<span class='menu__pend'>○</span>";
    const completo = ok.texto && ok.reto && ok.oportunidad;
    $("#reflexionEstado").innerHTML =
      (completo
        ? "<strong>Reflexión completa.</strong> Texto, reto y oportunidad guardados."
        : "Avance: " + marca(ok.texto) + " Reflexión escrita · " + marca(ok.reto) + " Reto · " + marca(ok.oportunidad) + " Oportunidad") +
      " — Los cambios se guardan automáticamente al pulsar «Guardar reflexión».";
    $("#refTexto").value = estado.reflexion.texto || "";
    $("#refReto").value = estado.reflexion.reto || "";
    $("#refOportunidad").value = estado.reflexion.oportunidad || "";

    const ideas = Array.isArray(estado.ideas) ? estado.ideas : [];
    const totalUbicaciones = ideas.reduce((n, idea) => n + (Array.isArray(idea.ubicaciones) ? idea.ubicaciones.length : 0), 0);
    const categorias = [...new Set(ideas.map((idea) => idea.categoria || "afectaciones"))];
    $("#reflexionContexto").innerHTML = ideas.length
      ? "<p>Esta síntesis reúne información ya registrada en «Temas y ubicaciones». No modifica el texto de la reflexión ni crea registros duplicados.</p>" +
        "<p><strong>" + ideas.length + " tema" + (ideas.length === 1 ? "" : "s") + " · " + totalUbicaciones + " ubicaciones · " + estado.fichas.length + " fichas territoriales.</strong></p>" +
        ideas.map((idea) => {
          const ubicaciones = Array.isArray(idea.ubicaciones) ? idea.ubicaciones : [];
          const cat = CATEGORIAS[idea.categoria || "afectaciones"];
          return "<article class='grupo-tema-vinculado'><strong>" + escapar(idea.nombre || "Tema sin nombre") + "</strong>" +
            "<small>" + escapar(cat ? cat.nombre : "Componente sin clasificar") + " · " + ubicaciones.length + " ubicación" + (ubicaciones.length === 1 ? "" : "es") + "</small>" +
            (idea.descripcion ? "<p>" + escapar(idea.descripcion) + "</p>" : "") +
            (ubicaciones.length ? "<ul>" + ubicaciones.map((u) => "<li><strong>" + escapar(u.nombre || "Ubicación sin nombre") + "</strong>" + (u.lugar ? " · " + escapar(u.lugar) : "") + (u.descripcion ? "<p>" + escapar(u.descripcion) + "</p>" : "") + (typeof u.lat === "number" && typeof u.lng === "number" ? "<small>Coordenadas: " + u.lat.toFixed(5) + ", " + u.lng.toFixed(5) + "</small>" : "<small>Sin coordenadas guardadas</small>") + "</li>").join("") + "</ul>" : "<p class='vacio'>Sin ubicaciones registradas.</p>") +
            "</article>";
        }).join("") +
        "<button type='button' class='btn btn--mini' data-seccion-ir='ideas'>Revisar temas y ubicaciones →</button>"
      : "<p class='vacio'>Todavía no hay temas creados. Primero registre una idea y sus ubicaciones en «Temas y ubicaciones»; aquí podrá consultarlas para elaborar la reflexión.</p><button type='button' class='btn btn--mini' data-seccion-ir='ideas'>Ir a Temas y ubicaciones →</button>";

    const retos = ordenarPorSeccion(estado.fichas.filter((f) => f.categoria === "retos"));
    $("#reflexionRetos").innerHTML = retos.length
      ? retos.map(fichaCardHTML).join("")
      : "<p class='vacio'>Aún no hay retos registrados en la sección 08. Puede crearlos aquí con «＋ Agregar registro» (categoría «Retos actuales para la construcción de paz»).</p>";
  }

  function repintarSeccion() {
    if (seccionActual === "lugares") pintarLugares();
    else if (seccionActual === "ideas") pintarIdeas();
    else if (seccionActual === "memoria") pintarGruposSeccion("#memoriaSecciones", ["afectaciones", "memoria"]);
    else if (seccionActual === "actores") pintarGruposSeccion("#actoresSecciones", ["actores", "resistencia", "esperanza"]);
    else if (seccionActual === "reflexion") pintarReflexion();
  }

  function pintarProgreso() {
    const cont = $("#progresoEntrega");
    if (!cont) return;
    const ok = estadoReflexionOk();
    const marca = (v) => v ? "<span class='menu__ok'>✓</span>" : "<span class='menu__pend'>○</span>";
    const cats = categoriasConMarcador();
    const conDatos = cats.filter((k) => estado.fichas.some((f) => f.categoria === k)).length;
    const doc = estado.fichas.filter((f) => f.estado === "documentado").length;
    const pend = estado.fichas.filter((f) => f.estado !== "documentado").length;
    const filas = [
      ["Datos generales (participante o grupo)", !!((estado.config.participante || "").trim())],
      ["Registros creados (" + estado.fichas.length + ")", estado.fichas.length > 0],
      ["Secciones 02–08 con registros (" + conDatos + " de " + cats.length + ")", conDatos === cats.length],
      ["Registros documentados (" + doc + ")", doc > 0],
      [pend === 0 ? "Todo verificado" : "Pendientes de verificar (" + pend + ")", pend === 0],
      ["Reflexión escrita", !!ok.texto],
      ["Reto concreto", !!ok.reto],
      ["Oportunidad concreta", !!ok.oportunidad]
    ];
    cont.innerHTML = "<div class='convenciones__seccion'>Progreso para la entrega</div>" +
      filas.map((x) => "<div class='convenciones__item'>" + marca(x[1]) + "<span>" + escapar(x[0]) + "</span></div>").join("");
  }

  function pintarMenuConvenciones() {
    const cont = $("#menuConvenciones");
    if (!cont) return;
    const base = fichasVisibles();
    const cats = categoriasConMarcador();
    let html = "<div class='leyenda-introduccion'><p><strong>¿Cómo leer este cuadro de convenciones?</strong> Cada símbolo permite reconocer rápidamente qué aspecto del territorio se está documentando. Busca en el mapa el mismo símbolo y color, y consulta la explicación para entender qué representa y cómo se relaciona con la construcción de paz.</p><div class='leyenda-claves'><span><i class='leyenda-clave leyenda-clave--color'></i> <strong>Color del punto:</strong> categoría temática del registro</span><span><i class='leyenda-clave leyenda-clave--icono'>📍</i> <strong>Icono del lugar:</strong> tipo de sitio o elemento, como una escuela, finca o iglesia</span><span><i class='leyenda-clave leyenda-clave--punto'>●</i> <strong>Punto del mapa:</strong> ubicación registrada</span><span><i class='leyenda-clave leyenda-clave--punto'>🗺️</i> <strong>Línea o polígono:</strong> territorio o zona delimitada</span></div><p class='leyenda-introduccion__nota'>Una ubicación puede ser exacta, aproximada o no mostrarse en el mapa, según los datos disponibles. El símbolo clasifica el tema, pero no demuestra por sí solo que un hecho haya ocurrido. Lee la descripción, la fecha y la fuente; distingue los hechos documentados de los testimonios y de la información pendiente de confirmar.</p></div><div class='leyenda-grupo-titulo'>A. Categorías de la cartografía de paz</div>";
    // La delimitación es una convención territorial (línea o polígono), no un marcador temático.
    const limite = CATEGORIAS.delimitacion;
    html += "<div class='menu__cat'><span class='menu__cat__simbolo' style='--cat-color:" + limite.color + "'>" + limite.simbolo + "</span><div class='menu__cat__info'><div class='menu__cat__encabezado'><strong style='color:" + limite.color + "'>" + limite.seccion + ". " + escapar(limite.nombre) + "</strong></div><p>" + escapar(limite.descripcion) + "</p></div></div>";

    cats.forEach((k) => {
      const c = CATEGORIAS[k];
      const n = base.filter((f) => f.categoria === k).length + (estado.ideas || []).reduce((total, idea) => total + (idea.ubicaciones || []).filter((u) => u.categoria === k).length, 0);
      html +=
        "<div class='menu__cat'>" +
        "<span class='menu__cat__simbolo' style='--cat-color:" + c.color + "'>" + c.simbolo + "</span>" +
        "<div class='menu__cat__info'>" +
        "<div class='menu__cat__encabezado'>" +
        "<strong style='color:" + c.color + "'>" + c.seccion + ". " + escapar(c.nombre) + "</strong>" +
        "<span class='menu__cat__n' style='--cat-color:" + c.color + "'>" + n + "</span>" +
        "</div>" +
        "<p>" + escapar(c.descripcion) + "</p>" +
        "</div>" +
        "<button class='menu__cat__btn' data-cat='" + k + "' title='Consultar registros de «" + escapar(c.nombre) + "»' aria-label='Consultar registros de " + escapar(c.nombre) + "'>↗</button>" +
        "</div>";
    });

    html += "<div class='leyenda-grupo-titulo leyenda-grupo-titulo--iconos'>B. Símbolos según el tipo de lugar</div>" +
      "<p class='leyenda-ayuda-iconos'>Estos iconos identifican el tipo de sitio (por ejemplo, escuela o finca). El color del punto indica la categoría temática; icono y color comunican información diferente.</p>" +
      "<div class='leyenda-iconos-grid'>";
    const simbolos = (typeof SIMBOLOS_CAMPO !== "undefined" && SIMBOLOS_CAMPO) ? SIMBOLOS_CAMPO : {};
    const entradas = Object.entries(simbolos);
    entradas.forEach(([nombre, simbolo]) => {
      const etiqueta = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      const explicaciones = {"ganadería":"Fincas o zonas dedicadas a la ganadería","escuelas":"Instituciones educativas y escuelas","parques":"Parques, plazas y espacios públicos","iglesias":"Iglesias y espacios de comunidad de fe","jóvenes":"Espacios o iniciativas de jóvenes","fincas":"Fincas, predios y espacios rurales","agrícolas":"Cultivos y actividades agrícolas","salud":"Hospitales, centros y puestos de salud","comercio":"Tiendas, mercados y zonas comerciales","transporte":"Rutas, terminales y puntos de transporte"};
      const explicacion = explicaciones[nombre] || ("Lugar clasificado como " + nombre);
      html += "<div class='leyenda-icono-item'><span class='leyenda-icono-muestra' aria-hidden='true'>" + simbolo + "</span><span class='leyenda-icono-texto'><strong>" + escapar(etiqueta) + "</strong><small>" + escapar(explicacion) + "</small></span></div>";
    });
    const personalizados = [...new Set(base.map((f) => (f.simboloCampo || "").trim()).filter(Boolean))]
      .filter((s) => !entradas.some(([, icono]) => icono === s));
    personalizados.forEach((simbolo) => {
      html += "<div class='leyenda-icono-item'><span class='leyenda-icono-muestra' aria-hidden='true'>" + escapar(simbolo) + "</span><span class='leyenda-icono-texto'><strong>Icono personalizado</strong><small>Símbolo definido para uno o más registros</small></span></div>";
    });
    if (!entradas.length && !personalizados.length) {
      html += "<p class='leyenda-ayuda-iconos'>Los registros sin icono específico usan el símbolo de su categoría.</p>";
    }
    html += "</div>";

    cont.innerHTML = html;
    $$(".menu__cat__btn").forEach((b) => {
      b.addEventListener("click", () => {
        chipLugares = b.dataset.cat;
        chipSubtema = "todos";
        pintarLugares();
        navegar("lugares");
      });
    });
  }

  function abrirConvencionesCompletas() {
    const origen = $("#menuConvenciones");
    const destino = $("#convencionesCompletoContenido");
    if (!origen || !destino) return;
    destino.innerHTML = origen.innerHTML;
    destino.querySelectorAll(".menu__cat__btn").forEach((btn) => btn.remove());
    abrirModal("modalConvencionesCompleto");
  }

  function repintar() {
    pintarMapa();
    if (fichaSeleccionada && estado.fichas.some((f) => f.id === fichaSeleccionada)) {
      const f = estado.fichas.find((x) => x.id === fichaSeleccionada);
      $("#infoGeneral").hidden = true;
      $("#infoDetalle").innerHTML = detalleHTML(f, true);
      $("#infoDetalle").hidden = false;
      $("#panelInfoTitulo").textContent = "Ficha seleccionada";
    } else {
      pintarInfo();
    }
    pintarProgreso();
    pintarMenuConvenciones();
    pintarTiraLectura();
    repintarSeccion();
  }

  // ==================== IDEAS / NARRATIVAS TEMÁTICAS ====================

  function simboloCampoDe(ubi) {
    if (ubi?.simboloCampo && SIMBOLOS_CAMPO[ubi.simboloCampo]) return ubi.simboloCampo;
    const texto = ((ubi?.nombre || "") + " " + (ubi?.descripcion || "")).toLocaleLowerCase("es");
    if (/extorsi|vacuna|cobro ilegal/.test(texto)) return "Extorsión / vacunas";
    if (/amenaz|intimidaci/.test(texto)) return "Amenazas";
    if (/homicid|asesinat/.test(texto)) return "Homicidios";
    if (/desaparecid/.test(texto)) return "Desaparición";
    if (/desplazad/.test(texto)) return "Desplazamiento";
    if (/hurto|robo/.test(texto)) return "Hurtos";
    if (/ganader|ganado|vaca|reses/.test(texto)) return "Ganadería";
    if (/colegio|escuela/.test(texto)) return /fútbol|futbol/.test(texto) ? "Escuela de fútbol" : "Colegio";
    if (/iglesia|templo|parroquia/.test(texto)) return "Iglesia";
    if (/finca|predio/.test(texto)) return "Finca";
    if (/hospital|salud|clínica|clinica/.test(texto)) return "Hospital / salud";
    if (/bombero/.test(texto)) return "Bomberos";
    if (/policía|policia/.test(texto)) return "Policía";
    if (/alcaldía|alcaldia/.test(texto)) return "Alcaldía";
    if (/icbf|protección infantil/.test(texto)) return "ICBF / protección infantil";
    if (/danza|arte|artístico|artistico/.test(texto)) return "Arte y danza";
    if (/comercio|tienda|mercado/.test(texto)) return "Comercio";
    return "Sin símbolo específico";
  }

  function actualizarVistaPreviaSimbolo() {
    const campo = $("#ubiSimboloCampo");
    const vista = $("#ubiSimboloVistaPrevia");
    if (!campo || !vista) return;
    const simbolo = SIMBOLOS_CAMPO[campo.value] || "•";
    vista.innerHTML = "<span>" + escapar(simbolo) + "</span><strong>" + escapar(campo.value || "Símbolo del lugar") + "</strong>";
  }

  function agregarUbicacionAlFormularioTema() {
    const cont = $("#ideaUbicacionesAdicionales");
    if (!cont) return;
    const n = cont.querySelectorAll(".idea-ubicacion-extra").length + 2;
    const bloque = document.createElement("section");
    bloque.className = "idea-ubicacion-extra";
    bloque.style.cssText = "border:1px solid var(--borde,#d9e0e7);border-radius:12px;padding:14px;margin-top:12px";
    bloque.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <h4>Ubicación adicional ${n}</h4>
        <button type="button" class="btn btn--suave" data-quitar-ubicacion-tema>Quitar</button>
      </div>
      <label>Nombre del lugar
        <input type="text" data-ubi-extra="nombre" placeholder="Ej.: kiosco de otra vereda">
      </label>
      <label>Municipio, vereda o zona específica
        <input type="text" data-ubi-extra="lugar" placeholder="Ej.: Sahagún, Córdoba">
      </label>
      <label>Descripción de este lugar
        <textarea rows="2" data-ubi-extra="descripcion" placeholder="¿Qué relación tiene este sitio con el tema?"></textarea>
      </label>
      <label>Fecha o periodo relacionado
        <input type="text" data-ubi-extra="fecha" placeholder="Ej.: desde 2018, actualidad">
      </label>
      <label>Símbolo del lugar
        <select data-ubi-extra="simbolo">${Object.keys(SIMBOLOS_CAMPO).map((nombre) => `<option value="${escapar(nombre)}">${escapar(SIMBOLOS_CAMPO[nombre])} — ${escapar(nombre)}</option>`).join("")}</select>
      </label>
      <div class="formulario__fila">
        <label>Latitud<input type="number" step="any" min="-90" max="90" data-ubi-extra="lat" placeholder="8.6100"></label>
        <label>Longitud<input type="number" step="any" min="-180" max="180" data-ubi-extra="lng" placeholder="-75.4698"></label>
        <label>Precisión
          <select data-ubi-extra="precision">
            <option value="exacta">Exacta</option>
            <option value="aproximada">Aproximada (zona general)</option>
            <option value="sin">Sin ubicación en el mapa</option>
          </select>
        </label>
      </div>`;
    cont.appendChild(bloque);
    bloque.querySelector("[data-quitar-ubicacion-tema]").addEventListener("click", () => bloque.remove());
  }

  function abrirModalUbi(ideaId) {
    const idea = estado.ideas.find((i) => i.id === ideaId);
    if (!idea) return;
    $("#modalUbiTitulo").textContent = "Agregar ubicación a «" + idea.nombre + "»";
    $("#ubiIdeaId").value = ideaId;
    $("#ubiId").value = "";
    $("#ubiNombre").value = "";
    $("#ubiLugar").value = idea.territorio || estado.config?.nombreTerritorio || "";
    $("#ubiDescripcion").value = "";
    $("#ubiFecha").value = "";
    $("#ubiCategoria").value = idea.categoria || "lugares";
    $("#ubiSimboloCampo").value = "Sin símbolo específico";
    actualizarVistaPreviaSimbolo();
    $("#ubiLat").value = "";
    $("#ubiLng").value = "";
    $("#ubiPrecision").value = "exacta";
    $("#ubiPuntosAdicionales").innerHTML = "";
    abrirModal("modalUbi");
  }

  function crearPuntoAdicionalUbi(ubicacion = {}) {
    const cont = $("#ubiPuntosAdicionales");
    if (!cont) return;
    const bloque = document.createElement("section");
    bloque.className = "ubi-punto-adicional";
    bloque.style.cssText = "border:1px solid var(--borde,#d9e0e7);border-radius:10px;padding:12px;margin:10px 0";
    const opcionesSimbolo = Object.keys(SIMBOLOS_CAMPO).map((nombre) => '<option value="' + escapar(nombre) + '">' + escapar(SIMBOLOS_CAMPO[nombre]) + " — " + escapar(nombre) + "</option>").join("");
    bloque.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h4 style="margin:0">Ubicación adicional</h4><button type="button" class="btn btn--suave" data-quitar-punto-ubi>Quitar ubicación</button></div>' +
      '<label>Nombre del sitio<input type="text" data-punto-ubi="nombre" placeholder="Ej.: banco del centro, colegio, finca"></label>' +
      '<label>Zona o dirección<input type="text" data-punto-ubi="lugar" placeholder="Ej.: barrio Centro, vereda"></label>' +
      '<label>Descripción<textarea rows="2" data-punto-ubi="descripcion" placeholder="Relación de este sitio con el tema"></textarea></label>' +
      '<label>Símbolo del sitio<select data-punto-ubi="simboloCampo"><option value="">Usar símbolo 📍</option>' + opcionesSimbolo + '</select></label>' +
      '<div class="formulario__fila"><label>Latitud<input type="number" step="any" min="-90" max="90" data-punto-ubi="lat" placeholder="8.6100"></label>' +
      '<label>Longitud<input type="number" step="any" min="-180" max="180" data-punto-ubi="lng" placeholder="-75.4698"></label>' +
      '<label>Precisión<select data-punto-ubi="precision"><option value="exacta">Exacta</option><option value="aproximada">Aproximada</option><option value="sin">Sin ubicación en el mapa</option></select></label></div>';
    bloque.querySelector('[data-punto-ubi="nombre"]').value = ubicacion.nombre || "";
    bloque.querySelector('[data-punto-ubi="lugar"]').value = ubicacion.lugar || "";
    bloque.querySelector('[data-punto-ubi="descripcion"]').value = ubicacion.descripcion || "";
    bloque.querySelector('[data-punto-ubi="simboloCampo"]').value = ubicacion.simboloCampo || "";
    bloque.querySelector('[data-punto-ubi="lat"]').value = ubicacion.lat ?? "";
    bloque.querySelector('[data-punto-ubi="lng"]').value = ubicacion.lng ?? "";
    bloque.querySelector('[data-punto-ubi="precision"]').value = ubicacion.precision || "exacta";
    bloque.querySelector("[data-quitar-punto-ubi]").addEventListener("click", () => bloque.remove());
    cont.appendChild(bloque);
  }

  function abrirModalEditarIdea(ideaId) {
    const idea = estado.ideas.find((i) => i.id === ideaId);
    if (!idea) return;
    $("#modalIdeaTitulo").textContent = "Editar tema";
    $("#ideaPrimeraUbicacion").hidden = true;
    $("#ideaUbicacionesAdicionales").innerHTML = "";
    $("#ideaFecha").value = idea.fecha || "";
    $("#ideaFuente").value = idea.fuente || "";
    $("#ideaId").value = idea.id;
    $("#ideaNombre").value = idea.nombre;
    $("#ideaDescripcion").value = idea.descripcion || "";
    $("#ideaCategoria").value = idea.categoria || "afectaciones";
    $("#ideaTerritorio").value = idea.territorio || estado.config?.nombreTerritorio || "";
    $("#ideaColor").value = idea.color || "#9B1C1C";
    $("#ideaSimbolo").value = idea.simbolo || "✕";
    abrirModal("modalIdea");
  }

  function verUbiEnMapa(ubiId) {
    const allUbi = estado.ideas.flatMap((i) => (i.ubicaciones || []).map((u) => ({ ...u, ideaId: i.id, ideaNombre: i.nombre })));
    const ubi = allUbi.find((u) => u.id === ubiId);
    if (!ubi) return;
    if (seccionActual !== "mapa") navegar("mapa");
    if (ubi.lat && ubi.lng) {
      mapa.setView([ubi.lat, ubi.lng], 15);
      const layer = capaMarcadores.getLayers().find((l) => l.options?.ubiId === ubiId);
      if (layer) layer.openPopup();
    }
  }

  function abrirModalEditarUbi(ubiId) {
    const allUbi = estado.ideas.flatMap((i) => (i.ubicaciones || []).map((u) => ({ ...u, ideaId: i.id, ideaNombre: i.nombre })));
    const ubi = allUbi.find((u) => u.id === ubiId);
    if (!ubi) return;
    const idea = estado.ideas.find((i) => i.id === ubi.ideaId);
    $("#modalUbiTitulo").textContent = "Editar ubicación en «" + (idea?.nombre || "Idea") + "»";
    $("#ubiIdeaId").value = ubi.ideaId;
    $("#ubiNombre").value = ubi.nombre;
    $("#ubiDescripcion").value = ubi.descripcion || "";
    $("#ubiFecha").value = ubi.fecha || "";
    $("#ubiLugar").value = ubi.lugar || idea?.territorio || estado.config?.nombreTerritorio || "";
    $("#ubiCategoria").value = ubi.categoria || idea?.categoria || "lugares";
    $("#ubiSimboloCampo").value = simboloCampoDe(ubi);
    actualizarVistaPreviaSimbolo();
    $("#ubiLat").value = ubi.lat ?? "";
    $("#ubiLng").value = ubi.lng ?? "";
    $("#ubiPrecision").value = ubi.precision || "exacta";
    $("#ubiId").value = ubi.id;
    // Las ubicaciones adicionales se guardan como entradas independientes en idea.ubicaciones.
    $("#ubiPuntosAdicionales").innerHTML = "";
    abrirModal("modalUbi");
  }

  function guardarIdea() {
    const id = $("#ideaId").value;
    const nombre = $("#ideaNombre").value.trim() || "Tema sin nombre";
    const ubiNombre = $("#ideaUbiNombre").value.trim();
    const ubiLugar = $("#ideaUbiLugar").value.trim();
    const ubiDescripcion = $("#ideaUbiDescripcion").value.trim();
    const fuente = $("#ideaFuente").value.trim();
    const ubiLatTexto = $("#ideaUbiLat").value.trim();
    const ubiLngTexto = $("#ideaUbiLng").value.trim();
    const ubiLat = ubiLatTexto === "" ? null : Number(ubiLatTexto);
    const ubiLng = ubiLngTexto === "" ? null : Number(ubiLngTexto);
    const quierePrimeraUbicacion = !id && (ubiNombre || ubiLugar || ubiDescripcion || ubiLatTexto || ubiLngTexto);
    if (quierePrimeraUbicacion && ((ubiLat === null) !== (ubiLng === null))) {
      toast("Para la primera ubicación, ingresa latitud y longitud juntas o deja ambas vacías.", "error");
      return;
    }
    if (quierePrimeraUbicacion && ubiLat !== null && (!Number.isFinite(ubiLat) || ubiLat < -90 || ubiLat > 90)) {
      toast("La latitud del primer lugar debe estar entre -90 y 90.", "error");
      return;
    }
    if (quierePrimeraUbicacion && ubiLng !== null && (!Number.isFinite(ubiLng) || ubiLng < -180 || ubiLng > 180)) {
      toast("La longitud del primer lugar debe estar entre -180 y 180.", "error");
      return;
    }
    if (id) {
      const idea = estado.ideas.find((i) => i.id === id);
      if (idea) {
        idea.nombre = nombre;
        idea.descripcion = $("#ideaDescripcion").value.trim();
        idea.fecha = $("#ideaFecha").value.trim();
        idea.fuente = fuente;
        idea.categoria = $("#ideaCategoria").value || "afectaciones";
        idea.territorio = $("#ideaTerritorio").value.trim();
        idea.color = $("#ideaColor").value;
        idea.simbolo = $("#ideaSimbolo").value || "✕";
      }
      toast("Tema actualizado.");
    } else {
      const nueva = {
        id: "idea-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        nombre: nombre,
        descripcion: $("#ideaDescripcion").value.trim(),
        fecha: $("#ideaFecha").value.trim(),
        fuente: fuente,
        categoria: $("#ideaCategoria").value || "afectaciones",
        territorio: $("#ideaTerritorio").value.trim(),
        color: $("#ideaColor").value || "#9B1C1C",
        simbolo: $("#ideaSimbolo").value || "✕",
        ubicaciones: [],
        creado: new Date().toISOString()
      };
      if (!estado.ideas) estado.ideas = [];
      if (quierePrimeraUbicacion) {
        nueva.ubicaciones.push({
          id: "ubi-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          nombre: ubiNombre || "Ubicación sin nombre",
          lugar: ubiLugar || nueva.territorio || "",
          descripcion: ubiDescripcion,
          fecha: $("#ideaUbiFecha").value.trim(),
          categoria: nueva.categoria,
          simboloCampo: $("#ideaUbiSimbolo").value || "Sin símbolo específico",
          lat: ubiLat,
          lng: ubiLng,
          precision: $("#ideaUbiPrecision").value || (ubiLat !== null && ubiLng !== null ? "exacta" : "sin"),
          creado: new Date().toISOString()
        });
      }
      const extras = Array.from($("#ideaUbicacionesAdicionales").querySelectorAll(".idea-ubicacion-extra"));
      for (const bloque of extras) {
        const valor = (campo) => (bloque.querySelector(`[data-ubi-extra="${campo}"]`)?.value || "").trim();
        const latTextoExtra = valor("lat");
        const lngTextoExtra = valor("lng");
        const latExtra = latTextoExtra === "" ? null : Number(latTextoExtra);
        const lngExtra = lngTextoExtra === "" ? null : Number(lngTextoExtra);
        const tieneDatos = ["nombre", "lugar", "descripcion", "fecha", "lat", "lng"].some((campo) => valor(campo));
        if (!tieneDatos) continue;
        if ((latExtra === null) !== (lngExtra === null)) { toast("En cada ubicación adicional, ingresa latitud y longitud juntas o deja ambas vacías.", "error"); return; }
        if (latExtra !== null && (!Number.isFinite(latExtra) || latExtra < -90 || latExtra > 90)) { toast("La latitud de una ubicación adicional debe estar entre -90 y 90.", "error"); return; }
        if (lngExtra !== null && (!Number.isFinite(lngExtra) || lngExtra < -180 || lngExtra > 180)) { toast("La longitud de una ubicación adicional debe estar entre -180 y 180.", "error"); return; }
        nueva.ubicaciones.push({
          id: "ubi-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          nombre: valor("nombre") || "Ubicación sin nombre",
          lugar: valor("lugar") || nueva.territorio || "",
          descripcion: valor("descripcion"),
          fecha: valor("fecha"),
          categoria: nueva.categoria,
          simboloCampo: valor("simbolo") || "Sin símbolo específico",
          lat: latExtra,
          lng: lngExtra,
          precision: valor("precision") || "exacta",
          creado: new Date().toISOString()
        });
      }
      estado.ideas.push(nueva);
      toast(quierePrimeraUbicacion ? "Tema y primera ubicación creados." : "Tema creado.");
    }
    guardar();
    pintarIdeas();
    pintarMapa();
    pintarTiraLectura();
    pintarProgreso();
    repintarSeccion();
    cerrarModal("modalIdea");
  }

  function eliminarIdea(ideaId) {
    if (!confirm("¿Eliminar esta idea y todas sus ubicaciones?")) return;
    estado.ideas = (estado.ideas || []).filter((i) => i.id !== ideaId);
    guardar();
    pintarIdeas();
    pintarMapa();
    pintarTiraLectura();
    pintarProgreso();
    repintarSeccion();
    toast("Tema eliminado.");
  }

  function eliminarUbi(ubiId) {
    if (!confirm("¿Eliminar esta ubicación?")) return;
    estado.ideas.forEach((idea) => {
      if (idea.ubicaciones) {
        idea.ubicaciones = idea.ubicaciones.filter((u) => u.id !== ubiId);
      }
    });
    guardar();
    pintarIdeas();
    pintarMapa();
    pintarTiraLectura();
    pintarProgreso();
    repintarSeccion();
    toast("Ubicación eliminada.");
  }

  function pintarIdeas() {
    const cont = $("#ideasLista");
    if (!cont) return;
    const ideas = estado.ideas || [];
    if (!ideas.length) {
      paginaIdeas = 1;
      cont.innerHTML = "<div class='temas-vacio'><span class='temas-vacio__icono'>✦</span><h3>Tu cartografía comienza aquí</h3><p>Crea un tema para organizar una idea y agregar los lugares que quieras documentar.</p></div>";
      return;
    }

    const totalPaginas = Math.max(1, Math.ceil(ideas.length / IDEAS_POR_PAGINA));
    paginaIdeas = Math.min(Math.max(1, paginaIdeas), totalPaginas);
    const inicio = (paginaIdeas - 1) * IDEAS_POR_PAGINA;
    const ideasPagina = ideas.slice(inicio, inicio + IDEAS_POR_PAGINA);

    const renderDescripcion = (texto, clase) => {
      const desc = String(texto || "").trim();
      if (!desc) return "<p class='" + clase + " tema-descripcion-vacia'>Sin descripción agregada.</p>";
      const limite = 190;
      if (desc.length <= limite) return "<p class='" + clase + "'>" + escapar(desc) + "</p>";
      return "<div class='tema-descripcion'><p class='" + clase + " tema-descripcion__corta'>" + escapar(desc.slice(0, limite).trimEnd()) + "…</p><details class='tema-descripcion__detalle'><summary>Leer más</summary><p>" + escapar(desc) + "</p></details></div>";
    };

    cont.innerHTML = `
      <div class="temas-resumen">
        <div><span class="temas-resumen__eyebrow">TU CARTOGRAFÍA</span><h2>Temas creados</h2><p>Organiza tus ideas y explora los lugares vinculados a cada una.</p></div>
        <span class="temas-resumen__contador">${ideas.length} tema${ideas.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="temas-grid">
        ${ideasPagina.map((idea) => {
          const ubicaciones = Array.isArray(idea.ubicaciones) ? idea.ubicaciones : [];
          const ubiCount = ubicaciones.length;
          const ubiConCoordenadas = ubicaciones.filter((u) => u.precision !== "sin" && typeof u.lat === "number" && Number.isFinite(u.lat) && typeof u.lng === "number" && Number.isFinite(u.lng)).length;
          const categoria = CATEGORIAS[idea.categoria || "afectaciones"];
          const color = categoria?.color || idea.color || "#9B1C1C";
          const simbolo = categoria?.simbolo || idea.simbolo || "•";
          const mostrarTodas = ubicacionesExpandidas.has(idea.id);
          const ubicacionesVisibles = mostrarTodas ? ubicaciones : ubicaciones.slice(0, UBICACIONES_INICIALES);
          return `
            <article class="tema-card" data-idea-id="${escapar(idea.id)}" style="--tema-color:${color}">
              <header class="tema-card__cabecera">
                <span class="tema-card__simbolo">${escapar(simbolo)}</span>
                <div class="tema-card__titulo">
                  <span class="tema-card__etiqueta">TEMA DE CARTOGRAFÍA</span>
                  <h3>${escapar(idea.nombre || "Tema sin título")}</h3>
                  <p class="tema-card__componente">Componente ${escapar(categoria?.seccion || "—")} · ${escapar(categoria?.nombre || "Sin componente seleccionado")}</p>
                </div>
              </header>
              <div class="tema-card__contenido">
                <div class="tema-metricas">
                  <div class="tema-metrica"><strong>${ubiCount}</strong><span>${ubiCount === 1 ? "ubicación" : "ubicaciones"}</span></div>
                  <div class="tema-metrica"><strong>${ubiConCoordenadas}</strong><span>en el mapa</span></div>
                  <div class="tema-metrica tema-metrica--territorio"><strong>Territorio</strong><span>${escapar(idea.territorio || "Por definir")}</span></div>
                </div>
                <section class="tema-card__descripcion">
                  <h4>Sobre este tema</h4>
                  ${renderDescripcion(idea.descripcion, "tema-card__texto")}
                  ${idea.fecha ? `<p class="tema-sitio__fecha"><strong>Fecha o periodo:</strong> ${escapar(idea.fecha)}</p>` : ""}
                  ${idea.fuente && /^https?:\/\//i.test(String(idea.fuente).trim()) ? `<p class="tema-sitio__fecha"><strong>Fuente:</strong> <a href="${escapar(String(idea.fuente).trim())}" target="_blank" rel="noopener noreferrer">Consultar fuente verificable ↗</a></p>` : idea.fuente ? `<p class="tema-sitio__fecha"><strong>Fuente:</strong> ${escapar(idea.fuente)}</p>` : ""}
                </section>
                <section class="tema-card__sitios">
                  <div class="tema-card__seccion-titulo"><div><h4>Lugares vinculados</h4><p>Los sitios conservan sus propios símbolos y coordenadas.</p></div><span>${ubiCount}</span></div>
                  ${ubiCount ? `
                    <div class="tema-sitios-lista">
                      ${ubicacionesVisibles.map((ubi) => {
                        const ubiCategoria = CATEGORIAS[ubi.categoria];
                        const ubiColor = ubiCategoria?.color || "#5D6B7E";
                        const ubiSimbolo = SIMBOLOS_CAMPO[simboloCampoDe(ubi)] || ubiCategoria?.simbolo || "•";
                        const tieneCoords = typeof ubi.lat === "number" && Number.isFinite(ubi.lat) && typeof ubi.lng === "number" && Number.isFinite(ubi.lng);
                        return `
                          <article class="tema-sitio">
                            <span class="tema-sitio__simbolo" style="--sitio-color:${ubiColor}">${escapar(ubiSimbolo)}</span>
                            <div class="tema-sitio__contenido">
                              <h5>${escapar(ubi.nombre || "Ubicación sin nombre")}</h5>
                              <p class="tema-sitio__lugar">${escapar(ubi.lugar || idea.territorio || "Territorio por definir")}</p>
                              <span class="tema-sitio__categoria">${escapar(ubi.simboloCampo || (ubiCategoria ? ubiCategoria.seccion + ". " + ubiCategoria.nombre : "Sin componente"))}</span>
                              ${renderDescripcion(ubi.descripcion, "tema-sitio__descripcion")}
                              ${ubi.fecha ? `<p class="tema-sitio__fecha"><strong>Fecha o periodo:</strong> ${escapar(ubi.fecha)}</p>` : ""}
                              <p class="tema-sitio__coordenadas ${tieneCoords ? "" : "tema-sitio__coordenadas--pendiente"}">${tieneCoords ? "⌖ " + Number(ubi.lat).toFixed(5) + ", " + Number(ubi.lng).toFixed(5) : "○ Sin coordenadas: no aparece en el mapa"}</p>
                              <p class="tema-sitio__precision"><strong>Precisión:</strong> ${ubi.precision === "aproximada" ? "Aproximada (zona general)" : ubi.precision === "sin" || !tieneCoords ? "Sin ubicación en el mapa" : "Exacta"}</p>
                            </div>
                            <div class="tema-sitio__acciones">
                              <button type="button" class="tema-icono-btn" data-ver-ubi="${escapar(ubi.id)}" title="Ver en el mapa" aria-label="Ver en el mapa">⌖</button>
                              <button type="button" class="tema-icono-btn" data-editar-ubi="${escapar(ubi.id)}" title="Editar ubicación" aria-label="Editar ubicación">✎</button>
                              <button type="button" class="tema-icono-btn tema-icono-btn--peligro" data-eliminar-ubi="${escapar(ubi.id)}" title="Eliminar ubicación" aria-label="Eliminar ubicación">×</button>
                            </div>
                          </article>`;
                      }).join("")}
                    </div>
                    ${ubiCount > UBICACIONES_INICIALES ? `<button type="button" class="tema-ver-todos" data-toggle-ubicaciones="${escapar(idea.id)}">${mostrarTodas ? "Mostrar menos ↑" : "Ver las " + ubiCount + " ubicaciones ↓"}</button>` : ""}
                  ` : `<div class="tema-sitios-vacio"><span>⌖</span><p>Aún no hay lugares vinculados a este tema.</p><small>Agrega el primer sitio para empezar a ubicarlo en el mapa.</small></div>`}
                </section>
              </div>
              <footer class="tema-card__acciones">
                <button type="button" class="btn btn--primario tema-card__agregar" data-agregar-ubi="${escapar(idea.id)}">＋ Agregar ubicación</button>
                <button type="button" class="btn btn--suave" data-editar-idea="${escapar(idea.id)}">Editar tema</button>
                <button type="button" class="tema-eliminar" data-eliminar-idea="${escapar(idea.id)}" aria-label="Eliminar tema">Eliminar</button>
              </footer>
            </article>`;
        }).join("")}
      </div>
      ${totalPaginas > 1 ? `
        <nav class="temas-paginacion" aria-label="Paginación de temas">
          <span>Mostrando ${inicio + 1}–${Math.min(inicio + IDEAS_POR_PAGINA, ideas.length)} de ${ideas.length} temas</span>
          <div class="temas-paginacion__controles">
            <button type="button" data-pagina-ideas="${paginaIdeas - 1}" ${paginaIdeas === 1 ? "disabled" : ""} aria-label="Página anterior">← Anterior</button>
            ${Array.from({length: totalPaginas}, (_, i) => i + 1).map((n) => `<button type="button" class="${n === paginaIdeas ? "is-activa" : ""}" data-pagina-ideas="${n}" aria-label="Página ${n}" ${n === paginaIdeas ? "aria-current='page'" : ""}>${n}</button>`).join("")}
            <button type="button" data-pagina-ideas="${paginaIdeas + 1}" ${paginaIdeas === totalPaginas ? "disabled" : ""} aria-label="Página siguiente">Siguiente →</button>
          </div>
        </nav>` : ""}
    `;

    $$("#ideasLista [data-pagina-ideas]").forEach((b) => b.addEventListener("click", () => {
      paginaIdeas = Number(b.dataset.paginaIdeas);
      pintarIdeas();
      $("#ideasLista").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    $$("#ideasLista [data-toggle-ubicaciones]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.toggleUbicaciones;
      if (ubicacionesExpandidas.has(id)) ubicacionesExpandidas.delete(id);
      else ubicacionesExpandidas.add(id);
      pintarIdeas();
    }));
    $$("#ideasLista [data-agregar-ubi]").forEach((b) => b.addEventListener("click", () => abrirModalUbi(b.dataset.agregarUbi)));
    $$("#ideasLista [data-editar-idea]").forEach((b) => b.addEventListener("click", () => abrirModalEditarIdea(b.dataset.editarIdea)));
    $$("#ideasLista [data-eliminar-idea]").forEach((b) => b.addEventListener("click", () => eliminarIdea(b.dataset.eliminarIdea)));
    $$("#ideasLista [data-ver-ubi]").forEach((b) => b.addEventListener("click", () => verUbiEnMapa(b.dataset.verUbi)));
    $$("#ideasLista [data-editar-ubi]").forEach((b) => b.addEventListener("click", () => abrirModalEditarUbi(b.dataset.editarUbi)));
    $$("#ideasLista [data-eliminar-ubi]").forEach((b) => b.addEventListener("click", () => eliminarUbi(b.dataset.eliminarUbi)));
  }

  /* ==================== CRUD DE FICHAS ==================== */

  function pintarRelacionados(excluirId, elegidos) {
    const cont = $("#fichaRelacionados");
    if (!cont) return;
    const lista = Array.isArray(elegidos) ? elegidos : [];
    const otros = ordenarPorSeccion(estado.fichas.filter((f) => f.id !== excluirId));
    cont.innerHTML = otros.length
      ? otros.map((f) => {
          const c = CATEGORIAS[f.categoria] || {};
          const relActual = (f.relacionados || []).find((r) => r.id === excluirId);
          const tipoActual = relActual?.tipo || "relacionada";
          const tipoOpciones = Object.entries(TIPOS_RELACION).map(([k, v]) =>
            "<option value='" + k + "'" + (tipoActual === k ? " selected" : "") + ">" + v.simbolo + " " + v.nombre + "</option>"
          ).join("");
          return "<div class='relacion-item' data-id='" + f.id + "'>" +
            "<label class='casilla'><input type='checkbox' value='" + f.id + "' class='rel-checkbox'> " +
            "<span class='ficha__punto' style='background:" + (c.color || "#5D6B7E") + ";width:20px;height:20px;font-size:0.62rem'>" + escapar(c.simbolo || "■") + "</span> " +
            "<span class='rel-nombre'>" + escapar(f.nombre) + "</span></label>" +
            "<select class='rel-tipo' title='Tipo de relación'>" + tipoOpciones + "</select>" +
            "</div>";
        }).join("")
      : "<p class='vacio'>Aún no hay otros registros para relacionar.</p>";
    // Event listeners para actualizar tipo de relación
    $$("#fichaRelacionados .rel-tipo").forEach((sel) => {
      sel.addEventListener("change", () => {
        const item = sel.closest(".relacion-item");
        const id = item.dataset.id;
        const tipo = sel.value;
        const f = estado.fichas.find((x) => x.id === excluirId);
        if (!f) return;
        const relIdx = (f.relacionados || []).findIndex((r) => r.id === item.dataset.id);
        if (relIdx >= 0) {
          f.relacionados[relIdx].tipo = sel.value;
          guardar();
        }
      });
    });
    $$("#fichaRelacionados .rel-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => {
        const item = cb.closest(".relacion-item");
        const id = item.dataset.id;
        const f = estado.fichas.find((x) => x.id === fichaSeleccionada);
        if (!f) return;
        if (cb.checked) {
          if (!f.relacionados) f.relacionados = [];
          if (!(f.relacionados || []).find((r) => r.id === id)) {
            f.relacionados.push({ id: id, tipo: "relacionada" });
          }
        } else {
          f.relacionados = (f.relacionados || []).filter((r) => r.id !== id);
        }
        guardar();
        pintarRelacionados(fichaSeleccionada, f.relacionados || []);
      });
    });
  }

  function abrirFicha(id) {
    const f = id ? estado.fichas.find((x) => x.id === id) : null;
    $("#tituloFicha").textContent = f ? "Editar registro" : "Nuevo registro";
    $("#fichaId").value = f ? f.id : "";
    $("#fichaNombre").value = f ? f.nombre : "";
    $("#fichaCategoria").value = f ? f.categoria : "lugares";
    $("#fichaSubtema").value = f ? (f.subtema || "") : "";
    $("#fichaLat").value = f && typeof f.lat === "number" ? f.lat : "";
    $("#fichaLng").value = f && typeof f.lng === "number" ? f.lng : "";
    $("#fichaPrecision").value = f ? (f.precision || "exacta") : "exacta";
    $("#fichaDescripcion").value = f ? f.descripcion : "";
    $("#fichaHistoria").value = f ? (f.historia || "") : "";
    $("#fichaActores").value = f ? (f.actores || "") : "";
    $("#fichaFecha").value = f ? (f.fecha || "") : "";
    $("#fichaFuente").value = f ? (f.fuente || "") : "";
    $("#fichaTipoFuente").value = f ? (f.tipoFuente || "") : "";
    $("#fichaEstado").value = f ? (f.estado || "pendiente") : "pendiente";
    $("#fichaEvidencias").value = f ? (f.evidencias || "") : "";
    $("#fichaObservaciones").value = f ? (f.observaciones || "") : "";
    $("#fichaAporte").value = f ? (f.aporte || "") : "";
    $("#fichaSimboloCampo").value = f ? (f.simboloCampo || "") : "";
    $("#fichaTipoRegistro").value = f ? (f.tipo_registro || "registro") : "";
    $("#fichaTerritorioPadre").value = f ? (f.territorio_padre || "") : "";
    pintarTipoRegistroSelect();
    pintarRelacionados(id, f ? (f.relacionados || []) : []);
    $("#fichaAnonimo").checked = f ? !!f.anonimo : false;
    $("#fichaVisible").checked = f ? f.visible !== false : true;
    $$(".formulario__pestana").forEach((b) => b.classList.remove("formulario__pestana--activa"));
    $$(".formulario__panel").forEach((p) => p.classList.remove("formulario__panel--activa"));
    $$(".formulario__pestana")[0]?.classList.add("formulario__pestana--activa");
    $$(".formulario__panel")[0]?.classList.add("formulario__panel--activa");
    abrirModal("modalFicha");
  }

  function abrirFichaNueva(lat, lng, categoria) {
    $("#tituloFicha").textContent = "Nuevo registro";
    $("#fichaId").value = "";
    $("#fichaNombre").value = "";
    $("#fichaCategoria").value = categoria || "lugares";
    $("#fichaSubtema").value = "";
    $("#fichaLat").value = lat;
    $("#fichaLng").value = lng;
    $("#fichaPrecision").value = "exacta";
    $("#fichaDescripcion").value = "";
    $("#fichaHistoria").value = "";
    $("#fichaActores").value = "";
    $("#fichaFecha").value = "";
    $("#fichaFuente").value = "";
    $("#fichaTipoFuente").value = "";
    $("#fichaEstado").value = "pendiente";
    $("#fichaEvidencias").value = "";
    $("#fichaObservaciones").value = "";
    $("#fichaAporte").value = "";
    $("#fichaSimboloCampo").value = "";
    $("#fichaTipoRegistro").value = "registro";
    $("#fichaTerritorioPadre").value = "";
    pintarTipoRegistroSelect();
    $("#fichaRelacionados").innerHTML = "";
    $("#fichaAnonimo").checked = false;
    $("#fichaVisible").checked = true;
    $$(".formulario__pestana").forEach((b) => b.classList.remove("formulario__pestana--activa"));
    $$(".formulario__panel").forEach((p) => p.classList.remove("formulario__panel--activa"));
    $$(".formulario__pestana")[0]?.classList.add("formulario__pestana--activa");
    $$(".formulario__panel")[0]?.classList.add("formulario__panel--activa");
    abrirModal("modalFicha");
    toast("Ubicación fijada. Complete el registro y guarde.");
  }

  function guardarFicha() {
    const form = $("#formFicha");
    const id = $("#fichaId").value;
    const nombre = $("#fichaNombre").value.trim() || "Registro sin nombre";
    const duplicado = estado.fichas.find((f) => f.id !== id && normalizar(f.nombre) === normalizar(nombre) && f.nombre !== "Registro sin nombre");
    if (duplicado && !confirm("Ya existe un registro con el nombre «" + duplicado.nombre + "» (sección " + (CATEGORIAS[duplicado.categoria] || {}).seccion + ").\n\nSi son elementos distintos, use un nombre que los diferencie. ¿Guardar de todos modos?")) return;

    const datos = {
      nombre: nombre,
      categoria: $("#fichaCategoria").value,
      subtema: $("#fichaSubtema").value.trim(),
      lat: parseFloat($("#fichaLat").value),
      lng: parseFloat($("#fichaLng").value),
      precision: $("#fichaPrecision").value,
      descripcion: $("#fichaDescripcion").value.trim(),
      historia: $("#fichaHistoria").value.trim(),
      actores: $("#fichaActores").value.trim(),
      fecha: $("#fichaFecha").value.trim(),
      fuente: $("#fichaFuente").value.trim(),
      tipoFuente: $("#fichaTipoFuente").value,
      estado: $("#fichaEstado").value,
      evidencias: $("#fichaEvidencias").value.trim(),
      observaciones: $("#fichaObservaciones").value.trim(),
      aporte: $("#fichaAporte").value.trim(),
      simboloCampo: $("#fichaSimboloCampo").value,
      tipo_registro: $("#fichaTipoRegistro").value,
      territorio_padre: $("#fichaTerritorioPadre").value,
      relacionados: $$("#fichaRelacionados input:checked").map((i) => i.value),
      anonimo: $("#fichaAnonimo").checked,
      visible: $("#fichaVisible").checked
    };
    if (isNaN(datos.lat)) datos.lat = null;
    if (isNaN(datos.lng)) datos.lng = null;

    if (id) {
      const f = estado.fichas.find((x) => x.id === id);
      Object.assign(f, datos);
      toast("Registro actualizado.");
    } else {
      datos.id = nuevoId();
      datos.creado = new Date().toISOString();
      estado.fichas.push(datos);
      toast("Registro agregado a la cartografía.");
    }
    guardar();
    cerrarModal("modalFicha");
    if (id === fichaSeleccionada || !id) {
      const nuevo = id || estado.fichas[estado.fichas.length - 1].id;
      if (estado.fichas.find((x) => x.id === nuevo && x.visible !== false && x.precision !== "sin" && typeof x.lat === "number")) {
        seleccionarFicha(nuevo, false);
      }
    }
    repintar();
  }

  function eliminarFicha(id) {
    const f = estado.fichas.find((x) => x.id === id);
    if (!f) return;
    if (!confirm("¿Eliminar el registro «" + f.nombre + "»? Esta acción no se puede deshacer (exporte un respaldo antes si lo necesita).")) return;
    estado.fichas = estado.fichas.filter((x) => x.id !== id);
    estado.fichas.forEach((x) => { if (Array.isArray(x.relacionados)) x.relacionados = x.relacionados.filter((rid) => rid !== id); });
    if (fichaSeleccionada === id) fichaSeleccionada = null;
    guardar();
    cerrarModal("modalVerFicha");
    repintar();
    toast("Registro eliminado.");
  }

  function iniciarModoUbicar() {
    modoUbicar = true;
    cerrarModal("modalFicha");
    $("#barraUbicar").hidden = false;
  }

  function finalizarModoUbicar() {
    modoUbicar = false;
    $("#barraUbicar").hidden = true;
  }

  function iniciarModoUbicarUbi() {
    modoUbicar = true;
    cerrarModal("modalUbi");
    $("#barraUbicar").hidden = false;
  }

  function guardarUbi() {
    const ideaId = $("#ubiIdeaId").value;
    const id = $("#ubiId").value;
    const idea = estado.ideas.find((i) => i.id === ideaId);
    if (!idea) { toast("La idea no existe.", "error"); return; }
    if (!idea.ubicaciones) idea.ubicaciones = [];
    const validarCoordenadas = (latTexto, lngTexto, etiqueta) => {
      const lat = latTexto.trim() === "" ? null : Number(latTexto);
      const lng = lngTexto.trim() === "" ? null : Number(lngTexto);
      if ((lat === null) !== (lng === null)) { toast("En " + etiqueta + " ingresa latitud y longitud juntas, o deja ambas vacías.", "error"); return null; }
      if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) { toast("La latitud de " + etiqueta + " debe estar entre -90 y 90.", "error"); return null; }
      if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) { toast("La longitud de " + etiqueta + " debe estar entre -180 y 180.", "error"); return null; }
      return { lat, lng };
    };
    const coords = validarCoordenadas($("#ubiLat").value, $("#ubiLng").value, "la ubicación principal");
    if (!coords) return;
    const datos = {
      nombre: $("#ubiNombre").value.trim() || "Ubicación sin nombre",
      lugar: $("#ubiLugar").value.trim(),
      descripcion: $("#ubiDescripcion").value.trim(),
      fecha: $("#ubiFecha").value.trim(),
      categoria: $("#ubiCategoria").value || idea.categoria || "lugares",
      simboloCampo: $("#ubiSimboloCampo").value || "Sin símbolo específico",
      lat: coords.lat, lng: coords.lng, precision: $("#ubiPrecision").value, creado: new Date().toISOString()
    };
    const adicionales = [];
    for (const bloque of $$("#ubiPuntosAdicionales .ubi-punto-adicional")) {
      const valor = (campo) => bloque.querySelector('[data-punto-ubi="' + campo + '"]').value.trim();
      const nombre = valor("nombre"), lugar = valor("lugar"), descripcion = valor("descripcion");
      const latTexto = valor("lat"), lngTexto = valor("lng");
      if (!nombre && !lugar && !descripcion && !latTexto && !lngTexto) continue;
      if (!nombre) { toast("Ponle un nombre a cada ubicación adicional.", "error"); return; }
      const c = validarCoordenadas(latTexto, lngTexto, "la ubicación «" + nombre + "»");
      if (!c) return;
      adicionales.push({ id: "ubi-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), nombre, lugar, descripcion, fecha: datos.fecha, categoria: datos.categoria, simboloCampo: valor("simboloCampo") || "Sin símbolo específico", lat: c.lat, lng: c.lng, precision: valor("precision") || "exacta", creado: new Date().toISOString() });
    }
    if (id) {
      const ubi = idea.ubicaciones.find((u) => u.id === id);
      if (!ubi) { toast("No se encontró la ubicación que intentas editar.", "error"); return; }
      Object.assign(ubi, datos);
      toast(adicionales.length ? "Ubicación actualizada y sitios adicionales guardados por separado." : "Ubicación actualizada.");
    } else {
      datos.id = "ubi-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      idea.ubicaciones.push(datos);
      toast("Ubicación agregada a la idea.");
    }
    // Cada sitio adicional queda como ubicación hermana, no como punto anidado.
    idea.ubicaciones.push(...adicionales);
    guardar();
    pintarIdeas();
    pintarMapa();
    pintarTiraLectura();
    pintarProgreso();
    repintarSeccion();
    cerrarModal("modalUbi");
  }

  /* ==================== TERRITORIO ==================== */

  function pintarMenuTerritorio() {
    const n = $("#terrMenuNombre");
    if (!n) return;
    n.textContent = estado.config.nombreTerritorio || "Territorio sin nombre";
    const desc = (estado.config.descripcionTerritorio || "").trim();
    const oficial = estado.config.limite && estado.config.limite.properties && estado.config.limite.properties.oficial;
    $("#terrMenuDesc").textContent = (desc || "Sin descripción delimitada. Edite la delimitación para completarla.") + (oficial ? " · Límite oficial cargado ✓" : "");
  }

  function actualizarAyudaDepartamento() {
    const departamento = ($("#terrDepartamento").value || "").trim().toLocaleLowerCase("es");
    const aviso = $("#terrAyudaCordoba");
    if (aviso) aviso.hidden = departamento !== "córdoba" && departamento !== "cordoba";
  }

  function abrirTerritorio() {
    $("#terrNombre").value = estado.config.nombreTerritorio || "";
    $("#terrParticipante").value = estado.config.participante || "";
    $("#terrMunicipio").value = estado.config.municipio || "";
    const departamento = estado.config.departamento || "";
    const selectorDepartamento = $("#terrDepartamento");
    if (departamento && !Array.from(selectorDepartamento.options).some((o) => o.value === departamento)) {
      const opcion = document.createElement("option");
      opcion.value = departamento;
      opcion.textContent = departamento;
      selectorDepartamento.appendChild(opcion);
    }
    selectorDepartamento.value = departamento;
    $("#terrDescripcion").value = estado.config.descripcionTerritorio || "";
    $("#terrLat").value = estado.config.centro.lat;
    $("#terrLng").value = estado.config.centro.lng;
    $("#terrZoom").value = estado.config.centro.zoom;
    $("#terrMostrarLimite").checked = !!estado.config.mostrarLimite;
    $("#terrLimite").value = JSON.stringify(estado.config.limite || {}, null, 2);
    actualizarAyudaDepartamento();
    abrirModal("modalTerritorio");
  }

  function guardarTerritorio() {
    let limite = null;
    const crudo = $("#terrLimite").value.trim();
    if (crudo) {
      try {
        limite = JSON.parse(crudo);
      } catch (e) {
        toast("El GeoJSON del límite no es válido.", "error");
        return;
      }
    }
    estado.config.nombreTerritorio = $("#terrNombre").value.trim() || "Territorio";
    estado.config.participante = $("#terrParticipante").value.trim();
    estado.config.municipio = $("#terrMunicipio").value.trim();
    estado.config.departamento = $("#terrDepartamento").value.trim();
    estado.config.descripcionTerritorio = $("#terrDescripcion").value.trim();
    estado.config.centro = {
      lat: parseFloat($("#terrLat").value) || CONFIGURACION_INICIAL.centro.lat,
      lng: parseFloat($("#terrLng").value) || CONFIGURACION_INICIAL.centro.lng,
      zoom: parseInt($("#terrZoom").value, 10) || 12
    };
    estado.config.mostrarLimite = $("#terrMostrarLimite").checked;
    estado.config.limite = limite;
    guardar();
    mapa.setView([estado.config.centro.lat, estado.config.centro.lng], estado.config.centro.zoom);
    dibujarLimite();
    pintarMenuTerritorio();
    cerrarModal("modalTerritorio");
    pintarInfo();
    toast("Territorio actualizado.");
  }

  function normalizarGeoJSON(datos) {
    if (!datos) return null;
    if (datos.type === "FeatureCollection") {
      const conGeometria = (datos.features || []).filter((f) => f && f.geometry);
      if (!conGeometria.length) return null;
      if (conGeometria.length === 1) return conGeometria[0];
      return { type: "Feature", properties: { nombre: "Límites combinados" }, geometry: { type: "GeometryCollection", geometries: conGeometria.map((f) => f.geometry) } };
    }
    if (datos.type === "Feature") return datos;
    if (datos.type && datos.coordinates) return { type: "Feature", properties: {}, geometry: datos };
    return null;
  }

  function cargarLimiteOficial() {
    const btn = $("#btnLimiteOficial");
    btn.disabled = true;
    btn.textContent = "Descargando…";
    const consulta = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&polygon_geojson=1&extratags=1&q=" +
      encodeURIComponent("Sahagún, Córdoba, Colombia");
    fetch(consulta, { headers: { Accept: "application/json" } })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((lista) => {
        const candidatos = (lista || []).filter((r) => r.geojson);
        const oficial =
          candidatos.find((r) => (r.class || r.type) === "boundary" && /^sahag/i.test(r.name || "")) ||
          candidatos.find((r) => /^sahag/i.test((r.namedetails && r.namedetails.alt_name) || "")) ||
          candidatos.find((r) => (r.class || r.type) === "boundary") ||
          candidatos[0];
        if (!oficial) throw new Error("sin resultados");
        const geo = normalizarGeoJSON({
          type: "Feature",
          properties: {
            nombre: oficial.display_name || "Límite oficial",
            fuente: "OpenStreetMap / Nominatim (" + (oficial.osm_type || oficial.type) + " " + oficial.osm_id + ")",
            oficial: true
          },
          geometry: oficial.geojson
        });
        if (!geo) throw new Error("geometría inválida");
        estado.config.limite = geo;
        estado.config.mostrarLimite = true;
        estado.config.centro.lat = parseFloat(oficial.lat);
        estado.config.centro.lng = parseFloat(oficial.lon);
        guardar();
        dibujarLimite();
        try {
          const bounds = L.geoJSON(geo).getBounds();
          if (bounds.isValid()) mapa.fitBounds(bounds, { padding: [20, 20] });
        } catch (e) {}
        $("#terrLimite").value = JSON.stringify(geo, null, 2);
        $("#terrMostrarLimite").checked = true;
        $("#terrLat").value = estado.config.centro.lat;
        $("#terrLng").value = estado.config.centro.lng;
        pintarMenuTerritorio();
        toast("Límite oficial de Sahagún cargado desde OpenStreetMap.");
      })
      .catch((err) => {
        toast("No fue posible descargar el límite (" + err.message + "). Pegue el GeoJSON oficial en el recuadro.", "error");
      })
      .finally(() => {
        btn.disabled = false;
        btn.textContent = "🌐 Cargar límite oficial (OpenStreetMap)";
      });
  }

  /* ==================== REFLEXIÓN ==================== */

  function guardarReflexion() {
    estado.reflexion.texto = $("#refTexto").value;
    estado.reflexion.reto = $("#refReto").value;
    estado.reflexion.oportunidad = $("#refOportunidad").value;
    guardar();
    pintarReflexion();
    pintarTiraLectura();
    pintarProgreso();
    toast("Reflexión guardada.");
  }

  function descargarReflexion() {
    const texto =
      "CARTOGRAFÍA DE PAZ · " + estado.config.nombreTerritorio + "\n\n" +
      "REFLEXIÓN FINAL · ¿Cómo se ha encarnado la teología de paz en este territorio?\n\n" +
      $("#refTexto").value + "\n\nRETO: " + $("#refReto").value + "\n\nOPORTUNIDAD: " + $("#refOportunidad").value + "\n";
    descargar("reflexion-cartografia-paz.txt", texto, "text/plain;charset=utf-8");
    toast("Reflexión descargada.");
  }

  /* ==================== RESPALDO E IMPRESIÓN ==================== */

  function descargar(nombre, contenido, tipo) {
    const blob = new Blob([contenido], { type: tipo || "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ==================== EXPORTACIÓN ÉTICA ==================== */

  function exportarEtica(tipo) {
    const esPublica = tipo === "publica";
    const fecha = new Date().toISOString().slice(0, 10);
    const clon = JSON.parse(JSON.stringify(estado));
    
    // Filtrar datos sensibles si es exportación pública
    if (esPublica) {
      // Ocultar coordenadas precisas de fichas anónimas o sensibles
      clon.fichas.forEach((f) => {
        if (f.anonimo || f.precision === "sin") {
          f.lat = null;
          f.lng = null;
        }
        if (f.anonimo) {
          f.actores = "[protegido]";
          f.fuente = "[protegido]";
          f.evidencias = "[protegido]";
        }
      });
      
      // Filtrar ideas con datos sensibles
      if (clon.ideas) {
        clon.ideas.forEach((idea) => {
          if (idea.ubicaciones) {
            idea.ubicaciones.forEach((u) => {
              if (u.precision === "sin") {
                u.lat = null;
                u.lng = null;
              }
            });
          }
        });
      }
      
      // Limpiar configuración sensible
      delete clon.config.limite;
      if (clon.config.participante) clon.config.participante = "[protegido]";
    }
    
    // Añadir metadatos de exportación
    const exportData = {
      ...clon,
      meta: {
        fechaExportacion: new Date().toISOString(),
        version: VERSION,
        tipo: esPublica ? "publica" : "interna",
        incluyeSensibles: !esPublica
      }
    };
    
    const nombre = "cartografia-paz-sahagun-" + (esPublica ? "publica" : "interna") + "-" + fecha + ".json";
    descargar(nombre, JSON.stringify(exportData, null, 2));
    toast("Exportación " + (esPublica ? "pública" : "interna") + " generada.");
  }

  function exportarTodo() {
    exportarEtica("interna");
  }

  function exportarPublica() {
    exportarEtica("publica");
  }

  function manejarImportacion(ev) {
    const archivo = ev.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function () {
      try {
        const datos = JSON.parse(lector.result);
        if (!datos || !Array.isArray(datos.fichas) || !datos.config) throw new Error("estructura");
        if (!confirm("¿Reemplazar los datos actuales con el archivo importado?")) return;
        estado = migrar({
          version: VERSION,
          config: datos.config,
          reflexion: datos.reflexion || clonar(REFLEXION_INICIAL),
          fichas: datos.fichas,
          zonas: datos.zonas || [],
          leyenda: datos.leyenda
        });
        if (estado.config.mostrarLimite === undefined) estado.config.mostrarLimite = true;
        guardar();
        aplicarLeyenda();
        fichaSeleccionada = null;
        pintarMenuTerritorio();
        mapa.setView([estado.config.centro.lat, estado.config.centro.lng], estado.config.centro.zoom);
        dibujarLimite();
        pintarZonas();
        repintar();
        toast("Archivo importado correctamente.");
      } catch (e) {
        toast("El archivo no tiene el formato de esta cartografía.", "error");
      }
      $("#archivoImportar").value = "";
    };
    lector.readAsText(archivo);
  }

  function imprimirPaginado(opciones) {
    const vistaPrevia = !!(opciones && opciones.vistaPrevia);
    const area = $("#areaImpresion");
    if (!area) { toast("No se encontró el área del informe.", "error"); return; }
    const fichas = ordenarPorSeccion(fichasVisibles().filter((f) => !catOculta(f.categoria)));
    const ideas = (estado.ideas || []).filter((idea) => (idea.ubicaciones || []).some((u) => !u.categoria || !catOculta(u.categoria)));
    const fecha = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    const config = estado.config || {};
    const categorias = Object.keys(CATEGORIAS).filter((k) => k === "delimitacion" || !catOculta(k)).sort((a,b) => CATEGORIAS[a].seccion-CATEGORIAS[b].seccion);
    const leyenda = categorias.map((k) => {
      const c = CATEGORIAS[k];
      return "<li><span class='imp-simbolo' style='background:" + escapar(c.color) + "'>" + escapar(c.simbolo) + "</span><span><strong>" + escapar(c.seccion + ". " + c.nombre) + "</strong> — " + escapar(c.descripcion || "") + "</span></li>";
    }).join("");
    const listaFichas = fichas.length ? fichas.map((f) => {
      const c = CATEGORIAS[f.categoria] || {};
      return "<li><strong>" + escapar(f.nombre) + "</strong> (" + escapar(c.seccion || "") + ". " + escapar(c.nombre || f.categoria) + ")" +
        "<p>" + escapar(f.descripcion) + "</p>" +
        (f.historia ? "<p><strong>Memoria/contexto:</strong> " + escapar(f.historia) + "</p>" : "") +
        (f.aporte ? "<p><strong>Aporte a la paz:</strong> " + escapar(f.aporte) + "</p>" : "") +
        "<p><strong>Ubicación:</strong> " + escapar(f.lugar || "No especificada") +
        (typeof f.lat === "number" && typeof f.lng === "number" ? " (" + f.lat.toFixed(5) + ", " + f.lng.toFixed(5) + ")" : "") + "</p>" +
        (f.fecha ? "<p><strong>Fecha/periodo:</strong> " + escapar(f.fecha) + "</p>" : "") +
        (f.fuente ? "<p><strong>Fuente:</strong> " + escapar(f.fuente) + "</p>" : "") +
        "<p><strong>Estado:</strong> " + escapar((ESTADOS[f.estado] || {}).nombre || f.estado || "Pendiente") + " · <strong>Precisión:</strong> " + escapar(f.precision || "No indicada") + "</p></li>";
    }).join("") : "<li>No hay fichas visibles en las categorías seleccionadas.</li>";
    const listaIdeas = ideas.map((idea) => {
      const ubicaciones = (idea.ubicaciones || []).filter((u) => !u.categoria || !catOculta(u.categoria));
      if (!ubicaciones.length) return "";
      return "<li><h3>" + escapar(idea.nombre || "Narrativa temática") + "</h3>" +
        (idea.descripcion ? "<p>" + escapar(idea.descripcion) + "</p>" : "") +
        "<ul>" + ubicaciones.map((u) => "<li><strong>" + escapar(u.nombre || "Lugar sin nombre") + "</strong>" +
          (u.categoria ? " · " + escapar((CATEGORIAS[u.categoria] || {}).nombre || u.categoria) : "") +
          (u.descripcion ? "<p>" + escapar(u.descripcion) + "</p>" : "") +
          "<p><strong>Ubicación:</strong> " + escapar(u.lugar || idea.territorio || "No especificada") +
          (typeof u.lat === "number" && typeof u.lng === "number" ? " (" + u.lat.toFixed(5) + ", " + u.lng.toFixed(5) + ")" : "") +
          "</p></li>").join("") + "</ul></li>";
    }).join("");
    const reflexion = estado.reflexion || {};
    area.innerHTML = "<article class='imp-portada'><h1>Cartografía de paz</h1><h2>" + escapar(config.municipio || "Sahagún") + (config.departamento ? ", " + escapar(config.departamento) : ", Córdoba") + "</h2><p>Informe cartográfico · " + escapar(fecha) + "</p><p>Registros incluidos: " + fichas.length + " · Narrativas: " + ideas.length + "</p></article>" +
      "<section class='imp-pagina'><h2>Convenciones y categorías visibles</h2><ul class='imp-leyenda'>" + leyenda + "</ul></section>" +
      "<section class='imp-pagina'><h2>Registros cartográficos</h2><ol class='imp-lista'>" + listaFichas + "</ol></section>" +
      (listaIdeas ? "<section class='imp-pagina'><h2>Narrativas y lugares asociados</h2><ol class='imp-lista'>" + listaIdeas + "</ol></section>" : "") +
      "<section class='imp-pagina'><h2>Lectura y reflexión del territorio</h2>" +
      (reflexion.lectura ? "<p><strong>Lectura del territorio:</strong> " + escapar(reflexion.lectura) + "</p>" : "") +
      (reflexion.tensiones ? "<p><strong>Tensiones y afectaciones:</strong> " + escapar(reflexion.tensiones) + "</p>" : "") +
      (reflexion.oportunidad ? "<p><strong>Oportunidades para la paz:</strong> " + escapar(reflexion.oportunidad) + "</p>" : "") +
      "<p class='imp-pie'>Informe generado desde la Cartografía de paz. Verifique las fuentes y proteja datos sensibles antes de compartir.</p></section>";
    if (vistaPrevia) {
      const cuerpo = $("#vistaPreviaCuerpo");
      if (!cuerpo) { toast("No se encontró el panel de vista previa.", "error"); return; }
      cuerpo.innerHTML = area.innerHTML;
      if (!cuerpo.innerHTML.trim()) { toast("No se pudo construir el informe para la vista previa.", "error"); return; }
      const titulo = $("#tituloVistaPrevia");
      if (titulo) titulo.textContent = "Vista previa del informe PDF";
      abrirModal("modalVistaPrevia");
      cuerpo.scrollTop = 0;
    } else {
      cerrarModal("modalVistaPrevia");
      // En modo impresión se oculta la aplicación completa y se imprime únicamente el informe.
      document.body.classList.add("imprimiendo-informe");
      const limpiarModoImpresion = () => document.body.classList.remove("imprimiendo-informe");
      window.addEventListener("afterprint", limpiarModoImpresion, { once: true });
      window.setTimeout(() => {
        try { window.print(); }
        catch (error) {
          limpiarModoImpresion();
          toast("El navegador no pudo abrir la impresión. Intenta de nuevo o revisa el bloqueador de ventanas.", "error");
        }
      }, 120);
    }
  }

  function imprimir(vistaPrevia) {
    imprimirPaginado({ vistaPrevia: vistaPrevia || false });
  }

  function restablecer() {
    if (!confirm("¿Borrar todo y empezar de cero? Se reemplazarán los registros, territorio, figuras dibujadas, convenciones y reflexión por el lienzo inicial.")) return;
    restaurarSemilla();
    aplicarLeyenda();
    fichaSeleccionada = null;
    chipLugares = "todas";
    soloVerificados = false;
    pintarMenuTerritorio();
    mapa.setView([estado.config.centro.lat, estado.config.centro.lng], estado.config.centro.zoom);
    dibujarLimite();
    pintarZonas();
    repintar();
    cerrarModal("modalTerritorio");
    toast("Lienzo inicial restablecido: complete las fichas base y agregue sus registros.");
  }

  /* ==================== MODALES / VISTAS ==================== */

  function abrirModal(id) {
    $("#" + id).hidden = false;
    document.body.classList.add("sin-scroll");
  }

  function cerrarModal(id) {
    $("#" + id).hidden = true;
    if (!$$(".modal").some((m) => !m.hidden)) document.body.classList.remove("sin-scroll");
  }

  function cambiarVista(vista) {
    document.body.dataset.vista = vista;
    if (vista === "mapa" && mapa) setTimeout(() => mapa.invalidateSize(), 180);
  }

  /* ==================== EVENTOS ==================== */

  function eventos() {
    const btnCompartir = $("#btnGuardarNube");
    if (btnCompartir) btnCompartir.addEventListener("click", guardarYCompartirAhora);

    $("#btnNueva").addEventListener("click", () => {
      if (seccionActual === "ideas") {
        const btnNuevaIdea = document.querySelector('[data-accion="nuevaIdea"]');
        if (btnNuevaIdea) { btnNuevaIdea.click(); return; }
      }
      abrirFicha(null);
    });

    const btnVerConv = $("#btnVerConvenciones");
    if (btnVerConv) btnVerConv.addEventListener("click", abrirConvencionesCompletas);
    const btnPrintConv = $("#btnImprimirConvenciones");
    if (btnPrintConv) btnPrintConv.addEventListener("click", () => window.print());

    $("#btnGuardarFicha").addEventListener("click", guardarFicha);
    $("#formFicha").addEventListener("submit", (e) => { e.preventDefault(); guardarFicha(); });
    $$(".formulario__pestana").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".formulario__pestana").forEach((b) => b.classList.remove("formulario__pestana--activa"));
        $$(".formulario__panel").forEach((p) => p.classList.remove("formulario__panel--activa"));
        btn.classList.add("formulario__pestana--activa");
        const panel = document.getElementById(btn.dataset.panel);
        if (panel) panel.classList.add("formulario__panel--activa");
      });
    });
    $("#btnTerritorio").addEventListener("click", abrirTerritorio);
    $("#terrDepartamento").addEventListener("change", actualizarAyudaDepartamento);
    $("#btnEnfocarCordoba").addEventListener("click", () => {
      enfocarDepartamentoCordoba();
      if (mapa) setTimeout(() => mapa.invalidateSize(), 80);
    });
    $("#btnGuardarTerritorio").addEventListener("click", guardarTerritorio);
    $("#btnLimiteOficial").addEventListener("click", cargarLimiteOficial);
    $("#btnRestablecer").addEventListener("click", restablecer);
    $("#btnGuardarReflexion").addEventListener("click", guardarReflexion);
    $("#btnExportarReflexion").addEventListener("click", descargarReflexion);
    $("#btnAyuda").addEventListener("click", () => abrirModal("modalAyuda"));
    $("#btnGuardarIdea").addEventListener("click", guardarIdea);
    $("#btnIdeaAgregarUbicacion").addEventListener("click", agregarUbicacionAlFormularioTema);
    $("#btnGuardarUbi").addEventListener("click", guardarUbi);
    $("#btnUbiAgregarPunto").addEventListener("click", () => crearPuntoAdicionalUbi());
    $("#ubiSimboloCampo").addEventListener("change", actualizarVistaPreviaSimbolo);
    $("#btnExportar").addEventListener("click", exportarTodo);
    $("#btnImportar").addEventListener("click", () => $("#archivoImportar").click());
    $("#archivoImportar").addEventListener("change", manejarImportacion);
    $("#btnAgregarConvencion").addEventListener("click", agregarConvencion);
    $("#btnGuardarLeyenda").addEventListener("click", guardarLeyenda);
    let campoSimboloActivo = null;
    document.addEventListener("focusin", (e) => {
      if (e.target.matches && e.target.matches("#leyendaCategorias [data-campo='simbolo']")) campoSimboloActivo = e.target;
    });
    const buscadorSimbolos = $("#buscarSimbolos");
    if (buscadorSimbolos) buscadorSimbolos.addEventListener("input", () => {
      const sinAcentos = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
      const q = sinAcentos(buscadorSimbolos.value);
      $$("#simbolosPaleta [data-sim]").forEach((b) => {
        b.hidden = !!q && !sinAcentos(b.dataset.busquedaSimbolo || b.dataset.sim).includes(q);
      });
    });
    $("#btnImprimir").addEventListener("click", () => imprimir(false));
    $("#btnVistaPrevia").addEventListener("click", () => imprimir(true));
    $("#btnImprimirDesdePrevia").addEventListener("click", () => { cerrarModal("modalVistaPrevia"); imprimir(false); });
    $("#busqueda").addEventListener("input", () => {
      pintarMapa();
      if (fichaSeleccionada) pintarInfo();
      repintarSeccion();
    });
    $("#btnUbicar").addEventListener("click", iniciarModoUbicar);
    $("#btnCancelarUbicar").addEventListener("click", () => {
      finalizarModoUbicar();
      abrirModal("modalFicha");
    });
    // Ideas / narrativas: los botones de guardado se enlazan una sola vez arriba.
    const btnUbicarUbi = $("#btnUbicarUbi");
    if (btnUbicarUbi) btnUbicarUbi.addEventListener("click", iniciarModoUbicarUbi);
    const btnCancelarUbicarUbi = $("#btnCancelarUbicarUbi");
    if (btnCancelarUbicarUbi) btnCancelarUbicarUbi.addEventListener("click", () => {
      finalizarModoUbicar();
      abrirModal("modalUbi");
    });
    $$(".principal__btn").forEach((b) =>
      b.addEventListener("click", () => navegar(b.dataset.seccion))
    );
    $$(".pestanas__btn").forEach((b) =>
      b.addEventListener("click", () => cambiarVista(b.dataset.vista))
    );

    const tMenu = $("#toggleMenu");
    if (tMenu) {
      tMenu.addEventListener("click", () => {
        document.body.classList.toggle("menu-oculto");
        tMenu.textContent = document.body.classList.contains("menu-oculto") ? "‹" : "›";
        setTimeout(() => mapa.invalidateSize(), 260);
      });
    }
    const tInfo = $("#toggleInfo");
    if (tInfo) {
      tInfo.addEventListener("click", () => {
        document.body.classList.toggle("info-oculta");
        tInfo.textContent = document.body.classList.contains("info-oculta") ? "›" : "‹";
        setTimeout(() => mapa.invalidateSize(), 260);
      });
    }
    const tLista = $("#toggleLista");
    if (tLista) {
      tLista.addEventListener("click", () => {
        const cuerpo = $("#panelInfoCuerpo");
        const plegado = cuerpo.classList.toggle("plegado");
        tLista.textContent = plegado ? "▸" : "▾";
      });
    }
    // Paneles laterales plegables: permiten leer el contenido completo sin saturar la pantalla.
    $$("#menuLateral [data-panel-plegable]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cuerpo = document.getElementById(btn.getAttribute("aria-controls"));
        if (!cuerpo) return;
        const abierto = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(abierto));
        cuerpo.hidden = !abierto;
      });
    });

    const btnTira = $("#btnTiraLectura");
    if (btnTira) btnTira.addEventListener("click", () => alternarTira());

    $("#paletaColores").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-color]");
      if (!btn) return;
      colorActivo = btn.dataset.color;
      pintarPaleta();
      if (dibujoTool === "rellenar") toast("Color elegido: toque una figura para rellenarla.");
    });

    $("#barraDibujo").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dibujo]");
      if (!btn) return;
      if (btn.dataset.dibujo === "cordoba") {
        enfocarDepartamentoCordoba();
        return;
      }
      if (btn.dataset.dibujo === "ver-todas") {
        ajustarVistaTodasUbicaciones();
        return;
      }
      setHerramienta(btn.dataset.dibujo);
    });
    const btnTerminarVertices = $("#btnTerminarEdicionVertices");
    if (btnTerminarVertices) btnTerminarVertices.addEventListener("click", terminarEdicionVertices);
    const btnDibujo = $("#btnDibujoToggle");
    if (btnDibujo) btnDibujo.addEventListener("click", () => mostrarBarraDibujo(true));

    document.addEventListener("click", (e) => {
      const cerrar = e.target.closest("[data-cerrar]");
      if (cerrar) { cerrarModal(cerrar.dataset.cerrar); return; }
      const ir = e.target.closest("[data-seccion-ir]");
      if (ir) { navegar(ir.dataset.seccionIr); return; }
      const abrirTema = e.target.closest("[data-abrir-tema]");
      if (abrirTema) {
        const idTema = abrirTema.dataset.abrirTema;
        ubicacionesExpandidas.add(idTema);
        navegar("ideas");
        const tarjetaTema = Array.from(document.querySelectorAll("[data-idea-id]")).find((n) => n.dataset.ideaId === idTema);
        if (tarjetaTema) tarjetaTema.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const volver = e.target.closest("[data-volver-info]");
      if (volver) { pintarInfo(); return; }
      const sim = e.target.closest("[data-sim]");
      if (sim) {
        const inp = campoSimboloActivo && campoSimboloActivo.isConnected ? campoSimboloActivo : $("#convSimbolo");
        if (inp) {
          inp.value = sim.dataset.sim;
          inp.focus();
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        }
        $$("#simbolosPaleta .simbolos-paleta__btn").forEach((b) => b.classList.toggle("simbolos-paleta__btn--activo", b === sim));
        return;
      }
      const cn = e.target.closest("[data-color-nuevo]");
      if (cn) {
        const inp = $("#convColor");
        if (inp) inp.value = cn.dataset.colorNuevo;
        $$("#coloresPaleta .colores-paleta__btn").forEach((b) => b.classList.toggle("colores-paleta__btn--activo", b === cn));
        return;
      }
      const tira = e.target.closest("[data-tira]");
      if (tira) {
        const dest = tira.dataset.tira;
        if (dest === "territorio") { abrirTerritorio(); return; }
        if (tira.dataset.tiraChip) chipLugares = tira.dataset.tiraChip;
        navegar(dest);
        return;
      }
      const chip = e.target.closest("[data-chip]");
      if (chip) { chipLugares = chip.dataset.chip; pintarLugares(); return; }
      const vf = e.target.closest("[data-verif]");
      if (vf) { soloVerificados = !soloVerificados; repintar(); return; }
      const sv = e.target.closest("[data-streetview]");
      if (sv) { abrirStreetView(sv.dataset.streetview); return; }
      const zev = e.target.closest("[data-zona-editar-puntos]");
      if (zev) { editarVerticesZona(zev.dataset.zonaEditarPuntos); return; }
      const zc = e.target.closest("[data-zona-color]");
      if (zc) { recolorearZona(zc.dataset.zonaId, zc.dataset.zonaColor); return; }
      const ze = e.target.closest("[data-zona-eliminar]");
      if (ze) { eliminarZona(ze.dataset.zonaEliminar); return; }
      const zt = e.target.closest("[data-zona-texto]");
      if (zt) { guardarTextoZona(zt.dataset.zonaTexto); return; }
      const convEli = e.target.closest("[data-custom-eliminar]");
      if (convEli) { eliminarConvencion(convEli.dataset.customEliminar); return; }
      const ojo = e.target.closest("[data-oculta-cat]");
      if (ojo) { alternarOcultaCat(ojo.dataset.ocultaCat); return; }
      const completa = e.target.closest("[data-completa]");
      if (completa) { abrirFichaCompleta(completa.dataset.completa); return; }
      const editar = e.target.closest("[data-editar]");
      if (editar) { cerrarModal("modalVerFicha"); abrirFicha(editar.dataset.editar); return; }
      const eliminar = e.target.closest("[data-eliminar]");
      if (eliminar) { eliminarFicha(eliminar.dataset.eliminar); return; }
      const ver = e.target.closest("[data-ver]");
      if (ver) { cerrarModal("modalVerFicha"); navegar("mapa"); seleccionarFicha(ver.dataset.ver, true); return; }
      const accion = e.target.closest("[data-accion]");
      if (accion) {
        const a = accion.dataset.accion;
        if (a === "nueva") abrirFicha(null);
        else if (a === "nuevaIdea") {
          $("#modalIdeaTitulo").textContent = "Nuevo tema";
          $("#ideaId").value = "";
          $("#ideaNombre").value = "";
          $("#ideaDescripcion").value = "";
          $("#ideaCategoria").value = "afectaciones";
          $("#ideaTerritorio").value = estado.config?.nombreTerritorio || "";
          $("#ideaColor").value = "#9B1C1C";
          $("#ideaSimbolo").value = "✕";
          $("#ideaUbiNombre").value = "";
          $("#ideaUbiLugar").value = estado.config?.nombreTerritorio || "";
          $("#ideaUbiDescripcion").value = "";
          $("#ideaUbiLat").value = "";
          $("#ideaUbiLng").value = "";
          $("#ideaPrimeraUbicacion").hidden = false;
    $("#ideaUbicacionesAdicionales").innerHTML = "";
    $("#ideaFecha").value = "";
          $("#ideaFuente").value = "";
          abrirModal("modalIdea");
          return;
        }
        else if (a === "leyenda") abrirGestionLeyenda();
        else if (a === "exportar") exportarTodo();
        else if (a === "importar") $("#archivoImportar").click();
        else if (a === "imprimir") imprimir();
        else if (a === "ayuda") abrirModal("modalAyuda");
        return;
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (dibujoTool) { cancelarDibujoTmp(); setHerramienta(dibujoTool); toast("Dibujo cancelado."); return; }
        if (modoUbicar) { finalizarModoUbicar(); abrirModal("modalFicha"); return; }
        const abierta = $$(".modal").find((m) => !m.hidden);
        if (abierta) cerrarModal(abierta.id);
      }
    });
  }

  /* ==================== INICIO ==================== */

  async function iniciar() {
    // En este navegador, el guardado local es la copia de trabajo principal.
    // Antes se prefería siempre la nube, incluso si contenía una versión anterior:
    // eso hacía reaparecer figuras eliminadas y restablecía categorías ocultas.
    // Cargar primero lo local evita perder los cambios del usuario al recargar.
    let previo = cargar();
    let deNube = false;
    if (previo) {
      deNube = false;
    } else {
      try {
        const remoto = await cargarNube();
        if (remoto) { previo = remoto; deNube = true; }
      } catch (e) { previo = null; }
    }
    estado = previo || null;
    if (!estado) restaurarSemilla();
    if (!estado.config) estado.config = clonar(CONFIGURACION_INICIAL);
    if (!estado.reflexion) estado.reflexion = clonar(REFLEXION_INICIAL);
    if (!Array.isArray(estado.zonas)) estado.zonas = [];
    if (estado.config.mostrarLimite === undefined) estado.config.mostrarLimite = true;

    if (typeof LIMITE_OFICIAL !== "undefined" && (!estado.config.limite || !estado.config.limite.properties || !estado.config.limite.properties.oficial)) {
      estado.config.limite = clonar(LIMITE_OFICIAL);
      estado.config.mostrarLimite = true;
      if (!previo) estado.config.centro = { lat: 8.8, lng: -75.41, zoom: 11 };
      guardar();
    }

    aplicarLeyenda();
    pintarSelects();
    pintarPaleta();
    initMapa();
    pintarMenuTerritorio();
    repintar();
    pintarEstadoGuardado();
    pintarEstadoNube(deNube
      ? "☁ Datos cargados de la nube. Los próximos cambios se compartirán al guardarse."
      : "⚠ Trabajo guardado en este navegador. Pulsa «Guardar y compartir con el profesor» para publicarlo.");
    eventos();
    // Al abrir la página, guardar la migración solo en local. No intentar una escritura
    // remota automática durante el arranque ni pedir credenciales sin que el usuario lo decida.
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      pintarEstadoGuardado();
    } catch (e) {
      pintarEstadoNube("⚠ El navegador no permite guardar localmente. Exporta un respaldo.");
    }
    navegar("mapa");
    if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) alternarTira(true);

    if (previo) {
      toast("Trabajo restaurado: " + estado.fichas.length + " registros y " + estado.zonas.length + " figuras guardadas.");
    } else if (estado.fichas.length) {
      toast("Lienzo listo con " + estado.fichas.length + " fichas base por completar. Agregue sus registros con ＋ Agregar registro.");
    } else {
      toast("Lienzo vacío listo para llenar. Agregue sus registros con ＋ Agregar registro.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
