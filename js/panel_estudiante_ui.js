/* ══ UI del Panel Estudiante (reloj, saludo, botón ojo, toggle código) ═══════ */

/* ── Reloj ── */
const DIAS  = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function actualizarReloj() {
  const ahora = new Date();
  const hh = String(ahora.getHours()).padStart(2,"0");
  const mm = String(ahora.getMinutes()).padStart(2,"0");
  const ss = String(ahora.getSeconds()).padStart(2,"0");
  const elH = document.getElementById("relojHora");
  const elF = document.getElementById("relojFecha");
  if (elH) elH.textContent = hh+":"+mm+":"+ss;
  if (elF) elF.textContent = DIAS[ahora.getDay()]+", "+ahora.getDate()+" de "+MESES[ahora.getMonth()]+" "+ahora.getFullYear();
}
actualizarReloj();
setInterval(actualizarReloj, 1000);

/* ── Saludo dinámico ── */
function aplicarSaludo() {
  const nombre = (document.getElementById("sideNombre")?.textContent || "").split(" ")[0];
  if (!nombre || nombre === "Cargando...") { setTimeout(aplicarSaludo, 300); return; }
  const h = new Date().getHours();
  const emoji = h < 12 ? "☀️" : h < 19 ? "🌤️" : "🌙";
  const gr    = h < 12 ? "¡Buenos días" : h < 19 ? "¡Buenas tardes" : "¡Buenas noches";
  const frases = [
    "Sigue aprendiendo y creciendo cada día.",
    "Revisa tus tareas pendientes.",
    "Consulta los nuevos archivos de tus cursos.",
    "El aprendizaje no tiene límites. 💪"
  ];
  const frase = frases[h < 12 ? 0 : h < 15 ? 1 : h < 19 ? 2 : 3];
  const h2 = document.getElementById("saludoH2");
  const p  = document.getElementById("saludoFrase");
  if (h2) h2.innerHTML = gr + ", <span>" + nombre + "</span>! " + emoji;
  if (p)  p.textContent = frase;
}
setTimeout(aplicarSaludo, 500);

/* ── Botón ojo contraseña ── */
document.addEventListener("click", e => {
  const btn = e.target.closest(".btn-ojo");
  if (!btn) return;
  const input = document.getElementById(btn.dataset.objetivo);
  if (!input) return;
  const isPass = input.type === "password";
  input.type = isPass ? "text" : "password";
  btn.querySelector("i").className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
});

/* ── Toggle bloque "Unirse con código" en vista Disponibles ── */
document.addEventListener("DOMContentLoaded", () => {
  const btnToggle = document.getElementById("btnToggleUnirse");
  const bloque    = document.getElementById("bloqueUnirsecodigo");
  const btnCerrar = document.getElementById("btnCerrarUnirse");

  btnToggle?.addEventListener("click", () => {
    bloque.classList.toggle("visible");
    if (bloque.classList.contains("visible")) {
      bloque.scrollIntoView({ behavior: "smooth", block: "nearest" });
      document.getElementById("inputCodigo")?.focus();
    }
  });
  btnCerrar?.addEventListener("click", () => bloque.classList.remove("visible"));

  /* ── "Ver todos" en el aside → navega a la vista correspondiente ── */
  document.querySelectorAll(".aside-ver-todos[data-vista-ir]").forEach(btn => {
    btn.addEventListener("click", () => {
      const navBtn = document.querySelector(`.nav-btn[data-vista="${btn.dataset.vistaIr}"]`);
      navBtn?.click();
    });
  });
});
