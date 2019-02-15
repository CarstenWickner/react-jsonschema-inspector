/**
 * Generic function determining whether the given value is a not-null object with at least one key.
 * 
 * @param {*} target value to confirm as non-empty object
 * @returns {boolean} whether the target is a non-empty object
 */
function isNonEmptyObject(target) {
    return target !== null
            && typeof target === 'object'
            && Object.keys(target).length > 0;
}

/**
 * Determine whether the given JSON schema definition contains any nested sub-schemas.
 * 
 * @param {JsonSchema} schema definition of a JSON structure to check
 * @param {Object.<string, JsonSchema>} refTargets re-usable sub-schemas
 * @returns {boolean} whether the given schema has at least one nested property
 */
export function hasNestedProperties(schema, refTargets) {
    const nestedProperties = getNestedProperties(schema, refTargets);
    return isNonEmptyObject(nestedProperties);
}

/**
 * Look-up of any nested sub-schemas in the given JSON schema definition.
 * 
 * @param {JsonSchema} schema definition of a JSON structure to traverse
 * @param (Object.<string, JsonSchema>) refTargets re-usable sub-schemas
 * @returns object containing nested sub-schemas as values with their names as keys
 */
export function getNestedProperties(schema, refTargets) {
    if (!isNonEmptyObject(schema)) {
        // not an object = not a schema = no nested properties
        return null;
    }
    if (schema.$ref) {
        // the given schema is just a reference to another separately defined schema
        return getNestedProperties(refTargets[schema.$ref], refTargets);
    }
    if (schema.properties) {
        // the given schema represents an "object" with a list of "properties"
        return schema.properties;
    }
    if (typeof schema.items === 'boolean') {
        // the given schema is an array which may specify its content type in "additionalItems"
        return getNestedProperties(schema.additionalItems, refTargets);
    }
    if (Array.isArray(schema.items)) {
        // unsupported: specifying array of schemas refering to entries at respective positions in described array
        return null;
    }
    if (schema.items) {
        // schema.items contains a single schema, that specifies the type of any value in the described array
        return getNestedProperties(schema.items, refTargets);
    }
    // for other types, there are no nested properties to show
    return null;
}
