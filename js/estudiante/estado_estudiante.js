/* ══ Estado compartido del Panel Estudiante ═══════════════════════════════════
   cursosInscritos se lee/escribe desde varios módulos (inicio, detalle de
   curso, cursos disponibles), por eso vive en un objeto mutable en vez de
   una variable suelta (no se puede reasignar un valor importado). ═════════ */

export const estado = {
  cursosInscritos: []
};
