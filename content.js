// ─── WINDOW DEFINITIONS ───
// corner: which screen corner to restore to (for non-center windows)
// type: 'blank' | 'text' | 'finder'

const windowTypes = [
  { title: 'Untitled',  tint: null,      type: 'blank' },
  { title: 'Notes',     tint: '#fdf6c3', type: 'text',   corner: 'top-left' },
  { title: 'Research',  tint: '#d6eaff', type: 'finder', corner: 'top-right' },
  { title: 'Files',     tint: '#d4f0d4', type: 'blank',  corner: 'bottom-left' },
  { title: 'Messages',  tint: '#f5dde8', type: 'blank',  corner: 'bottom-right' },
];

// ─── CLIP CARD FACTORIES ───

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
    const highlight = body.querySelector('.highlight');
    if (highlight) {
      attachShiftDrag(highlight, {
        makeCard: () => makeTextClip(highlight.textContent),
        dragsElement: false,
      });
    }
  }
  if (type === 'finder') {
    renderFinder(body);
    body.querySelectorAll('.finder-icon').forEach(icon => {
      const svgHTML = icon.querySelector('.finder-thumb').innerHTML;
      attachShiftDrag(icon, {
        makeCard: () => makeImageClip(svgHTML),
        dragsElement: false,
      });
    });
  }
}
