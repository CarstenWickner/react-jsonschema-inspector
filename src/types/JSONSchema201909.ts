import { JSONSchema7TypeName, JSONSchema7Type } from "json-schema";

/*
 * Temporary type definition for Draft 2019-09 until a proper one can be imported from `@types/json-schema`.
 */
export type JSONSchema201909Definition = JSONSchema201909 | boolean;
export interface JSONSchema201909 {
    $id?: string;
    $anchor?: string;
    $ref?: string;
    $schema?: string;
    $vocabulary?: {
        [key: string]: boolean;
    };
    $comment?: string;

    $recursiveRef?: string;
    $recursiveAnchor?: string;

    type?: JSONSchema7TypeName | JSONSchema7TypeName[];
    enum?: JSONSchema7Type[];
    const?: JSONSchema7Type;

    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;

    maxLength?: number;
    minLength?: number;
    pattern?: string;

    items?: JSONSchema201909Definition | JSONSchema201909Definition[];
    additionalItems?: JSONSchema201909Definition;
    unevaluatedItems?: JSONSchema201909Definition;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    contains?: JSONSchema201909;
    maxContains?: number;
    minContains?: number;

    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    properties?: {
        [key: string]: JSONSchema201909Definition;
    };
    patternProperties?: {
        [key: string]: JSONSchema201909Definition;
    };
    additionalProperties?: JSONSchema201909Definition;
    unevaluatedProperties?: JSONSchema201909Definition;
    // deprecated but still supported for backward compatibility
    dependencies?: {
        [key: string]: JSONSchema201909Definition | string[];
    };
    dependentSchemas?: {
        [key: string]: JSONSchema201909Definition;
    };
    dependentRequired?: {
        [key: string]: string[];
    };
    propertyNames?: JSONSchema201909Definition;

    if?: JSONSchema201909Definition;
    then?: JSONSchema201909Definition;
    else?: JSONSchema201909Definition;

    allOf?: JSONSchema201909Definition[];
    anyOf?: JSONSchema201909Definition[];
    oneOf?: JSONSchema201909Definition[];
    not?: JSONSchema201909Definition;

    format?: string;

    contentMediaType?: string;
    contentEncoding?: string;

    $defs?: {
        [key: string]: JSONSchema201909Definition;
    };
    // deprecated but still supported for backward compatibility
    definitions?: {
        [key: string]: JSONSchema201909Definition;
    };

    title?: string;
    description?: string;
    default?: JSONSchema7Type;
    readOnly?: boolean;
    writeOnly?: boolean;
    examples?: JSONSchema7Type;
}
