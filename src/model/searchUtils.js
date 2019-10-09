import memoize from "memoize-one";
import isDeepEqual from "lodash.isequal";
import escapeRegExp from "lodash.escaperegexp";

import JsonSchema from "./JsonSchema";
import { isNonEmptyObject } from "./utils";

/**
 * Creating a function that accepts a single raw schema definition and applies the given filter function on itself and all contained sub-schemas.
 * Any $ref-erences are being ignored here and expected to be handled independently
 *
 * @param {?Function} flatSearchFilter - function that checks whether a given raw schema matches some search criteria
 * @param {object} flatSearchFilter.param0 - first input parameter is a raw schema definition
 * @param {?boolean} flatSearchFilter.param1 - second input parameter: flag indicating whether nested optionals should be considered (default: true)
 * @param {*} flatSearchFilter.return - expected output is a truthy/falsy value, whether the given schema matches the filter (ignoring sub-schemas)
 * @param {?Function} propertyNameCheck - check whether a given property name alone already satisfies the search criteria
 * @param {string} propertyNameCheck.param0 - input parameter is the property name to check
 * @param {*} propertyNameCheck.return - expected output is a truthy/falsy value, whether the property name matches some search criteria
 * @returns {Function} created filter function for a `JsonSchema`; returning whether the given schema or any of its sub-schemas matches the filter
 */
export function createRecursiveFilterFunction(flatSearchFilter, propertyNameCheck) {
    const recursiveFilterFunction = (target, includeNestedOptionals = true) => {
        if (!target) {
            return false;
        }
        const { schema: rawSchema, parserConfig, scope } = target;
        if (!isNonEmptyObject(rawSchema)) {
            // empty schema can be ignored
            return false;
        }
        // check the schema itself whether it matches the provided flat filter function
        if (flatSearchFilter && flatSearchFilter(rawSchema, includeNestedOptionals)) {
            return true;
        }
        if (rawSchema.$ref) {
            // if there is a $ref, no other fields are being expected to be present - and the referenced sub-schema is checked separately
            return false;
        }
        const searchInParts = (groupKey) => (
            rawSchema[groupKey]
            && rawSchema[groupKey].some((rawSubSchema) => recursiveFilterFunction(
                new JsonSchema(rawSubSchema, parserConfig, scope),
                includeNestedOptionals
            ))
        );
        // if the given schema is a composite of multiple sub-schemas, check each of its parts
        if (searchInParts("allOf")
            || (includeNestedOptionals && (searchInParts("oneOf") || searchInParts("anyOf")))) {
            return true;
        }
        const filterRawSubSchemaIncludingOptionals = (rawSubSchema) => recursiveFilterFunction(
            new JsonSchema(rawSubSchema, parserConfig, scope),
            true
        );
        // otherwise recursively check the schemas of any contained properties
        if (isNonEmptyObject(rawSchema.properties)
            && ((propertyNameCheck && Object.keys(rawSchema.properties).some(propertyNameCheck))
                || Object.values(rawSchema.properties).some(filterRawSubSchemaIncludingOptionals))) {
            return true;
        }
        // alternatively check the defined value schema for an array's items
        if (isNonEmptyObject(rawSchema.items)) {
            if (filterRawSubSchemaIncludingOptionals(rawSchema.items)) {
                return true;
            }
            // ignoring "additionalItems" if "items" is defined (as per convention described in JSON Schema)
        } else if (isNonEmptyObject(rawSchema.additionalItems)
            && filterRawSubSchemaIncludingOptionals(rawSchema.additionalItems)) {
            return true;
        }
        return false;
    };
    return recursiveFilterFunction;
}

/**
 * Traverse a given schema definition and collect all referenced sub-schemas (except for itself).
 *
 * @param {JsonSchema} schema - targeted schema definition for which to collect sub-schemas referenced via $ref
 * @param {boolean} includeNestedOptionals - whether included `oneOf`/`anyOf` blocks should be included in the results
 * @returns {Map.<JsonSchema, boolean>} all referenced sub-schemas (excluding self-references), indicating whether `oneOf`/`anyOf` may be included
 */
export function collectReferencedSubSchemas(schema, includeNestedOptionals) {
    // collect sub-schemas in a Map in order to avoid duplicates
    const references = new Map();
    // collect all referenced sub-schemas
    const collectReferences = (rawSubSchema, isIncludingOptionals) => {
        if (rawSubSchema.$ref) {
            // add referenced schema to the result set
            const targetSchema = schema.scope.find(rawSubSchema.$ref);
            if (references.get(targetSchema) !== true) {
                references.set(targetSchema, isIncludingOptionals);
            }
        }
        // always return false in order to iterate through all non-referenced sub-schemas
        return false;
    };
    createRecursiveFilterFunction(collectReferences)(schema, includeNestedOptionals);
    // ignore circular references
    references.delete(schema);
    return references;
}

/**
 * @name FilterFunctionForSchema
 * @function
 * @param {JsonSchema} param0 - single JsonSchema to check whether it matches a given filter function (to be applied on its raw schema)
 * @param {boolean} param1 - whether nested optionals from `oneOf`/`anyOf` may be included for the given JsonSchema
 * @returns {Array.<string|Array.<number>>} output is an array of "filteredItems"
 */
/**
 * Build the function for determining the "filteredItems" for a given Object.<String, JsonSchema>.
 *
 * @param {?Function} flatSearchFilter - function that checks whether a given raw schema matches some search criteria
 * @param {object} flatSearchFilter.param0 - first input parameter is a raw schema definition
 * @param {?boolean} flatSearchFilter.param1 - second input parameter: flag indicating whether nested optionals should be considered (default: true)
 * @param {*} flatSearchFilter.return - expected output is a truthy/falsy value, whether the given schema matches the filter (ignoring sub-schemas)
 * @param {?Function} propertyNameCheck - check whether a given property name alone already satisfies the search criteria
 * @param {string} propertyNameCheck.param0 - input parameter is the property name to check
 * @param {*} propertyNameCheck.return - expected output is a truthy/falsy value, whether the property name matches some search criteria
 * @returns {FilterFunctionForSchema} function to apply for filtering
 */
export function createFilterFunctionForSchema(flatSearchFilter, propertyNameCheck) {
    const recursiveSearchFilter = createRecursiveFilterFunction(flatSearchFilter, propertyNameCheck);
    // cache definitive search results for the individual sub-schemas in a Map.<JsonSchema, boolean>
    const schemaMatchResultsExclOptionals = new Map();
    const schemaMatchResultsInclOptionals = new Map();
    const getRememberedResult = (jsonSchema, includeNestedOptionals) => {
        if (schemaMatchResultsExclOptionals.has(jsonSchema)) {
            const resultExcludingOptionals = schemaMatchResultsExclOptionals.get(jsonSchema);
            if (resultExcludingOptionals || !includeNestedOptionals) {
                // short-circuit: return remembered filter result for this
                return resultExcludingOptionals;
            }
        }
        if (includeNestedOptionals && schemaMatchResultsInclOptionals.has(jsonSchema)) {
            return schemaMatchResultsInclOptionals.get(jsonSchema);
        }
        return undefined;
    };
    const setRememberedResultInclOptionals = (subSchema, result) => {
        schemaMatchResultsInclOptionals.set(subSchema, result);
        if (!result) {
            schemaMatchResultsExclOptionals.set(subSchema, false);
        }
    };
    const setRememberedResultExclOptionals = (subSchema, result) => schemaMatchResultsExclOptionals.set(subSchema, result);
    return (jsonSchema, includeNestedOptionalsForMainSchema) => {
        const rememberedResult = getRememberedResult(jsonSchema, includeNestedOptionalsForMainSchema);
        if (rememberedResult !== undefined) {
            return rememberedResult;
        }
        const subSchemasToVisit = new Map();
        subSchemasToVisit.set(jsonSchema, includeNestedOptionalsForMainSchema);
        const subSchemasInclOptionalsAlreadyVisited = new Set();
        const subSchemasExclOptionalsAlreadyVisited = new Set();
        const checkSubSchema = ([subSchema, includeNestedOptionalsForSubSchema]) => {
            let result = recursiveSearchFilter(subSchema, includeNestedOptionalsForSubSchema);
            subSchemasToVisit.delete(subSchema);
            if (includeNestedOptionalsForSubSchema) {
                subSchemasInclOptionalsAlreadyVisited.add(subSchema);
            } else {
                subSchemasExclOptionalsAlreadyVisited.add(subSchema);
            }
            const setRememberedSubSchemaResult = includeNestedOptionalsForSubSchema
                ? setRememberedResultInclOptionals
                : setRememberedResultExclOptionals;
            if (result) {
                // remember the successfully matched schema
                setRememberedSubSchemaResult(subSchema, true);
            } else {
                // no direct match in this sub-schema; need to determine the next level of sub-schemas in order to continue checking
                const subSubSchemas = Array.from(collectReferencedSubSchemas(subSchema, includeNestedOptionalsForSubSchema).entries());
                if (subSubSchemas.every(([subSubSchema, includingOptionals]) => (getRememberedResult(subSubSchema, includingOptionals) === false))) {
                    // there are no further references in here or all of them have been cleared as no-match already
                    setRememberedSubSchemaResult(subSchema, false);
                } else if (subSubSchemas.some(([subSubSchema, includingOptionals]) => getRememberedResult(subSubSchema, includingOptionals))) {
                    // there is at least one reference and that has already been confirmed as a match
                    result = true;
                    setRememberedSubSchemaResult(subSchema, true);
                } else {
                    // there is at least one reference for which no result exists yet, need to continue checking
                    subSubSchemas.forEach(([subSubSchema, includingOptionals]) => {
                        // in case of circular references without a match, this is where we prevent revisiting the same sub-schema over and over again
                        const subSchemasAlreadyVisited = includeNestedOptionalsForSubSchema
                            ? subSchemasInclOptionalsAlreadyVisited
                            : subSchemasExclOptionalsAlreadyVisited;
                        if (!subSchemasAlreadyVisited.has(subSubSchema)) {
                            // since it is a Set, we don't have to check for duplicates explicitly ourselves
                            subSchemasToVisit.set(subSubSchema, includingOptionals);
                        }
                    });
                }
            }
            return result;
        };
        const setRememberedResult = includeNestedOptionalsForMainSchema
            ? setRememberedResultInclOptionals
            : setRememberedResultExclOptionals;
        while (subSchemasToVisit.size) {
            if (Array.from(subSchemasToVisit.entries()).some(checkSubSchema)) {
                // mark at least the originally targeted schema has having a match as well
                setRememberedResult(jsonSchema, true);
                // any intermediate sub-schemas that could also be marked as matched are simply to hard to keep track off without recursion
                return true;
            }
        }
        // since none of the sub-schemas (including the originally targeted schema) was a match, we can remember that for future reference
        subSchemasInclOptionalsAlreadyVisited.forEach((subSchema) => {
            setRememberedResultInclOptionals(subSchema, false);
        });
        subSchemasExclOptionalsAlreadyVisited.forEach((subSchema) => {
            setRememberedResultExclOptionals(subSchema, false);
        });
        return false;
    };
}

/**
 * Build the function for determining whether the value in at least one of the indicated fields matches the filter text for a schema.
 *
 * @param {Array.<string>} searchFields - names of the fields in a schema to check for a (partial) match with the entered searchFilter text
 * @param {string} searchFilter - entered search filter text
 * @returns {?Function} return producing either a function to apply for filtering or undefined if the search feature is turned off
 * @returns {object.<string, JsonSchema>} return.value expected input is an object representing a view column's items
 * @returns {boolean} return.return - output is the indication whether the given schema is deemed to be a match
 */
export const filteringByFields = memoize((searchFields, searchFilter) => {
    if (searchFields && searchFields.length && searchFilter) {
        // use case-insensitive flag "i" in regular expression for value matching
        const regex = new RegExp(escapeRegExp(searchFilter), "i");
        return (rawSchema) => searchFields.some((fieldName) => regex.test(rawSchema[fieldName]));
    }
    return undefined;
}, isDeepEqual);

/**
 * Build the function for determining whether a particular property's name is a (partial) match for the filter text.
 *
 * @param {string} searchFilter - entered search filter text
 * @returns {?Function} return - producing either a function to apply for filtering or undefined if the search feature is turned off
 * @returns {string} return.value - expected input is a property's name
 * @returns {boolean} return.return - output is the indication whether the given property name is deemed to be a match
 */
export const filteringByPropertyName = memoize((searchFilter) => {
    if (searchFilter) {
        // use case-insensitive flag "i" in regular expression for value matching
        const regex = new RegExp(escapeRegExp(searchFilter), "i");
        return regex.test.bind(regex);
    }
    return undefined;
});
