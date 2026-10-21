import { React, type AllWidgetProps } from 'jimu-core'
import type { IMConfig } from '../config'

const Widget = (props: AllWidgetProps<IMConfig>) => {
  return (
    <div className='jimu-widget p-3' style={{ height: '100%', overflow: 'auto', background: 'var(--sys-color-surface-paper, #fff)' }}>
      <h5 className='mb-2'>{props.config?.title}</h5>
      <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>{props.config?.body}</p>
    </div>
  )
}

export default Widget
