import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";
import { confirmarAccion } from "./modal_confirmar.js";
import { formatFecha, mostrarToast } from "./utilidades_docente.js";

export async function cargarAnunciosCurso(cursoId) {
  const { data } = await supabase.from("anuncios").select("*")
    .eq("curso_id", cursoId).order("creado_at", { ascending: false });
  const el = document.getElementById("listaAnunciosCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? data.map(a => `
      <div class="item-anuncio" data-anuncio-id="${a.id}">
        <div class="anuncio-meta"><span class="meta-fecha">${formatFecha(a.creado_at)}</span>
          <div class="modulo-item-acciones">
            <button class="btn-icono-peq" title="Editar" onclick="editarAnuncioInline('${a.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarAnuncio('${a.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div class="anuncio-vista">
          <strong>${a.titulo}</strong><p>${a.contenido}</p>
        </div>
      </div>`).join("")
    : `<p class="sin-datos">Sin anuncios.</p>`;
}
window.editarAnuncioInline = function(anuncioId) {
  const tarjeta = document.querySelector(`.item-anuncio[data-anuncio-id="${anuncioId}"]`);
  if (!tarjeta) return;
  const vista = tarjeta.querySelector(".anuncio-vista");
  const tituloActual    = vista.querySelector("strong")?.textContent || "";
  const contenidoActual = vista.querySelector("p")?.textContent || "";

  vista.innerHTML = `
    <div class="campo"><label>Título</label><input type="text" class="edit-anuncio-titulo" value="${tituloActual.replace(/"/g,'&quot;')}"></div>
    <div class="campo mt-2"><label>Contenido</label><textarea class="edit-anuncio-contenido" rows="3">${contenidoActual}</textarea></div>
    <div class="modal-footer" style="border-top:none; padding-top:.6rem;">
      <button type="button" class="btn-secundario" onclick="cargarAnunciosCursoActivo()">Cancelar</button>
      <button type="button" class="btn-primario btn-pequeno" onclick="guardarAnuncioInline('${anuncioId}')"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
    </div>`;
};
window.guardarAnuncioInline = async function(anuncioId) {
  const tarjeta = document.querySelector(`.item-anuncio[data-anuncio-id="${anuncioId}"]`);
  if (!tarjeta) return;
  const titulo    = tarjeta.querySelector(".edit-anuncio-titulo")?.value.trim();
  const contenido = tarjeta.querySelector(".edit-anuncio-contenido")?.value.trim();
  if (!titulo || !contenido) { mostrarToast("Completa título y contenido.", "error"); return; }

  const { error } = await supabase.from("anuncios").update({ titulo, contenido }).eq("id", anuncioId);
  if (error) { mostrarToast("Error al guardar el anuncio.", "error"); return; }
  mostrarToast("Anuncio actualizado.", "ok");
  await cargarAnunciosCursoActivo();
};
window.cargarAnunciosCursoActivo = async function() {
  if (estado.cursoActivo) await cargarAnunciosCurso(estado.cursoActivo.id);
};

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULOS — listado, acordeón y CRUD
// ══════════════════════════════════════════════════════════════════════════════
window.eliminarAnuncio = async (id, cursoId) => {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar este anuncio?",
    mensaje: "Los estudiantes ya no podrán verlo.",
    textoBoton: "Eliminar",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("anuncios").delete().eq("id", id);
  if (error) { mostrarToast(`No se pudo eliminar el anuncio: ${error.message || "intenta de nuevo."}`, "error"); return; }
  await cargarAnunciosCurso(cursoId);
  mostrarToast("Anuncio eliminado.", "ok");
};

// ══ PESTAÑAS DETALLE ══════════════════════════════════════════════════════════
