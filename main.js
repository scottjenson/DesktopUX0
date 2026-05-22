const MENUBAR_H = 24;
const DOCK_W = 160;
const DOCK_R_W = 160;
const ICON_W = 100;
const ICON_H = 76;
const DOCK_INSET = 8;
const DOCK_BORDER_W = 148;
const ICON_LEFT  = DOCK_INSET + Math.round((DOCK_BORDER_W - ICON_W) / 2);
const ICON_RIGHT = window.innerWidth - DOCK_R_W + DOCK_INSET + Math.round((DOCK_BORDER_W - ICON_W) / 2);
const ICON_TOP_START = 48;
const ICON_GAP = 20;
const MARGIN = 40;

const stage = document.getElementById('stage');
const cursorRing = document.getElementById('cursor-ring');
const scene = document.getElementById('scene');

// Window definitions, renderers, and clip factories live in content.js

// ─── UNIFIED DOCK ───
// Each side tracks its own ordered list of docked card elements.
const dockItems = { left: [], right: [] };

function dockTop(index, side) {
  return ICON_TOP_START + index * (ICON_H + ICON_GAP);
}

function dockLeft(side) {
  if (side === 'left') return ICON_LEFT;
  return window.innerWidth - DOCK_R_W + DOCK_INSET + Math.round((DOCK_BORDER_W - ICON_W) / 2);
}

function restack(side) {
  dockItems[side].forEach((el, i) => {
    el.style.left = dockLeft(side) + 'px';
    el.style.top  = dockTop(i, side) + 'px';
  });
}

function addToDock(card, side) {
  const index = dockItems[side].length;
  dockItems[side].push(card);
  card.style.left = dockLeft(side) + 'px';
  card.style.top  = dockTop(index, side) + 'px';
  card.dataset.dockSide = side;
  stage.appendChild(card);
  attachDockCardBehavior(card);
}

function removeFromDock(card) {
  const side = card.dataset.dockSide;
  if (!side) return;
  const arr = dockItems[side];
  const idx = arr.indexOf(card);
  if (idx !== -1) arr.splice(idx, 1);
  card.remove();
  restack(side);
}

function attachDockCardBehavior(card) {
  if (card._dockBehaviorAttached) return;
  card._dockBehaviorAttached = true;
  let wasDragged = false;
  let startX, startY;

  startDrag(card, {
    onStart(e) {
      wasDragged = false;
      if (!card.dataset.dockSide) return false;
      const rect = card.getBoundingClientRect();
      card.style.left = rect.left + 'px';
      card.style.top  = rect.top + 'px';
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
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
        const side = card.dataset.dockSide;
        const arr = dockItems[side];
        const idx = arr.indexOf(card);
        if (idx !== -1) arr.splice(idx, 1);
        restack(side);
        delete card.dataset.dockSide;
      }
    },
  });

  card.addEventListener('click', () => {
    if (wasDragged) return;
    // Windows restore themselves; clip cards just dismiss
    if (card.classList.contains('window')) {
      restoreWindow(card);
    } else {
      removeFromDock(card);
    }
  });
}

// ─── WINDOW DOCK (minimize/restore) ───

function minimizeWindow(win, side = 'left') {
  win._restoreLeft = win.style.left;
  win._restoreTop  = win.style.top;
  win._restoreSide = side;

  const fullW = win.offsetWidth;
  const scale = ICON_W / fullW;

  const index = dockItems[side].length;
  dockItems[side].push(win);
  win.dataset.dockSide = side;

  win.style.transformOrigin = '0 0';
  win.style.left = dockLeft(side) + 'px';
  win.style.top  = dockTop(index, side) + 'px';
  win.style.transform = `scale(${scale})`;
  win.classList.add('minimized');
  attachDockCardBehavior(win);
}

function restoreWindow(win) {
  const side = win.dataset.dockSide || win._restoreSide || 'left';
  const arr = dockItems[side];
  const idx = arr.indexOf(win);
  if (idx !== -1) arr.splice(idx, 1);
  delete win.dataset.dockSide;

  win.style.transformOrigin = '';
  win.style.transform = '';
  win.style.left = win._restoreLeft;
  win.style.top  = win._restoreTop;
  win.classList.remove('minimized');

  restack(side);
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

// ─── UNIFIED SHIFT-DRAG ───

function attachShiftDrag(el, { makeCard, dragsElement = false } = {}) {
  let offsetX, offsetY, dragStartLeft, leftTargeted, rightTargeted, hasMoved;

  function cleanup(side) {
    if (dragsElement) el.classList.remove('dragging', 'shift-dragging');
    stage.classList.remove('dock-targeted', 'clipboard-targeted');
    clearShiftHighlight();
    if (!side) return;
    if (dragsElement && el.classList.contains('window')) {
      requestAnimationFrame(() => requestAnimationFrame(() => minimizeWindow(el, side)));
    } else {
      addToDock(makeCard(), side);
    }
  }

  startDrag(el, {
    onStart(e) {
      if (!stage.classList.contains('shift-drag-mode')) return false;
      if (dragsElement && el.classList.contains('minimized')) return false;
      e.stopPropagation();
      dragStartLeft = dragsElement ? el.offsetLeft : e.clientX;
      offsetX = e.clientX - (dragsElement ? el.offsetLeft : 0);
      offsetY = e.clientY - (dragsElement ? el.offsetTop  : 0);
      leftTargeted = false;
      rightTargeted = false;
      hasMoved = false;
      if (dragsElement) el.classList.add('dragging', 'shift-dragging');
    },
    onMove(e) {
      hasMoved = true;
      if (dragsElement) {
        el.style.left = (e.clientX - offsetX) + 'px';
        el.style.top  = (e.clientY - offsetY) + 'px';
        const currentLeft = el.offsetLeft;
        leftTargeted  = currentLeft < dragStartLeft - 20;
        rightTargeted = currentLeft > dragStartLeft + 20;
      } else {
        leftTargeted  = e.clientX < dragStartLeft - 20;
        rightTargeted = e.clientX > dragStartLeft + 20;
      }
      stage.classList.toggle('dock-targeted',      leftTargeted);
      stage.classList.toggle('clipboard-targeted', rightTargeted);
    },
    onUp() {
      if (!hasMoved && dragsElement && el.classList.contains('window')) {
        cleanup('left');
      } else {
        cleanup(leftTargeted ? 'left' : rightTargeted ? 'right' : null);
      }
    },
    onCancel() { cleanup(null); },
  });
}

// ─── WINDOW CREATION ───

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
  attachShiftDrag(win, { makeCard: null, dragsElement: true });
  attachMinimize(win);

  win.addEventListener('mousedown', (e) => {
    if (!win.classList.contains('minimized') && !e.target.classList.contains('tl')) scene.appendChild(win);
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

function attachMinimize(win) {
  win.querySelectorAll('.tl').forEach(tl => {
    tl.addEventListener('click', e => {
      e.stopPropagation();
      if (win.classList.contains('minimized')) {
        restoreWindow(win);
      } else {
        minimizeWindow(win, 'left');
      }
    });
  });
}

// ─── LAYOUT ───

function positionCenter(el) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  el.style.left = Math.round((vw - el.offsetWidth)  / 2) + 'px';
  el.style.top  = Math.round((vh - el.offsetHeight) / 2 + MENUBAR_H / 2) + 'px';
}

function positionCorner(el, corner) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top    = MENUBAR_H + MARGIN;
  const bottom = vh - el.offsetHeight - MARGIN;
  const left   = DOCK_W + MARGIN;
  const right  = vw - el.offsetWidth - DOCK_R_W - MARGIN;
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

scene.classList.add('no-transition');

windowTypes.forEach((def, i) => {
  const win = createWindow(def);
  scene.appendChild(win);
  if (i === 0) {
    positionCenter(win);
  } else {
    positionCorner(win, def.corner);
    minimizeWindow(win, 'left');
  }
});

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
    clearShiftHighlight();
  }
});

// ─── SHIFT HOVER HIGHLIGHT ───

let shiftHighlightedEl = null;
let highlightClone = null;

function clearShiftHighlight() {
  if (shiftHighlightedEl) {
    shiftHighlightedEl.classList.remove('shift-highlighted');
    const thumb = shiftHighlightedEl.querySelector('.finder-thumb');
    if (thumb) thumb.classList.remove('shift-highlighted');
    shiftHighlightedEl = null;
  }
  if (highlightClone) {
    highlightClone.remove();
    highlightClone = null;
  }
}

function createHighlightClone(span) {
  const spanRect = span.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const clone = document.createElement('div');
  clone.textContent = span.textContent;
  clone.style.cssText = `
    position: absolute;
    left: ${spanRect.left - stageRect.left}px;
    top: ${spanRect.top - stageRect.top}px;
    width: ${spanRect.width}px;
    height: ${spanRect.height}px;
    background: #b3d4ff;
    border-radius: 2px;
    padding: 0 2px;
    font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    font-size: 13.5px;
    line-height: ${spanRect.height}px;
    color: #1a1a1a;
    pointer-events: none;
    z-index: 9000;
    transform-origin: center center;
    transition: transform 0.25s ease, filter 0.25s ease;
  `;
  stage.appendChild(clone);

  requestAnimationFrame(() => {
    clone.style.outline = '3px solid red';
    clone.style.transform = 'scale(1.06) translateY(0px)';
    clone.style.filter = 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.5))';
  });

  return clone;
}

function updateShiftHighlight(x, y) {
  if (!stage.classList.contains('shift-drag-mode')) { clearShiftHighlight(); return; }

  const el = document.elementFromPoint(x, y);
  const target = el && (
    el.closest('.finder-icon') ||
    el.closest('.highlight') ||
    el.closest('.window:not(.minimized)')
  );

  if (target === shiftHighlightedEl) return;
  clearShiftHighlight();
  if (!target) return;

  if (target.classList.contains('highlight')) {
    highlightClone = createHighlightClone(target);
  } else if (target.classList.contains('finder-icon')) {
    const thumb = target.querySelector('.finder-thumb');
    (thumb || target).classList.add('shift-highlighted');
  } else {
    target.classList.add('shift-highlighted');
  }
  shiftHighlightedEl = target;
}

document.addEventListener('mousemove', e => {
  cursorRing.style.left = e.clientX + 'px';
  cursorRing.style.top  = e.clientY + 'px';
  updateShiftHighlight(e.clientX, e.clientY);
});
