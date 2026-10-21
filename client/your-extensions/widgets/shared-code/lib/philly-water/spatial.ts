import type Point from 'esri/geometry/Point'
import type Polygon from 'esri/geometry/Polygon'
import type Polyline from 'esri/geometry/Polyline'
import type SpatialReference from 'esri/geometry/SpatialReference'
import type Graphic from 'esri/Graphic'
import * as unionOperator from 'esri/geometry/operators/unionOperator'
import * as proximityOperator from 'esri/geometry/operators/proximityOperator'
import * as geodesicBufferOperator from 'esri/geometry/operators/geodesicBufferOperator'
import * as geodeticLengthOperator from 'esri/geometry/operators/geodeticLengthOperator'
import * as geodeticAreaOperator from 'esri/geometry/operators/geodeticAreaOperator'
import * as geodeticDistanceOperator from 'esri/geometry/operators/geodeticDistanceOperator'
import { type WaterLayers, PHILLY_CREEKS, CSO_WHERE } from './layers'
import { type WatershedRow, mercatorToMiles, sqlString } from './analysis'

// Philadelphia's latitude; used to correct Web Mercator lengths returned by the service
const PHILLY_LAT = 40.0

let operatorsLoaded: Promise<unknown>
function loadOperators () {
  operatorsLoaded ??= Promise.all([
    geodesicBufferOperator.load(), geodeticLengthOperator.load(), geodeticAreaOperator.load(), geodeticDistanceOperator.load()
  ])
  return operatorsLoaded
}

const sumStat = (field: string, alias: string) => [{ statisticType: 'sum' as const, onStatisticField: field, outStatisticFieldName: alias }]

// ── 1. Watershed summary ────────────────────────────────────────────────────

export interface WatershedSummary extends WatershedRow { geometry: Polygon }

/** Overlays creeks, outfalls and sampling sites on each watershed polygon. */
export async function summarizeWatersheds (layers: WaterLayers, sr: SpatialReference): Promise<WatershedSummary[]> {
  const { features } = await layers.watersheds.queryFeatures({
    where: '1=1', outFields: ['watershed_name', 'sq_miles'], returnGeometry: true, outSpatialReference: sr
  })

  // Some watersheds (e.g. Delaware Direct) are split into several polygons; merge them
  const groups = new Map<string, { sqMiles: number, parts: Polygon[] }>()
  for (const f of features) {
    const name: string = f.attributes.watershed_name
    const g = groups.get(name) ?? { sqMiles: 0, parts: [] }
    g.sqMiles += f.attributes.sq_miles ?? 0
    g.parts.push(f.geometry as Polygon)
    groups.set(name, g)
  }

  return Promise.all([...groups].map(async ([name, g]) => {
    const geometry = (g.parts.length > 1 ? unionOperator.executeMany(g.parts) : g.parts[0]) as Polygon
    const within = { geometry, spatialRelationship: 'intersects' as const }
    const [length, outfalls, cso, samplingSites] = await Promise.all([
      layers.creeks.queryFeatures({ ...within, where: PHILLY_CREEKS, outStatistics: sumStat('Shape__Length', 'm') }),
      layers.outfalls.queryFeatureCount({ ...within, where: '1=1' }),
      layers.outfalls.queryFeatureCount({ ...within, where: CSO_WHERE }),
      layers.sampling.queryFeatureCount({ ...within, where: '1=1' })
    ])
    const mercatorMetres: number = length.features[0]?.attributes.m ?? 0
    return { name, sqMiles: g.sqMiles, creekMiles: mercatorToMiles(mercatorMetres, PHILLY_LAT), outfalls, cso, samplingSites, geometry }
  }))
}

// ── 2. Rain drop: where does water falling here go? ─────────────────────────

export interface Nearest<T> { name: string, distanceM: number, from: Point, to: Point, feature: T }

export interface RainDropResult {
  watershed: string | null
  creek: Nearest<Graphic> | null
  cso: Nearest<Graphic> | null
}

async function nearestFeature (features: Graphic[], point: Point, nameOf: (g: Graphic) => string): Promise<Nearest<Graphic> | null> {
  await loadOperators()
  let best: Nearest<Graphic> | null = null
  for (const f of features) {
    const { coordinate } = proximityOperator.getNearestCoordinate(f.geometry as Polyline | Point, point)
    const distanceM = geodeticDistanceOperator.execute(point, coordinate)
    if (!best || distanceM < best.distanceM) best = { name: nameOf(f), distanceM, from: point, to: coordinate, feature: f }
  }
  return best
}

export async function rainDrop (layers: WaterLayers, point: Point): Promise<RainDropResult> {
  const near = (distance: number) => ({ geometry: point, distance, units: 'meters' as const, spatialRelationship: 'intersects' as const, returnGeometry: true, outSpatialReference: point.spatialReference })

  const [ws, creeks, csos] = await Promise.all([
    layers.watersheds.queryFeatures({ geometry: point, spatialRelationship: 'intersects', outFields: ['watershed_name'] }),
    layers.creeks.queryFeatures({ ...near(2500), where: PHILLY_CREEKS, outFields: ['creek_name', 'inf1'] }),
    layers.outfalls.queryFeatures({ ...near(4000), where: CSO_WHERE, outFields: ['objectid'] })
  ])

  return {
    watershed: ws.features[0]?.attributes.watershed_name ?? null,
    creek: await nearestFeature(creeks.features, point, g => g.attributes.creek_name || 'Unnamed creek'),
    cso: await nearestFeature(csos.features, point, () => 'Combined sewer outfall')
  }
}

// ── 3. Creek corridor buffer ────────────────────────────────────────────────

export async function listCreeks (layers: WaterLayers): Promise<Array<{ name: string, miles: number }>> {
  const { features } = await layers.creeks.queryFeatures({
    where: `${PHILLY_CREEKS} AND creek_name IS NOT NULL AND creek_name NOT LIKE '%unnamed%'`,
    groupByFieldsForStatistics: ['creek_name'],
    outStatistics: sumStat('Shape__Length', 'm')
  })
  return features
    .map(f => ({ name: f.attributes.creek_name as string, miles: mercatorToMiles(f.attributes.m, PHILLY_LAT) }))
    .filter(c => c.miles >= 0.25)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface CorridorResult {
  creek: Polyline
  buffer: Polygon
  lengthMi: number
  areaSqM: number
  outfalls: Graphic[]
  cso: number
  samplingSites: number
}

export async function creekCorridor (layers: WaterLayers, creekName: string, bufferFt: number, sr: SpatialReference): Promise<CorridorResult> {
  await loadOperators()
  const { features } = await layers.creeks.queryFeatures({
    where: `${PHILLY_CREEKS} AND creek_name = ${sqlString(creekName)}`,
    returnGeometry: true,
    outSpatialReference: sr
  })
  if (!features.length) throw new Error(`No segments found for ${creekName}`)

  const creek = unionOperator.executeMany(features.map(f => f.geometry as Polyline)) as Polyline
  const buffer = geodesicBufferOperator.execute(creek, bufferFt, { unit: 'feet' })
  const within = { geometry: buffer, spatialRelationship: 'intersects' as const }

  const [outfalls, samplingSites] = await Promise.all([
    layers.outfalls.queryFeatures({ ...within, where: '1=1', outFields: ['outfall_type'], returnGeometry: true, outSpatialReference: sr }),
    layers.sampling.queryFeatureCount({ ...within, where: '1=1' })
  ])

  return {
    creek,
    buffer,
    lengthMi: geodeticLengthOperator.execute(creek, { unit: 'miles' }),
    areaSqM: geodeticAreaOperator.execute(buffer),
    outfalls: outfalls.features,
    cso: outfalls.features.filter(f => f.attributes.outfall_type === 'COM').length,
    samplingSites
  }
}
