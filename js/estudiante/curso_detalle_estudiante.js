import { supabase } from "../supabase.js";
import { estado } from "./estado_estudiante.js";
import { cargarEntregasEstudiante } from "./entregas_estudiante.js";
import { formatFecha, urgencia } from "./utilidades_estudiante.js";

window.abrirDetalleCursoEst = async function(cursoId) {
  const curso = estado.cursosInscritos.find(c => c.id === cursoId);
  if (!curso) return;

  document.getElementById("cursoTituloEst").textContent  = curso.nombre;
  document.getElementById("cursoDescEst").textContent    = curso.descripcion || "Sin descripción.";
  document.getElementById("cursoDocenteEst").textContent = `${curso.perfiles?.nombre || ""} ${curso.perfiles?.apellido || ""}`;

  const nivelEl = document.getElementById("cursoNivelEst");
  if (nivelEl) { nivelEl.textContent = curso.nivel || "Sin nivel"; nivelEl.className = `etiqueta-nivel ${curso.nivel || ""}`; }

  const fondo = document.getElementById("cursoHeroFondoEst");
  if (fondo) {
    fondo.style.backgroundImage = curso.imagen_url
      ? `url('${curso.imagen_url}')`
      : "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)";
  }

  document.querySelectorAll("#vista-detalle .pestana-btn").forEach(b => b.classList.remove("activa"));
  document.querySelector("#vista-detalle .pestana-btn[data-pestana='modulos']")?.classList.add("activa");
  document.querySelectorAll("#vista-detalle .pestana-panel").forEach(p => p.classList.add("oculto"));
  document.getElementById("detalleModulosEst")?.classList.remove("oculto");

  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  document.getElementById("vista-detalle")?.classList.remove("oculto");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));

  initPestanasDetalleEst();
  moduloExpandidoIdEst = null;
  await cargarModulosCursoEst(cursoId);
  await cargarAnunciosCursoEst(cursoId);
};
function initPestanasDetalleEst() {
  document.querySelectorAll("#vista-detalle .pestana-btn").forEach(btn => {
    const nuevo = btn.cloneNode(true);
    btn.replaceWith(nuevo);
  });
  document.querySelectorAll("#vista-detalle .pestana-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#vista-detalle .pestana-btn").forEach(b => b.classList.remove("activa"));
      document.querySelectorAll("#vista-detalle .pestana-panel").forEach(p => p.classList.add("oculto"));
      btn.classList.add("activa");
      document.querySelector(`#vista-detalle .pestana-panel[data-panel="${btn.dataset.pestana}"]`)?.classList.remove("oculto");
    });
  });
}
export function initVolverDetalleCurso() {
  document.getElementById("btnVolverCursosEst")?.addEventListener("click", () => {
    document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
    document.getElementById("vista-cursos")?.classList.remove("oculto");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
    document.querySelector(".nav-btn[data-vista='cursos']")?.classList.add("activo");
  });
}

// ══ MÓDULOS DEL CURSO (solo lectura) ══════════════════════════════════════════
let modulosActivoEst     = [];
let moduloExpandidoIdEst = null;
let cursoIdAbiertoEst    = null;
async function cargarModulosCursoEst(cursoId) {
  cursoIdAbiertoEst = cursoId;
  const cont = document.getElementById("detalleModulosEst");
  if (!cont) return;

  try {
    const { data: modulos, error: errM } = await supabase
      .from("modulos").select("*")
      .eq("curso_id", cursoId).order("orden", { ascending: true });

    if (errM) throw errM;

    modulosActivoEst = modulos || [];
    const moduloIds = modulosActivoEst.map(m => m.id);
    let itemsPorModulo = {};

    if (moduloIds.length) {
      const { data: items, error: errI } = await supabase
        .from("modulo_items").select("*")
        .in("modulo_id", moduloIds).order("creado_at", { ascending: true });
      if (errI) throw errI;
      (items || []).forEach(it => {
        if (!itemsPorModulo[it.modulo_id]) itemsPorModulo[it.modulo_id] = [];
        itemsPorModulo[it.modulo_id].push(it);
      });
    }

    modulosActivoEst = modulosActivoEst.map(m => ({ ...m, items: itemsPorModulo[m.id] || [] }));
    renderModulosEst();
  } catch (e) {
    console.error("Error cargando módulos del curso:", e);
    cont.innerHTML = `<p class="sin-datos">No se pudieron cargar los módulos. Intenta de nuevo.</p>`;
  }
}
function renderModulosEst() {
  const cont = document.getElementById("detalleModulosEst");
  if (!cont) return;

  if (!modulosActivoEst.length) {
    cont.innerHTML = `<p class="sin-datos">El docente todavía no agregó módulos a este curso.</p>`;
    return;
  }

  cont.innerHTML = modulosActivoEst.map((m, idx) => {
    const expandido = m.id === moduloExpandidoIdEst;
    return `
    <div class="modulo-tarjeta ${expandido ? "expandido" : ""}" data-modulo-id="${m.id}">
      <div class="modulo-cabecera" onclick="toggleModuloEst('${m.id}')">
        <div class="modulo-numero">${idx + 1}</div>
        <div class="modulo-info">
          <h3>${m.titulo}</h3>
          ${m.descripcion ? `<p>${m.descripcion}</p>` : ""}
        </div>
        <div class="modulo-meta">
          <span class="modulo-conteo">${m.items.length} ${m.items.length === 1 ? "elemento" : "elementos"}</span>
        </div>
        <i class="fa-solid fa-chevron-down modulo-chevron"></i>
      </div>
      <div class="modulo-cuerpo ${expandido ? "" : "oculto"}">
        ${renderItemsModuloEst(m)}
      </div>
    </div>`;
  }).join("");

  // Inyectar botones de entrega según estado real
  inyectarBotonesEntrega();
}
export async function inyectarBotonesEntrega() {
  const entregadas = await cargarEntregasEstudiante();

  // Cargamos el detalle completo de las entregas para mostrarlas
  const { data: { user } } = await supabase.auth.getUser();
  const { data: detalleEntregas } = await supabase
    .from("entregas")
    .select("tarea_id, url_archivo, comentario, entregado_at")
    .eq("estudiante_id", user.id);

  const mapaEntregas = {};
  (detalleEntregas || []).forEach(e => { mapaEntregas[e.tarea_id] = e; });

  modulosActivoEst.forEach(m => {
    m.items.filter(it => it.tipo === "tarea").forEach(it => {
      const slot = document.getElementById(`btn-entrega-${it.id}`);
      if (!slot) return;

      if (entregadas.has(it.id)) {
        const e = mapaEntregas[it.id];
        slot.innerHTML = `
          <button onclick="verDetalleEntrega('${it.id}')"
            style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.78rem;
              font-weight:800;color:var(--color-ok,#1aaa6b);background:#effaf5;
              border:1.3px solid #a3e6c8;border-radius:50px;padding:0.28rem 0.75rem;
              cursor:pointer;font-family:'Nunito',sans-serif;transition:background 0.15s;">
            <i class="fa-solid fa-circle-check"></i> Entregado
          </button>`;
      } else {
        slot.innerHTML = `
          <button class="btn-primario btn-pequeno"
            onclick="abrirModalEntrega('${it.id}','${(it.titulo||'').replace(/'/g,"\\'")}','${it.fecha_entrega||''}')">
            <i class="fa-solid fa-paper-plane"></i> Entregar
          </button>`;
      }
    });
  });
}
function renderItemsModuloEst(modulo) {
  if (!modulo.items.length) {
    return `<div class="modulo-sin-contenido">Este módulo todavía no tiene contenido.</div>`;
  }

  return modulo.items.map(it => {
    if (it.tipo === "texto") {
      return `
      <div class="modulo-item">
        <div class="modulo-item-icono icono-texto"><i class="fa-solid fa-align-left"></i></div>
        <div class="modulo-item-cuerpo">
          <strong>${it.titulo || "Texto"}</strong>
          <p>${it.contenido || ""}</p>
        </div>
      </div>`;
    }

    if (it.tipo === "archivo") {
      const tieneUrl     = !!it.url;
      const tieneArchivo = !!it.archivo_url;
      return `
      <div class="modulo-item">
        <div class="modulo-item-icono icono-archivo"><i class="fa-solid ${tieneArchivo ? "fa-file-arrow-down" : "fa-link"}"></i></div>
        <div class="modulo-item-cuerpo">
          <strong>${it.titulo}</strong>
          <div class="modulo-item-enlaces">
            ${tieneUrl     ? `<a href="${it.url}" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
            ${tieneArchivo ? `<a href="${it.archivo_url}" target="_blank" rel="noopener"><i class="fa-solid fa-file-arrow-down"></i> Archivo</a>` : ""}
          </div>
        </div>
      </div>`;
    }

    // tarea — se renderiza con placeholder, luego se actualiza con estado de entrega
    const venceTxt = it.fecha_entrega
      ? `<span class="vence-tag ${urgencia(it.fecha_entrega)}">Vence: ${formatFecha(it.fecha_entrega)}</span>`
      : "";

    return `
    <div class="modulo-item" id="modulo-item-${it.id}">
      <div class="modulo-item-icono icono-tarea"><i class="fa-solid fa-clipboard-list"></i></div>
      <div class="modulo-item-cuerpo">
        <strong>${it.titulo}${it.puntos ? ` <span style="color:#8b5cf6;font-weight:700;font-size:.78rem;">· ${it.puntos} pts</span>` : ""}</strong>
        <p>${it.contenido || ""}</p>
        <div style="display:flex;gap:.6rem;align-items:center;margin-top:.4rem;flex-wrap:wrap;">
          ${venceTxt}
          ${it.url        ? `<a href="${it.url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
          ${it.archivo_url ? `<a href="${it.archivo_url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-file-arrow-down"></i> Archivo adjunto</a>` : ""}
          <span id="btn-entrega-${it.id}" style="margin-left:auto;">
            <i class="fa-solid fa-spinner fa-spin" style="color:var(--texto-claro);font-size:0.8rem;"></i>
          </span>
        </div>
      </div>
    </div>`;
  }).join("");
}
window.toggleModuloEst = function(moduloId) {
  moduloExpandidoIdEst = moduloExpandidoIdEst === moduloId ? null : moduloId;
  renderModulosEst();
};

// ══ ANUNCIOS DEL CURSO ABIERTO ════════════════════════════════════════════════
async function cargarAnunciosCursoEst(cursoId) {
  const elA = document.getElementById("detalleAnunciosEst");
  if (!elA) return;

  try {
    const { data: anuncios, error } = await supabase
      .from("anuncios").select("*")
      .eq("curso_id", cursoId).order("creado_at", { ascending: false });

    if (error) throw error;

    elA.innerHTML = anuncios?.length
      ? anuncios.map(a => `
          <div class="item-anuncio">
            <strong>${a.titulo}</strong>
            <p>${a.contenido}</p>
            <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
          </div>`).join("")
      : `<p class="sin-datos">Sin anuncios.</p>`;
  } catch (e) {
    console.error("Error cargando anuncios del curso:", e);
    elA.innerHTML = `<p class="sin-datos">No se pudieron cargar. Intenta de nuevo.</p>`;
  }
}

// ══ RENDER CURSOS LISTA ═══════════════════════════════════════════════════════
