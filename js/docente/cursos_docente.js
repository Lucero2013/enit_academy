import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";
import { cargarAnunciosCurso } from "./anuncios_docente.js";
import { cargarEntregasCurso } from "./entregas_docente.js";
import { cargarAlumnosCurso, cargarCheckEstudiantes, cargarListaEstudiantes } from "./estudiantes_docente.js";
import { confirmarAccion } from "./modal_confirmar.js";
import { cargarModulosCurso } from "./modulos_docente.js";
import { mostrarVista } from "./sidebar_nav_docente.js";
import { generarCodigo, mostrarAlerta, mostrarToast, reemplazarYEscuchar, setErr } from "./utilidades_docente.js";

export async function cargarCursos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: cursos } = await supabase
    .from("cursos").select("*")
    .eq("docente_id", user.id)
    .order("creado_at", { ascending: false });
  estado.cursosDocente = cursos || [];
  renderCursos();
  cargarListaEstudiantes();
}
function renderCursos() {
  const contenedor = document.getElementById("listaCursos");
  const msg        = document.getElementById("msgSinCursos");
  if (!contenedor) return;

  if (estado.cursosDocente.length === 0) {
    if (msg) msg.style.display = "";
    contenedor.querySelectorAll(".tarjeta-curso").forEach(el => el.remove());
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = estado.cursosDocente.map(c => {
    const imgHtml = c.imagen_url
      ? `<img src="${c.imagen_url}" class="curso-img-portada" alt="${c.nombre}">`
      : `<div class="curso-img-placeholder"><i class="fa-solid fa-book-open"></i></div>`;

    return `
    <div class="tarjeta-curso" data-curso-id="${c.id}">
      <div class="curso-img-wrap" onclick="abrirDetalle('${c.id}')" style="cursor:pointer;">${imgHtml}</div>
      <div class="tarjeta-curso-header" onclick="abrirDetalle('${c.id}')" style="cursor:pointer;">
        <div class="curso-badges">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
          <span class="badge-visibilidad ${c.es_publico ? 'publico' : 'privado'}">
            <i class="fa-solid ${c.es_publico ? 'fa-globe' : 'fa-lock'}"></i>
            ${c.es_publico ? "Público" : "Con código"}
          </span>
        </div>
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
<div class="tarjeta-curso-footer">
  <button class="btn-ojo-vis" title="${c.es_publico ? 'Hacer privado' : 'Hacer público'}"
    onclick="toggleVisibilidadCurso('${c.id}', event)">
    <i class="fa-solid ${c.es_publico ? 'fa-eye' : 'fa-eye-slash'}"></i>
  </button>
  <button class="btn-ojo-vis" title="Eliminar curso"
    style="border-color:#fca5a5; color:#ef4444;"
    onclick="eliminarCursoDesdeGrilla('${c.id}', event)">
    <i class="fa-solid fa-trash"></i>
  </button>
</div>
      </div>
    </div>`;
  }).join("");
}
window.eliminarCursoDesdeGrilla = async function(cursoId, e) {
  e?.stopPropagation();
  const curso = estado.cursosDocente.find(c => c.id === cursoId);
  const confirmado = await confirmarAccion({
    titulo: `¿Eliminar "${curso?.nombre}"?`,
    mensaje: "Se eliminarán todos sus módulos, tareas, anuncios e inscripciones. Esta acción no se puede deshacer.",
    textoBoton: "Eliminar curso",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("cursos").delete().eq("id", cursoId);
  if (error) { mostrarToast(`No se pudo eliminar: ${error.message}`, "error"); return; }
  estado.cursosDocente = estado.cursosDocente.filter(c => c.id !== cursoId);
  renderCursos();
  mostrarToast("Curso eliminado.", "info");
};
window.toggleVisibilidadCurso = async function(cursoId, e) {
  e?.stopPropagation();
  const curso = estado.cursosDocente.find(c => c.id === cursoId);
  if (!curso) return;
  const nuevo = !curso.es_publico;
  const { error } = await supabase.from("cursos").update({ es_publico: nuevo }).eq("id", cursoId);
  if (error) { mostrarToast(`Error al cambiar visibilidad: ${error.message || "intenta de nuevo."}`, "error"); return; }

  estado.cursosDocente = estado.cursosDocente.map(c => c.id === cursoId ? { ...c, es_publico: nuevo } : c);
  if (estado.cursoActivo?.id === cursoId) estado.cursoActivo.es_publico = nuevo;
  renderCursos();

  mostrarToast(nuevo ? "Curso publicado en el inicio. 🌍" : "Curso privado. Solo con código. 🔒", nuevo ? "ok" : "info");
};

// ══ DETALLE CURSO ═════════════════════════════════════════════════════════════
window.abrirDetalle = async function(cursoId) {
  estado.cursoActivo = estado.cursosDocente.find(c => c.id === cursoId);
  if (!estado.cursoActivo) return;

  pintarHeroCurso();
  mostrarVista("detalle");

  document.querySelectorAll(".pestana-btn").forEach(b => b.classList.remove("activa"));
  document.querySelectorAll(".pestana-panel").forEach(p => p.classList.add("oculto"));
  document.querySelector(".pestana-btn[data-pestana='modulos']")?.classList.add("activa");
  document.querySelector(".pestana-panel[data-panel='modulos']")?.classList.remove("oculto");

  estado.moduloExpandidoId = null;
  await cargarModulosCurso(cursoId);
  await cargarAlumnosCurso(cursoId);
  await cargarAnunciosCurso(cursoId);
  initPestanas(cursoId);
  initAccionesCurso(cursoId);
};
function pintarHeroCurso() {
  if (!estado.cursoActivo) return;
  document.getElementById("cursoTitulo").textContent = estado.cursoActivo.nombre;
  document.getElementById("cursoDesc").textContent   = estado.cursoActivo.descripcion || "Aún no agregaste una descripción para este curso.";
  document.getElementById("cursoCodigo").textContent = estado.cursoActivo.codigo;

  const nivelEl = document.getElementById("cursoNivel");
  if (nivelEl) { nivelEl.textContent = estado.cursoActivo.nivel || "Sin nivel"; nivelEl.className = `etiqueta-nivel ${estado.cursoActivo.nivel || ""}`; }

  const fondo = document.getElementById("cursoHeroFondo");
  if (fondo) {
    fondo.style.backgroundImage = estado.cursoActivo.imagen_url
      ? `url('${estado.cursoActivo.imagen_url}')`
      : "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)";
  }

  actualizarBadgeYBotonVis();
}
function actualizarBadgeYBotonVis() {
  const badgeVis = document.getElementById("cursoVisibilidad");
  const btnVis   = document.getElementById("btnCambiarVisibilidad");
  if (!estado.cursoActivo) return;

  const esPublico = estado.cursoActivo.es_publico;

  if (badgeVis) {
    badgeVis.className = `badge-visibilidad ${esPublico ? "publico" : "privado"}`;
    badgeVis.innerHTML = `<i class="fa-solid ${esPublico ? "fa-globe" : "fa-lock"}"></i>
      ${esPublico ? "Público — aparece en el inicio" : "Con código — acceso restringido"}`;
  }
  if (btnVis) {
    btnVis.innerHTML = `<i class="fa-solid ${esPublico ? "fa-eye" : "fa-eye-slash"}"></i>`;
    btnVis.title = esPublico ? "Hacer privado" : "Hacer público";
    btnVis.classList.toggle("activo", esPublico);
  }
  pintarAlertaVisibilidad();
}
function pintarAlertaVisibilidad() {
  const el = document.getElementById("alertaVisibilidad");
  if (!el || !estado.cursoActivo) return;
  const esPublico = estado.cursoActivo.es_publico;

  el.className = `alerta-vis visible ${esPublico ? "publico" : "privado"}`;
  el.innerHTML = `
    <div class="alerta-vis-icono"><i class="fa-solid ${esPublico ? "fa-globe" : "fa-lock"}"></i></div>
    <div class="alerta-vis-texto">
      <strong>${esPublico ? "Curso público" : "Curso privado"}</strong>
      <span>${esPublico ? "Cualquiera puede verlo desde el inicio." : "Solo entra quien tenga el código del curso."}</span>
    </div>`;
}
export function initCopiaCodigo() {
  document.getElementById("btnCopiarCodigo")?.addEventListener("click", () => {
    const codigo = document.getElementById("cursoCodigo")?.textContent;
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).then(() => {
      const btn = document.getElementById("btnCopiarCodigo");
      btn.innerHTML = `<i class="fa-solid fa-check"></i>`;
      setTimeout(() => { btn.innerHTML = `<i class="fa-regular fa-copy"></i>`; }, 1500);
    });
  });
}
export function initVolverCursos() {
  document.getElementById("btnVolverCursos")?.addEventListener("click", () => mostrarVista("cursos"));
}

// ══════════════════════════════════════════════════════════════════════════════
// EDITAR CURSO (lápiz del hero)
// ══════════════════════════════════════════════════════════════════════════════
function abrirModalEditarCurso() {
  if (!estado.cursoActivo) return;
  document.getElementById("eNombre").value = estado.cursoActivo.nombre || "";
  document.getElementById("eNivel").value  = estado.cursoActivo.nivel  || "";
  document.getElementById("eDesc").value   = estado.cursoActivo.descripcion || "";

  const drop = document.getElementById("dropImagenEdit");
  const prev = document.getElementById("prevImagenEdit");
  const img  = document.getElementById("imgPreviewEdit");
  const inputImgE = document.getElementById("eImagen");
  if (inputImgE) inputImgE.value = "";
  window.__quitarImagenCurso = false;

  if (estado.cursoActivo.imagen_url) {
    img.src = estado.cursoActivo.imagen_url;
    drop.style.display = "none";
    prev.style.display = "block";
  } else {
    prev.style.display = "none";
    drop.style.display = "flex";
  }

  setErr("errENombre", ""); setErr("errENivel", "");
  document.getElementById("alertaEditarCurso").className = "alerta";

  document.getElementById("modalEditarCurso").style.display = "flex";
  document.body.style.overflow = "hidden";
}
function cerrarModalEditarCurso() {
  document.getElementById("modalEditarCurso").style.display = "none";
  document.body.style.overflow = "";
}
export function initFormEditarCurso() {
  document.getElementById("btnEditarHero")?.addEventListener("click", abrirModalEditarCurso);
  document.getElementById("btnCerrarModalEditar")?.addEventListener("click", cerrarModalEditarCurso);
  document.getElementById("btnCancelarModalEditar")?.addEventListener("click", cerrarModalEditarCurso);
  document.getElementById("modalEditarCurso")?.addEventListener("click", e => { if (e.target.id === "modalEditarCurso") cerrarModalEditarCurso(); });

  const form = document.getElementById("formEditarCurso");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!estado.cursoActivo) return;

    const nombre = document.getElementById("eNombre")?.value.trim();
    const nivel  = document.getElementById("eNivel")?.value;
    const desc   = document.getElementById("eDesc")?.value.trim();
    const alerta = document.getElementById("alertaEditarCurso");
    const btnGuardar = form.querySelector('[type="submit"]');

    let valido = true;
    if (!nombre) { setErr("errENombre", "Campo obligatorio."); valido = false; } else setErr("errENombre", "");
    if (!nivel)  { setErr("errENivel",  "Elige un nivel.");   valido = false; } else setErr("errENivel", "");
    if (!valido) return;

    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`; }

    const cambios = { nombre, nivel, descripcion: desc || null };

    const imgFile = document.getElementById("eImagen")?.files[0];
    if (imgFile) {
      const imgPath = `cursos/${estado.cursoActivo.id}/portada_${Date.now()}.${imgFile.name.split(".").pop()}`;
      const { error: errImg } = await supabase.storage.from("imagenes-cursos").upload(imgPath, imgFile, { upsert: true });
      if (!errImg) {
        const { data: imgUrl } = supabase.storage.from("imagenes-cursos").getPublicUrl(imgPath);
        cambios.imagen_url = imgUrl.publicUrl;
      }
    } else if (window.__quitarImagenCurso) {
      cambios.imagen_url = null;
    }

    const { error } = await supabase.from("cursos").update(cambios).eq("id", estado.cursoActivo.id);

    if (error) {
      mostrarAlerta(alerta, "error", "Error al guardar los cambios.");
      if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`; }
      return;
    }

    estado.cursoActivo = { ...estado.cursoActivo, ...cambios };
    estado.cursosDocente = estado.cursosDocente.map(c => c.id === estado.cursoActivo.id ? estado.cursoActivo : c);
    pintarHeroCurso();
    renderCursos();

    mostrarAlerta(alerta, "ok", "¡Curso actualizado!");
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`; }
    setTimeout(cerrarModalEditarCurso, 900);
  });
}

// ══ ALUMNOS ═══════════════════════════════════════════════════════════════════
export function initFormCrearCurso() {
  const form = document.getElementById("formCrearCurso");
  if (!form) return;
  cargarCheckEstudiantes();

  document.getElementById("buscarEstudiante")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".check-item").forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre    = document.getElementById("cNombre")?.value.trim();
    const nivel     = document.getElementById("cNivel")?.value;
    const desc      = document.getElementById("cDesc")?.value.trim();
    const esPublico = document.querySelector('input[name="cVisibilidad"]:checked')?.value === "publico";
    const alerta    = document.getElementById("alertaCrearCurso");
    const btnGuardar = form.querySelector('[type="submit"]');

    let valido = true;
    if (!nombre) { setErr("errCNombre", "Campo obligatorio."); valido = false; } else setErr("errCNombre", "");
    if (!nivel)  { setErr("errCNivel",  "Elige un nivel.");   valido = false; } else setErr("errCNivel", "");
    if (!valido) return;

    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`; }

    const { data: { user } } = await supabase.auth.getUser();
    const codigo = generarCodigo();

    const { data: cursoDB, error } = await supabase.from("cursos").insert({
      docente_id: user.id, nombre,
      descripcion: desc || null, nivel, codigo,
      es_publico: esPublico,
    }).select().single();

    if (error) {
      mostrarAlerta(alerta, "error", "Error al crear el curso.");
      if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar curso`; }
      return;
    }

    const imgFile = document.getElementById("cImagen")?.files[0];
    if (imgFile) {
      const imgPath = `cursos/${cursoDB.id}/portada_${Date.now()}.${imgFile.name.split(".").pop()}`;
      const { error: errImg } = await supabase.storage.from("imagenes-cursos").upload(imgPath, imgFile, { upsert: true });
      if (!errImg) {
        const { data: imgUrl } = supabase.storage.from("imagenes-cursos").getPublicUrl(imgPath);
        await supabase.from("cursos").update({ imagen_url: imgUrl.publicUrl }).eq("id", cursoDB.id);
        cursoDB.imagen_url = imgUrl.publicUrl;
      }
    }

    const checks = document.querySelectorAll(".check-estudiante:checked");
    if (checks.length > 0) {
      await supabase.from("inscripciones").insert(
        Array.from(checks).map(c => ({ curso_id: cursoDB.id, estudiante_id: c.value }))
      );
    }

    mostrarAlerta(alerta, "ok",
      esPublico ? `Curso creado y publicado. Código: ${codigo}` : `Curso creado. Código: ${codigo}`);
    form.reset();
    const prev = document.getElementById("prevImagen");
    const drop = document.getElementById("dropImagen");
    if (prev) prev.style.display = "none";
    if (drop) drop.style.display = "flex";

    await cargarCursos();
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar curso`; }
    setTimeout(() => {
      if (typeof cerrarModalCrearCurso === "function") cerrarModalCrearCurso();
      mostrarVista("cursos");
    }, 1500);
  });
}
function initAccionesCurso(cursoId) {
  reemplazarYEscuchar("btnPublicarAnuncio", async () => {
    const titulo    = document.getElementById("anuncioTitulo")?.value.trim();
    const contenido = document.getElementById("anuncioContenido")?.value.trim();
    const alerta    = document.getElementById("alertaAnuncio");
    const { data: { user } } = await supabase.auth.getUser();
    if (!titulo || !contenido) { mostrarAlerta(alerta, "error", "Completa título y contenido."); return; }
    const { error } = await supabase.from("anuncios").insert({ curso_id: cursoId, docente_id: user.id, titulo, contenido });
    if (error) { mostrarAlerta(alerta, "error", "Error al publicar."); return; }
    mostrarAlerta(alerta, "ok", "Anuncio publicado.");
    document.getElementById("anuncioTitulo").value    = "";
    document.getElementById("anuncioContenido").value = "";
    await cargarAnunciosCurso(cursoId);
  });

  reemplazarYEscuchar("btnCambiarVisibilidad", async () => {
    const nuevo = !estado.cursoActivo.es_publico;
    const { error } = await supabase.from("cursos").update({ es_publico: nuevo }).eq("id", estado.cursoActivo.id);
    if (error) { mostrarToast(`Error al cambiar visibilidad: ${error.message || "intenta de nuevo."}`, "error"); return; }
    estado.cursoActivo.es_publico = nuevo;
    estado.cursosDocente = estado.cursosDocente.map(c => c.id === estado.cursoActivo.id ? { ...c, es_publico: nuevo } : c);
    actualizarBadgeYBotonVis(); // ya repinta la alerta-vis con el nuevo estado
    mostrarToast(nuevo ? "Curso publicado. 🌍" : "Curso privado. Solo con código. 🔒", nuevo ? "ok" : "info");
  });

  reemplazarYEscuchar("btnEliminarCurso", async () => {
    const confirmado = await confirmarAccion({
      titulo: `¿Eliminar "${estado.cursoActivo.nombre}"?`,
      mensaje: "Se eliminarán también todos sus módulos, archivos, tareas, anuncios y la lista de estudiantes inscritos. Esta acción no se puede deshacer.",
      textoBoton: "Eliminar curso",
    });
    if (!confirmado) return;

    const { error } = await supabase.from("cursos").delete().eq("id", estado.cursoActivo.id);
    if (error) { mostrarToast(`No se pudo eliminar el curso: ${error.message || "intenta de nuevo."}`, "error"); return; }
    estado.cursosDocente = estado.cursosDocente.filter(c => c.id !== estado.cursoActivo.id);
    renderCursos();
    mostrarVista("cursos");
    mostrarToast("Curso eliminado.", "info");
  });
}

// ══ ELIMINAR ANUNCIOS ═════════════════════════════════════════════════════════
function initPestanas(cursoId) {
  document.querySelectorAll(".pestana-btn").forEach(btn => {
    const nuevo = btn.cloneNode(true); btn.replaceWith(nuevo);
  });
  document.querySelectorAll(".pestana-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pestana-btn").forEach(b => b.classList.remove("activa"));
      document.querySelectorAll(".pestana-panel").forEach(p => p.classList.add("oculto"));
      btn.classList.add("activa");
      document.querySelector(`.pestana-panel[data-panel="${btn.dataset.pestana}"]`)?.classList.remove("oculto");
      if (btn.dataset.pestana === "entregas") cargarEntregasCurso(cursoId);
    });
  });
}

// ══ CREAR CURSO (con imagen) ═══════════════════════════════════════════════════
