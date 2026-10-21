import { React, type AllWidgetProps } from 'jimu-core'

const { useState } = React

// Styled inline: this app's theme doesn't include Bootstrap's nav-tabs styles
const tabBar: React.CSSProperties = { display: 'flex', gap: 4, listStyle: 'none', padding: 0, margin: '0 0 12px', borderBottom: '1px solid #ccc' }
const tabStyle = (active: boolean): React.CSSProperties => ({
  border: 0,
  borderBottom: `3px solid ${active ? '#1f6fb2' : 'transparent'}`,
  background: 'transparent',
  color: active ? '#1f6fb2' : 'inherit',
  fontWeight: active ? 600 : 400,
  padding: '6px 10px',
  marginBottom: -1,
  cursor: 'pointer'
})

const TABS = [
  { id: 'study', label: 'The Study' },
  { id: 'data', label: 'The Data' },
  { id: 'try', label: 'Try It' }
]

export default function Widget (props: AllWidgetProps<any>) {
  const [activeTab, setActiveTab] = useState('study')

  return (
    <div className='p-3 bg-light' style={{ borderRadius: '8px', border: '1px solid #ccc', height: '100%', overflow: 'auto' }}>
      <h5 className='mb-3'>📚 Research Context</h5>

      <ul style={tabBar} role='tablist'>
        {TABS.map(tab => (
          <li key={tab.id} role='presentation'>
            <button
              type='button'
              role='tab'
              id={`${props.id}-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`${props.id}-panel`}
              style={tabStyle(activeTab === tab.id)}
              onClick={() => { setActiveTab(tab.id) }}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className='p-2' role='tabpanel' id={`${props.id}-panel`} aria-labelledby={`${props.id}-tab-${activeTab}`}>
        {activeTab === 'study' && (
          <div>
            <p className='small mb-2'>
              Research conducted by Leah Schinasi, PhD, and Ghassan Hamra, PhD (Dornsife School of Public Health) analyzed a decade of Philadelphia crime and weather data.
            </p>
            <p className='small' style={{ color: '#c62828', fontWeight: 600 }}>
              Key Finding: Violent crime incidents correlate heavily with temperature spikes, particularly during the warmer months.
            </p>
          </div>
        )}

        {activeTab === 'data' && (
          <div>
            <p className='small mb-2'>
              <strong>Source:</strong> County Health Rankings (Robert Wood Johnson Foundation).
            </p>
            <p className='small'>
              <strong>Definition:</strong> "Violent crimes" are offenses involving face-to-face confrontation, including homicide, rape, robbery, and aggravated assault per 100,000 population.
            </p>
          </div>
        )}

        {activeTab === 'try' && (
          <ol className='small ps-3 mb-0'>
            <li className='mb-1'>Open the <strong>Heat &amp; Crime Simulator</strong>.</li>
            <li className='mb-1'>Drag the slider or pick a preset — the map keeps only counties whose violent crime rate exceeds the threshold for that heat tier.</li>
            <li className='mb-1'>Press <strong>▶ Simulate a heatwave</strong> to watch the map narrow as temperatures climb.</li>
            <li>Compare the chart to see which counties remain at the highest risk.</li>
          </ol>
        )}
      </div>
    </div>
  )
}
