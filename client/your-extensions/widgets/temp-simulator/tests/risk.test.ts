import { sortTiers, getTier, buildWhere, describeTier, toUnit, formatTemp, tierGradient } from '../src/runtime/risk'
import { DEFAULT_CONFIG, type RiskTier } from '../src/config'
import * as configJson from '../config.json'

const tiers = sortTiers(DEFAULT_CONFIG.tiers)

describe('temp-simulator risk model', () => {
  it('code defaults match config.json', () => {
    const { default: _ignored, ...json } = configJson as any
    expect(json).toEqual(DEFAULT_CONFIG)
  })

  it('keeps the original tier boundaries (strictly above threshold)', () => {
    expect(getTier(40, tiers).label).toBe('Baseline')
    expect(getTier(75, tiers).label).toBe('Baseline')
    expect(getTier(76, tiers).label).toBe('Elevated')
    expect(getTier(85, tiers).label).toBe('Elevated')
    expect(getTier(86, tiers).label).toBe('High')
    expect(getTier(95, tiers).label).toBe('High')
    expect(getTier(96, tiers).label).toBe('Critical')
  })

  it('sorts tiers regardless of input order', () => {
    const shuffled: RiskTier[] = [tiers[2], tiers[0], tiers[3], tiers[1]]
    expect(sortTiers(shuffled).map(t => t.label)).toEqual(['Baseline', 'Elevated', 'High', 'Critical'])
  })

  it('builds a where clause per tier', () => {
    expect(buildWhere(getTier(70, tiers), 'v043_rawvalue')).toBe('1=1')
    expect(buildWhere(getTier(90, tiers), 'v043_rawvalue')).toBe('v043_rawvalue > 500')
  })

  it('refuses unsafe field names', () => {
    expect(buildWhere(getTier(100, tiers), 'x; DROP TABLE')).toBe('1=1')
  })

  it('describes tiers', () => {
    expect(describeTier(tiers[0])).toBe('Baseline risk')
    expect(describeTier(tiers[3])).toBe('+25% · Critical risk')
  })

  it('converts units', () => {
    expect(toUnit(212, 'C')).toBe(100)
    expect(formatTemp(95, 'C')).toBe('35°C')
    expect(formatTemp(95, 'F')).toBe('95°F')
  })

  it('paints contiguous gradient bands', () => {
    expect(tierGradient(tiers, 40, 105)).toBe(
      'linear-gradient(to right, #28a745 0.0% 53.8%, #e0a800 53.8% 69.2%, #fd7e14 69.2% 84.6%, #dc3545 84.6% 100.0%)'
    )
  })
})
