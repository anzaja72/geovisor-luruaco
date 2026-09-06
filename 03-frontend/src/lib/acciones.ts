// Acciones que el pie de página emite y Geovisor atiende. Viajan como evento
// para no encadenar callbacks por las siete vistas que montan el pie.

export type AccionShell = 'importar' | 'descargas' | 'soporte'

export const accionShell = (accion: AccionShell) =>
  window.dispatchEvent(new CustomEvent('geovisor:accion', { detail: accion }))
