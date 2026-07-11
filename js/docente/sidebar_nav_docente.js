import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";

export function initVistaEstudiante() {
  const abrirVista = () => {
    if (!estado.perfilActual?.id) return;
    window.open(`/paginas/panel_estudiante.html?preview_docente=${estado.perfilActual.id}`, "_blank");
  };
  // Botón flotante (esquina superior)
  document.getElementById("btnVistaEstudiante")?.addEventListener("click", abrirVista);
  // Botón del sidebar (reemplaza cerrar sesión)
  document.getElementById("btnVistaEstudianteSidebar")?.addEventListener("click", abrirVista);
}

// ══ PERFIL ════════════════════════════════════════════════════════════════════
export function initNav() {
  document.querySelectorAll(".nav-btn[data-vista]").forEach(btn => {
    btn.addEventListener("click", () => {
      const vista = btn.dataset.vista;
      if (vista === "crear") {
        if (typeof abrirModalCrearCurso === "function") abrirModalCrearCurso();
        cerrarSidebar(); return;
      }
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
      mostrarVista(vista);
      cerrarSidebar();
    });
  });
}
export function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  document.getElementById(`vista-${nombre}`)?.classList.remove("oculto");
}
function cerrarSidebar() {
  document.querySelector(".panel-sidebar")?.classList.remove("abierto");
  document.getElementById("fondoSidebar")?.classList.remove("activo");
}
export function initSidebar() {
  document.getElementById("btnAbrirSidebar")?.addEventListener("click", () => {
    document.querySelector(".panel-sidebar")?.classList.toggle("abierto");
    document.getElementById("fondoSidebar")?.classList.toggle("activo");
  });
  document.getElementById("fondoSidebar")?.addEventListener("click", cerrarSidebar);
}
export function initCerrarSesion() {
  document.getElementById("btnCerrarSesion2")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
}

// ══ UTILS ═════════════════════════════════════════════════════════════════════
