import { supabase } from "../supabase.js";
import { estado } from "./estado_estudiante.js";
import { cargarDatos } from "./inicio_estudiante.js";
import { mostrarToast } from "./utilidades_estudiante.js";

export function llenarFiltros(cursos) {
  ["filtroAnuncios","filtroArchivos","filtroTareas"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    cursos.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  });
}

// ══ CURSOS DISPONIBLES ════════════════════════════════════════════════════════
let cursosDisponiblesData = [];
export async function renderMiniCursosDisponibles() {
  const el    = document.getElementById("miniListaCursos");
  const badge = document.getElementById("badgeDisponibles");

  const { data: cursos, error } = await supabase
    .from("cursos")
    .select("id, nombre, descripcion, nivel, imagen_url, perfiles(nombre, apellido)")
    .eq("es_publico", true)
    .order("creado_at", { ascending: false });

  if (!el) return;

  if (error) {
    console.error("Error cargando cursos disponibles:", error);
    el.innerHTML = `<p class="sin-datos">No se pudieron cargar los cursos disponibles.</p>`;
    return;
  }

  cursosDisponiblesData = cursos || [];
  const idsInscritos = new Set(estado.cursosInscritos.map(c => c.id));

  if (cursosDisponiblesData.length === 0) {
    el.innerHTML = `<p class="sin-datos">No hay cursos públicos disponibles por ahora.</p>`;
    if (badge) badge.textContent = "";
    return;
  }

  if (badge) {
    const noInscritos = cursosDisponiblesData.filter(c => !idsInscritos.has(c.id)).length;
    badge.textContent = noInscritos > 0 ? noInscritos : "";
  }

  el.innerHTML = cursosDisponiblesData.map(c => {
    const yaInscrito = idsInscritos.has(c.id);
    const imgHtml = c.imagen_url
      ? `<img src="${c.imagen_url}" class="curso-img-portada" alt="${c.nombre}">`
      : `<div class="curso-img-placeholder"><i class="fa-solid fa-book-open"></i></div>`;

    return `
    <div class="tarjeta-curso" data-curso-id="${c.id}">
      <div class="curso-img-wrap">${imgHtml}</div>
      <div class="tarjeta-curso-header">
        <div class="curso-badges">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
          ${yaInscrito ? `<span class="badge-visibilidad publico"><i class="fa-solid fa-circle-check"></i> Inscrita</span>` : ""}
        </div>
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
      <div class="tarjeta-curso-footer" style="position:static; padding:0 1.3rem 1.1rem; width:100%; display:flex; flex-direction:column; gap:0.6rem; align-items:stretch;">
        <span style="font-size:0.78rem; color:var(--texto-claro); font-weight:600;">
          <i class="fa-solid fa-chalkboard-teacher"></i> ${c.perfiles?.nombre || ""} ${c.perfiles?.apellido || ""}
        </span>
        ${yaInscrito
          ? `<button class="btn-secundario" onclick="irACursoDisponible('${c.id}')"
               style="width:100%;justify-content:center;align-items:center;gap:0.5rem;border-color:var(--color-ok);color:var(--color-ok);">
               <i class="fa-solid fa-circle-check"></i> Ya estás inscrita — Ver curso
             </button>`
          : `<button class="btn-primario btn-pequeno" onclick="inscribirseACursoDisponible('${c.id}')"
               id="btn-inscribir-${c.id}" style="width:100%;">
               <i class="fa-solid fa-plus"></i> Inscribirme
             </button>`
        }
      </div>
    </div>`;
  }).join("");
}
window.inscribirseACursoDisponible = async function(cursoId) {
  const btn = document.getElementById(`btn-inscribir-${cursoId}`);
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Inscribiendo...`; }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: yaInscrito } = await supabase
    .from("inscripciones").select("id")
    .eq("curso_id", cursoId).eq("estudiante_id", user.id).single();

  if (yaInscrito) {
    await cargarDatos();
    window.abrirDetalleCursoEst(cursoId);
    return;
  }

  const { error } = await supabase
    .from("inscripciones").insert({ curso_id: cursoId, estudiante_id: user.id });

  if (error) {
    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-plus"></i> Inscribirme`; }
    mostrarToast(`No se pudo inscribir: ${error.message || "intenta de nuevo."}`, "error");
    return;
  }

  mostrarToast("¡Te inscribiste correctamente! 🎉", "ok");
  await cargarDatos();
  window.abrirDetalleCursoEst(cursoId);
};
window.irACursoDisponible = function(cursoId) {
  window.abrirDetalleCursoEst(cursoId);
};

// ══ BADGES ════════════════════════════════════════════════════════════════════
