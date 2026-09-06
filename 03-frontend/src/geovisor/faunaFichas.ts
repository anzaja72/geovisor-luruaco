// Fichas y especímenes 3D de la línea base de fauna (Anexo. Fauna línea base.xlsx).
// Los modelos .glb los generó el equipo en Tripo Studio a partir de fotos de campo;
// ver public/fauna/CREDITS.md. Las posiciones de los puntos están en el espacio
// normalizado del visor (el modelo se ajusta a FIT_SIZE y se centra en el origen).

export type GrupoFaunaId = 'aves' | 'mamiferos' | 'anfibios' | 'reptiles'

export interface PuntoEspecie {
  id: string
  /** Etiqueta corta (nombre común o rasgo). */
  label: string
  /** Detalle: nombre científico y registros. */
  detail: string
  position: [number, number, number]
  color: string
}

export interface FichaGrupo {
  id: GrupoFaunaId
  nombre: string
  clase: string
  /** Especie que representa el modelo 3D. */
  especieModelo: string
  modelo: string
  foto: string
  accent: string
  icon: string
  riqueza: string
  registros: string
  coberturas: string
  rol: string
  descripcion: string
  dato: string
  puntos: PuntoEspecie[]
}

export const FICHAS_FAUNA: FichaGrupo[] = [
  {
    id: 'aves',
    nombre: 'Aves',
    clase: 'Clase Aves',
    especieModelo: 'Ortalis garrula',
    modelo: '/fauna/models/aves.glb',
    foto: '/fauna/aves.webp',
    accent: '#6f8f6d',
    icon: 'bird',
    riqueza: '47 especies',
    registros: 'Más de 300 registros',
    coberturas: '5 coberturas vegetales',
    rol: 'Dispersión, control de insectos y carroña',
    descripcion:
      'El grupo más diverso de la línea base: 47 especies en vegetación secundaria, cultivos, bosque denso, ' +
      'bosque ripario y tierras desnudas. Desde la guacharaca caribeña hasta el águila pescadora.',
    dato:
      'El perico cara sucia (Eupsittula pertinax) fue la especie con más individuos en un solo punto: 10 en tierras desnudas.',
    puntos: [
      { id: 'ortalis-garrula', label: 'Guacharaca caribeña', detail: 'Ortalis garrula · 25 registros', position: [0.95, 0.55, 0.85], color: '#c9864a' },
      { id: 'eupsittula-pertinax', label: 'Perico cara sucia', detail: 'Eupsittula pertinax · 30 registros', position: [-1.05, 0.7, 0.7], color: '#7aa35a' },
      { id: 'cyanocorax-affinis', label: 'Carriquí pechiblanco', detail: 'Cyanocorax affinis · 25 registros', position: [0.15, 1.45, 0.55], color: '#4f7eb5' },
      { id: 'ardea-alba', label: 'Garza real', detail: 'Ardea alba · bosque ripario', position: [1.15, -0.35, 0.75], color: '#b9b3a5' },
      { id: 'pandion-haliaetus', label: 'Águila pescadora', detail: 'Pandion haliaetus · 2 registros', position: [-0.85, -0.55, 0.9], color: '#8b6a4a' },
      { id: 'pitangus-sulphuratus', label: 'Bichofué', detail: 'Pitangus sulphuratus · 10 registros', position: [0.05, -1.15, 0.8], color: '#d9a52f' },
    ],
  },
  {
    id: 'mamiferos',
    nombre: 'Mamíferos',
    clase: 'Clase Mammalia',
    especieModelo: 'Alouatta seniculus',
    modelo: '/fauna/models/mamiferos.glb',
    foto: '/fauna/mamiferos.webp',
    accent: '#b8895a',
    icon: 'paw',
    riqueza: '11 especies',
    registros: '28 registros',
    coberturas: '4 coberturas con presencia',
    rol: 'Depredación, dispersión de semillas y ramoneo',
    descripcion:
      'Once especies de la línea base, del mono aullador al ocelote. La vegetación secundaria baja concentra ' +
      'la mayor riqueza: primates, carnívoros medianos y ungulados todavía recorren el mosaico de Luruaco.',
    dato:
      'El mono aullador (Alouatta seniculus) fue el mamífero más numeroso: 5 individuos en vegetación secundaria baja.',
    puntos: [
      { id: 'alouatta-seniculus', label: 'Mono aullador', detail: 'Alouatta seniculus · 5 registros', position: [0.15, 1.25, 0.7], color: '#c45a32' },
      { id: 'leopardus-pardalis', label: 'Ocelote', detail: 'Leopardus pardalis · 2 registros', position: [1.05, 0.15, 0.75], color: '#d4a24a' },
      { id: 'cerdocyon-thous', label: 'Zorro perro', detail: 'Cerdocyon thous · 5 registros', position: [-1.05, 0.2, 0.8], color: '#8a6a4e' },
      { id: 'dasyprocta-punctata', label: 'Ñeque', detail: 'Dasyprocta punctata · 3 registros', position: [0.75, -0.85, 0.7], color: '#6b5340' },
      { id: 'tamandua-mexicana', label: 'Oso hormiguero', detail: 'Tamandua mexicana · bosque denso', position: [-0.7, -0.95, 0.65], color: '#a08b62' },
      { id: 'sciurus-granatensis', label: 'Ardilla', detail: 'Sciurus granatensis · 6 registros', position: [0.05, 0.55, 1.05], color: '#c4783a' },
    ],
  },
  {
    id: 'anfibios',
    nombre: 'Anfibios',
    clase: 'Clase Amphibia',
    especieModelo: 'Rhinella humboldti',
    modelo: '/fauna/models/anfibios.glb',
    foto: '/fauna/anfibios.webp',
    accent: '#6a9b7a',
    icon: 'frog',
    riqueza: '1 especie',
    registros: '1 registro',
    coberturas: '1 cobertura: bosque ripario',
    rol: 'Control de insectos en bordes húmedos',
    descripcion:
      'La línea base de herpetos registró un anfibio: el sapo de Humboldt, hallado en bosque ripario. Ese único ' +
      'registro habla del vínculo entre agua, sombra y reproducción en el Caribe seco.',
    dato:
      'Los anfibios son sensores de humedad y calidad del agua: un solo registro no niega su presencia, pide más muestreo en charcas y caños.',
    puntos: [
      { id: 'rhinella-humboldti', label: 'Sapo de Humboldt', detail: 'Rhinella humboldti · 1 registro', position: [0.05, 0.55, 1.05], color: '#6a9b7a' },
      { id: 'habitat-ripario', label: 'Bosque ripario', detail: 'Único hábitat con registro', position: [1.1, 0.15, 0.7], color: '#4f7d6a' },
      { id: 'actividad-nocturna', label: 'Actividad nocturna', detail: 'Sale con la humedad del caño', position: [-1.05, 0.2, 0.75], color: '#3d5c6e' },
      { id: 'reproduccion', label: 'Reproducción', detail: 'Huevos en aguas temporales', position: [0.7, -0.85, 0.65], color: '#8bb5a0' },
      { id: 'dieta', label: 'Dieta insectívora', detail: 'Escarabajos, hormigas y polillas', position: [-0.65, -0.9, 0.7], color: '#b3a05e' },
    ],
  },
  {
    id: 'reptiles',
    nombre: 'Reptiles',
    clase: 'Clase Reptilia',
    especieModelo: 'Anolis auratus',
    modelo: '/fauna/models/reptiles.glb',
    foto: '/fauna/reptiles.webp',
    accent: '#b86b4a',
    icon: 'snake',
    riqueza: '7 especies',
    registros: '47 registros',
    coberturas: '5 coberturas vegetales',
    rol: 'Depredadores de mesofauna y control de plagas',
    descripcion:
      'Siete especies de lagartijas, gecos y serpientes recorren el gradiente de Luruaco. El anolis dorado ' +
      'aparece en las cinco coberturas; la mapaná se registró en tierras desnudas.',
    dato:
      'Bothrops asper (mapaná) es de interés en salud pública; Erythrolamprus bizonus, la falsa coral, se confunde con especies venenosas.',
    puntos: [
      { id: 'anolis-auratus', label: 'Anolis dorado', detail: 'Anolis auratus · 17 registros', position: [0.15, 1.15, 0.7], color: '#c4a24a' },
      { id: 'bothrops-asper', label: 'Mapaná', detail: 'Bothrops asper · 2 registros', position: [1.15, -0.15, 0.65], color: '#6b5340' },
      { id: 'erythrolamprus-bizonus', label: 'Falsa coral', detail: 'Erythrolamprus bizonus · 7 registros', position: [-1.1, 0.05, 0.7], color: '#c45a4a' },
      { id: 'ameiva-praesignis', label: 'Ameiva común', detail: 'Ameiva praesignis · bosque', position: [0.75, -0.95, 0.7], color: '#7aa35a' },
      { id: 'cnemidophorus-lemniscatus', label: 'Lagartija rayada', detail: 'Cnemidophorus lemniscatus · 6 registros', position: [-0.7, -0.95, 0.7], color: '#4f7eb5' },
      { id: 'gonatodes-albogularis', label: 'Geco cabeciamarillo', detail: 'Gonatodes albogularis · 5 registros', position: [0.05, 0.45, 1.05], color: '#d9a52f' },
    ],
  },
]

export const FICHA_POR_ID = Object.fromEntries(
  FICHAS_FAUNA.map((f) => [f.id, f]),
) as Record<GrupoFaunaId, FichaGrupo>
