// Registro fotográfico de la siembra (restauración activa), extraído de
// «Fotos geovisor.docx». El documento trae 20 fotos y una leyenda numerada de
// 19 actividades (lista con numeración automática de Word); la correspondencia
// entre foto y número no es por orden de archivo, sino por contenido: cada foto
// se contrastó contra el texto de su actividad (herramienta en mano, lo que se
// ve de fondo, y el overlay de ubicación de la cámara cuando lo trae).
//
// El punto 3 («Suministro de material vegetal») queda con dos fotos —el
// motocarro cargando y el material ya acopiado en campo—, así que hay 20 fotos
// para 19 números.

export interface FotoSiembra {
  /** Número de la leyenda (1–19), como texto para poder llevar «03a»/«03b». */
  numero: string
  caption: string
  src: string
}

export const FOTOS_SIEMBRA: FotoSiembra[] = [
  { numero: '1', src: '/siembra-restauracion/leg-01.webp',
    caption: 'Demarcación de zonas sembradas mediante estacado azul.' },
  { numero: '2', src: '/siembra-restauracion/leg-02.webp',
    caption: 'Demarcación de zonas sembradas mediante estacado azul.' },
  { numero: '3', src: '/siembra-restauracion/leg-03a.webp',
    caption: 'Suministro de material vegetal: se realizó su distribución interna hacia los diferentes frentes y puntos de siembra empleando un motocarro de carga, facilitando el traslado de las plántulas dentro del predio y su aproximación a los sitios previamente definidos para la plantación.' },
  { numero: '3', src: '/siembra-restauracion/leg-03b.webp',
    caption: 'Suministro de material vegetal: se realizó su distribución interna hacia los diferentes frentes y puntos de siembra empleando un motocarro de carga, facilitando el traslado de las plántulas dentro del predio y su aproximación a los sitios previamente definidos para la plantación.' },
  { numero: '4', src: '/siembra-restauracion/leg-04.webp',
    caption: 'Siembra: cada plántula fue retirada cuidadosamente de su bolsa, realizando un corte longitudinal en uno de sus laterales para facilitar la extracción y procurando conservar íntegro el cepellón. Posteriormente, la planta fue ubicada en el centro del hoyo y se realizó el relleno y compactación suave del suelo alrededor del cepellón, asegurando su estabilidad y adecuado contacto con el terreno.' },
  { numero: '5', src: '/siembra-restauracion/leg-05.webp',
    caption: 'Para el plateo se utilizaron herramientas manuales como machete y azadón; consistió en la limpieza y remoción de la vegetación alrededor del punto de plantación, conformando un área circular de aproximadamente 1 m de diámetro, con el propósito de reducir la competencia de la vegetación circundante por agua, luz y nutrientes y facilitar las labores posteriores de ahoyado, abonado y siembra.' },
  { numero: '6', src: '/siembra-restauracion/leg-06.webp',
    caption: 'Se efectuaron hoyos de aproximadamente 25 × 25 cm, procurando mantener dimensiones uniformes y una profundidad adecuada para facilitar la instalación y el establecimiento del material vegetal.' },
  { numero: '7', src: '/siembra-restauracion/leg-07.webp',
    caption: 'Captación de agua de la ciénaga de Luruaco: para el riego se utilizaron recipientes plásticos tipo bidón o caneca portátil.' },
  { numero: '8', src: '/siembra-restauracion/leg-08.webp',
    caption: 'Riego manual hacia las plantas mediante regaderas plásticas o directamente con los bidones.' },
  { numero: '9', src: '/siembra-restauracion/leg-09.webp',
    caption: 'Equipo local de siembra.' },
  { numero: '10', src: '/siembra-restauracion/leg-10.webp',
    caption: 'Siembra: cada plántula fue retirada cuidadosamente de su bolsa, realizando un corte longitudinal en uno de sus laterales para facilitar la extracción y procurando conservar íntegro el cepellón. Posteriormente, la planta fue ubicada en el centro del hoyo y se realizó el relleno y compactación suave del suelo alrededor del cepellón, asegurando su estabilidad y adecuado contacto con el terreno.' },
  { numero: '11', src: '/siembra-restauracion/leg-11.webp',
    caption: 'El ahoyado se realizó manualmente utilizando un ahoyador, en sitios de plantación previamente definidos.' },
  { numero: '12', src: '/siembra-restauracion/leg-12.webp',
    caption: 'Desde el vivero Omar Tapias, el cual cuenta con certificación ICA y está ubicado en el municipio de San Juan Nepomuceno, Bolívar, el material fue trasladado hasta el predio mediante camiones destinados para su transporte.' },
  { numero: '13', src: '/siembra-restauracion/leg-13.webp',
    caption: 'El trazado de las franjas de restauración se realizó directamente en campo, utilizando cuerda o cabuya como elemento de referencia para establecer la alineación y mantener las distancias definidas en el diseño.' },
  { numero: '14', src: '/siembra-restauracion/leg-14.webp',
    caption: 'Suministro del material vegetal: la distribución a cada hoyo se hizo con canastillas.' },
  { numero: '15', src: '/siembra-restauracion/leg-15.webp',
    caption: 'Para la labor de riego se captó agua de la ciénaga de Luruaco utilizando recipientes plásticos tipo bidón o caneca portátil, con una capacidad aproximada de 20 litros.' },
  { numero: '16', src: '/siembra-restauracion/leg-16.webp',
    caption: 'El trazado de las franjas de restauración se realizó directamente en campo, utilizando cuerda o cabuya como elemento de referencia para establecer la alineación y mantener las distancias definidas en el diseño.' },
  { numero: '17', src: '/siembra-restauracion/leg-17.webp',
    caption: 'Las parcelas permanentes de monitoreo permiten realizar seguimiento a las siembras; son de 10 × 10 m, hay 15 parcelas en total en toda el área en restauración, cubriendo todas las coberturas vegetales allí presentes.' },
  { numero: '18', src: '/siembra-restauracion/leg-18.webp',
    caption: 'El trazado de las parcelas permanentes de monitoreo (PPM) se realizó con cinta métrica y brújula; adicionalmente se geoposicionaron con GPS Garmin.' },
  { numero: '19', src: '/siembra-restauracion/leg-19.webp',
    caption: 'Mediante estacado amarillo se hizo la delimitación y trazado del cercado interno; para la ubicación de los puntos se empleó el software Google Earth Pro.' },
]
