/* ══ FAB flotante — index.html ════════════════════════════════════════════════ */
const fabDot  = document.getElementById('fabDot');
const fabMenu = document.getElementById('fabMenu');

fabDot.addEventListener('click', () => {
  fabDot.classList.toggle('open');
  fabMenu.classList.toggle('visible');
});

document.addEventListener('click', (e) => {
  if (!fabDot.contains(e.target) && !fabMenu.contains(e.target)) {
    fabDot.classList.remove('open');
    fabMenu.classList.remove('visible');
  }
});
