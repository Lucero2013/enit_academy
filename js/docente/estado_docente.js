/* ══ Estado compartido del Panel Docente ══════════════════════════════════════
   Todos los módulos del panel importan este objeto y leen/escriben sus
   propiedades (no se puede reasignar un valor importado con `import {x}`,
   por eso el estado vive dentro de un objeto mutable en vez de variables
   sueltas). ════════════════════════════════════════════════════════════════ */

export const estado = {
  perfilActual: null,
  cursosDocente: [],
  cursoActivo: null,
  modulosActivo: [],           // módulos del curso abierto
  moduloExpandidoId: null,     // id del módulo abierto en el acordeón
  moduloContenidoId: null,     // módulo destino del modal "Agregar contenido"
  resolverConfirmacion: null,
  publicidadActual: null,
  publicidadesDocente: [],     // lista de publicidades del docente
  editandoPublicidadId: null,  // id de la publicidad que se está editando
  entregaCalificandoData: null // datos de la entrega abierta en el modal calificar
};
