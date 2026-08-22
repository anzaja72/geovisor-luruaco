import { useState } from 'react'
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
import { puedeEditar, type Usuario } from '../lib/auth'
import type { GeoFeature } from '../lib/types'
import type { CompId } from './data'

export default function Geovisor({ usuario, onLogout }: { usuario: Usuario; onLogout: () => void }) {
  const [active, setActive] = useState<CompId>('restauracion')
  const [monitoreoOpen, setMonitoreoOpen] = useState(false)
  const [selected, setSelected] = useState<GeoFeature | null>(null)
  // Nota: "lotes" (lotes_bioaumentacion) nunca se pasa al geovisor — es data de muestra
  // con el nombre restringido ("Planta de Bioaumentación") y no debe mostrarse en ningún componente.
  const { zonas, puntos, capas, coberturas, tematicas, reload } = useGeoData()
  const canEdit = puedeEditar(usuario)

  // Props base del mapa, comunes a los 4 geovisores. Cada vista decide qué es pertinente
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
      >
        {active === 'restauracion' && <RestauracionView {...mapProps} />}
        {active === 'maleza' && <MalezaView {...mapProps} />}
        {active === 'ficorremediacion' && <FicorView {...mapProps} />}
        {active === 'fauna' && <FaunaView {...mapProps} />}
        {active === 'gobernanza' && <GobernanzaView />}
        {active === 'transversal' && <TransversalView onNav={setActive} />}
        {active === 'reportes' && <ReportesView />}
      </Shell>

      <MonitoreoModal
        open={monitoreoOpen}
        onClose={() => setMonitoreoOpen(false)}
        estaciones={puntos}
        onSaved={reload}
      />
    </>
  )
}
