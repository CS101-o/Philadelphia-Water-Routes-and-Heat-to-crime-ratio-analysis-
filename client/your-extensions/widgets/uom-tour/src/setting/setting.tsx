import { React } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components';

export default function Setting(props: AllWidgetSettingProps<any>) {

  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    });
  };

  return (
    <div className="widget-setting-demo jimu-widget-setting">

      <SettingSection title="Content" aria-label="Content section">

        <SettingRow>
          <div className="w-100">
            <div className="text-truncate mb-2" title="Select a Map">
              Select Map to Control:
            </div>

            <MapWidgetSelector
              useMapWidgetIds={props.useMapWidgetIds}
              onSelect={onMapSelected}
            />
          </div>
        </SettingRow>

      </SettingSection>

    </div>
  );
}