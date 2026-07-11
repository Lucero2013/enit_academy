import { estado } from "./estado_estudiante.js";
import { llenarFiltros, renderMiniCursosDisponibles } from "./cursos_disponibles_estudiante.js";
import { actualizarBadges, cargarItemsModulosPorCursos, normalizarAnuncios, renderAnunciosVista, renderArchivosVista, renderAsideAnuncios, renderAsideArchivos, renderAsideTareas, renderAsideVacio, renderCursosInicio, renderCursosLista, renderTareasVista } from "./inicio_estudiante.js";
document.body.prepend(banner);
document.body.style.paddingTop = "48px";
document.body.classList.add("vista-previa-activa");
export function mostrarBannerPreview() {
  const banner = document.createElement("div");
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: linear-gradient(135deg, #ff4fa0, #8b5cf6);
    color: white; padding: .7rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    font-weight: 700; font-size: .9rem; font-family: 'Nunito', sans-serif;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  `;
  banner.innerHTML = `
    <span><i class="fa-solid fa-eye" style="margin-right:.5rem;"></i>
      Modo vista previa — así ven tus cursos los estudiantes
    </span>
    <button onclick="window.close()" style="
      background:white; color:#8b5cf6; border:none;
      border-radius:8px; padding:.3rem .9rem;
      font-weight:800; cursor:pointer; font-size:.85rem;
    ">✕ Cerrar</button>
  `;
  document.body.prepend(banner);
  document.body.style.paddingTop = "48px";
}

// ══ CARGA DE DATOS EN MODO PREVIEW ════════════════════════════════════════════
export async function cargarDatosPreview(docenteId) {
  const h2 = document.getElementById("saludoH2");
  const p  = document.getElementById("saludoFrase");
  if (h2) h2.innerHTML = `Vista previa <span>del estudiante</span> 👁️`;
  if (p)  p.textContent = "Así verían tus cursos tus estudiantes.";
  const sideNombre = document.getElementById("sideNombre");
  if (sideNombre) sideNombre.textContent = "Vista Previa";

  ["vista-perfil"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  document.querySelectorAll(".nav-btn[data-vista='perfil']").forEach(btn => btn.remove());

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nombre, descripcion, nivel, codigo, docente_id, imagen_url, perfiles(nombre, apellido)")
    .eq("docente_id", docenteId)
    .order("creado_at", { ascending: false });

  estado.cursosInscritos = cursos || [];
  renderCursosInicio();
  renderCursosLista();

  if (estado.cursosInscritos.length === 0) {
    renderAsideVacio();
    await renderMiniCursosDisponibles();
    return;
  }

  const cursoIds = estado.cursosInscritos.map(c => c.id);
  const { data: anunciosRaw } = await supabase
    .from("anuncios")
    .select("*, cursos(nombre)")
    .in("curso_id", cursoIds)
    .order("creado_at", { ascending: false })
    .limit(5);

  const { tareas, archivos } = await cargarItemsModulosPorCursos(cursoIds);

  renderAsideAnuncios(normalizarAnuncios(anunciosRaw || []));
  renderAsideTareas(tareas);
  renderAsideArchivos(archivos);
  renderAnunciosVista(anunciosRaw || []);
  renderTareasVista(tareas);
  renderArchivosVista(archivos);
  llenarFiltros(estado.cursosInscritos);
  actualizarBadges(estado.cursosInscritos, anunciosRaw || [], archivos, tareas);
  await renderMiniCursosDisponibles();
}

// ══ SESIÓN ════════════════════════════════════════════════════════════════════
