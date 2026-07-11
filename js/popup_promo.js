/* ══ Popup promocional — CARRUSEL — index.html ════════════════════════════════
   Carga TODAS las publicidades activas (de todos los docentes) y las muestra
   como un carrusel dentro del popup emergente. Aparece en cada visita/recarga.
   ════════════════════════════════════════════════════════════════════════ */

import { supabase } from "./supabase.js";

let publicidades = [];
let indiceActual = 0;
let intervaloAuto = null;

window.addEventListener("DOMContentLoaded", async () => {
  const { data, error } = await supabase
    .from("publicidad")
    .select("*")
    .eq("activa", true)
    .order("creado_at", { ascending: false });

  if (error || !data || data.length === 0) return;

  publicidades = data;
  pintarPopup();
});

function pintarPopup() {
  const cont = document.getElementById("popupPromo");
  if (!cont) return;

  const pub = publicidades[indiceActual];
  const enlace = pub.link_destino || "#cursos";
  const haySeveral = publicidades.length > 1;

  cont.innerHTML = `
    <div style="background:#fff;border-radius:24px;max-width:680px;width:100%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25);animation:slideUpPopup .35s ease;position:relative;">
      <div style="position:relative;">
        <img src="${pub.imagen_url}" alt="${pub.titulo}" style="width:100%;height:340px;object-fit:cover;display:block;">
        <button onclick="cerrarPopup()" style="position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.45);border:none;color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">✕</button>

        ${haySeveral ? `
          <button onclick="popupAnterior()" style="position:absolute;top:50%;left:12px;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(0,0,0,.4);border:none;color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">‹</button>
          <button onclick="popupSiguiente()" style="position:absolute;top:50%;right:12px;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(0,0,0,.4);border:none;color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">›</button>
        ` : ""}
      </div>
      <div style="padding:2.2rem 2.4rem 1.4rem;">
        <h2 style="font-family:'Paytone One',sans-serif;font-size:1.9rem;color:#2a1a33;margin-bottom:.8rem;">${pub.titulo}</h2>
        ${pub.contenido ? `<p style="color:#6b5478;font-size:1.05rem;line-height:1.65;margin-bottom:1.5rem;">${pub.contenido}</p>` : ""}
        <div style="display:flex;gap:.9rem;flex-wrap:wrap;">
          <a href="${enlace}" onclick="cerrarPopup()" style="flex:1;text-align:center;padding:.95rem 1.4rem;background:linear-gradient(135deg,#ff4fa0,#8b5cf6);color:#fff;border-radius:50px;font-weight:800;font-size:1rem;text-decoration:none;">Ver</a>
          <button onclick="cerrarPopup()" style="flex:1;padding:.95rem 1.4rem;border:1.5px solid #e0d0e8;background:#fff;color:#6b5478;border-radius:50px;font-weight:700;font-size:1rem;cursor:pointer;">Ahora no</button>
        </div>
      </div>
      ${haySeveral ? `
        <div style="display:flex;justify-content:center;gap:.5rem;padding-bottom:1.4rem;">
          ${publicidades.map((_, i) => `
            <span style="width:${i === indiceActual ? '22px' : '8px'};height:8px;border-radius:50px;background:${i === indiceActual ? '#ff4fa0' : '#e8d8e6'};transition:all .25s;display:inline-block;"></span>
          `).join("")}
        </div>
      ` : ""}
    </div>`;

  cont.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeInOverlay .3s ease;";

  cont.addEventListener("click", e => {
    if (e.target.id === "popupPromo") cerrarPopup();
  });

  reiniciarAutoRotacion();
}

function reiniciarAutoRotacion() {
  clearInterval(intervaloAuto);
  if (publicidades.length > 1) {
    intervaloAuto = setInterval(() => window.popupSiguiente(), 6000);
  }
}

window.popupSiguiente = function () {
  indiceActual = (indiceActual + 1) % publicidades.length;
  pintarPopup();
};

window.popupAnterior = function () {
  indiceActual = (indiceActual - 1 + publicidades.length) % publicidades.length;
  pintarPopup();
};

window.cerrarPopup = function () {
  clearInterval(intervaloAuto);
  const p = document.getElementById("popupPromo");
  if (p) {
    p.style.opacity = "0";
    p.style.transition = "opacity .25s";
    setTimeout(() => { p.style.display = "none"; p.innerHTML = ""; }, 250);
  }
};

// Cerrar con ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") window.cerrarPopup();
});