/** @jsx jsx */
import { React, jsx, type AllWidgetProps } from 'jimu-core'
import Graphic from 'esri/Graphic'
import {
  useWaterMap, useTask, listCreeks, creekCorridor, formatArea,
  waterPanelStyles, WaterStatus, WaterLegend, RESULT_COLORS,
  type CorridorResult
} from 'widgets/shared-code/philly-water'
import { DEFAULT_BUFFER_FT, type IMConfig } from '../config'

const { useState, useEffect } = React

export default function Widget (props: AllWidgetProps<IMConfig>) {
  const water = useWaterMap(props, 'Creek corridor')
  const { busy, error, run } = useTask()
  const [creeks, setCreeks] = useState<Array<{ name: string, miles: number }>>(null)
  const [creekName, setCreekName] = useState('')
  const [bufferFt, setBufferFt] = useState(props.config?.defaultBufferFt ?? DEFAULT_BUFFER_FT)
  const [corridor, setCorridor] = useState<CorridorResult>(null)
  const { jmv, layers, showResults } = water

  // Load creek names once the map is ready
  useEffect(() => {
    if (!layers || creeks) return
    run(async () => {
      const list = await listCreeks(layers)
      setCreeks(list)
      setCreekName(list.find(c => c.name === 'Wissahickon Creek')?.name ?? list[0]?.name ?? '')
    })
  }, [layers, creeks, run])

  useEffect(() => { if (!water.isOpen) setCorridor(null) }, [water.isOpen])

  const analyse = () => run(async () => {
    const r = await creekCorridor(layers, creekName, bufferFt, jmv.view.spatialReference)
    setCorridor(r)
    showResults(
      new Graphic({ geometry: r.buffer, symbol: { type: 'simple-fill', color: [...RESULT_COLORS.highlight, 0.2], outline: { color: RESULT_COLORS.highlight, width: 1.5 } } as any }),
      new Graphic({ geometry: r.creek, symbol: { type: 'simple-line', color: RESULT_COLORS.creek, width: 4 } as any }),
      ...r.outfalls.map(o => new Graphic({
        geometry: o.geometry,
        symbol: { type: 'simple-marker', size: o.attributes.outfall_type === 'COM' ? 13 : 9, color: [0, 0, 0, 0], outline: { color: o.attributes.outfall_type === 'COM' ? RESULT_COLORS.cso : [60, 60, 60], width: 2 } } as any
      }))
    )
    jmv.view.goTo(r.buffer.extent.clone().expand(1.1)).catch(() => undefined)
  })

  return (
    <div className='jimu-widget widget-water-corridor' css={waterPanelStyles}>
      {water.mapConnector}
      <h6>🌊 Creek Corridor</h6>
      <p className='muted mb-2'>Buffer a creek to find the sewer outfalls and sampling sites inside its corridor.</p>
      <WaterStatus water={water} error={error} />

      <label htmlFor={`${props.id}-creek`}>Creek</label>
      <select id={`${props.id}-creek`} value={creekName} onChange={(e) => { setCreekName(e.target.value) }} disabled={!creeks}>
        {!creeks && <option>Loading creeks…</option>}
        {creeks?.map(c => <option key={c.name} value={c.name}>{c.name} ({c.miles.toFixed(1)} mi)</option>)}
      </select>
      <label htmlFor={`${props.id}-buffer`}>Corridor width: {bufferFt} ft each side</label>
      <input id={`${props.id}-buffer`} type='range' min={50} max={1000} step={50} value={bufferFt} onChange={(e) => { setBufferFt(Number(e.target.value)) }} />
      <button type='button' className='run' disabled={busy || !creekName || !layers} onClick={analyse}>
        {busy ? '⏳ Analysing…' : 'Analyse corridor'}
      </button>

      {corridor && !busy && (
        <div className='stats'>
          <div className='stat'><strong>{corridor.lengthMi.toFixed(1)} mi</strong>creek length</div>
          <div className='stat'><strong>{formatArea(corridor.areaSqM)}</strong>corridor area</div>
          <div className='stat cso'><strong>{corridor.cso}</strong>combined sewer outfalls</div>
          <div className='stat'><strong>{corridor.outfalls.length - corridor.cso}</strong>storm outfalls</div>
          <div className='stat'><strong>{corridor.lengthMi ? (corridor.cso / corridor.lengthMi).toFixed(2) : '0'}</strong>CSO per mile</div>
          <div className='stat'><strong>{corridor.samplingSites}</strong>sampling sites</div>
        </div>
      )}
      <WaterLegend />
    </div>
  )
}
