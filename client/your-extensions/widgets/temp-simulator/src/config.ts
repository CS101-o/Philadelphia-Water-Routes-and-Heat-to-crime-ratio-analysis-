import type { ImmutableObject } from 'jimu-core'

export type TempUnit = 'F' | 'C'

export interface RiskTier {
  /** Tier applies when temperature (°F) is strictly above this value. `null` marks the baseline tier. */
  aboveF: number | null
  label: string
  /** Estimated % increase in violent crime risk vs. baseline. */
  uplift: number
  /** Only counties with a crime rate above this are kept on the map. `null` shows everything. */
  minCrimeRate: number | null
  color: string
}

export interface Config {
  crimeField: string
  defaultUnit: TempUnit
  minF: number
  maxF: number
  initialF: number
  tiers: RiskTier[]
}

export type IMConfig = ImmutableObject<Config>

/** Used when an existing widget instance has no saved config. Keep in sync with config.json. */
export const DEFAULT_CONFIG: Config = {
  crimeField: 'v043_rawvalue',
  defaultUnit: 'F',
  minF: 40,
  maxF: 105,
  initialF: 70,
  tiers: [
    { aboveF: null, label: 'Baseline', uplift: 0, minCrimeRate: null, color: '#28a745' },
    { aboveF: 75, label: 'Elevated', uplift: 12, minCrimeRate: 300, color: '#e0a800' },
    { aboveF: 85, label: 'High', uplift: 18, minCrimeRate: 500, color: '#fd7e14' },
    { aboveF: 95, label: 'Critical', uplift: 25, minCrimeRate: 800, color: '#dc3545' }
  ]
}
