import { supabase } from "../supabase.js";
import { formatFecha } from "./utilidades_estudiante.js";

let perfilActual = null; // no se lee en otro módulo, solo se guarda por si se necesita a futuro

export async function verificarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.href = "/index.html";
}

// ══ PERFIL ════════════════════════════════════════════════════════════════════
export async function cargarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!perfil) return;
  perfilActual = { ...perfil, email: user.email, created_at: user.created_at };

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
  const el = document.getElementById("sideNombre");
  if (el) el.textContent = nombreCompleto;

  const pNombreCompleto = document.getElementById("perfilNombreCompleto");
  const pEmail          = document.getElementById("perfilEmailVista");
  const pDesde          = document.getElementById("perfilDesde");
  const pNombre         = document.getElementById("pNombre");
  const pApellido       = document.getElementById("pApellido");
  const pEmailInput     = document.getElementById("pEmail");

  if (pNombreCompleto) pNombreCompleto.textContent = nombreCompleto;
  if (pEmail)          pEmail.textContent = user.email;
  if (pDesde)          pDesde.textContent = `Miembro desde ${formatFecha(user.created_at)}`;
  if (pNombre)         pNombre.value = perfil.nombre;
  if (pApellido)       pApellido.value = perfil.apellido;
  if (pEmailInput)     pEmailInput.value = user.email;
}

// ══ CARGAR TODOS LOS DATOS ════════════════════════════════════════════════════
