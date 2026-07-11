/* ══ Panel Docente — orquestador ══════════════════════════════════════════════
   Este archivo solo arranca el panel: importa las funciones "init"/"cargar" de
   cada módulo (js/docente/) y las llama en orden al cargar la página. Toda la
   lógica real vive en los módulos por dominio dentro de js/docente/. ═════════ */

import { verificarSesion, cargarPerfil, initFormPerfil } from "./docente/perfil_docente.js";
import { cargarCursos, initFormCrearCurso, initFormEditarCurso, initCopiaCodigo, initVolverCursos } from "./docente/cursos_docente.js";
import { initNav, initSidebar, initCerrarSesion, initVistaEstudiante } from "./docente/sidebar_nav_docente.js";
import { initModalesModulo } from "./docente/modulos_docente.js";
import { initModalConfirmar } from "./docente/modal_confirmar.js";
import { cargarPublicidad, initFormPublicidad } from "./docente/publicidad_docente.js";
import { initModalCalificar } from "./docente/entregas_docente.js";

window.addEventListener("DOMContentLoaded", async () => {
  await verificarSesion();
  await cargarPerfil();
  await cargarCursos();
  initNav();
  initSidebar();
  initCerrarSesion();
  initFormCrearCurso();
  initFormEditarCurso();
  initFormPerfil();
  initVistaEstudiante();
  initCopiaCodigo();
  initVolverCursos();
  initModalesModulo();
  initModalConfirmar();
  initFormPublicidad();
  cargarPublicidad();
  initModalCalificar();
});
