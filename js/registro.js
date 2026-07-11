import { supabase } from "./supabase.js";


let rolActual = null;

const ROL_ICONOS = {
  estudiante: "fa-user-graduate",
  docente:    "fa-chalkboard-teacher",
};

window.elegirRol = function (card) {
  document.querySelectorAll(".rol-card").forEach(c => c.classList.remove("seleccionado"));
  card.classList.add("seleccionado");
  rolActual = card.dataset.rol;
  document.getElementById("btnContinuar").disabled = false;
};

window.mostrarFormulario = function () {
  if (!rolActual) return;
  const texto = rolActual.charAt(0).toUpperCase() + rolActual.slice(1);
  document.getElementById("badgeTexto").textContent = texto;
  document.getElementById("badgeIcono").className   = "fa-solid " + ROL_ICONOS[rolActual];
  document.getElementById("rolSeleccionado").value  = rolActual;
  document.getElementById("stepRol").classList.add("paso-oculto");
  document.getElementById("stepForm").classList.remove("paso-oculto");
};

window.volverARol = function () {
  document.getElementById("stepForm").classList.add("paso-oculto");
  document.getElementById("stepRol").classList.remove("paso-oculto");
};

// ══ Ojito ════════════════════════════════════════════════════════════════════

function initTogglePassword() {
  document.querySelectorAll(".alternar-clave").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrapper").querySelector("input");
      const icon  = btn.querySelector("i");
      const show  = input.type === "password";
      input.type     = show ? "text" : "password";
      icon.className = show ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
      btn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  });
}

// ══ Feedback ═════════════════════════════════════════════════════════════════

function setFieldError(fieldName, mensaje) {
  const input = document.querySelector(`input[name="${fieldName}"]`);
  if (!input) return;
  const small = input.closest(".grupo-input")?.querySelector(".error");
  if (!small) return;
  small.textContent = mensaje;
  input.addEventListener("input", () => { small.textContent = ""; }, { once: true });
}

function clearErrors() {
  document.querySelectorAll(".grupo-input .error").forEach(el => { el.textContent = ""; });
}

function mostrarAlerta(tipo, mensaje) {
  const alerta = document.getElementById("formAlerta");
  alerta.className = `form-alerta visible alerta-${tipo}`;
  alerta.innerHTML = `
    <i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i>
    <span>${mensaje}</span>
  `;
}

function ocultarAlerta() {
  const alerta = document.getElementById("formAlerta");
  alerta.className = "form-alerta";
  alerta.innerHTML = "";
}

// ══ Submit ════════════════════════════════════════════════════════════════════

window.addEventListener("DOMContentLoaded", () => {
  initTogglePassword();

  const form = document.getElementById("registerForm");
  if (!form) { console.error("❌ No se encontró registerForm"); return; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    ocultarAlerta();

    const rol       = document.getElementById("rolSeleccionado").value.trim();
    const nombre    = form.querySelector('[name="nombre"]').value.trim();
    const apellido  = form.querySelector('[name="apellido"]').value.trim();
    const email     = form.querySelector('[name="email"]').value.trim();
    const password  = form.querySelector('[name="password"]').value;
    const confirmar = form.querySelector('[name="confirmar"]').value;

    // ── Validaciones ─────────────────────────────────────────────────────────
    let valido = true;

    if (!rol) { mostrarAlerta("error", "Por favor elige tu rol antes de continuar."); return; }
    if (!nombre)   { setFieldError("nombre",   "El nombre es obligatorio.");   valido = false; }
    if (!apellido) { setFieldError("apellido", "El apellido es obligatorio."); valido = false; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email)                       { setFieldError("email", "El correo es obligatorio.");  valido = false; }
    else if (!emailRegex.test(email)) { setFieldError("email", "Ingresa un correo válido.");  valido = false; }

    if (!password)                { setFieldError("password", "La contraseña es obligatoria."); valido = false; }
    else if (password.length < 6) { setFieldError("password", "Mínimo 6 caracteres.");          valido = false; }

    if (!confirmar)                  { setFieldError("confirmar", "Confirma tu contraseña.");        valido = false; }
    else if (password !== confirmar) { setFieldError("confirmar", "Las contraseñas no coinciden."); valido = false; }

    if (!valido) return;

    // ── Registro ─────────────────────────────────────────────────────────────
    const btn = document.getElementById("btnRegister");
    btn.disabled    = true;
    btn.textContent = "Registrando...";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, apellido, rol },
      },
    });

    btn.disabled    = false;
    btn.textContent = "Registrarme";

    if (error) {
      console.error(error);
      const msgs = {
        "User already registered":   "Este correo ya está registrado. Intenta iniciar sesión.",
        "Email rate limit exceeded": "Demasiados intentos. Espera unos minutos.",
      };
      mostrarAlerta("error", msgs[error.message] || error.message);
      return;
    }

    if (data?.user && data.user.identities?.length === 0) {
      mostrarAlerta("error", "Este correo ya está registrado. Intenta iniciar sesión.");
      return;
    }

    // ── Guardar email en perfiles ─────────────────────────────────────────────
    if (data?.user?.id) {
      await supabase
        .from("perfiles")
        .update({ email })
        .eq("id", data.user.id);
    }

    // ── Éxito → redirigir a verificación ─────────────────────────────────────
    sessionStorage.setItem("pending_email", email);
    window.location.href = "/paginas/verificar-email.html";
  });
});

window.addEventListener("error", e => {
  console.error("ERROR GLOBAL:", e.error);
});

window.addEventListener("unhandledrejection", e => {
  console.error("PROMESA FALLIDA:", e.reason);
});