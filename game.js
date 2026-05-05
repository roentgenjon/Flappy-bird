const Game = (() => {
  // Canvas & context
  let canvas, ctx;
  const W = 400, H = 600;

  // Game state
  let state; // 'idle' | 'playing' | 'dead' | 'paused'
  let score, lives, frameCount, raf;
  let difficulty;

  // Bird
  const bird = {
    x: 80, y: 0, vy: 0,
    w: 38, h: 28,
    gravity: 0.4, jumpForce: -5.7,
    rotation: 0,
    flapFrame: 0, flapTimer: 0,
    invincible: 0,
  };

  // Pipes
  let pipes = [];
  const PIPE_W = 60;
  const PIPE_GAP_BASE = 170;
  const PIPE_SPEED_BASE = 2.4;

  // Particles
  let particles = [];

  // Background scroll
  let bgX = 0, groundX = 0, cloudX = 0;

  // Clouds
  let clouds = [
    { x: 80, y: 60, s: 1.1 },
    { x: 220, y: 100, s: 0.8 },
    { x: 340, y: 50, s: 1.3 },
  ];

  // Colors
  const C = {
    sky1: '#70c5ce', sky2: '#a8e4ec',
    ground: '#ded895', groundLine: '#c8c87a',
    pipe: '#73bf2e', pipeDark: '#588a22', pipeShine: '#9fd860',
    bird1: '#f7b731', bird2: '#e0a020', birdWing: '#e67e22',
    beak: '#f39c12', eye: '#fff', pupil: '#222',
    cloud: 'rgba(255,255,255,0.85)',
  };

  function init(canvasEl) {
    canvas = canvasEl;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    bindInput();
  }

  function bindInput() {
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleFlap();
      }
      if (e.code === 'Escape') togglePause();
    });
    canvas.addEventListener('click', handleFlap);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); handleFlap(); }, { passive: false });
  }

  function handleFlap() {
    if (state === 'idle') {
      state = 'playing';
    }
    if (state === 'playing') {
      bird.vy = bird.jumpForce;
      bird.flapFrame = 0;
      spawnParticles(bird.x + bird.w / 2, bird.y + bird.h / 2, 4, '#f7b731');
    }
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      document.getElementById('pause-overlay').classList.remove('hidden');
    } else if (state === 'paused') {
      resume();
    }
  }

  function resume() {
    state = 'playing';
    document.getElementById('pause-overlay').classList.add('hidden');
    loop();
  }

  function getDifficulty() {
    if (score < 5) return { gap: PIPE_GAP_BASE, speed: PIPE_SPEED_BASE, interval: 100 };
    if (score < 15) return { gap: PIPE_GAP_BASE - 10, speed: PIPE_SPEED_BASE + 0.3, interval: 95 };
    if (score < 30) return { gap: PIPE_GAP_BASE - 25, speed: PIPE_SPEED_BASE + 0.7, interval: 88 };
    if (score < 50) return { gap: PIPE_GAP_BASE - 40, speed: PIPE_SPEED_BASE + 1.1, interval: 82 };
    return { gap: PIPE_GAP_BASE - 50, speed: PIPE_SPEED_BASE + 1.5, interval: 76 };
  }

  function spawnParticles(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1, color,
        r: Math.random() * 4 + 2,
      });
    }
  }

  function start() {
    score = 0;
    lives = 3;
    frameCount = 0;
    pipes = [];
    particles = [];
    bird.y = H / 2 - bird.h / 2;
    bird.vy = 0;
    bird.rotation = 0;
    bird.invincible = 0;
    bgX = 0; groundX = 0;
    state = 'idle';
    updateHUD();
    if (raf) cancelAnimationFrame(raf);
    loop();
  }

  function loop() {
    if (state === 'paused') return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function update() {
    frameCount++;
    difficulty = getDifficulty();
    bgX = (bgX - 0.5) % W;
    groundX = (groundX - difficulty.speed * 1.5) % 24;

    clouds.forEach(c => {
      c.x -= 0.4 * c.s;
      if (c.x < -100) c.x = W + 100;
    });

    if (state === 'idle') return;

    // Bird physics
    bird.vy += bird.gravity;
    bird.y += bird.vy;
    bird.rotation = Math.min(Math.PI / 2, Math.max(-0.4, bird.vy * 0.06));
    bird.flapTimer++;
    if (bird.flapTimer > 8) { bird.flapFrame = (bird.flapFrame + 1) % 3; bird.flapTimer = 0; }
    if (bird.invincible > 0) bird.invincible--;

    // Ground collision
    const groundY = H - 80;
    if (bird.y + bird.h >= groundY) {
      bird.y = groundY - bird.h;
      die();
      return;
    }

    // Ceiling
    if (bird.y <= 0) {
      bird.y = 0;
      bird.vy = 2;
    }

    // Spawn pipes
    if (frameCount % difficulty.interval === 0) {
      const minTop = 80;
      const maxTop = H - 80 - difficulty.gap - 80;
      const topH = Math.random() * (maxTop - minTop) + minTop;
      pipes.push({
        x: W + 10,
        topH,
        botY: topH + difficulty.gap,
        scored: false,
        highlight: 0,
      });
    }

    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= difficulty.speed;
      if (p.highlight > 0) p.highlight--;

      // Score
      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true;
        score++;
        p.highlight = 20;
        spawnParticles(p.x + PIPE_W / 2, H / 2, 8, '#73bf2e');
        updateHUD();
      }

      // Collision
      if (bird.invincible === 0) {
        const bx1 = bird.x + 4, bx2 = bird.x + bird.w - 4;
        const by1 = bird.y + 4, by2 = bird.y + bird.h - 4;
        const px1 = p.x, px2 = p.x + PIPE_W;
        if (bx2 > px1 && bx1 < px2) {
          if (by1 < p.topH || by2 > p.botY) {
            hitPipe();
          }
        }
      }

      if (p.x + PIPE_W < -10) pipes.splice(i, 1);
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.05;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function hitPipe() {
    lives--;
    bird.invincible = 90;
    spawnParticles(bird.x + bird.w / 2, bird.y + bird.h / 2, 12, '#e74c3c');
    updateHUD();
    if (lives <= 0) die();
  }

  function die() {
    if (state === 'dead') return;
    state = 'dead';
    cancelAnimationFrame(raf);
    spawnParticles(bird.x + bird.w / 2, bird.y + bird.h / 2, 20, '#f7b731');
    drawDeathFrame();
    setTimeout(() => {
      if (typeof onGameOver === 'function') onGameOver(score);
    }, 800);
  }

  function drawDeathFrame() {
    draw();
  }

  // ===== DRAWING =====
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawClouds();
    drawPipes();
    drawGround();
    drawParticles();
    if (state !== 'dead' || bird.invincible > 0) drawBird();
    if (state === 'idle') drawStartHint();
    if (state === 'playing') drawScorePop();
  }

  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, H - 80);
    grad.addColorStop(0, '#5ec8d4');
    grad.addColorStop(1, '#a8e4ec');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H - 80);
  }

  function drawClouds() {
    clouds.forEach(c => {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = C.cloud;
      const cx = c.x, cy = c.y, s = c.s * 40;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.6, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.5, cy - s * 0.2, s * 0.5, 0, Math.PI * 2);
      ctx.arc(cx + s, cy, s * 0.55, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.5, cy + s * 0.15, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPipes() {
    pipes.forEach(p => {
      const shine = p.highlight > 0;
      const fill = shine ? '#9fd860' : C.pipe;
      const dark = shine ? '#73bf2e' : C.pipeDark;

      // Top pipe
      drawPipeSegment(p.x, 0, PIPE_W, p.topH, fill, dark, 'top');
      // Bottom pipe
      drawPipeSegment(p.x, p.botY, PIPE_W, H - p.botY, fill, dark, 'bot');
    });
  }

  function drawPipeSegment(x, y, w, h, fill, dark, which) {
    const capH = 26, capW = w + 12, capX = x - 6;

    // Body
    ctx.fillStyle = dark;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 4, y, w - 12, h);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 6, y, 8, h);

    // Cap
    ctx.fillStyle = dark;
    if (which === 'top') {
      ctx.fillRect(capX, y + h - capH, capW, capH);
      ctx.fillStyle = fill;
      ctx.fillRect(capX + 4, y + h - capH, capW - 12, capH);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(capX + 6, y + h - capH, 10, capH);
    } else {
      ctx.fillRect(capX, y, capW, capH);
      ctx.fillStyle = fill;
      ctx.fillRect(capX + 4, y, capW - 12, capH);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(capX + 6, y, 10, capH);
    }
  }

  function drawGround() {
    const gY = H - 80;
    // Grass
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(0, gY, W, 18);
    // Dirt
    const grad = ctx.createLinearGradient(0, gY + 18, 0, H);
    grad.addColorStop(0, '#ded895');
    grad.addColorStop(1, '#c8b060');
    ctx.fillStyle = grad;
    ctx.fillRect(0, gY + 18, W, H - gY - 18);

    // Ground texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let x = groundX; x < W + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, gY + 18);
      ctx.lineTo(x - 12, H);
      ctx.stroke();
    }
  }

  function drawBird() {
    const bx = bird.x + bird.w / 2;
    const by = bird.y + bird.h / 2;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(bird.rotation);

    // Invincibility flash
    if (bird.invincible > 0 && Math.floor(bird.invincible / 6) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Wing positions based on flap frame
    const wingY = bird.flapFrame === 0 ? 4 : bird.flapFrame === 1 ? -2 : -8;

    // Wing
    ctx.fillStyle = C.birdWing;
    ctx.beginPath();
    ctx.ellipse(-4, wingY, 14, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 20);
    bodyGrad.addColorStop(0, '#ffe066');
    bodyGrad.addColorStop(1, C.bird2);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.w / 2 - 2, bird.h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(4, 4, 8, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye white
    ctx.fillStyle = C.eye;
    ctx.beginPath();
    ctx.arc(9, -5, 7, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = C.pupil;
    ctx.beginPath();
    ctx.arc(11, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(12, -7, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = C.beak;
    ctx.beginPath();
    ctx.moveTo(16, -2);
    ctx.lineTo(26, 1);
    ctx.lineTo(16, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c87a10';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 1);
    ctx.lineTo(26, 1);
    ctx.stroke();

    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawStartHint() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.roundRect ? ctx.roundRect(W / 2 - 110, H / 2 - 30, 220, 60, 12) : ctx.rect(W / 2 - 110, H / 2 - 30, 220, 60);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Tippen oder Leertaste', W / 2, H / 2 + 6);
    ctx.restore();
  }

  let scorePops = [];
  function drawScorePop() {
    scorePops = scorePops.filter(p => p.life > 0);
    scorePops.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = '#f7b731';
      ctx.font = `bold ${Math.round(28 * p.life + 12)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(`+1`, p.x, p.y);
      p.y -= 1.5;
      p.life -= 0.03;
      ctx.restore();
    });
  }

  // Listen for score change to add pop
  const _origUpdateHUD = () => {};
  function updateHUD() {
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('hud-best');
    const livesEl = document.getElementById('lives-display');
    if (scoreEl) scoreEl.textContent = score;
    if (bestEl) {
      const best = Math.max(score, Storage.getHighscore());
      bestEl.textContent = best;
    }
    if (livesEl) {
      livesEl.textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
    }

    if (score > 0) {
      scorePops.push({ x: W / 2, y: H / 3, life: 1 });
    }
  }

  return {
    init,
    start,
    togglePause,
    resume,
    getScore: () => score,
  };
})();

let onGameOver = null;
