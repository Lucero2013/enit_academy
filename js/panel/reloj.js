/* ══ Reloj compartido (panel docente + panel estudiante) ═════════════════════ */

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
