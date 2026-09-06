import { useEffect, useState } from 'react'
import Shell from './Shell'
import RestauracionView from './RestauracionView'
import MalezaView from './MalezaView'
import FicorView from './FicorView'
import FaunaView from './FaunaView'
import GobernanzaView from './GobernanzaView'
import TransversalView from './TransversalView'
import ReportesView from './ReportesView'
import { useGeoData } from '../hooks/useGeoData'
import MonitoreoModal from '../components/MonitoreoModal'
import Copiloto from '../components/Copiloto'
import AjustesModal from '../components/AjustesModal'
import SoporteModal from '../components/SoporteModal'
import ImportModal from '../components/ImportModal'
import { puedeEditar, type Usuario } from '../lib/auth'
import { iniciarAutoSync } from '../lib/offlineQueue'
import type { GeoFeature } from '../lib/types'
import type { CompId } from './data'

export default function Geovisor({ usuario, onLogout }: { usuario: Usuario; onLogout: () => void }) {
  const [active, setActive] = useState<CompId>('restauracion')
  const [monitoreoOpen, setMonitoreoOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [copilotoOpen, setCopilotoOpen] = useState(false)
  const [ajustesOpen, setAjustesOpen] = useState(false)
  const [soporteOpen, setSoporteOpen] = useState(false)
  const [selected, setSelected] = useState<GeoFeature | null>(null)
  // Nota: "lotes" (lotes_bioaumentacion) nunca se pasa al geovisor — es data de muestra
  // con el nombre restringido ("Planta de Bioaumentación") y no debe mostrarse en ningún componente.
  const { zonas, puntos, capas, coberturas, tematicas, reload } = useGeoData()
  const canEdit = puedeEditar(usuario)

  // Sube los registros guardados en el navegador (modo offline) al recuperar internet.
  useEffect(() => iniciarAutoSync(reload), [reload])

  // Acciones emitidas desde el pie de página (ver accionShell en Shell.tsx).
  useEffect(() => {
    const atender = (e: Event) => {
      const accion = (e as CustomEvent<string>).detail
      if (accion === 'soporte') setSoporteOpen(true)
      else if (accion === 'descargas') setActive('reportes')
      else if (accion === 'importar' && canEdit) setImportOpen(true)
    }
    window.addEventListener('geovisor:accion', atender)
    return () => window.removeEventListener('geovisor:accion', atender)
  }, [canEdit])

  // ⌘K / Ctrl+K abre el copiloto desde cualquier punto de la aplicación.
  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCopilotoOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', atajo)
    return () => window.removeEventListener('keydown', atajo)
  }, [])

  // Props base del mapa, comunes a los componentes con geovisor. Cada vista decide qué es pertinente
  // pasando su propio `componente` a <MapView>; el filtrado real ocurre allí.
  const mapProps = { zonas, puntos, capas, coberturas, tematicas, selected, onSelect: setSelected }

  return (
    <>
      <Shell
        usuario={usuario}
        onLogout={onLogout}
        active={active}
        onNav={setActive}
        onMonitoreo={canEdit ? () => setMonitoreoOpen(true) : undefined}
        onImport={canEdit ? () => setImportOpen(true) : undefined}
        onCopiloto={() => setCopilotoOpen(true)}
        onAjustes={() => setAjustesOpen(true)}
        onSoporte={() => setSoporteOpen(true)}
      >
        {active === 'restauracion' && <RestauracionView {...mapProps} />}
        {active === 'maleza' && <MalezaView {...mapProps} />}
        {active === 'ficorremediacion' && <FicorView {...mapProps} />}
        {active === 'fauna' && <FaunaView {...mapProps} />}
        {active === 'gobernanza' && <GobernanzaView />}
        {active === 'transversal' && <TransversalView onNav={setActive} />}
        {active === 'reportes' && <ReportesView />}
      </Shell>

      {ajustesOpen && <AjustesModal onClose={() => setAjustesOpen(false)} usuario={usuario} />}
      {soporteOpen && <SoporteModal onClose={() => setSoporteOpen(false)} />}

      <Copiloto
        abierto={copilotoOpen}
        onCerrar={() => setCopilotoOpen(false)}
        onIrA={setActive}
      />

      <MonitoreoModal
        open={monitoreoOpen}
        onClose={() => setMonitoreoOpen(false)}
        estaciones={puntos}
        onSaved={reload}
        componenteActivo={active}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={reload}
      />
    </>
  )
}
