import { React } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'

const Setting = (props: AllWidgetSettingProps<unknown>) => {
  return (
    <div className='jimu-widget-setting'>
      <SettingSection title='Map'>
        <SettingRow label='Map to analyse' flow='wrap'>
          <MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={(useMapWidgetIds) => { props.onSettingChange({ id: props.id, useMapWidgetIds }) }} />
        </SettingRow>
        <SettingRow flow='wrap'>
          <span className='small' style={{ opacity: 0.7 }}>If none is picked, the first map on the page is used.</span>
        </SettingRow>
      </SettingSection>
    </div>
  )
}

export default Setting
