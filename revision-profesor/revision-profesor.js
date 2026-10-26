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
  const ubicacionesGeocodificadas = new Map();
  const geocodificacionesIntentadas = new Set();
  let geocodificacionEnCurso = false;
  let ultimoLimiteAjustado = "";
  const MUNICIPIOS_CORDOBA = [
    "Ayapel","Buenavista","Canalete","Cereté","Chimá","Chinú","Ciénaga de Oro",
    "Cotorra","La Apartada","Lorica","Los Córdobas","Momil","Montelíbano","Montería",
    "Moñitos","Planeta Rica","Pueblo Nuevo","Puerto Escondido","Puerto Libertador",
    "Purísima","Sahagún","San Andrés de Sotavento","San Antero","San Bernardo del Viento",
    "San Carlos","San José de Uré","San Pelayo","Tierralta","Tuchín","Valencia",
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
      const tieneUbicacion = cleanText(f.lugar || f.nombre || f.municipio || f.territorio || f.zona);
      const latLngs = (hasCoord(f.lat) && hasCoord(f.lng)) || tieneUbicacion ? [{
        lat: hasCoord(f.lat) ? coord(f.lat) : null,
        lng: hasCoord(f.lng) ? coord(f.lng) : null,
        lugar: cleanText(f.lugar || f.nombre),
        nombre: cleanText(f.nombre),
        descripcion: cleanText(f.descripcion),
        municipio: cleanText(f.municipio),
        territorio: cleanText(f.territorio || f.zona),
        departamento: cleanText(f.departamento),
        fecha: cleanText(f.fecha)
      }] : [];
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
          municipio: cleanText(u.municipio),
          territorio: cleanText(u.territorio || u.zona),
          departamento: cleanText(u.departamento),
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

  function claveUbicacion(item, ubi) {
    const nombre = cleanText(ubi.nombre || ubi.lugar || item.nombre);
    const municipio = cleanText(ubi.municipio || ubi.territorio || item.raw?.municipio || item.raw?.territorio || "");
    return normalizarTexto(nombre + "|" + municipio);
  }

  function ubicacionesConCoordenadas(item) {
    return (item.ubicaciones || []).map((ubi) => {
      if (hasCoord(ubi.lat) && hasCoord(ubi.lng)) return ubi;
      const punto = ubicacionesGeocodificadas.get(claveUbicacion(item, ubi));
      return punto ? { ...ubi, lat: punto.lat, lng: punto.lng, geocodificada: true } : null;
    }).filter((u) => u && hasCoord(u.lat) && hasCoord(u.lng) &&
      coord(u.lat) >= -90 && coord(u.lat) <= 90 && coord(u.lng) >= -180 && coord(u.lng) <= 180);
  }

  function municipioMencionado(texto) {
    const normalizado = " " + normalizarTexto(texto).replace(/[^a-z0-9]+/g, " ") + " ";
    return MUNICIPIOS_CORDOBA.find((municipio) => {
      const n = normalizarTexto(municipio).replace(/[^a-z0-9]+/g, " ");
      return normalizado.includes(" " + n + " ");
    }) || "";
  }

  function municipioDeUbicacion(item, ubi) {
    const raw = item.raw || {};
    const explicito = cleanText(ubi.municipio || raw.municipio);
    if (explicito && municipioMencionado(explicito)) return municipioMencionado(explicito);
    const territorio = cleanText(ubi.territorio || raw.territorio || raw.zona);
    if (territorio && municipioMencionado(territorio)) return municipioMencionado(territorio);
    return municipioMencionado([
      ubi.nombre, ubi.lugar, ubi.descripcion, item.nombre, item.descripcion, item.historia,
      raw.municipio, raw.territorio, raw.zona, raw.vereda, raw.barrio
    ].filter(Boolean).join(" "));
  }

  async function geocodificarUbicacion(item, ubi) {
    const clave = claveUbicacion(item, ubi);
    if (ubicacionesGeocodificadas.has(clave) || geocodificacionesIntentadas.has(clave)) return null;
    geocodificacionesIntentadas.add(clave);
    const lugar = cleanText(ubi.nombre || ubi.lugar || item.nombre);
    if (!lugar) return null;
    const municipio = municipioDeUbicacion(item, ubi);
    const consulta = [lugar, municipio, "Córdoba", "Colombia"].filter(Boolean).join(", ");
    const params = new URLSearchParams({
      format: "jsonv2", addressdetails: "1", countrycodes: "co", limit: "5",
      q: consulta, viewbox: "-76.8,9.8,-74.5,7.2", bounded: "1"
    });
    try {
      const respuesta = await fetch("https://nominatim.openstreetmap.org/search?" + params.toString(), {
        headers: { "Accept": "application/json" }
      });
      if (!respuesta.ok) return null;
      const resultados = await respuesta.json();
      const elegido = (Array.isArray(resultados) ? resultados : []).find((r) => {
        if (!r || !r.address || r.address.country_code !== "co" || !hasCoord(r.lat) || !hasCoord(r.lon)) return false;
        const departamento = normalizarTexto(r.address.state || r.address.state_district || "");
        const codigo = normalizarTexto(r.address.state_code || "");
        if (!(departamento === "cordoba" || codigo.includes("co-cor"))) return false;
        if (municipio) {
          const municipioResultado = normalizarTexto([
            r.address.city, r.address.town, r.address.municipality, r.address.county,
            r.address.village, r.address.city_district
          ].filter(Boolean).join(" "));
          if (municipioResultado && !municipioResultado.includes(normalizarTexto(municipio))) return false;
        }
        return true;
      });
      if (!elegido) return null;
      const punto = { lat: Number(elegido.lat), lng: Number(elegido.lon) };
      ubicacionesGeocodificadas.set(clave, punto);
      return punto;
    } catch (e) {
      return null;
    }
  }

  async function geocodificarUbicacionesPendientes() {
    if (geocodificacionEnCurso) return;
    const pendientes = [];
    items.forEach((item) => {
      if (!categoriasActivas.has(item.categoria)) return;
      (item.ubicaciones || []).forEach((ubi) => {
        if (hasCoord(ubi.lat) && hasCoord(ubi.lng)) return;
        const clave = claveUbicacion(item, ubi);
        if (!geocodificacionesIntentadas.has(clave) && !ubicacionesGeocodificadas.has(clave)) pendientes.push({ item, ubi });
      });
    });
    if (!pendientes.length) return;
    geocodificacionEnCurso = true;
    let huboResultados = false;
    for (const pendiente of pendientes) {
      const punto = await geocodificarUbicacion(pendiente.item, pendiente.ubi);
      if (punto) huboResultados = true;
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
    geocodificacionEnCurso = false;
    if (huboResultados) renderMapa();
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

  function territoriosDeItemsActivos() {
    return [{ nombre: "Córdoba", tipo: "departamento" }];
  }

  async function obtenerLimiteTerritorial(territorio) {
    const nombre = territorio.nombre || "Córdoba";
    const tipo = territorio.tipo || "municipio";
    const clave = normalizarTexto(nombre + "|" + tipo);
    if (cacheLimites.has(clave)) return cacheLimites.get(clave);
    const parametros = new URLSearchParams({
      format: "jsonv2",
      polygon_geojson: "1",
      addressdetails: "1",
      countrycodes: "co",
      limit: "8",
      state: "Córdoba",
      country: "Colombia"
    });
    if (tipo !== "departamento") parametros.set("city", nombre);
    const url = "https://nominatim.openstreetmap.org/search?" + parametros.toString();
    const promesa = fetch(url, { headers: { "Accept": "application/json" } })
      .then((r) => r.ok ? r.json() : [])
      .then((resultados) => {
        const lista = Array.isArray(resultados) ? resultados : [];
        const candidatos = lista.filter((r) => {
          if (!r || !r.geojson || !["Polygon", "MultiPolygon"].includes(r.geojson.type)) return false;
          const pais = normalizarTexto((r.address && r.address.country_code) || r.country_code || "");
          const nombreCompleto = normalizarTexto(r.display_name || "");
          const esColombia = pais === "co" || nombreCompleto.includes("colombia");
          const esAdministrativo = r.class === "boundary" || r.type === "administrative" ||
            r.addresstype === "municipality" || r.addresstype === "state" ||
            r.addresstype === "county" || r.addresstype === "department";
          return esColombia && esAdministrativo;
        });
        const elegido = candidatos.find((r) => {
          const nombreResultado = normalizarTexto(r.name || "");
          if (nombreResultado !== normalizarTexto(nombre)) return false;
          if (tipo === "departamento") {
            const nivel = normalizarTexto(r.addresstype || "");
            return nivel === "state" || nivel === "department" || nivel === "county" ||
              normalizarTexto(r.address && r.address["ISO3166-2-lvl4"] || "").includes("co-cor");
          }
          return true;
        });
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
    const solicitud = "cordoba|departamento";
    if (ultimoLimiteAjustado === solicitud && capaLimite.getLayers().length) {
      $("#nombreTerritorio").textContent = "Departamento de Córdoba";
      return;
    }
    capaLimite.clearLayers();
    territorioSolicitado = solicitud;
    const geojson = await obtenerLimiteTerritorial({ nombre: "Córdoba", tipo: "departamento" });
    if (territorioSolicitado !== solicitud || !capaLimite) return;
    if (!geojson) {
      $("#nombreTerritorio").textContent = "Departamento de Córdoba · límite no disponible";
      return;
    }
    try {
      const layer = L.geoJSON(geojson, {
        style: { color: "#102D4F", weight: 3.5, opacity: 1, dashArray: "7 5",
          fillColor: "#52745D", fillOpacity: .035 }
      }).addTo(capaLimite);
      layer._rpTipoTerritorio = "departamento";
      const bounds = layer.getBounds();
      if (bounds.isValid() && !ultimoLimiteAjustado) {
        mapa.fitBounds(bounds, { padding: [28, 28], maxZoom: 8, animate: true });
        ultimoLimiteAjustado = solicitud;
      }
      $("#nombreTerritorio").textContent = "Departamento de Córdoba";
    } catch (e) {
      $("#nombreTerritorio").textContent = "Departamento de Córdoba · límite no disponible";
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
    let ubicacionesPendientes = 0;
    items.forEach((item) => {
      if (!categoriasActivas.has(item.categoria)) return;
      const texto = [item.nombre, item.subtema, item.descripcion, item.historia, item.fuente,
        ...(item.ubicaciones || []).map((u) => [u.nombre, u.lugar, u.descripcion].join(" "))].join(" ").toLocaleLowerCase("es");
      if (consulta && !texto.includes(consulta)) return;
      visibles += 1;
      (item.ubicaciones || []).forEach((ubi) => {
        if ((!hasCoord(ubi.lat) || !hasCoord(ubi.lng)) && !ubicacionesGeocodificadas.has(claveUbicacion(item, ubi))) {
          ubicacionesPendientes += 1;
        }
      });
      ubicacionesConCoordenadas(item).forEach((ubi) => {
        const marker = L.marker([ubi.lat, ubi.lng], { icon: iconoMarcador(item), keyboard: true });
        marker.bindPopup(popupHTML(item, ubi), { maxWidth: 300 });
        marker.addTo(capaMarcadores);
        ubicados += 1;
      });
    });
    dibujarLimiteYFiguras();
    actualizarLimiteTerritorial();
    geocodificarUbicacionesPendientes();
    $("#estadoResultados").textContent = visibles + " registros visibles · " + ubicados +
      " puntos ubicados" + (ubicacionesPendientes ? " · " + ubicacionesPendientes + " ubicaciones por verificar" : "");
    $("#totalUbicaciones").textContent = ubicados;
  }

  function renderTemas() {
    const cont = $("#listaTemas");
    const ideas = Array.isArray(estado.ideas) ? estado.ideas : [];
    $("#cantidadTemas").textContent = ideas.length + (ideas.length === 1 ? " tema" : " temas");
    if (!ideas.length) {
      cont.innerHTML = "<div class='registro-vacio'>No hay temas guardados en la cartografía compartida. Guarda los cambios en la aplicación de trabajo y vuelve a cargar esta vista.</div>";
      return;
    }
    cont.innerHTML = ideas.map((idea) => {
      const cat = categoriaDe(idea.categoria);
      const texto = cleanText(idea.descripcion) || "Este tema aún no tiene una descripción.";
      const sitios = Array.isArray(idea.ubicaciones) ? idea.ubicaciones.filter(Boolean) : [];
      const fecha = cleanText(idea.fecha) ? "<span> · " + escapeHTML(idea.fecha) + "</span>" : "";
      let descripcion = "<p class='tema-card__descripcion'>" + escapeHTML(texto) + "</p>";
      if (texto.length > 560) {
        descripcion = "<p class='tema-card__descripcion texto-expandible'><span>" + escapeHTML(texto.slice(0, 560)) +
          "…</span><span class='texto-completo' hidden>" + escapeHTML(texto.slice(560)) +
          "</span></p><button type='button' class='btn-leer-mas' data-leer-mas aria-expanded='false'>Leer más</button>";
      }
      const listaSitios = sitios.length ? "<div class='tema-card__ubicaciones'><h4>Ubicaciones asociadas (" + sitios.length + ")</h4><ul>" +
        sitios.map((u) => {
          const nombre = cleanText(u.nombre || u.lugar) || "Lugar sin nombre";
          const detalle = cleanText(u.descripcion);
          const municipio = cleanText(u.municipio || u.territorio || u.zona);
          const coords = hasCoord(u.lat) && hasCoord(u.lng) ? "<p>Coordenadas: " + escapeHTML(u.lat) + ", " + escapeHTML(u.lng) + "</p>" : "";
          return "<li><strong>" + escapeHTML(nombre) + "</strong>" +
            (municipio ? "<span class='tema-card__lugar'> · " + escapeHTML(municipio) + "</span>" : "") +
            (detalle ? "<p>" + escapeHTML(detalle) + "</p>" : "") + coords + "</li>";
        }).join("") + "</ul></div>" : "<p class='tema-card__sin-ubicaciones'>Este tema no tiene ubicaciones asociadas guardadas.</p>";
      const fuente = cleanText(idea.fuente);
      const fuenteHtml = fuente ? "<p class='tema-card__fuente'>Fuente: " + escapeHTML(fuente) + "</p>" : "";
      const itemId = "idea:" + (idea.id || "");
      const btn = sitios.some((u) => hasCoord(u.lat) && hasCoord(u.lng))
        ? "<button type='button' class='registro-card__ver' data-enfocar='" + escapeHTML(itemId) + "'>Ver tema en el mapa</button>" : "";
      return "<article class='tema-card'><div class='tema-card__cabecera'><span class='registro-card__simbolo' style='background:" +
        escapeHTML(cat.color || "#5D6B7E") + "'>" + escapeHTML(cat.simbolo || "•") +
        "</span><div class='tema-card__titulos'><h3>" + escapeHTML(cleanText(idea.nombre) || "Tema sin título") +
        "</h3><p class='registro-card__meta'>" + escapeHTML(cat.nombre || idea.categoria || "Sin categoría") + fecha +
        "</p></div></div>" + descripcion + listaSitios + fuenteHtml + btn + "</article>";
    }).join("");
  }

  function renderLista() {
    const cont = $("#listaRegistros");
    const consulta = cleanText($("#buscarRegistro").value).toLocaleLowerCase("es");
    const filtrados = items.filter((item) => {
      if (item.tipo === "tema") return false;
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
      const pendientes = sitios.filter((u) =>
        (!hasCoord(u.lat) || !hasCoord(u.lng)) && !ubicacionesGeocodificadas.has(claveUbicacion(item, u))
      ).length;
      const button = coords.length ? "<button class='registro-card__ver' type='button' data-enfocar='" + escapeHTML(item.id) + "'>Ver en el mapa</button>" : "";
      const pendienteHtml = pendientes ? "<div class='registro-card__pendiente'>📍 " + pendientes +
        (pendientes === 1 ? " ubicación por verificar" : " ubicaciones por verificar") +
        ". No se coloca un punto exacto sin coordenadas fiables.</div>" : "";
      const resumenCorto = resumen.length > 380;
      const resumenHtml = resumenCorto
        ? "<p class='texto-expandible'><span>" + escapeHTML(resumen.slice(0, 380)) + "…</span><span class='texto-completo' hidden>" + escapeHTML(resumen.slice(380)) + "</span></p><button type='button' class='btn-leer-mas' data-leer-mas aria-expanded='false'>Leer más</button>"
        : "<p class='texto-expandible'>" + escapeHTML(resumen) + "</p>";
      return "<article class='registro-card'><div class='registro-card__cabecera'><span class='registro-card__simbolo' style='background:" + escapeHTML(cat.color || "#5D6B7E") + "'>" +
        escapeHTML(cat.simbolo || "•") + "</span><div><h3>" + escapeHTML(item.nombre) + "</h3><div class='registro-card__meta'>" +
        escapeHTML(cat.nombre || item.categoria) + fecha + "</div>" + sitio + pendienteHtml + "</div></div>" + resumenHtml + fuente + button + "</article>";
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
    $("#nombreTerritorio").textContent = "Departamento de Córdoba";
    $("#totalRegistros").textContent = items.length;
    $("#acceso").hidden = true;
    $("#panelRevision").hidden = false;
    $("#btnSalir").hidden = false;
    renderFiltros();
    inicializarMapa();
    renderMapa();
    renderTemas();
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
  $("#btnVerCordoba").addEventListener("click", () => {
    if (!mapa) return;
    let bounds = null;
    capaLimite.eachLayer((layer) => {
      if (layer._rpTipoTerritorio === "departamento" && layer.getBounds && layer.getBounds().isValid()) {
        if (!bounds) bounds = layer.getBounds();
        else bounds.extend(layer.getBounds());
      }
    });
    if (bounds && bounds.isValid()) mapa.fitBounds(bounds, { padding: [30, 30], maxZoom: 8, animate: true });
  });

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
