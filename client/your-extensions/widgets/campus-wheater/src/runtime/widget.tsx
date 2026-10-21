import { React, type AllWidgetProps } from 'jimu-core'

const { useState, useEffect } = React

// University of Manchester (Whitworth Hall)
const LAT = 53.4668
const LON = -2.2339
const REFRESH_MS = 15 * 60 * 1000
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
  '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=Europe%2FLondon'

interface Weather {
  temp: number
  feelsLike: number
  humidity: number
  wind: number
  code: number
  isDay: boolean
  high: number
  low: number
  updated: Date
}

// WMO weather interpretation codes → [day emoji, night emoji, description]
function describeCode (code: number): [string, string, string] {
  if (code === 0) return ['☀️', '🌙', 'Clear sky']
  if (code <= 2) return ['🌤️', '☁️', 'Partly cloudy']
  if (code === 3) return ['☁️', '☁️', 'Overcast']
  if (code <= 48) return ['🌫️', '🌫️', 'Fog']
  if (code <= 57) return ['🌦️', '🌧️', 'Drizzle']
  if (code <= 67) return ['🌧️', '🌧️', 'Rain']
  if (code <= 77) return ['🌨️', '🌨️', 'Snow']
  if (code <= 82) return ['🌦️', '🌧️', 'Rain showers']
  if (code <= 86) return ['🌨️', '🌨️', 'Snow showers']
  return ['⛈️', '⛈️', 'Thunderstorm']
}

export default function Widget (props: AllWidgetProps<any>) {
  const [weather, setWeather] = useState<Weather>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const load = () => {
      fetch(API_URL, { signal: controller.signal })
        .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json() })
        .then(({ current, daily }) => {
          setWeather({
            temp: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            wind: current.wind_speed_10m,
            code: current.weather_code,
            isDay: current.is_day === 1,
            high: daily.temperature_2m_max[0],
            low: daily.temperature_2m_min[0],
            updated: new Date()
          })
          setError(false)
        })
        .catch(err => { if (err.name !== 'AbortError') setError(true) })
    }
    load()
    const interval = setInterval(load, REFRESH_MS)
    return () => { controller.abort(); clearInterval(interval) }
  }, [])

  const [dayIcon, nightIcon, label] = weather ? describeCode(weather.code) : ['', '', '']

  return (
    <div className='p-3 bg-white' style={{ borderRadius: '8px', border: '1px solid #ccc' }}>
      <h5 className='mb-1'>☁️ Local Weather</h5>
      <p className='text-muted small mb-2'>Current conditions near UoM</p>

      {!weather && !error && <div className='small text-muted'>⏳ Loading…</div>}
      {error && !weather && <div className='small text-danger'>Weather is unavailable right now.</div>}

      {weather && (
        <div>
          <div className='d-flex align-items-center' style={{ gap: 12 }}>
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }} aria-hidden='true'>{weather.isDay ? dayIcon : nightIcon}</span>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>{Math.round(weather.temp)}°C</div>
              <div className='small'>{label}</div>
            </div>
          </div>
          <div className='d-flex justify-content-between small text-muted mt-2'>
            <span>Feels {Math.round(weather.feelsLike)}°</span>
            <span>↑{Math.round(weather.high)}° ↓{Math.round(weather.low)}°</span>
            <span>💧{weather.humidity}%</span>
            <span>💨{Math.round(weather.wind)} km/h</span>
          </div>
          <div className='text-muted mt-2' style={{ fontSize: 10 }}>
            Updated {weather.updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Open-Meteo
          </div>
        </div>
      )}
    </div>
  )
}
