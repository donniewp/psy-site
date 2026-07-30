import fs from 'fs';
import path from 'path';

// Единая графическая грамматика: 24x24, обводка 1.5, круглые концы/стыки, без заливок.
const STROKE = 1.5;

const icons = {
  // ---- Трудности (С чем работаем) ----
  'problem-school': {
    label: 'Скоро в школу',
    group: 'Трудности',
    body: `
      <path d="M4 7 L11 5.5 L11 17.5 L4 19 Z" />
      <path d="M20 7 L13 5.5 L13 17.5 L20 19 Z" />
    `,
  },
  'problem-adapt': {
    label: 'Трудно адаптируется',
    group: 'Трудности',
    body: `
      <rect x="4" y="4" width="10" height="10" rx="2" />
      <circle cx="16" cy="16" r="5.5" />
    `,
  },
  'problem-anxiety': {
    label: 'Тревожность и страхи',
    group: 'Трудности',
    body: `
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 5.5 a6.5 6.5 0 0 1 6.5 6.5" />
      <path d="M12 2 a10 10 0 0 1 9.5 7" />
    `,
  },
  'problem-attention': {
    label: 'Рассеянное внимание',
    group: 'Трудности',
    body: `
      <circle cx="12" cy="12" r="1.5" />
      <line x1="12" y1="12" x2="19" y2="8" />
      <line x1="12" y1="12" x2="5" y2="7" />
      <line x1="12" y1="12" x2="18" y2="18" />
      <line x1="12" y1="12" x2="6" y2="17" />
      <line x1="12" y1="12" x2="12" y2="4" />
    `,
  },
  'problem-social': {
    label: 'Сложно в общении',
    group: 'Трудности',
    body: `
      <circle cx="5.3" cy="12" r="3.3" />
      <circle cx="18.7" cy="12" r="3.3" />
      <path d="M9.5 9.8 l2.1 2.2 l-1.6 1.4 l2.1 2.2" />
    `,
  },
  'problem-overflow': {
    label: 'Эмоции через край',
    group: 'Трудности',
    body: `
      <path d="M6.5 10 L7.5 18 a1.5 1.5 0 0 0 1.5 1.3 h5.8 a1.5 1.5 0 0 0 1.5 -1.3 L18.4 10" />
      <path d="M5 8 q1.75 -1.9 3.5 0 q1.75 -1.9 3.5 0 q1.75 -1.9 3.5 0 q1.75 -1.9 3.5 0" />
    `,
  },
  'problem-speech': {
    label: 'Речь и моторика',
    group: 'Трудности',
    body: `
      <path d="M4.5 6.5 h14 a2 2 0 0 1 2 2 v6 a2 2 0 0 1 -2 2 h-7.5 l-3 3 v-3 h-1.5 a2 2 0 0 1 -2 -2 v-6 a2 2 0 0 1 2 -2 Z" />
      <circle cx="9.3" cy="10.8" r="0.75" />
      <circle cx="12" cy="10.8" r="0.75" />
      <circle cx="14.7" cy="10.8" r="0.75" />
    `,
  },
  'problem-motivation': {
    label: 'Нет интереса к занятиям',
    group: 'Трудности',
    body: `
      <rect x="5" y="8" width="12" height="8" rx="1.6" />
      <rect x="17.3" y="10.3" width="1.8" height="3.4" rx="0.6" />
      <line x1="7" y1="13" x2="9" y2="13" />
    `,
  },

  // ---- Возрастные группы (Программы) ----
  'age-toddlers': {
    label: 'Малыши',
    group: 'Возрастные группы',
    body: `
      <path d="M9.5 5.5 h5 v2.8 h-5 Z" />
      <path d="M8.3 8.3 h7.4 v9.2 a2.2 2.2 0 0 1 -2.2 2.2 h-3 a2.2 2.2 0 0 1 -2.2 -2.2 Z" />
      <line x1="8.3" y1="13" x2="15.7" y2="13" />
    `,
  },
  'age-preschool': {
    label: 'Дошкольники',
    group: 'Возрастные группы',
    body: `
      <rect x="5" y="11" width="8" height="8" rx="1.2" />
      <rect x="12" y="5" width="8" height="8" rx="1.2" />
    `,
  },
  'age-school': {
    label: 'Школьники',
    group: 'Возрастные группы',
    body: `
      <rect x="5.5" y="8" width="13" height="12.5" rx="3" />
      <path d="M9 8 v-1.8 a1.6 1.6 0 0 1 1.6 -1.6 h2.8 a1.6 1.6 0 0 1 1.6 1.6 V8" />
      <rect x="8.7" y="12" width="6.6" height="4" rx="1" />
    `,
  },
  'age-individual': {
    label: 'Индивидуально',
    group: 'Возрастные группы',
    body: `
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.4" />
    `,
  },

  // ---- Блоки «Развивай-ка» ----
  'block-read': {
    label: 'Читай-ка',
    group: 'Развивай-ка',
    body: `
      <path d="M4 7 L11 5.5 L11 17.5 L4 19 Z" />
      <path d="M20 7 L13 5.5 L13 17.5 L20 19 Z" />
    `,
  },
  'block-neuro': {
    label: 'Нейрон-ка',
    group: 'Развивай-ка',
    body: `
      <circle cx="6" cy="7.5" r="1.9" />
      <circle cx="18" cy="7.5" r="1.9" />
      <circle cx="12" cy="18" r="1.9" />
      <line x1="7.5" y1="8.8" x2="10.7" y2="16.2" />
      <line x1="16.5" y1="8.8" x2="13.3" y2="16.2" />
      <line x1="7.9" y1="7.5" x2="16.1" y2="7.5" />
    `,
  },
  'block-sand': {
    label: 'Песчинка',
    group: 'Развивай-ка',
    body: `
      <path d="M4 8 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0" />
      <path d="M4 13 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0" />
      <path d="M4 18 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0" />
    `,
  },
  'block-draw': {
    label: 'Рисовалка',
    group: 'Развивай-ка',
    body: `
      <line x1="6" y1="18" x2="15" y2="9" />
      <path d="M15 9 l2 -2 l2 2 l-2 2 Z" />
      <line x1="5" y1="19" x2="7" y2="19" />
    `,
  },
  'block-logic': {
    label: 'Разумей-ка',
    group: 'Развивай-ка',
    body: `
      <rect x="4.8" y="4.8" width="8.5" height="8.5" transform="rotate(45 9 9)" />
      <rect x="10.7" y="10.7" width="8.5" height="8.5" transform="rotate(45 15 15)" />
    `,
  },

  // ---- Прайс: программы (Цены) ----
  'price-sprout': {
    label: 'Раннее развитие',
    group: 'Цены',
    body: `
      <line x1="12" y1="20" x2="12" y2="10" />
      <path d="M12 12.5 q-4 -1 -5 -6.5 q5 0 5 5" />
      <path d="M12 10.5 q4 -1 5 -6.5 q-5 0 -5 5" />
    `,
  },
  'price-home': {
    label: 'Подготовка «Старт»',
    group: 'Цены',
    body: `
      <path d="M4 12 L12 5 L20 12" />
      <line x1="6.5" y1="11.5" x2="6.5" y2="19" />
      <line x1="17.5" y1="11.5" x2="17.5" y2="19" />
      <line x1="6.5" y1="19" x2="17.5" y2="19" />
    `,
  },
  'price-cap': {
    label: 'Супер класс / образование',
    group: 'Цены',
    body: `
      <path d="M12 6 L21 10 L12 14 L3 10 Z" />
      <path d="M7 11.6 v3.6 q5 3 10 0 v-3.6" />
    `,
  },
  'price-sand': {
    label: 'Песок и глина',
    group: 'Цены',
    body: `
      <path d="M4 8 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0" />
      <path d="M4 13 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0" />
      <path d="M4 18 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0 q2 -2.4 4 0" />
    `,
  },

  // ---- Служебные ----
  'svc-phone': {
    label: 'Телефон',
    group: 'Служебные',
    body: `
      <path d="M8 4.5 h3 l1 3.5 -2 2 c1 2.8 2.7 4.5 5.5 5.5 l2 -2 3.5 1 v3 c0 1.3 -1.2 2.2 -2.5 1.9 C13 19.2 8.3 14.5 7.1 8.5 6.8 7.2 6.7 5.2 8 4.5 Z" />
    `,
  },
  'svc-telegram': {
    label: 'Телеграм',
    group: 'Служебные',
    body: `
      <path d="M4 12 L20 4.5 L14.5 20 L11 13 L4 12 Z" />
      <line x1="11" y1="13" x2="17" y2="8" />
    `,
  },
  'svc-arrow': {
    label: 'Стрелка',
    group: 'Служебные',
    body: `
      <line x1="4" y1="12" x2="18" y2="12" />
      <path d="M13 7 l5 5 l-5 5" />
    `,
  },
  'svc-check': {
    label: 'Галочка',
    group: 'Служебные',
    body: `
      <path d="M5 12.5 l4.5 4.5 l9.5 -10.5" />
    `,
  },
  'svc-cross': {
    label: 'Крестик',
    group: 'Служебные',
    body: `
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    `,
  },
  'svc-pin': {
    label: 'Метка',
    group: 'Служебные',
    body: `
      <path d="M12 3 a6 6 0 0 1 6 6 c0 4.5 -6 12 -6 12 s-6 -7.5 -6 -12 a6 6 0 0 1 6 -6 Z" />
      <circle cx="12" cy="9" r="2.1" />
    `,
  },
  'svc-metro': {
    label: 'Метро',
    group: 'Служебные',
    body: `
      <rect x="5" y="6" width="14" height="10" rx="3" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <circle cx="8.5" cy="18.5" r="1.2" />
      <circle cx="15.5" cy="18.5" r="1.2" />
    `,
  },
  'svc-clock': {
    label: 'Часы',
    group: 'Служебные',
    body: `
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5 v5 l3.5 2" />
    `,
  },
  'svc-plus': {
    label: 'Плюс (раскрыть)',
    group: 'Служебные',
    body: `
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="6" y1="12" x2="18" y2="12" />
    `,
  },
  'svc-minus': {
    label: 'Минус (свернуть)',
    group: 'Служебные',
    body: `
      <line x1="6" y1="12" x2="18" y2="12" />
    `,
  },
};

const iconsDir = 'src/icons';
fs.mkdirSync(iconsDir, { recursive: true });

const svgWrap = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;

for (const [, def] of Object.entries(icons)) {
  fs.writeFileSync(path.join(iconsDir, `${name}.svg`), svgWrap(def.body));
}

// sprite: symbol-based, id = icon name
let sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n';
for (const [, def] of Object.entries(icons)) {
  sprite += `  <symbol id="icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${def.body}</symbol>\n`;
}
sprite += '</svg>\n';
fs.writeFileSync(path.join(iconsDir, 'sprite.svg'), sprite);
fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/sprite.svg', sprite);

// contact sheet HTML
const groups = [...new Set(Object.values(icons).map((i) => i.group))];
let html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin:0; padding:48px; background:#F4F8E8; font-family: -apple-system, sans-serif; }
  h1 { font-size:20px; color:#22564D; margin:0 0 32px; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:.04em; color:#8AA08F; margin:40px 0 16px; }
  .grid { display:grid; grid-template-columns: repeat(6, 1fr); gap:16px; }
  .cell { background:#fff; border-radius:14px; padding:16px 8px; display:flex; flex-direction:column; align-items:center; gap:10px; box-shadow: 0 6px 16px rgba(34,86,77,.07); }
  .cell svg { width:24px; height:24px; color:#0E6E5B; }
  .cell span { font-size:11px; color:#586B60; text-align:center; line-height:1.3; }
</style></head><body>
<h1>Сензитивность — контактный лист иконок (24×24, обводка 1.5px, без заливок)</h1>
`;
for (const g of groups) {
  html += `<h2>${g}</h2><div class="grid">`;
  for (const [, def] of Object.entries(icons)) {
    if (def.group !== g) continue;
    html += `<div class="cell">${svgWrap(def.body)}<span>${def.label}</span></div>`;
  }
  html += `</div>`;
}
html += '</body></html>';
fs.writeFileSync('reference/icons-contact-sheet.html', html);

console.log(`Wrote ${Object.keys(icons).length} icons, sprite.svg, and contact sheet.`);
