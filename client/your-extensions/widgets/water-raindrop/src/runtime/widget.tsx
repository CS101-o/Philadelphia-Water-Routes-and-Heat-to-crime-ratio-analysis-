/** @jsx jsx */
import { React, jsx, type AllWidgetProps } from 'jimu-core'
import Graphic from 'esri/Graphic'
import Polyline from 'esri/geometry/Polyline'
import type Point from 'esri/geometry/Point'
import {
  useWaterMap, useTask, rainDrop, formatDistance,
  waterPanelStyles, WaterStatus, WaterLegend, RESULT_COLORS,
  type RainDropResult
} from 'widgets/shared-code/philly-water'

const { useState, useEffect } = React

function rainDropGraphics (point: Point, r: RainDropResult): Graphic[] {
  const line = (to: Point, color: number[], style: string) => new Graphic({
    geometry: new Polyline({ paths: [[[point.x, point.y], [to.x, to.y]]], spatialReference: point.spatialReference }),
    symbol: { type: 'simple-line', color, width: 2, style } as any
  })
  const graphics: Graphic[] = []
  if (r.creek) {
    graphics.push(new Graphic({ geometry: r.creek.feature.geometry, symbol: { type: 'simple-line', color: RESULT_COLORS.creek, width: 5 } as any }))
    graphics.push(line(r.creek.to, RESULT_COLORS.creek, 'dash'))
  }
  if (r.cso) {
    graphics.push(line(r.cso.to, RESULT_COLORS.cso, 'dot'))
    graphics.push(new Graphic({ geometry: r.cso.to, symbol: { type: 'simple-marker', size: 12, color: [0, 0, 0, 0], outline: { color: RESULT_COLORS.cso, width: 2.5 } } as any }))
  }
  graphics.push(new Graphic({ geometry: point, symbol: { type: 'text', text: '💧', font: { size: 22 }, yoffset: 8 } as any }))
  return graphics
}

export default function Widget (props: AllWidgetProps<unknown>) {
  const water = useWaterMap(props, 'Rain drop')
  const { busy, error, run } = useTask()
  const [drop, setDrop] = useState<RainDropResult>(null)
  const { jmv, layers, isOpen, showResults } = water

  // Listen for map clicks only while the panel is open
  useEffect(() => {
    if (!layers || !isOpen) return
    const handle = jmv.view.on('click', (event) => {
      event.stopPropagation() // don't open a popup on top of the result
      const point = event.mapPoint
      run(async () => {
        const result = await rainDrop(layers, point)
        setDrop(result)
        showResults(...rainDropGraphics(point, result))
      })
    })
    return () => { handle.remove() }
  }, [layers, isOpen, jmv, run, showResults])

  useEffect(() => { if (!isOpen) setDrop(null) }, [isOpen])

  return (
    <div className='jimu-widget widget-water-raindrop' css={waterPanelStyles}>
      {water.mapConnector}
      <h6>💧 Rain Drop</h6>
      <p className='muted mb-2'>Click anywhere on the map to trace where rain falling there ends up.</p>
      <WaterStatus water={water} error={error} />
      {busy && <div className='status'>⏳ Tracing…</div>}
      {drop && !busy && (
        <div className='card'>
          {drop.watershed
            ? <p>💧 Rain here drains to the <strong>{drop.watershed}</strong>.</p>
            : <p>💧 This spot is outside Philadelphia's mapped watersheds.</p>}
          {drop.creek
            ? <p>Nearest waterway: <strong>{drop.creek.name}</strong>, {formatDistance(drop.creek.distanceM)} away{drop.creek.feature.attributes.inf1 === 'Culverted' ? ' (buried in a culvert here)' : ''}.</p>
            : <p>No mapped creek within 1.5 mi.</p>}
          {drop.cso
            ? <p className='mb-0'>Nearest combined sewer outfall: <strong>{formatDistance(drop.cso.distanceM)}</strong>.</p>
            : <p className='mb-0'>No combined sewer outfall within 2.5 mi.</p>}
        </div>
      )}
      <WaterLegend />
    </div>
  )
}
