import memoize from "memoize-one";
import isDeepEqual from "lodash.isequal";
import escapeRegExp from "lodash.escaperegexp";

import JsonSchema from "./JsonSchema";
import { isNonEmptyObject } from "./utils";

/**
 * Creating a function that accepts a single raw schema definition and applies the given filter function on itself and all contained sub-schemas.
 * Any $ref-erences are being ignored here and expected to be handled independently
 *
 * @param {Function} flatSearchFilter function that checks whether a given raw schema
 * @param {Object} flatSearchFilter.value expected input parameter is a raw schema definition
 * @param {*} flatSearchFilter.return expected output value is a truthy/falsy whether the given schema matches the filter (ignoring sub-schemas)
 * @return {Function} return created filter function
 * @return {Object} return.value expected input parameter is a JsonSchema instance
 * @return {Boolean} return.return output value indicates whether the given schema or any of its sub-schemas matches the provided flat filter function
 */
export function createRecursiveFilterFunction(flatSearchFilter) {
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
        if (flatSearchFilter(rawSchema, includeNestedOptionals)) {
            return true;
        }
        if (rawSchema.$ref) {
            // if there is a $ref, no other fields are being expected to be present - and the referenced sub-schema is checked separately
            return false;
        }
        const filterRawSubSchemaConsideringOptionals = rawSubSchema => recursiveFilterFunction(
            new JsonSchema(rawSubSchema, parserConfig, scope),
            includeNestedOptionals
        );
        // if the given schema is a composite of multiple sub-schemas, check each of its parts
        if (rawSchema.allOf && rawSchema.allOf.some(filterRawSubSchemaConsideringOptionals)) {
            return true;
        }
        const searchInOptionals = groupKey => (
            rawSchema[groupKey] && parserConfig && parserConfig[groupKey]
            && (parserConfig[groupKey].type === "likeAllOf" || includeNestedOptionals)
            && rawSchema[groupKey].some(filterRawSubSchemaConsideringOptionals)
        );
        if (searchInOptionals("oneOf") || searchInOptionals("anyOf")) {
            return true;
        }
        const filterRawSubSchemaIncludingOptionals = rawSubSchema => recursiveFilterFunction(
            new JsonSchema(rawSubSchema, parserConfig, scope),
            true
        );
        // otherwise recursively check the schemas of any contained properties
        if (isNonEmptyObject(rawSchema.properties)
            && Object.values(rawSchema.properties).some(filterRawSubSchemaIncludingOptionals)) {
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
 * @param {JsonSchema} jsonSchema targeted schema definition for which to collect sub-schemas referenced via $ref
 * @returns {Map.<JsonSchema, Boolean>} all referenced sub-schemas (excluding self-references)
 */
export function collectReferencedSubSchemas(jsonSchema, includeNestedOptionals) {
    // collect sub-schemas in a Set in order to avoid duplicates
    const references = new Map();
    // collect all referenced sub-schemas
    const collectReferences = (rawSubSchema, isIncludingOptionals) => {
        if (rawSubSchema.$ref) {
            // add referenced schema to the result set
            const targetSchema = jsonSchema.scope.find(rawSubSchema.$ref);
            references.set(targetSchema, isIncludingOptionals || (references.get(targetSchema) === true));
        }
        // always return false in order to iterate through all non-referenced sub-schemas
        return false;
    };
    createRecursiveFilterFunction(collectReferences)(jsonSchema, includeNestedOptionals);
    // ignore circular references
    references.delete(jsonSchema);
    return references;
}

/**
 * Build the function for determining the "filteredItems" for a given Object.<String, JsonSchema>.
 *
 * @param {Function} flatSearchFilter filter to apply on a single raw json schema
 * @param {Object} flatSearchFilter.param0 raw JSON schema to filter (without considering any sub-structures like `properties` or `allOf`)
 * @param {Boolean} flatSearchFilter.return whether there is a direct match in the given schema (e.g. in its `title` or `description`)
 * @return {Function} return producing a function to apply for filtering
 * @return {Object.<String, JsonSchema>} return.param0 expected input is an object representing a view column's items
 * @return {Array.<String>} return.return output is an array of "filteredItems"
 */
export function createFilterFunctionForSchema(flatSearchFilter) {
    const recursiveSearchFilter = createRecursiveFilterFunction(flatSearchFilter);
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
 * Build the function for determining the "filteredItems" for a given Object.<String, JsonSchema>.
 *
 * @param {Array.<String>} searchFields names of the fields in a schema to check for a (partial) match with the entered searchFilter text
 * @param {String} searchFilter entered search filter text
 * @return {Function|undefined} return producing either a function to apply for filtering or undefined if the search feature is turned off
 * @return {Object.<String, JsonSchema>} return.value expected input is an object representing a view column's items
 * @return {Array.<String>} return.return output is an array of "filteredItems"
 */
export const filteringByFields = memoize((searchFields, searchFilter) => {
    if (searchFields && searchFields.length && searchFilter) {
        // use case-insensitive flag "i" in regular expression for value matching
        const regex = new RegExp(escapeRegExp(searchFilter), "i");
        return rawSchema => searchFields.some(fieldName => regex.test(rawSchema[fieldName]));
    }
    return undefined;
}, isDeepEqual);
