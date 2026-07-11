import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";
import { confirmarAccion } from "./modal_confirmar.js";
import { formatFecha, mostrarAlerta, mostrarToast, setErr, urgencia } from "./utilidades_docente.js";

export async function cargarModulosCurso(cursoId) {
  const { data: modulos } = await supabase.from("modulos").select("*")
    .eq("curso_id", cursoId).order("orden", { ascending: true });
  estado.modulosActivo = modulos || [];

  // Cargar items de todos los módulos de una sola vez
  const moduloIds = estado.modulosActivo.map(m => m.id);
  let itemsPorModulo = {};
  if (moduloIds.length) {
    const { data: items } = await supabase.from("modulo_items").select("*")
      .in("modulo_id", moduloIds).order("creado_at", { ascending: true });
    (items || []).forEach(it => {
      if (!itemsPorModulo[it.modulo_id]) itemsPorModulo[it.modulo_id] = [];
      itemsPorModulo[it.modulo_id].push(it);
    });
  }
  estado.modulosActivo = estado.modulosActivo.map(m => ({ ...m, items: itemsPorModulo[m.id] || [] }));

  renderModulos(cursoId);
}
function renderModulos(cursoId) {
  const cont = document.getElementById("listaModulosCurso");
  if (!cont) return;

  if (!estado.modulosActivo.length) {
    cont.innerHTML = `<p class="sin-datos">Aún no creaste módulos. Usa "Nuevo módulo" para empezar a organizar el contenido.</p>`;
    return;
  }

  cont.innerHTML = estado.modulosActivo.map((m, idx) => {
    const expandido = m.id === estado.moduloExpandidoId;
    return `
    <div class="modulo-tarjeta ${expandido ? "expandido" : ""}" data-modulo-id="${m.id}">
      <div class="modulo-cabecera" onclick="toggleModulo('${m.id}','${cursoId}')">
        <div class="modulo-numero">${idx + 1}</div>
        <div class="modulo-info">
          <h3>${m.titulo}</h3>
          ${m.descripcion ? `<p>${m.descripcion}</p>` : ""}
        </div>
        <div class="modulo-meta">
          <span class="modulo-conteo">${m.items.length} ${m.items.length === 1 ? "elemento" : "elementos"}</span>
        </div>
        <div class="modulo-acciones">
          <button class="btn-icono-peq" title="Editar módulo" onclick="event.stopPropagation(); abrirModalModulo('${cursoId}','${m.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icono-peq peligro" title="Eliminar módulo" onclick="event.stopPropagation(); eliminarModulo('${m.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
        <i class="fa-solid fa-chevron-down modulo-chevron"></i>
      </div>
      <div class="modulo-cuerpo ${expandido ? "" : "oculto"}">
        <div class="modulo-cuerpo-cabecera">
          <div class="dropdown-agregar" data-modulo-id="${m.id}">
            <button class="btn-primario btn-pequeno" onclick="toggleDropdownAgregar('${m.id}', event)">
              <i class="fa-solid fa-plus"></i> Agregar contenido <i class="fa-solid fa-chevron-down dropdown-flecha"></i>
            </button>
            <div class="dropdown-menu-agregar oculto">
              <button type="button" onclick="elegirTipoContenido('${m.id}','texto')">
                <span class="dropdown-icono icono-texto"><i class="fa-solid fa-align-left"></i></span>
                <span class="dropdown-texto"><strong>Texto</strong><small>Escribe contenido para la clase</small></span>
              </button>
              <button type="button" onclick="elegirTipoContenido('${m.id}','archivo')">
                <span class="dropdown-icono icono-archivo"><i class="fa-solid fa-paperclip"></i></span>
                <span class="dropdown-texto"><strong>Archivo</strong><small>Sube un archivo o pega un enlace</small></span>
              </button>
              <button type="button" onclick="elegirTipoContenido('${m.id}','tarea')">
                <span class="dropdown-icono icono-tarea"><i class="fa-solid fa-clipboard-list"></i></span>
                <span class="dropdown-texto"><strong>Tarea</strong><small>Crea una tarea con fecha y puntos</small></span>
              </button>
            </div>
          </div>
        </div>
        ${renderItemsModulo(m, cursoId)}
      </div>
    </div>`;
  }).join("");
}
function renderItemsModulo(modulo, cursoId) {
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
        <div class="modulo-item-acciones">
          <button class="btn-icono-peq" title="Editar" onclick="abrirModalContenido('${modulo.id}','${it.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarItemModulo('${it.id}','${modulo.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }
    if (it.tipo === "archivo") {
      const tieneUrl     = !!it.url;
      const tieneArchivo = !!it.archivo_url;
      return `
      <div class="modulo-item">
        <div class="modulo-item-icono icono-archivo"><i class="fa-solid ${tieneArchivo ? 'fa-file-arrow-down' : 'fa-link'}"></i></div>
        <div class="modulo-item-cuerpo">
          <strong>${it.titulo}</strong>
          <div class="modulo-item-enlaces">
            ${tieneUrl ? `<a href="${it.url}" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
            ${tieneArchivo ? `<a href="${it.archivo_url}" target="_blank" rel="noopener"><i class="fa-solid fa-file-arrow-down"></i> Archivo subido</a>` : ""}
          </div>
          <p>${formatFecha(it.creado_at)}</p>
        </div>
        <div class="modulo-item-acciones">
          <button class="btn-icono-peq" title="Editar" onclick="abrirModalContenido('${modulo.id}','${it.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarItemModulo('${it.id}','${modulo.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }
    // tarea
    const venceTxt = it.fecha_entrega ? `<span class="vence-tag ${urgencia(it.fecha_entrega)}">Vence: ${formatFecha(it.fecha_entrega)}</span>` : "";
    return `
    <div class="modulo-item">
      <div class="modulo-item-icono icono-tarea"><i class="fa-solid fa-clipboard-list"></i></div>
      <div class="modulo-item-cuerpo">
        <strong>${it.titulo} ${it.puntos ? `<span style="color:#8b5cf6;font-weight:700;font-size:.78rem;">· ${it.puntos} pts</span>` : ""}</strong>
        <p>${it.contenido || ""}</p>
        <div style="display:flex; gap:.6rem; align-items:center; margin-top:.3rem; flex-wrap:wrap;">
          ${venceTxt}
          ${it.url ? `<a href="${it.url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
          ${it.archivo_url ? `<a href="${it.archivo_url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-file-arrow-down"></i> Archivo adjunto</a>` : ""}
        </div>
      </div>
      <div class="modulo-item-acciones">
        <button class="btn-icono-peq" title="Editar" onclick="abrirModalContenido('${modulo.id}','${it.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarItemModulo('${it.id}','${modulo.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join("");
}
window.toggleModulo = function(moduloId, cursoId) {
  estado.moduloExpandidoId = estado.moduloExpandidoId === moduloId ? null : moduloId;
  renderModulos(cursoId);
};
window.eliminarModulo = async function(moduloId, cursoId) {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar este módulo?",
    mensaje: "Se eliminará junto con todo su contenido: textos, archivos y tareas. Esta acción no se puede deshacer.",
    textoBoton: "Eliminar módulo",
  });
  if (!confirmado) return;

  await supabase.from("modulo_items").delete().eq("modulo_id", moduloId);
  const { error } = await supabase.from("modulos").delete().eq("id", moduloId);
  if (error) { mostrarToast(`No se pudo eliminar el módulo: ${error.message || "intenta de nuevo."}`, "error"); return; }

  if (estado.moduloExpandidoId === moduloId) estado.moduloExpandidoId = null;
  await cargarModulosCurso(cursoId);
  mostrarToast("Módulo eliminado.", "info");
};
window.eliminarItemModulo = async function(itemId, moduloId, cursoId) {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar este elemento?",
    mensaje: "Se quitará del módulo de forma permanente.",
    textoBoton: "Eliminar",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("modulo_items").delete().eq("id", itemId);
  if (error) { mostrarToast(`No se pudo eliminar: ${error.message || "intenta de nuevo."}`, "error"); return; }
  await cargarModulosCurso(cursoId);
  mostrarToast("Elemento eliminado.", "ok");
};
// ── Modal crear/editar módulo ──
window.abrirModalModulo = function(cursoId, moduloId = null) {
  const titulo = document.getElementById("modalModuloTitulo");
  const form   = document.getElementById("formModulo");
  form.dataset.cursoId = cursoId;
  document.getElementById("moduloId").value = moduloId || "";
  setErr("errModuloTitulo", "");
  document.getElementById("alertaModulo").className = "alerta";

  if (moduloId) {
    const m = estado.modulosActivo.find(mm => mm.id === moduloId);
    titulo.innerHTML = `<i class="fa-solid fa-pen"></i> Editar módulo`;
    document.getElementById("moduloTitulo").value = m?.titulo || "";
    document.getElementById("moduloDesc").value   = m?.descripcion || "";
  } else {
    titulo.innerHTML = `<i class="fa-solid fa-layer-group"></i> Nuevo módulo`;
    document.getElementById("moduloTitulo").value = "";
    document.getElementById("moduloDesc").value   = "";
  }

  document.getElementById("modalModulo").style.display = "flex";
  document.body.style.overflow = "hidden";
};
function cerrarModalModulo() {
  document.getElementById("modalModulo").style.display = "none";
  document.body.style.overflow = "";
}
// ── Dropdown "Agregar contenido" (Texto / Archivo / Tarea) ──
window.toggleDropdownAgregar = function(moduloId, e) {
  e?.stopPropagation();
  const wrapper = document.querySelector(`.dropdown-agregar[data-modulo-id="${moduloId}"]`);
  if (!wrapper) return;
  const boton = wrapper.querySelector("button");
  const menu  = wrapper.querySelector(".dropdown-menu-agregar");
  const yaAbierto = !menu.classList.contains("oculto");

  // Cerrar cualquier otro dropdown abierto antes de abrir este
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));

  if (!yaAbierto) {
    // Como el menú es position:fixed (para no quedar recortado por el overflow
    // de la tarjeta de módulo), su posición se calcula en JS según el botón.
    const rect = boton.getBoundingClientRect();
    const anchoMenu = 250;
    let left = rect.right - anchoMenu;
    if (left < 8) left = 8; // no se sale por la izquierda en pantallas chicas
    menu.style.top  = `${rect.bottom + 8}px`;
    menu.style.left = `${left}px`;

    menu.classList.remove("oculto");
    wrapper.classList.add("abierto");

    // Si se sale por abajo del viewport, lo mostramos arriba del botón en su lugar
    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      if (menuRect.bottom > window.innerHeight - 8) {
        menu.style.top = `${rect.top - menuRect.height - 8}px`;
      }
    });
  }
};
window.elegirTipoContenido = function(moduloId, tipo) {
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
  window.abrirModalContenido(moduloId, null, tipo);
};

// Cerrar el dropdown si se hace clic en cualquier otro lugar de la página
document.addEventListener("click", (e) => {
  if (e.target.closest(".dropdown-agregar")) return;
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
});

// Como el menú usa position:fixed, su posición calculada queda obsoleta
// si la página se desplaza o cambia de tamaño — lo cerramos en ese caso.
window.addEventListener("scroll", () => {
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
}, true);
window.addEventListener("resize", () => {
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
});
// ── Modal agregar / editar contenido de un módulo ──
window.abrirModalContenido = function(moduloId, itemId = null, tipoInicial = "texto") {
  estado.moduloContenidoId = itemId ? null : moduloId; // se recalcula abajo si es edición
  document.getElementById("contenidoModuloId").value = moduloId;
  document.getElementById("contenidoItemId").value = itemId || "";

  const tituloModal = document.getElementById("modalContenidoTitulo");
  const tabsWrap     = document.getElementById("tabsTipoContenido");

  // Reset campos
  ["ctTitulo","ctContenido","caNombre","archivoUrl","tareaTitulo","tareaDesc","tareaFecha","tareaPuntos","tareaUrl"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const archivoFile = document.getElementById("archivoFile"); if (archivoFile) archivoFile.value = "";
  const tareaFile = document.getElementById("tareaFile"); if (tareaFile) tareaFile.value = "";

  const archivoActualInfo = document.getElementById("archivoActualInfo");
  if (archivoActualInfo) { archivoActualInfo.className = "archivo-actual-info oculto"; archivoActualInfo.innerHTML = ""; }
  const tareaArchivoActualInfo = document.getElementById("tareaArchivoActualInfo");
  if (tareaArchivoActualInfo) { tareaArchivoActualInfo.className = "archivo-actual-info oculto"; tareaArchivoActualInfo.innerHTML = ""; }

  ["alertaContTexto","alertaContArchivo","alertaContTarea"].forEach(id => {
    const el = document.getElementById(id); if (el) el.className = "alerta";
  });

  let tipoForzado = tipoInicial || "texto";

  if (itemId) {
    // ── Modo edición: buscar el item y precargar sus datos ──
    const modulo = estado.modulosActivo.find(m => m.id === moduloId);
    const item    = modulo?.items.find(i => i.id === itemId);
    if (!item) return;
    estado.moduloContenidoId = moduloId;
    tipoForzado = item.tipo;

    if (item.tipo === "texto") {
      document.getElementById("ctTitulo").value    = item.titulo || "";
      document.getElementById("ctContenido").value = item.contenido || "";
      document.getElementById("btnGuardarTexto").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
    } else if (item.tipo === "archivo") {
      document.getElementById("caNombre").value = item.titulo || "";
      document.getElementById("archivoUrl").value = item.url || "";
      if (item.archivo_url && archivoActualInfo) {
        archivoActualInfo.className = "archivo-actual-info";
        archivoActualInfo.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ya hay un archivo subido. <a href="${item.archivo_url}" target="_blank" rel="noopener">Verlo</a> — selecciona otro arriba para reemplazarlo.`;
      }
      document.getElementById("btnGuardarArchivo").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
    } else if (item.tipo === "tarea") {
      document.getElementById("tareaTitulo").value = item.titulo || "";
      document.getElementById("tareaDesc").value    = item.contenido || "";
      document.getElementById("tareaFecha").value   = item.fecha_entrega || "";
      document.getElementById("tareaPuntos").value  = item.puntos || "";
      document.getElementById("tareaUrl").value     = item.url || "";
      if (item.archivo_url && tareaArchivoActualInfo) {
        tareaArchivoActualInfo.className = "archivo-actual-info";
        tareaArchivoActualInfo.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ya hay un archivo adjunto. <a href="${item.archivo_url}" target="_blank" rel="noopener">Verlo</a> — selecciona otro arriba para reemplazarlo.`;
      }
      document.getElementById("btnGuardarTarea").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
    }

    tituloModal.innerHTML = `<i class="fa-solid fa-pen"></i> Editar contenido`;
    // En edición no se permite cambiar el tipo de contenido
    tabsWrap.classList.add("oculto");
  } else {
    estado.moduloContenidoId = moduloId;
    const etiquetas = { texto: "Agregar texto", archivo: "Agregar archivo", tarea: "Agregar tarea" };
    tituloModal.innerHTML = `<i class="fa-solid fa-circle-plus"></i> ${etiquetas[tipoForzado] || "Agregar contenido"}`;
    tabsWrap.classList.remove("oculto");
    document.getElementById("btnGuardarTexto").innerHTML   = `<i class="fa-solid fa-floppy-disk"></i> Agregar texto`;
    document.getElementById("btnGuardarArchivo").innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Agregar archivo`;
    document.getElementById("btnGuardarTarea").innerHTML   = `<i class="fa-solid fa-plus"></i> Crear tarea`;
  }

  // Activar el tab correspondiente (forzado en edición, "texto" por defecto al crear)
  document.querySelectorAll(".tab-cont").forEach(b => b.classList.remove("activo-tab"));
  document.querySelector(`.tab-cont[data-cont="${tipoForzado}"]`)?.classList.add("activo-tab");
  document.querySelectorAll(".cont-panel").forEach(p => p.classList.add("oculto"));
  document.querySelector(`.cont-panel[data-cont-panel="${tipoForzado}"]`)?.classList.remove("oculto");

  document.getElementById("modalContenidoModulo").style.display = "flex";
  document.body.style.overflow = "hidden";
};
function cerrarModalContenido() {
  document.getElementById("modalContenidoModulo").style.display = "none";
  document.body.style.overflow = "";
  estado.moduloContenidoId = null;
  document.getElementById("contenidoItemId").value = "";
  document.getElementById("tabsTipoContenido")?.classList.remove("oculto");
}
export function initModalesModulo() {
  document.getElementById("btnCerrarModalModulo")?.addEventListener("click", cerrarModalModulo);
  document.getElementById("btnCancelarModalModulo")?.addEventListener("click", cerrarModalModulo);
  document.getElementById("modalModulo")?.addEventListener("click", e => { if (e.target.id === "modalModulo") cerrarModalModulo(); });

  document.getElementById("btnNuevoModulo")?.addEventListener("click", () => {
    if (estado.cursoActivo) window.abrirModalModulo(estado.cursoActivo.id);
  });

  document.getElementById("formModulo")?.addEventListener("submit", async e => {
    e.preventDefault();
    const cursoId   = e.target.dataset.cursoId;
    const moduloId  = document.getElementById("moduloId")?.value;
    const titulo    = document.getElementById("moduloTitulo")?.value.trim();
    const desc      = document.getElementById("moduloDesc")?.value.trim();
    const alerta    = document.getElementById("alertaModulo");

    if (!titulo) { setErr("errModuloTitulo", "El título es obligatorio."); return; }
    setErr("errModuloTitulo", "");

    if (moduloId) {
      const { error } = await supabase.from("modulos").update({ titulo, descripcion: desc || null }).eq("id", moduloId);
      if (error) { mostrarAlerta(alerta, "error", "Error al guardar el módulo."); return; }
      mostrarAlerta(alerta, "ok", "Módulo actualizado.");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const orden = estado.modulosActivo.length;
      const { error } = await supabase.from("modulos").insert({
        curso_id: cursoId, docente_id: user.id, titulo, descripcion: desc || null, orden,
      });
      if (error) { mostrarAlerta(alerta, "error", "Error al crear el módulo."); return; }
      mostrarAlerta(alerta, "ok", "Módulo creado.");
    }

    await cargarModulosCurso(cursoId);
    setTimeout(cerrarModalModulo, 700);
  });

  // ── Modal contenido: cerrar ──
  document.getElementById("btnCerrarModalContenido")?.addEventListener("click", cerrarModalContenido);
  document.getElementById("modalContenidoModulo")?.addEventListener("click", e => { if (e.target.id === "modalContenidoModulo") cerrarModalContenido(); });
  document.querySelectorAll(".btn-cerrar-contenido").forEach(btn => btn.addEventListener("click", cerrarModalContenido));

  // ── Submit: contenido tipo texto (crear o editar) ──
  document.getElementById("formContenidoTexto")?.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo    = document.getElementById("ctTitulo")?.value.trim();
    const contenido = document.getElementById("ctContenido")?.value.trim();
    const alerta    = document.getElementById("alertaContTexto");
    const itemId    = document.getElementById("contenidoItemId")?.value;
    const btn       = document.getElementById("btnGuardarTexto");
    if (!contenido) { mostrarAlerta(alerta, "error", "Escribe el contenido del módulo."); return; }

    if (btn) { btn.disabled = true; }
    const { data: { user } } = await supabase.auth.getUser();

    let error;
    if (itemId) {
      ({ error } = await supabase.from("modulo_items")
        .update({ titulo: titulo || "Texto", contenido })
        .eq("id", itemId));
    } else {
      ({ error } = await supabase.from("modulo_items").insert({
        modulo_id: estado.moduloContenidoId, docente_id: user.id,
        tipo: "texto", titulo: titulo || "Texto", contenido,
      }));
    }

    if (btn) { btn.disabled = false; }
    if (error) { mostrarAlerta(alerta, "error", `Error al guardar: ${error.message || "intenta de nuevo."}`); return; }

    mostrarAlerta(alerta, "ok", itemId ? "Texto actualizado." : "Texto agregado.");
    await cargarModulosCurso(estado.cursoActivo.id);
    setTimeout(cerrarModalContenido, 700);
  });

  // ── Submit: contenido tipo archivo (crear o editar) — URL y archivo combinables ──
  document.getElementById("formContenidoArchivo")?.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre = document.getElementById("caNombre")?.value.trim();
    const url     = document.getElementById("archivoUrl")?.value.trim();
    const alerta = document.getElementById("alertaContArchivo");
    const itemId = document.getElementById("contenidoItemId")?.value;
    const btn    = document.getElementById("btnGuardarArchivo");
    const fileInput = document.getElementById("archivoFile");
    const file      = fileInput?.files[0];
    const { data: { user } } = await supabase.auth.getUser();

    if (!nombre) { mostrarAlerta(alerta, "error", "Escribe el nombre del archivo."); return; }
    if (!url && !file && !itemId) {
      mostrarAlerta(alerta, "error", "Agrega un enlace, sube un archivo, o ambos."); return;
    }
    if (file && file.size > 50 * 1024 * 1024) { mostrarAlerta(alerta, "error", "El archivo supera 50 MB."); return; }

    if (btn) btn.disabled = true;

    const payload = { titulo: nombre, url: url || null };

    if (file) {
      const progreso     = document.getElementById("progresoUpload");
      const progresoFill = document.getElementById("progresoFill");
      const progresoTxt  = document.getElementById("progresoTexto");
      if (progreso) progreso.classList.remove("oculto");
      if (progresoFill) { progresoFill.style.width = "0%"; progresoFill.classList.add("indeterminado"); }
      if (progresoTxt) progresoTxt.textContent = "Subiendo archivo...";

      // Nota: el SDK de Supabase Storage (v2) no expone progreso real de subida
      // (no existe la opción onUploadProgress), por eso se usa una animación indeterminada.
      const path = `cursos/${estado.cursoActivo.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: errUp } = await supabase.storage.from("materiales").upload(path, file, { upsert: true });

      if (progreso) progreso.classList.add("oculto");
      if (progresoFill) progresoFill.classList.remove("indeterminado");

      if (errUp) {
        if (btn) btn.disabled = false;
        mostrarAlerta(alerta, "error", `Error al subir el archivo: ${errUp.message || "verifica el bucket 'materiales' en Supabase Storage."}`);
        return;
      }

      const { data: urlData } = supabase.storage.from("materiales").getPublicUrl(path);
      payload.archivo_url = urlData?.publicUrl;
      payload.es_upload = true;
    }
    // Si no se eligió un archivo nuevo, no se toca archivo_url (se conserva el que ya hubiera al editar)

    let error;
    if (itemId) {
      ({ error } = await supabase.from("modulo_items").update(payload).eq("id", itemId));
    } else {
      ({ error } = await supabase.from("modulo_items").insert({
        modulo_id: estado.moduloContenidoId, docente_id: user.id, tipo: "archivo", ...payload,
      }));
    }
    if (btn) btn.disabled = false;
    if (error) { mostrarAlerta(alerta, "error", `Error al guardar: ${error.message || "intenta de nuevo."}`); return; }
    mostrarAlerta(alerta, "ok", itemId ? "Archivo actualizado." : "Archivo añadido.");

    await cargarModulosCurso(estado.cursoActivo.id);
    setTimeout(cerrarModalContenido, 700);
  });

  // ── Submit: contenido tipo tarea (crear o editar) — enlace y archivo combinables ──
  document.getElementById("formContenidoTarea")?.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo  = document.getElementById("tareaTitulo")?.value.trim();
    const desc    = document.getElementById("tareaDesc")?.value.trim();
    const fecha   = document.getElementById("tareaFecha")?.value;
    const puntos  = document.getElementById("tareaPuntos")?.value;
    const urlRef  = document.getElementById("tareaUrl")?.value.trim();
    const alerta  = document.getElementById("alertaContTarea");
    const itemId  = document.getElementById("contenidoItemId")?.value;
    const btn     = document.getElementById("btnGuardarTarea");
    const file    = document.getElementById("tareaFile")?.files[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!titulo) { mostrarAlerta(alerta, "error", "El título es obligatorio."); return; }
    if (file && file.size > 50 * 1024 * 1024) { mostrarAlerta(alerta, "error", "El archivo supera 50 MB."); return; }

    if (btn) btn.disabled = true;

    const payload = {
      titulo, contenido: desc || null,
      fecha_entrega: fecha || null,
      puntos: puntos ? parseInt(puntos) : null,
      url: urlRef || null,
    };

    if (file) {
      const path = `tareas/${estado.cursoActivo.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: errUp } = await supabase.storage.from("materiales").upload(path, file, { upsert: true });
      if (errUp) {
        if (btn) btn.disabled = false;
        mostrarAlerta(alerta, "error", `Error al subir adjunto: ${errUp.message || "intenta de nuevo."}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("materiales").getPublicUrl(path);
      payload.archivo_url = urlData?.publicUrl;
    }
    // Si no se seleccionó un archivo nuevo, no se toca archivo_url (se conserva el existente al editar)

    let error;
    if (itemId) {
      ({ error } = await supabase.from("modulo_items").update(payload).eq("id", itemId));
    } else {
      ({ error } = await supabase.from("modulo_items").insert({
        modulo_id: estado.moduloContenidoId, docente_id: user.id, tipo: "tarea", ...payload,
      }));
    }
    if (btn) btn.disabled = false;
    if (error) { mostrarAlerta(alerta, "error", `Error al guardar la tarea: ${error.message || "intenta de nuevo."}`); return; }
    mostrarAlerta(alerta, "ok", itemId ? "Tarea actualizada." : "Tarea creada.");

    await cargarModulosCurso(estado.cursoActivo.id);
    setTimeout(cerrarModalContenido, 700);
  });
}

// ══ ACCIONES DETALLE CURSO (anuncios, visibilidad, eliminar curso) ═══════════
