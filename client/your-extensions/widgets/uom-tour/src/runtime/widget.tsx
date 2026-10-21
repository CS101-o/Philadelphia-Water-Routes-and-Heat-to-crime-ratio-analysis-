import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'

const { useState } = React

interface Stop { name: string, emoji: string, lat: number, lon: number, zoom: number, blurb: string, btn: string }

const STOPS: Stop[] = [
  { name: 'Whitworth Hall', emoji: '🎓', lat: 53.4668, lon: -2.2339, zoom: 18, btn: 'btn-primary', blurb: 'Gothic-revival heart of the Old Quad, where graduations take place.' },
  { name: "Students' Union", emoji: '📚', lat: 53.4659, lon: -2.2335, zoom: 17, btn: 'btn-success', blurb: 'Societies, gigs and coffee on Oxford Road.' },
  { name: 'Manchester Museum', emoji: '🦖', lat: 53.4663, lon: -2.2356, zoom: 18, btn: 'btn-info', blurb: 'Home to Stan the T. rex and 4.5 million objects.' }
]

export default function Widget (props: AllWidgetProps<any>) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [current, setCurrent] = useState<number>(null)
  const [error, setError] = useState<string>(null)

  const flyTo = (index: number) => {
    const stop = STOPS[index]
    setCurrent(index)
    if (!jimuMapView) {
      setError('No map connected — pick one in the widget settings.')
      return
    }
    setError(null)
    jimuMapView.view.goTo({ center: [stop.lon, stop.lat], zoom: stop.zoom }, { duration: 2000 })
      .catch((err) => { if (err.name !== 'AbortError') setError(`Couldn't fly there: ${err.message}`) })
  }

  const next = () => { flyTo(current === null ? 0 : (current + 1) % STOPS.length) }

  return (
    <div className='widget-demo jimu-widget p-3 bg-white' style={{ borderRadius: '8px', border: '1px solid #ccc', overflow: 'auto' }}>

      {/* Invisible bridge between this widget and the map. Falls back to the app's first map. */}
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0] || 'widget_1'}
        onActiveViewChange={(jmv) => { setJimuMapView(jmv) }}
      />

      <h4 className='mb-1'>📍 UoM Campus Tour</h4>
      <p className='small text-muted mb-3'>Click a location to fly there, or take the guided tour.</p>

      <div className='d-flex flex-column'>
        {STOPS.map((stop, i) => (
          <button
            key={stop.name}
            type='button'
            className={`btn ${current === i ? stop.btn : stop.btn.replace('btn-', 'btn-outline-')} mb-2 text-start`}
            aria-pressed={current === i}
            onClick={() => { flyTo(i) }}
          >
            {stop.emoji} {stop.name}
          </button>
        ))}
      </div>

      <button type='button' className='btn btn-dark w-100 mt-1' onClick={next}>
        {current === null ? '▶ Start guided tour' : `Next stop (${((current + 1) % STOPS.length) + 1}/${STOPS.length}) →`}
      </button>

      {current !== null && !error && (
        <p className='small mt-3 mb-0'><strong>{STOPS[current].name}:</strong> {STOPS[current].blurb}</p>
      )}
      {error && <p className='small text-danger mt-3 mb-0'>{error}</p>}
    </div>
  )
}
