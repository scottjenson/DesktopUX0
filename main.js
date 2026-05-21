const MENUBAR_H = 24;
const DOCK_W = 160;
const DOCK_R_W = 160; // reserved right-side dock area (not yet visible)
const ICON_W = 100;
const ICON_H = 76;
const DOCK_INSET = 8; // left inset of dock highlight border
const DOCK_BORDER_W = 148; // width of the visible dock box (DOCK_W - DOCK_INSET)
const ICON_LEFT = DOCK_INSET + Math.round((DOCK_BORDER_W - ICON_W) / 2);
const ICON_TOP_START = 48; // below menubar
const ICON_GAP = 20;
const MARGIN = 40; // gap from screen edges when restoring

const stage = document.getElementById('stage');
const cursorRing = document.getElementById('cursor-ring');
const scene = document.getElementById('scene');

// Window definitions — add more here as needed
// corner: which screen corner to restore to (for non-center windows)
// type: 'blank' | 'text' | 'finder'
const windowTypes = [
  { title: 'Untitled',  tint: null,      type: 'blank' },
  { title: 'Notes',     tint: '#fdf6c3', type: 'text',   corner: 'top-left' },
  { title: 'Research',  tint: '#d6eaff', type: 'finder', corner: 'top-right' },
  { title: 'Files',     tint: '#d4f0d4', type: 'blank',  corner: 'bottom-left' },
  { title: 'Messages',  tint: '#f5dde8', type: 'blank',  corner: 'bottom-right' },
];

const minimizedWindows = []; // ordered list of minimized window els

// ─── CONTENT RENDERERS ───

function renderText(body) {
  body.innerHTML = `
    <div class="text-content">
      <p>Following up on our meeting last Thursday — the revised timeline looks
      achievable if we keep the scope tight. I've updated the shared doc with
      the milestones we agreed on.</p>
      <p>The main blocker right now is sign-off from design —
      we can't move to staging until <span class="highlight">final assets are approved</span>.
      Once that's cleared I'll kick off the build.</p>
      <p>Let me know if you need anything else before the end of the week.</p>
    </div>
  `;
}

function renderFinder(body) {
  const images = [
    { name: 'IMG_4021.jpg', svg: `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="60" fill="#a8d8f0"/>
      <polygon points="0,60 30,28 50,42 62,30 80,60" fill="#4a7c59"/>
      <circle cx="62" cy="14" r="9" fill="#f9d84a"/>
    </svg>` },
    { name: 'Portrait.jpg', svg: `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="60" fill="#e8d5c4"/>
      <rect x="20" y="34" width="40" height="26" rx="4" fill="#c4956a"/>
      <circle cx="40" cy="26" r="14" fill="#e0b48a"/>
    </svg>` },
    { name: 'City.jpg', svg: `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="60" fill="#b0c4de"/>
      <rect x="5"  y="30" width="14" height="30" fill="#6a7fa0"/>
      <rect x="22" y="20" width="18" height="40" fill="#8294b5"/>
      <rect x="43" y="26" width="12" height="34" fill="#6a7fa0"/>
      <rect x="58" y="16" width="18" height="44" fill="#7080a0"/>
      <rect x="0"  y="48" width="80" height="12" fill="#4a5568"/>
    </svg>` },
    { name: 'Sunset.jpg', svg: `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="60" fill="#f4a460"/>
      <rect y="0"  width="80" height="15" fill="#e8604a"/>
      <rect y="15" width="80" height="15" fill="#f4803a"/>
      <rect y="30" width="80" height="12" fill="#f4a460"/>
      <rect y="42" width="80" height="18" fill="#2a4a6a"/>
      <path d="M24,42 a16,16 0 0,1 32,0" fill="#f9c84a"/>
    </svg>` },
    { name: 'Forest.jpg', svg: `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="60" fill="#c8e6c9"/>
      <rect y="44" width="80" height="16" fill="#5a7a4a"/>
      <polygon points="10,44 22,18 34,44" fill="#2e7d32"/>
      <polygon points="28,44 42,14 56,44" fill="#388e3c"/>
      <polygon points="46,44 58,20 70,44" fill="#2e7d32"/>
    </svg>` },
    { name: 'Abstract.jpg', svg: `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="60" fill="#f3e5f5"/>
      <circle cx="24" cy="28" r="18" fill="#ce93d8" opacity="0.8"/>
      <circle cx="52" cy="34" r="16" fill="#80cbc4" opacity="0.8"/>
      <circle cx="40" cy="20" r="13" fill="#fff59d" opacity="0.85"/>
    </svg>` },
  ];

  body.innerHTML = `<div class="finder-grid">${
    images.map(img => `
      <div class="finder-icon">
        <div class="finder-thumb">${img.svg}</div>
        <div class="finder-label">${img.name}</div>
      </div>
    `).join('')
  }</div>`;
}

function renderContent(type, body) {
  if (type === 'text') {
    renderText(body);
    // attach content drag to the highlight span after render
    const highlight = body.querySelector('.highlight');
    if (highlight) {
      attachContentDrag(highlight, () => makeTextClip(highlight.textContent));
    }
  }
  if (type === 'finder') {
    renderFinder(body);
    // attach content drag to each finder icon after render
    body.querySelectorAll('.finder-icon').forEach(icon => {
      const svgHTML = icon.querySelector('.finder-thumb').innerHTML;
      attachContentDrag(icon, () => makeImageClip(svgHTML));
    });
  }
}

// ─── DRAG HELPER ───

function startDrag(handle, { onStart, onMove, onUp, onCancel } = {}) {
  handle.addEventListener('mousedown', e => {
    if (onStart && onStart(e) === false) return;

    function handleUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', handleUp);
      if (onCancel) document.removeEventListener('shiftcancelled', handleCancel);
      if (onUp) onUp(e);
    }

    function handleCancel() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('shiftcancelled', handleCancel);
      if (onCancel) onCancel();
    }

    if (onMove) document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', handleUp);
    if (onCancel) document.addEventListener('shiftcancelled', handleCancel);
  });
}

// ─── CLIPBOARD DOCK ───
const CLIP_TOP_START = 48;
const CLIP_GAP = 20;
const clipItems = []; // ordered list of clip card els

function clipTop(index) {
  return CLIP_TOP_START + clipItems.slice(0, index).reduce((sum, el) => sum + el.offsetHeight + CLIP_GAP, 0);
}

function addClipCard(cardEl) {
  cardEl.style.top = clipTop(clipItems.length) + 'px';
  clipItems.push(cardEl);
  stage.appendChild(cardEl);

  attachClipDrag(cardEl);
}

function attachClipDrag(card) {
  let wasDragged = false;
  let startX, startY;

  startDrag(card, {
    onStart(e) {
      // Switch from right-anchored to left-anchored for free positioning
      const rect = card.getBoundingClientRect();
      card.style.right = 'auto';
      card.style.left = rect.left + 'px';
      card.style.top  = rect.top + 'px';
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      wasDragged = false;
    },
    onMove(e) {
      wasDragged = true;
      card.classList.add('dragging');
      card.style.left = (e.clientX - startX) + 'px';
      card.style.top  = (e.clientY - startY) + 'px';
    },
    onUp() {
      card.classList.remove('dragging');
      if (wasDragged) {
        const idx = clipItems.indexOf(card);
        if (idx !== -1) clipItems.splice(idx, 1);
      }
    },
  });

  card.addEventListener('click', () => {
    if (wasDragged) return; // don't dismiss if it was a drag
    const idx = clipItems.indexOf(card);
    if (idx !== -1) clipItems.splice(idx, 1);
    card.remove();
    // re-stack remaining right-anchored cards
    let y = CLIP_TOP_START;
    clipItems.forEach(c => {
      c.style.top = y + 'px';
      y += c.offsetHeight + CLIP_GAP;
    });
  });
}

function makeTextClip(text) {
  const card = document.createElement('div');
  card.className = 'clip-card';
  const p = document.createElement('div');
  p.className = 'clip-card-text';
  p.textContent = text;
  card.appendChild(p);
  return card;
}

function makeImageClip(svgHTML) {
  const card = document.createElement('div');
  card.className = 'clip-card';
  const img = document.createElement('div');
  img.className = 'clip-card-image';
  img.innerHTML = svgHTML;
  img.querySelector('svg').style.cssText = 'width:100%;height:auto;display:block;';
  card.appendChild(img);
  return card;
}

function attachContentDrag(el, makeClip) {
  let dragStartClientX, directionDecided, clipboardTargeted;

  function cleanup(shouldClip) {
    stage.classList.remove('clipboard-targeted');
    if (shouldClip) addClipCard(makeClip());
  }

  startDrag(el, {
    onStart(e) {
      if (!stage.classList.contains('shift-drag-mode')) return false;
      e.stopPropagation(); // don't bubble to window shift-drag
      dragStartClientX = e.clientX;
      directionDecided = false;
      clipboardTargeted = false;
    },
    onMove(e) {
      if (!directionDecided && Math.abs(e.clientX - dragStartClientX) >= 20) {
        directionDecided = true;
        clipboardTargeted = e.clientX > dragStartClientX;
        stage.classList.toggle('clipboard-targeted', clipboardTargeted);
      }
    },
    onUp()     { cleanup(clipboardTargeted); },
    onCancel() { cleanup(false); },
  });
}

function createWindow({ title, tint, type = 'blank' }) {
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

  renderContent(type, body);

  win.appendChild(titlebar);
  win.appendChild(body);

  attachDrag(win, titlebar);
  attachShiftDrag(win);
  attachMinimize(win);

  win.addEventListener('mousedown', () => {
    if (!win.classList.contains('minimized')) scene.appendChild(win); // bring to front
  });

  win.addEventListener('click', () => {
    if (win.classList.contains('minimized')) restoreWindow(win);
  });

  return win;
}

function attachDrag(win, handle) {
  let startX, startY;
  startDrag(handle, {
    onStart(e) {
      if (e.target.classList.contains('tl')) return false;
      startX = e.clientX - win.offsetLeft;
      startY = e.clientY - win.offsetTop;
      win.classList.add('dragging');
    },
    onMove(e) {
      win.style.left = (e.clientX - startX) + 'px';
      win.style.top  = (e.clientY - startY) + 'px';
    },
    onUp() {
      win.classList.remove('dragging');
    },
  });
}

function attachShiftDrag(win) {
  let offsetX, offsetY, dragStartClientX, directionDecided, dockTargeted;

  function cleanup(shouldDock) {
    win.classList.remove('dragging', 'shift-dragging');
    stage.classList.remove('dock-targeted');
    if (shouldDock) {
      // Remove dragging before minimizing so CSS transition fires
      requestAnimationFrame(() => minimizeWindow(win));
    }
  }

  startDrag(win, {
    onStart(e) {
      if (!stage.classList.contains('shift-drag-mode')) return false;
      if (win.classList.contains('minimized')) return false;
      dragStartClientX = e.clientX;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      directionDecided = false;
      dockTargeted = false;
      win.classList.add('dragging', 'shift-dragging');
    },
    onMove(e) {
      win.style.left = (e.clientX - offsetX) + 'px';
      win.style.top  = (e.clientY - offsetY) + 'px';
      if (!directionDecided && Math.abs(e.clientX - dragStartClientX) >= 20) {
        directionDecided = true;
        dockTargeted = e.clientX < dragStartClientX;
        stage.classList.toggle('dock-targeted', dockTargeted);
      }
    },
    onUp()     { cleanup(dockTargeted); },
    onCancel() { cleanup(false); },
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
  const left   = DOCK_W + MARGIN;
  const right  = vw - w - DOCK_R_W - MARGIN;
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

document.addEventListener('keydown', e => {
  if (e.key === 'Shift' && !e.repeat) stage.classList.add('shift-drag-mode');
});

document.addEventListener('keyup', e => {
  if (e.key === 'Shift') {
    stage.classList.remove('shift-drag-mode', 'dock-targeted', 'clipboard-targeted');
    document.dispatchEvent(new Event('shiftcancelled'));
  }
});

document.addEventListener('mousemove', e => {
  cursorRing.style.left = e.clientX + 'px';
  cursorRing.style.top  = e.clientY + 'px';
});
