/**
 * Generic function determining whether the given value is a not-null object with at least one key.
 * 
 * @param {*} target value to confirm as non-empty object
 * @returns {boolean} whether the target is a non-empty object
 */
export function isNonEmptyObject(target) {
    return isDefined(target)
        && typeof target === 'object'
        && Object.keys(target).length > 0;
}

/**
 * Generic function determining whether the given value is neither undefined nor null.
 * 
 * @param {*} target value to confirm
 * @returns {boolean} whether the target is neither undefined nor null
 */
export function isDefined(target) {
    return target !== undefined && target !== null;
}

/**
 * Look-up of any properties in the given JSON schema definition.
 * 
 * @param {JsonSchema} schema definition of a JSON structure to traverse
 * @param {Object.<String, JsonSchema>} refTargets re-usable schema definitions
 * @returns {Object.<String, JsonSchema>} containing properties schemas as values with their names as keys
 */
export function getPropertyParentFieldValue(schema, fieldName, refTargets) {
    const schemaList = getPropertyParentSchemas(schema, refTargets);
    const mergedValue = schemaList.map(part => part[fieldName]).reduce(mergeValues, null);
    return mergedValue;
}

/**
 * Look-up of any nested sub-schemas in the given JSON schema definition.
 * 
 * @param {JsonSchema} schema definition of a JSON structure to traverse
 * @param {Object.<String, JsonSchema>} refTargets re-usable sub-schemas
 * @returns {Array<JsonSchema>} array listing sub-schemas that may define properties about their children
 */
export function getPropertyParentSchemas(schema, refTargets) {
    if (!isNonEmptyObject(schema)) {
        return [];
    }
    if (schema.$ref) {
        const referencedSchema = refTargets[schema.$ref];
        if (!isDefined(referencedSchema)) {
            throw new Error('Cannot resolve $ref: "' + schema.$ref + '", only known references are: ' + Object.keys(refTargets).join(', '));
        }
        // the given schema is just a reference to another separately defined schema
        return getPropertyParentSchemas(referencedSchema, refTargets);
    }
    if (schema.allOf) {
        let returnedSchemas = [schema];
        schema.allOf.forEach(part => returnedSchemas = returnedSchemas.concat(getPropertyParentSchemas(part, refTargets)));
        return returnedSchemas;
    }
    if (isNonEmptyObject(schema.items)) {
        // unsupported: specifying array of schemas refering to entries at respective positions in described array
        // schema.items contains a single schema, that specifies the type of any value in the described array
        return getPropertyParentSchemas(schema.items, refTargets);
    }
    if (isNonEmptyObject(schema.additionalItems)) {
        // the given schema is an array which may specify its content type in "additionalItems"
        return getPropertyParentSchemas(schema.additionalItems, refTargets);
    }
    // if there are no nested schemas, only the given one may contain properties
    return [schema];
}

export function getFieldValue(schema, fieldName, refTargets) {
    if (schema.$ref) {
        if (!refTargets) {
            // if no refTargets were provided, just skip the reference
            return null;
        }
        // schema variable is merely a reference to a separately defined schema
        const referencedSchema = refTargets[schema.$ref];
        if (!isDefined(referencedSchema)) {
            throw new Error('Cannot resolve $ref: "' + schema.$ref + '", only known references are: ' + Object.keys(refTargets).join(', '));
        }
        // by convention, if $ref is specified, all other properties in the schema are being ignored
        return getFieldValue(referencedSchema, fieldName, refTargets);
    }
    const value = schema[fieldName];
    if (schema.allOf) {
        // schema variable is supposed to be combined with a given list of sub-schemas
        return schema.allOf
            .map(part => getFieldValue(part, fieldName, refTargets))
            .reduce(mergeValues, value);
    }
    return value;
}

/**
 * Reduce function
 * @param {Object.<string, JsonSchema>} refTargets re-usable sub-schemas
 * @returns {func} function for use in Array.reduce()
 */
function mergeValues(combined, nextValue) {
    if (!isDefined(combined)) {
        return nextValue;
    }
    if (!isDefined(nextValue)) {
        return combined;
    }
    if (Array.isArray(combined) && Array.isArray(nextValue)) {
        return combined.concat(nextValue);
    }
    if (typeof combined === 'object' && isNonEmptyObject(nextValue)) {
        return Object.assign({}, combined, nextValue);
    }
    // first actual value wins if no specific merge can be performed
    return combined;
}
