import { listValues } from "./utils";

/**
 * Representation of an array of schemas (e.g. "allOf", "anyOf", "oneOf"), offering a number of convenient functions for extracting information.
 */
export default class JsonSchemaGroup {
    /**
     * Array of JsonSchema and/or JsonSchemaGroup instances.
     */
    entries = [];

    /**
     * Indicate whether the entries of this group should be treated as if they were all defined in a single schema.
     * Otherwise, all entries shall be listed as alternative options to choose from.
     *
     * @return {Boolean} return whether entries should be included transparently (otherwise as options)
     */
    shouldBeTreatedLikeAllOf() {
        return this.entries.filter(entry => entry instanceof JsonSchemaGroup && !entry.shouldBeTreatedLikeAllOf()).length < 2;
    }

    /**
     * Adding the given Json Schema or group to this group.
     *
     * @param {JsonSchema|JsonSchemaGroup} schemaOrGroup entry to add to this group
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
     * @param {Function} checkEntry predicate to invoke for each schema part until 'true' is returned
     * @param {JsonSchema} checkEntry.param0 single plain schema to check (potentially ignoring any nested `allOf`/`oneOf`/`anyOf`)
     * @param {Boolean} checkEntry.param1 whether nested `allOf`/`oneOf`/`anyOf` may be included in the check
     * @param {Boolean} checkEntry.return whether the predicate's condition was fulfilled
     * @param {?Array.<Object>} optionTarget array of mutable objects indicating which optional schema parts to consider (ignoring all others)
     * @param {Object} optionTarget[] mutable object indicating which optional schema part to consider in a single group, that is not `likeAllOf`
     * @param {Number} optionTarget[].index mutable index, a value of `0` marks the optional schema part to be considered
     */
    someEntry(checkEntry, optionTarget) {
        const treatLikeAllOf = this.shouldBeTreatedLikeAllOf();
        return this.entries.some((entry) => {
            if (!treatLikeAllOf) {
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
                    (treatLikeAllOf || !optionTarget) ? optionTarget : optionTarget.slice(1)
                );
            }
            // entry is a JsonSchema, invoke the given checkEntry function and return its result
            return checkEntry(entry, !optionTarget || !optionTarget.length);
        });
    }

    /**
     * Extract the properties mentioned in this schema group.
     *
     * @param {?Array.<Object>} optionTarget array of mutable objects containing the selected optional sub-schema's (relative) index
     * @param {Number} optionTarget[].index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     * @returns {Object.<String, JsonSchema>} collection of all properties mentioned in this schema
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
     * @param {Array.<Object>} containedOptions list of (this kind of) option representations
     * @returns {Object} return representation of the available options on this group's top level
     * @returns {?String} return.groupTitle optional title text to be displayed for this group's options
     * @returns {?Array<Object>} return.options list of option representations (may contain representation of nested options)
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
