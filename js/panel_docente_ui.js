/* ══ UI del Panel Docente (modales, reloj, saludo, tabs) ═════════════════════ */

/* ── Modal crear curso ── */
function abrirModalCrearCurso() {
  document.getElementById("modalCrearCurso").style.display = "flex";
  document.body.style.overflow = "hidden";
}
function cerrarModalCrearCurso() {
  document.getElementById("modalCrearCurso").style.display = "none";
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnCerrarModalCurso")?.addEventListener("click", cerrarModalCrearCurso);
  document.getElementById("btnCancelarModalCurso")?.addEventListener("click", cerrarModalCrearCurso);
  document.getElementById("modalCrearCurso")?.addEventListener("click", e => {
    if (e.target.id === "modalCrearCurso") cerrarModalCrearCurso();
  });

  /* ── Preview imagen (crear curso) ── */
  const inputImg  = document.getElementById("cImagen");
  const drop      = document.getElementById("dropImagen");
  const prev      = document.getElementById("prevImagen");
  const imgPrev   = document.getElementById("imgPreview");
  const btnQuitar = document.getElementById("btnQuitarImg");

  function mostrarPreview(file, imgEl, dropEl, prevEl) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    imgEl.src = url;
    dropEl.style.display = "none";
    prevEl.style.display = "block";
  }

  inputImg?.addEventListener("change", e => mostrarPreview(e.target.files[0], imgPrev, drop, prev));
  drop?.addEventListener("click", () => inputImg?.click());
  drop?.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("drag-over"); });
  drop?.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
  drop?.addEventListener("drop", e => {
    e.preventDefault(); drop.classList.remove("drag-over");
    mostrarPreview(e.dataTransfer.files[0], imgPrev, drop, prev);
    inputImg.files = e.dataTransfer.files;
  });
  btnQuitar?.addEventListener("click", () => {
    inputImg.value = ""; prev.style.display = "none"; drop.style.display = "flex";
  });

  /* ── Preview imagen (editar curso) ── */
  const inputImgE = document.getElementById("eImagen");
  const dropE     = document.getElementById("dropImagenEdit");
  const prevE     = document.getElementById("prevImagenEdit");
  const imgPrevE  = document.getElementById("imgPreviewEdit");
  const btnQuitarE = document.getElementById("btnQuitarImgEdit");

  inputImgE?.addEventListener("change", e => mostrarPreview(e.target.files[0], imgPrevE, dropE, prevE));
  dropE?.addEventListener("click", () => inputImgE?.click());
  dropE?.addEventListener("dragover", e => { e.preventDefault(); dropE.classList.add("drag-over"); });
  dropE?.addEventListener("dragleave", () => dropE.classList.remove("drag-over"));
  dropE?.addEventListener("drop", e => {
    e.preventDefault(); dropE.classList.remove("drag-over");
    mostrarPreview(e.dataTransfer.files[0], imgPrevE, dropE, prevE);
    inputImgE.files = e.dataTransfer.files;
  });
  btnQuitarE?.addEventListener("click", () => {
    inputImgE.value = ""; prevE.style.display = "none"; dropE.style.display = "flex";
    window.__quitarImagenCurso = true;
  });

  /* ── Tabs crear curso (asignar estudiantes) ── */
  document.addEventListener("click", function(e) {
    const btn = e.target.closest(".tab-asignar");
    if (!btn) return;
    document.querySelectorAll(".tab-asignar").forEach(b => b.classList.remove("activo-tab"));
    document.querySelectorAll(".panel-tab").forEach(p => p.classList.add("oculto"));
    btn.classList.add("activo-tab");
    document.getElementById("panel-" + btn.dataset.panelTab)?.classList.remove("oculto");
  });

  /* ── Tabs contenido módulo (texto/archivo/tarea) ── */
  document.addEventListener("click", function(e) {
    const btn = e.target.closest(".tab-cont");
    if (!btn) return;
    document.querySelectorAll(".tab-cont").forEach(b => b.classList.remove("activo-tab"));
    document.querySelectorAll(".cont-panel").forEach(p => p.classList.add("oculto"));
    btn.classList.add("activo-tab");
    document.querySelector(`.cont-panel[data-cont-panel="${btn.dataset.cont}"]`)?.classList.remove("oculto");
  });

  /* ESC cierra todos los modales */
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const modalConfirmar = document.getElementById("modalConfirmar");
    if (modalConfirmar && modalConfirmar.style.display === "flex") {
      document.getElementById("btnConfirmarCancelar")?.click();
      return;
    }
    document.querySelectorAll(".modal-overlay").forEach(m => m.style.display = "none");
    document.body.style.overflow = "";
  });

  /* ── Reloj ── */
  const DIAS  = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  function actualizarReloj() {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2,"0");
    const mm = String(ahora.getMinutes()).padStart(2,"0");
    const ss = String(ahora.getSeconds()).padStart(2,"0");
    const elH = document.getElementById("relojHora");
    const elF = document.getElementById("relojFecha");
    if (elH) elH.textContent = hh+":"+mm+":"+ss;
    if (elF) elF.textContent = DIAS[ahora.getDay()]+", "+ahora.getDate()+" de "+MESES[ahora.getMonth()]+" "+ahora.getFullYear();
  }
  actualizarReloj();
  setInterval(actualizarReloj, 1000);

  /* ── Saludo ── */
  function aplicarSaludo() {
    const nombre = (document.getElementById("sideNombre")?.textContent || "").split(" ")[0];
    if (!nombre || nombre === "Cargando...") { setTimeout(aplicarSaludo, 300); return; }
    const h = new Date().getHours();
    const emoji = h < 12 ? "☀️" : h < 19 ? "🌤️" : "🌙";
    const gr    = h < 12 ? "¡Buenos días" : h < 19 ? "¡Buenas tardes" : "¡Buenas noches";
    const frases = [
      "Empieza el día revisando tus cursos.",
      "Recuerda revisar las entregas de tus estudiantes.",
      "Buen momento para publicar un anuncio.",
      "Gracias por dedicar tu tiempo a enseñar. 💪"
    ];
    const frase = frases[h < 12 ? 0 : h < 15 ? 1 : h < 19 ? 2 : 3];
    const h2 = document.getElementById("saludoH2");
    const p  = document.getElementById("saludoFrase");
    if (h2) h2.innerHTML = gr + ", <span>" + nombre + "</span>! " + emoji;
    if (p)  p.textContent = frase;
  }
  setTimeout(aplicarSaludo, 500);
});
