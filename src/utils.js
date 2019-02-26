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
 * Generic function determining whether the given value is a not-null object with at least one key.
 *
 * @param {*} target value to confirm as non-empty object
 * @returns {boolean} whether the target is a non-empty object
 */
export function isNonEmptyObject(target) {
    return isDefined(target)
        && typeof target === "object"
        && Object.keys(target).length > 0;
}

/**
 * Generic function to be used in Array.reduce().
 * @param {*} combined temporary result of previous reduce steps
 * @param {*} nextValue single value to merge with "combined"
 * @returns {*} merged values
 */
function mergeValues(combined, nextValue) {
    let mergeResult;
    if (!isDefined(combined)) {
        mergeResult = nextValue;
    } else if (!isDefined(nextValue)) {
        mergeResult = combined;
    } else if (combined === nextValue) {
        mergeResult = combined;
    } else if (Array.isArray(combined)) {
        // unequal values cannot be merged easily, instead return array of collected values
        if (Array.isArray(nextValue)) {
            mergeResult = combined.concat(nextValue);
        } else {
            mergeResult = combined.slice();
            mergeResult.push(nextValue);
        }
    } else if (Array.isArray(nextValue)) {
        // unequal values cannot be merged easily, instead return array of collected values
        mergeResult = [combined].concat(nextValue);
    } else if (typeof combined === "object" && isNonEmptyObject(nextValue)) {
        mergeResult = Object.assign({}, combined, nextValue);
    } else {
        // unequal values cannot be merged easily, instead return array of collected values
        mergeResult = [combined, nextValue];
    }
    return mergeResult;
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
            throw new Error(`Cannot resolve $ref: "${schema.$ref}", only known references are: ${Object.keys(refTargets).join(", ")}`);
        }
        // the given schema is just a reference to another separately defined schema
        return getPropertyParentSchemas(referencedSchema, refTargets);
    }
    if (schema.allOf) {
        let returnedSchemas = [schema];
        schema.allOf.forEach((part) => {
            returnedSchemas = returnedSchemas.concat(getPropertyParentSchemas(part, refTargets));
        });
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

/**
 * Look-up of any properties in the given JSON schema definition.
 *
 * @param {JsonSchema} schema definition of a JSON structure to traverse
 * @param {String} fieldName name/key of the field to look-up
 * @param {Object.<String, JsonSchema>} refTargets re-usable schema definitions
 * @param {*} defaultValue default value to return/merge encountered values with (falls-back to null)
 * @param {Function} mergeFunction optional: how to combine two encountered values (starting with "defaultValue") into one
 * @returns {Object.<String, JsonSchema>} containing properties schemas as values with their names as keys
 */
export function getPropertyParentFieldValue(schema, fieldName, refTargets, defaultValue = null, mergeFunction = mergeValues) {
    const schemaList = getPropertyParentSchemas(schema, refTargets);
    const mergedValue = schemaList.map(part => part[fieldName]).reduce(mergeFunction, defaultValue);
    return mergedValue;
}

export function getFieldValue(schema, fieldName, refTargets, mergeFunction = mergeValues) {
    if (schema.$ref) {
        if (!refTargets) {
            // if no refTargets were provided, just skip the reference
            return null;
        }
        // schema variable is merely a reference to a separately defined schema
        const referencedSchema = refTargets[schema.$ref];
        if (!isDefined(referencedSchema)) {
            throw new Error(`Cannot resolve $ref: "${schema.$ref}", only known references are: ${Object.keys(refTargets).join(", ")}`);
        }
        // by convention, if $ref is specified, all other properties in the schema are being ignored
        return getFieldValue(referencedSchema, fieldName, refTargets, mergeFunction);
    }
    const value = schema[fieldName];
    if (schema.allOf) {
        // schema variable is supposed to be combined with a given list of sub-schemas
        return schema.allOf
            .map(part => getFieldValue(part, fieldName, refTargets, mergeFunction))
            .reduce(mergeFunction, value);
    }
    return value;
}

/**
 * Collect all re-usable sub-schemas that can be referenced via $ref.
 * @param {JsonSchema} schema root schema for which to collect all allowed $ref values
 * @returns {Object.<String, JsonSChema>} mapped $ref values to their corresponding schemas
 */
export function collectRefTargets(schema) {
    const refTargets = {};
    if (isNonEmptyObject(schema)) {
        refTargets["#"] = schema;
        const { $id, id, definitions } = schema;
        if ($id) {
            // from JSON Schema Draft 6: "$id"
            refTargets[$id] = schema;
        } else if (id) {
            // in JSON Schema Draft 4, the "id" property had no "$" prefix
            refTargets[id] = schema;
        }
        if (isNonEmptyObject(definitions)) {
            Object.keys(definitions).forEach((key) => {
                const subSchema = definitions[key];
                refTargets[`#/definitions/${key}`] = subSchema;
                if (subSchema.$id) {
                    // from JSON Schema Draft 6: "$id"
                    refTargets[subSchema.$id] = subSchema;
                } else if (subSchema.id) {
                    // in JSON Schema Draft 4, the "id" property had no "$" prefix
                    refTargets[subSchema.id] = subSchema;
                }
            });
        }
    }
    return refTargets;
}
