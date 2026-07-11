import { supabase } from "../supabase.js";
import { cargarDatos } from "./inicio_estudiante.js";
import { mostrarAlerta, mostrarToast, setErr } from "./utilidades_estudiante.js";

export function initNav() {
  document.querySelectorAll(".nav-btn[data-vista]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
      document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
      btn.classList.add("activo");
      document.getElementById(`vista-${btn.dataset.vista}`)?.classList.remove("oculto");
      document.querySelector(".panel-sidebar")?.classList.remove("abierto");
      document.getElementById("fondoSidebar")?.classList.remove("activo");
    });
  });
}
export function initSidebar() {
  const btnAbrir = document.getElementById("btnAbrirSidebar");
  const sidebar  = document.querySelector(".panel-sidebar");
  const fondo    = document.getElementById("fondoSidebar");

  btnAbrir?.addEventListener("click", () => {
    sidebar?.classList.toggle("abierto");
    fondo?.classList.toggle("activo");
  });
  fondo?.addEventListener("click", () => {
    sidebar?.classList.remove("abierto");
    fondo?.classList.remove("activo");
  });
}
export function initCerrarSesion() {
  document.getElementById("btnCerrarSesion3")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
}

// ══ UTILS ═════════════════════════════════════════════════════════════════════
export function initBloqueUnirseToggle() {
  const btnAbrir   = document.getElementById("btnToggleUnirse");
  const overlay    = document.getElementById("modalCodigoOverlay");
  const btnCerrar  = document.getElementById("btnCerrarModalCodigo");
  const btnCancelar = document.getElementById("btnCancelarModalCodigo");

  const abrir = () => {
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("inputCodigo")?.focus(), 100);
  };

  const cerrar = () => {
    overlay.style.display = "none";
    document.body.style.overflow = "";
    document.getElementById("inputCodigo").value = "";
    document.getElementById("errCodigo").textContent = "";
    document.getElementById("alertaCodigo").className = "alerta";
  };

  btnAbrir?.addEventListener("click", abrir);
  btnCerrar?.addEventListener("click", cerrar);
  btnCancelar?.addEventListener("click", cerrar);
  overlay?.addEventListener("click", e => {
    if (e.target === overlay) cerrar();
  });
}

// ══ "VER TODOS" en el aside → navega a la vista correspondiente ═══════════════
export function initAsideVerTodos() {
  document.querySelectorAll(".aside-ver-todos[data-vista-ir]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(`.nav-btn[data-vista="${btn.dataset.vistaIr}"]`)?.click();
    });
  });
}

// ══ FORMULARIO UNIRSE CON CÓDIGO ══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCodigo");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const codigo    = document.getElementById("inputCodigo")?.value.trim().toUpperCase();
    const alerta    = document.getElementById("alertaCodigo");
    const errCodigo = document.getElementById("errCodigo");

    if (!codigo) { if (errCodigo) errCodigo.textContent = "Ingresa un código."; return; }
    if (errCodigo) errCodigo.textContent = "";

    const { data: { user } } = await supabase.auth.getUser();

    const { data: curso, error: errBuscar } = await supabase
      .from("cursos").select("id, nombre").eq("codigo", codigo).single();

    if (errBuscar || !curso) {
      mostrarAlerta(alerta, "error", "Código incorrecto. Verifica con tu docente.");
      return;
    }

    const { data: yaInscrito } = await supabase
      .from("inscripciones").select("id")
      .eq("curso_id", curso.id).eq("estudiante_id", user.id).single();

    if (yaInscrito) { mostrarAlerta(alerta, "info", "Ya estás inscrito en este curso."); return; }

    const { error: errInscribir } = await supabase
      .from("inscripciones").insert({ curso_id: curso.id, estudiante_id: user.id });

    if (errInscribir) { mostrarAlerta(alerta, "error", "No se pudo inscribir. Intenta de nuevo."); return; }

    mostrarAlerta(alerta, "ok", `¡Te uniste a "${curso.nombre}" exitosamente!`);
    document.getElementById("inputCodigo").value = "";

    // Cerrar el bloque y recargar datos
    document.getElementById("bloqueUnirsecodigo")?.classList.remove("visible");
    await cargarDatos();
    mostrarToast(`¡Bienvenida a "${curso.nombre}"! 🎉`, "ok");
  });
});

// ══ PERFIL FORM ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
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
    const { error: errPerfil } = await supabase.from("perfiles").update({ nombre, apellido }).eq("id", user.id);
    if (errPerfil) { mostrarAlerta(alerta, "error", "No se pudo actualizar el perfil."); return; }

    if (clave) {
      const { error: errClave } = await supabase.auth.updateUser({ password: clave });
      if (errClave) { mostrarAlerta(alerta, "error", "Perfil guardado, pero error al cambiar contraseña."); return; }
    }

    mostrarAlerta(alerta, "ok", "¡Cambios guardados correctamente!");
    document.getElementById("sideNombre").textContent = `${nombre} ${apellido}`;
    document.getElementById("perfilNombreCompleto").textContent = `${nombre} ${apellido}`;
  });
});

// ══ NAV SIDEBAR ═══════════════════════════════════════════════════════════════
