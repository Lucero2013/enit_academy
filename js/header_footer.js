import { supabase } from "./supabase.js";

const PANEL = {
  docente:    "/paginas/panel_docente.html",
  estudiante: "/paginas/panel_estudiante.html",
};

// ── Cargar componentes HTML ───────────────────
function cargarComponente(url, idContenedor, callback) {
  fetch(url)
    .then(r => r.text())
    .then(html => {
      const el = document.getElementById(idContenedor);
      if (!el) return;
      el.innerHTML = html;
      if (callback) setTimeout(callback, 0);
    })
    .catch(err => console.warn("Error cargando:", url, err));
}

cargarComponente("/paginas/header.html",      "header",          () => { iniciarHeader(); initModoOscuroGlobal(); });
cargarComponente("/paginas/footer.html",      "footer");
cargarComponente("/paginas/modal_login.html", "contenedor-modal");

// ── Modo oscuro GLOBAL (funciona en todas las páginas) ──────────────────────
function initModoOscuroGlobal() {
  // Sincronizar body.dark con lo que ya aplicó el script inline del <head>
  const esDark = localStorage.getItem("modoOscuro") === "true";
  aplicarModo(esDark);

  const btn = document.getElementById("modoOscuro");
  if (!btn) return;

  actualizarIconoModo(btn);

  btn.addEventListener("click", () => {
    const ahora = !document.body.classList.contains("dark");
    aplicarModo(ahora);
    localStorage.setItem("modoOscuro", ahora);
    actualizarIconoModo(btn);
  });
}

function aplicarModo(dark) {
  // body.dark  → nuestros CSS custom
  document.body.classList.toggle("dark", dark);
  // html.dark  → anti-flash en páginas sin panel
  document.documentElement.classList.toggle("dark", dark);
  // data-bs-theme → Bootstrap oscuro/claro
  document.documentElement.setAttribute("data-bs-theme", dark ? "dark" : "light");
}

function actualizarIconoModo(btn) {
  const i = btn.querySelector("i");
  if (!i) return;
  const dark = document.body.classList.contains("dark");
  i.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

// ── Header ────────────────────────────────────
function iniciarHeader() {
  const botonesAuth   = document.getElementById("botonesAuth");
  const cajaUsuario   = document.getElementById("cajaUsuario");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const rolUsuario    = document.getElementById("rolUsuario");
  const fotoUsuario   = document.getElementById("fotoUsuario");
  const dropdown      = document.getElementById("menuUsuario");
  const btnMiPanel    = document.getElementById("btnMiPanel");
  const menuAuthMovil = document.getElementById("menuAuthMovil");

  if (!botonesAuth || !cajaUsuario) return;

  // ── Cerrar sesión ──────────────────────────
  // Se registra AQUÍ, después de que el header ya está en el DOM
  document.getElementById("btnSalir")?.addEventListener("click", async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Error cerrando sesión:", err);
    }
    window.location.href = "/index.html";
  });

  // ── Ir a mi panel ──────────────────────────
  btnMiPanel?.addEventListener("click", () => {
    const href = btnMiPanel.dataset.href;
    if (href) window.location.href = href;
  });

  async function actualizarUI() {
    const { data: { session } } = await supabase.auth.getSession();
    const usuario = session?.user;

    if (usuario) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre, apellido, rol")
        .eq("id", usuario.id)
        .single();

      botonesAuth.style.display = "none";
      cajaUsuario.style.display = "flex";
      if (menuAuthMovil) menuAuthMovil.style.display = "none";

      const nombre = perfil?.nombre || "Usuario";
      const rol    = perfil?.rol    || "";

      if (nombreUsuario) nombreUsuario.textContent = nombre;
      if (rolUsuario)    rolUsuario.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
      if (fotoUsuario)   fotoUsuario.src = usuario.user_metadata?.avatar_url || "/imagenes/logo.png";
      if (btnMiPanel)    btnMiPanel.dataset.href = PANEL[rol] || PANEL.estudiante;

    } else {
      botonesAuth.style.display = "flex";
      cajaUsuario.style.display = "none";
      if (menuAuthMovil) menuAuthMovil.style.removeProperty("display");
    }
  }

  actualizarUI();
  supabase.auth.onAuthStateChange(() => actualizarUI());

  // ── Dropdown usuario ──────────────────────
  cajaUsuario.addEventListener("click", e => {
    e.stopPropagation();
    dropdown?.classList.toggle("visible");
  });
  document.addEventListener("click", () => dropdown?.classList.remove("visible"));

  // ── Menú hamburguesa ──────────────────────
  const botonMenu  = document.getElementById("botonMenu");
  const menuPpal   = document.getElementById("menuPrincipal");
  const fondoMenu  = document.getElementById("fondoMenu");
  const cerrarMenu = document.getElementById("cerrarMenu");

  const abrirMenu = () => {
    menuPpal?.classList.add("abierto");
    fondoMenu?.classList.add("visible");
    botonMenu?.classList.add("activo");
    botonMenu?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const ocultarMenu = () => {
    menuPpal?.classList.remove("abierto");
    fondoMenu?.classList.remove("visible");
    botonMenu?.classList.remove("activo");
    botonMenu?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.querySelectorAll(".tiene-submenu.abierto")
      .forEach(el => el.classList.remove("abierto"));
  };

  botonMenu?.addEventListener("click",  e => { e.stopPropagation(); menuPpal?.classList.contains("abierto") ? ocultarMenu() : abrirMenu(); });
  fondoMenu?.addEventListener("click",  ocultarMenu);
  cerrarMenu?.addEventListener("click", ocultarMenu);
  document.addEventListener("keydown",  e => { if (e.key === "Escape") ocultarMenu(); });
  window.addEventListener("resize",     () => { if (window.innerWidth > 768) ocultarMenu(); });

  // ── Submenús táctiles ─────────────────────
  document.querySelectorAll(".tiene-submenu > a").forEach(link => {
    link.addEventListener("click", e => {
      if (window.innerWidth > 768) return;
      e.preventDefault();
      const padre = link.closest(".tiene-submenu");
      const estaAbierto = padre.classList.contains("abierto");
      padre.closest("ul")
        ?.querySelectorAll(":scope > .tiene-submenu.abierto")
        .forEach(otro => { if (otro !== padre) otro.classList.remove("abierto"); });
      padre.classList.toggle("abierto", !estaAbierto);
    });
  });
}

