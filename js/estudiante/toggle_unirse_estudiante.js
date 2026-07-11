/* ══ Bloque "Unirse con código" + navegación "Ver todos" — Panel Estudiante ══ */

document.addEventListener("DOMContentLoaded", () => {
  const btnToggle = document.getElementById("btnToggleUnirse");
  const bloque    = document.getElementById("bloqueUnirsecodigo");
  const btnCerrar = document.getElementById("btnCerrarUnirse");

  btnToggle?.addEventListener("click", () => {
    bloque.classList.toggle("visible");
    if (bloque.classList.contains("visible")) {
      bloque.scrollIntoView({ behavior: "smooth", block: "nearest" });
      document.getElementById("inputCodigo")?.focus();
    }
  });
  btnCerrar?.addEventListener("click", () => bloque.classList.remove("visible"));

  /* ── "Ver todos" en el aside → navega a la vista correspondiente ── */
  document.querySelectorAll(".aside-ver-todos[data-vista-ir]").forEach(btn => {
    btn.addEventListener("click", () => {
      const navBtn = document.querySelector(`.nav-btn[data-vista="${btn.dataset.vistaIr}"]`);
      navBtn?.click();
    });
  });
});
