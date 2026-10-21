import FeatureLayer from 'esri/layers/FeatureLayer'
import type EsriMap from 'esri/Map'
import type { JimuMapView } from 'jimu-arcgis'

// Public layers published by the City of Philadelphia / Philadelphia Water Department
const BASE = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services'

/** Creek lines extend into the suburbs; this keeps the ones in (or bordering) the city. */
export const PHILLY_CREEKS = "county LIKE 'Philadelphia%'"
/** Combined sewer outfalls: overflow sewage + stormwater into creeks during heavy rain. */
export const CSO_WHERE = "outfall_type = 'COM'"

export interface WaterLayers {
  watersheds: FeatureLayer
  creeks: FeatureLayer
  outfalls: FeatureLayer
  sampling: FeatureLayer
}

const ID_PREFIX = 'water-analysis-'

export function createWaterLayers (): WaterLayers {
  return {
    watersheds: new FeatureLayer({
      id: `${ID_PREFIX}watersheds`,
      url: `${BASE}/Major_Watersheds_Phila/FeatureServer/0`,
      title: 'Watersheds (Philadelphia)',
      outFields: ['watershed_name', 'sq_miles'],
      opacity: 0.9,
      renderer: {
        type: 'simple',
        symbol: { type: 'simple-fill', color: [0, 90, 160, 0.06], outline: { color: [0, 70, 130, 0.8], width: 1.2, style: 'dash' } }
      } as any,
      labelingInfo: [{
        labelExpressionInfo: { expression: "Replace($feature.watershed_name, ' Watershed', '')" },
        symbol: { type: 'text', color: [0, 60, 110], haloColor: 'white', haloSize: 1.5, font: { size: 10, weight: 'bold' } }
      }] as any
    }),
    creeks: new FeatureLayer({
      id: `${ID_PREFIX}creeks`,
      url: `${BASE}/Hydrographic_Features_Arc/FeatureServer/0`,
      title: 'Creeks & rivers',
      definitionExpression: PHILLY_CREEKS,
      minScale: 0, // the service hides creeks beyond 1:150k; we want them at whole-city scale
      outFields: ['creek_name', 'watershed', 'inf1', 'order_strahler'],
      renderer: {
        type: 'unique-value',
        field: 'inf1',
        defaultSymbol: { type: 'simple-line', color: [30, 120, 220], width: 1.6 },
        uniqueValueInfos: [
          { value: 'Culverted', label: 'Culverted (buried)', symbol: { type: 'simple-line', color: [30, 120, 220, 0.6], width: 1.2, style: 'short-dot' } }
        ],
        visualVariables: [{ type: 'size', field: 'order_strahler', stops: [{ value: 1, size: 1 }, { value: 4, size: 2.5 }, { value: 7, size: 4.5 }] }]
      } as any,
      popupTemplate: { title: '{creek_name}', content: 'Watershed: {watershed}<br>Stream order: {order_strahler}<br>Structure: {inf1}' }
    }),
    outfalls: new FeatureLayer({
      id: `${ID_PREFIX}outfalls`,
      url: `${BASE}/OUTFALLS/FeatureServer/0`,
      title: 'Sewer outfalls',
      outFields: ['outfall_type', 'year_installed'],
      renderer: {
        type: 'unique-value',
        field: 'outfall_type',
        defaultSymbol: { type: 'simple-marker', size: 4, color: [120, 120, 120, 0.7], outline: { width: 0 } },
        defaultLabel: 'Storm sewer outfall',
        uniqueValueInfos: [
          { value: 'COM', label: 'Combined sewer outfall (CSO)', symbol: { type: 'simple-marker', size: 7, color: [214, 39, 40], outline: { color: 'white', width: 1 } } }
        ]
      } as any,
      popupTemplate: { title: 'Sewer outfall', content: 'Type: {outfall_type} (COM = combined sewer)<br>Installed: {year_installed}' }
    }),
    sampling: new FeatureLayer({
      id: `${ID_PREFIX}sampling`,
      url: `${BASE}/StreamSamplingLocations/FeatureServer/0`,
      title: 'Stream sampling sites',
      outFields: ['site_id', 'creekname', 'loc_desc'],
      renderer: {
        type: 'simple',
        symbol: { type: 'simple-marker', style: 'diamond', size: 6, color: [44, 160, 44], outline: { color: 'white', width: 0.75 } }
      } as any,
      popupTemplate: { title: '{site_id}', content: '{creekname}<br>{loc_desc}' }
    })
  }
}

function layerList (layers: WaterLayers) {
  return [layers.watersheds, layers.creeks, layers.sampling, layers.outfalls]
}

// One set of layers per map, shared by every water widget connected to it.
// Added when the first widget attaches, removed when the last one releases.
const registry = new WeakMap<EsriMap, { layers: WaterLayers, users: number }>()

export function attachWaterLayers (jmv: JimuMapView): { layers: WaterLayers, release: () => void } {
  const map = jmv.view.map
  let entry = registry.get(map)
  if (!entry) {
    entry = { layers: createWaterLayers(), users: 0 }
    registry.set(map, entry)
    // A Map widget with no web map falls back to the organisation's default basemap
    // (GB Topographic for UoM, which is blank over Philadelphia). Use a quiet world basemap instead.
    if (!jmv.dataSourceId) map.basemap = 'gray-vector' as any
    map.addMany(layerList(entry.layers))
    const { watersheds } = entry.layers
    watersheds.when(() => jmv.view.goTo(watersheds.fullExtent)).catch(() => undefined)
  }
  entry.users++

  let released = false
  const shared = entry
  return {
    layers: shared.layers,
    release: () => {
      if (released) return
      released = true
      if (--shared.users === 0) {
        map.removeMany(layerList(shared.layers))
        registry.delete(map)
      }
    }
  }
}
