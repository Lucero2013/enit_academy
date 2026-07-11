
import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", cargarCursosPublicos);

async function cargarCursosPublicos() {
  const grid = document.getElementById("gridCursosPublicos");
  if (!grid) return;

  const { data: cursos, error } = await supabase
    .from("cursos")
    .select(`
      id, nombre, descripcion, nivel, codigo, imagen_url, creado_at,
      perfiles:docente_id ( nombre, apellido )
    `)
    .eq("es_publico", true)
    .order("creado_at", { ascending: false });

  if (error || !cursos || cursos.length === 0) {
    grid.innerHTML = `<p class="sin-cursos-pub">No hay cursos públicos disponibles aún.</p>`;
    return;
  }

  // ── Si hay sesión, traer en qué cursos ya está inscrito el usuario ───────
  let inscritosSet = new Set();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data: inscripciones } = await supabase
      .from("inscripciones")
      .select("curso_id")
      .eq("estudiante_id", session.user.id);

    if (inscripciones) {
      inscritosSet = new Set(inscripciones.map(i => i.curso_id));
    }
  }

  // Wrap each card in Bootstrap col
  grid.innerHTML = "<div class=\"row g-3 w-100\">" + cursos.map(c => {
    const wrapper_start = '<div class="col-sm-6 col-lg-4">';
    const wrapper_end   = '</div>';
    const docente = c.perfiles
      ? `${c.perfiles.nombre} ${c.perfiles.apellido}`
      : "Docente ENIT";
    const yaInscrito = inscritosSet.has(c.id);

    const accionFooter = yaInscrito
      ? `<span class="badge-inscrito"><i class="fa-solid fa-circle-check"></i> Ya estás inscrito</span>`
      : `<button
            class="btn-inscribirse"
            onclick="abrirModalInscripcion('${c.id}', '${c.nombre.replace(/'/g,"\\'")}')">
            Inscribirme
          </button>`;

    const claseTarjeta = yaInscrito ? "tarjeta-pub tarjeta-pub--inscrito" : "tarjeta-pub";
    const clickTarjeta = yaInscrito
      ? `onclick="window.location.href='/paginas/panel_estudiante.html?curso=${c.id}'"`
      : "";

    const card = `
      <div class="${claseTarjeta}" ${clickTarjeta}>
        ${c.imagen_url
          ? `<img src="${c.imagen_url}" class="tarjeta-pub-img" alt="${c.nombre}">`
          : `<div class="tarjeta-pub-img-placeholder"><i class="fa-solid fa-book-open"></i></div>`}
        <div class="tarjeta-pub-top">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel.toUpperCase()}</span>` : ""}
          <span class="badge-visibilidad publico" style="margin-left:auto;">
            <i class="fa-solid fa-globe"></i> Público
          </span>
        </div>
        <h3 class="tarjeta-pub-titulo">${c.nombre}</h3>
        <p class="tarjeta-pub-desc">${c.descripcion || "Sin descripción."}</p>
        <div class="tarjeta-pub-footer">
          <span class="pub-docente"><i class="fa-solid fa-chalkboard-teacher"></i> ${docente}</span>
          ${accionFooter}
        </div>
      </div>`;
      return wrapper_start + card + wrapper_end;
  }).join("") + "</div>";
}

/* ── Modal de inscripción ─────────────────────────────────────────────────── */
window.abrirModalInscripcion = async function(cursoId, nombreCurso) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // No hay sesión: guardar pendiente y abrir login
    sessionStorage.setItem("inscribir_pendiente", cursoId);
    sessionStorage.setItem("inscribir_nombre",    nombreCurso);
    const modal = document.getElementById("modalLogin");
    if (modal) {
      modal.style.display = "flex";
    } else {
      setTimeout(() => window.abrirModalInscripcion(cursoId, nombreCurso), 400);
    }
    return;
  }

  // ── Verificar si el usuario es docente ────────────────────────────────────
  const userId = session.user.id;
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .single();

  if (perfil?.rol === "docente") {
    // El docente solo ve el curso, NO se inscribe
    mostrarToast("Como docente puedes explorar los cursos libremente. Para inscribirse usa una cuenta de estudiante.", "info");
    return;
  }

  // ── Verificar si ya está inscrito ─────────────────────────────────────────
  const { data: yaInscrito } = await supabase
    .from("inscripciones")
    .select("id")
    .eq("curso_id", cursoId)
    .eq("estudiante_id", userId)
    .maybeSingle();

  if (yaInscrito) {
    mostrarToast("Ya estás inscrito en este curso.", "info");
    return;
  }

  // ── Inscribir al estudiante ────────────────────────────────────────────────
  const { error } = await supabase.from("inscripciones").insert({
    curso_id:      cursoId,
    estudiante_id: userId,
  });

  if (error) {
    mostrarToast("Error al inscribirse. Inténtalo de nuevo.", "error");
    return;
  }

  mostrarToast(`¡Inscrito en "${nombreCurso}" exitosamente! 🎉`, "ok");
  setTimeout(() => { window.location.href = `/paginas/panel_estudiante.html?curso=${cursoId}`; }, 1500);
};

/* ── Retomar inscripción pendiente tras login ─────────────────────────────── */
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event !== "SIGNED_IN" || !session) return;

  const cursoId     = sessionStorage.getItem("inscribir_pendiente");
  const nombreCurso = sessionStorage.getItem("inscribir_nombre");
  if (!cursoId) return;

  sessionStorage.removeItem("inscribir_pendiente");
  sessionStorage.removeItem("inscribir_nombre");

  const modal = document.getElementById("modalLogin");
  if (modal) modal.style.display = "none";

  await window.abrirModalInscripcion(cursoId, nombreCurso);
});

/* ── Toast liviano ────────────────────────────────────────────────────────── */
function mostrarToast(msg, tipo = "ok") {
  let toast = document.getElementById("enit-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "enit-toast";
    document.body.appendChild(toast);
  }
  toast.className = `enit-toast toast-${tipo} toast-visible`;
  toast.innerHTML = `<i class="fa-solid ${
    tipo === "ok"    ? "fa-circle-check" :
    tipo === "error" ? "fa-circle-exclamation" :
    "fa-circle-info"
  }"></i> ${msg}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("toast-visible"), 3500);
}