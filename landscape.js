// A small, self-contained canvas scene. All text and navigation remain ordinary HTML.
(() => {
  const scene = document.querySelector('.night-landscape');
  const canvas = scene?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const homes = [[.08, .48], [.18, .62], [.27, .38], [.36, .57], [.45, .46], [.54, .65], [.63, .37], [.72, .58], [.82, .43], [.92, .64]];
  const flies = homes.map(([x, y], index) => ({ x, y, phase: index * 1.91, offsetX: 0, offsetY: 0 }));
  const ridges = [
    { token: '--ridge-back', points: [.58, .38, .53, .19, .42, .31, .5, .25, .43] },
    { token: '--ridge-mid', points: [.62, .72, .49, .64, .76, .57, .36, .52, .4] },
    { token: '--ridge-front', points: [.85, .74, .83, .71, .88, .77, .86, .67, .8] }
  ];
  let width = 1;
  let height = 180;
  let frame = 0;
  let lastDraw = 0;
  let visible = true;
  let pointer = null;
  let colors;

  function readColors() {
    const style = getComputedStyle(root);
    const token = name => style.getPropertyValue(name).trim();
    colors = { paper: token('--paper'), fly: token('--firefly'), wings: token('--muted') };
    ridges.forEach(ridge => { ridge.color = token(ridge.token); });
  }

  function draw(now) {
    context.clearRect(0, 0, width, height);
    for (const ridge of ridges) {
      context.beginPath();
      context.moveTo(0, ridge.points[0] * height);
      for (let i = 0; i < ridge.points.length - 1; i++) {
        const start = i * width / 8;
        const end = (i + 1) * width / 8;
        context.bezierCurveTo(start + width / 20, ridge.points[i] * height,
          end - width / 20, ridge.points[i + 1] * height, end, ridge.points[i + 1] * height);
      }
      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();
      context.fillStyle = ridge.color;
      context.fill();
    }

    const fade = context.createLinearGradient(0, height * .78, 0, height);
    fade.addColorStop(0, `${colors.paper}00`);
    fade.addColorStop(1, colors.paper);
    context.fillStyle = fade;
    context.fillRect(0, height * .78, width, height * .22);

    const time = reducedMotion.matches ? 0 : now / 1000;
    for (const fly of flies) {
      const p = fly.phase;
      let x = (fly.x + Math.sin(time * .19 + p) * .115 + Math.sin(time * .53 + p) * .025) * width;
      let y = (fly.y + Math.sin(time * .31 + p) * .17 + Math.cos(time * .67 + p) * .03) * height;
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
      y = Math.max(height * .13, Math.min(height * .83, y + fly.offsetY));
      const glow = reducedMotion.matches ? .65 : .45 + .4 * Math.pow((1 + Math.sin(time * 1.7 + p)) / 2, 2);
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

  function resize() {
    const bounds = scene.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  }

  scene.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const bounds = scene.getBoundingClientRect();
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
  resize();
  restart();
})();
