import { React } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { TextInput, TextArea } from 'jimu-ui'
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import type { IMConfig } from '../config'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const update = (key: 'title' | 'body', value: string) => {
    props.onSettingChange({ id: props.id, config: props.config.set(key, value) })
  }

  return (
    <div className='widget-setting-info-card jimu-widget-setting'>
      <SettingSection title='Content'>
        <SettingRow label='Title' flow='wrap'>
          <TextInput className='w-100' size='sm' defaultValue={props.config?.title} onAcceptValue={(v) => { update('title', v) }} />
        </SettingRow>
        <SettingRow label='Text' flow='wrap'>
          <TextArea className='w-100' defaultValue={props.config?.body} onAcceptValue={(v) => { update('body', v) }} />
        </SettingRow>
      </SettingSection>
    </div>
  )
}

export default Setting
