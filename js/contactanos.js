import { supabase } from "./supabase.js";

const form = document.getElementById("form-contacto");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const asunto = document.getElementById("asunto").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    const { error } = await supabase
        .from("contactos")
        .insert([
            {
                nombre,
                correo,
                asunto,
                mensaje
            }
        ]);

    if (error) {
    console.error(error);
    alert(error.message);
    return;
}

const mensajeExito = document.getElementById("mensaje-exito");

mensajeExito.style.display = "block";

setTimeout(() => {
    mensajeExito.style.display = "none";
}, 5000);

    form.reset();
});

window.addEventListener("error", e => {
  console.error("ERROR GLOBAL:", e.error);
});

window.addEventListener("unhandledrejection", e => {
  console.error("PROMESA FALLIDA:", e.reason);
});