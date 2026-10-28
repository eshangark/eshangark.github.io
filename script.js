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
      const sectionLayout = document.querySelector('.section-layout');
      if (link.closest('.header-links') ||
          (link.closest('.navigation') && window.scrollY > sectionLayout.offsetTop)) {
        sectionLayout.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'start'
        });
      }
    });
  }
  window.addEventListener('popstate', renderSection);
  window.addEventListener('hashchange', renderSection);
  renderSection();
  document.getElementById('year').textContent = new Date().getFullYear();

  const toggle = document.querySelector('.theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const saved = localStorage.getItem('portfolio-theme');
    if (['system', 'dark', 'light'].includes(saved)) preference = saved;
  } catch {}

  function setTheme(value) {
    preference = ['system', 'dark', 'light'].includes(value) ? value : 'system';
    const theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    toggle.value = preference;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#161815' : '#f4f1eb';
  }
  setTheme(preference);
  toggle.hidden = false;
  toggle.addEventListener('change', () => {
    setTheme(toggle.value);
    try { localStorage.setItem('portfolio-theme', preference); } catch {}
  });
  systemTheme.addEventListener('change', () => {
    if (preference === 'system') setTheme(preference);
  });
  window.addEventListener('storage', event => {
    if (event.key === 'portfolio-theme' || event.key === null) setTheme(event.newValue);
  });
})();
