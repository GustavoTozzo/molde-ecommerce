/**
 * Arte vetorial própria do molde (embalagens e avatares ilustrados).
 * Tudo é gerado por código: nenhuma imagem de terceiros. Para usar fotos
 * reais, passe `imagem` no produto/pessoa e o componente correspondente
 * renderiza a foto no lugar da ilustração.
 */
export type ArtKind = "jar" | "dropper" | "sachet" | "tube" | "syrup" | "serum" | "box";

const INK = "#14261F";
const AMBER = "#F2A33A";
const FOREST = "#0B5D4B";

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function glyph(cx: number, cy: number, s: number, color = FOREST, core = AMBER): string {
  const petal = (rot: number) =>
    `<ellipse cx="${cx}" cy="${cy - 0.9 * s}" rx="${0.52 * s}" ry="${s}" transform="rotate(${rot} ${cx} ${cy})" fill="${color}"/>`;
  return `${petal(0)}${petal(90)}${petal(180)}${petal(270)}<circle cx="${cx}" cy="${cy}" r="${0.36 * s}" fill="${core}"/>`;
}

const lines = (x: number, y: number, w: number, n = 3, gap = 7) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<rect x="${x}" y="${y + i * gap}" width="${i === n - 1 ? w * 0.6 : w}" height="3.2" rx="1.6" fill="${INK}" opacity="${i === 0 ? 0.95 : 0.45}"/>`,
  ).join("");

const ground = (cx: number, cy: number, rx: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.14}" fill="${INK}" opacity=".16"/>`;

const KINDS: Record<ArtKind, (id: string, a: string) => string> = {
  jar: (id, a) => {
    const d = shade(a, -0.28);
    return `<defs><linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="#E9E3D4"/><stop offset=".42" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D5CEBC"/></linearGradient><linearGradient id="${id}l" x1="0" x2="1"><stop offset="0" stop-color="${d}"/><stop offset=".45" stop-color="${a}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>${ground(100, 228, 60)}<rect x="40" y="78" width="120" height="146" rx="20" fill="url(#${id}b)"/><rect x="44" y="38" width="112" height="48" rx="13" fill="url(#${id}l)"/><rect x="44" y="78" width="112" height="9" fill="#000" opacity=".13"/><g fill="#fff" opacity=".22">${Array.from({ length: 11 }, (_, i) => `<rect x="${52 + i * 9.4}" y="46" width="2.4" height="30" rx="1.2"/>`).join("")}</g><rect x="52" y="104" width="96" height="100" rx="13" fill="#fff"/><path d="M52 117a13 13 0 0 1 13-13h70a13 13 0 0 1 13 13v13H52z" fill="${a}"/>${glyph(100, 148, 13, d)}${lines(66, 172, 68, 3, 8)}<rect x="50" y="92" width="8" height="118" rx="4" fill="#fff" opacity=".4"/>`;
  },
  dropper: (id, a) => {
    const d = shade(a, -0.3);
    return `<defs><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#8A4A0E"/><stop offset=".35" stop-color="#D98A2B"/><stop offset=".6" stop-color="#E9A74A"/><stop offset="1" stop-color="#8A4A0E"/></linearGradient></defs>${ground(100, 228, 46)}<path d="M70 106c0-9 8-14 16-18v-8h28v8c8 4 16 9 16 18v102a16 16 0 0 1-16 16H86a16 16 0 0 1-16-16z" fill="url(#${id}g)"/><rect x="82" y="58" width="36" height="26" rx="5" fill="#1B1B1B"/><rect x="84" y="40" width="32" height="24" rx="12" fill="#2B2B2B"/><rect x="88" y="42" width="6" height="18" rx="3" fill="#fff" opacity=".18"/><rect x="76" y="124" width="48" height="76" rx="9" fill="#fff"/><rect x="76" y="124" width="48" height="16" rx="9" fill="${a}"/><rect x="76" y="132" width="48" height="8" fill="${a}"/>${glyph(100, 158, 9, d)}${lines(84, 176, 32, 3, 7)}<rect x="74" y="104" width="6" height="104" rx="3" fill="#fff" opacity=".28"/>`;
  },
  sachet: (_id, a) => {
    const d = shade(a, -0.28);
    const l = shade(a, 0.5);
    const stick = (x: number, rot: number, fill: string) =>
      `<g transform="rotate(${rot} ${x + 24} 200)"><path d="M${x} 38h48l-3 6 3 6-3 6 3 6H${x}l3-6-3-6 3-6z" fill="${shade(fill, -0.12)}"/><rect x="${x}" y="68" width="48" height="136" fill="${fill}"/><path d="M${x} 204h48l-3 6 3 6-3 6H${x}l3-6-3-6 3-6z" fill="${shade(fill, -0.12)}"/><rect x="${x + 8}" y="104" width="32" height="64" rx="8" fill="#fff" opacity=".96"/>${glyph(x + 24, 128, 7, d)}${lines(x + 13, 144, 22, 2, 6)}<rect x="${x + 5}" y="70" width="5" height="140" fill="#fff" opacity=".22"/></g>`;
    return `${ground(100, 228, 58)}${stick(40, -10, l)}${stick(100, 7, a)}`;
  },
  tube: (id, a) => {
    const d = shade(a, -0.3);
    return `<defs><linearGradient id="${id}t" x1="0" x2="1"><stop offset="0" stop-color="${d}"/><stop offset=".4" stop-color="${a}"/><stop offset="1" stop-color="${d}"/></linearGradient><linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="#D8D2C2"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#CFC8B6"/></linearGradient></defs>${ground(100, 228, 52)}<path d="M62 80h76l6 130H56z" fill="url(#${id}t)"/><rect x="52" y="208" width="96" height="14" rx="3" fill="${d}"/><g stroke="#fff" opacity=".35" stroke-width="1.6"><path d="M56 212h88M56 217h88"/></g><rect x="76" y="40" width="48" height="46" rx="9" fill="url(#${id}c)"/><rect x="72" y="76" width="56" height="10" rx="3" fill="#E7E1D1"/><rect x="68" y="106" width="64" height="88" rx="10" fill="#fff" opacity=".96"/>${glyph(100, 134, 11, d)}${lines(77, 156, 46, 3, 8)}<path d="M68 82l-5 126" stroke="#fff" stroke-width="5" opacity=".25" stroke-linecap="round"/>`;
  },
  syrup: (id, a) => {
    const d = shade(a, -0.3);
    return `<defs><linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#7A4B1C"/><stop offset=".4" stop-color="#C98230"/><stop offset=".62" stop-color="#E2A14A"/><stop offset="1" stop-color="#7A4B1C"/></linearGradient><linearGradient id="${id}k" x1="0" x2="1"><stop offset="0" stop-color="${d}"/><stop offset=".5" stop-color="${a}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>${ground(100, 228, 50)}<path d="M80 96c0-10 4-16 8-20V64h24v12c4 4 8 10 8 20l8 18v90a18 18 0 0 1-18 18H90a18 18 0 0 1-18-18v-90z" fill="url(#${id}s)"/><rect x="84" y="36" width="32" height="32" rx="8" fill="url(#${id}k)"/><g fill="#fff" opacity=".25">${Array.from({ length: 6 }, (_, i) => `<rect x="${88 + i * 4.6}" y="40" width="1.8" height="24" rx=".9"/>`).join("")}</g><rect x="74" y="128" width="52" height="70" rx="9" fill="#fff"/><rect x="74" y="128" width="52" height="15" rx="9" fill="${a}"/><rect x="74" y="136" width="52" height="7" fill="${a}"/>${glyph(100, 162, 9, d)}${lines(83, 179, 34, 2, 7)}<rect x="76" y="108" width="6" height="96" rx="3" fill="#fff" opacity=".3"/>`;
  },
  serum: (id, a) => {
    const d = shade(a, -0.3);
    return `<defs><linearGradient id="${id}f" x1="0" x2="1"><stop offset="0" stop-color="#D9E6DF"/><stop offset=".4" stop-color="#F5FBF8"/><stop offset=".7" stop-color="#E4EFE9"/><stop offset="1" stop-color="#C6D6CE"/></linearGradient></defs>${ground(100, 228, 44)}<path d="M72 110c0-9 6-14 14-17v-8h28v8c8 3 14 8 14 17v96a16 16 0 0 1-16 16H88a16 16 0 0 1-16-16z" fill="url(#${id}f)"/><path d="M72 168h56v38a16 16 0 0 1-16 16H88a16 16 0 0 1-16-16z" fill="${a}" opacity=".55"/><rect x="84" y="56" width="32" height="32" rx="6" fill="#fff" stroke="${d}" stroke-width="2"/><rect x="80" y="36" width="40" height="26" rx="13" fill="${d}"/><rect x="86" y="40" width="7" height="16" rx="3.5" fill="#fff" opacity=".25"/><rect x="78" y="122" width="44" height="52" rx="8" fill="#fff" opacity=".97"/>${glyph(100, 142, 8, d)}${lines(86, 157, 28, 2, 6)}<rect x="76" y="108" width="5" height="100" rx="2.5" fill="#fff" opacity=".6"/>`;
  },
  box: (_id, a) => {
    const d = shade(a, -0.3);
    const l = shade(a, 0.4);
    return `${ground(100, 228, 70)}<path d="M30 92l46-22h94l-34 22z" fill="${l}"/><rect x="30" y="92" width="106" height="132" rx="6" fill="${a}"/><path d="M136 92l34-22v132l-34 22z" fill="${d}"/><rect x="46" y="116" width="74" height="70" rx="10" fill="#fff" opacity=".96"/>${glyph(83, 142, 12, d)}${lines(58, 164, 50, 2, 8)}<rect x="30" y="92" width="106" height="12" fill="#fff" opacity=".18"/>`;
  },
};

const SCALE: Partial<Record<ArtKind, number>> = { dropper: 1.18, syrup: 1.18, serum: 1.18, tube: 1.08 };

export function packshot(kind: ArtKind, id: string, accent: string): string {
  const raw = KINDS[kind](id, accent);
  const s = SCALE[kind];
  const body = s ? `<g transform="translate(100 232) scale(${s}) translate(-100 -232)">${raw}</g>` : raw;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" role="img" aria-hidden="true" focusable="false">${body}</svg>`;
}

export type AvatarConfig = {
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "bun" | "curly";
  top: string;
  bg: string;
  coat?: boolean;
  beard?: boolean;
};

export function avatarSvg(c: AvatarConfig): string {
  const { skin, hair, hairStyle, top, bg, coat = true, beard = false } = c;
  const skinD = shade(skin, -0.18);
  const hairBack =
    hairStyle === "long"
      ? `<path d="M30 70c-4-34 14-52 30-52s34 18 30 52c-1 14 2 30 6 40H24c4-10 7-26 6-40z" fill="${hair}"/>`
      : hairStyle === "curly"
        ? `<g fill="${hair}"><circle cx="38" cy="44" r="14"/><circle cx="82" cy="44" r="14"/><circle cx="46" cy="28" r="15"/><circle cx="74" cy="28" r="15"/><circle cx="60" cy="24" r="16"/></g>`
        : "";
  const hairFront = {
    short: `<path d="M40 52c0-16 9-24 20-24s20 8 20 24c-6-8-14-11-20-11s-14 3-20 11z" fill="${hair}"/>`,
    long: `<path d="M38 56c1-18 10-26 22-26s21 8 22 26c-7-9-13-13-22-13s-15 4-22 13z" fill="${hair}"/>`,
    bun: `<circle cx="60" cy="22" r="10" fill="${hair}"/><path d="M40 54c0-16 9-24 20-24s20 8 20 24c-6-8-14-11-20-11s-14 3-20 11z" fill="${hair}"/>`,
    curly: `<g fill="${hair}"><circle cx="43" cy="46" r="8"/><circle cx="77" cy="46" r="8"/><circle cx="52" cy="38" r="9"/><circle cx="68" cy="38" r="9"/><circle cx="60" cy="35" r="9"/></g>`,
  }[hairStyle];
  const beardSvg = beard
    ? `<path d="M42 66c1 16 8 24 18 24s17-8 18-24c-5 6-11 8-18 8s-13-2-18-8z" fill="${hair}" opacity=".92"/>`
    : "";
  const body = coat
    ? `<path d="M10 120c0-26 20-40 50-40s50 14 50 40z" fill="#FFFFFF"/><path d="M60 80l-14 6 10 34h8l10-34z" fill="${top}"/><path d="M46 86l-8 34M74 86l8 34" stroke="#D9D3C4" stroke-width="2"/>`
    : `<path d="M10 120c0-26 20-40 50-40s50 14 50 40z" fill="${top}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-hidden="true" focusable="false"><rect width="120" height="120" fill="${bg}"/><circle cx="92" cy="26" r="40" fill="#fff" opacity=".22"/>${hairBack}${body}<rect x="52" y="66" width="16" height="18" rx="6" fill="${skinD}"/><ellipse cx="60" cy="52" rx="19" ry="22" fill="${skin}"/><ellipse cx="41.5" cy="54" rx="3" ry="5" fill="${skin}"/><ellipse cx="78.5" cy="54" rx="3" ry="5" fill="${skin}"/>${hairFront}${beardSvg}<path d="M54 63c3 3 9 3 12 0" stroke="${skinD}" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
}

export function logoGlyphSvg(color = FOREST, core = AMBER): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${glyph(20, 20, 8.6, color, core)}</svg>`;
}
