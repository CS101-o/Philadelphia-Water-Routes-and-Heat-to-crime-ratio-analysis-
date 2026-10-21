import { React, type AllWidgetProps } from 'jimu-core'

const { useState, useEffect } = React

const TIME_ZONE = 'Europe/London'

const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' })
const zoneFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'short' })

export default function Widget (props: AllWidgetProps<any>) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => { setNow(new Date()) }, 1000)
    return () => { clearInterval(interval) } // Cleanup to prevent memory leaks
  }, [])

  // Always show Manchester time, even when the viewer is in another time zone
  const zone = zoneFmt.formatToParts(now).find(p => p.type === 'timeZoneName')?.value

  return (
    <div className='p-3 bg-dark text-white text-center' style={{ borderRadius: '8px', border: '1px solid #555' }}>
      <h6 className='text-uppercase text-muted'>Manchester Time {zone && <span className='badge bg-secondary ms-1'>{zone}</span>}</h6>
      <h2 className='text-info m-0' style={{ fontVariantNumeric: 'tabular-nums' }}>{timeFmt.format(now)}</h2>
      <div className='small text-muted mt-1'>{dateFmt.format(now)}</div>
    </div>
  )
}
