export const ESTUDIO = {
  nombre: 'arancha GURRUCHAGA',
  marca: 'AG Studio',
  tagline: 'Ver. Creer.',
  rubro: 'Amoblamientos · Diseño · Decoración',
  whatsapp: '2954 27 2523',
  whatsappLink: 'https://wa.me/5492954272523',
  email: 'contacto@gurruchagaweb.com',
  // Instagram: handle con @ = texto mostrado en el footer discreto.
  // instagramUrl = enlace completo del perfil (incluye el token igsh de
  // "compartir perfil" que genera Instagram). Si se vacía instagramUrl, el
  // footer cae al enlace derivado del handle. Vacío el handle = no se muestra.
  instagram: '@gurruchaga_web',
  instagramUrl: 'https://www.instagram.com/gurruchaga_web?igsh=dmdnODk1bWllNGIy',
  ciudad: 'Santa Rosa, La Pampa',
  pais: 'Argentina',
  desde: 2018,
  // Coordenadas aproximadas del taller (Calle Clemente José Andrada 145,
  // Santa Rosa). Se muestran como zona/círculo en el mapa, sin pin exacto
  // ni etiqueta de calle — pedido del cliente.
  lat: -36.6320930,
  lng: -64.2797366,
};

// Línea nueva en desarrollo — sitio gateado con clave para demos.
// Click desde la home de demogurru abre la URL de Modular en una pestaña nueva;
// el visitante ve la pantalla "en construcción" con campo de clave.
export const MODULAR = {
  nombre: 'Modular',
  url: 'https://demomodular.unlimited-systems.net/',
  descriptor: 'Cocina · Baño · Placard',
};

export const CATEGORIAS = [
  { id: 'todos', label: 'Todo el trabajo' },
  { id: 'cocinas', label: 'Cocinas' },
  { id: 'librerias-living', label: 'Librerías y Living' },
  { id: 'dormitorios', label: 'Dormitorios' },
  { id: 'placards', label: 'Placards' },
  { id: 'banos', label: 'Baños' },
];

// El banco de fotos vive en /public/assets/proyectos/<slug>-NNN.webp
// (slug por categoría definido en BANCO). Cada categoría se sirve a sí
// misma desde el expositor; las descripciones por obra individual no
// existen todavía — usamos numeración correlativa hasta que el cliente
// nombre cada pieza.
const BANCO = {
  cocinas:           { slug: 'cocina',          label: 'Cocina',            count: 85 },
  'librerias-living':{ slug: 'libreria-living', label: 'Librería / Living', count: 59 },
  dormitorios:       { slug: 'dormitorio',      label: 'Dormitorio',        count: 29 },
  placards:          { slug: 'placard',         label: 'Placard',           count: 39 },
  banos:             { slug: 'bano',            label: 'Baño',              count: 24 },
};

export const PROYECTOS = Object.entries(BANCO).flatMap(([catId, { slug, label, count }]) =>
  Array.from({ length: count }, (_, i) => {
    const idx = String(i + 1).padStart(3, '0');
    return {
      id: `${slug}-${idx}`,
      titulo: `${label} · obra ${idx}`,
      categoria: catId,
      img: `/assets/proyectos/${slug}-${idx}.webp`,
      aspecto: '16/9',
    };
  }),
);

// CAROUSEL: subset aleatorio que se muestra en el carrusel del landing.
// 30 items = 10 por fila en la variante "paralelo" (3 filas mod 3).
// El shuffle ocurre una vez por sesión de browser (al cargar el módulo),
// así el contenido del carrusel no salta entre renders de la página.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CAROUSEL = shuffle(PROYECTOS).slice(0, 30);

// ─── Layout Pinterest del expositor ────────────────────────────────────────
//
// Tres shapes de tile destacado, ademÃ¡s del normal 1×1 (16/9):
//   tall  → 1 col × 2 filas (retrato, AR 8/9)
//   wide  → 2 cols × 1 fila (panorámico, AR 32/9)
//   big   → 2 cols × 2 filas (hero, AR 16/9 ampliado)
//
// Hay dos formas de marcar un tile como destacado:
//
//  1. Pinned (en PINNED_FEATURES): además de la shape, posición exacta en el
//     grid (col / row). Útil para mantener algo en una zona concreta del top.
//     Estos se renderizan donde indique CSS Grid, sin importar el orden DOM.
//
//  2. Auto-spread: cada categoría recibe un patrón modular determinista
//     (i + offset) % freq === 0 → ese índice se eleva a la shape. El offset
//     por categoría desfasa los patrones para que el ritmo no coincida y la
//     distribución se sienta orgánica. grid-auto-flow:dense del CSS coloca
//     cada destacado en el primer hueco que lo acepte.
//
// Pineados ganan a auto (override por id al final).

const PINNED_FEATURES = {
  'libreria-living-050': { col: 3, row: 1, shape: 'tall' },
  'placard-020':         { col: 4, row: 1, shape: 'tall' },
};

const FEATURE_FREQUENCY = { big: 21, wide: 11, tall: 7 };
const FEATURE_OFFSETS_BY_CAT = {
  cocinas:            { big: 6,  wide: 2, tall: 4 },
  'librerias-living': { big: 11, wide: 5, tall: 2 },
  dormitorios:        { big: 15, wide: 8, tall: 0 },
  placards:           { big: 4,  wide: 3, tall: 5 },
  banos:              { big: 9,  wide: 6, tall: 1 },
};

function buildFeatureLayout() {
  const out = {};
  for (const cat of Object.keys(FEATURE_OFFSETS_BY_CAT)) {
    const items = PROYECTOS.filter((p) => p.categoria === cat);
    const off = FEATURE_OFFSETS_BY_CAT[cat];
    items.forEach((p, i) => {
      if (PINNED_FEATURES[p.id]) return;
      // Prioridad big > wide > tall (un mismo Ã­ndice no acumula shapes).
      if ((i + off.big) % FEATURE_FREQUENCY.big === 0) out[p.id] = { shape: 'big' };
      else if ((i + off.wide) % FEATURE_FREQUENCY.wide === 0) out[p.id] = { shape: 'wide' };
      else if ((i + off.tall) % FEATURE_FREQUENCY.tall === 0) out[p.id] = { shape: 'tall' };
    });
  }
  return { ...out, ...PINNED_FEATURES };
}

export const FEATURE_LAYOUT = buildFeatureLayout();
