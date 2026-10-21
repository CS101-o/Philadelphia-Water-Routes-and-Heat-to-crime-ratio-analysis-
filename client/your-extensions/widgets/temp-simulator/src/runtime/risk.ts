import type { RiskTier, TempUnit } from '../config'

const SAFE_FIELD = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Baseline first, then ascending thresholds. */
export function sortTiers (tiers: readonly RiskTier[]): RiskTier[] {
  return [...tiers].sort((a, b) => (a.aboveF ?? -Infinity) - (b.aboveF ?? -Infinity))
}

export function getTier (tempF: number, sortedTiers: readonly RiskTier[]): RiskTier {
  let match = sortedTiers[0]
  for (const tier of sortedTiers) {
    if (tier.aboveF === null || tempF > tier.aboveF) match = tier
  }
  return match
}

export function buildWhere (tier: RiskTier, field: string): string {
  if (tier.minCrimeRate === null || !SAFE_FIELD.test(field)) return '1=1'
  return `${field} > ${Number(tier.minCrimeRate)}`
}

export function describeTier (tier: RiskTier): string {
  return tier.uplift > 0 ? `+${tier.uplift}% · ${tier.label} risk` : `${tier.label} risk`
}

export function toUnit (tempF: number, unit: TempUnit): number {
  return unit === 'C' ? Math.round((tempF - 32) * 5 / 9) : tempF
}

export function formatTemp (tempF: number, unit: TempUnit): string {
  return `${toUnit(tempF, unit)}°${unit}`
}

/** CSS linear-gradient painting each tier's band across the slider range. */
export function tierGradient (sortedTiers: readonly RiskTier[], minF: number, maxF: number): string {
  const span = maxF - minF
  const pct = (f: number) => `${Math.min(100, Math.max(0, ((f - minF) / span) * 100)).toFixed(1)}%`
  const stops = sortedTiers.map((tier, i) => {
    const start = tier.aboveF === null ? minF : tier.aboveF
    const end = sortedTiers[i + 1]?.aboveF ?? maxF
    return `${tier.color} ${pct(start)} ${pct(end)}`
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
}
