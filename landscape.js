// A small, self-contained canvas scene. All text and navigation remain ordinary HTML.
(() => {
  const scene = document.querySelector('.hero-scene');
  const landscape = scene?.querySelector('.night-landscape');
  const canvas = scene?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const homes = [[.08, .48], [.18, .62], [.27, .38], [.36, .57], [.45, .46], [.54, .65], [.63, .37], [.72, .58], [.82, .43], [.92, .64]];
  const flies = homes.map(([x, y], index) => ({ x, y, roams: index >= 7, phase: index * 1.91, offsetX: 0, offsetY: 0 }));
  const landmarkDepth = { observatory: .008, cabin: .018, pine: .03 };
  let width = 1;
  let height = 180;
  let mountainTop = 0;
  let mountainHeight = 180;
  let skyRegion = null;
  let sky;
  let protectedAreas = [];
  let frame = 0;
  let lastDraw = 0;
  let visible = true;
  let pointer = null;
  let colors;
  let isDay = false;
  let sceneDocumentTop = 0;
  let scrollDepth = 0;
  const startedAt = performance.now();

  function readColors() {
    isDay = root.dataset.theme === 'light';
    const style = getComputedStyle(root);
    const token = name => style.getPropertyValue(name).trim();
    colors = { paper: token('--paper'), fly: token('--firefly'), wings: token('--muted'),
      orb: token('--scene-orb'), bird: token('--scene-bird'), cloud: token('--scene-cloud'), building: token('--scene-building'),
      tree: token('--scene-tree'), river: token('--scene-river'), window: token('--scene-window') };
  }

  function landmarkY(fraction, depth) {
    return mountainTop + fraction * mountainHeight
      + (reducedMotion.matches ? 0 : scrollDepth * depth);
  }

  function drawSky(now) {
    const { area, y } = sky;
    const flightArea = area || { left: width * .64, right: width - 8, top: mountainTop - 6 };
    context.save();
    const skyBottom = area ? mountainTop : mountainTop + mountainHeight * .45;
    context.beginPath();context.rect(flightArea.left, flightArea.top - 6, flightArea.right - flightArea.left, skyBottom - flightArea.top + 6);context.clip();
    const seconds = reducedMotion.matches ? 0 : (now - startedAt) / 1000;
    const cloudWidth = Math.min(110, (flightArea.right - flightArea.left) * .76);
    for (let i = 0; i < 2; i++) {
      const cx = flightArea.left + (flightArea.right - flightArea.left) / 2 + Math.sin(seconds * .035 + i * 2.4) * (flightArea.right - flightArea.left - cloudWidth) * .42;
      const cy = y + 15 + i * 47;
      context.globalAlpha = isDay ? (i ? .11 : .18) : (i ? .065 : .12);
      context.fillStyle = colors.cloud;
      context.beginPath();
      context.moveTo(cx - cloudWidth / 2, cy);
      context.bezierCurveTo(cx - cloudWidth * .2, cy - 1, cx - cloudWidth * .2, cy - 12, cx, cy - 8);
      context.bezierCurveTo(cx + cloudWidth * .22, cy - 16, cx + cloudWidth * .22, cy - 3, cx + cloudWidth / 2, cy);
      context.bezierCurveTo(cx + cloudWidth * .15, cy + 5, cx - cloudWidth * .22, cy + 6, cx - cloudWidth / 2, cy);
      context.fill();
    }
    // A short, rare event, first appearing after twelve seconds, then every 43 seconds.
    const phase = (seconds + 31) % 43;
    if (!isDay && !reducedMotion.matches && phase < .9) {
      const progress = phase / .9;
      const travel = Math.min(105, flightArea.right - flightArea.left - 20);
      const headX = flightArea.left + 10 + travel * progress;
      const headY = y + (area ? 68 : -9) + progress * (area ? 31 : 18);
      const tailX = Math.max(flightArea.left + 4, headX - 29);
      const streak = context.createLinearGradient(tailX, headY - 9, headX, headY);
      streak.addColorStop(0, `${colors.orb}00`);streak.addColorStop(1, colors.orb);
      context.globalAlpha = Math.sin(progress * Math.PI) * .65;
      context.strokeStyle = streak;context.lineWidth = 1.2;context.lineCap = 'round';
      context.beginPath();context.moveTo(tailX, headY - 9);context.lineTo(headX, headY);context.stroke();
    }
    context.restore();
  }

  function drawObservatory() {
    const x = width * .375, y = landmarkY(.19, landmarkDepth.observatory) + 1;
    const scale = width > 520 ? 1 : .8;
    context.save();context.translate(x, y);context.scale(scale, scale);
    context.fillStyle = colors.building;
    context.fillRect(-12, -13, 24, 14);
    context.beginPath();context.arc(0, -13, 12, Math.PI, 0);context.fill();
    context.strokeStyle = colors.river;context.globalAlpha = .55;context.lineWidth = 1;
    context.beginPath();context.moveTo(2, -24);context.lineTo(4, -14);context.stroke();
    context.globalAlpha = 1;context.fillStyle = colors.window;context.fillRect(-5, -9, 3, 4);
    context.restore();
  }

  function drawCabin() {
    const x = width * .79, y = landmarkY(.47, landmarkDepth.cabin) + 2;
    const scale = width > 520 ? 1 : .85;
    context.save();context.translate(x, y);context.scale(scale, scale);
    context.fillStyle = colors.building;
    context.fillRect(-12, -13, 24, 14);
    context.beginPath();context.moveTo(-17, -12);context.lineTo(-2, -24);context.lineTo(16, -12);context.closePath();context.fill();
    context.fillRect(7, -23, 4, 9);
    context.fillStyle = colors.window;context.globalAlpha = .85;context.fillRect(-7, -10, 5, 5);
    context.restore();
  }

  function drawTree() {
    const x = width * .115, y = landmarkY(.74, landmarkDepth.pine);
    const scale = width > 520 ? 1 : .82;
    context.save();context.translate(x, y);context.scale(scale, scale);
    context.fillStyle = colors.tree;context.fillRect(-1.4, -39, 2.8, 42);
    const levels = [[-49, -29, 10], [-40, -18, 15], [-29, -5, 21]];
    for (const [top, bottom, span] of levels) {
      context.beginPath();context.moveTo(0, top);
      context.lineTo(-span * .58, bottom - 8);context.lineTo(-span * .35, bottom - 8);
      context.lineTo(-span, bottom);context.lineTo(-span * .3, bottom - 1);
      context.lineTo(2, bottom + 3);context.lineTo(span * .65, bottom);
      context.lineTo(span * .95, bottom + 1);context.lineTo(span * .4, bottom - 9);
      context.lineTo(span * .62, bottom - 7);context.closePath();context.fill();
    }
    context.restore();
  }

  function riverX(t) {
    return width * (.57 + Math.sin(t * Math.PI * 2) * .022 + t * .045);
  }

  function drawRiver() {
    context.save();context.globalAlpha = isDay ? .6 : .37;context.fillStyle = colors.river;
    context.beginPath();
    for (let i = 0; i <= 32; i++) {
      const t = i / 32, x = riverX(t), y = mountainTop + mountainHeight * (.55 + t * .45);
      const bank = .65 + t * t * Math.min(13, width * .018);
      if (!i) context.moveTo(x - bank, y);else context.lineTo(x - bank, y);
    }
    for (let i = 32; i >= 0; i--) {
      const t = i / 32, x = riverX(t), y = mountainTop + mountainHeight * (.55 + t * .45);
      const bank = .65 + t * t * Math.min(13, width * .018);
      context.lineTo(x + bank, y);
    }
    context.closePath();context.fill();context.restore();
  }

  function draw(now) {
    context.clearRect(0, 0, width, height);
    drawSky(now);
    drawObservatory();
    drawCabin();
    drawRiver();
    drawTree();

    // Blend over the lower half of the scene, reaching the page color before its edge.
    const fadeTop = mountainTop + mountainHeight * .55;
    const fade = context.createLinearGradient(0, fadeTop, 0, height);
    fade.addColorStop(0, `${colors.paper}00`);
    fade.addColorStop(.35, `${colors.paper}38`);
    fade.addColorStop(.75, `${colors.paper}bf`);
    fade.addColorStop(.96, colors.paper);
    fade.addColorStop(1, colors.paper);
    context.fillStyle = fade;
    context.fillRect(0, fadeTop, width, height - fadeTop);

    const time = reducedMotion.matches ? 0 : now / 1000;
    for (const fly of flies) {
      const p = fly.phase;
      let x = (fly.x + Math.sin(time * .19 + p) * .115 + Math.sin(time * .53 + p) * .025) * width;
      let y = mountainTop + (fly.y + Math.sin(time * .31 + p) * .17 + Math.cos(time * .67 + p) * .03) * mountainHeight;
      const roaming = fly.roams && skyRegion;
      if (roaming) {
        x = skyRegion.left + (skyRegion.right - skyRegion.left) * (.5 + Math.sin(time * .23 + p) * .35);
        const bottom = mountainTop + mountainHeight * .65;
        const rise = (1 + Math.sin(time * .12 + p)) / 2;
        y = bottom - (bottom - skyRegion.top) * rise;
      }
      let offsetX = 0;
      let offsetY = 0;
      // Nearby insects shy away slightly; their flight never depends on the cursor.
      if (pointer && !reducedMotion.matches) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const force = Math.max(0, 1 - distance / 80) * 22;
        offsetX = dx / Math.max(distance, 1) * force;
        offsetY = dy / Math.max(distance, 1) * force;
      }
      fly.offsetX += (offsetX - fly.offsetX) * .06;
      fly.offsetY += (offsetY - fly.offsetY) * .06;
      x = Math.max(14, Math.min(width - 14, x + fly.offsetX));
      y = Math.max(roaming ? skyRegion.top : mountainTop + mountainHeight * .13,
        Math.min(mountainTop + mountainHeight * .83, y + fly.offsetY));
      // Leave a generous clear area around text, links, and the tilted portrait.
      for (const area of protectedAreas) {
        if (x > area.left && x < area.right && y > area.top && y < area.bottom) {
          x = Math.abs(x - area.left) < Math.abs(x - area.right) ? area.left : area.right;
        }
      }
      if (isDay) {
        const span = fly.roams ? 8 : 6;
        const lift = reducedMotion.matches ? 3 : 3 + Math.sin(time * 3.5 + p) * 2;
        context.save();context.globalAlpha = .72;context.strokeStyle = colors.bird;
        context.lineWidth = 1.35;context.lineCap = 'round';
        context.beginPath();context.moveTo(x - span, y - lift);
        context.quadraticCurveTo(x - span * .45, y - lift - 2, x, y + 1);
        context.quadraticCurveTo(x + span * .45, y - lift - 2, x + span, y - lift);
        context.stroke();context.restore();
        continue;
      }
      const altitude = Math.max(0, (mountainTop - y) / Math.max(1, mountainTop));
      const glow = (reducedMotion.matches ? .65 : .45 + .4 * Math.pow((1 + Math.sin(time * 1.7 + p)) / 2, 2)) * (1 - altitude * .45);
      const waterT = (y - mountainTop - mountainHeight * .55) / (mountainHeight * .45);
      if (waterT > 0 && waterT < .85 && Math.abs(x - riverX(waterT)) < 70) {
        context.globalAlpha = glow * .15;context.strokeStyle = colors.window;context.lineWidth = 1;
        const reflectedX = riverX(waterT);
        context.beginPath();context.moveTo(reflectedX - 2, y + 2);context.lineTo(reflectedX + 2, y + 2);context.stroke();
        context.globalAlpha = 1;
      }
      const halo = context.createRadialGradient(x, y, 0, x, y, 14);
      halo.addColorStop(0, colors.fly);
      halo.addColorStop(1, `${colors.fly}00`);
      context.globalAlpha = glow * .28;
      context.fillStyle = halo;
      context.fillRect(x - 14, y - 14, 28, 28);
      context.globalAlpha = glow * .5;
      context.fillStyle = colors.wings;
      context.beginPath();
      context.ellipse(x - 3, y - 4.5, 4.2, 1.65, -.6, 0, Math.PI * 2);
      context.ellipse(x + 3, y - 4.5, 4.2, 1.65, .6, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = glow;
      context.fillStyle = colors.fly;
      context.beginPath();
      context.ellipse(x, y, 1.9, 3, 0, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
    }
  }

  function animate(now) {
    if (now - lastDraw >= 1000 / 30) { draw(now); lastDraw = now; }
    frame = requestAnimationFrame(animate);
  }

  function restart() {
    cancelAnimationFrame(frame);
    frame = 0;
    draw(performance.now());
    if (!reducedMotion.matches && !document.hidden && visible) frame = requestAnimationFrame(animate);
  }

  function updateScroll() {
    scrollDepth = Math.max(0, Math.min(window.scrollY - sceneDocumentTop, 600));
  }

  function resize() {
    const bounds = scene.getBoundingClientRect();
    width = Math.max(1, root.clientWidth);
    height = Math.max(1, bounds.height);
    sceneDocumentTop = bounds.top + window.scrollY;
    updateScroll();
    root.style.setProperty('--scene-width', `${width}px`);
    const origin = (bounds.left + bounds.right - width) / 2;
    const land = landscape.getBoundingClientRect();
    mountainTop = land.top - bounds.top;
    mountainHeight = land.height;
    const relative = element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left - origin - 22, right: rect.right - origin + 22,
        top: rect.top - bounds.top - 22, bottom: rect.bottom - bounds.top + 22 };
    };
    const copy = relative(scene.querySelector('.hero-copy'));
    const portrait = relative(scene.querySelector('.portrait'));
    skyRegion = width > 520
      ? { left: copy.right, right: portrait.left, top: mountainTop * .22 }
      : { left: portrait.right, right: width - 18, top: portrait.top + 70 };
    if (skyRegion.right - skyRegion.left < 36) skyRegion = null;
    const radius = width > 520 ? 18 : 12;
    const area = skyRegion && skyRegion.right - skyRegion.left >= radius * 2 + 8 ? skyRegion : null;
    const x = area ? area.left + (area.right - area.left) * .63 : width * .86;
    const y = area ? area.top + radius + 5 : mountainTop + 13;
    sky = { area, y };
    scene.style.setProperty('--orb-x', `${x + origin - bounds.left}px`);
    scene.style.setProperty('--orb-y', `${y}px`);
    protectedAreas = [...scene.querySelectorAll('.hero-copy, .portrait')].map(relative);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  }

  scene.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const bounds = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }, { passive: true });
  scene.addEventListener('pointerleave', () => { pointer = null; });
  reducedMotion.addEventListener('change', restart);
  document.addEventListener('visibilitychange', restart);
  new MutationObserver(() => { readColors(); draw(performance.now()); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; restart(); })
    .observe(scene);
  readColors();
  new ResizeObserver(resize).observe(scene);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateScroll, { passive: true });
  resize();
  restart();
})();
