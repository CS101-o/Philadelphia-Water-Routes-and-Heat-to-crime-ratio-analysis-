import { React, getAppStore, WidgetState, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import type Graphic from 'esri/Graphic'
import { attachWaterLayers, type WaterLayers } from './layers'

const { useState, useEffect, useMemo, useCallback } = React

/** First Map widget in the app, used when none is picked in settings. */
function firstMapWidgetId (): string | undefined {
  const widgets = getAppStore().getState().appConfig?.widgets ?? {}
  return Object.keys(widgets).find(id => widgets[id].uri === 'widgets/arcgis/arcgis-map/')
}

export interface WaterMap {
  /** Render this somewhere in the widget to connect to the map. */
  mapConnector: React.ReactElement | null
  mapWidgetId: string | undefined
  jmv: JimuMapView | null
  /** Shared creek / outfall / watershed layers; null until the map is ready. */
  layers: WaterLayers | null
  /** False while the widget's controller panel is closed. */
  isOpen: boolean
  /** Replace this widget's own result graphics. */
  showResults: (...graphics: Graphic[]) => void
}

export function useWaterMap (props: AllWidgetProps<unknown>, resultsTitle: string): WaterMap {
  const mapWidgetId = props.useMapWidgetIds?.[0] ?? firstMapWidgetId()
  const [jmv, setJmv] = useState<JimuMapView>(null)
  const [layers, setLayers] = useState<WaterLayers>(null)
  const results = useMemo(() => new GraphicsLayer({ title: resultsTitle, listMode: 'hide' }), [resultsTitle])
  const isOpen = props.state !== WidgetState.Closed

  useEffect(() => {
    const map = jmv?.view?.map
    if (!map) return
    const attached = attachWaterLayers(jmv)
    map.add(results)
    setLayers(attached.layers)
    return () => {
      map.remove(results)
      attached.release()
      setLayers(null)
    }
  }, [jmv, results])

  // Each widget's results disappear when its panel closes
  useEffect(() => { if (!isOpen) results.removeAll() }, [isOpen, results])

  const showResults = useCallback((...graphics: Graphic[]) => {
    results.removeAll()
    results.addMany(graphics)
  }, [results])

  const mapConnector = mapWidgetId ? <JimuMapViewComponent useMapWidgetId={mapWidgetId} onActiveViewChange={setJmv} /> : null
  return { mapConnector, mapWidgetId, jmv, layers, isOpen, showResults }
}

/** Run an async task with busy / error state. */
export function useTask () {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>(null)
  const run = useCallback(async <T, >(task: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true); setError(null)
    try { return await task() } catch (e) { setError(e?.message ?? String(e)) } finally { setBusy(false) }
  }, [])
  return { busy, error, run }
}
