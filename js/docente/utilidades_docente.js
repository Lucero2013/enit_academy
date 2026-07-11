export function reemplazarYEscuchar(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  const nuevo = el.cloneNode(true);
  el.replaceWith(nuevo);
  nuevo.addEventListener("click", fn);
}
export function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
export function formatFecha(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}
export function urgencia(fecha) {
  if (!fecha) return "";
  const diff = (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "vencida";
  if (diff < 2) return "urgente";
  return "";
}

// ══ MODAL DE CONFIRMACIÓN (reemplaza confirm() nativo) ═══════════════════════
export function mostrarAlerta(el, tipo, msg) {
  if (!el) return;
  el.className = `alerta alerta-${tipo} visible`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${msg}`;
  setTimeout(() => el.classList.remove("visible"), 4000);
}
export function mostrarToast(msg, tipo = "ok") {
  let t = document.getElementById("enit-toast");
  if (!t) { t = document.createElement("div"); t.id = "enit-toast"; document.body.appendChild(t); }
  t.className = `enit-toast toast-${tipo} toast-visible`;
  t.innerHTML = `<i class="fa-solid ${tipo==="ok"?"fa-circle-check":tipo==="error"?"fa-circle-exclamation":"fa-circle-info"}"></i> ${msg}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("toast-visible"), 3500);
}
export function setErr(id, msg) {
  const el = document.getElementById(id); if (el) el.textContent = msg;
}

// ══ ENTREGAS POR CURSO ════════════════════════════════════════════════════════
