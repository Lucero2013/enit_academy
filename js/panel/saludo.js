/* ══ Saludo dinámico compartido (panel docente + panel estudiante) ═══════════
   Cada panel llama a iniciarSaludo(frases) con sus propias 4 frases
   (mañana / mediodía / tarde / noche). ═══════════════════════════════════ */

function iniciarSaludo(frases) {
  function aplicarSaludo() {
    const nombre = (document.getElementById("sideNombre")?.textContent || "").split(" ")[0];
    if (!nombre || nombre === "Cargando...") { setTimeout(aplicarSaludo, 300); return; }
    const h = new Date().getHours();
    const emoji = h < 12 ? "☀️" : h < 19 ? "🌤️" : "🌙";
    const gr    = h < 12 ? "¡Buenos días" : h < 19 ? "¡Buenas tardes" : "¡Buenas noches";
    const frase = frases[h < 12 ? 0 : h < 15 ? 1 : h < 19 ? 2 : 3];
    const h2 = document.getElementById("saludoH2");
    const p  = document.getElementById("saludoFrase");
    if (h2) h2.innerHTML = gr + ", <span>" + nombre + "</span>! " + emoji;
    if (p)  p.textContent = frase;
  }
  setTimeout(aplicarSaludo, 500);
}
