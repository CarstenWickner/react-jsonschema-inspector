import escapeRegExp from "lodash.escaperegexp";

import { isNonEmptyObject } from "./utils";

/**
 * Creating a function that accepts a single raw schema definition and applies the given filter function on itself and all contained sub-schemas.
 * Any $ref-erences are being ignored here and expected to be handled independently
 *
 * @param {Function} flatSearchFilter function that checks whether a given raw schema
 * @param {Object} flatSearchFilter.value expected input parameter is a raw schema definition
 * @param {*} flatSearchFilter.return expected output value is a truthy/falsy whether the given schema matches the filter (ignoring sub-schemas)
 * @return {Function}
 * @return {Object} return.value expected input parameter is a raw schema definition
 * @return {Boolean} return.return output value indicates whether the given schema or any of its sub-schemas matches the provided flat filter function
 */
export function createRecursiveFilterFunction(flatSearchFilter) {
    const recursiveFilterFunction = (rawSchema) => {
        if (!isNonEmptyObject(rawSchema) || rawSchema.$ref) {
            // empty schema or reference to another one is to be ignored - expectation being that references are checked separatly
            return false;
        }
        // check the schema itself whether it matches the provided flat filter function
        if (flatSearchFilter(rawSchema)) {
            return true;
        }
        // otherwise recursively check the schemas of any contained properties
        if (isNonEmptyObject(rawSchema.properties) && Object.values(rawSchema.properties).some(recursiveFilterFunction)) {
            return true;
        }
        // alternatively check the defined value schema for an array's items
        if (isNonEmptyObject(rawSchema.items)) {
            if (recursiveFilterFunction(rawSchema.items)) {
                return true;
            }
            // ignoring "additionalItems" if "items" is defined (as per convention described in JSON Schema)
        } else if (isNonEmptyObject(rawSchema.additionalItems) && recursiveFilterFunction(rawSchema.additionalItems)) {
            return true;
        }
        // if the given schema is a composite of multiple sub-schemas, check each of its parts
        if (rawSchema.allOf && rawSchema.allOf.some(recursiveFilterFunction)) {
            return true;
        }
        return false;
    };
    return recursiveFilterFunction;
}

/**
 * Build the function for determining the "filteredItems" for a given Object.<String, JsonSchema>.
 *
 * @param {Array.<String>} searchFields names of the fields in a schema to check for a (partial) match with the entered searchFilter text
 * @param {String} searchFilter entered search filter text
 * @return {Function}
 * @return {Object.<String, JsonSchema>} return.value expected input is an object representing a view column's items
 * @return {Array.<String>|undefined} return.return output is an array of "filteredItems", or "undefined" if the search feature is turned off
 */
export function createFilterFunction(searchFields, searchFilter) {
    if (searchFields && searchFields.length && searchFilter) {
        // use case-insensetive flag "i" in regular expression for value matching
        const regex = new RegExp(escapeRegExp(searchFilter), "i");
        const containsMatchingItems = createRecursiveFilterFunction(rawSchema => searchFields.some((fieldName) => {
            const fieldValue = rawSchema[fieldName];
            return fieldValue && regex.test(fieldValue);
        }));
        return columnItems => Object.entries(columnItems)
            .filter(entry => containsMatchingItems(entry[1].schema))
            .map(entry => entry[0]);
    }
    return () => undefined;
}
