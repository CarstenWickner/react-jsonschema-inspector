import memoize from "memoize-one";
import isDeepEqual from "lodash.isequal";
import escapeRegExp from "lodash.escaperegexp";

import JsonSchema from "./JsonSchema";
import { createGroupFromSchema, createOptionTargetArrayFromIndexes } from "./schemaUtils";
import { isNonEmptyObject } from "./utils";

/**
 * Creating a function that accepts a single raw schema definition and applies the given filter function on itself and all contained sub-schemas.
 * Any $ref-erences are being ignored here and expected to be handled independently
 *
 * @param {Function} flatSearchFilter function that checks whether a given raw schema
 * @param {Object} flatSearchFilter.value expected input parameter is a raw schema definition
 * @param {*} flatSearchFilter.return expected output value is a truthy/falsy whether the given schema matches the filter (ignoring sub-schemas)
 * @return {Function}
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
        if (flatSearchFilter(rawSchema)) {
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
        const filterRawSubSchema = rawSubSchema => recursiveFilterFunction(
            new JsonSchema(rawSubSchema, parserConfig, scope)
        );
        // otherwise recursively check the schemas of any contained properties
        if (isNonEmptyObject(rawSchema.properties)
            && Object.values(rawSchema.properties).some(filterRawSubSchema)) {
            return true;
        }
        // alternatively check the defined value schema for an array's items
        if (isNonEmptyObject(rawSchema.items)) {
            if (filterRawSubSchema(rawSchema.items)) {
                return true;
            }
            // ignoring "additionalItems" if "items" is defined (as per convention described in JSON Schema)
        } else if (isNonEmptyObject(rawSchema.additionalItems)
            && filterRawSubSchema(rawSchema.additionalItems)) {
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
 * @returns {Array.<JsonSchema>} all referenced sub-schemas (excluding self-references)
 */
export function collectReferencedSubSchemas(jsonSchema) {
    // collect sub-schemas in a Set in order to avoid duplicates
    const references = new Set();
    // collect all referenced sub-schemas
    const filterFunction = createRecursiveFilterFunction((rawSubSchema) => {
        if (rawSubSchema.$ref) {
            // add referenced schema to the result set
            references.add(jsonSchema.scope.find(rawSubSchema.$ref));
        }
        // always return false in order to iterate through all non-referenced sub-schemas
        return false;
    });
    filterFunction(jsonSchema);
    // ignore circular references
    references.delete(jsonSchema);
    return references;
}

function getIndexPermutationsForOptions({ options }) {
    return options.map((entry, index) => (
        isNonEmptyObject(entry)
            ? getIndexPermutationsForOptions(entry).map(nestedOptions => [index].concat(nestedOptions))
            : [index]
    )).reduce((result, nextOptions) => {
        if (typeof nextOptions[0] === "number") {
            result.push(nextOptions);
            return result;
        }
        return result.concat(nextOptions);
    }, []);
}

/**
 * Build the function for determining the "filteredItems" for a given Object.<String, JsonSchema>.
 *
 * @param {Function} flatSearchFilter
 * @param {Object} flatSearchFilter.param0 raw JSON schema to filter (without considering any sub-structures like `properties` or `allOf`)
 * @param {Boolean} flatSearchFilter.return whether there is a direct match in the given schema (e.g. in its `title` or `description`)
 * @return {Function} return producing a function to apply for filtering
 * @return {Object.<String, JsonSchema>} return.param0 expected input is an object representing a view column's items
 * @return {Array.<String>} return.return output is an array of "filteredItems"
 */
export function createFilterFunction(flatSearchFilter) {
    const recursiveSearchFilter = createRecursiveFilterFunction(flatSearchFilter);
    // cache definitive search results for the individual sub-schemas in a Map.<JsonSchema, boolean>
    const schemaMatchResults = new Map();
    const containsMatchingItems = (jsonSchema, includeNestedOptionals) => {
        if (schemaMatchResults.has(jsonSchema)) {
            // short-circuit: return remembered filter result for this
            return schemaMatchResults.get(jsonSchema);
        }
        const subSchemasToVisit = new Set();
        subSchemasToVisit.add(jsonSchema);
        const subSchemasAlreadyVisited = new Set();
        const checkSubSchema = (subSchema) => {
            let result = recursiveSearchFilter(subSchema, includeNestedOptionals);
            subSchemasToVisit.delete(subSchema);
            subSchemasAlreadyVisited.add(subSchema);
            if (result) {
                // remember the successfully matched schema
                schemaMatchResults.set(subSchema, true);
            } else {
                // no direct match in this sub-schema; need to determine the next level of sub-schemas in order to continue checking
                const subSubSchemas = Array.from(collectReferencedSubSchemas(subSchema).values());
                if (subSubSchemas.every(subSubSchema => schemaMatchResults.get(subSubSchema) === false)) {
                    // there are no further references in here or all of them have been cleared as no-match already
                    schemaMatchResults.set(subSchema, false);
                } else if (subSubSchemas.some(subSubSchema => schemaMatchResults.get(subSubSchema))) {
                    // there is at least one reference and that has already been confirmed as a match
                    result = true;
                    schemaMatchResults.set(subSchema, true);
                } else {
                    // there is at least one reference for which no result exists yet, need to continue checking
                    subSubSchemas.forEach((subSubSchema) => {
                        // in case of circular references without a match, this is where we prevent revisiting the same sub-schema over and over again
                        if (!subSchemasAlreadyVisited.has(subSubSchema)) {
                            // since it is a Set, we don't have to check for duplicates explicitly ourselves
                            subSchemasToVisit.add(subSubSchema);
                        }
                    });
                }
            }
            return result;
        };
        while (subSchemasToVisit.size) {
            if (Array.from(subSchemasToVisit).some(checkSubSchema)) {
                // mark at least the originally targeted schema has having a match as well
                schemaMatchResults.set(jsonSchema, true);
                // any intermediate sub-schemas that could also be marked as matched are simply to hard to keep track off without recursion
                return true;
            }
        }
        // since none of the sub-schemas (including the originally targeted schema) was a match, we can remember that for future reference
        subSchemasAlreadyVisited.forEach((subSchema) => {
            schemaMatchResults.set(subSchema, false);
        });
        return false;
    };
    return ({ items, contextGroup, options }) => {
        if (items) {
            return Object.keys(items).filter((key) => {
                const group = createGroupFromSchema(items[key]);
                return group.someEntry(containsMatchingItems);
            });
        }
        return getIndexPermutationsForOptions(options)
            .filter(optionIndexes => contextGroup.someEntry(containsMatchingItems, createOptionTargetArrayFromIndexes(optionIndexes)));
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
