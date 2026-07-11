/* ══ Botón ojo (mostrar/ocultar contraseña) — Panel Estudiante ═══════════════ */

document.addEventListener("click", e => {
  const btn = e.target.closest(".btn-ojo");
  if (!btn) return;
  const input = document.getElementById(btn.dataset.objetivo);
  if (!input) return;
  const isPass = input.type === "password";
  input.type = isPass ? "text" : "password";
  btn.querySelector("i").className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
});
