/* ══ Solicitar restablecimiento de contraseña ════════════════════════════════ */
import { supabase } from '/js/supabase.js';

const emailInput  = document.getElementById('email');
const btnSend     = document.getElementById('btn-send');
const feedbackEl  = document.getElementById('retroalimentacion');
const formView    = document.getElementById('vista-formulario');
const successView = document.getElementById('vista-exito');

function setError(msg) {
  feedbackEl.textContent = msg;
  feedbackEl.className = 'retroalimentacion error';
  emailInput.classList.add('error-state');
  setTimeout(() => emailInput.classList.remove('error-state'), 600);
}
function clearFeedback() {
  feedbackEl.textContent = '';
  feedbackEl.className = 'retroalimentacion';
}
function setLoading(on) {
  btnSend.classList.toggle('loading', on);
  btnSend.disabled = on;
  emailInput.disabled = on;
}

btnSend.addEventListener('click', async () => {
  clearFeedback();
  const email = emailInput.value.trim();
  if (!email) { setError('Ingresa tu correo electrónico.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('El correo no es válido.'); return; }

  setLoading(true);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/paginas/reset-password.html',
  });
  setLoading(false);

  if (error) { setError('No se pudo enviar el correo. Intenta de nuevo.'); return; }

  formView.style.display    = 'none';
  successView.style.display = 'flex';
});

emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnSend.click(); });
