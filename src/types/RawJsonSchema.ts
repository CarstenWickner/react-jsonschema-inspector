/**
 * PropType for describing fields expected as per JSON Schema Draft 7 (with backwards-compatibility down to Draft 4).
 * Some dynamic fields/validations are not supported as they only make sense against an actual data instance and not when looking at the schema alone.
 */
export interface RawJsonSchema {
    /* ignored but accepted value */
    "$schema"?: string,
    // as of JSON Schema Draft 6, instead of "id"
    "$id"?: string,
    // in JSON Schema Draft 4, replaced by "$id" from Draft 6
    id?: string,
    "$ref"?: string,
    // some generic keywords allow for documentation (not validation)
    title?: string,
    description?: string,
    examples?: Array<any>,
    default?: any,
    type?: string | Array<string>,

    // "enum" of allowed values
    enum?: Array<any>,
    // "const" is just an alternative to an "enum" with a single entry
    const?: any,
    // the following options are only applicable if the "type" includes the value "string"
    minLength?: number,
    maxLength?: number,
    pattern?: string,
    format?: string,
    // the following options are only applicable if the "type" includes the value "number"
    multipleOf?: number,
    minimum?: number,
    // as of JSON Schema Draft 6: number; before (Draft 4): boolean
    exclusiveMinimum?: number | boolean,
    maximum?: number,
    // as of JSON Schema Draft 6: number; before (Draft 4): boolean
    exclusiveMaximum?: number | boolean,

    // the following options are only applicable if the "type" includes the value "object"
    required?: Array<string>,
    properties?: { [key: string]: boolean | RawJsonSchema },
    /* ignored but accepted values */
    propertyNames?: any,
    minProperties?: number,
    maxProperties?: number,
    // these two fields describe placeholders for dynamic fields which may only be mentioned in the "Details"
    additionalProperties?: boolean | { [key: string]: boolean | RawJsonSchema },
    patternProperties?: { [key: string]: boolean | RawJsonSchema },

    // the following options are only applicable if the "type" includes the value "array"
    minItems?: number,
    maxItems?: number,
    uniqueItems?: boolean,
    // supported: only one kind of schema as type of "items"
    // not supported: an array of schemas which then each refer to the values at the respective positions
    items?: boolean | RawJsonSchema | Array<RawJsonSchema>,
    // "additionalItems" are ignored if "items" is a boolean or single RawJsonSchema (i.e. not an array)
    additionalItems?: boolean | RawJsonSchema,
    /* ignored but accepted value */
    // validation of at least one item in an array being of a certain type
    contains?: RawJsonSchema,

    // cater for re-usable sub-schemas that can be referenced via { "$ref": "..." }
    definitions?: { [key: string]: RawJsonSchema },
    // cater for recursive combined schemas
    allOf?: Array<RawJsonSchema>,
    // cater for conditional recursive combined schemas
    anyOf?: Array<boolean | RawJsonSchema>,
    oneOf?: Array<boolean | RawJsonSchema>,

    /* ignored but accepted values */
    not?: RawJsonSchema,
    // some things may only apply if a particular property is present
    dependencies?: { [key: string]: RawJsonSchema | Array<string> };
    // cater for conditional portions of the containing schema (e.g. additional properties)
    if?: RawJsonSchema,
    then?: RawJsonSchema,
    else?: RawJsonSchema,
};
