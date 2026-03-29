import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

const TEXT = `Build Places, Not Products

I'll start where it started: Gmail, midnight, me looking up from the fluorescent screen to the sky outside my window—dark but open, a few thin clouds drifting past the treetops, the kind of depth that reminds you there's air beyond the glass. By contrast, the inbox on my screen looked like a lab: white tiles, hard light, rows of cells, sterile and devoid of life.

For Cora, the AI-enabled email assistant we're building at Every, we wanted more of what was outside my window and less of what was glowing on my screen: Outside air, inside the app. I took the idea to Midjourney: skies, oil-paint textures, soft depth—the kind of details that add up to a place where you want to spend time.

The first images we generated looked perfect in Figma: highly detailed oil-paintings, impressionist brushwork, all in 4k image quality. In production, it fell apart. The more emails the user had, though, the bigger their Cora Brief became, and the more the background stretched and pixelated. We needed 8k, sometimes 10k-pixel resolution just to maintain the painting's integrity. Each image iteration grew heavier and heavier. We were generating images with heights over 18k pixels. Pages would've taken eons to load.

From an engineering perspective, it made no sense. You don't use a massive image for a background when you can't predict page height, because if everyone is getting a different view of the image, you can't guarantee a coherent experience. Our approach violated other "best practices" of product design, too: You don't add texture when flat colors load instantly. You don't choose paintings over flat backdrops when you're building software that needs to work on every connection speed.

But we weren't just building software. We were building a place.

We talk about online places as spaces—Slack channels are "rooms," Twitter a "public square"—but we don't really think of them that way, and we even less design them that way. Even the apps we don't label as spaces, like Gmail, are sometimes rooms we inhabit for hours of our day. Most of them feel like conference rooms under fluorescent lights. Functional? Yes. Somewhere you want to be? No.

We solved the engineering for our painted-sky backgrounds. More importantly, we discovered something: Art direction is product architecture. It makes trade-offs clearer, keeps the experience coherent, and gives people a reason to choose your product in a world where AI can generate the median in seconds.

The gravity of sameness

Open any design gallery—Dribbble, Behance, wherever designers show their best—and squint. Dashboards blur: rounded corners, neutral grays, tidy rows of cards. Landing pages collapse into one rhythm: hero text left, image right, three features below. We got so good at a certain kind of design, and that kind of design is so effective, that the outcome looks nearly identical across the web.

With good reason: Style guides gave teams shared rules to follow. Design systems turned those rules into reusable patterns. Utility frameworks like Tailwind made those patterns shippable in code. Each step improved access and reliability, but it also narrowed the expressive range. When teams reach for the same components, apply the same spacing scale, and follow the same accessibility guidelines (as we should), differentiation becomes a deliberate fight against defaults.

Now add AI. Ask a model to "design a SaaS dashboard" and it returns the statistical median: sidebar navigation, metric cards, data table. Competent, functional, and forgettable. As AI-built interfaces become tomorrow's training data, the effect compounds. The median tightens. The web accelerates toward a single, hyper-optimized, bloodless template.

When sameness costs nothing, difference carries the value.

Ship the atmosphere

Software is content now. AI can generate a competent interface in seconds. Components are commodified. Patterns are free. The defensible position is to care about what machines can't: how a place feels. But making it "pretty" isn't enough. You have to articulate texture—oil-painted, soft depth, breathing motion—and turn that into rules. The tools are changing, but the need for atmosphere isn't. It's more important, now, than ever.

Every surface someone touches should feel like somewhere they chose to be. Every room should carry its own quality of light. Every interaction should remind them that humans made this, for humans.

The internet doesn't have to look like an office park. We can add texture. We can create depth. We can build places worth being. Make the internet beautiful. That's the guiding principle. Everything else follows.`;

const FONT_FAMILY = '"Inter", system-ui, -apple-system, sans-serif';
const PADDING = 28;
const BG = '#0a0a0a';
const MORPH_RADIUS = 300;
const FRICTION = 0.95;

let canvas, ctx, dpr, W, H;
let lines = [];
let totalHeight = 0, maxScroll = 0;
let scrollY = 0, scrollVelocity = 0;
let touchLastY = 0, touchLastTime = 0, isTouching = false;
let pinchActive = false, pinchStartDist = 0, pinchStartCenter = 0, pinchStartEdge = 0;
let CENTER_FONT_SIZE = 26, EDGE_FONT_SIZE = 11;

function init() {
  const container = document.getElementById('demo-canvas');
  canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none';
  canvas.style.borderRadius = '12px';
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  setupTouch();
  setupWheel();
  requestAnimationFrame(loop);
}

function resize() {
  const container = document.getElementById('demo-canvas');
  dpr = Math.min(devicePixelRatio || 1, 3);
  W = container.clientWidth;
  H = container.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  layoutText();
}

function layoutText() {
  const maxW = W - PADDING * 2;
  const fs = CENTER_FONT_SIZE;
  const lh = fs * (22 / 14);
  const titleFs = 32, titleLh = 40;
  const paragraphs = TEXT.split('\n\n');
  lines = [];
  let curY = PADDING + 10;

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const para = paragraphs[pi].trim();
    if (!para) continue;
    const isFirst = pi === 0;
    const isSubhead = !isFirst && para.length < 60 && !para.includes('.');
    const useFontSize = isFirst ? titleFs : fs;
    const useLineHeight = isFirst ? titleLh : lh;
    const weight = (isFirst || isSubhead) ? 600 : 400;
    const font = `${weight} ${useFontSize}px ${FONT_FAMILY}`;
    ctx.font = font;
    const prepared = prepareWithSegments(para, font);
    const result = layoutWithLines(prepared, maxW, useLineHeight);
    for (let li = 0; li < result.lines.length; li++) {
      lines.push({
        text: result.lines[li].text,
        y: curY + li * useLineHeight,
        isTitle: isFirst, isSubhead,
        baseSize: useFontSize, weight,
      });
    }
    curY += result.lines.length * useLineHeight;
    curY += isFirst ? titleLh * 0.5 : lh * 0.6;
  }
  totalHeight = curY + PADDING;
  maxScroll = Math.max(0, totalHeight - H);
}

function pinchDist(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.hypot(dx, dy);
}

function setupTouch() {
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinchActive = true; pinchStartDist = pinchDist(e);
      pinchStartCenter = CENTER_FONT_SIZE; pinchStartEdge = EDGE_FONT_SIZE;
      scrollVelocity = 0; isTouching = false;
    } else if (e.touches.length === 1 && !pinchActive) {
      isTouching = true; scrollVelocity = 0;
      touchLastY = e.touches[0].clientY;
      touchLastTime = performance.now();
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (pinchActive && e.touches.length === 2) {
      const scale = pinchDist(e) / pinchStartDist;
      const nc = Math.round(Math.min(60, Math.max(14, pinchStartCenter * scale)));
      const ne = Math.round(Math.min(30, Math.max(6, pinchStartEdge * scale)));
      if (nc !== CENTER_FONT_SIZE || ne !== EDGE_FONT_SIZE) {
        CENTER_FONT_SIZE = nc; EDGE_FONT_SIZE = ne; layoutText();
      }
      e.preventDefault(); return;
    }
    if (!isTouching) return;
    const y = e.touches[0].clientY;
    const dy = touchLastY - y;
    const now = performance.now();
    const dt = now - touchLastTime;
    scrollY += dy;
    scrollY = Math.max(-50, Math.min(maxScroll + 50, scrollY));
    if (dt > 0) scrollVelocity = (dy / dt) * 16;
    touchLastY = y; touchLastTime = now;
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) pinchActive = false;
    if (e.touches.length === 0) isTouching = false;
  });
}

function setupWheel() {
  canvas.addEventListener('wheel', (e) => {
    scrollY += e.deltaY;
    scrollY = Math.max(-50, Math.min(maxScroll + 50, scrollY));
    e.preventDefault();
  }, { passive: false });
}

function loop() {
  if (!isTouching) {
    scrollY += scrollVelocity;
    scrollVelocity *= FRICTION;
    if (scrollY < 0) { scrollY *= 0.85; scrollVelocity *= 0.5; }
    else if (scrollY > maxScroll) { scrollY = maxScroll + (scrollY - maxScroll) * 0.85; scrollVelocity *= 0.5; }
    if (Math.abs(scrollVelocity) < 0.1) scrollVelocity = 0;
  }
  render();
  requestAnimationFrame(loop);
}

function render() {
  const d = dpr;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W * d, H * d);
  const viewCenter = H / 2;
  ctx.textBaseline = 'top';

  for (const line of lines) {
    const screenY = line.y - scrollY;
    if (screenY < -80 || screenY > H + 80) continue;
    const dist = Math.abs(screenY - viewCenter);
    const t = Math.min(dist / MORPH_RADIUS, 1);
    const ease = 1 - (1 - t) ** 3;

    const centerSize = line.isTitle ? 32 : line.isSubhead ? 28 : CENTER_FONT_SIZE;
    const edgeSize = line.isTitle ? 14 : line.isSubhead ? 12 : EDGE_FONT_SIZE;
    const fontSize = centerSize + (edgeSize - centerSize) * ease;
    const opacity = 1.0 + (0.25 - 1.0) * ease;
    const c = Math.round(255 - (255 - 102) * ease);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = `rgb(${c},${c},${c})`;
    ctx.font = `${line.weight} ${fontSize * d}px ${FONT_FAMILY}`;
    const yOffset = (fontSize - line.baseSize) * 0.5;
    ctx.fillText(line.text, PADDING * d, (screenY - yOffset) * d);
    ctx.restore();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
