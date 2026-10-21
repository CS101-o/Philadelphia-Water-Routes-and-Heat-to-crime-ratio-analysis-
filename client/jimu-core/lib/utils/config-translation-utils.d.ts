import type { AppConfig, TranslationJson } from '../types/app-config';
import { type Expression, type IMExpression } from '../types/expression';
export declare const getTranslationFilePath: (isDraft: boolean) => string;
export declare const getTranslationFileName: (locale: string) => string;
export declare const getTranslationFullFileName: (locale: string, isDraft: boolean) => string;
export declare const isTranslationFile: (fileName: string, isDraft: boolean) => boolean;
export declare const getLocaleFromTranslationFile: (fileName: string, isDraft: boolean) => string;
export declare const mergeTranslation: (appConfig: AppConfig, translation: TranslationJson) => void;
/**
 * Configuration result for expression translation.
 */
export interface ExpressionTranslationConfig {
    /**
     * Whether the expression needs translation.
     */
    shouldTranslate: boolean;
    /**
     * Type of translation value.
     * - 'text': Simple text translation (e.g., for Arcade expression name)
     * - 'expression': Full expression object translation (e.g., for Static, Statistics, Expression types)
     */
    valueType: 'text' | 'expression';
    /**
     * Optional key path suffix for nested translation.
     * For Arcade expressions, this is 'name' to only translate the name field.
     */
    keyPath?: string;
}
/**
 * Determines the appropriate translation configuration for an expression based on its type.
 *
 * Translation rules by expression type:
 * - **Attribute**: No translation required - represents a direct field reference
 * - **Static**: Full expression translation - represents a static string value
 * - **Statistics**: Full expression translation - represents an aggregation function
 * - **Expression**: Full expression translation - represents a complex calculated expression
 * - **Arcade**: Name-only translation - only the expression name should be translated, not the script content
 *
 * @param expression - The expression object to analyze
 * @param arcadeKeyPath - Optional custom key path for Arcade expressions. Defaults to 'name'
 * @returns Configuration object with translation settings
 *
 * @example
 * ```typescript
 * const config = getExpressionTranslationConfig(myExpression)
 * if (config.shouldTranslate) {
 *   const key = config.keyPath
 *     ? `widgets.${widgetId}.config.myExpression.${config.keyPath}`
 *     : `widgets.${widgetId}.config.myExpression`
 *   // Add translation key with config.valueType
 * }
 *
 * // Custom key path for Arcade
 * const customConfig = getExpressionTranslationConfig(myArcadeExpression, 'customField')
 * ```
 */
export declare function getExpressionTranslationConfig(expression: Expression | IMExpression, arcadeKeyPath?: string): ExpressionTranslationConfig;
