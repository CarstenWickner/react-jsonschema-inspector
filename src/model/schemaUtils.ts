import { JsonSchema, RefScope } from "./JsonSchema";
import { JsonSchemaGroup } from "./JsonSchemaGroup";
import { JsonSchemaAllOfGroup } from "./JsonSchemaAllOfGroup";
import { JsonSchemaAnyOfGroup, JsonSchemaOneOfGroup } from "./JsonSchemaOptionalsGroup";
import { isNonEmptyObject, listValues, mapObjectValues } from "./utils";

import { RawJsonSchema } from "../types/RawJsonSchema";
import { ParserConfig, RenderOptions } from "../types/Inspector";

/**
 * Determines optional paths in this schema group.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group for which optional paths should be determined
 * @returns {RenderOptions} representation of the given group's top level options
 */
export function getOptionsInSchemaGroup(schemaGroup: JsonSchemaGroup): RenderOptions {
    let containedOptions: Array<RenderOptions>;
    if (schemaGroup.shouldTreatEntriesAsOne()) {
        containedOptions = schemaGroup.entries
            // simple schemas can be safely ignored here
            .filter((entry) => entry instanceof JsonSchemaGroup)
            // for all groups: look-up their nested options recursively
            .map((entry) => getOptionsInSchemaGroup(entry as JsonSchemaGroup))
            // if a nested group has no options to differentiate (i.e. also has shouldTreatEntriesAsOne() === true), we can ignore it as well
            .filter(({ options }) => options);
    } else {
        const considerSchemasAsOptions = schemaGroup.considerSchemasAsSeparateOptions();
        // each entry is considered an option (i.e. nothing is filtered out), groups may have some more nested options
        containedOptions = schemaGroup.entries
            .filter((entry) => considerSchemasAsOptions || entry instanceof JsonSchemaGroup)
            // for all groups: look-up their nested options recursively
            .map((entry) => (entry instanceof JsonSchemaGroup ? getOptionsInSchemaGroup(entry as JsonSchemaGroup) : {}));
    }
    return schemaGroup.createOptionsRepresentation(containedOptions);
}

/**
 * Determine all possible `optionIndexes` for accessing a single option in the given input.
 *
 * @param {object} param0 - representation of the hierarchical structure of options in a schema group
 * @param {Array.<object>} param0.options - nested options (that may have further nested options of their own)
 * @returns {Array.<Array.<number>>} all possible `optionIndexes` for the given input
 */
export function getIndexPermutationsForOptions({ options }: RenderOptions): Array<Array<number>> {
    const recursivelyCollectOptionIndexes = (entry: RenderOptions, index: number): Array<Array<number>> =>
        isNonEmptyObject(entry) ? getIndexPermutationsForOptions(entry).map((nestedOptions) => [index, ...nestedOptions]) : [[index]];
    const reduceOptionIndexes = (result: Array<Array<number>>, nextOptions: Array<Array<number>>): Array<Array<number>> => result.concat(nextOptions);
    return options.map(recursivelyCollectOptionIndexes).reduce(reduceOptionIndexes, []);
}

/**
 * Convert an array of indexes into an array of mutable objects (initialised with the respective index) as expected by JsonSchemaGroup methods.
 *
 * @param {?Array.<number>|Array.<{index: number}>} optionIndexes - non-negative indexes of selected option(s); or already result array
 * @returns {?Array.<{index: number}>} array of mutable objects containing the given index values
 */
export function createOptionTargetArrayFromIndexes(optionIndexes: Array<number> | Array<{ index: number }> = []): Array<{ index: number }> {
    if (Array.isArray(optionIndexes) && optionIndexes.length && typeof optionIndexes[0] === "number") {
        return (optionIndexes as Array<number>).map((index: number) => ({ index }));
    }
    return optionIndexes as Array<{ index: number }>;
}

/**
 * Helper function to create a group class for the respective raw grouping in this schema.
 *
 * @param {Function} GroupClass - constructor reference to the group to create
 * @param {?object} GroupClass.param0 - `parserConfig` object being forwarded to group (not necessarily expected by all groups)
 * @param {JsonSchema} param1 - context JsonSchema in which to create the schema group (providing the applicable `parserConfig` and `scope`)
 * @param {Array.<JsonSchema>} rawSchemaArray - grouped raw schema definitions to represent
 * @returns {JsonSchemaGroup} created group
 */
function createGroupFromRawSchemaArray(
    GroupClass: new (parserConfig: ParserConfig) => JsonSchemaGroup,
    { parserConfig, scope }: JsonSchema,
    rawSchemaArray: Array<boolean | RawJsonSchema>
): JsonSchemaGroup {
    // create group representation
    const group = new GroupClass(parserConfig);
    rawSchemaArray
        .filter((rawSchemaPart) => typeof rawSchemaPart !== "boolean")
        // convert each part in the group to a JsonSchema instance and (recursively) get its group information
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        .map((rawSchemaPart) => createGroupFromSchema(new JsonSchema(rawSchemaPart as RawJsonSchema, parserConfig, scope)))
        // add group info from each schema part to the created group representation
        .forEach(group.with.bind(group));
    return group;
}

/**
 * Look-up of any nested sub-schemas that may contain information about "properties" in the given JSON schema definition.
 * If the given JSON schema definition refers is an array, it is assumed to not have relevant information.
 * Instead, the referenced schemas of its "Items" will be returned.
 *
 * This method is intended to be used to look-up fields like "properties" or "required" which are not associated with arrays.
 *
 * BEWARE: if a schema consists of multiple sub-schemas and only one of them defines an "items" field, the other sibling schemas
 * will still be included in the result list - they are just assumed to not have any relevant fields we are looking for.
 *
 * @param {JsonSchema} schema - single JsonSchema for which to create the equivalent JsonSchemaGroup
 * @returns {JsonSchemaAllOfGroup} group of sub-schemas that may define properties about their children
 */
export function createGroupFromSchema(schema: JsonSchema): JsonSchemaAllOfGroup {
    const { schema: rawSchema, scope } = schema;
    if (!isNonEmptyObject(rawSchema)) {
        return new JsonSchemaAllOfGroup();
    }
    if (rawSchema.$ref) {
        const referencedSchema = scope.find(rawSchema.$ref);
        // this schema is just a reference to another separately defined schema
        return createGroupFromSchema(referencedSchema);
    }
    const result = new JsonSchemaAllOfGroup().with(schema);
    if (rawSchema.allOf) {
        result.with(createGroupFromRawSchemaArray(JsonSchemaAllOfGroup, schema, rawSchema.allOf));
    }
    if (rawSchema.anyOf) {
        result.with(createGroupFromRawSchemaArray(JsonSchemaAnyOfGroup, schema, rawSchema.anyOf));
    }
    if (rawSchema.oneOf) {
        result.with(createGroupFromRawSchemaArray(JsonSchemaOneOfGroup, schema, rawSchema.oneOf));
    }
    return result;
}

/**
 * Look-up of the value associated with a specific kind of field in the given JsonSchema.
 * If the targeted schema represents an array, the sub-schemas of its "items" will be ignored.
 *
 * @param {JsonSchema} schema - single schema to extract a certain field's value from
 * @param {string} fieldName - name/key of the field to look-up
 * @param {?Function} mappingFunction - converting the raw value
 * @param {?*} mappingFunction.param0 - raw value retrieved from raw Json Schema
 * @param {?object} mappingFunction.param1 - parserConfig from given 'schema'
 * @param {?RefScope} mappingFunction.param2 - scope from given 'schema'
 * @returns {*} return looked-up field value (possibly changed by 'mappingFunction'
 */
function getFieldValueFromSchema<K extends string & keyof RawJsonSchema, S extends RawJsonSchema[K], T>(
    schema: JsonSchema,
    fieldName: K,
    mappingFunction?: (value: S, parserConfig: ParserConfig, scope: RefScope) => T
): T {
    const { schema: rawSchema } = schema;
    const rawValue: S = rawSchema[fieldName];
    if (mappingFunction) {
        const { parserConfig, scope } = schema;
        return mappingFunction(rawValue, parserConfig, scope);
    }
    return rawValue;
}

/**
 * Extract value(s) from a certain field from all schema parts of the given schema group.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group to extract a certain field's value(s) from
 * @param {string} fieldName - name/key of the field to look-up
 * @param {?Function} mergeValues - function to be used in `Array.reduce()` to combine extracted values from multiple JsonSchemas
 * @param {*} mergeValues.param0 - combined values
 * @param {*} mergeValues.param1 - single value to add to the already combined values
 * @param {*} mergeValues.return - combined values including additional single value
 * @param {*} defaultValue - initial value of mergeValues.param0 on first execution
 * @param {?Function} mappingFunction - function to mutate single looked-up value
 * @param {?*} mappingFunction.param0 - raw value retrieved from raw Json Schema
 * @param {?object} mappingFunction.param1 - parserConfig from given 'schema'
 * @param {?RefScope} mappingFunction.param2 - scope from given 'schema'
 * @param {?Array.<{index: number}>|Array.<number>} optionIndexes - indexes representing the selection path to a particular option
 * @returns {*} merged result of all encountered values in schema parts in the given group
 */
export function getFieldValueFromSchemaGroup<K extends keyof RawJsonSchema, S extends RawJsonSchema[K], T extends S | Array<S>>(
    schemaGroup: JsonSchemaGroup,
    fieldName: K,
    mergeValues: (combined: T, nextValue: T) => T = listValues,
    defaultValue?: T,
    mappingFunction?: (value: RawJsonSchema[K], parserConfig: ParserConfig, scope: RefScope) => T,
    optionIndexes?: Array<number> | Array<{ index: number }>
): T {
    return schemaGroup.extractValues(
        (schema) => getFieldValueFromSchema(schema, fieldName, mappingFunction),
        mergeValues,
        defaultValue,
        createOptionTargetArrayFromIndexes(optionIndexes)
    );
}

/**
 * If the given raw schema is a non-empty object, wrap it into a JsonSchema – otherwise return 'undefined'.
 *
 * @param {?object} rawSchema - the JSON Schema to represent
 * @param {?object} parserConfig - configuration affecting how the JSON schema is being traversed/parsed
 * @param {?RefScope} scope - collection of available $ref targets
 * @returns {?JsonSchema} successfully created JsonSchema or 'undefined'
 */
function createJsonSchemaIfNotEmpty(rawSchema: RawJsonSchema, parserConfig: ParserConfig, scope: RefScope): JsonSchema | undefined {
    return isNonEmptyObject(rawSchema) ? new JsonSchema(rawSchema, parserConfig, scope) : undefined;
}

/**
 * Convenience function for calling `getFieldValueFromSchemaGroup()` when expecting the field's value to be a schema (part) of its own.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group to extract a certain field's value(s) from
 * @param {string} fieldName - name/key of the field to look-up
 * @param {?Array.<{index: number}>|Array.<number>} optionTarget - array of mutable objects containing index values to selected option(s)
 * @returns {JsonSchema|Array.<JsonSchema>|undefined} all encountered values in schema parts in the given group, each as a JsonSchema
 */
function getSchemaFieldValueFromSchemaGroup(
    schemaGroup: JsonSchemaGroup,
    fieldName: keyof RawJsonSchema,
    optionTarget?: Array<number> | Array<{ index: number }>
): JsonSchema | Array<JsonSchema> {
    return getFieldValueFromSchemaGroup(
        schemaGroup,
        fieldName,
        /* merge function */ listValues,
        /* default value */ undefined,
        /* mapping function */ createJsonSchemaIfNotEmpty,
        optionTarget
    );
}

/**
 * Determine the type of entries within the indicated schema group representing an array, otherwise returning undefined.
 *
 * @param {JsonSchemaGroup} schemaGroup - targeted schema group which may represent an array
 * @param {?Array.<number>} optionIndexes - in case of a group with optional branches, indexes indicating selected path
 * @returns {?JsonSchema} type of items in given schema group, if it represents an array
 */
export function getTypeOfArrayItemsFromSchemaGroup(schemaGroup: JsonSchemaGroup, optionIndexes?: Array<number>): JsonSchema {
    const optionTarget = createOptionTargetArrayFromIndexes(optionIndexes);
    const optionTargetCopy: Array<{ index: number }> = JSON.parse(JSON.stringify(optionTarget));
    let arrayItemSchema: JsonSchema | Array<JsonSchema> = getSchemaFieldValueFromSchemaGroup(schemaGroup, "items", optionTarget);
    if (!Array.isArray(arrayItemSchema) && !(arrayItemSchema instanceof JsonSchema)) {
        const resetOptionIndex = (originalOption: { index: number }, arrayIndex: number): void => {
            // eslint-disable-next-line no-param-reassign
            optionTarget[arrayIndex].index = originalOption.index;
        };
        // reset indexes in optionTarget if nothing was found
        optionTargetCopy.forEach(resetOptionIndex);
        arrayItemSchema = getSchemaFieldValueFromSchemaGroup(schemaGroup, "additionalItems", optionTarget);
        if (!Array.isArray(arrayItemSchema) && !(arrayItemSchema instanceof JsonSchema)) {
            // and again: reset indexes in optionTarget
            optionTargetCopy.forEach(resetOptionIndex);
            return undefined;
        }
    }
    // due to the 'listValues' mergeFunction, the array item schemas may be in an array
    // for simplicity's sake: treating this as unclean schema declaration – we just consider the first
    return Array.isArray(arrayItemSchema) ? arrayItemSchema[0] : (arrayItemSchema as JsonSchema);
}

/**
 * Collect all mentioned properties with their associated schema definitions (if available) from a given JsonSchema.
 *
 * @param {JsonSchema} schema - targeted schema to collect properties from (ignoring any nested `allOf`/`anyOf`/`oneOf`)
 * @returns {object.<string, JsonSchema|boolean|object>} collected properties, still including 'true' or ' {}' where no more details are available
 */
function getPropertiesFromSchema(schema: JsonSchema): { [key: string]: JsonSchema | boolean | {} } {
    const { schema: rawSchema, parserConfig, scope } = schema;
    const { required = [], properties = {} } = rawSchema;
    const rawProperties = Object.assign({}, ...required.map((value) => ({ [value]: true })), properties);
    // properties is an Object.<String, raw-json-schema> and should be converted to an Object.<String, JsonSchema>
    return mapObjectValues(rawProperties, (rawPropertySchema: RawJsonSchema | boolean | {}): JsonSchema | boolean | {} =>
        isNonEmptyObject(rawPropertySchema)
            ? new JsonSchema(rawPropertySchema as RawJsonSchema, parserConfig, scope)
            : (rawPropertySchema as boolean | {})
    );
}

/**
 * Generic function to be used in Array.reduce() - assuming objects are being merged.
 *
 * @param {?object} combined - temporary result of previous reduce steps
 * @param {?object} nextValue - single value to merge with "combined"
 * @returns {?object} merged values
 */
function mergeSchemas(
    combined: { [key: string]: JsonSchema | boolean | {} },
    nextValue: { [key: string]: JsonSchema | boolean | {} }
): { [key: string]: JsonSchema | boolean | {} } {
    let mergeResult;
    if (!isNonEmptyObject(combined)) {
        // at least initially, "combined" is an empty object
        mergeResult = nextValue;
    } else {
        // "nextValue" is always a non-empty object (otherwise it would have been filtered out during the conversion to a group)
        mergeResult = Object.assign(
            {},
            combined,
            ...Object.keys(nextValue)
                .filter((key) => !isNonEmptyObject(combined[key]) || isNonEmptyObject(nextValue[key]))
                .map((key) => ({ [key]: nextValue[key] }))
        );
    }
    return mergeResult;
}

/**
 * Extract the properties mentioned in this schema group.
 *
 * @param {JsonSchemaGroup} schemaGroup - schema group from which to retrieve properties
 * @param {?Array.<number>} optionIndexes - indexes of selected option(s)
 * @returns {object.<string, JsonSchema>} collection of all properties mentioned in this schema
 */
export function getPropertiesFromSchemaGroup(schemaGroup: JsonSchemaGroup, optionIndexes?: Array<number>): { [key: string]: JsonSchema } {
    const optionTarget = createOptionTargetArrayFromIndexes(optionIndexes);
    const extractedValues = schemaGroup.extractValues(getPropertiesFromSchema, mergeSchemas, {}, optionTarget);
    // convert any remaining non-schema values (e.g. booleans) into schema wrappers
    const result = mapObjectValues(extractedValues, (value) =>
        // no need to forward any parserConfig or scope to this (dummy/empty) schema
        value instanceof JsonSchema ? value : new JsonSchema(value as RawJsonSchema, {}, undefined)
    );
    return result;
}
