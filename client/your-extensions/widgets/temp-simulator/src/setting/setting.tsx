/** @jsx jsx */
import { React, jsx, Immutable, type UseDataSource, DataSourceTypes } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { NumericInput, TextInput, Button } from 'jimu-ui'
import { SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { DEFAULT_CONFIG, type IMConfig, type TempUnit } from '../config'

const SUPPORTED_TYPES = Immutable([DataSourceTypes.FeatureLayer])

type SettingProps = AllWidgetSettingProps<IMConfig>

const Setting = (props: SettingProps): React.ReactElement => {
  const { id, useDataSources, onSettingChange } = props
  const config = props.config?.tiers?.length ? props.config : Immutable(DEFAULT_CONFIG)

  const set = (key: keyof typeof DEFAULT_CONFIG, value: any) => {
    onSettingChange({ id, config: config.set(key, value) })
  }

  const setTier = (index: number, key: 'aboveF' | 'minCrimeRate' | 'uplift', value: number) => {
    onSettingChange({ id, config: config.setIn(['tiers', index, key], value) })
  }

  const handleUseDataSourceChange = (useDataSources: UseDataSource[]): void => {
    onSettingChange({ id, useDataSources })
  }

  return (
    <div className='widget-setting-temp-simulator jimu-widget-setting'>
      <SettingSection title='Data'>
        <SettingRow label='Crime layer' flow='wrap' level={1}>
          <DataSourceSelector
            isMultiple={false}
            types={SUPPORTED_TYPES}
            useDataSources={useDataSources}
            onChange={handleUseDataSourceChange}
            widgetId={id}
          />
        </SettingRow>
        <SettingRow label='Crime rate field' flow='wrap' level={2}>
          <TextInput
            size='sm'
            className='w-100'
            defaultValue={config.crimeField}
            onAcceptValue={(v) => { set('crimeField', v.trim() || DEFAULT_CONFIG.crimeField) }}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title='Display'>
        <SettingRow label='Default unit'>
          {(['F', 'C'] as TempUnit[]).map(u => (
            <Button key={u} size='sm' type={config.defaultUnit === u ? 'primary' : 'default'} onClick={() => { set('defaultUnit', u) }}>
              °{u}
            </Button>
          ))}
        </SettingRow>
        <SettingRow label='Slider range (°F)' flow='wrap'>
          <div className='d-flex w-100' style={{ gap: 8 }}>
            <NumericInput size='sm' value={config.minF} onAcceptValue={(v) => { set('minF', Number(v)) }} aria-label='Minimum °F' />
            <NumericInput size='sm' value={config.maxF} onAcceptValue={(v) => { set('maxF', Number(v)) }} aria-label='Maximum °F' />
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title='Risk tiers'>
        {config.tiers.map((tier, i) => (
          <SettingRow key={i} flow='wrap' label={<span><span style={{ color: tier.color }}>●</span> {tier.label}</span>}>
            <div className='d-flex w-100 small' style={{ gap: 6, alignItems: 'center' }}>
              {tier.aboveF === null
                ? <span className='flex-grow-1'>Below first threshold — no filter</span>
                : <React.Fragment>
                    <label className='mb-0'>&gt;°F</label>
                    <NumericInput size='sm' style={{ width: 60 }} value={tier.aboveF} onAcceptValue={(v) => { setTier(i, 'aboveF', Number(v)) }} />
                    <label className='mb-0'>rate &gt;</label>
                    <NumericInput size='sm' style={{ width: 70 }} value={tier.minCrimeRate} onAcceptValue={(v) => { setTier(i, 'minCrimeRate', Number(v)) }} />
                    <label className='mb-0'>+%</label>
                    <NumericInput size='sm' style={{ width: 50 }} value={tier.uplift} onAcceptValue={(v) => { setTier(i, 'uplift', Number(v)) }} />
                  </React.Fragment>}
            </div>
          </SettingRow>
        ))}
        <SettingRow>
          <Button size='sm' type='tertiary' onClick={() => { onSettingChange({ id, config: config.set('tiers', DEFAULT_CONFIG.tiers) }) }}>
            Reset tiers to defaults
          </Button>
        </SettingRow>
      </SettingSection>
    </div>
  )
}

export default Setting
