(function () {
  let overlay, overlayImg, lastFocused;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.tabIndex = -1;
    overlayImg = document.createElement('img');
    overlay.appendChild(overlayImg);
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
    return overlay;
  }

  function open(img) {
    lastFocused = document.activeElement;
    ensureOverlay();
    overlayImg.src = img.currentSrc || img.src;
    overlayImg.alt = img.alt;
    overlay.classList.add('open');
    overlay.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img.zoomable').forEach((img) => {
      img.addEventListener('click', () => open(img));
    });
  });
})();
