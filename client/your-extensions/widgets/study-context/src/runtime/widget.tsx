import { React, type AllWidgetProps } from 'jimu-core'

const { useState } = React

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

      <ul className='nav nav-tabs mb-3' role='tablist'>
        {TABS.map(tab => (
          <li className='nav-item' key={tab.id} role='presentation'>
            <button
              type='button'
              role='tab'
              id={`${props.id}-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`${props.id}-panel`}
              className={`nav-link ${activeTab === tab.id ? 'active fw-bold' : ''}`}
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
            <p className='small text-danger fw-bold'>
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
