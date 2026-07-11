/* ══ Tabs del Panel Docente (asignar estudiantes / contenido de módulo) ══════ */

document.addEventListener("DOMContentLoaded", () => {

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
});
