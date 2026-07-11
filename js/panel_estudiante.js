/* ══ Panel Estudiante — orquestador ═══════════════════════════════════════════
   Este archivo solo arranca el panel: importa las funciones "init"/"cargar" de
   cada módulo (js/estudiante/) y las llama en orden al cargar la página. Toda
   la lógica real vive en los módulos por dominio dentro de js/estudiante/. ═══ */

import { mostrarBannerPreview, cargarDatosPreview } from "./estudiante/preview_docente_estudiante.js";
import { verificarSesion, cargarPerfil } from "./estudiante/perfil_estudiante.js";
import { cargarDatos } from "./estudiante/inicio_estudiante.js";
import { initNav, initSidebar, initCerrarSesion, initBloqueUnirseToggle, initAsideVerTodos } from "./estudiante/sidebar_nav_estudiante.js";
import { initVolverDetalleCurso } from "./estudiante/curso_detalle_estudiante.js";

const URL_PARAMS      = new URLSearchParams(window.location.search);
const PREVIEW_DOCENTE = URL_PARAMS.get("preview_docente");

window.addEventListener("DOMContentLoaded", async () => {
  if (PREVIEW_DOCENTE) {
    mostrarBannerPreview();
    await cargarDatosPreview(PREVIEW_DOCENTE);
  } else {
    await verificarSesion();
    await cargarPerfil();
    await cargarDatos();
  }
  initNav();
  initSidebar();
  initCerrarSesion();
  initVolverDetalleCurso();
  initBloqueUnirseToggle();
  initAsideVerTodos();
});
