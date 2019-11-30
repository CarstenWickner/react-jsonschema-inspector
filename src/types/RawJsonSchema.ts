import { JSONSchema4, JSONSchema6, JSONSchema7 } from "json-schema";
import { KeysWithValueType, KnownKeys } from "./typeUtils";

/**
 * Temporary type definition for Draft 2019-09 until a proper one can be imported like the others – just to satisfy TypeScript.
 */
export interface JSONSchema8 extends JSONSchema7 {
    $defs: { [key: string]: JSONSchema8 | boolean };
}

/**
 * Type representing a JSON Schema Draft 7 (with backwards-compatibility down to Draft 4).
 */
export type RawJsonSchema = JSONSchema4 | JSONSchema6 | JSONSchema7 | JSONSchema8;

/**
 * All allowed keys for the supported JSON Schema versions.
 */
export type KeysOfRawJsonSchema = KnownKeys<JSONSchema4 & JSONSchema6 & JSONSchema7 & JSONSchema8>;

/**
 * Type look-up for a particular key in any of the supported JSON Schema versions.
 */
export type TypeInRawJsonSchema<K> =
    | (K extends KnownKeys<JSONSchema4> ? JSONSchema4[K] : never)
    | (K extends KnownKeys<JSONSchema6> ? JSONSchema6[K] : never)
    | (K extends KnownKeys<JSONSchema7> ? JSONSchema7[K] : never)
    | (K extends KnownKeys<JSONSchema8> ? JSONSchema8[K] : never);

/**
 * Type-safe value look-up for a particular key in a given JSON Schema.
 *
 * @param {RawJsonSchema} rawSchema - JSON Schema from which to extract a value
 * @param {string} key - name of object property too look-up
 * @returns {*} value in schema
 */
export function getValueFromRawJsonSchema<K extends KeysOfRawJsonSchema>(rawSchema: RawJsonSchema, key: K): TypeInRawJsonSchema<K> {
    return ((rawSchema as JSONSchema4 & JSONSchema6 & JSONSchema7 & JSONSchema8)[key] as unknown) as TypeInRawJsonSchema<K>;
}

/**
 * All allowed string keys supporting string values (but may also support other value types).
 */
export type KeysOfRawJsonSchemaWithValuesOf<T> = Extract<
    KeysWithValueType<JSONSchema4, T> | KeysWithValueType<JSONSchema6, T> | KeysWithValueType<JSONSchema7, T> | KeysWithValueType<JSONSchema8, T>,
    string
>;

/**
 * All allowed string keys supporting string values (but may also support other value types).
 */
export type KeysOfRawJsonSchemaStringValues = KeysOfRawJsonSchemaWithValuesOf<string>;
