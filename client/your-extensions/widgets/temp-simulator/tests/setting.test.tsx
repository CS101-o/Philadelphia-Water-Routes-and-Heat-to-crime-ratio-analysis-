import { React, Immutable } from 'jimu-core'
import { wrapWidgetSetting, widgetRender } from 'jimu-for-test'
import _Setting from '../src/setting/setting'

jest.mock('jimu-ui/advanced/data-source-selector', () => ({ DataSourceSelector: () => <div>ds-selector</div> }))

;(window as any).locale = 'en'
const render = widgetRender()

describe('temp-simulator setting', () => {
  it('renders without saved config (existing app instance)', () => {
    const Setting = wrapWidgetSetting(_Setting, { id: 'widget_11', config: undefined, onSettingChange: jest.fn() } as any)
    const { getByText } = render(<Setting />)
    expect(getByText('Reset tiers to defaults')).toBeTruthy()
  })

  it('renders with saved config', () => {
    const Setting = wrapWidgetSetting(_Setting, { id: 'widget_11', config: Immutable({ crimeField: 'x' }), onSettingChange: jest.fn() } as any)
    const { getByText } = render(<Setting />)
    expect(getByText('Critical')).toBeTruthy()
  })
})
