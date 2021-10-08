import { getFieldValueFromSchemaGroup } from "./model/schemaUtils";
import { minimumValue, maximumValue, commonValues, listValues } from "./model/utils";

import { JsonSchemaGroup } from "./model/JsonSchemaGroup";
import { KeysOfRawJsonSchema, KeysOfRawJsonSchemaWithValuesOf } from "./types/RawJsonSchema";

/**
 * Main Inspector component (with numerous props).
 */
export { Inspector } from "./component/Inspector";

/**
 * Extract single minimum numeric value from a certain field in the (selected) schema parts of the given schema group.
 * Schema parts missing the field or containing a `null` or `undefined` value are being ignored.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group to extract a certain field's value(s) from
 * @param {string} fieldName - name/key of the field to look-up
 * @param {?number} defaultValue - initial value for comparison with first encountered value
 * @param {?Array.<number>} optionIndexes - indexes representing the (optional) selection path in the schema group
 * @returns {?number} lowest encountered value in schema parts in the given group (may be the `defaultValue`)
 */
export const getMinimumFieldValueFromSchemaGroup = (
    schemaGroup: JsonSchemaGroup,
    fieldName: KeysOfRawJsonSchemaWithValuesOf<number>,
    defaultValue: number,
    optionIndexes?: Array<number>
): number => getFieldValueFromSchemaGroup(schemaGroup, fieldName, minimumValue, defaultValue, undefined, optionIndexes) as number;

/**
 * Extract single maximum numeric value from a certain field in the (selected) schema parts of the given schema group.
 * Schema parts missing the field or containing a `null` or `undefined` value are being ignored.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group to extract a certain field's value(s) from
 * @param {string} fieldName - name/key of the field to look-up
 * @param {?number} defaultValue - initial value for comparison with first encountered value
 * @param {?Array.<number>} optionIndexes - indexes representing the (optional) selection path in the schema group
 * @returns {?number} highest encountered value in schema parts in the given group (may be the `defaultValue`)
 */
export const getMaximumFieldValueFromSchemaGroup = (
    schemaGroup: JsonSchemaGroup,
    fieldName: KeysOfRawJsonSchemaWithValuesOf<number>,
    defaultValue: number,
    optionIndexes?: Array<number>
): number => getFieldValueFromSchemaGroup(schemaGroup, fieldName, maximumValue, defaultValue, undefined, optionIndexes) as number;

/**
 * Extract intersecting value (parts) from a certain field in the (selected) schema parts of the given schema group.
 * E.g. when targeting the "enum" field, appearing in two schema parts as `["foo", "bar", "foobar"]` and `["foo", "foobar", "qux"]`,
 * only `["foo", "foobar"]` would be returned.
 * Schema parts missing the field or containing a `null` or `undefined` value are being ignored.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group to extract a certain field's value(s) from
 * @param {string} fieldName - name/key of the field to look-up
 * @param {?*} defaultValue - initial value for comparison with first encountered value
 * @param {?Array.<number>} optionIndexes - indexes representing the (optional) selection path in the schema group
 * @returns {?*|Array.<*>} intersection of encountered values in schema parts in the given group (may be the `defaultValue`)
 */
export const getCommonFieldValuesFromSchemaGroup = <S, T extends S | Array<S>>(
    schemaGroup: JsonSchemaGroup,
    fieldName: KeysOfRawJsonSchema,
    defaultValue: S,
    optionIndexes?: Array<number>
): T =>
    // @ts-ignore
    getFieldValueFromSchemaGroup(schemaGroup, fieldName, commonValues, defaultValue, undefined, optionIndexes) as T;

/**
 * Extract all value (parts) from a certain field in the (selected) schema parts of the given schema group.
 * E.g. when targeting the "title" field, appearing in two schema parts as `"Customer"` and `"Private Individual"`,
 * a combined array `["Customer", "Private Individual"]` would be returned.
 * Schema parts missing the field or containing a `null` or `undefined` value are being ignored.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group to extract a certain field's value(s) from
 * @param {string} fieldName - name/key of the field to look-up
 * @param {?*} defaultValue - initial value for comparison with first encountered value
 * @param {?Array.<number>} optionIndexes - indexes representing the (optional) selection path in the schema group
 * @returns {?*|Array.<*>} all encountered values in schema parts in the given group (may be the `defaultValue`)
 */
export const getFieldValueArrayFromSchemaGroup = <S, T extends S | Array<S>>(
    schemaGroup: JsonSchemaGroup,
    fieldName: KeysOfRawJsonSchema,
    defaultValue: S,
    optionIndexes?: Array<number>
): T => getFieldValueFromSchemaGroup(schemaGroup, fieldName, listValues, defaultValue, undefined, optionIndexes) as T;
