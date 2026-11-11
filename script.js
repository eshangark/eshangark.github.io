(() => {
  const links = [...document.querySelectorAll('.navigation a')];
  const panels = [...document.querySelectorAll('.panel')];
  const allowed = new Set(panels.map(panel => panel.id));

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let activeSection;
  let sectionAnimations = [];

  function renderSection() {
    const requested = window.location.hash.slice(1);
    if (requested === 'content') return;
    const active = allowed.has(requested) ? requested : 'about';
    const changed = activeSection && activeSection !== active;
    if (activeSection === active) return;
    activeSection = active;
    sectionAnimations.forEach(animation => animation.cancel());
    sectionAnimations = [];
    for (const panel of panels) panel.hidden = panel.id !== active;
    for (const link of links) {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    if (changed && !reducedMotion.matches) {
      const panel = panels.find(candidate => candidate.id === active);
      const heading = panel.querySelector('h2');
      if (!heading?.animate) return;
      const stackedNav = matchMedia('(max-width: 520px)').matches;
      sectionAnimations.push(heading.animate([
        { opacity: 0, transform: stackedNav ? 'translateY(-10px)' : 'translateX(-22px)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 950, easing: 'cubic-bezier(.42,0,.35,1)' }));
      for (const child of panel.children) {
        if (child === heading) continue;
        sectionAnimations.push(child.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: 560, delay: 175, fill: 'backwards', easing: 'ease-in-out' }));
      }
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
          behavior: reducedMotion.matches ? 'instant' : 'smooth',
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
  let preference = 'system';
  try {
    const saved = localStorage.getItem('portfolio-theme');
    if (['system', 'dark', 'light'].includes(saved)) preference = saved;
  } catch {}

  function setTheme(value) {
    preference = ['system', 'dark', 'light'].includes(value) ? value : 'system';
    const theme = preference === 'system' ? 'dark' : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = theme;
    for (const button of themeChoices) {
      const choice = button.dataset.themeChoice;
      button.setAttribute('aria-pressed', String(preference === choice));
    }
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#151d25' : '#f2f5ed';
  }
  setTheme(preference);
  themeSwitch.hidden = false;
  for (const button of themeChoices) {
    button.addEventListener('click', () => {
      setTheme(button.dataset.themeChoice);
      try { localStorage.setItem('portfolio-theme', preference); } catch {}
    });
  }
  window.addEventListener('storage', event => {
    if (event.key === 'portfolio-theme' || event.key === null) setTheme(event.newValue);
  });
})();
