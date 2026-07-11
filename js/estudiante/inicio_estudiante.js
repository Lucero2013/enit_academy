import { supabase } from "../supabase.js";
import { estado } from "./estado_estudiante.js";
import { llenarFiltros, renderMiniCursosDisponibles } from "./cursos_disponibles_estudiante.js";
import { cargarEntregasEstudiante } from "./entregas_estudiante.js";
import { formatFecha, urgencia } from "./utilidades_estudiante.js";

export async function cargarDatos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("curso_id, cursos(id, nombre, descripcion, nivel, codigo, imagen_url, docente_id, perfiles(nombre, apellido))")
    .eq("estudiante_id", user.id);

  estado.cursosInscritos = (inscripciones || []).map(i => i.cursos).filter(Boolean);

  renderCursosInicio();
  renderCursosLista();

  const cursoIds = estado.cursosInscritos.map(c => c.id);
  if (cursoIds.length === 0) {
    renderAsideVacio();
    await renderMiniCursosDisponibles();
    return;
  }

  const { data: anunciosRaw } = await supabase
    .from("anuncios")
    .select("*, cursos(nombre), modulos(nombre)")
    .in("curso_id", cursoIds)
    .order("creado_at", { ascending: false })
    .limit(10);

  const { tareas, archivos } = await cargarItemsModulosPorCursos(cursoIds);

  renderAsideAnuncios(normalizarAnuncios(anunciosRaw || []));
  renderAsideTareas(tareas);
  renderAsideArchivos(archivos);
  renderAnunciosVista(anunciosRaw || []);
  renderTareasVista(tareas);
  renderArchivosVista(archivos);
  llenarFiltros(estado.cursosInscritos);
  actualizarBadges(estado.cursosInscritos, anunciosRaw || [], archivos, tareas);
  await renderMiniCursosDisponibles();
}
export function normalizarAnuncios(anuncios) {
  return anuncios.map(a => ({
    ...a,
    curso_nombre:  a.cursos?.nombre  || "",
    modulo_nombre: a.modulos?.nombre || null,
  }));
}

// ══ RENDER GRILLA DE CURSOS ═══════════════════════════════════════════════════
export function renderCursosInicio() {
  const contenedor = document.getElementById("listaCursosInicio");
  const msg        = document.getElementById("msgSinCursosInicio");
  if (!contenedor) return;

  if (estado.cursosInscritos.length === 0) {
    if (msg) msg.style.display = "";
    contenedor.querySelectorAll(".tarjeta-curso").forEach(el => el.remove());
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = estado.cursosInscritos.map(c => {
    const imgHtml = c.imagen_url
      ? `<img src="${c.imagen_url}" class="curso-img-portada" alt="${c.nombre}">`
      : `<div class="curso-img-placeholder"><i class="fa-solid fa-book-open"></i></div>`;

    return `
    <div class="tarjeta-curso" data-curso-id="${c.id}" onclick="abrirDetalleCursoEst('${c.id}')" style="cursor:pointer;">
      <div class="curso-img-wrap">${imgHtml}</div>
      <div class="tarjeta-curso-header">
        <div class="curso-badges">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
        </div>
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
      <div class="tarjeta-curso-footer" style="position:static; padding:0 1.3rem 1.1rem; width:100%;">
        <span style="font-size:0.78rem; color:var(--texto-claro); font-weight:600;">
          <i class="fa-solid fa-chalkboard-teacher"></i> ${c.perfiles?.nombre || ""} ${c.perfiles?.apellido || ""}
        </span>
      </div>
    </div>`;
  }).join("");
}

// ══ DETALLE DE UN CURSO ═══════════════════════════════════════════════════════
export function renderCursosLista() {
  const contenedor = document.getElementById("listaCursos");
  const msg        = document.getElementById("msgSinCursos");
  if (!contenedor) return;

  if (estado.cursosInscritos.length === 0) {
    if (msg) msg.style.display = "";
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = estado.cursosInscritos.map(c => `
    <div class="tarjeta-curso">
      <div class="tarjeta-curso-header">
        ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
      <div class="tarjeta-curso-footer">
        <span><i class="fa-solid fa-chalkboard-teacher"></i> ${c.perfiles?.nombre || ""} ${c.perfiles?.apellido || ""}</span>
      </div>
    </div>
  `).join("");
}

// ══ ASIDE DETALLADO ═══════════════════════════════════════════════════════════
export function renderAsideVacio() {
  const vacioHtml = `<p class="sin-datos">Sin datos</p>`;
  ["listaAnunciosAside","listaTareasAside","listaArchivosAside"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = vacioHtml;
  });
}

/* ── Fecha relativa ── */
function fechaRelativa(fechaStr) {
  if (!fechaStr) return "";
  const ahora = new Date();
  const fecha  = new Date(fechaStr);
  const diff   = Math.floor((ahora - fecha) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7)  return `Hace ${diff} días`;
  return fecha.toLocaleDateString("es", { day: "numeric", month: "short" });
}

/* ── Estado de vencimiento ── */
function estadoVencimiento(fechaVence) {
  if (!fechaVence) return { texto: "", clase: "" };
  const diff = Math.floor((new Date(fechaVence) - new Date()) / 86400000);
  if (diff < 0)   return { texto: "Vencida",           clase: "vencida" };
  if (diff === 0) return { texto: "Vence hoy",         clase: "urgente" };
  if (diff <= 2)  return { texto: `Vence en ${diff}d`, clase: "urgente" };
  return            { texto: `Vence en ${diff}d`,      clase: "normal"  };
}

/* ── Breadcrumb chips HTML ── */
function breadcrumbHtml(cursoNombre, moduloNombre) {
  return `
    <div class="aside-item-breadcrumb">
      <span class="aside-chip chip-curso">
        <i class="fa-solid fa-book-open" style="font-size:0.58rem;"></i>
        ${cursoNombre || "Curso"}
      </span>
      ${moduloNombre ? `
      <span class="aside-chip-sep">›</span>
      <span class="aside-chip chip-modulo">
        <i class="fa-solid fa-layer-group" style="font-size:0.58rem;"></i>
        ${moduloNombre}
      </span>` : ""}
    </div>`;
}

/* ── ANUNCIOS en aside ── */
export function renderAsideAnuncios(anuncios) {
  const contenedor = document.getElementById("listaAnunciosAside");
  if (!contenedor) return;

  // Actualizar badge
  const badge = document.getElementById("badgeAnuncios");
  if (badge) badge.textContent = anuncios.length > 0 ? anuncios.length : "";

  if (!anuncios.length) {
    contenedor.innerHTML = `<p class="sin-datos">Sin anuncios recientes.</p>`;
    return;
  }

  contenedor.innerHTML = anuncios.slice(0, 3).map(a => `
    <div class="aside-item" data-tipo="anuncio" data-id="${a.id}" tabindex="0" role="button">
      <div class="aside-item-header">
        <div class="aside-item-icono tipo-anuncio">
          <i class="fa-solid fa-bullhorn"></i>
        </div>
        <span class="aside-item-titulo">${a.titulo}</span>
      </div>
      <div class="aside-item-meta">
        ${breadcrumbHtml(a.curso_nombre, a.modulo_nombre)}
        ${a.contenido ? `<p class="aside-item-desc">${a.contenido}</p>` : ""}
        <div class="aside-item-footer" style="padding-left:0;margin-top:0.2rem;">
          <span class="aside-item-fecha">${fechaRelativa(a.creado_at)}</span>
        </div>
      </div>
    </div>
  `).join("");

  contenedor.querySelectorAll(".aside-item").forEach(item => {
    const ir = () => document.querySelector('.nav-btn[data-vista="anuncios"]')?.click();
    item.addEventListener("click", ir);
    item.addEventListener("keydown", e => { if (e.key === "Enter") ir(); });
  });
}

/* ── TAREAS en aside ── */
export function renderAsideTareas(tareas) {
  const contenedor = document.getElementById("listaTareasAside");
  if (!contenedor) return;

  const pendientes = tareas.filter(t =>
    !t.fecha_entrega || new Date(t.fecha_entrega) >= new Date()
  );

  const badge = document.getElementById("badgeTareas");
  if (badge) badge.textContent = pendientes.length > 0 ? pendientes.length : "";

  if (!pendientes.length) {
    contenedor.innerHTML = `<p class="sin-datos">Sin tareas pendientes.</p>`;
    return;
  }

  cargarEntregasEstudiante().then(entregadas => {
    contenedor.innerHTML = pendientes.slice(0, 3).map(t => {
      const { texto: textoVence, clase } = estadoVencimiento(t.fecha_entrega);
      const yaEntrego = entregadas.has(t.id);

      const btnEntrega = yaEntrego
        ? `<span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.68rem;font-weight:800;color:var(--color-ok,#1aaa6b);background:#effaf5;border:1.3px solid #a3e6c8;border-radius:50px;padding:0.22rem 0.65rem;">
             <i class="fa-solid fa-circle-check"></i> Entregado
           </span>`
        : `<button class="btn-primario" style="font-size:0.68rem;padding:0.22rem 0.7rem;border-radius:50px;"
             onclick="abrirModalEntrega('${t.id}','${(t.titulo||'').replace(/'/g,"\\'")}','${t.fecha_entrega||''}')">
             <i class="fa-solid fa-paper-plane"></i> Entregar
           </button>`;

      return `
      <div class="aside-item" data-tipo="tarea" data-id="${t.id}" tabindex="0" role="button">
        <div class="aside-item-header">
          <div class="aside-item-icono tipo-tarea">
            <i class="fa-solid fa-clipboard-list"></i>
          </div>
          <span class="aside-item-titulo">${t.titulo}</span>
        </div>
        <div class="aside-item-meta">
          ${breadcrumbHtml(t.cursos?.nombre || t.curso_nombre || "", t.modulo_nombre || "")}
          ${t.descripcion || t.contenido
            ? `<p class="aside-item-desc">${t.descripcion || t.contenido}</p>`
            : ""}
          <div class="aside-item-footer" style="padding-left:0;margin-top:0.35rem;gap:0.5rem;">
            ${textoVence
              ? `<span class="aside-item-vence ${clase}">${textoVence}</span>`
              : `<span class="aside-item-fecha">Sin fecha límite</span>`}
            ${t.puntos ? `<span style="font-size:0.68rem;color:#8b5cf6;font-weight:800;">${t.puntos} pts</span>` : ""}
            ${btnEntrega}
          </div>
        </div>
      </div>`;
    }).join("");

    // clicks en el item navegan a la vista tareas (excepto el botón)
    contenedor.querySelectorAll(".aside-item").forEach(item => {
      item.addEventListener("click", e => {
        if (e.target.closest("button")) return;
        document.querySelector('.nav-btn[data-vista="tareas"]')?.click();
      });
    });
  });
}

/* ── ARCHIVOS en aside ── */
export function renderAsideArchivos(archivos) {
  const contenedor = document.getElementById("listaArchivosAside");
  if (!contenedor) return;

  const badge = document.getElementById("badgeArchivos");
  if (badge) badge.textContent = archivos.length > 0 ? archivos.length : "";

  if (!archivos.length) {
    contenedor.innerHTML = `<p class="sin-datos">Sin archivos recientes.</p>`;
    return;
  }

  function iconoArchivo(mime) {
    if (!mime) return "fa-file-lines";
    if (mime.includes("pdf"))   return "fa-file-pdf";
    if (mime.includes("image")) return "fa-file-image";
    if (mime.includes("video")) return "fa-file-video";
    if (mime.includes("audio")) return "fa-file-audio";
    if (mime.includes("word") || mime.includes("document"))    return "fa-file-word";
    if (mime.includes("sheet") || mime.includes("excel"))      return "fa-file-excel";
    if (mime.includes("presentation") || mime.includes("powerpoint")) return "fa-file-powerpoint";
    if (mime.includes("zip") || mime.includes("rar") || mime.includes("compress")) return "fa-file-zipper";
    return "fa-file-lines";
  }

  contenedor.innerHTML = archivos.slice(0, 3).map(f => {
    const nombre   = f.nombre_archivo || f.titulo || "Archivo";
    const url      = f.url || f.archivo_url || "";
    const mime     = f.tipo_mime || f.mime || "";
    const cursoN   = f.cursos?.nombre || f.curso_nombre || "";
    const moduloN  = f.modulo_nombre || "";
    const fecha    = f.fecha_subida  || f.creado_at || "";

    return `
    <div class="aside-item" data-tipo="archivo" data-id="${f.id}" tabindex="0" role="button">
      <div class="aside-item-header">
        <div class="aside-item-icono tipo-archivo">
          <i class="fa-solid ${iconoArchivo(mime)}"></i>
        </div>
        <span class="aside-item-titulo">${nombre}</span>
      </div>
      <div class="aside-item-meta">
        ${breadcrumbHtml(cursoN, moduloN)}
        <div class="aside-item-footer" style="padding-left:0;margin-top:0.2rem;">
          <span class="aside-item-fecha">${fechaRelativa(fecha)}</span>
          ${url ? `<a href="${url}" target="_blank" rel="noopener"
              style="font-size:0.68rem;color:var(--lila);font-weight:800;text-decoration:none;margin-left:auto;"
              onclick="event.stopPropagation()">
            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.62rem;"></i> Abrir
          </a>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");

  contenedor.querySelectorAll(".aside-item").forEach(item => {
    const ir = () => document.querySelector('.nav-btn[data-vista="archivos"]')?.click();
    item.addEventListener("click", ir);
    item.addEventListener("keydown", e => { if (e.key === "Enter") ir(); });
  });
}

// ══ VISTAS COMPLETAS (anuncios / tareas / archivos) ═══════════════════════════
export function renderAnunciosVista(anuncios) {
  const el = document.getElementById("listaAnunciosVista");
  if (!el) return;
  el.innerHTML = anuncios.length
    ? anuncios.map(a => `
      <div class="item-anuncio">
        <div class="anuncio-meta">
          <span class="curso-tag">${a.cursos?.nombre || ""}</span>
          ${a.modulos?.nombre ? `<span class="curso-tag" style="background:#fff0f8;color:var(--rosa);">${a.modulos.nombre}</span>` : ""}
          <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
        </div>
        <strong>${a.titulo}</strong>
        <p>${a.contenido}</p>
      </div>`).join("")
    : `<p class="sin-datos">Sin anuncios en tus cursos.</p>`;
}
export function renderTareasVista(tareas) {
  const el = document.getElementById("listaTareasVista");
  if (!el) return;
  if (!tareas.length) { el.innerHTML = `<p class="sin-datos">Sin tareas.</p>`; return; }

  // Primero cargamos qué tareas ya entregó este estudiante
  cargarEntregasEstudiante().then(entregadas => {
    el.innerHTML = tareas.map(t => {
      const yaEntrego   = entregadas.has(t.id);
      const vence       = t.fecha_entrega ? `<span class="vence-tag ${urgencia(t.fecha_entrega)}">Vence: ${formatFecha(t.fecha_entrega)}</span>` : "";
      const modTag      = t.modulo_nombre ? `<span class="curso-tag" style="background:#fff0f8;color:var(--rosa);">${t.modulo_nombre}</span>` : "";

      const notaTarea = window.__mapaNotasEst?.[t.id];
const tieneNota = notaTarea !== null && notaTarea !== undefined;

const btnEntrega  = yaEntrego
  ? `<button onclick="verDetalleEntrega('${t.id}')"
       style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:800;
         color:${tieneNota ? "var(--lila)" : "var(--color-ok,#1aaa6b)"};
         background:${tieneNota ? "#f0ecff" : "#effaf5"};
         border:1.3px solid ${tieneNota ? "#d4c4fb" : "#a3e6c8"};
         border-radius:50px;padding:0.3rem 0.9rem;margin-left:auto;cursor:pointer;
         font-family:'Nunito',sans-serif;">
       <i class="fa-solid ${tieneNota ? "fa-star" : "fa-circle-check"}"></i>
       ${tieneNota ? `Nota: ${notaTarea}${t.puntos ? `/${t.puntos}` : ""}` : "Entregado"}
     </button>`
  : `<button class="btn-primario btn-pequeno" style="margin-left:auto;"
     onclick="abrirModalEntrega('${t.id}','${(t.titulo||'').replace(/'/g,"\\'")}','${t.fecha_entrega||''}')">
     <i class="fa-solid fa-paper-plane"></i> Entregar
   </button>`;

      return `
      <div class="item-tarea">
        <div class="anuncio-meta">
          <span class="curso-tag">${t.cursos?.nombre || ""}</span>
          ${modTag}
          ${vence}
        </div>
        <strong>${t.titulo}</strong>
        <p>${t.descripcion || t.contenido || ""}</p>
        <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-top:.5rem;">
          ${t.puntos ? `<span style="font-size:0.8rem;color:#8b5cf6;font-weight:700;">${t.puntos} pts</span>` : ""}
          ${t.url ? `<a href="${t.url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
          ${t.archivo_url ? `<a href="${t.archivo_url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-file-arrow-down"></i> Archivo adjunto</a>` : ""}
          ${btnEntrega}
        </div>
      </div>`;
    }).join("");
  });
}
export function renderArchivosVista(archivos) {
  const el = document.getElementById("listaArchivosVista");
  if (!el) return;
  el.innerHTML = archivos.length
    ? archivos.map(a => `
      <div class="item-archivo">
        <div class="anuncio-meta">
          <span class="curso-tag">${a.cursos?.nombre || ""}</span>
          ${a.modulo_nombre ? `<span class="curso-tag" style="background:#fff0f8;color:var(--rosa);">${a.modulo_nombre}</span>` : ""}
          <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
        </div>
        <a href="${a.url || a.archivo_url || ""}" target="_blank">
          <i class="fa-solid fa-file"></i> ${a.nombre_archivo || a.titulo || "Archivo"}
        </a>
      </div>`).join("")
    : `<p class="sin-datos">Sin archivos.</p>`;
}

// ══ ITEMS DE MÓDULOS (tareas y archivos con módulo y curso) ═══════════════════
export async function cargarItemsModulosPorCursos(cursoIds) {
  if (!cursoIds || cursoIds.length === 0) return { tareas: [], archivos: [] };

  try {
    const { data: modulos, error: errM } = await supabase
      .from("modulos")
      .select("id, titulo, curso_id, cursos(nombre)")
      .in("curso_id", cursoIds);

    if (errM) throw errM;

    const moduloIds = (modulos || []).map(m => m.id);
    if (moduloIds.length === 0) return { tareas: [], archivos: [] };

    // Mapa moduloId → { cursos, modulo_nombre }
    const mapaModulo = {};
    (modulos || []).forEach(m => {
      mapaModulo[m.id] = { cursos: m.cursos, modulo_nombre: m.titulo };
    });

    const { data: items, error: errI } = await supabase
      .from("modulo_items")
      .select("*")
      .in("modulo_id", moduloIds)
      .in("tipo", ["tarea", "archivo"]);

    if (errI) throw errI;

    const tareas = (items || [])
      .filter(it => it.tipo === "tarea")
      .map(it => ({
        ...it,
        descripcion:   it.contenido,
        cursos:        mapaModulo[it.modulo_id]?.cursos || {},
        modulo_nombre: mapaModulo[it.modulo_id]?.modulo_nombre || null,
      }))
      .sort((a, b) => {
        if (!a.fecha_entrega) return 1;
        if (!b.fecha_entrega) return -1;
        return new Date(a.fecha_entrega) - new Date(b.fecha_entrega);
      });

    const archivos = (items || [])
      .filter(it => it.tipo === "archivo")
      .map(it => ({
        ...it,
        nombre_archivo: it.titulo,
        url:            it.archivo_url || it.url,
        cursos:         mapaModulo[it.modulo_id]?.cursos || {},
        modulo_nombre:  mapaModulo[it.modulo_id]?.modulo_nombre || null,
      }))
      .sort((a, b) => new Date(b.creado_at) - new Date(a.creado_at))
      .slice(0, 10);

    return { tareas, archivos };
  } catch (e) {
    console.error("Error cargando items de módulos:", e);
    return { tareas: [], archivos: [] };
  }
}
export function actualizarBadges(cursos, anuncios, archivos, tareas) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
  set("badgeMisCursos", cursos.length  || "");
  // Los badges de anuncios/tareas/archivos se setean dentro de sus render functions
}

// ══ TOGGLE BLOQUE "UNIRSE CON CÓDIGO" (en vista Disponibles) ═════════════════
