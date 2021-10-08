import { JSONSchema6, JSONSchema7 } from "json-schema";
import { KeysWithValueType, KnownKeys } from "./typeUtils";
import { JSONSchema201909 } from "./JSONSchema201909";

/**
 * Type representing a JSON Schema Draft 2019-09 (with backwards-compatibility down to Draft 6).
 */
export type RawJsonSchema = JSONSchema6 | JSONSchema7 | JSONSchema201909;

/**
 * All allowed keys for the supported JSON Schema versions.
 */
export type KeysOfRawJsonSchema = KnownKeys<JSONSchema6 & JSONSchema7 & JSONSchema201909>;

/**
 * Type look-up for a particular key in any of the supported JSON Schema versions.
 */
export type TypeInRawJsonSchema<K> =
    | (K extends KnownKeys<JSONSchema6> ? JSONSchema6[K] : never)
    | (K extends KnownKeys<JSONSchema7> ? JSONSchema7[K] : never)
    | (K extends KnownKeys<JSONSchema201909> ? JSONSchema201909[K] : never);

/**
 * Type-safe value look-up for a particular key in a given JSON Schema.
 *
 * @param {RawJsonSchema} rawSchema - JSON Schema from which to extract a value
 * @param {string} key - name of object property too look-up
 * @returns {*} value in schema
 */
export function getValueFromRawJsonSchema<K extends KeysOfRawJsonSchema>(rawSchema: RawJsonSchema, key: K): TypeInRawJsonSchema<K> {
    return (rawSchema as JSONSchema6 & JSONSchema7 & JSONSchema201909)[key] as unknown as TypeInRawJsonSchema<K>;
}

/**
 * All allowed string keys supporting string values (but may also support other value types).
 */
export type KeysOfRawJsonSchemaWithValuesOf<T> = Extract<
    KeysWithValueType<JSONSchema6, T> | KeysWithValueType<JSONSchema7, T> | KeysWithValueType<JSONSchema201909, T>,
    string
>;

/**
 * All allowed string keys supporting string values (but may also support other value types).
 */
export type KeysOfRawJsonSchemaStringValues = KeysOfRawJsonSchemaWithValuesOf<string>;
