import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";
import { formatFecha, mostrarAlerta, mostrarToast, setErr } from "./utilidades_docente.js";

export async function cargarEntregasCurso(cursoId) {
  const el = document.getElementById("listaEntregasCurso");
  if (!el) return;
  el.innerHTML = `<p class="sin-datos"><i class="fa-solid fa-spinner fa-spin"></i> Cargando entregas...</p>`;

  const { data: modulos } = await supabase
    .from("modulos").select("id, titulo")
    .eq("curso_id", cursoId).order("orden", { ascending: true });

  if (!modulos?.length) { el.innerHTML = `<p class="sin-datos">Este curso no tiene módulos.</p>`; return; }

  const moduloIds = modulos.map(m => m.id);
  const { data: tareas } = await supabase
    .from("modulo_items").select("id, titulo, puntos, fecha_entrega, modulo_id")
    .in("modulo_id", moduloIds).eq("tipo", "tarea");

  if (!tareas?.length) { el.innerHTML = `<p class="sin-datos">No hay tareas en este curso.</p>`; return; }

  const tareaIds = tareas.map(t => t.id);

const { data: entregas, error: errE } = await supabase
  .from("entregas").select("id, tarea_id, estudiante_id, url_archivo, comentario, entregado_at, visto, nota, feedback")
  .in("tarea_id", tareaIds)
  .order("entregado_at", { ascending: false });

  if (errE) { el.innerHTML = `<p class="sin-datos">Error al cargar entregas: ${errE.message}</p>`; return; }

  // Cargar perfiles de estudiantes por separado
  const estudianteIds = [...new Set((entregas || []).map(e => e.estudiante_id))];
  const mapaPerfiles = {};
  if (estudianteIds.length) {
    const { data: perfiles } = await supabase
      .from("perfiles").select("id, nombre, apellido")
      .in("id", estudianteIds);
    (perfiles || []).forEach(p => { mapaPerfiles[p.id] = p; });
  }

  // Agrupar módulo → tarea → entregas
  const mapaModulo = {};
  modulos.forEach(m => { mapaModulo[m.id] = { ...m, tareas: [] }; });
  tareas.forEach(t => {
    if (mapaModulo[t.modulo_id]) {
      mapaModulo[t.modulo_id].tareas.push({
        ...t,
        entregas: (entregas || [])
          .filter(e => e.tarea_id === t.id)
          .map(e => ({ ...e, perfiles: mapaPerfiles[e.estudiante_id] || null })),
      });
    }
  });

  el.innerHTML = Object.values(mapaModulo).map(modulo => {
    if (!modulo.tareas.length) return "";

    const tareasHtml = modulo.tareas.map(tarea => {
      const totalEntregas = tarea.entregas.length;
      const sinVer = tarea.entregas.filter(e => !e.visto).length;

      const entregasHtml = tarea.entregas.length
  ? tarea.entregas.map(e => {
      const nombre = `${e.perfiles?.nombre || "?"} ${e.perfiles?.apellido || ""}`.trim();
      const fecha  = formatFecha(e.entregado_at);
      const comentarioEscapado = (e.comentario || "").replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/'/g,"\\'");
      const feedbackEscapado   = (e.feedback || "").replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/'/g,"\\'");
      const nombreEscapado     = nombre.replace(/'/g,"\\'");
      const yaCalificada       = e.nota !== null && e.nota !== undefined;

      return `
      <div class="entrega-fila ${!e.visto ? "entrega-nueva" : ""}" data-entrega-id="${e.id}">
        <div class="entrega-fila-izq">
          <div class="avatar-mini"><i class="fa-solid fa-user-graduate"></i></div>
          <div class="entrega-fila-info">
            <strong>${nombre}</strong>
            <span class="entrega-fila-fecha">
              <i class="fa-regular fa-clock"></i> ${fecha}
              ${!e.visto ? `<span class="badge-nueva">Nuevo</span>` : ""}
            </span>
          </div>
        </div>
        <div class="entrega-fila-der">
          ${yaCalificada
  ? `<span style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.78rem;font-weight:800;color:var(--lila);
       background:#f0ecff;border:1.3px solid #d4c4fb;border-radius:20px;
       padding:0.25rem 0.7rem;">
       <i class="fa-solid fa-circle-check"></i> Calificado · ${e.nota}${tarea.puntos ? `/${tarea.puntos}` : ""}
     </span>`
  : `<span style="font-size:0.75rem;font-weight:700;padding:0.25rem 0.6rem;border-radius:20px;
       background:#fff4e0;color:#b8860b;">Sin calificar</span>`}
${e.url_archivo
  ? `<a href="${e.url_archivo}" target="_blank" rel="noopener"
       class="btn-entrega-archivo" onclick="marcarVisto('${e.id}')">
       <i class="fa-solid fa-file-arrow-down"></i> Ver archivo
     </a>`
  : ""}
${e.comentario
  ? `<button class="btn-icono" title="Ver comentario"
       onclick="verComentarioEntrega('${e.id}','${comentarioEscapado}','${nombreEscapado}')">
       <i class="fa-solid fa-comment-dots"></i>
     </button>`
  : ""}
${yaCalificada
  ? `<button class="btn-icono" title="Editar calificación"
       onclick="abrirModalCalificar('${e.id}','${nombreEscapado}','${fecha}','${e.url_archivo || ""}','${comentarioEscapado}',${e.nota},'${feedbackEscapado}',${tarea.puntos || "null"})">
       <i class="fa-solid fa-pen"></i>
     </button>`
  : `<button class="btn-primario btn-pequeno" title="Calificar"
       onclick="abrirModalCalificar('${e.id}','${nombreEscapado}','${fecha}','${e.url_archivo || ""}','${comentarioEscapado}',null,'${feedbackEscapado}',${tarea.puntos || "null"})">
       <i class="fa-solid fa-star"></i> Calificar
     </button>`}
        </div>
      </div>`;
    }).join("")
  : `<p class="sin-datos" style="padding:0.7rem 1rem;">Nadie ha entregado esta tarea aún.</p>`;

      return `
      <div class="entrega-tarea-bloque">
        <div class="entrega-tarea-cab">
          <div style="display:flex;align-items:center;gap:0.6rem;flex:1;min-width:0;">
            <div class="modulo-item-icono icono-tarea" style="flex-shrink:0;">
              <i class="fa-solid fa-clipboard-list"></i>
            </div>
            <div style="min-width:0;">
              <strong style="font-size:0.95rem;color:var(--texto);display:block;">${tarea.titulo}</strong>
              <span style="font-size:0.75rem;color:var(--texto-claro);font-weight:600;">
                ${tarea.puntos ? `${tarea.puntos} pts · ` : ""}
                ${tarea.fecha_entrega ? `Vence: ${formatFecha(tarea.fecha_entrega)}` : "Sin fecha límite"}
              </span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
            <span class="modulo-conteo">${totalEntregas} ${totalEntregas === 1 ? "entrega" : "entregas"}</span>
            ${sinVer > 0 ? `<span class="badge-nueva">${sinVer} nuevo${sinVer > 1 ? "s" : ""}</span>` : ""}
          </div>
        </div>
        <div class="entrega-tarea-lista">${entregasHtml}</div>
      </div>`;
    }).join("");

    return `
    <div class="entrega-modulo-bloque">
      <div class="entrega-modulo-titulo">
        <i class="fa-solid fa-layer-group"></i> ${modulo.titulo}
      </div>
      ${tareasHtml}
    </div>`;
  }).join("");

  // Marcar como vistos
  const noVistos = (entregas || []).filter(e => !e.visto).map(e => e.id);
  if (noVistos.length) {
    await supabase.from("entregas").update({ visto: true }).in("id", noVistos);
  }
}
window.marcarVisto = async function(entregaId) {
  await supabase.from("entregas").update({ visto: true }).eq("id", entregaId);
  const fila = document.querySelector(`.entrega-fila[data-entrega-id="${entregaId}"]`);
  if (fila) {
    fila.classList.remove("entrega-nueva");
    fila.querySelector(".badge-nueva")?.remove();
  }
};
window.verComentarioEntrega = function(entregaId, comentario, nombreEstudiante) {
  let modal = document.getElementById("modalComentarioEntrega");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalComentarioEntrega";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-caja" style="max-width:420px;">
        <div class="modal-cabecera">
          <h2><i class="fa-solid fa-comment-dots" style="color:var(--rosa);"></i>
            Comentario de <span id="comentarioNombreEst"></span>
          </h2>
          <button class="modal-cerrar"
            onclick="document.getElementById('modalComentarioEntrega').style.display='none';document.body.style.overflow='';">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-cuerpo">
          <div id="comentarioEntregaTexto"
               style="background:var(--fondo);border:1.5px solid var(--borde);
                 border-radius:12px;padding:1rem 1.1rem;font-size:0.9rem;
                 color:var(--texto);line-height:1.65;white-space:pre-wrap;">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secundario"
            onclick="document.getElementById('modalComentarioEntrega').style.display='none';document.body.style.overflow='';">
            Cerrar
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => {
      if (e.target === modal) { modal.style.display = "none"; document.body.style.overflow = ""; }
    });
  }
  document.getElementById("comentarioNombreEst").textContent = nombreEstudiante;
  document.getElementById("comentarioEntregaTexto").textContent = comentario;
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
};

// ══ CALIFICAR ENTREGA ═════════════════════════════════════════════════════════
window.abrirModalCalificar = function (entregaId, nombreEst, fecha, urlArchivo, comentario, notaActual, feedbackActual, puntosMax) {
  estado.entregaCalificandoData = { entregaId };

  document.getElementById("calificarEntregaId").value = entregaId;
  document.getElementById("calificarNombreEst").textContent = nombreEst;
  document.getElementById("calificarFecha").textContent = fecha;

  const archivoWrap = document.getElementById("calificarArchivoWrap");
  const archivoLink = document.getElementById("calificarArchivoLink");
  if (urlArchivo) {
    archivoWrap.style.display = "block";
    archivoLink.href = urlArchivo;
  } else {
    archivoWrap.style.display = "none";
  }

  const comentarioWrap = document.getElementById("calificarComentarioWrap");
  if (comentario) {
    comentarioWrap.style.display = "block";
    document.getElementById("calificarComentarioTexto").textContent = comentario;
  } else {
    comentarioWrap.style.display = "none";
  }

  document.getElementById("calificarNota").value = notaActual ?? "";
  document.getElementById("calificarFeedback").value = feedbackActual || "";
  document.getElementById("calificarPuntosMax").textContent = puntosMax ? `/ ${puntosMax} pts` : "";

  setErr("errCalificarNota", "");
  document.getElementById("alertaCalificar").className = "alerta";

  document.getElementById("modalCalificarOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
};
function cerrarModalCalificar() {
  document.getElementById("modalCalificarOverlay").style.display = "none";
  document.body.style.overflow = "";
  estado.entregaCalificandoData = null;
}
export function initModalCalificar() {
  document.getElementById("btnCerrarCalificar")?.addEventListener("click", cerrarModalCalificar);
  document.getElementById("btnCancelarCalificar")?.addEventListener("click", cerrarModalCalificar);
  document.getElementById("modalCalificarOverlay")?.addEventListener("click", e => {
    if (e.target.id === "modalCalificarOverlay") cerrarModalCalificar();
  });

  document.getElementById("formCalificar")?.addEventListener("submit", async e => {
    e.preventDefault();
    const entregaId = document.getElementById("calificarEntregaId")?.value;
    const notaRaw    = document.getElementById("calificarNota")?.value;
    const feedback   = document.getElementById("calificarFeedback")?.value.trim();
    const alerta     = document.getElementById("alertaCalificar");
    const btn        = e.target.querySelector('[type="submit"]');

    if (notaRaw === "" || isNaN(parseFloat(notaRaw))) {
      setErr("errCalificarNota", "Ingresa una nota válida.");
      return;
    }
    setErr("errCalificarNota", "");

    if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`; }

    const { error } = await supabase.from("entregas")
      .update({ nota: parseFloat(notaRaw), feedback: feedback || null })
      .eq("id", entregaId);

    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar calificación`; }

    if (error) {
      mostrarAlerta(alerta, "error", `Error al guardar: ${error.message || "intenta de nuevo."}`);
      return;
    }

    mostrarAlerta(alerta, "ok", "¡Calificación guardada!");
    mostrarToast("Nota guardada correctamente.", "ok");

    if (estado.cursoActivo) await cargarEntregasCurso(estado.cursoActivo.id);
    setTimeout(cerrarModalCalificar, 700);
  });
}
