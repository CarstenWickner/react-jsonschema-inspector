import { listValues } from "./utils";

/**
 * Representation of an array of schemas (e.g. `allOf`, `anyOf`, `oneOf`), offering a number of convenience functions for extracting information.
 */
export default class JsonSchemaGroup {
    /**
     * @type {Array.<JsonSchema|JsonSchemaGroup>}
     */
    entries = [];

    /**
     * Determine whether an entry of type `JsonSchema` should be treated as a separate selectable option (i.e. like a `JsonSchemaGroup`).
     *
     * @returns {boolean} by default: always 'false', but may be overridden by sub-classes
     */
    // eslint-disable-next-line class-methods-use-this
    considerSchemasAsSeparateOptions() {
        return false;
    }

    /**
     * Indicate whether the entries of this group should be treated as if they were all defined in a single schema.
     * Otherwise, all entries shall be listed as alternative options to choose from.
     *
     * @returns {boolean} whether entries should be included transparently (otherwise as options)
     */
    shouldTreatEntriesAsOne() {
        let filteredEntries = this.entries;
        if (!this.considerSchemasAsSeparateOptions()) {
            filteredEntries = filteredEntries.filter((entry) => entry instanceof JsonSchemaGroup && !entry.shouldTreatEntriesAsOne());
        }
        return filteredEntries.length < 2;
    }

    /**
     * Adding the given Json Schema or group to this group.
     *
     * @param {JsonSchema|JsonSchemaGroup} schemaOrGroup - entry to add to this group
     * @returns {JsonSchemaGroup} this (i.e. self-reference for chaining)
     */
    with(schemaOrGroup) {
        if (schemaOrGroup instanceof JsonSchemaGroup && schemaOrGroup.entries.length === 1) {
            // unwrap a group containing only a single entry
            this.entries.push(schemaOrGroup.entries[0]);
        } else {
            this.entries.push(schemaOrGroup);
        }
        return this;
    }

    /**
     * Iterate through the parts of this schema group until the given predicate `checkEntry` returns 'true' for one.
     *
     * @param {Function} checkEntry - predicate to invoke for each schema part until 'true' is returned
     * @param {JsonSchema} checkEntry.param0 - single plain schema to check (potentially ignoring any nested `allOf`/`oneOf`/`anyOf`)
     * @param {boolean} checkEntry.param1 - whether nested `allOf`/`oneOf`/`anyOf` may be included in the check
     * @param {boolean} checkEntry.return - whether the predicate's condition was fulfilled
     * @param {?Array.<{index: number}>} optionTarget - array of mutable objects indicating which optional schema parts to consider (ignoring others)
     * @param {number} optionTarget[].index - mutable index, a value of `0` marks the optional schema part to be considered
     * @returns {boolean} whether `checkEntry` returned 'true' for any item in this group's `entries`
     */
    someEntry(checkEntry, optionTarget) {
        const considerSchemasAsOptions = this.considerSchemasAsSeparateOptions();
        const treatEntriesAsSingleSchema = this.shouldTreatEntriesAsOne();
        return this.entries.some((entry) => {
            if (!treatEntriesAsSingleSchema && (considerSchemasAsOptions || entry instanceof JsonSchemaGroup)) {
                // an optional entry should be skipped if it is not the specifically selected one
                const isSelectedEntry = !optionTarget || (optionTarget.length && optionTarget[0].index === 0);
                if (optionTarget && optionTarget.length) {
                    // eslint-disable-next-line no-param-reassign
                    optionTarget[0].index -= 1;
                }
                if (!isSelectedEntry) {
                    // ignore unselected option, i.e. indicate continued traversing/not to stop
                    return false;
                }
            }
            if (entry instanceof JsonSchemaGroup) {
                // recursively check all parts of this nested group
                return entry.someEntry(
                    checkEntry,
                    (treatEntriesAsSingleSchema || !optionTarget) ? optionTarget : optionTarget.slice(1)
                );
            }
            // entry is a JsonSchema, invoke the given checkEntry function and return its result
            return checkEntry(entry, !optionTarget || !optionTarget.length);
        });
    }

    /**
     * Extract the properties mentioned in this schema group.
     *
     * @param {Function} extractFromSchema - mapping function to invoke for extracting value(s) from a single JsonSchema
     * @param {JsonSchema} extractFromSchema.param0 - single JsonSchema to extract value(s) from
     * @param {*} extractFromSchema.return - extracted value(s) from a single JsonSchema
     * @param {?Function} mergeResults - function to be used in `Array.reduce()` to combine extracted values from multiple JsonSchemas
     * @param {*} mergeResults.param0 - combined values
     * @param {*} mergeResults.param1 - single value to add to the already combined values
     * @param {*} mergeResults.return - combined values including additional single value
     * @param {*} defaultValue - initial value of mergeResults.param0 on first execution
     * @param {?Array.<{index: number}>} optionTarget - array of mutable objects indicating which optional schema parts to consider (ignoring others)
     * @param {number} optionTarget[].index - mutable index, a value of `0` marks the optional schema part to be considered
     * @returns {*} return combined extracted values from this schema group
     */
    extractValues(extractFromSchema, mergeResults = listValues, defaultValue, optionTarget) {
        // collect schemas where we have both a boolean and a proper schema, favour the proper schema
        const values = [];
        const addToResultAndContinue = (entry) => {
            values.push(extractFromSchema(entry));
            // indicate to continue traversing all entries
            return false;
        };
        this.someEntry(addToResultAndContinue, optionTarget);
        return values.reduce(mergeResults, defaultValue);
    }

    /**
     * Create representation of this group's given options.
     *
     * @param {Array.<{groupTitle: ?string, options: ?Array.<object>, nameForIndex: ?Function}>} containedOptions - nested option representations
     * @returns {{groupTitle: ?string, options: ?Array.<object>, nameForIndex: ?Function}} representation of the given group's top level options
     */
    // eslint-disable-next-line class-methods-use-this
    createOptionsRepresentation(containedOptions) {
        let result;
        if (containedOptions.length === 0) {
            result = {};
        } else if (containedOptions.length === 1) {
            // remove unnecessary hierarchy level by simply returning the single option from the array directly
            [result] = containedOptions;
        } else {
            result = {
                options: containedOptions
            };
        }
        return result;
    }
}
