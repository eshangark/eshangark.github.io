// The real heading starts in the center, resolves into the name, then lands in place.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('opening')) return;
  const heading = document.getElementById('name');
  const original = heading.innerHTML;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'resize'];
  let frame;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    clearTimeout(window.openingFallback);
    animations.forEach(animation => animation.cancel());
    heading.innerHTML = original;
    root.classList.remove('opening', 'opening-play');
    skipEvents.forEach(type => window.removeEventListener(type, finish, true));
    reducedMotion.removeEventListener('change', finish);
  }

  function play() {
    if (document.hidden || reducedMotion.matches || !heading.animate ||
        !root.classList.contains('opening')) { finish(); return; }
    try {
      const box = heading.getBoundingClientRect();
      const scale = Math.min(1.1, root.clientWidth * .84 / box.width);
      const x = root.clientWidth / 2 - box.left - box.width / 2;
      const y = innerHeight * .46 - box.top - box.height / 2;
      const centered = `translate(${x}px, ${y}px) scale(${scale})`;
      const letters = [];
      // Measure each original letter before replacing it so the scramble never reflows.
      for (const word of heading.querySelectorAll('.name-part')) {
        const text = word.textContent;
        const node = word.firstChild;
        const range = document.createRange();
        const widths = [...text].map((letter, index) => {
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          return range.getBoundingClientRect().width;
        });
        word.textContent = '';
        [...text].forEach((letter, index) => {
          const slot = document.createElement('span');
          slot.className = 'opening-char';
          slot.style.width = `${widths[index]}px`;
          slot.setAttribute('aria-hidden', 'true');
          word.append(slot);
          letters.push({ slot, letter, index: letters.length });
        });
      }
      const travel = heading.animate([
        { transform: centered },
        { transform: centered, offset: .65, easing: 'cubic-bezier(.65,0,.2,1)' },
        { transform: 'none' }
      ], { duration: 2200, fill: 'both' });
      animations.push(travel);
      const groups = [
        '.hero-copy>.eyebrow, .hero-note',
        '.header, .portrait',
        '.section-layout, footer'
      ];
      groups.forEach((selector, index) => {
        document.querySelectorAll(selector).forEach(element => {
          animations.push(element.animate([
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 650, delay: 1750 + index * 130, fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)' }));
        });
      });
      root.classList.add('opening-play');
      let lastTick = -100;
      function scramble(now) {
        if (finished) return;
        const time = travel.currentTime || 0;
        if (now - lastTick > 65) {
          let allSettled = true;
          for (const { slot, letter, index } of letters) {
            const settled = time >= 400 + index * 62;
            const alphabet = letter === letter.toUpperCase() ? 'AEHKNRSW' : 'aehknrsuv';
            slot.textContent = settled ? letter : time < index * 25 ? ' ' : alphabet[Math.floor(Math.random() * alphabet.length)];
            if (!settled) allSettled = false;
          }
          lastTick = now;
          if (allSettled) { heading.innerHTML = original; return; }
        }
        frame = requestAnimationFrame(scramble);
      }
      frame = requestAnimationFrame(scramble);
      skipEvents.forEach(type => window.addEventListener(type, finish, { capture: true, passive: true }));
      reducedMotion.addEventListener('change', finish);
      Promise.all(animations.map(animation => animation.finished)).then(finish, finish);
      clearTimeout(window.openingFallback);
      window.openingFallback = setTimeout(finish, 4000);
    } catch { finish(); }
  }

  requestAnimationFrame(play);
})();
