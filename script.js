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

  const themeSwitch = document.querySelector('.theme-switch');
  const themeChoices = [...themeSwitch.querySelectorAll('[data-theme-choice]')];
  const themeMore = themeSwitch.querySelector('.theme-more');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'dark';
  try {
    const saved = localStorage.getItem('portfolio-theme');
    if (['system', 'dark', 'light'].includes(saved)) preference = saved;
  } catch {}

  function setTheme(value) {
    preference = ['system', 'dark', 'light'].includes(value) ? value : 'dark';
    const theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = theme;
    for (const button of themeChoices) {
      const choice = button.dataset.themeChoice;
      button.setAttribute('aria-pressed', String(choice === 'system' ? preference === 'system' : theme === choice));
    }
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#151d25' : '#f2f5ed';
  }
  setTheme(preference);
  themeSwitch.hidden = false;
  for (const button of themeChoices) {
    button.addEventListener('click', () => {
      const menuWasOpen = themeMore.open;
      setTheme(button.dataset.themeChoice);
      themeMore.open = false;
      if (menuWasOpen) themeMore.querySelector('summary').focus();
      try { localStorage.setItem('portfolio-theme', preference); } catch {}
    });
  }
  document.addEventListener('click', event => {
    if (!themeMore.contains(event.target)) themeMore.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && themeMore.open) {
      themeMore.open = false;
      themeMore.querySelector('summary').focus();
    }
  });
  systemTheme.addEventListener('change', () => {
    if (preference === 'system') setTheme(preference);
  });
  window.addEventListener('storage', event => {
    if (event.key === 'portfolio-theme' || event.key === null) setTheme(event.newValue);
  });
})();
