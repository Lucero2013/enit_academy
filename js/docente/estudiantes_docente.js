import { supabase } from "../supabase.js";
import { estado } from "./estado_docente.js";
import { confirmarAccion } from "./modal_confirmar.js";
import { mostrarToast } from "./utilidades_docente.js";

export async function cargarAlumnosCurso(cursoId) {
  const { data } = await supabase.from("inscripciones")
    .select("estudiante_id, perfiles(nombre, apellido, id)").eq("curso_id", cursoId);
  const el = document.getElementById("listaAlumnosCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? `<div class="tabla-estudiantes">${data.map(i => `
        <div class="fila-estudiante">
          <div class="avatar-mini"><i class="fa-solid fa-user-graduate"></i></div>
          <span>${i.perfiles?.nombre || ""} ${i.perfiles?.apellido || ""}</span>
          <button class="btn-peligro btn-mini" onclick="expulsarEstudiante('${cursoId}','${i.estudiante_id}')">
            <i class="fa-solid fa-user-minus"></i>
          </button>
        </div>`).join("")}</div>`
    : `<p class="sin-datos">Sin estudiantes inscritos.</p>`;
}
window.expulsarEstudiante = async function(cursoId, estudianteId) {
  const confirmado = await confirmarAccion({
    titulo: "¿Retirar a este estudiante?",
    mensaje: "Perderá el acceso a este curso y a todo su contenido. Podrás volver a inscribirlo más tarde si lo necesitas.",
    textoBoton: "Retirar",
    icono: "fa-user-minus",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("inscripciones")
    .delete().eq("curso_id", cursoId).eq("estudiante_id", estudianteId);

  if (error) {
    mostrarToast(`No se pudo retirar al estudiante: ${error.message || "intenta de nuevo."}`, "error");
    return;
  }
  await cargarAlumnosCurso(cursoId);
  mostrarToast("Estudiante retirado del curso.", "ok");
};

// ══ ANUNCIOS ══════════════════════════════════════════════════════════════════
export async function cargarCheckEstudiantes() {
  const { data } = await supabase.from("perfiles").select("id, nombre, apellido").eq("rol", "estudiante");
  const lista = document.getElementById("listaCheckEstudiantes");
  if (!lista || !data) return;
  lista.innerHTML = data.length
    ? data.map(e => `<label class="check-item"><input type="checkbox" class="check-estudiante" value="${e.id}"> ${e.nombre} ${e.apellido}</label>`).join("")
    : `<p class="sin-datos" style="font-size:.82rem;">No hay estudiantes registrados aún.</p>`;
}
export async function cargarListaEstudiantes() {
  const cursoIds = estado.cursosDocente.map(c => c.id);
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const { data: todosEstudiantes } = await supabase
    .from("perfiles")
    .select("id, nombre, apellido")
    .eq("rol", "estudiante")
    .order("nombre", { ascending: true });

  let inscripciones = [];
  if (cursoIds.length > 0) {
    const { data } = await supabase
      .from("inscripciones")
      .select("estudiante_id, curso_id, cursos(nombre)")
      .in("curso_id", cursoIds);
    inscripciones = data || [];
  }

  window.__estudiantesData = (todosEstudiantes || []).map(e => ({
    id: e.id,
    nombre: `${e.nombre} ${e.apellido}`.trim(),
    inscripciones: inscripciones
      .filter(i => i.estudiante_id === e.id)
      .map(i => ({ cursoId: i.curso_id, cursoNombre: i.cursos?.nombre || "" })),
  }));

  const renderTabla = (lista) => {
    tabla.innerHTML = lista.length
      ? lista.map(e => `
          <div class="fila-estudiante" style="align-items:flex-start; flex-wrap:wrap; gap:.6rem;">
            <div class="avatar-mini" style="margin-top:.2rem;"><i class="fa-solid fa-user-graduate"></i></div>
            <span style="flex:1; min-width:120px; font-weight:700;">${e.nombre}</span>
            <div style="display:flex; gap:.4rem; flex-wrap:wrap; flex:2; align-items:center;">
              ${e.inscripciones.length
                ? e.inscripciones.map(ins => `
                    <span style="display:inline-flex; align-items:center; gap:.3rem;" class="curso-tag">
                      ${ins.cursoNombre}
                      <button class="btn-icono-peq peligro btn-quitar-curso"
                        data-estudiante-id="${e.id}"
                        data-curso-id="${ins.cursoId}"
                        title="Quitar de este curso"
                        style="width:20px; height:20px; font-size:.65rem; border-radius:6px;">
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </span>`).join("")
                : `<span style="font-size:.78rem; color:var(--texto-claro); font-weight:600;">Sin cursos</span>`
              }
              ${estado.cursosDocente.length ? `
                <div style="display:inline-flex; align-items:center; gap:.3rem;">
                  <select class="select-inscribir" data-estudiante-id="${e.id}"
                    style="font-size:.75rem; padding:.2rem .5rem; border:1.5px solid var(--borde);
                    border-radius:8px; font-family:'Nunito',sans-serif; color:var(--texto);
                    background:var(--blanco); outline:none; cursor:pointer; max-width:160px;">
                    <option value="">+ Añadir a curso...</option>
                    ${estado.cursosDocente
                      .filter(c => !e.inscripciones.some(i => i.cursoId === c.id))
                      .map(c => `<option value="${c.id}">${c.nombre}</option>`)
                      .join("")}
                  </select>
                </div>` : ""}
            </div>
          </div>`).join("")
      : `<p class="sin-datos">Sin resultados.</p>`;

    tabla.querySelectorAll(".btn-quitar-curso").forEach(btn => {
      btn.addEventListener("click", () => {
        window.quitarDeUnCurso(btn.dataset.estudianteId, btn.dataset.cursoId);
      });
    });

    tabla.querySelectorAll(".select-inscribir").forEach(sel => {
      sel.addEventListener("change", async () => {
        const estudianteId = sel.dataset.estudianteId;
        const cursoId = sel.value;
        if (!cursoId) return;

        const { error } = await supabase.from("inscripciones").insert({
          estudiante_id: estudianteId,
          curso_id: cursoId,
        });

        if (error) {
          mostrarToast(`Error al inscribir: ${error.message}`, "error");
          sel.value = "";
          return;
        }

        const curso = estado.cursosDocente.find(c => c.id === cursoId);
        mostrarToast(`Estudiante añadido a "${curso?.nombre}". ✅`, "ok");
        await cargarListaEstudiantes();
      });
    });
  };

  renderTabla(window.__estudiantesData);

  const buscarViejo = document.getElementById("buscarTablaEstudiante");
  if (buscarViejo) {
    const buscarNuevo = buscarViejo.cloneNode(true);
    buscarViejo.replaceWith(buscarNuevo);
    buscarNuevo.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      renderTabla(window.__estudiantesData.filter(e => e.nombre.toLowerCase().includes(q)));
    });
  }
}
window.quitarDeUnCurso = async function(estudianteId, cursoId) {
  const curso = estado.cursosDocente.find(c => c.id === cursoId);
  const confirmado = await confirmarAccion({
    titulo: "¿Quitar de este curso?",
    mensaje: `El estudiante perderá el acceso a "${curso?.nombre || "este curso"}".`,
    textoBoton: "Quitar",
    icono: "fa-user-minus",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("inscripciones")
    .delete()
    .eq("estudiante_id", estudianteId)
    .eq("curso_id", cursoId);

  if (error) {
    mostrarToast(`No se pudo quitar: ${error.message || "intenta de nuevo."}`, "error");
    return;
  }
  mostrarToast("Estudiante quitado del curso.", "ok");
  await cargarListaEstudiantes();
};
// ══ VISTA COMO ESTUDIANTE ═════════════════════════════════════════════════════
