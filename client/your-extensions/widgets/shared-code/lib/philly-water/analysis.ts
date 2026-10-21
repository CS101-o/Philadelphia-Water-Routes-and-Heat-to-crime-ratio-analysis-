// Pure helpers for the water analysis. No ArcGIS imports so they can be unit-tested.

const FT_PER_M = 3.28084
const M_PER_MI = 1609.344

/**
 * Web Mercator stretches distances by 1 / cos(latitude).
 * Multiply a Web Mercator length by this to get true ground metres.
 */
export function mercatorScale (latitude: number): number {
  return Math.cos((latitude * Math.PI) / 180)
}

export function mercatorToMiles (mercatorMetres: number, latitude: number): number {
  return (mercatorMetres * mercatorScale(latitude)) / M_PER_MI
}

/** Feet under 0.2 mi, miles above. */
export function formatDistance (metres: number): string {
  const feet = metres * FT_PER_M
  if (feet < 1056) return `${Math.round(feet / 10) * 10} ft`
  return `${(metres / M_PER_MI).toFixed(1)} mi`
}

export function formatArea (sqMetres: number): string {
  const acres = sqMetres / 4046.856
  return acres < 640 ? `${Math.round(acres)} acres` : `${(acres / 640).toFixed(2)} sq mi`
}

/** Escape a value for use inside a single-quoted SQL string. */
export function sqlString (value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

export interface WatershedRow {
  name: string
  sqMiles: number
  creekMiles: number
  outfalls: number
  cso: number
  samplingSites: number
}

export interface RankedWatershed extends WatershedRow {
  /** Creek miles per square mile of land. */
  drainageDensity: number
  /** Combined sewer outfalls per creek mile: how much overflow pressure each mile of creek carries. */
  csoPerCreekMile: number
}

export function rankWatersheds (rows: WatershedRow[]): RankedWatershed[] {
  return rows
    .map(r => ({
      ...r,
      drainageDensity: r.sqMiles ? r.creekMiles / r.sqMiles : 0,
      csoPerCreekMile: r.creekMiles ? r.cso / r.creekMiles : 0
    }))
    .sort((a, b) => b.csoPerCreekMile - a.csoPerCreekMile || b.cso - a.cso)
}

/** Strip the trailing " Watershed" so table labels stay short. */
export function shortWatershedName (name: string): string {
  return name.replace(/\s+Watershed$/i, '')
}
