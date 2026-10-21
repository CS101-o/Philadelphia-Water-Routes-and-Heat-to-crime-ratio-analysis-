/** @jsx jsx */
import { React, jsx, type AllWidgetProps } from 'jimu-core'
import Graphic from 'esri/Graphic'
import {
  useWaterMap, useTask, summarizeWatersheds, rankWatersheds, shortWatershedName,
  waterPanelStyles, WaterStatus, WaterLegend, RESULT_COLORS,
  type RankedWatershed, type WatershedSummary
} from 'widgets/shared-code/philly-water'

const { useState, useEffect } = React

type Row = RankedWatershed & WatershedSummary

export default function Widget (props: AllWidgetProps<unknown>) {
  const water = useWaterMap(props, 'Watershed ranking')
  const { busy, error, run } = useTask()
  const [rows, setRows] = useState<Row[]>(null)
  const [selected, setSelected] = useState<string>(null)
  const { jmv, layers, showResults } = water

  // Overlay watersheds on creeks and outfalls once the map is ready
  useEffect(() => {
    if (!layers || rows) return
    run(async () => {
      const summaries = await summarizeWatersheds(layers, jmv.view.spatialReference)
      const byName = new Map(summaries.map(s => [s.name, s]))
      setRows(rankWatersheds(summaries).map(r => ({ ...r, geometry: byName.get(r.name).geometry })))
    })
  }, [layers, rows, jmv, run])

  useEffect(() => { if (!water.isOpen) setSelected(null) }, [water.isOpen])

  const show = (w: Row) => {
    setSelected(w.name)
    showResults(new Graphic({
      geometry: w.geometry,
      symbol: { type: 'simple-fill', color: [...RESULT_COLORS.highlight, 0.15], outline: { color: RESULT_COLORS.highlight, width: 3 } } as any
    }))
    jmv.view.goTo(w.geometry.extent.clone().expand(1.15)).catch(() => undefined)
  }

  const maxRate = rows ? Math.max(...rows.map(w => w.csoPerCreekMile), 0.01) : 1

  return (
    <div className='jimu-widget widget-water-watersheds' css={waterPanelStyles}>
      {water.mapConnector}
      <h6>🗺️ Watershed Ranking</h6>
      <p className='muted mb-2'>Each watershed is overlaid on the creek network and sewer outfalls, then ranked by <strong>combined sewer outfalls per creek mile</strong>: where overflows put the most pressure on each mile of stream.</p>
      <WaterStatus water={water} error={error} />
      {busy && !rows && <div className='status'>⏳ Running spatial overlay…</div>}
      {rows && (
        <table>
          <thead>
            <tr><th>Watershed</th><th>Creek mi</th><th>Outfalls</th><th>CSO</th><th>CSO / mi</th></tr>
          </thead>
          <tbody>
            {rows.map(w => (
              <tr key={w.name} aria-selected={selected === w.name} onClick={() => { show(w) }} title={`${w.sqMiles.toFixed(1)} sq mi · ${w.drainageDensity.toFixed(2)} creek mi per sq mi · ${w.samplingSites} sampling sites`}>
                <td>{shortWatershedName(w.name)}</td>
                <td>{w.creekMiles.toFixed(1)}</td>
                <td>{w.outfalls}</td>
                <td>{w.cso}</td>
                <td>
                  {w.csoPerCreekMile.toFixed(2)}
                  <div className='bar' style={{ width: `${(w.csoPerCreekMile / maxRate) * 100}%` }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows && <p className='muted mt-2 mb-0'>Click a row to zoom to it. Hover for area, drainage density and sampling sites.</p>}
      <WaterLegend />
    </div>
  )
}
