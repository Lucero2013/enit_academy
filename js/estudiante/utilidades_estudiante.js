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
export function mostrarAlerta(el, tipo, msg) {
  if (!el) return;
  el.className = `alerta alerta-${tipo} visible`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : tipo === "info" ? "fa-circle-info" : "fa-circle-exclamation"}"></i> ${msg}`;
  setTimeout(() => el.classList.remove("visible"), 4000);
}
export function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
export function mostrarToast(msg, tipo = "ok") {
  let t = document.getElementById("enit-toast");
  if (!t) { t = document.createElement("div"); t.id = "enit-toast"; document.body.appendChild(t); }
  t.className = `enit-toast toast-${tipo} toast-visible`;
  t.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : tipo === "error" ? "fa-circle-exclamation" : "fa-circle-info"}"></i> ${msg}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("toast-visible"), 3500);
}

// ══ MODAL ENTREGA DE TAREA ════════════════════════════════════════════════════
