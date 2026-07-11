import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";
import { confirmarAccion } from "./modal_confirmar.js";
import { mostrarAlerta, mostrarToast, setErr } from "./utilidades_docente.js";

const MAX_PUBLICIDADES = 2;

// ══ CARGAR PUBLICIDADES DEL DOCENTE ══════════════════════════════════════════
export async function cargarPublicidad() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
 
  const { data } = await supabase
    .from("publicidad")
    .select("*")
    .eq("docente_id", user.id)
    .order("creado_at", { ascending: true });
 
  estado.publicidadesDocente = data || [];
  pintarListaPublicidades();
  actualizarFormularioSegunCupo();
}
 
function pintarListaPublicidades() {
  const cont = document.getElementById("previewPublicidadActiva");
  const contador = document.getElementById("contadorPublicidades");
  if (contador) contador.textContent = estado.publicidadesDocente.length;
  if (!cont) return;
 
  if (estado.publicidadesDocente.length === 0) {
    cont.innerHTML = `<p class="sin-datos">Aún no tienes publicidad activa.</p>`;
    return;
  }
 
  cont.innerHTML = estado.publicidadesDocente.map(pub => `
    <div style="border:1.5px solid var(--borde);border-radius:14px;overflow:hidden;background:var(--blanco);margin-bottom:.9rem;">
      <img src="${pub.imagen_url}" alt="Publicidad" style="width:100%;height:140px;object-fit:cover;display:block;">
      <div style="padding:.9rem 1rem;">
        <strong style="font-size:.95rem;color:var(--texto);display:block;margin-bottom:.3rem;">${pub.titulo}</strong>
        <p style="font-size:.83rem;color:var(--texto-claro);line-height:1.5;margin:0 0 .7rem;">${pub.contenido || ""}</p>
        <div style="display:flex;gap:.5rem;">
          <button type="button" class="btn-icono-peq" title="Editar" onclick="editarPublicidad('${pub.id}')"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarPublicidad('${pub.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join("");
}
 
// Habilita/deshabilita el formulario según si ya llegó al máximo (y no está editando)
function actualizarFormularioSegunCupo() {
  const form = document.getElementById("formPublicidad");
  const btnGuardar = form?.querySelector('[type="submit"]');
  const avisoLimite = document.getElementById("avisoLimitePublicidad");
 
  const llegoAlTope = estado.publicidadesDocente.length >= MAX_PUBLICIDADES && !estado.editandoPublicidadId;
 
  if (btnGuardar) btnGuardar.disabled = llegoAlTope;
  if (avisoLimite) avisoLimite.style.display = llegoAlTope ? "flex" : "none";
}
 
window.editarPublicidad = function (id) {
  const pub = estado.publicidadesDocente.find(p => p.id === id);
  if (!pub) return;
  estado.editandoPublicidadId = id;
 
  document.getElementById("pubTitulo").value = pub.titulo || "";
  document.getElementById("pubContenido").value = pub.contenido || "";
  document.getElementById("pubLink").value = pub.link_destino || "";
 
  const drop = document.getElementById("dropImagenPub");
  const prev = document.getElementById("prevImagenPub");
  const img  = document.getElementById("imgPreviewPub");
  if (pub.imagen_url) {
    img.src = pub.imagen_url;
    drop.style.display = "none";
    prev.style.display = "block";
  }
 
  document.getElementById("formPublicidad")?.scrollIntoView({ behavior: "smooth", block: "start" });
  actualizarFormularioSegunCupo();
 
  const btnGuardar = document.querySelector('#formPublicidad [type="submit"]');
  if (btnGuardar) btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
};
 
window.eliminarPublicidad = async function (id) {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar esta publicidad?",
    mensaje: "Dejará de mostrarse en la página principal de inmediato.",
    textoBoton: "Eliminar publicidad",
  });
  if (!confirmado) return;
 
  const { error } = await supabase.from("publicidad").delete().eq("id", id);
  if (error) { mostrarToast(`No se pudo eliminar: ${error.message || "intenta de nuevo."}`, "error"); return; }
 
  if (estado.editandoPublicidadId === id) cancelarEdicionPublicidad();
  await cargarPublicidad();
  mostrarToast("Publicidad eliminada.", "info");
};
 
function cancelarEdicionPublicidad() {
  estado.editandoPublicidadId = null;
  document.getElementById("formPublicidad")?.reset();
  document.getElementById("prevImagenPub").style.display = "none";
  document.getElementById("dropImagenPub").style.display = "flex";
  const btnGuardar = document.querySelector('#formPublicidad [type="submit"]');
  if (btnGuardar) btnGuardar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> Publicar`;
  actualizarFormularioSegunCupo();
}
 
// ══ FORMULARIO: CREAR / EDITAR UNA PUBLICIDAD (hasta 2 por docente) ══════════
export function initFormPublicidad() {
  const form = document.getElementById("formPublicidad");
  if (!form) return;
 
  const inputImg = document.getElementById("pubImagen");
  const drop = document.getElementById("dropImagenPub");
  const prev = document.getElementById("prevImagenPub");
  const img  = document.getElementById("imgPreviewPub");
 
  inputImg?.addEventListener("change", () => {
    const file = inputImg.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
      drop.style.display = "none";
      prev.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
 
  document.getElementById("btnQuitarImgPub")?.addEventListener("click", () => {
    inputImg.value = "";
    prev.style.display = "none";
    drop.style.display = "flex";
  });
 
  document.getElementById("btnCancelarEdicionPub")?.addEventListener("click", cancelarEdicionPublicidad);
 
  drop?.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("drag-over"); });
  drop?.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
  drop?.addEventListener("drop", e => {
    e.preventDefault();
    drop.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) { inputImg.files = e.dataTransfer.files; inputImg.dispatchEvent(new Event("change")); }
  });
 
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo    = document.getElementById("pubTitulo")?.value.trim();
    const contenido = document.getElementById("pubContenido")?.value.trim();
    const link      = document.getElementById("pubLink")?.value.trim();
    const alerta    = document.getElementById("alertaPublicidad");
    const btnGuardar = form.querySelector('[type="submit"]');
 
    setErr("errPubTitulo", "");
    setErr("errPubImagen", "");
 
    if (!titulo) { setErr("errPubTitulo", "El título es obligatorio."); return; }
 
    // Tope de 2 publicidades, salvo que se esté editando una existente
    if (!estado.editandoPublicidadId && estado.publicidadesDocente.length >= MAX_PUBLICIDADES) {
      mostrarAlerta(alerta, "error", `Ya tienes el máximo de ${MAX_PUBLICIDADES} publicidades. Elimina una para poder agregar otra.`);
      return;
    }
 
    const imgFile = inputImg?.files[0];
    const pubExistente = estado.editandoPublicidadId
      ? estado.publicidadesDocente.find(p => p.id === estado.editandoPublicidadId)
      : null;
 
    if (!imgFile && !pubExistente?.imagen_url) {
      setErr("errPubImagen", "Sube una imagen para tu publicidad.");
      return;
    }
 
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`; }
 
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      docente_id: user.id,
      titulo,
      contenido: contenido || null,
      link_destino: link || null,
      activa: true,
    };
 
    if (imgFile) {
      const ext = imgFile.name.split(".").pop();
      const path = `${user.id}/banner_${Date.now()}.${ext}`;
      const { error: errImg } = await supabase.storage
        .from("publicidad")
        .upload(path, imgFile, { upsert: true });
 
      if (errImg) {
        mostrarAlerta(alerta, "error", `Error al subir la imagen: ${errImg.message || "intenta de nuevo."}`);
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> Publicar`; }
        return;
      }
      const { data: urlData } = supabase.storage.from("publicidad").getPublicUrl(path);
      payload.imagen_url = urlData.publicUrl;
    } else if (pubExistente?.imagen_url) {
      payload.imagen_url = pubExistente.imagen_url;
    }
 
    let error;
    if (estado.editandoPublicidadId) {
      ({ error } = await supabase.from("publicidad").update(payload).eq("id", estado.editandoPublicidadId));
    } else {
      ({ error } = await supabase.from("publicidad").insert(payload));
    }
 
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> Publicar`; }
 
    if (error) {
      mostrarAlerta(alerta, "error", `Error al guardar: ${error.message || "intenta de nuevo."}`);
      return;
    }
 
    mostrarAlerta(alerta, "ok", estado.editandoPublicidadId ? "¡Publicidad actualizada!" : "¡Publicidad publicada!");
    mostrarToast("Tu publicidad ya es visible en la página principal. 📣", "ok");
 
    cancelarEdicionPublicidad();
    await cargarPublicidad();
  });
}
