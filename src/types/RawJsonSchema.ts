import { JSONSchema4, JSONSchema6, JSONSchema7 } from "json-schema";
import { KeysWithValueType, KnownKeys } from "./typeUtils";

/**
 * Type representing a JSON Schema Draft 7 (with backwards-compatibility down to Draft 4).
 */
export type RawJsonSchema = JSONSchema4 | JSONSchema6 | JSONSchema7;

/**
 * All allowed keys for the supported JSON Schema versions.
 */
export type KeysOfRawJsonSchema = KnownKeys<JSONSchema4 & JSONSchema6 & JSONSchema7>;

/**
 * Type look-up for a particular key in any of the supported JSON Schema versions.
 */
export type TypeInRawJsonSchema<K> =
    | (K extends KnownKeys<JSONSchema4> ? JSONSchema4[K] : never)
    | (K extends KnownKeys<JSONSchema6> ? JSONSchema6[K] : never)
    | (K extends KnownKeys<JSONSchema7> ? JSONSchema7[K] : never);

/**
 * Type look-up for a particular key in any of the supported JSON Schema versions.
 *
 * @param {RawJsonSchema} rawSchema - t
 * @param {string} key - t
 * @returns {*} value in schema
 */
export function getValueFromRawJsonSchema<K extends KeysOfRawJsonSchema>(rawSchema: RawJsonSchema, key: K): TypeInRawJsonSchema<K> {
    return ((rawSchema as JSONSchema4 & JSONSchema6 & JSONSchema7)[key] as unknown) as TypeInRawJsonSchema<K>;
}

/**
 * All allowed string keys supporting string values (but may also support other value types).
 */
export type KeysOfRawJsonSchemaWithValuesOf<T> = Extract<
    KeysWithValueType<JSONSchema4, T> | KeysWithValueType<JSONSchema6, T> | KeysWithValueType<JSONSchema7, T>,
    string
>;

/**
 * All allowed string keys supporting string values (but may also support other value types).
 */
export type KeysOfRawJsonSchemaStringValues = KeysOfRawJsonSchemaWithValuesOf<string>;
