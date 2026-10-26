(() => {
  const links = [...document.querySelectorAll('.navigation a')];
  const panels = [...document.querySelectorAll('.panel')];
  const allowed = new Set(panels.map(panel => panel.id));

  function renderSection() {
    const requested = window.location.hash.slice(1);
    if (requested === 'content') return;
    const active = allowed.has(requested) ? requested : 'about';
    for (const panel of panels) panel.hidden = panel.id !== active;
    for (const link of links) {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }

  for (const link of document.querySelectorAll('a[href^="#"]')) {
    if (!allowed.has(link.hash.slice(1))) continue;
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
      renderSection();
    });
  }
  window.addEventListener('popstate', renderSection);
  window.addEventListener('hashchange', renderSection);
  renderSection();
  document.getElementById('year').textContent = new Date().getFullYear();

  try {
    if (!sessionStorage.getItem('portfolio-intro-seen') &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('motion');
      sessionStorage.setItem('portfolio-intro-seen', 'true');
    }
  } catch {
    // Navigation and content remain available when browser storage is disabled.
  }
})();
