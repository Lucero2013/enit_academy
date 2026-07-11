/* ══ Modal crear/editar curso — preview de imagen (Panel Docente) ═══════════ */

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
});
