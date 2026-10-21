import { mercatorToMiles, formatDistance, formatArea, sqlString, rankWatersheds, shortWatershedName } from '../analysis'

describe('water-analysis helpers', () => {
  it('corrects Web Mercator lengths at Philadelphia latitude', () => {
    // 1 mile on the ground is ~1.306 Web Mercator miles at 40°N
    expect(mercatorToMiles(1609.344 / Math.cos((40 * Math.PI) / 180), 40)).toBeCloseTo(1, 6)
  })

  it('formats distances in feet, then miles', () => {
    expect(formatDistance(100)).toBe('330 ft')
    expect(formatDistance(1609.344 * 2.5)).toBe('2.5 mi')
  })

  it('formats areas in acres, then square miles', () => {
    expect(formatArea(4046.856 * 12)).toBe('12 acres')
    expect(formatArea(2589988 * 2)).toBe('2.00 sq mi')
  })

  it('escapes quotes for SQL', () => {
    expect(sqlString("Wingohocking's Run")).toBe("'Wingohocking''s Run'")
  })

  it('ranks watersheds by combined sewer outfalls per creek mile', () => {
    const ranked = rankWatersheds([
      { name: 'A', sqMiles: 10, creekMiles: 20, outfalls: 50, cso: 2, samplingSites: 1 },
      { name: 'B', sqMiles: 5, creekMiles: 10, outfalls: 40, cso: 30, samplingSites: 0 },
      { name: 'C', sqMiles: 4, creekMiles: 0, outfalls: 3, cso: 3, samplingSites: 0 }
    ])
    expect(ranked.map(r => r.name)).toEqual(['B', 'A', 'C'])
    expect(ranked[0].csoPerCreekMile).toBe(3)
    expect(ranked[0].drainageDensity).toBe(2)
    expect(ranked[2].csoPerCreekMile).toBe(0)
  })

  it('shortens watershed names', () => {
    expect(shortWatershedName('Cobbs Creek Watershed')).toBe('Cobbs Creek')
  })
})
