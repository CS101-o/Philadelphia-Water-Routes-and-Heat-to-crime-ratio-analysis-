/** @jsx jsx */
import {
  React, jsx, css, Immutable, DataSourceComponent,
  type AllWidgetProps, type DataSource, type QueriableDataSource, type SqlQueryParams
} from 'jimu-core'
import { DEFAULT_CONFIG, type IMConfig, type TempUnit } from '../config'
import { sortTiers, getTier, buildWhere, describeTier, formatTemp, tierGradient } from './risk'

const { useState, useEffect, useMemo, useRef } = React

// County Health Rankings 2022 — County layer. Used when no data source is picked in the settings panel.
const FALLBACK_USE_DS = Immutable({
  dataSourceId: 'dataSource_2-18385e816ab-layer-7-18385e8170f-layer-8',
  mainDataSourceId: 'dataSource_2-18385e816ab-layer-7-18385e8170f-layer-8',
  rootDataSourceId: 'dataSource_2'
})

const PRESETS = [
  { label: 'Spring', emoji: '🌱', f: 62 },
  { label: 'Summer', emoji: '☀️', f: 82 },
  { label: 'Heatwave', emoji: '🔥', f: 92 },
  { label: 'Extreme', emoji: '🥵', f: 102 }
]

const HEATWAVE_STEP_MS = 90

// Compact so it fits a ~330×330 widget controller panel without scrolling
const styles = css`
  height: 100%;
  overflow: auto;
  padding: 12px;
  background: var(--sys-color-surface-paper, #fff);
  color: var(--sys-color-surface-paper-text, #212529);
  font-size: 12px;

  .header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .header h6 { margin: 0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .unit-toggle { flex: 0 0 auto; display: inline-flex; border: 1px solid var(--sys-color-divider-secondary, #ccc); border-radius: 999px; overflow: hidden; }
  .unit-toggle button { min-width: 34px; border: 0; background: transparent; color: inherit; padding: 2px 8px; font-size: 12px; line-height: 18px; cursor: pointer; }
  .unit-toggle button[aria-pressed='true'] { background: var(--sys-color-surface-paper-text, #343a40); color: var(--sys-color-surface-paper, #fff); }

  .readout { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px 10px; margin: 10px 0 8px; }
  .readout .temp { font-size: 2rem; font-weight: 700; line-height: 1; transition: color .3s; font-variant-numeric: tabular-nums; }
  .readout .badge-risk { padding: 3px 10px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 600; white-space: nowrap; transition: background-color .3s; }

  input[type='range'] { -webkit-appearance: none; appearance: none; display: block; width: 100%; height: 8px; margin: 6px 0 0; border-radius: 999px; cursor: pointer; outline-offset: 4px; }
  input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 3px solid var(--thumb-color); box-shadow: 0 1px 3px rgba(0,0,0,.35); }
  input[type='range']::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 3px solid var(--thumb-color); box-shadow: 0 1px 3px rgba(0,0,0,.35); }
  .scale { display: flex; justify-content: space-between; font-size: 11px; opacity: .7; margin-top: 2px; }

  .presets { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 4px; margin: 8px 0 6px; }
  .presets button, .play { border: 1px solid var(--sys-color-divider-secondary, #ccc); background: transparent; color: inherit; border-radius: 6px; padding: 3px 4px; font-size: 11px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .presets button:hover, .play:hover { background: var(--sys-color-action-hover, rgba(0,0,0,.05)); }
  .play { width: 100%; font-weight: 600; padding: 5px; font-size: 12px; }

  .impact { margin-top: 10px; }
  .impact .bar { height: 5px; border-radius: 999px; background: var(--sys-color-divider-tertiary, #e9ecef); overflow: hidden; margin-top: 3px; }
  .impact .bar > div { height: 100%; transition: width .4s, background-color .3s; }
  .impact .hint { margin-top: 3px; font-size: 11px; opacity: .7; }
  .notice { padding: 6px; border-radius: 4px; text-align: center; margin-top: 8px; background: #fff3cd; color: #856404; }
`

export default function Widget (props: AllWidgetProps<IMConfig>) {
  const { config, id } = props
  const crimeField = config?.crimeField ?? DEFAULT_CONFIG.crimeField
  const minF = config?.minF ?? DEFAULT_CONFIG.minF
  const maxF = config?.maxF ?? DEFAULT_CONFIG.maxF
  const tiers = useMemo(
    () => sortTiers(config?.tiers?.length ? config.tiers.asMutable({ deep: true }) : DEFAULT_CONFIG.tiers),
    [config?.tiers]
  )

  const [tempF, setTempF] = useState(config?.initialF ?? DEFAULT_CONFIG.initialF)
  const [unit, setUnit] = useState<TempUnit>(config?.defaultUnit ?? DEFAULT_CONFIG.defaultUnit)
  const [ds, setDs] = useState<QueriableDataSource>(null)
  const [shownCount, setShownCount] = useState<number>(null)
  const [totalCount, setTotalCount] = useState<number>(null)
  const [playing, setPlaying] = useState(false)
  const playTimer = useRef<ReturnType<typeof setInterval>>(null)

  const useDataSource = props.useDataSources?.[0] ?? FALLBACK_USE_DS
  const tier = getTier(tempF, tiers)
  // Only changes when the tier changes, so dragging within a band doesn't re-query the layer.
  const where = buildWhere(tier, crimeField)

  useEffect(() => {
    if (!ds) return
    ds.updateQueryParams({ where } as SqlQueryParams, id)

    let cancelled = false
    ds.queryCount({ where } as SqlQueryParams)
      .then(({ count }) => { if (!cancelled) setShownCount(count) })
      .catch(() => { if (!cancelled) setShownCount(null) })
    return () => { cancelled = true }
  }, [ds, where, id])

  // Counts are narrowed by our own filter once it's applied, so take the total before applying it.
  const onDataSourceCreated = (created: DataSource) => {
    const queriable = created as QueriableDataSource
    queriable.queryCount({ where: '1=1' } as SqlQueryParams)
      .then(({ count }) => { setTotalCount(count) })
      .catch(() => { setTotalCount(null) })
      .finally(() => { setDs(queriable) })
  }

  // Remove our filter from the shared layer when the widget goes away.
  useEffect(() => () => { ds?.updateQueryParams(null, id) }, [ds, id])

  const stopHeatwave = () => {
    clearInterval(playTimer.current)
    playTimer.current = null
    setPlaying(false)
  }

  const playHeatwave = () => {
    if (playing) { stopHeatwave(); return }
    setTempF(t => (t >= maxF ? minF + 20 : t))
    setPlaying(true)
    playTimer.current = setInterval(() => {
      setTempF(t => Math.min(maxF, t + 1))
    }, HEATWAVE_STEP_MS)
  }

  useEffect(() => {
    if (playing && tempF >= maxF) stopHeatwave()
  }, [playing, tempF, maxF])

  useEffect(() => () => { clearInterval(playTimer.current) }, [])

  const setManually = (f: number) => {
    if (playing) stopHeatwave()
    setTempF(f)
  }

  const color = tier.color
  const shownPct = totalCount ? Math.round((shownCount / totalCount) * 100) : 0

  return (
    <div className='jimu-widget widget-temp-simulator' css={styles}>
      {/* Forces EXB to load the data source so we can filter it */}
      <DataSourceComponent
        useDataSource={useDataSource}
        widgetId={id}
        onDataSourceCreated={onDataSourceCreated}
      />

      <div className='header'>
        <h6 title='Filters the map to counties most at risk as temperatures rise'>🌡️ Heat &amp; Crime Simulator</h6>
        <div className='unit-toggle' role='group' aria-label='Temperature unit'>
          {(['F', 'C'] as TempUnit[]).map(u => (
            <button key={u} type='button' aria-pressed={unit === u} onClick={() => { setUnit(u) }}>°{u}</button>
          ))}
        </div>
      </div>

      {!ds && <div className='notice'>⏳ Loading data source…</div>}

      <div className='readout'>
        <div className='temp' style={{ color }}>{formatTemp(tempF, unit)}</div>
        <span className='badge-risk' style={{ backgroundColor: color }} aria-live='polite'>
          {describeTier(tier)}
        </span>
      </div>

      <input
        type='range'
        min={minF}
        max={maxF}
        value={tempF}
        aria-label='Temperature'
        aria-valuetext={`${formatTemp(tempF, unit)}, ${describeTier(tier)}`}
        onChange={(e) => { setManually(Number(e.target.value)) }}
        style={{ background: tierGradient(tiers, minF, maxF), ['--thumb-color' as any]: color }}
      />
      <div className='scale'>
        <span>{formatTemp(minF, unit)}</span>
        <span>{formatTemp(maxF, unit)}</span>
      </div>

      <div className='presets'>
        {PRESETS.filter(p => p.f >= minF && p.f <= maxF).map(p => (
          <button key={p.label} type='button' onClick={() => { setManually(p.f) }} title={formatTemp(p.f, unit)}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      <button type='button' className='play' onClick={playHeatwave}>
        {playing ? '⏸ Pause heatwave' : '▶ Simulate a heatwave'}
      </button>

      {shownCount !== null && totalCount !== null && (
        <div className='impact' aria-live='polite'>
          <div className='d-flex justify-content-between'>
            <span>Counties shown on map</span>
            <strong>{shownCount.toLocaleString()} / {totalCount.toLocaleString()}</strong>
          </div>
          <div className='bar'><div style={{ width: `${shownPct}%`, backgroundColor: color }} /></div>
          {tier.minCrimeRate !== null && (
            <div className='hint'>
              Crime rate &gt; {tier.minCrimeRate.toLocaleString()} per 100k
            </div>
          )}
        </div>
      )}
    </div>
  )
}
