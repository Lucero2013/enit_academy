/* ══ Verificación de correo por OTP ══════════════════════════════════════════ */
const SUPABASE_URL  = 'https://iuhhoqmiyndltxcxiiud.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aGhvcW1peW5kbHR4Y3hpaXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTEwOTYsImV4cCI6MjA5NjUyNzA5Nn0.Tu0aBSMIzl2b8SO_R4I1MelLpDecIxYirkvbbYW_fsE';

const RUTAS_ROL = {
  docente:    '/paginas/panel_docente.html',
  estudiante: '/paginas/panel_estudiante.html',
  _default:   '/index.html',
};

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const inputs      = Array.from(document.querySelectorAll('.campo-codigo'));
const btnVerify   = document.getElementById('btn-verify');
const btnResend   = document.getElementById('btn-reenviar');
const retroalimentacion    = document.getElementById('retroalimentacion');
const countdown   = document.getElementById('countdown');
const formView    = document.getElementById('vista-formulario');
const successView = document.getElementById('vista-exito');

const userEmail = sessionStorage.getItem('pending_email') || '';
if (userEmail) document.getElementById('correo-visible').textContent = userEmail;

/* ── OTP input logic ── */
inputs.forEach((input, i) => {
  input.addEventListener('input', e => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    input.value = val ? val[0] : '';
    input.classList.toggle('filled', !!input.value);
    if (val && i < 5) inputs[i + 1].focus();
    updateBtn();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && i > 0) {
      inputs[i - 1].focus();
      inputs[i - 1].value = '';
      inputs[i - 1].classList.remove('filled');
      updateBtn();
    }
    if (e.key === 'ArrowLeft'  && i > 0) inputs[i - 1].focus();
    if (e.key === 'ArrowRight' && i < 5) inputs[i + 1].focus();
  });

  input.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    if (!text) return;
    inputs.forEach((inp, idx) => {
      inp.value = text[idx] || '';
      inp.classList.toggle('filled', !!inp.value);
    });
    inputs[Math.min(text.length - 1, 5)].focus();
    updateBtn();
  });
});

function getCode()   { return inputs.map(i => i.value).join(''); }
function updateBtn() { btnVerify.disabled = getCode().length < 6; }

function setError(msg) {
  retroalimentacion.textContent = msg;
  retroalimentacion.className = 'retroalimentacion error';
  inputs.forEach(i => i.classList.add('error-state'));
  setTimeout(() => inputs.forEach(i => i.classList.remove('error-state')), 600);
}
function clearFeedback() {
  retroalimentacion.textContent = '';
  retroalimentacion.className = 'retroalimentacion';
}

/* ── Verificar ── */
btnVerify.addEventListener('click', verifyCode);

async function verifyCode() {
  const code = getCode();
  if (code.length < 6) return;
  clearFeedback();
  setLoading(true);

  const { error: otpError } = await sb.auth.verifyOtp({
    email: userEmail,
    token: code,
    type: 'email',
  });

  if (otpError) {
    setLoading(false);
    setError(
      otpError.message.includes('expired')
        ? 'El código expiró. Solicita uno nuevo.'
        : 'Código incorrecto. Revisa e intenta de nuevo.'
    );
    return;
  }

  let destino = RUTAS_ROL._default;
  const { data: { user } } = await sb.auth.getUser();

  if (user?.id) {
    const { data: perfil } = await sb
      .from('perfiles').select('rol').eq('id', user.id).single();
    if (perfil?.rol) {
      destino = RUTAS_ROL[perfil.rol.toLowerCase().trim()] ?? RUTAS_ROL._default;
    }
  }

  setLoading(false);
  sessionStorage.removeItem('pending_email');
  showSuccess(destino);
}

function setLoading(on) {
  btnVerify.classList.toggle('loading', on);
  btnVerify.disabled = on;
  inputs.forEach(i => i.disabled = on);
}

function showSuccess(destino) {
  formView.style.display    = 'none';
  successView.style.display = 'flex';
  setTimeout(() => window.location.href = destino, 2200);
}

/* ── Reenvío + countdown ── */
let timer, seconds = 60;

function startCountdown() {
  seconds = 60;
  btnResend.disabled = true;
  tick();
  timer = setInterval(tick, 1000);
}

function tick() {
  countdown.textContent = `(${seconds}s)`;
  if (--seconds < 0) {
    clearInterval(timer);
    btnResend.disabled = false;
    countdown.textContent = '';
  }
}

btnResend.addEventListener('click', async () => {
  if (!userEmail) { setError('No hay correo registrado. Vuelve al registro.'); return; }
  clearFeedback();
  btnResend.disabled = true;

  const { error } = await sb.auth.resend({ type: 'email', email: userEmail });

  if (error) {
    setError('No se pudo reenviar el código. Inténtalo más tarde.');
    btnResend.disabled = false;
    return;
  }

  retroalimentacion.textContent = '✓ Código reenviado. Revisa tu bandeja.';
  retroalimentacion.className = 'retroalimentacion success';
  inputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
  updateBtn();
  startCountdown();
});

startCountdown();
