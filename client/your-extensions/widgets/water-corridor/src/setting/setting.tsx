import { React, Immutable } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { NumericInput } from 'jimu-ui'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { DEFAULT_BUFFER_FT, type IMConfig } from '../config'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({ id: props.id, useMapWidgetIds })
  }

  const onBufferChange = (value: number | string) => {
    const ft = Math.min(1000, Math.max(50, Number(value) || DEFAULT_BUFFER_FT))
    props.onSettingChange({ id: props.id, config: (props.config ?? Immutable({}) as IMConfig).set('defaultBufferFt', ft) })
  }

  return (
    <div className='widget-setting-water-corridor jimu-widget-setting'>
      <SettingSection title='Map'>
        <SettingRow label='Map to analyse' flow='wrap'>
          <MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={onMapSelected} />
        </SettingRow>
        <SettingRow flow='wrap'>
          <span className='small' style={{ opacity: 0.7 }}>If none is picked, the first map on the page is used.</span>
        </SettingRow>
      </SettingSection>
      <SettingSection title='Creek corridor'>
        <SettingRow label='Default width (ft each side)'>
          <NumericInput size='sm' style={{ width: 90 }} min={50} max={1000} step={50} value={props.config?.defaultBufferFt ?? DEFAULT_BUFFER_FT} onAcceptValue={onBufferChange} />
        </SettingRow>
      </SettingSection>
    </div>
  )
}

export default Setting
