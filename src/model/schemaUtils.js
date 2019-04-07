import JsonSchema from "./JsonSchema";
import JsonSchemaGroup from "./JsonSchemaGroup";
import JsonSchemaAllOfGroup from "./JsonSchemaAllOfGroup";
import JsonSchemaAnyOfGroup from "./JsonSchemaAnyOfGroup";
import JsonSchemaOneOfGroup from "./JsonSchemaOneOfGroup";
import { isNonEmptyObject, listValues, mapObjectValues } from "./utils";

/**
 * Determines optional paths in this schema group.
 *
 * @returns {Object} return representation of the available options on this group's top level
 * @returns {?String} return.groupTitle optional title text to be displayed for this group's options
 * @returns {?Array<Object>} return.options list of option representations (may contain representation of nested options)
 */
export function getOptionsInSchemaGroup(schemaGroup) {
    let containedOptions;
    if (schemaGroup.shouldBeTreatedLikeAllOf()) {
        containedOptions = schemaGroup.entries
            // simple schemas can be safely ignored here
            .filter(entry => entry instanceof JsonSchemaGroup)
            // for all groups: look-up their nested options recursively
            .map(getOptionsInSchemaGroup)
            // if a nested group has no options to differentiate (i.e. also has shouldBeTreatedLikeAllOf() === true), we can ignore it as well
            .filter(({ options }) => options);
    } else {
        // each entry is considered an option (i.e. nothing is filtered out), groups may have some more nested options
        containedOptions = schemaGroup.entries
            // for all groups: look-up their nested options recursively
            .map(entry => (entry instanceof JsonSchema ? {} : getOptionsInSchemaGroup(entry)));
    }
    return schemaGroup.createOptionsRepresentation(containedOptions);
}

/**
 * Determine all possible `optionIndexes` for accessing a single option in the given input.
 *
 * @param {Object} param0 representation of the hierarchical structure of options in a schema group
 * @param {Array.<Object>} param0.options nested options (that may have further nested options of their own)
 * @param {?Array.<Object>} param0.options[].options further nested options
 * @return {Array.<Array<Number>>} return all possible `optionIndexes` for the given input
 */
export function getIndexPermutationsForOptions({ options }) {
    const recursivelyCollectOptionIndexes = (entry, index) => (
        isNonEmptyObject(entry)
            ? getIndexPermutationsForOptions(entry).map(nestedOptions => [index, ...nestedOptions])
            : [index]
    );
    const reduceOptionIndexes = (result, nextOptions) => {
        if (typeof nextOptions[0] === "number") {
            result.push(nextOptions);
            return result;
        }
        // nextOptions is an array of arrays, unwrap it
        return result.concat(nextOptions);
    };
    return options.map(recursivelyCollectOptionIndexes).reduce(reduceOptionIndexes, []);
}

/**
 * Convert an array of indexes into an array of mutable objects (initialised with the respective index) as expected by JsonSchemaGroup methods.
 *
 * @param {?Array.<Number>|Array.<Object>} optionIndexes array of non-negative integers indicating the selected option(s) (or already result array)
 * @returns {Array.<Object>} return array of mutable objects containing the given index values
 * @returns {Number} return[].index respective (initial) index value as provided in input array
 */
export function createOptionTargetArrayFromIndexes(optionIndexes = []) {
    if (Array.isArray(optionIndexes) && optionIndexes.length && typeof optionIndexes[0] === "number") {
        return optionIndexes.map(index => ({ index }));
    }
    return optionIndexes;
}

/**
 * Helper function to create a group class for the respective raw grouping in this schema.
 *
 * @param {Function} GroupClass constructor reference to the group to create
 * @param {Function} GroupClass.param0 constructor reference to JsonSchema (to avoid circular dependencies)
 * @param {?Object} GroupClass.param1 parserConfig object being forwarded to group (not necessarily expected by all groups)
 * @param {JsonSchema} param1 context JsonSchema in which to create the schema group (providing the applicable `parserConfig` and `scope`)
 * @param {Array.<JsonSchema>} rawSchemaArray grouped raw schema definitions to represent
 * @return {JsonSchemaGroup} return created group
 */
function createGroupFromRawSchemaArray(GroupClass, { parserConfig, scope }, rawSchemaArray) {
    // create group representation
    const group = new GroupClass(parserConfig);
    rawSchemaArray
        // convert each part in the group to a JsonSchema instance and (recursively) get its group information
        // eslint-disable-next-line no-use-before-define
        .map(rawSchemaPart => createGroupFromSchema(new JsonSchema(rawSchemaPart, parserConfig, scope)))
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
 * @param {JsonSchema} schema single JsonSchema for which to create the equivalent JsonSchemaGroup
 * @returns {JsonSchemaAllOfGroup} group of sub-schemas that may define properties about their children
 */
export function createGroupFromSchema(schema) {
    const { schema: rawSchema, parserConfig, scope } = schema;
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
    if (rawSchema.anyOf && parserConfig && parserConfig.anyOf) {
        result.with(createGroupFromRawSchemaArray(JsonSchemaAnyOfGroup, schema, rawSchema.anyOf));
    }
    if (rawSchema.oneOf && parserConfig && parserConfig.oneOf) {
        result.with(createGroupFromRawSchemaArray(JsonSchemaOneOfGroup, schema, rawSchema.oneOf));
    }
    return result;
}

/**
 * Look-up of the value associated with a specific kind of field in the given JsonSchema.
 * If the targeted schema represents an array, the sub-schemas of its "items" will be ignored.
 *
 * @param {JsonSchema} schema single schema to extract a certain field's value from
 * @param {String} fieldName name/key of the field to look-up
 * @param {?Function} mappingFunction converting the raw value
 * @param {?*} mappingFunction.param0 raw value retrieved from raw Json Schema
 * @param {?Object} mappingFunction.param1 parserConfig from given 'schema'
 * @param {?RefScope} mappingFunction.param2 scope from given 'schema'
 * @return {*} return looked-up field value (possibly changed by 'mappingFunction'
 */
function getFieldValueFromSchema(schema, fieldName, mappingFunction) {
    const { schema: rawSchema } = schema;
    const rawValue = rawSchema[fieldName];
    if (mappingFunction) {
        const { parserConfig, scope } = schema;
        return mappingFunction(rawValue, parserConfig, scope);
    }
    return rawValue;
}

/**
 * Extract value(s) from a certain field from all schema parts of the given schema group.
 *
 * @param {JsonSchemaGroup} schemaGroup schema group to extract a certain field's value(s) from
 * @param {String} fieldName name/key of the field to look-up
 * @param {?Function} mergeValues function to be used in `Array.reduce()` to combine extracted values from multiple JsonSchemas
 * @param {*} mergeValues.param0 combined values
 * @param {*} mergeValues.param1 single value to add to the already combined values
 * @param {*} mergeValues.return combined values including additional single value
 * @param {*} defaultValue initial value of mergeValues.param0 on first execution
 * @param {?*} mappingFunction.param0 raw value retrieved from raw Json Schema
 * @param {?Object} mappingFunction.param1 parserConfig from given 'schema'
 * @param {?RefScope} mappingFunction.param2 scope from given 'schema'
 * @param {?Array.<Number>} optionIndexes indexes representing the selection path to a particular option (if there are options in the given group)
 * @return {*} return merged result of all encountered values in schema parts in the given group
 */
export function getFieldValueFromSchemaGroup(schemaGroup, fieldName, mergeValues = listValues, defaultValue, mappingFunction, optionIndexes) {
    const result = schemaGroup.extractValues(
        schema => getFieldValueFromSchema(schema, fieldName, mappingFunction),
        mergeValues,
        defaultValue,
        createOptionTargetArrayFromIndexes(optionIndexes)
    );
    return result;
}

/**
 * If the given raw schema is a non-empty object, wrap it into a JsonSchema – otherwise return 'undefined'.
 *
 * @param {?Object} rawSchema the JSON Schema to represent
 * @param {?Object} parserConfig configuration affecting how the JSON schema is being traversed/parsed
 * @param {?RefScope} scope collection of available $ref targets
 * @return {JsonSchema|undefined} return successfully created JsonSchema or 'undefined'
 */
function createJsonSchemaIfNotEmpty(rawSchema, parserConfig, scope) {
    return isNonEmptyObject(rawSchema) ? new JsonSchema(rawSchema, parserConfig, scope) : undefined;
}

/**
 * Convenience function for calling `getFieldValueFromSchemaGroup()` when expecting the field's value to be a schema (part) of its own.
 *
 * @param {JsonSchemaGroup} schemaGroup schema group to extract a certain field's value(s) from
 * @param {String} fieldName name/key of the field to look-up
 * @param {?Array.<Number>} optionIndexes indexes representing the selection path to a particular option (if there are options in the given group)
 * @return {JsonSchema|Array.<JsonSchema>|undefined} return all encountered values in schema parts in the given group, each as a JsonSchema
 */
function getSchemaFieldValueFromSchemaGroup(schemaGroup, fieldName, optionTarget) {
    const result = getFieldValueFromSchemaGroup(
        schemaGroup,
        fieldName,
        /* merge function */ listValues,
        /* default value */ undefined,
        /* mapping function */ createJsonSchemaIfNotEmpty,
        optionTarget
    );
    return result;
}

/**
 * Determine the type of entries within the indicated schema group representing an array, otherwise returning undefined.
 *
 * @param {JsonSchemaGroup} schemaGroup targeted schema group which may represent an array
 * @param {?Array.<Number>} optionIndexes in case a group with optional branches, indexes indicating selected path
 * @return {JsonSchema|undefined} return type of items in given schema group, if it represents an array
 */
export function getTypeOfArrayItemsFromSchemaGroup(schemaGroup, optionIndexes) {
    const optionTarget = createOptionTargetArrayFromIndexes(optionIndexes);
    const optionTargetCopy = JSON.parse(JSON.stringify(optionTarget));
    let arrayItemSchema = getSchemaFieldValueFromSchemaGroup(schemaGroup, "items", optionTarget);
    if (!Array.isArray(arrayItemSchema) && !isNonEmptyObject(arrayItemSchema)) {
        const resetOptionIndex = (originalOption, arrayIndex) => {
            // eslint-disable-next-line no-param-reassign
            optionTarget[arrayIndex].index = originalOption.index;
        };
        // reset indexes in optionTarget if nothing was found
        optionTargetCopy.forEach(resetOptionIndex);
        arrayItemSchema = getSchemaFieldValueFromSchemaGroup(schemaGroup, "additionalItems", optionTarget);
        if (!Array.isArray(arrayItemSchema) && !isNonEmptyObject(arrayItemSchema)) {
            // and again: reset indexes in optionTarget
            optionTargetCopy.forEach(resetOptionIndex);
            return undefined;
        }
    }
    // due to the 'listValues' mergeFunction, the array item schemas may be in an array
    // for simplicity's sake: treating this as unclean schema declaration – we just consider the first
    return Array.isArray(arrayItemSchema) ? arrayItemSchema[0] : arrayItemSchema;
}

/**
 * Collect all mentioned properties with their associated schema definitions (if available) from a given JsonSchema.
 *
 * @param {JsonSchema} schema targeted schema to collect properties from (ignoring any nested `allOf`/`anyOf`/`oneOf`)
 * @return {Object.<String, JsonSchema|Boolean|Object} collected properties, still including 'true' or ' {}' where no more details are available
 */
function getPropertiesFromSchema(schema) {
    const { schema: rawSchema, parserConfig, scope } = schema;
    const { required = [], properties = {} } = rawSchema;
    const rawProperties = Object.assign(
        {},
        ...required.map(value => ({ [value]: true })),
        properties
    );
    // properties is an Object.<String, raw-json-schema> and should be converted to an Object.<String, JsonSchema>
    return mapObjectValues(rawProperties,
        rawPropertySchema => (
            isNonEmptyObject(rawPropertySchema)
                ? new JsonSchema(rawPropertySchema, parserConfig, scope)
                : rawPropertySchema
        ));
}

/**
 * Generic function to be used in Array.reduce() - assuming objects are being merged.
 *
 * @param {?Object} combined temporary result of previous reduce steps
 * @param {?Object} nextValue single value to merge with "combined"
 * @returns {?Object} merged values
 */
function mergeSchemas(combined, nextValue) {
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
                .filter(key => !isNonEmptyObject(combined[key]) || isNonEmptyObject(nextValue[key]))
                .map(key => ({ [key]: nextValue[key] }))
        );
    }
    return mergeResult;
}

/**
 * Extract the properties mentioned in this schema group.
 *
 * @param {?Array.<Number>} optionIndexes array of (relative) index
 * @param {Number} optionTarget[].index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
 * @returns {Object.<String, JsonSchema>} collection of all properties mentioned in this schema
 */
export function getPropertiesFromSchemaGroup(schemaGroup, optionIndexes) {
    const optionTarget = createOptionTargetArrayFromIndexes(optionIndexes);
    let result = schemaGroup.extractValues(
        getPropertiesFromSchema,
        mergeSchemas,
        {},
        optionTarget
    );
    // convert any remaining non-schema values (e.g. booleans) into schema wrappers
    result = mapObjectValues(result, value => (
        // no need to forward any parserConfig or scope to this (dummy/empty) schema
        value instanceof JsonSchema ? value : new JsonSchema(value)
    ));
    return result;
}
