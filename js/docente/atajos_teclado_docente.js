/* ══ Atajos de teclado — Panel Docente (ESC cierra modales) ══════════════════ */

document.addEventListener("DOMContentLoaded", () => {
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
});
