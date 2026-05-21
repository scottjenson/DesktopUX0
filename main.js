const MENUBAR_H = 24;

// Window definitions — add more here as needed
const windowTypes = [
  { title: 'Untitled', tint: null },
];

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
  return win;
}

function positionCenter(el) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  el.style.left = Math.round((vw - w) / 2) + 'px';
  el.style.top  = Math.round((vh - h) / 2 + MENUBAR_H / 2) + 'px';
}

const scene = document.getElementById('scene');

windowTypes.forEach(def => {
  const win = createWindow(def);
  scene.appendChild(win);
  positionCenter(win);
});

window.addEventListener('resize', () => {
  scene.querySelectorAll('.window').forEach(positionCenter);
});
