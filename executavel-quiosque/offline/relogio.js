// Relógio dinâmico
function updateClock() {
    const el = document.getElementById('relogio');
    const now = new Date();
    el.textContent = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
updateClock();
setInterval(updateClock, 1000);

document.addEventListener('focusin', function (e) {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.target.blur();
    }
});
