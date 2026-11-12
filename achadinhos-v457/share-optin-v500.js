/* DELTA Affiliate V5.00: voluntary user action, no contacts, telemetry or bulk delivery. */
(() => {
  'use strict';
  const canonical = Object.freeze({
    livia: { label: 'Achadinhos da Lívia', path: '/ofertas-de-parceiros.html', campaign: 'delta_v500_livia_organico' },
    lara: { label: 'Achadinhos da Lara', path: '/ofertas-da-lara.html', campaign: 'delta_v500_lara_organico' }
  });
  const engage = (link) => {
    const key = link.getAttribute('data-delta-share-v500');
    const offer = canonical[key];
    if (!offer) return;
    const u = new URL(offer.path, location.origin);
    u.searchParams.set('utm_source', 'compartilhamento');
    u.searchParams.set('utm_medium', 'voluntario');
    u.searchParams.set('utm_campaign', offer.campaign);
    const data = {
      title: offer.label,
      text: 'Conheça ' + offer.label + ': produtos úteis para comparar antes da compra. Publicidade de afiliados.',
      url: u.href
    };
    const feedback = link.closest('.delta-community-actions-v500')?.querySelector('.delta-share-status-v500');
    link.addEventListener('click', async (event) => {
      if (typeof navigator.share !== 'function') {
        if (feedback) feedback.textContent = 'O WhatsApp abrirá para você escolher onde compartilhar.';
        return;
      }
      event.preventDefault();
      try {
        await navigator.share(data);
        if (feedback) feedback.textContent = 'Obrigado por compartilhar voluntariamente!';
      } catch (err) {
        if (err?.name === 'AbortError') return;
        window.open(link.href, '_blank', 'noopener,noreferrer');
        if (feedback) feedback.textContent = 'Escolha onde compartilhar no WhatsApp.';
      }
    });
  };
  document.querySelectorAll('[data-delta-share-v500]').forEach(engage);
})();
