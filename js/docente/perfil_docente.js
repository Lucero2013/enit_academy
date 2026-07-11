import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";
import { formatFecha, mostrarAlerta, setErr } from "./utilidades_docente.js";

export async function verificarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.href = "/index.html";
}
export async function cargarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
  if (!perfil) return;
  estado.perfilActual = { ...perfil, email: user.email, created_at: user.created_at };

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
  const sideNombre = document.getElementById("sideNombre");
  if (sideNombre) sideNombre.textContent = nombreCompleto;

  const pN = document.getElementById("pNombre");
  const pA = document.getElementById("pApellido");
  const pE = document.getElementById("pEmail");
  const pD = document.getElementById("perfilDesde");
  if (pN) pN.value = perfil.nombre;
  if (pA) pA.value = perfil.apellido;
  if (pE) pE.value = user.email;
  if (pD) pD.textContent = `Miembro desde ${formatFecha(user.created_at)}`;

  // Poblar tarjeta de identidad
  const displayNombre = document.getElementById("perfilNombreDisplay");
  const displayEmail  = document.getElementById("perfilEmailDisplay");
  if (displayNombre) displayNombre.textContent = nombreCompleto;
  if (displayEmail)  displayEmail.textContent  = user.email;
}
export function initFormPerfil() {
  const form = document.getElementById("formPerfil");
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre   = document.getElementById("pNombre")?.value.trim();
    const apellido = document.getElementById("pApellido")?.value.trim();
    const clave    = document.getElementById("pClave")?.value;
    const alerta   = document.getElementById("alertaPerfil");
    let valido = true;
    if (!nombre)   { setErr("errPNombre",   "Campo obligatorio."); valido = false; } else setErr("errPNombre", "");
    if (!apellido) { setErr("errPApellido", "Campo obligatorio."); valido = false; } else setErr("errPApellido", "");
    if (clave && clave.length < 6) { setErr("errPClave", "Mínimo 6 caracteres."); valido = false; } else setErr("errPClave", "");
    if (!valido) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("perfiles").update({ nombre, apellido }).eq("id", user.id);
    if (error) { mostrarAlerta(alerta, "error", "Error al guardar."); return; }
    if (clave) {
      const { error: errC } = await supabase.auth.updateUser({ password: clave });
      if (errC) { mostrarAlerta(alerta, "error", "Perfil guardado pero error al cambiar contraseña."); return; }
    }
    mostrarAlerta(alerta, "ok", "¡Cambios guardados!");
    const sN = document.getElementById("sideNombre"); if (sN) sN.textContent = `${nombre} ${apellido}`;
  });

  document.querySelectorAll(".btn-ojo").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.objetivo);
      const icon  = btn.querySelector("i");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      icon.className = show ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  });
}

// ══ NAV ═══════════════════════════════════════════════════════════════════════
