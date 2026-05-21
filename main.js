const MENUBAR_H = 24;
const ICON_W = 120;
const ICON_H = 92;
const ICON_LEFT = 12;
const ICON_TOP_START = 48; // below menubar
const ICON_GAP = 12;
const MARGIN = 40; // gap from screen edges when restoring

// Window definitions — add more here as needed
// corner: which screen corner to restore to (for non-center windows)
const windowTypes = [
  { title: 'Untitled',  tint: null },
  { title: 'Notes',     tint: 'rgba(255, 243, 176, 0.55)', corner: 'top-left' },
  { title: 'Research',  tint: 'rgba(176, 217, 255, 0.55)', corner: 'top-right' },
  { title: 'Files',     tint: 'rgba(188, 255, 188, 0.55)', corner: 'bottom-left' },
  { title: 'Messages',  tint: 'rgba(255, 200, 220, 0.55)', corner: 'bottom-right' },
];

const minimizedWindows = []; // ordered list of minimized window els

function createWindow({ title, tint }) {
  const win = document.createElement('div');
  win.className = 'window';

  const titlebar = document.createElement('div');
  titlebar.className = 'window-titlebar';
  titlebar.innerHTML = `
    <div class="traffic-lights">
      <div class="tl red"></div>
      <div class="tl yellow"></div>
      <div class="tl green"></div>
    </div>
    <span class="window-title">${title}</span>
  `;

  const body = document.createElement('div');
  body.className = 'window-body';
  if (tint) body.style.backgroundColor = tint;

  win.appendChild(titlebar);
  win.appendChild(body);

  attachDrag(win, titlebar);
  attachShiftDrag(win);
  attachMinimize(win);

  win.addEventListener('click', () => {
    if (win.classList.contains('minimized')) restoreWindow(win);
  });

  return win;
}

function attachDrag(win, handle) {
  handle.addEventListener('mousedown', e => {
    // Don't drag when clicking traffic lights
    if (e.target.classList.contains('tl')) return;

    const startX = e.clientX - win.offsetLeft;
    const startY = e.clientY - win.offsetTop;

    win.classList.add('dragging');

    function onMove(e) {
      win.style.left = (e.clientX - startX) + 'px';
      win.style.top  = (e.clientY - startY) + 'px';
    }

    function onUp() {
      win.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function attachShiftDrag(win) {
  win.addEventListener('mousedown', e => {
    if (!stage.classList.contains('shift-drag-mode')) return;
    if (win.classList.contains('minimized')) return;

    const startX = e.clientX - win.offsetLeft;
    const startY = e.clientY - win.offsetTop;

    win.classList.add('dragging', 'shift-dragging');

    function onMove(e) {
      win.style.left = (e.clientX - startX) + 'px';
      win.style.top  = (e.clientY - startY) + 'px';
    }

    function onUp() {
      win.classList.remove('dragging', 'shift-dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function attachMinimize(win) {
  const lights = win.querySelectorAll('.tl');
  lights.forEach(tl => {
    tl.addEventListener('click', e => {
      e.stopPropagation();
      if (win.classList.contains('minimized')) {
        restoreWindow(win);
      } else {
        minimizeWindow(win);
      }
    });
  });
}

function iconTop(index) {
  return ICON_TOP_START + index * (ICON_H + ICON_GAP);
}

function minimizeWindow(win) {
  // Save current position for restore
  win._restoreLeft = win.style.left;
  win._restoreTop  = win.style.top;

  const index = minimizedWindows.length;
  minimizedWindows.push(win);

  const fullW = win.offsetWidth;
  const fullH = win.offsetHeight;
  const scale = ICON_W / fullW;

  const targetLeft = ICON_LEFT;
  const targetTop  = iconTop(index);

  // Shift origin to top-left before scaling so it lands at the right spot
  win.style.transformOrigin = '0 0';
  win.style.left = targetLeft + 'px';
  win.style.top  = targetTop + 'px';
  win.style.transform = `scale(${scale})`;
  win.classList.add('minimized');
}

function restoreWindow(win) {
  const index = minimizedWindows.indexOf(win);
  if (index !== -1) minimizedWindows.splice(index, 1);

  win.style.transformOrigin = '';
  win.style.transform = '';
  win.style.left = win._restoreLeft;
  win.style.top  = win._restoreTop;
  win.classList.remove('minimized');

  // Re-stack remaining icons
  minimizedWindows.forEach((w, i) => {
    w.style.top = iconTop(i) + 'px';
  });
}

function positionCenter(el) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  el.style.left = Math.round((vw - w) / 2) + 'px';
  el.style.top  = Math.round((vh - h) / 2 + MENUBAR_H / 2) + 'px';
}

function positionCorner(el, corner) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const top    = MENUBAR_H + MARGIN;
  const bottom = vh - h - MARGIN;
  const left   = ICON_LEFT + ICON_W + MARGIN;
  const right  = vw - w - MARGIN;
  const positions = {
    'top-left':     { x: left,  y: top    },
    'top-right':    { x: right, y: top    },
    'bottom-left':  { x: left,  y: bottom },
    'bottom-right': { x: right, y: bottom },
  };
  const { x, y } = positions[corner];
  el.style.left = Math.round(x) + 'px';
  el.style.top  = Math.round(y) + 'px';
}

const scene = document.getElementById('scene');

// Suppress all transitions during initial layout
scene.classList.add('no-transition');

windowTypes.forEach((def, i) => {
  const win = createWindow(def);
  scene.appendChild(win);
  if (i === 0) {
    positionCenter(win);
  } else {
    positionCorner(win, def.corner);
    minimizeWindow(win);
  }
});

// Re-enable transitions after first paint
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    scene.classList.remove('no-transition');
  });
});

window.addEventListener('resize', () => {
  scene.querySelectorAll('.window:not(.minimized)').forEach(positionCenter);
});

// ─── SHIFT-DRAG MODE ───
const stage = document.getElementById('stage');
const cursorRing = document.getElementById('cursor-ring');

document.addEventListener('keydown', e => {
  if (e.key === 'Shift') stage.classList.add('shift-drag-mode');
});

document.addEventListener('keyup', e => {
  if (e.key === 'Shift') stage.classList.remove('shift-drag-mode');
});

document.addEventListener('mousemove', e => {
  cursorRing.style.left = e.clientX + 'px';
  cursorRing.style.top  = e.clientY + 'px';
});
