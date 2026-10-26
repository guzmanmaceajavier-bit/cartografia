(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
  const cleanText = (value) => String(value == null ? "" : value).trim();
  const hasCoord = (value) => value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
  const coord = (value) => Number(value);

  let estado = null;
  let mapa = null;
  let capaMarcadores = null;
  let capaFiguras = null;
  let capaLimite = null;
  let items = [];
  let categoriasActivas = new Set();
  let mapaListo = false;
  let limiteTerritorialCapa = null;
  let territorioSolicitado = "";
  const cacheLimites = new Map();
  const MUNICIPIOS_CORDOBA = [
    "Ayapel","Buenavista","Canalete","Cereté","Chimá","Chinú","Ciénaga de Oro",
    "Cotorra","La Apartada","Lorica","Los Córdobas","Momil","Montelíbano","Montería",
    "Moñitos","Planeta Rica","Pueblo Nuevo","Puerto Escondido","Puerto Libertador",
    "Purísima","Sahagún","San Andrés de Sotavento","San Antero","San Bernardo del Viento",
    "San Carlos","San José de Uré","San Pelayo","Tierralta","Tuchín","Valencia",
    "Santa Cruz de Lorica","San Antero"
  ];

  function categoriaDe(key) {
    return (typeof CATEGORIAS !== "undefined" && CATEGORIAS[key]) || {
      nombre: "Otros registros", color: "#5D6B7E", simbolo: "📍",
      descripcion: "Registro de la cartografía."
    };
  }

  function inicializarMapa() {
    if (mapa) return;
    mapa = L.map("mapaRevision", { zoomControl: true, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapa);
    capaMarcadores = L.layerGroup().addTo(mapa);
    capaFiguras = L.layerGroup().addTo(mapa);
    capaLimite = L.layerGroup().addTo(mapa);
    const cfg = estado && estado.config ? estado.config : {};
    const centro = cfg.centro || { lat: 8.8, lng: -75.41, zoom: 11 };
    mapa.setView([coord(centro.lat || 8.8), coord(centro.lng || -75.41)], coord(centro.zoom || 11));
    mapaListo = true;
  }

  function construirItems() {
    const resultado = [];
    (Array.isArray(estado.fichas) ? estado.fichas : []).forEach((f) => {
      if (!f || f.visible === false) return;
      const cat = CATEGORIAS[f.categoria] ? f.categoria : "lugares";
      const latLngs = hasCoord(f.lat) && hasCoord(f.lng) ? [{ lat: coord(f.lat), lng: coord(f.lng), lugar: f.lugar || f.nombre }] : [];
      resultado.push({
        id: "ficha:" + (f.id || resultado.length),
        tipo: "ficha",
        nombre: cleanText(f.nombre) || "Registro sin título",
        categoria: cat,
        subtema: cleanText(f.subtema),
        descripcion: cleanText(f.descripcion),
        historia: cleanText(f.historia),
        actores: cleanText(f.actores),
        fecha: cleanText(f.fecha),
        fuente: cleanText(f.fuente),
        precision: cleanText(f.precision),
        observaciones: cleanText(f.observaciones),
        ubicaciones: latLngs,
        raw: f
      });
    });
    (Array.isArray(estado.ideas) ? estado.ideas : []).forEach((idea) => {
      if (!idea) return;
      const cat = CATEGORIAS[idea.categoria] ? idea.categoria : "lugares";
      const ubicaciones = (Array.isArray(idea.ubicaciones) ? idea.ubicaciones : []).map((u) => {
        if (!u) return null;
        return {
          lat: hasCoord(u.lat) ? coord(u.lat) : null,
          lng: hasCoord(u.lng) ? coord(u.lng) : null,
          lugar: cleanText(u.lugar || u.nombre),
          nombre: cleanText(u.nombre),
          descripcion: cleanText(u.descripcion),
          precision: cleanText(u.precision),
          fecha: cleanText(u.fecha),
          simbolo: cleanText(u.simboloCampo || u.simbolo)
        };
      }).filter(Boolean);
      resultado.push({
        id: "idea:" + (idea.id || resultado.length),
        tipo: "tema",
        nombre: cleanText(idea.nombre) || "Tema sin título",
        categoria: cat,
        subtema: "",
        descripcion: cleanText(idea.descripcion),
        historia: "",
        actores: "",
        fecha: cleanText(idea.fecha),
        fuente: cleanText(idea.fuente),
        precision: "",
        observaciones: "",
        ubicaciones,
        raw: idea
      });
    });
    return resultado;
  }

  function ubicacionesConCoordenadas(item) {
    return (item.ubicaciones || []).filter((u) => hasCoord(u.lat) && hasCoord(u.lng) &&
      coord(u.lat) >= -90 && coord(u.lat) <= 90 && coord(u.lng) >= -180 && coord(u.lng) <= 180);
  }

  function renderFiltros() {
    const cont = $("#filtrosCategorias");
    const keys = Object.keys(CATEGORIAS || {});
    const cantidades = {};
    items.forEach((item) => { cantidades[item.categoria] = (cantidades[item.categoria] || 0) + 1; });
    const cfg = estado && estado.config ? estado.config : {};
    if (cfg.mostrarLimite && cfg.limite) cantidades.delimitacion = (cantidades.delimitacion || 0) + 1;
    if (!categoriasActivas.size) categoriasActivas = new Set(keys);
    cont.innerHTML = keys.map((key) => {
      const cat = categoriaDe(key);
      const checked = categoriasActivas.has(key) ? " checked" : "";
      return "<label class='filtro-categoria'>" +
        "<input type='checkbox' data-filtro-categoria='" + escapeHTML(key) + "'" + checked + ">" +
        "<span class='filtro-categoria__simbolo' style='background:" + escapeHTML(cat.color || "#5D6B7E") + "'>" + escapeHTML(cat.simbolo || "•") + "</span>" +
        "<span class='filtro-categoria__texto'><strong>" + escapeHTML(cat.nombre || key) + "</strong><small title='" + escapeHTML(cat.descripcion || "") + "'>" + escapeHTML((cat.descripcion || "").slice(0, 66)) + ((cat.descripcion || "").length > 66 ? "…" : "") + "</small></span>" +
        "<span class='filtro-categoria__cantidad'>" + (cantidades[key] || 0) + "</span></label>";
    }).join("");
  }

  function iconoMarcador(item) {
    const cat = categoriaDe(item.categoria);
    return L.divIcon({
      className: "",
      html: "<span class='rp-marcador' style='width:34px;height:34px;background:" + escapeHTML(cat.color || "#5D6B7E") + ";font-size:18px'>" + escapeHTML(cat.simbolo || "•") + "</span>",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -15]
    });
  }

  function popupHTML(item, ubi) {
    const cat = categoriaDe(item.categoria);
    const nombre = ubi && ubi.nombre ? item.nombre + " — " + ubi.nombre : item.nombre;
    const lugar = ubi && ubi.lugar ? "<p><strong>Lugar:</strong> " + escapeHTML(ubi.lugar) + "</p>" : "";
    const descripcion = (ubi && ubi.descripcion) || item.descripcion || item.historia || "";
    const fecha = (ubi && ubi.fecha) || item.fecha;
    const fuente = item.fuente && /^https?:\/\//i.test(item.fuente)
      ? "<a href='" + escapeHTML(item.fuente) + "' target='_blank' rel='noopener noreferrer'>Consultar fuente</a>"
      : (item.fuente ? "<p><strong>Fuente:</strong> " + escapeHTML(item.fuente) + "</p>" : "");
    const descripcionHtml = descripcion.length > 450
      ? "<p class='texto-expandible'><span>" + escapeHTML(descripcion.slice(0, 450)) + "…</span><span class='texto-completo' hidden>" + escapeHTML(descripcion.slice(450)) +
        "</span></p><button type='button' class='btn-leer-mas' data-leer-mas aria-expanded='false'>Leer más</button>"
      : (descripcion ? "<p>" + escapeHTML(descripcion) + "</p>" : "");
    return "<div class='rp-popup'><div class='rp-popup__categoria' style='color:" + escapeHTML(cat.color || "#5D6B7E") + "'>" +
      escapeHTML(cat.simbolo || "") + " " + escapeHTML(cat.nombre || item.categoria) + "</div><h3>" + escapeHTML(nombre) + "</h3>" +
      (fecha ? "<p><strong>Fecha o periodo:</strong> " + escapeHTML(fecha) + "</p>" : "") + lugar +
      descripcionHtml +
      (item.precision ? "<p><strong>Precisión:</strong> " + escapeHTML(item.precision) + "</p>" : "") + fuente + "</div>";
  }

  function normalizarTexto(valor) {
    return cleanText(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  }

  function territorioDeItemsActivos() {
    const todas = Object.keys(CATEGORIAS || {});
    if (categoriasActivas.size >= todas.length && todas.every((key) => categoriasActivas.has(key))) {
      return { nombre: "Córdoba", tipo: "departamento" };
    }
    const activos = items.filter((item) => categoriasActivas.has(item.categoria));
    const textos = activos.map((item) => {
      const raw = item.raw || {};
      return [
        item.nombre, item.subtema, item.descripcion, item.historia, item.fuente,
        raw.municipio, raw.territorio, raw.departamento, raw.zona, raw.vereda, raw.barrio,
        ...(item.ubicaciones || []).flatMap((u) => [u.nombre, u.lugar, u.descripcion, u.municipio, u.territorio, u.departamento])
      ].filter(Boolean).join(" ");
    });
    const encontrados = MUNICIPIOS_CORDOBA.filter((municipio) => {
      const n = normalizarTexto(municipio);
      return textos.some((t) => {
        const txt = normalizarTexto(t);
        return txt.includes(n) || (n === "cerete" && /\bcerete\b/.test(txt)) ||
          (n === "sahagun" && /\bsahagun\b/.test(txt));
      });
    });
    if (encontrados.length === 1) return { nombre: encontrados[0], tipo: "municipio" };
    if (encontrados.length > 1) return { nombre: "Córdoba", tipo: "departamento" };
    if (textos.some((t) => /\bdepartamento de cordoba\b|\bcordoba, colombia\b|\bcordoba colombia\b/i.test(normalizarTexto(t)))) {
      return { nombre: "Córdoba", tipo: "departamento" };
    }
    const municipioGuardado = cleanText(estado?.config?.municipio);
    if (municipioGuardado) return { nombre: municipioGuardado, tipo: "municipio" };
    return { nombre: "Córdoba", tipo: "departamento" };
  }

  async function obtenerLimiteTerritorial(territorio) {
    const nombre = territorio.nombre || "Córdoba";
    const tipo = territorio.tipo || "municipio";
    const clave = normalizarTexto(nombre + "|" + tipo);
    if (cacheLimites.has(clave)) return cacheLimites.get(clave);
    const consulta = tipo === "departamento"
      ? "Departamento de Córdoba, Colombia"
      : nombre + ", Córdoba, Colombia";
    const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&addressdetails=1&limit=8&q=" + encodeURIComponent(consulta);
    const promesa = fetch(url, { headers: { "Accept": "application/json" } })
      .then((r) => r.ok ? r.json() : [])
      .then((resultados) => {
        const lista = Array.isArray(resultados) ? resultados : [];
        const candidatos = lista.filter((r) => r && r.geojson && r.geojson.type &&
          (r.class === "boundary" || r.type === "administrative" || r.addresstype === "municipality" || r.addresstype === "state" || r.addresstype === "county"));
        const elegido = candidatos.find((r) => {
          const nombreResultado = normalizarTexto(r.name || r.display_name || "");
          return nombreResultado.includes(normalizarTexto(nombre));
        }) || candidatos[0];
        if (!elegido) return null;
        return {
          type: "Feature",
          properties: {
            nombre: "Límite de referencia de " + nombre,
            fuente: "OpenStreetMap / Nominatim",
            oficial: false,
            nota: "Límite cartográfico de referencia; consulte la fuente oficial para usos administrativos o legales."
          },
          geometry: elegido.geojson
        };
      })
      .catch(() => null);
    cacheLimites.set(clave, promesa);
    return promesa;
  }

  async function actualizarLimiteTerritorial() {
    if (!capaLimite || !estado) return;
    capaLimite.clearLayers();
    if (!$("#verFiguras").checked) return;
    const territorio = territorioDeItemsActivos();
    const solicitud = territorio.nombre + "|" + territorio.tipo;
    territorioSolicitado = solicitud;
    const cfg = estado.config || {};
    let geojson = null;
    if (territorio.tipo === "municipio" &&
        normalizarTexto(territorio.nombre) === normalizarTexto(cfg.municipio || "Sahagún") &&
        cfg.mostrarLimite && cfg.limite) {
      geojson = cfg.limite;
    } else {
      geojson = await obtenerLimiteTerritorial(territorio);
    }
    if (territorioSolicitado !== solicitud || !capaLimite) return;
    if (!geojson && territorio.tipo === "municipio" &&
        normalizarTexto(territorio.nombre) === normalizarTexto(cfg.municipio || "Sahagún") &&
        cfg.limite) geojson = cfg.limite;
    if (geojson) {
      try {
        L.geoJSON(geojson, {
          style: { color: "#102D4F", weight: 3, opacity: .95, dashArray: "7 5", fillColor: "#52745D", fillOpacity: .09 }
        }).addTo(capaLimite);
        const bounds = L.geoJSON(geojson).getBounds();
        if (bounds.isValid()) mapa.fitBounds(bounds, { padding: [24, 24], maxZoom: territorio.tipo === "departamento" ? 9 : 12 });
        $("#nombreTerritorio").textContent = territorio.nombre + (territorio.tipo === "departamento" ? " · departamento" : " · municipio");
      } catch (e) {
        $("#nombreTerritorio").textContent = territorio.nombre;
      }
    } else {
      $("#nombreTerritorio").textContent = territorio.nombre + " · límite no disponible";
    }
  }

  function dibujarLimiteYFiguras() {
    if (!capaFiguras || !capaLimite) return;
    capaFiguras.clearLayers();
    const cfg = estado.config || {};
    if ($("#verFiguras").checked) {
      (Array.isArray(estado.zonas) ? estado.zonas : []).forEach((z) => {
        if (!z || !z.tipo) return;
        const color = z.color || "#C9A227";
        const style = { color, weight: 3, fillColor: color, fillOpacity: .24, opacity: .9 };
        let layer = null;
        try {
          if (z.tipo === "poligono" && Array.isArray(z.coords)) layer = L.polygon(z.coords, style);
          else if (z.tipo === "rectangulo" && Array.isArray(z.coords) && z.coords.length >= 2) {
            const a = z.coords[0], b = z.coords[1];
            layer = L.polygon([[a[0], a[1]], [a[0], b[1]], [b[0], b[1]], [b[0], a[1]]], style);
          } else if (z.tipo === "circulo" && Array.isArray(z.centro)) layer = L.circle(z.centro, { radius: coord(z.radio) || 10, ...style });
          else if (z.tipo === "marca" && Array.isArray(z.coords)) layer = L.circleMarker(z.coords, { radius: 8, color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 });
          else if (["linea", "flecha"].includes(z.tipo) && Array.isArray(z.coords)) layer = L.polyline(z.coords, { color, weight: 4 });
          else if (["estrella", "texto"].includes(z.tipo) && Array.isArray(z.coords)) {
            layer = L.marker(z.coords, { icon: L.divIcon({ className: "", html: "<span style='display:block;padding:4px 7px;border:2px solid " + escapeHTML(color) + ";border-radius:8px;background:#fff;color:" + escapeHTML(color) + ";font-weight:800'>" + escapeHTML(z.tipo === "estrella" ? "★" : (z.texto || "Etiqueta")) + "</span>" }) });
          }
          if (layer) layer.addTo(capaFiguras);
        } catch (e) {}
      });
    }
  }

  function renderMapa() {
    if (!mapa) return;
    capaMarcadores.clearLayers();
    const consulta = cleanText($("#buscarRegistro").value).toLocaleLowerCase("es");
    let visibles = 0;
    let ubicados = 0;
    items.forEach((item) => {
      if (!categoriasActivas.has(item.categoria)) return;
      const texto = [item.nombre, item.subtema, item.descripcion, item.historia, item.fuente,
        ...(item.ubicaciones || []).map((u) => [u.nombre, u.lugar, u.descripcion].join(" "))].join(" ").toLocaleLowerCase("es");
      if (consulta && !texto.includes(consulta)) return;
      visibles += 1;
      ubicacionesConCoordenadas(item).forEach((ubi) => {
        const marker = L.marker([ubi.lat, ubi.lng], { icon: iconoMarcador(item), keyboard: true });
        marker.bindPopup(popupHTML(item, ubi), { maxWidth: 300 });
        marker.addTo(capaMarcadores);
        ubicados += 1;
      });
    });
    dibujarLimiteYFiguras();
    actualizarLimiteTerritorial();
    $("#estadoResultados").textContent = visibles + " registros visibles · " + ubicados + " puntos ubicados";
    $("#totalUbicaciones").textContent = ubicados;
  }

  function renderLista() {
    const cont = $("#listaRegistros");
    const consulta = cleanText($("#buscarRegistro").value).toLocaleLowerCase("es");
    const filtrados = items.filter((item) => {
      if (!categoriasActivas.has(item.categoria)) return false;
      const texto = [item.nombre, item.subtema, item.descripcion, item.historia, item.fuente,
        ...(item.ubicaciones || []).map((u) => [u.nombre, u.lugar, u.descripcion].join(" "))].join(" ").toLocaleLowerCase("es");
      return !consulta || texto.includes(consulta);
    });
    $("#cantidadLista").textContent = filtrados.length + (filtrados.length === 1 ? " registro" : " registros");
    if (!filtrados.length) {
      cont.innerHTML = "<div class='registro-vacio'>No hay registros que coincidan con las categorías y la búsqueda seleccionadas.</div>";
      return;
    }
    cont.innerHTML = filtrados.map((item) => {
      const cat = categoriaDe(item.categoria);
      const sitios = item.ubicaciones || [];
      const nombresSitios = sitios.map((u) => u.nombre || u.lugar).filter(Boolean);
      const resumen = item.descripcion || item.historia || item.observaciones || "Este registro no tiene una descripción adicional.";
      const fecha = item.fecha ? "<span> · " + escapeHTML(item.fecha) + "</span>" : "";
      const sitio = nombresSitios.length ? "<div class='registro-card__meta'>" + escapeHTML(nombresSitios.slice(0, 3).join(" · ")) + (nombresSitios.length > 3 ? " +" + (nombresSitios.length - 3) : "") + "</div>" : "";
      const fuente = item.fuente && /^https?:\/\//i.test(item.fuente)
        ? "<a class='registro-card__fuente' href='" + escapeHTML(item.fuente) + "' target='_blank' rel='noopener noreferrer'>Consultar fuente ↗</a>"
        : (item.fuente ? "<div class='registro-card__meta'>Fuente: " + escapeHTML(item.fuente) + "</div>" : "");
      const coords = ubicacionesConCoordenadas(item);
      const button = coords.length ? "<button class='registro-card__ver' type='button' data-enfocar='" + escapeHTML(item.id) + "'>Ver en el mapa</button>" : "";
      const resumenCorto = resumen.length > 380;
      const resumenHtml = resumenCorto
        ? "<p class='texto-expandible'><span>" + escapeHTML(resumen.slice(0, 380)) + "…</span><span class='texto-completo' hidden>" + escapeHTML(resumen.slice(380)) + "</span></p><button type='button' class='btn-leer-mas' data-leer-mas aria-expanded='false'>Leer más</button>"
        : "<p class='texto-expandible'>" + escapeHTML(resumen) + "</p>";
      return "<article class='registro-card'><div class='registro-card__cabecera'><span class='registro-card__simbolo' style='background:" + escapeHTML(cat.color || "#5D6B7E") + "'>" +
        escapeHTML(cat.simbolo || "•") + "</span><div><h3>" + escapeHTML(item.nombre) + "</h3><div class='registro-card__meta'>" +
        escapeHTML(cat.nombre || item.categoria) + fecha + "</div>" + sitio + "</div></div>" + resumenHtml + fuente + button + "</article>";
    }).join("");
  }

  function renderReflexion() {
    const r = estado.reflexion || {};
    const bloques = [
      ["Reflexión sobre la teología de paz", r.texto],
      ["Retos actuales", r.reto],
      ["Oportunidades y signos de esperanza", r.oportunidad]
    ].filter((b) => cleanText(b[1]));
    $("#contenidoReflexion").innerHTML = bloques.length ? bloques.map((b) => {
      const texto = cleanText(b[1]);
      if (texto.length > 480) {
        return "<article class='reflexion-bloque'><h3>" + escapeHTML(b[0]) + "</h3><p class='texto-expandible'><span>" +
          escapeHTML(texto.slice(0, 480)) + "…</span><span class='texto-completo' hidden>" + escapeHTML(texto.slice(480)) +
          "</span></p><button type='button' class='btn-leer-mas' data-leer-mas aria-expanded='false'>Leer más</button></article>";
      }
      return "<article class='reflexion-bloque'><h3>" + escapeHTML(b[0]) + "</h3><p>" + escapeHTML(texto) + "</p></article>";
    }).join("") : "<p>La reflexión final aún no tiene contenido guardado.</p>";
  }

  function mostrarEstado(estadoNuevo) {
    estado = estadoNuevo || {};
    estado.config = estado.config || {};
    estado.fichas = Array.isArray(estado.fichas) ? estado.fichas : [];
    estado.ideas = Array.isArray(estado.ideas) ? estado.ideas : [];
    estado.zonas = Array.isArray(estado.zonas) ? estado.zonas : [];
    items = construirItems();
    categoriasActivas = new Set(Object.keys(CATEGORIAS || {}));
    $("#nombreTerritorio").textContent = estado.config.nombreTerritorio || "Sahagún, Córdoba";
    $("#totalRegistros").textContent = items.length;
    $("#acceso").hidden = true;
    $("#panelRevision").hidden = false;
    $("#btnSalir").hidden = false;
    renderFiltros();
    inicializarMapa();
    renderMapa();
    renderLista();
    renderReflexion();
    setTimeout(() => mapa && mapa.invalidateSize(), 80);
  }

  async function entrar() {
    const error = $("#accesoError");
    const titulo = $("#accesoTitulo");
    error.textContent = "Estamos consultando los registros compartidos. No necesita contraseña.";
    if (titulo) titulo.textContent = "Cargando cartografía";
    try {
      const r = await fetch("/api/revision", {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        if (titulo) titulo.textContent = "No fue posible cargar la cartografía";
        error.textContent = data.error || "No fue posible abrir la cartografía. Inténtelo de nuevo más tarde.";
        return;
      }
      if (!data.estado) {
        if (titulo) titulo.textContent = "La cartografía aún no está disponible";
        error.textContent = "La base de datos compartida está vacía. Abra la aplicación de trabajo y guarde los registros en la nube.";
        return;
      }
      mostrarEstado(data.estado);
    } catch (e) {
      if (titulo) titulo.textContent = "No fue posible conectar";
      error.textContent = "Compruebe su conexión a internet e inténtelo de nuevo.";
    }
  }

  function salir() {
    estado = null;
    items = [];
    categoriasActivas.clear();
    if (capaMarcadores) capaMarcadores.clearLayers();
    if (capaFiguras) capaFiguras.clearLayers();
    if (capaLimite) capaLimite.clearLayers();
    $("#panelRevision").hidden = true;
    $("#btnSalir").hidden = true;
    $("#acceso").hidden = false;
    $("#claveRevision").value = "";
    $("#accesoError").textContent = "";
  }

  $("#btnSalir").addEventListener("click", () => window.location.reload());
  $("#btnTodas").addEventListener("click", () => {
    categoriasActivas = new Set(Object.keys(CATEGORIAS || {}));
    document.querySelectorAll("[data-filtro-categoria]").forEach((input) => { input.checked = true; });
    renderMapa();
    renderLista();
  });
  $("#filtrosCategorias").addEventListener("change", (event) => {
    const input = event.target.closest("[data-filtro-categoria]");
    if (!input) return;
    if (input.checked) categoriasActivas.add(input.dataset.filtroCategoria);
    else categoriasActivas.delete(input.dataset.filtroCategoria);
    renderMapa();
    renderLista();
  });
  $("#buscarRegistro").addEventListener("input", () => {
    renderMapa();
    renderLista();
  });
  $("#verFiguras").addEventListener("change", () => {
    dibujarLimiteYFiguras();
    actualizarLimiteTerritorial();
  });
  document.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-leer-mas]");
    if (!boton) return;
    const texto = boton.previousElementSibling;
    if (!texto) return;
    const completo = texto.querySelector(".texto-completo");
    if (!completo) return;
    const expandido = boton.getAttribute("aria-expanded") === "true";
    completo.hidden = expandido;
    boton.setAttribute("aria-expanded", String(!expandido));
    boton.textContent = expandido ? "Leer más" : "Leer menos";
  });
  $("#listaRegistros").addEventListener("click", (event) => {
    const button = event.target.closest("[data-enfocar]");
    if (!button || !mapa) return;
    const item = items.find((entry) => entry.id === button.dataset.enfocar);
    const first = item && ubicacionesConCoordenadas(item)[0];
    if (!first) return;
    mapa.setView([first.lat, first.lng], Math.max(mapa.getZoom(), 14), { animate: true });
    capaMarcadores.eachLayer((marker) => {
      const ll = marker.getLatLng();
      if (Math.abs(ll.lat - first.lat) < 1e-6 && Math.abs(ll.lng - first.lng) < 1e-6) marker.openPopup();
    });
    $("#mapaRevision").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // La vista del profesor es pública y de solo lectura: cargar sin pedir contraseña.
  entrar();
})();
