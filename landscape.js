// Paint the scenery on resize or theme change. Move small elements for the animation.
(() => {
  const scene = document.querySelector('.hero-scene');
  const landscape = scene?.querySelector('.night-landscape');
  const canvas = scene?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  const motion = scene?.querySelector('.scene-motion');
  if (!context || !motion) return;

  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const homes = [[.08, .48], [.18, .62], [.27, .38], [.36, .57], [.45, .46], [.54, .65], [.63, .37], [.72, .58], [.82, .43], [.92, .64]];
  function sprite(className, parent = motion) {
    const element = document.createElement('span');
    element.className = className;
    parent.append(element);
    return element;
  }

  const skyLayer = sprite('scene-sky');
  const clouds = [sprite('scene-cloud', skyLayer), sprite('scene-cloud', skyLayer)];
  const star = sprite('scene-star', skyLayer);
  const flies = homes.map(([x, y], index) => {
    const element = sprite('scene-fly');
    element.innerHTML = `<span class="fly-glow"></span><svg viewBox="-14 -14 28 28">
      <g class="fly-insect">
        <ellipse class="fly-wing" cx="-3" cy="-4.5" rx="4.2" ry="1.65" transform="rotate(-34 -3 -4.5)"/>
        <ellipse class="fly-wing" cx="3" cy="-4.5" rx="4.2" ry="1.65" transform="rotate(34 3 -4.5)"/>
        <ellipse cx="0" cy="0" rx="1.9" ry="3"/>
      </g>
      <path class="fly-bird" d="M-6 -3 Q-2.7 -5 0 1 Q2.7 -5 6 -3"/>
    </svg>`;
    return { x, y, element, bird: element.querySelector('.fly-bird'),
      reflection: sprite('scene-reflection'), roams: index >= 7, phase: index * 1.91, offsetX: 0, offsetY: 0 };
  });
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
  const startedAt = performance.now();

  function readColors() {
    isDay = root.dataset.theme === 'light';
    const style = getComputedStyle(root);
    const token = name => style.getPropertyValue(name).trim();
    colors = { paper: token('--paper'), building: token('--scene-building'),
      tree: token('--scene-tree'), river: token('--scene-river'), window: token('--scene-window') };
  }

  function place(element, x, y, extraTransform = '') {
    element.style.transform = `translate3d(${x}px,${y}px,0)${extraTransform}`;
  }

  function positionSky() {
    const { area } = sky;
    const flightArea = area || { left: width * .64, right: width - 8, top: mountainTop - 6 };
    const skyBottom = area ? mountainTop : mountainTop + mountainHeight * .45;
    const span = flightArea.right - flightArea.left;
    const cloudWidth = Math.min(110, span * .76);
    Object.assign(skyLayer.style, {
      left: `${flightArea.left}px`, top: `${flightArea.top - 6}px`,
      width: `${span}px`, height: `${skyBottom - flightArea.top + 6}px`
    });
    clouds.forEach(cloud => { cloud.style.width = `${cloudWidth}px`; });
    Object.assign(sky, { top: flightArea.top - 6, span, cloudWidth });
  }

  function moveSky(now) {
    const { area, y, top, span, cloudWidth } = sky;
    const seconds = reducedMotion.matches ? 0 : (now - startedAt) / 1000;
    clouds.forEach((cloud, i) => {
      const x = (span - cloudWidth) * (.5 + Math.sin(seconds * .035 + i * 2.4) * .42);
      place(cloud, x, y - top + 2 + i * 47);
    });
    // First visible after twelve seconds, then every 43 seconds.
    const phase = (seconds + 31) % 43;
    const shooting = !isDay && !reducedMotion.matches && phase < .9;
    star.hidden = !shooting;
    if (shooting) {
      const progress = phase / .9;
      const headX = 10 + Math.min(105, span - 20) * progress;
      const headY = y - top + (area ? 68 : -9) + progress * (area ? 31 : 18);
      const length = Math.min(29, headX - 4);
      place(star, headX - length, headY - 9, ` rotate(${Math.atan2(9, length)}rad) scaleX(${Math.hypot(length, 9) / 31})`);
      star.style.opacity = Math.sin(progress * Math.PI) * .65;
    }
  }

  function drawObservatory() {
    const x = width * .375, y = mountainTop + mountainHeight * .19 + 1;
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
    const x = width * .79, y = mountainTop + mountainHeight * .47 + 2;
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
    const x = width * .115, y = mountainTop + mountainHeight * .74;
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

  function paintScenery() {
    context.clearRect(0, mountainTop, width, mountainHeight);
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
  }

  function moveSprites(now) {
    moveSky(now);
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
      const { element, bird, reflection } = fly;
      place(element, x - 14, y - 14);
      if (isDay) {
        const span = fly.roams ? 8 : 6;
        const lift = reducedMotion.matches ? 3 : 3 + Math.sin(time * 3.5 + p) * 2;
        bird.setAttribute('d', `M${-span} ${-lift} Q${-span * .45} ${-lift - 2} 0 1 Q${span * .45} ${-lift - 2} ${span} ${-lift}`);
        element.style.opacity = .72;
        reflection.hidden = true;
        continue;
      }
      const altitude = Math.max(0, (mountainTop - y) / Math.max(1, mountainTop));
      const glow = (reducedMotion.matches ? .65 : .45 + .4 * ((1 + Math.sin(time * 1.7 + p)) / 2) ** 2) * (1 - altitude * .45);
      element.style.opacity = glow;
      const waterT = (y - mountainTop - mountainHeight * .55) / (mountainHeight * .45);
      const reflectedX = riverX(waterT);
      reflection.hidden = waterT <= 0 || waterT >= .85 || Math.abs(x - reflectedX) >= 70;
      if (!reflection.hidden) {
        place(reflection, reflectedX - 2, y + 2);
        reflection.style.opacity = glow * .15;
      }
    }
  }

  function animate(now) {
    if (now - lastDraw >= 1000 / 30) { moveSprites(now); lastDraw = now; }
    frame = requestAnimationFrame(animate);
  }

  function restart() {
    cancelAnimationFrame(frame);
    frame = 0;
    moveSprites(performance.now());
    if (!reducedMotion.matches && !document.hidden && visible) frame = requestAnimationFrame(animate);
  }

  function resize() {
    const bounds = scene.getBoundingClientRect();
    width = Math.max(1, root.clientWidth);
    height = Math.max(1, bounds.height);
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
    canvas.height = Math.round(mountainHeight * ratio);
    canvas.style.setProperty('--landscape-height', `${mountainHeight}px`);
    context.setTransform(ratio, 0, 0, ratio, 0, -mountainTop * ratio);
    positionSky();
    paintScenery();
    moveSprites(performance.now());
  }

  scene.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const bounds = motion.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }, { passive: true });
  scene.addEventListener('pointerleave', () => { pointer = null; });
  reducedMotion.addEventListener('change', restart);
  document.addEventListener('visibilitychange', restart);
  new MutationObserver(() => { readColors(); paintScenery(); moveSprites(performance.now()); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; restart(); })
    .observe(scene);
  readColors();
  new ResizeObserver(resize).observe(scene);
  window.addEventListener('resize', resize, { passive: true });
  resize();
  restart();
})();
