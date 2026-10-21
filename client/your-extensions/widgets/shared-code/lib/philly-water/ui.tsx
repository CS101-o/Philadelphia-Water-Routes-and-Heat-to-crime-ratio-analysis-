/** @jsx jsx */
import { React, jsx, css } from 'jimu-core'
import type { WaterMap } from './use-water-map'

export const RESULT_COLORS = { highlight: [255, 170, 0], cso: [214, 39, 40], creek: [0, 200, 255] }

/** Look shared by all water widgets. */
export const waterPanelStyles = css`
  height: 100%;
  overflow: auto;
  padding: 12px;
  font-size: 12px;
  background: var(--sys-color-surface-paper, #fff);
  color: var(--sys-color-surface-paper-text, #212529);

  h6 { margin: 0 0 6px; font-weight: 600; }
  .muted { opacity: .7; }
  .status { padding: 8px; border-radius: 6px; background: var(--sys-color-action-hover, rgba(0,0,0,.05)); text-align: center; margin-bottom: 8px; }
  .error { color: #c62828; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: right; font-weight: 600; font-size: 11px; padding: 4px 3px; border-bottom: 1px solid var(--sys-color-divider-secondary, #ccc); }
  th:first-of-type, td:first-of-type { text-align: left; }
  td { text-align: right; padding: 4px 3px; font-variant-numeric: tabular-nums; }
  tbody tr { cursor: pointer; }
  tbody tr:hover, tbody tr[aria-selected='true'] { background: var(--sys-color-action-hover, rgba(0,0,0,.05)); }
  .bar { height: 4px; border-radius: 2px; background: rgb(214, 39, 40); margin-top: 2px; }

  .card { border: 1px solid var(--sys-color-divider-secondary, #ccc); border-radius: 8px; padding: 10px; margin-top: 8px; }
  .card p { margin: 0 0 6px; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
  .stat { border-radius: 6px; padding: 6px; background: var(--sys-color-action-hover, rgba(0,0,0,.05)); }
  .stat strong { display: block; font-size: 16px; }
  .stat.cso strong { color: rgb(214, 39, 40); }
  label { display: block; font-weight: 600; margin: 6px 0 3px; }
  select, input[type='range'] { width: 100%; }
  .run { width: 100%; margin-top: 8px; padding: 6px; border: 0; border-radius: 6px; background: #1f6fb2; color: #fff; font-weight: 600; cursor: pointer; }
  .run:disabled { opacity: .5; cursor: default; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 10px; font-size: 11px; }
  .legend i { display: inline-block; width: 10px; height: 10px; margin-right: 4px; vertical-align: -1px; border-radius: 50%; }
`

/** Map-connection and error messages every water widget shows. */
export function WaterStatus ({ water, error }: { water: WaterMap, error?: string | null }) {
  return (
    <React.Fragment>
      {!water.mapWidgetId && <div className='status'>Add a Map widget to the page, or pick one in this widget's settings.</div>}
      {water.mapWidgetId && !water.layers && <div className='status'>⏳ Connecting to the map…</div>}
      {error && <div className='status error'>⚠️ {error}</div>}
    </React.Fragment>
  )
}

export function WaterLegend () {
  return (
    <div className='legend muted'>
      <span><i style={{ background: 'rgb(30,120,220)', borderRadius: 0, height: 3 }} />Creek</span>
      <span><i style={{ background: 'rgb(214,39,40)' }} />Combined sewer outfall</span>
      <span><i style={{ background: 'rgb(120,120,120)' }} />Storm outfall</span>
      <span><i style={{ background: 'rgb(44,160,44)', borderRadius: 0, transform: 'rotate(45deg) scale(.8)' }} />Sampling site</span>
    </div>
  )
}
