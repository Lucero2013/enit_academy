import { estado } from "./estado_docente.js";

export function confirmarAccion({ titulo, mensaje, textoBoton = "Eliminar", icono = "fa-trash" } = {}) {
  const modal   = document.getElementById("modalConfirmar");
  const tituloE = document.getElementById("confirmarTitulo");
  const msgE    = document.getElementById("confirmarMensaje");
  const iconoE  = document.getElementById("confirmarIcono");
  const btnOk   = document.getElementById("btnConfirmarAceptar");

  if (tituloE) tituloE.textContent = titulo || "¿Estás seguro?";
  if (msgE) msgE.textContent = mensaje || "Esta acción no se puede deshacer.";
  if (iconoE) iconoE.innerHTML = `<i class="fa-solid ${icono}"></i>`;
  if (btnOk) btnOk.innerHTML = `<i class="fa-solid ${icono}"></i> ${textoBoton}`;

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  return new Promise((resolve) => {
    estado.resolverConfirmacion = resolve;
  });
}
function cerrarModalConfirmar(resultado) {
  const modal = document.getElementById("modalConfirmar");
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "";
  if (estado.resolverConfirmacion) {
    estado.resolverConfirmacion(resultado);
    estado.resolverConfirmacion = null;
  }
}
export function initModalConfirmar() {
  document.getElementById("btnConfirmarCancelar")?.addEventListener("click", () => cerrarModalConfirmar(false));
  document.getElementById("btnConfirmarAceptar")?.addEventListener("click", () => cerrarModalConfirmar(true));
  document.getElementById("modalConfirmar")?.addEventListener("click", (e) => {
    if (e.target.id === "modalConfirmar") cerrarModalConfirmar(false);
  });
}
