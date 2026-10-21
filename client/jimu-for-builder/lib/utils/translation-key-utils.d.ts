import { type IMAppConfig, type TranslationJson } from 'jimu-core';
export interface KeyValueMap {
    [key: string]: any;
}
export interface GroupedMap {
    [key: string]: KeyValueMap;
}
/**
 * Entry point: remap each group in groupedA from oldConfig to newConfig.
 * Only same-level array reorders are supported; cross-level remapping is not attempted.
 */
export declare function remapGroupedKeys(groupedA: GroupedMap, oldConfig: any, newConfig: any): GroupedMap;
/**
 * Update translationJsons in newAppConfig after key values changed from oldAppConfig to newAppConfig.
 * @param oldAppConfig
 * @param newAppConfig
 * @returns Updated newAppConfig with remapped translationJsons
 */
export declare const updateTranslationJsonsAfterKeyValuesChanged: (oldAppConfig: IMAppConfig, newAppConfig: IMAppConfig) => IMAppConfig;
/**
 * Load all config translationJsons for all config translations saved in the appConfig.
 * @param update Whether to update the appConfig in the store after loading translations. Default is false.
 */
export declare const loadAllConfigTranslations: (update?: boolean) => Promise<import("seamless-immutable").ImmutableObject<{
    [locale: string]: TranslationJson;
}>>;
