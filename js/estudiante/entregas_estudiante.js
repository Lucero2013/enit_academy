import { supabase } from "../supabase.js";
import { inyectarBotonesEntrega } from "./curso_detalle_estudiante.js";
import { formatFecha, mostrarAlerta, mostrarToast } from "./utilidades_estudiante.js";

export async function cargarEntregasEstudiante() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from("entregas")
    .select("tarea_id, nota")
    .eq("estudiante_id", user.id);
  window.__mapaNotasEst = {};
  (data || []).forEach(e => { window.__mapaNotasEst[e.tarea_id] = e.nota; });
  return new Set((data || []).map(e => e.tarea_id));
}
let entregaTareaId = null;
let entregaArchivoFile = null;
window.abrirModalEntrega = function(tareaId, tareaTitulo, fechaEntrega) {
  entregaTareaId    = tareaId;
  entregaArchivoFile = null;

  document.getElementById("entregaTareaTitulo").textContent = tareaTitulo;
  document.getElementById("entregaTareaVence").textContent  = fechaEntrega
    ? `Fecha límite: ${formatFecha(fechaEntrega)}`
    : "Sin fecha límite";

  document.getElementById("entregaArchivoSel").classList.remove("visible");
  document.getElementById("entregaArchivoNombre").textContent = "";
  document.getElementById("entregaInputFile").value = "";
  document.getElementById("entregaNota").value = "";
  document.getElementById("entregaProgreso").classList.remove("visible");
  document.getElementById("entregaProgresoFill").style.width = "0%";
  document.getElementById("alertaEntrega").className = "alerta";
  document.getElementById("btnConfirmarEntrega").disabled = false;

  document.getElementById("modalEntregaOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
};
function cerrarModalEntrega() {
  document.getElementById("modalEntregaOverlay").style.display = "none";
  document.body.style.overflow = "";
  entregaTareaId    = null;
  entregaArchivoFile = null;
}

document.addEventListener("DOMContentLoaded", () => {
  // Cerrar modal
  document.getElementById("btnCerrarEntrega")?.addEventListener("click", cerrarModalEntrega);
  document.getElementById("btnCancelarEntrega")?.addEventListener("click", cerrarModalEntrega);
  document.getElementById("modalEntregaOverlay")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModalEntrega();
  });

  // Zona drag & drop
  const zona  = document.getElementById("entregaZona");
  const input = document.getElementById("entregaInputFile");

  zona?.addEventListener("click", () => input?.click());

  zona?.addEventListener("dragover", e => {
    e.preventDefault();
    zona.classList.add("drag-over");
  });
  zona?.addEventListener("dragleave", () => zona.classList.remove("drag-over"));
  zona?.addEventListener("drop", e => {
    e.preventDefault();
    zona.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (file) seleccionarArchivoEntrega(file);
  });

  input?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (file) seleccionarArchivoEntrega(file);
  });

  // Quitar archivo
  document.getElementById("entregaQuitarArchivo")?.addEventListener("click", () => {
    entregaArchivoFile = null;
    document.getElementById("entregaArchivoSel").classList.remove("visible");
    document.getElementById("entregaArchivoNombre").textContent = "";
    if (input) input.value = "";
  });

  // Enviar entrega
  document.getElementById("btnConfirmarEntrega")?.addEventListener("click", enviarEntrega);
});
function seleccionarArchivoEntrega(file) {
  const maxMB = 20;
  if (file.size > maxMB * 1024 * 1024) {
    mostrarAlerta(document.getElementById("alertaEntrega"), "error", `El archivo supera los ${maxMB} MB.`);
    return;
  }
  entregaArchivoFile = file;
  document.getElementById("entregaArchivoNombre").textContent = file.name;
  document.getElementById("entregaArchivoSel").classList.add("visible");
  document.getElementById("alertaEntrega").className = "alerta";
}
async function enviarEntrega() {
  const alerta = document.getElementById("alertaEntrega");
  const nota   = document.getElementById("entregaNota")?.value.trim();
  const btn    = document.getElementById("btnConfirmarEntrega");

  if (!entregaArchivoFile && !nota) {
    mostrarAlerta(alerta, "error", "Adjunta un archivo o escribe un comentario antes de enviar.");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar entrega`;
    mostrarAlerta(alerta, "error", "Sesión expirada. Recarga la página.");
    return;
  }

  let archivoUrl = null;

  // Subir archivo a Supabase Storage
  if (entregaArchivoFile) {
    const progreso = document.getElementById("entregaProgreso");
    const fill     = document.getElementById("entregaProgresoFill");
    const texto    = document.getElementById("entregaProgresoTexto");
    progreso?.classList.add("visible");
    fill.classList.add("indeterminado");
    texto.textContent = "Subiendo archivo...";

    const ext  = entregaArchivoFile.name.split(".").pop();
    const path = `entregas/${user.id}/${entregaTareaId}/${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("entregas")
      .upload(path, entregaArchivoFile, { upsert: false });

    fill.classList.remove("indeterminado");
    fill.style.width = "100%";

    if (uploadErr) {
      progreso?.classList.remove("visible");
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar entrega`;
      mostrarAlerta(alerta, "error", `No se pudo subir el archivo: ${uploadErr.message}`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("entregas")
      .getPublicUrl(uploadData.path);
    archivoUrl = urlData?.publicUrl || null;
    texto.textContent = "¡Archivo subido!";
  }

  // Guardar entrega en la tabla "entregas"
const { error: insertErr } = await supabase
  .from("entregas")
  .insert({
    tarea_id:      entregaTareaId,
    estudiante_id: user.id,
    url_archivo:   archivoUrl,
    comentario:    nota || null,
  });

  if (insertErr) {
    document.getElementById("entregaProgreso")?.classList.remove("visible");
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar entrega`;
    // Si la tabla no existe aún, igual mostramos éxito local
    if (insertErr.code === "42P01") {
      mostrarToast("¡Entrega enviada! (tabla pendiente de crear en BD) 📎", "info");
      cerrarModalEntrega();
      return;
    }
    mostrarAlerta(alerta, "error", `Error al registrar la entrega: ${insertErr.message}`);
    return;
  }

  mostrarToast("¡Entrega enviada correctamente! 🎉", "ok");
  cerrarModalEntrega();
  // Refrescar botones en la vista del curso abierto
inyectarBotonesEntrega();
}

// ══ MODAL DETALLE DE ENTREGA ══════════════════════════════════════════════════
window.verDetalleEntrega = async function(tareaId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: entrega } = await supabase
    .from("entregas")
    .select("url_archivo, comentario, entregado_at, nota, feedback")
    .eq("tarea_id", tareaId)
    .eq("estudiante_id", user.id)
    .single();

  if (!entrega) { mostrarToast("No se encontró la entrega.", "error"); return; }

  // Fecha
  document.getElementById("detalleEntregaFecha").textContent =
    entrega.entregado_at ? formatFecha(entrega.entregado_at) : "—";

  // Archivo
  const archivoWrap = document.getElementById("detalleEntregaArchivoWrap");
  if (entrega.url_archivo) {
    const link   = document.getElementById("detalleEntregaArchivoLink");
    const nombre = entrega.url_archivo.split("/").pop().split("?")[0];
    link.href    = entrega.url_archivo;
    document.getElementById("detalleEntregaArchivoNombre").textContent = decodeURIComponent(nombre);
    archivoWrap.style.display = "";
  } else {
    archivoWrap.style.display = "none";
  }

  // Comentario
  const comentarioWrap = document.getElementById("detalleEntregaComentarioWrap");
  if (entrega.comentario) {
    document.getElementById("detalleEntregaComentario").textContent = entrega.comentario;
    comentarioWrap.style.display = "";
  } else {
    comentarioWrap.style.display = "none";
  }

  // Calificación
  const notaEl    = document.getElementById("detalleEntregaNota");
  const estadoEl  = document.getElementById("detalleEntregaEstadoCalif");
  const feedbackEl = document.getElementById("detalleEntregaFeedback");
  const yaCalificada = entrega.nota !== null && entrega.nota !== undefined;

  if (yaCalificada) {
    notaEl.textContent = entrega.nota;
    estadoEl.textContent = "Calificado";
    estadoEl.style.background = "#effaf5";
    estadoEl.style.color = "var(--color-ok,#1aaa6b)";
  } else {
    notaEl.textContent = "Pendiente";
    estadoEl.textContent = "Sin calificar";
    estadoEl.style.background = "#fff4e0";
    estadoEl.style.color = "#b8860b";
  }

  if (entrega.feedback) {
    feedbackEl.textContent = entrega.feedback;
    feedbackEl.style.display = "block";
  } else {
    feedbackEl.style.display = "none";
  }

  document.getElementById("modalDetalleEntregaOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
};

document.addEventListener("DOMContentLoaded", () => {
  const cerrarDetalleEntrega = () => {
    document.getElementById("modalDetalleEntregaOverlay").style.display = "none";
    document.body.style.overflow = "";
  };
  document.getElementById("btnCerrarDetalleEntrega")?.addEventListener("click", cerrarDetalleEntrega);
  document.getElementById("modalDetalleEntregaOverlay")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarDetalleEntrega();
  });
});
