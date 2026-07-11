import { supabase } from "./supabase.js";

const formulario   = document.getElementById("formulario");
const estadoExito  = document.getElementById("estadoExito");
const btnGuardar   = document.getElementById("btnGuardar");
const inputNueva   = document.getElementById("nuevaClave");
const inputConfirm = document.getElementById("confirmarClave");
const errNueva     = document.getElementById("errNueva");
const errConfirmar = document.getElementById("errConfirmar");
const alerta       = document.getElementById("alerta");

// ── Expiración de 10 minutos ───────────────────
const LIMITE_MS = 10 * 60 * 1000; // 10 minutos

const timerExpiracion = setTimeout(() => {
  // Deshabilitar todo el formulario
  if (inputNueva)   inputNueva.disabled   = true;
  if (inputConfirm) inputConfirm.disabled = true;
  if (btnGuardar)   btnGuardar.disabled   = true;

  mostrarAlerta("error", "⏱ El tiempo para restablecer tu contraseña ha expirado. Solicita un nuevo enlace.");
}, LIMITE_MS);


supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    console.log("Modo recuperación de contraseña activo");
  }

  if (event === "SIGNED_IN" && session) {
    const { data: perfil } = await supabase
      .from("perfiles").select("rol").eq("id", session.user.id).single();
    const RUTAS = {
      docente:    "/paginas/panel_docente.html",
      estudiante: "/paginas/panel_estudiante.html",
    };
    if (!window.location.hash.includes("type=recovery")) {
      window.location.href = RUTAS[perfil?.rol] ?? RUTAS.estudiante;
    }
  }
});

// ── Requisitos visuales ───────────────────────
inputNueva?.addEventListener("input", () => {
  const val = inputNueva.value;
  toggle("reqLongitud",  val.length >= 6);
  toggle("reqMayuscula", /[A-Z]/.test(val));
  toggle("reqNumero",    /[0-9]/.test(val));
});

function toggle(id, cumple) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("cumple", cumple);
  el.querySelector("i").className = cumple
    ? "fa-solid fa-circle-check"
    : "fa-regular fa-circle";
}

// ── Ojito ──────────────────────────────────────
document.querySelectorAll(".btn-ojo").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.objetivo);
    if (!input) return;
    const ver = input.type === "password";
    input.type = ver ? "text" : "password";
    btn.querySelector("i").className = ver
      ? "fa-regular fa-eye-slash"
      : "fa-regular fa-eye";
  });
});

// ── Guardar nueva contraseña ───────────────────
btnGuardar?.addEventListener("click", async () => {
  errNueva.textContent     = "";
  errConfirmar.textContent = "";
  ocultarAlerta();

  const nueva     = inputNueva.value;
  const confirmar = inputConfirm.value;

  let valido = true;

  if (!nueva)                { errNueva.textContent = "Ingresa una contraseña.";  valido = false; }
  else if (nueva.length < 6) { errNueva.textContent = "Mínimo 6 caracteres.";    valido = false; }

  if (!confirmar)               { errConfirmar.textContent = "Confirma la contraseña.";       valido = false; }
  else if (nueva !== confirmar) { errConfirmar.textContent = "Las contraseñas no coinciden."; valido = false; }

  if (!valido) return;

  setLoading(true);

  const { error } = await supabase.auth.updateUser({ password: nueva });

  if (error) {
    setLoading(false);
    mostrarAlerta("error", error.message);
    return;
  }

  // Éxito — cancelar el timer y mostrar pantalla de confirmación
  clearTimeout(timerExpiracion);
  formulario.style.display  = "none";
  estadoExito.style.display = "flex";
});

// ── Helpers botón (cargando + label, igual que verificar-email) ─
function setLoading(on) {
  btnGuardar.classList.toggle("loading", on);
  btnGuardar.disabled = on;
  if (inputNueva)   inputNueva.disabled   = on;
  if (inputConfirm) inputConfirm.disabled = on;
}

// ── Helpers alerta (clases .retroalimentacion / .error / .success) ─────
function mostrarAlerta(tipo, msg) {
  alerta.className = `retroalimentacion ${tipo === "ok" ? "success" : "error"}`;
  alerta.textContent = msg;
}
function ocultarAlerta() {
  alerta.className = "retroalimentacion";
  alerta.textContent = "";
}

window.addEventListener("error", e => {
  console.error("ERROR GLOBAL:", e.error);
});

window.addEventListener("unhandledrejection", e => {
  console.error("PROMESA FALLIDA:", e.reason);
});